from langchain.chat_models import init_chat_model
from langgraph.graph import StateGraph, END, MessagesState
from langgraph.prebuilt import ToolNode, tools_condition
from langchain.agents import Tool
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from typing import TypedDict, Annotated, Sequence
import operator
from prompts import full_body_acne_extraction, Ayurvedic_Acne_Pimple_Treatment
from dotenv import load_dotenv
import os

# ---------------------------
# 0. Load env + auth
# ---------------------------
load_dotenv()
os.environ["GOOGLE_API_KEY"] = os.getenv("GOOGLE_API_KEY")
MCP_API_KEY = os.getenv("PARALLEL_API_KEY")   # <-- set this in your .env

# ---------------------------
# 1. Setup MCP Client + Search Tool
# ---------------------------
from langchain_mcp_adapters.client import MultiServerMCPClient

# Connect to the MCP search server with authentication
client = MultiServerMCPClient({
    "search": {
        "url": "https://search-mcp.parallel.ai/mcp",
        "transport": "streamable_http",
        "headers": {
            "Authorization": f"Bearer {MCP_API_KEY}"
        }
    }
})

# Fetch available tools from MCP
import asyncio
tools = asyncio.run(client.get_tools())   # ensure MCP is async-safe

# ---------------------------
# 2. Define state
# ---------------------------
class AgentState(TypedDict, total=False):
    """State schema that supports multimodal inputs and tool interactions"""
    messages: Annotated[Sequence[HumanMessage | AIMessage | SystemMessage], operator.add]
    agent_1_output: str
    agent_2_output: str
    final_output: str
    needs_fixing: bool
    json_error: str
    original_content: str
    fix_failed: bool

# ---------------------------
# 3. Initialize models
# ---------------------------
llm = init_chat_model("google_genai:gemini-2.5-flash", temperature=0.6)
llm_with_tools = llm.bind_tools(tools)

# ---------------------------
# 4. Define agent nodes
# ---------------------------
def agent_1(state: AgentState) -> dict:
    messages = state.get("messages", [])
    if not messages:
        return {
            "messages": [AIMessage(content="No input provided", name="Agent_1")],
            "agent_1_output": "No input provided"
        }
    
    last_message = messages[-1]
    if isinstance(last_message, dict):
        message_content = last_message.get("content", "")
    else:
        message_content = last_message.content
    
    if isinstance(message_content, list):
        prompt_content = [{"type": "text", "text": full_body_acne_extraction}]
        for part in message_content:
            if isinstance(part, dict):
                if part.get("type") == "image_url":
                    prompt_content.append(part)
                elif part.get("type") == "text":
                    prompt_content[0]["text"] += f"\n\nUser input: {part['text']}"
        agent_message = HumanMessage(content=prompt_content)
    else:
        prompt_text = full_body_acne_extraction.replace("{{input}}", str(message_content))
        agent_message = HumanMessage(content=prompt_text)
    
    response = llm.invoke([agent_message])
    output = response.content if hasattr(response, 'content') else str(response)
    
    return {
        "messages": [AIMessage(content=output, name="Agent_1")],
        "agent_1_output": output
    }

def agent_2(state: AgentState) -> dict:
    agent_1_result = state.get("agent_1_output", "")
    prompt = Ayurvedic_Acne_Pimple_Treatment.replace("{{input}}", agent_1_result)
    messages = list(state["messages"])
    messages.append(HumanMessage(content=prompt, name="Agent_2_Prompt"))
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}

def json_validator_agent(state: AgentState) -> dict:
    """
    Validates and fixes JSON output from agent_2.
    If JSON is invalid, uses LLM to intelligently fix it.
    """
    import json
    import re
    
    messages = state.get("messages", [])
    if not messages:
        return {"messages": [], "needs_fixing": False}
    
    # Find the last non-tool AI message from agent_2
    content = ""
    for msg in reversed(messages):
        if isinstance(msg, dict):
            if msg.get("type") == "ai" and not msg.get("tool_calls", []):
                content = msg.get("content", "")
                break
        elif isinstance(msg, AIMessage) and not msg.tool_calls:
            content = msg.content
            break
    
    if not content:
        last_msg = messages[-1]
        content = last_msg.get("content", "") if isinstance(last_msg, dict) else getattr(last_msg, "content", str(last_msg))
    
    # Try to extract JSON from content
    json_match = re.search(r'\{.*\}', content, re.DOTALL)
    if json_match:
        json_str = json_match.group(0)
    else:
        json_str = content
    
    # Try to parse the JSON
    try:
        parsed = json.loads(json_str)
        # JSON is valid, format it nicely with markdown code blocks
        formatted_json = json.dumps(parsed, indent=2, ensure_ascii=False)
        wrapped_json = f"```json\n{formatted_json}\n```"
        return {
            "messages": [AIMessage(content=wrapped_json, name="JSON_Validator")],
            "needs_fixing": False
        }
    except json.JSONDecodeError as e:
        # JSON is invalid, mark for fixing
        error_info = f"JSON Parse Error at position {e.pos}: {e.msg}"
        return {
            "messages": [AIMessage(content=content, name="JSON_Validator_Check")],
            "needs_fixing": True,
            "json_error": error_info,
            "original_content": content
        }


