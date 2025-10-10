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

# Simple in-memory cache to deduplicate identical analysis requests for a short TTL
from hashlib import sha256
import time
import threading

# cache: map image_hash -> (timestamp_seconds, response_json)
_analysis_cache = {}
_ANALYSIS_CACHE_TTL = 60  # seconds

# track images currently being processed so concurrent requests can wait for the first
_analysis_in_progress = set()
_analysis_lock = threading.Lock()

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
        # Compute a stable hash for deduplication (use the processed data URL)
        image_hash = sha256(processed_image.encode('utf-8')).hexdigest()

        # Use a lock to make cache and in-progress checks atomic to avoid race conditions
        now = time.time()
        with _analysis_lock:
            cached = _analysis_cache.get(image_hash)
            if cached and now - cached[0] < _ANALYSIS_CACHE_TTL:
                logger.info("Found cached analysis result for same image - returning cached response")
                return jsonify(cached[1])

            if image_hash in _analysis_in_progress:
                waiting = True
            else:
                # Mark as in-progress for this thread/process
                _analysis_in_progress.add(image_hash)
                waiting = False

        # If another request is already processing this image, wait until it completes and return the cached result
        if waiting:
            wait_start = time.time()
            while True:
                with _analysis_lock:
                    cached = _analysis_cache.get(image_hash)
                    if cached and time.time() - cached[0] < _ANALYSIS_CACHE_TTL:
                        logger.info("Concurrent analysis finished; returning cached response")
                        return jsonify(cached[1])
                    still_processing = image_hash in _analysis_in_progress
                # wait up to 12 seconds for the other process to finish
                if not still_processing:
                    logger.info("Other processing finished but no cached result found; proceeding to analyze")
                    break
                if time.time() - wait_start > 12:
                    logger.warning("Waited for concurrent analysis but timed out; proceeding to analyze")
                    break
                time.sleep(0.25)

        # At this point, this worker is responsible for invoking the graph. Ensure in-progress is set.
        with _analysis_lock:
            _analysis_in_progress.add(image_hash)

        try:
            result = graph.invoke({"messages": [multimodal_message]})
            logger.info("LangGraph processing completed")
        finally:
            # On completion, remove in-progress and cache result under lock
            try:
                now = time.time()
                # Attempt to extract final_output quickly; if parsing later fails, cached payload will be updated below
                final_output = None
                try:
                    final_output = result.get("final_output", "")
                except Exception:
                    final_output = None
                # Prepare a minimal cached payload placeholder while we process the output
                with _analysis_lock:
                    _analysis_in_progress.discard(image_hash)
                    # Do not overwrite an existing recent cache
                    existing = _analysis_cache.get(image_hash)
                    if not existing:
                        _analysis_cache[image_hash] = (now, {"success": True, "data": None, "raw_output": final_output})
            except Exception:
                # ensure we always remove the in-progress flag
                try:
                    with _analysis_lock:
                        _analysis_in_progress.discard(image_hash)
                except Exception:
                    pass
        
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
            
            response_payload = {
                "success": True,
                "data": analysis_result,
                "raw_output": final_output,  # Include raw output for debugging
                "cleaned_output": clean_text(final_output)
            }
            # Cache the successful parse result for this image
            try:
                _analysis_cache[image_hash] = (now, response_payload)
            except Exception:
                pass
            return jsonify(response_payload)
            
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

@app.route('/api/analyze-medicines', methods=['POST'])
def analyze_medicines():
    """Analyze user's current skincare products/medicines"""
    try:
        data = request.get_json()
        medicines = data.get('medicines', [])
        user_id = data.get('userId')
        conversation_id = data.get('conversationId')
        
        logger.info(f"Analyzing medicines: {medicines} for user: {user_id}")
        
        if not medicines:
            return jsonify({"error": "No medicines provided"}), 400
        
        # Expect the frontend to pass previously stored user analysis in the request
        user_analysis = data.get('userAnalysis')

        if not user_analysis:
            # If user analysis is not provided, instruct frontend/user to run analysis first
            return jsonify({
                "success": False,
                "error": "missing_user_analysis",
                "message": "Please complete your skin analysis first before uploading your current products. The analysis helps provide personalized recommendations about your products."
            }), 400
        
        # Create the medicine analysis query and include user's skin analysis
        medicine_list = ", ".join(medicines)
        user_analysis_text = json.dumps(user_analysis) if not isinstance(user_analysis, str) else user_analysis
        query = f"""
        The user provided the following skin analysis (from their recent skin assessment):
        {user_analysis_text}

        The user also provided these skincare products: {medicine_list}

        Using the user's skin analysis, analyze each product and answer for each product:
        1. Main ingredients and their benefits
        2. Skin type suitability (based on the user's analysis)
        3. Potential side effects or concerns for this user's skin
        4. How it fits into the user's skincare routine
        5. Any interactions between products if multiple are listed

        Provide a clear recommendation for this user specifically: should they continue, stop, or modify use and why.

        Format the response as plain text (no UI components) and keep it readable.
        """

        # Use the specialized medicine analysis agent
        try:
            from agents import medicine_graph
            response = medicine_graph.invoke({
                "messages": [HumanMessage(content=query)]
            })
            
            if response and "final_output" in response:
                analysis_result = response["final_output"]
            elif response and "messages" in response:
                last_message = response["messages"][-1]
                analysis_result = last_message.content
            else:
                analysis_result = "Unable to analyze the products at this time. Please try again later."
            
            # Clean up any JSON artifacts from the response
                if isinstance(analysis_result, str):
                    # Remove any JSON wrapping if present
                    if analysis_result.strip().startswith('{') and analysis_result.strip().endswith('}'):
                        try:
                            # use the module imported at the top-level (avoids creating a local name)
                            parsed = json.loads(analysis_result)
                            if isinstance(parsed, dict):
                                if 'message' in parsed:
                                    analysis_result = parsed['message']
                                elif 'content' in parsed:
                                    analysis_result = parsed['content']
                                elif 'text' in parsed:
                                    analysis_result = parsed['text']
                        except Exception:
                            # If parsing fails, keep original text
                            pass
                
        except Exception as agent_error:
            logger.error(f"Agent error during medicine analysis: {agent_error}")
            # Fallback response
            analysis_result = f"""
            Thank you for sharing your current products: {medicine_list}

            Here's a general analysis of your skincare routine:

            **Product Analysis:**
            For each product you've listed, I recommend:
            - Check the ingredient list for any known allergens
            - Introduce new products gradually to test skin tolerance
            - Maintain consistency in your routine for best results

            **General Recommendations:**
            - Always patch test new products
            - Use sunscreen daily as the final step in your morning routine
            - Consider the order of application: thinnest to thickest consistency

            For personalized advice based on your specific skin analysis, please ensure you've completed your skin assessment first.
            """
        
        return jsonify({
            "success": True,
            "analysis": analysis_result
        })
        
    except Exception as e:
        logger.error(f"Medicine analysis error: {e}")
        logger.error(traceback.format_exc())
        return jsonify({"error": "Failed to analyze medicines"}), 500

# Initialize chat routes
create_chat_route(app)

if __name__ == '__main__':
    logger.info("Starting Flask application...")
    app.run(debug=True, host='0.0.0.0', port=5000)