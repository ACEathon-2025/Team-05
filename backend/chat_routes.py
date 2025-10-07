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
            
            # Call the C1 API
            logger.info(f"Sending request to C1 API with {len(user_conversations[conversation_id])} messages")
            try:
                completion = client.chat.completions.create(
                    model="c1/anthropic/claude-3.5-sonnet/v-20250709", # Use the appropriate C1 model
                    messages=user_conversations[conversation_id],
                    temperature=0.7,
                    max_tokens=800,
                    response_format={"type": "ui"}  # Request UI components in the response
                )
                
                # Get the response
                assistant_message = completion.choices[0].message.content
                logger.info(f"Received response from C1: {assistant_message[:50]}...")
                
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
                logger.error(f"C1 API error: {api_error}")
                # If there's an API error, use a fallback response strategy
                return jsonify({
                    "success": False,
                    "error": str(api_error),
                    "response": "I'm having trouble accessing my skincare knowledge database. Please try again shortly.",
                    "conversationId": conversation_id
                }), 500
                
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