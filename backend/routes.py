from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import binascii
import json
import logging
import os
from io import BytesIO
from PIL import Image
import traceback
import re
import html
from langchain_core.messages import HumanMessage
from agents import graph
from chat_routes import create_chat_route

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Check for required API keys
if not os.environ.get("THESYS_API_KEY"):
    logger.warning("THESYS_API_KEY not found in environment variables. Chat functionality will use fallback responses.")
    # We'll continue without failing to allow other parts of the app to work

def process_image_data(image_data):
    """
    Process base64 image data and return the proper format for LangGraph
    """
    try:
        logger.info(f"Processing image data, length: {len(image_data)}")
        logger.info(f"Image data starts with: {image_data[:50]}")
        
        
        if image_data.startswith('data:image'):
            # Extract the base64 part
            header, encoded = image_data.split(',', 1)
            image_format = header.split(';')[0].split('/')[1]  # Extract format (jpeg, png, etc.)
            logger.info(f"Detected image format: {image_format}")
        else:
            
            encoded = image_data
            image_format = 'unknown'  # Default format
            logger.info("No data URL header found, assuming pure base64")
        
        # Validate base64 and image
        try:
            # Add padding if needed for base64
            missing_padding = len(encoded) % 4
            if missing_padding:
                encoded += '=' * (4 - missing_padding)
            
            decoded = base64.b64decode(encoded, validate=True)
            logger.info(f"Successfully decoded base64, size: {len(decoded)} bytes")
            
            # Verify it's a valid image by opening with PIL
            img = Image.open(BytesIO(decoded))
            # Get image info without loading the full image
            img_format = img.format
            img_size = img.size
            logger.info(f"Image validation successful: format={img_format}, size={img_size}")
            
            # Return original data URL for LangGraph (they expect the full data URL)
            if image_data.startswith('data:image'):
                return image_data
            else:
                # If no data URL header, add one based on detected format
                detected_format = img_format.lower() if img_format else 'jpeg'
                return f"data:image/{detected_format};base64,{encoded}"
            
        except base64.binascii.Error as e:
            logger.error(f"Base64 decoding error: {e}")
            raise ValueError(f"Invalid base64 encoding: {e}")
        except Exception as e:
            logger.error(f"Image validation error: {e}")
            # Try without validation to get more info
            try:
                decoded = base64.b64decode(encoded)
                logger.info(f"Decoded without validation, size: {len(decoded)}, first 20 bytes: {decoded[:20]}")
            except:
                pass
            raise ValueError(f"Invalid image data: {e}")
            
    except ValueError:
        # Re-raise ValueError as is
        raise
    except Exception as e:
        logger.error(f"Unexpected error processing image data: {e}")
        raise ValueError(f"Failed to process image data: {e}")

