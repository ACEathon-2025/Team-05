import requests
import base64
import json
import re

API_URL = "http://localhost:2024/runs/stream"
IMAGE_PATH = r"D:\Downloads\ChatGPT Image Oct 3, 2025, 02_41_47 PM.png"

with open(IMAGE_PATH, "rb") as f:
    image_base64 = base64.b64encode(f.read()).decode('utf-8')

payload = {
    "assistant_id": "facetohealth",
    "input": {
        "messages": [{
            "role": "human",
            "content": [
                {"type": "text", "text": "Analyze this skin condition"},
                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{image_base64}"}}
            ]
        }]
    },
    "stream_mode": "values"
}

response = requests.post(API_URL, json=payload, stream=True)

# Process each line
last_data = None
for line in response.iter_lines():
    if line:
        line_str = line.decode('utf-8')
        # Skip empty lines and event lines
        if line_str.startswith('data: '):
            try:
                data = json.loads(line_str[6:])  # Remove 'data: ' prefix
                last_data = data
            except json.JSONDecodeError:
                continue

def strip_code_fences(text: str) -> str:
    """Remove ```json ... ``` or ``` ... ``` fences and return inner content.

    Keeps original text if no fences are detected. Trims one leading/trailing
    newline inside the fence for clean output.
    """
    if not isinstance(text, str):
        return text
    # First try ```json ... ``` (case-insensitive)
    m = re.match(r"^```\s*json\s*\n?(.*?)\n?```\s*$", text, flags=re.IGNORECASE | re.DOTALL)
    if m:
        return m.group(1)
    # Fallback: any fenced block
    m = re.match(r"^```\s*\n?(.*?)\n?```\s*$", text, flags=re.DOTALL)
    if m:
        return m.group(1)
    return text


def extract_final_text(data: dict) -> str | None:
    """Extract the final text content from the last message if present.

    Handles string content and simple multimodal arrays; returns the text part
    if available.
    """
    try:
        messages = data.get('messages', [])
        if not messages:
            return None
        content = messages[-1].get('content') if isinstance(messages[-1], dict) else messages[-1].content
        if isinstance(content, str):
            return content
        if isinstance(content, list):
            parts = []
            for p in content:
                if isinstance(p, dict) and p.get('type') == 'text' and isinstance(p.get('text'), str):
                    parts.append(p['text'])
            return "\n".join(parts) if parts else None
    except Exception:
        return None
    return None


# Print the final result (without ```json fences if present)
if last_data:
    text = extract_final_text(last_data)
    if text is not None:
        print(strip_code_fences(text))
    else:
        print(json.dumps(last_data, indent=2))