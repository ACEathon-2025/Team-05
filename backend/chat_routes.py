from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import logging
import json
import traceback
from openai import OpenAI
from prompts import face_care

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize the OpenAI client with Thesys API Key for C1
client = OpenAI(
    api_key=os.environ.get("THESYS_API_KEY"),
    base_url="https://api.thesys.dev/v1/embed"
)

# In-memory store for user conversation histories
# In a production app, this would be a database
user_conversations = {}

def create_skincare_system_prompt():
    """Create a specialized system prompt for skincare assistant"""
    return {
        "role": "system", 
        "content": face_care
    }

def create_chat_route(app):
    @app.route('/api/chat', methods=['POST'])
    def chat():
        
        try:
            logger.info("Received chat request")
            
            # Get request data
            data = request.get_json()
            if not data:
                logger.error("No JSON data received")
                return jsonify({"error": "No data provided"}), 400
            
            # Extract data
            user_message = data.get('message')
            user_profile = data.get('userProfile')
            conversation_id = data.get('conversationId', 'default')
            
            logger.info(f"Processing chat message: {user_message[:30]}...")
            logger.info(f"User profile: {user_profile}")
            logger.info(f"Conversation ID: {conversation_id}")
            
            # Initialize conversation history if new
            if conversation_id not in user_conversations:
                user_conversations[conversation_id] = [create_skincare_system_prompt()]
                
                # If we have user profile info, add it to the conversation
                if user_profile:
                    profile_prompt = f"""User Profile:
                    - Age Range: {user_profile.get('age', 'Unknown')}
                    - Primary Skin Concern: {user_profile.get('primaryConcern', 'Unknown')}
                    - Current Routine Level: {user_profile.get('routineLevel', 'Unknown')}
                    - Lifestyle: {user_profile.get('lifestyle', 'Unknown')}
                    
                    Please provide personalized skincare advice based on this profile."""
                    
                    user_conversations[conversation_id].append({
                        "role": "user",
                        "content": profile_prompt
                    })
            
            # Add the new message to history
            if user_message:
                user_conversations[conversation_id].append({
                    "role": "user",
                    "content": user_message
                })
            
            # Call the API for simple text response (not C1 UI components)
            logger.info(f"Sending request to API with {len(user_conversations[conversation_id])} messages")
            try:
                # Use the LangGraph agent for simple text responses instead of C1
                from agents import graph
                from langchain_core.messages import HumanMessage
                
                # Get the latest user message for the agent
                latest_message = user_conversations[conversation_id][-1]['content']
                
                response = graph.invoke({
                    "messages": [HumanMessage(content=latest_message)]
                })
                
                if response and "final_output" in response:
                    assistant_message = response["final_output"]
                elif response and "messages" in response:
                    last_message = response["messages"][-1]
                    assistant_message = last_message.content
                else:
                    assistant_message = "I'm here to help with your skincare questions. Could you please provide more details about what you'd like to know?"
                
                # Clean up any JSON artifacts from the response
                # Unwrap triple-backtick fences like ```json { ... } ```
                if isinstance(assistant_message, str):
                    import re
                    fence_regex = re.compile(r"```(?:json)?\s*([\s\S]*?)\s*```", re.IGNORECASE)
                    m = fence_regex.search(assistant_message)
                    if m:
                        assistant_message = m.group(1).strip()

                    # If message is a JSON blob, try to extract main text fields
                    try:
                        import json
                        parsed = json.loads(assistant_message)
                        if isinstance(parsed, dict):
                            if 'message' in parsed:
                                assistant_message = parsed['message']
                            elif 'content' in parsed:
                                assistant_message = parsed['content']
                            elif 'text' in parsed:
                                assistant_message = parsed['text']
                    except Exception:
                        # not JSON or parse failed, keep original string
                        pass
                
                logger.info(f"Received response from agent: {assistant_message[:50]}...")
                
                # Add the response to history
                user_conversations[conversation_id].append({
                    "role": "assistant",
                    "content": assistant_message
                })
                
                # Return the response
                return jsonify({
                    "success": True,
                    "response": assistant_message,
                    "conversationId": conversation_id
                })
                
            except Exception as api_error:
                logger.error(f"Agent API error: {api_error}")
                # If there's an API error, use a fallback response strategy
                assistant_message = f"""
                Hello! I'm your AI skincare assistant. I'm here to help you with:

                • **Skincare routine recommendations** - Get personalized advice based on your skin type
                • **Product analysis** - Learn about ingredients and product effectiveness  
                • **Skin concerns** - Address acne, aging, dryness, sensitivity, and more
                • **Product recommendations** - Find products that work for your specific needs

                What would you like to know about skincare today?
                """
                
                # Add the fallback response to history
                user_conversations[conversation_id].append({
                    "role": "assistant",
                    "content": assistant_message
                })
                
                return jsonify({
                    "success": True,
                    "response": assistant_message,
                    "conversationId": conversation_id
                })
                
        except Exception as e:
            logger.error(f"Chat error: {e}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            return jsonify({
                "success": False,
                "error": "Internal server error during chat",
                "details": str(e)
            }), 500

    # Add a debug endpoint to view conversation history
    @app.route('/api/debug/conversations', methods=['GET'])
    def debug_conversations():
        """Debug endpoint to view all conversations in memory"""
        conversations_info = {}
        
        for conv_id, messages in user_conversations.items():
            conversations_info[conv_id] = {
                "message_count": len(messages),
                "messages": messages
            }
            
        return jsonify({
            "conversations": conversations_info
        })

    # Add endpoint to reset a conversation
    @app.route('/api/chat/reset', methods=['POST'])
    def reset_conversation():
        """Reset a specific conversation history"""
        try:
            data = request.get_json()
            conversation_id = data.get('conversationId', 'default')
            
            if conversation_id in user_conversations:
                # Keep just the system prompt
                system_prompt = next((msg for msg in user_conversations[conversation_id] if msg["role"] == "system"), 
                                    create_skincare_system_prompt())
                user_conversations[conversation_id] = [system_prompt]
                
                return jsonify({
                    "success": True,
                    "message": f"Conversation {conversation_id} has been reset"
                })
            else:
                return jsonify({
                    "success": False,
                    "message": f"Conversation {conversation_id} not found"
                }), 404
                
        except Exception as e:
            logger.error(f"Reset error: {e}")
            return jsonify({
                "success": False,
                "error": str(e)
            }), 500