def json_fixer_agent(state: AgentState) -> dict:
    """
    Uses LLM to intelligently fix invalid JSON output.
    """
    import json
    
    original_content = state.get("original_content", "")
    json_error = state.get("json_error", "Unknown error")
    
    fix_prompt = f"""You are a JSON repair specialist. The following content should be valid JSON but contains errors.

ERROR: {json_error}

ORIGINAL CONTENT:
{original_content}

Your task:
1. Analyze the content and identify all JSON syntax errors
2. Fix all issues including:
   - Missing or extra commas
   - Unescaped quotes or special characters
   - Unclosed brackets or braces
   - Invalid escape sequences
   - Trailing commas
   - Single quotes instead of double quotes
   - Any other JSON syntax violations
3. Preserve ALL the original data and structure
4. Return ONLY the corrected, valid JSON (no explanations, no markdown, no extra text)

IMPORTANT: Your response must be ONLY valid JSON that can be parsed directly."""
    
    response = llm.invoke([HumanMessage(content=fix_prompt)])
    fixed_content = response.content if hasattr(response, 'content') else str(response)
    
    # Verify the fix worked
    import re
    json_match = re.search(r'\{.*\}', fixed_content, re.DOTALL)
    if json_match:
        json_str = json_match.group(0)
    else:
        json_str = fixed_content
    
    try:
        parsed = json.loads(json_str)
        formatted_json = json.dumps(parsed, indent=2, ensure_ascii=False)
        wrapped_json = f"```json\n{formatted_json}\n```"
        return {
            "messages": [AIMessage(content=wrapped_json, name="JSON_Fixer")],
            "needs_fixing": False
        }
    except json.JSONDecodeError:
        # If still invalid, return with error flag
        return {
            "messages": [AIMessage(content=fixed_content, name="JSON_Fixer_Failed")],
            "needs_fixing": True,
            "fix_failed": True
        }


def finalize(state: AgentState) -> dict:
    """
    Returns the final validated JSON output.
    """
    import json
    
    messages = state.get("messages", [])
    if not messages:
        return {"agent_2_output": "", "final_output": ""}
    
    # Get the last message from json_validator or json_fixer
    for msg in reversed(messages):
        if isinstance(msg, AIMessage) and msg.name in ["JSON_Validator", "JSON_Fixer"]:
            output = msg.content
            return {"agent_2_output": output, "final_output": output}
        elif isinstance(msg, dict) and msg.get("name") in ["JSON_Validator", "JSON_Fixer"]:
            output = msg.get("content", "")
            return {"agent_2_output": output, "final_output": output}
    
    # Fallback: if fix failed, return error JSON wrapped in code blocks
    if state.get("fix_failed"):
        error_response = {
            "error": "Failed to fix JSON after multiple attempts",
            "original_content_preview": state.get("original_content", "")[:500]
        }
        error_json = json.dumps(error_response, indent=2)
        output = f"```json\n{error_json}\n```"
        return {"agent_2_output": output, "final_output": output}
    
    # Ultimate fallback
    last_msg = messages[-1]
    content = last_msg.get("content", "") if isinstance(last_msg, dict) else getattr(last_msg, "content", str(last_msg))
    return {"agent_2_output": content, "final_output": content}

# ---------------------------
# 5. Build workflow graph
# ---------------------------
def should_fix_json(state: AgentState) -> str:
    """Route to json_fixer if JSON needs fixing, otherwise to finalize."""
    if state.get("needs_fixing", False) and not state.get("fix_failed", False):
        return "json_fixer"
    return "finalize"


workflow = StateGraph(AgentState)
workflow.add_node("agent_1", agent_1)
workflow.add_node("agent_2", agent_2)
workflow.add_node("tools", ToolNode(tools))   # <-- MCP search tools here
workflow.add_node("json_validator", json_validator_agent)
workflow.add_node("json_fixer", json_fixer_agent)
workflow.add_node("finalize", finalize)

workflow.set_entry_point("agent_1")
workflow.add_edge("agent_1", "agent_2")
workflow.add_conditional_edges(
    "agent_2",
    tools_condition,
    {
        "tools": "tools",
        "__end__": "json_validator"
    }
)
workflow.add_edge("tools", "agent_2")
workflow.add_conditional_edges(
    "json_validator",
    should_fix_json,
    {
        "json_fixer": "json_fixer",
        "finalize": "finalize"
    }
)
workflow.add_edge("json_fixer", "json_validator")  # Re-validate after fixing
workflow.add_edge("finalize", END)

graph = workflow.compile()


# ---------------------------
# 6. Example usage
# ---------------------------
# if __name__ == "__main__":
#     # Example 1: Text only
#     print("=== Example 1: Text Input ===")
#     result = graph.invoke({
#         "messages": [HumanMessage(content="I have acne on my forehead and cheeks")]
#     })
#     print("Final Output:", result.get("final_output"))
    
#     print("\n=== Example 2: Image + Text Input ===")
#     # For multimodal input with images
#     multimodal_message = HumanMessage(
#         content=[
#             {"type": "text", "text": "Please analyze this skin condition"},
#             {
#                 "type": "image_url",
#                 "image_url": {
#                     "url": "data:image/jpeg;base64,YOUR_BASE64_IMAGE_HERE"
#                     # Or use: "url": "https://example.com/image.jpg"
#                 }
#             }
#         ]
#     )
    
    # Uncomment to run with actual image
    # result = graph.invoke({"messages": [multimodal_message]})
    # print("Final Output:", result.get("final_output"))