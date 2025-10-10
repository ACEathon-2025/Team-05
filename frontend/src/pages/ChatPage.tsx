import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Send, 
  Bot, 
  User,
  Sparkles,
  Plus,
  LogOut,
  X,
  Pill
} from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Medicine {
  name: string;
  id: string;
}

const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>(`user-${Date.now()}`);
  const [error, setError] = useState<string | null>(null);
  const [showMedicineModal, setShowMedicineModal] = useState(false);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [currentMedicine, setCurrentMedicine] = useState('');
  const [user, setUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [conversations, setConversations] = useState<any[]>([]);

  // Get current user on component mount
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    getCurrentUser();
  }, []);

  // Sign out functionality
  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) console.error('Error signing out:', error);
      else navigate('/auth');
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Load saved conversations from backend debug endpoint for the left sidebar
  const loadConversations = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/debug/conversations');
      if (!res.ok) return;
      const data = await res.json();
      const convs = Object.entries(data.conversations || {}).map(([id, info]: any) => ({ id, ...info }));
      setConversations(convs.reverse());
    } catch (err) {
      console.warn('Could not load conversations for sidebar', err);
    }
  };

  useEffect(() => {
    loadConversations();
    // poll periodically so sidebar stays updated while using chat
    const t = setInterval(loadConversations, 10000);
    return () => clearInterval(t);
  }, []);

  const addBotMessage = (content: string) => {
    const visibleContent = cleanAssistantText(content);
    const botMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: visibleContent,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, botMessage]);
  };

  const cleanAssistantText = (text: string): string => {
    if (!text) return '';
    let cleaned = text.replace(/\\n/g, '\n');
    
    // Handle HTML entities more comprehensively
    cleaned = cleaned.replace(/&quot;/g, '"');
    cleaned = cleaned.replace(/&amp;/g, '&');
    cleaned = cleaned.replace(/&lt;/g, '<');
    cleaned = cleaned.replace(/&gt;/g, '>');
    cleaned = cleaned.replace(/&#39;/g, "'");
    cleaned = cleaned.replace(/&nbsp;/g, ' ');
    
    return cleaned.trim();
  };

  // Remove triple-backtick code fences (optionally labelled json) and return inner content
  const stripCodeFences = (s: string) => {
    if (!s || typeof s !== 'string') return s;
    // match ```json ... ``` or ``` ... ``` and return the inner content
    const fenceRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
    const m = s.match(fenceRegex);
    if (m && m[1]) return m[1].trim();
    return s.trim();
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          conversationId: conversationId,
          userId: user?.id
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        let responseText = data.response;
        
        // Unwrap code fences then handle JSON response structure
        responseText = stripCodeFences(responseText);
        if (typeof responseText === 'string') {
          try {
            const parsed = JSON.parse(responseText);
            if (parsed && typeof parsed === 'object') {
              if (parsed.message) responseText = parsed.message;
              else if (parsed.content) responseText = parsed.content;
              else if (parsed.text) responseText = parsed.text;
            }
          } catch (e) {
            // not JSON, keep as-is
          }
        } else if (responseText && (responseText as any).message) {
          responseText = (responseText as any).message;
        }
        
        addBotMessage(responseText);
      } else {
        setError(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMedicineSubmit = async () => {
    if (medicines.length === 0) {
      alert('Please add at least one medicine');
      return;
    }

    // Check localStorage for a temporary skin analysis result
    const storedAnalysisRaw = localStorage.getItem('facecare_analysis');
    if (!storedAnalysisRaw) {
      // Prompt user to complete analysis first
      addBotMessage('Please complete your skin analysis first so I can give personalized product feedback.');
      return;
    }

    let storedAnalysis: any = null;
    try {
      storedAnalysis = JSON.parse(storedAnalysisRaw);
    } catch (e) {
      // if parsing fails, send the raw text as a fallback
      storedAnalysis = storedAnalysisRaw;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/analyze-medicines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          medicines: medicines.map(m => m.name),
          userId: user?.id,
          conversationId: conversationId,
          userAnalysis: storedAnalysis
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Add user message showing what medicines were submitted
        const userMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          content: `Medicine Analysis Request: ${medicines.map(m => m.name).join(', ')}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);

        // Add bot response
        let analysisText = data.analysis;

        // Unwrap code fences then handle JSON response structure for analysis
        analysisText = stripCodeFences(analysisText);
        if (typeof analysisText === 'string') {
          try {
            const parsed = JSON.parse(analysisText);
            if (parsed && typeof parsed === 'object') {
              if (parsed.message) analysisText = parsed.message;
              else if (parsed.content) analysisText = parsed.content;
              else if (parsed.text) analysisText = parsed.text;
            }
          } catch (e) {
            // keep as-is
          }
        } else if (analysisText && (analysisText as any).message) {
          analysisText = (analysisText as any).message;
        }

        addBotMessage(analysisText);

        // Save combined analysis to localStorage for later checks
        try {
          localStorage.setItem('facecare_medicine_analysis', JSON.stringify({
            timestamp: Date.now(),
            medicines: medicines.map(m => m.name),
            analysis: analysisText
          }));
        } catch (e) {
          console.warn('Could not save medicine analysis to localStorage', e);
        }

        // Clear medicines and close modal
        setMedicines([]);
        setShowMedicineModal(false);
      } else {
        setError(data.error || 'Failed to analyze medicines');
      }
    } catch (error) {
      console.error('Error analyzing medicines:', error);
      setError('Failed to analyze medicines. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const addMedicine = () => {
    if (currentMedicine.trim()) {
      const newMedicine: Medicine = {
        id: Date.now().toString(),
        name: currentMedicine.trim()
      };
      setMedicines(prev => [...prev, newMedicine]);
      setCurrentMedicine('');
    }
  };

  const removeMedicine = (id: string) => {
    setMedicines(prev => prev.filter(m => m.id !== id));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleMedicineKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addMedicine();
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
        {/* Left Sidebar - Conversations */}
        <div className="hidden md:flex w-80 bg-gray-800 border-r border-gray-700 flex-col">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Conversations</h2>
              <button
                onClick={handleSignOut}
                className="text-red-400 hover:text-red-300 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
            <button 
              onClick={() => {
                setMessages([]);
                setConversationId(`user-${Date.now()}`);
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => {
                  setConversationId(conv.id);
                  setMessages([]);
                }}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  conversationId === conv.id 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                <div className="text-sm font-medium truncate">
                  {conv.title || `Chat ${conv.id.slice(-6)}`}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {conv.lastMessage ? conv.lastMessage.slice(0, 50) + '...' : 'No messages'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-gray-800 border-b border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="md:hidden text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-green-400" />
                  <h1 className="text-xl font-semibold">AI Skincare Assistant</h1>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="md:hidden text-red-400 hover:text-red-300 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 mt-20">
                <Bot className="w-16 h-16 mx-auto mb-4 text-green-400" />
                <h3 className="text-xl font-semibold mb-2">Welcome to AI Skincare Assistant</h3>
                <p>Ask me anything about skincare, product recommendations, or upload your current products for analysis!</p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                  <div className={`flex items-start gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === 'user' ? 'bg-green-600' : 'bg-gray-600'
                    }`}>
                      {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`rounded-lg p-3 ${
                      message.role === 'user' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-700 text-gray-100'
                    }`}>
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      <div className="text-xs opacity-70 mt-2">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {error && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-300">
                {error}
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="bg-gray-800 border-t border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowMedicineModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
                title="Upload Current Products"
              >
                <Pill className="w-5 h-5" />
              </button>
              <div className="flex-1 relative">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about skincare, products, routines..."
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 pr-12 resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={1}
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:opacity-50 text-white p-1.5 rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Medicine Upload Modal */}
        {showMedicineModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Upload Current Products</h3>
                <button
                  onClick={() => setShowMedicineModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Product Name</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={currentMedicine}
                      onChange={(e) => setCurrentMedicine(e.target.value)}
                      onKeyPress={handleMedicineKeyPress}
                      placeholder="Enter product name..."
                      className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      onClick={addMedicine}
                      disabled={!currentMedicine.trim()}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
                
                {medicines.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Added Products ({medicines.length})</label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {medicines.map((medicine) => (
                        <div
                          key={medicine.id}
                          className="flex items-center justify-between bg-gray-700 rounded-lg p-2"
                        >
                          <span className="text-sm">{medicine.name}</span>
                          <button
                            onClick={() => removeMedicine(medicine.id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowMedicineModal(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleMedicineSubmit}
                    disabled={medicines.length === 0 || isLoading}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    {isLoading ? 'Analyzing...' : 'Analyze Products'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    
  );
};

export default ChatPage;