@app.route('/analysis', methods=['POST'])
def analyze_skin():
    """
    Endpoint for skin analysis using LangGraph agent
    Expects JSON with 'image' field containing base64 image data
    """
    try:
        logger.info("Received analysis request")
        
        # Get JSON data from request
        data = request.get_json()
        if not data:
            logger.error("No JSON data received")
            return jsonify({"error": "No data provided"}), 400
        
        # Extract image data
        image_data = data.get('image')
        if not image_data:
            logger.error("No image data in request")
            return jsonify({"error": "No image data provided"}), 400
        
        # Process image data
        processed_image = process_image_data(image_data)
        logger.info("Image data processed successfully")
        
        # Create multimodal message for LangGraph
        multimodal_message = HumanMessage(
            content=[
                {"type": "text", "text": "Please analyze this skin condition image for acne, pimples, and blemishes"},
                {
                    "type": "image_url",
                    "image_url": {
                        "url": processed_image
                    }
                }
            ]
        )
        
        logger.info("Starting LangGraph agent processing")
        
        # Invoke the LangGraph workflow
        result = graph.invoke({"messages": [multimodal_message]})
        
        logger.info("LangGraph processing completed")
        
        # Extract the final output
        final_output = result.get("final_output", "")
        
        # Small sanitizer for assistant/agent text to remove code fences, backticks, HTML and escaped artifacts
        def clean_text(raw: str) -> str:
            if not isinstance(raw, str):
                return raw
            s = raw
            # Remove fenced code blocks ```...```
            s = re.sub(r"```[\s\S]*?```", "", s)
            # Remove inline backticks `like this`
            s = re.sub(r"`([^`]*)`", r"\1", s)
            # Strip HTML tags
            s = re.sub(r"<[^>]+>", " ", s)
            # Decode common HTML entities
            s = html.unescape(s)
            # Convert literal escape sequences to actual characters
            s = s.replace('\\n', '\n').replace('\\t', '\t').replace('\\r', '\r')
            # Remove single-line comment markers and block comments
            s = re.sub(r"//.*?$", "", s, flags=re.MULTILINE)
            s = re.sub(r"/\*[\s\S]*?\*/", "", s)
            # Remove leading list or quote markers at line starts (e.g., -, *, >, 1.)
            s = re.sub(r"^\s*([-*•>\d\.\)]+\s*)", "", s, flags=re.MULTILINE)
            # Remove repeated separators
            s = re.sub(r"[-_*]{3,}", "", s)
            # Collapse multiple blank lines
            s = re.sub(r"\n{3,}", "\n\n", s)
            # Trim whitespace
            s = s.strip()
            return s

        # Parse JSON from the output
        if final_output.startswith("```json"):
            # Extract JSON from markdown code blocks
            json_start = final_output.find("{")
            json_end = final_output.rfind("}") + 1
            json_str = final_output[json_start:json_end]
        else:
            json_str = final_output
        
        try:
            # Parse the JSON response
            analysis_result = json.loads(json_str)
            logger.info(f"Successfully parsed JSON result: {json.dumps(analysis_result, indent=2)}")
            
            # Validate required fields
            required_fields = ["healthy", "level", "issue_locations", "issue_description", 
                             "remedies_ayurvedic", "yoga_recommendations", "faster_supplements"]
            
            for field in required_fields:
                if field not in analysis_result:
                    logger.warning(f"Missing field in result: {field}")
                    # Add default value for missing fields
                    if field == "healthy":
                        analysis_result[field] = 50
                    elif field == "level":
                        analysis_result[field] = "medium"
                    elif field in ["issue_locations", "remedies_ayurvedic", "yoga_recommendations", "faster_supplements"]:
                        analysis_result[field] = []
                    elif field == "issue_description":
                        analysis_result[field] = "Analysis completed"
            
            return jsonify({
                "success": True,
                "data": analysis_result,
                "raw_output": final_output,  # Include raw output for debugging
                "cleaned_output": clean_text(final_output)
            })
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON: {e}")
            logger.error(f"Raw output was: {final_output}")
            return jsonify({
                "error": "Failed to parse analysis result",
                "raw_output": final_output,
                "cleaned_output": clean_text(final_output),
                "json_error": str(e)
            }), 500
            
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            "error": "Internal server error during analysis",
            "details": str(e)
        }), 500

@app.route('/debug-image', methods=['POST'])
def debug_image():
    """Debug endpoint to check image data format"""
    try:
        data = request.get_json()
        image_data = data.get('image', '')
        
        logger.info(f"Debug - Image data length: {len(image_data)}")
        logger.info(f"Debug - Image data starts with: {image_data[:100]}")
        logger.info(f"Debug - Image data ends with: {image_data[-50:]}")
        
        if image_data.startswith('data:image'):
            header, encoded = image_data.split(',', 1)
            logger.info(f"Debug - Header: {header}")
            logger.info(f"Debug - Encoded length: {len(encoded)}")
            logger.info(f"Debug - Encoded starts: {encoded[:50]}")
        
        return jsonify({
            "success": True,
            "length": len(image_data),
            "starts_with": image_data[:100],
            "has_data_url": image_data.startswith('data:image')
        })
        
    except Exception as e:
        logger.error(f"Debug error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Simple health check endpoint"""
    return jsonify({"status": "healthy", "message": "Skin analysis API is running"})

@app.route('/test', methods=['POST'])
def test_endpoint():
    """Test endpoint to verify the API is working"""
    try:
        data = request.get_json()
        logger.info(f"Test endpoint received: {data}")
        return jsonify({
            "success": True,
            "message": "Test endpoint working",
            "received_data": data
        })
    except Exception as e:
        logger.error(f"Test endpoint error: {e}")
        return jsonify({"error": str(e)}), 500

# Initialize chat routes
create_chat_route(app)

if __name__ == '__main__':
    logger.info("Starting Flask application...")
    app.run(debug=True, host='0.0.0.0', port=5000)