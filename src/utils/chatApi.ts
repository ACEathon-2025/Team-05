// Mock API endpoint for C1 Chat
// In a real implementation, this would connect to your actual C1 API backend

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatResponse {
  success: boolean;
  response?: string;
  error?: string;
}

// Mock responses for demonstration
const mockResponses = [
  "Based on your skin type, I recommend starting with a gentle cleanser and moisturizer routine. Would you like specific product recommendations?",
  "For acne-prone skin, ingredients like salicylic acid and niacinamide can be very effective. Have you tried any acne treatments before?",
  "Sun protection is crucial for healthy skin. I recommend using a broad-spectrum SPF 30+ sunscreen daily. What's your current sun protection routine?",
  "A consistent skincare routine is key to seeing results. Start simple with cleanse, treat, moisturize, and protect. Would you like me to create a personalized routine for you?",
  "Natural ingredients like honey, aloe vera, and green tea can be great for sensitive skin. Are you looking for DIY skincare options?"
];

export const sendChatMessage = async (message: string, history: ChatMessage[] = []): Promise<ChatResponse> => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // For demo purposes, return a random mock response
    // In production, this would send the message and history to your C1 API
    const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    
    // Simulate occasional errors for testing error handling
    if (Math.random() < 0.1) {
      throw new Error('Network error');
    }
    
    return {
      success: true,
      response: randomResponse
    };
  } catch (error) {
    console.error('Chat API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Helper function to format chat history for API
export const formatChatHistory = (messages: ChatMessage[]): string => {
  return messages
    .map(msg => `${msg.role}: ${msg.content}`)
    .join('\n');
};