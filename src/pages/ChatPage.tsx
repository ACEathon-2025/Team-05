import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Send, 
  Bot, 
  User,
  Sparkles,
  
  ChevronRight
} from 'lucide-react';
import { C1Component, ThemeProvider } from "@thesysai/genui-sdk";
import "@crayonai/react-ui/styles/index.css";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isC1Response?: boolean;
  ask?: any;
}

interface QuestionData {
  question: string;
  options?: string[];
  answer?: string;
}

const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<'intro' | 'questions' | 'chat'>('intro');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // showChatbox removed; chat view controlled via currentStep
  const [answers, setAnswers] = useState<string[]>([]);
  const [conversationId, setConversationId] = useState<string>(`user-${Date.now()}`);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [conversations, setConversations] = useState<any[]>([]);

  const questions: QuestionData[] = [
    {
      // Simpler first question as requested
      question: "What's your current age?",
      options: ["13-18", "19-25", "26-35", "36-45", "46-55", "55+"]
    },
    {
      question: "What's your primary skin concern?",
      options: ["Acne", "Aging", "Pigmentation", "Sensitivity", "Dryness", "Oiliness"]
    },
    {
      question: "How would you describe your current skincare routine?",
      options: ["None", "Basic (Cleanser + Moisturizer)", "Moderate (3-5 products)", "Extensive (6+ products)"]
    },
    {
      question: "What's your lifestyle pattern?",
      options: ["Sedentary", "Moderately Active", "Very Active", "Irregular Schedule"]
    }
  ];

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

  // intro flow replaced by ChatGPT-like interface; keep entry points via New Chat or sidebar

  const handleAnswerSelect = (answer: string) => {
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: answer,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    if (currentQuestionIndex < questions.length - 1) {
      // Move to next question
      setTimeout(() => {
        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(prev => prev + 1);
        const askObj = {
          id: `q-${nextIndex}`,
          question: questions[nextIndex].question,
          options: questions[nextIndex].options
        };
        addBotMessage(questions[nextIndex].question, false, askObj);
      }, 1000);
    } else {
      // All questions answered, send to API
      setTimeout(() => {
        handleSendAnswersToAPI(newAnswers);
      }, 1000);
    }
  };

  const addBotMessage = (content: string, isC1Response: boolean = false, ask?: any) => {
    const visibleContent = !isC1Response ? cleanAssistantText(content) : content;
    const botMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: visibleContent,
      timestamp: new Date(),
      isC1Response,
      ask
    };
    setMessages(prev => [...prev, botMessage]);
  };

  const isLikelyC1 = (text: any) => {
    if (!text) return false;
    if (typeof text !== 'string') return false;
    const t = text.trim();
    return t.startsWith('{') || t.startsWith('<') || t.includes('"component"') || t.includes('"ui"');
  }

  // Decode HTML entities in a browser-safe way
  const decodeHtml = (input: string) => {
    try {
      const txt = document.createElement('textarea');
      txt.innerHTML = input;
      return txt.value;
    } catch (e) {
      // fallback simple replace for common entities
      return input.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    }
  }

  // Normalize C1 responses that may be wrapped in HTML and escaped entities
  const normalizeC1Response = (raw: string) => {
    if (!raw || typeof raw !== 'string') return raw;
    let s = raw.trim();
    // If wrapped in <content>..</content> or similar, strip tags first
    s = s.replace(/^<[^>]+>/, '').replace(/<[^>]+>$/, '');
    // Decode HTML entities
    s = decodeHtml(s);
    // Extract JSON blob between first { and last }
    const start = s.indexOf('{');
    const end = s.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      return s.slice(start, end + 1);
    }
    return s;
  }

  const handleSendAnswersToAPI = async (allAnswers: string[]) => {
    setIsLoading(true);
    
    try {
      // Real API call to the backend chat endpoint
      console.log('📤 Sending user profile to chat API');
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userProfile: {
            age: allAnswers[0],
            primaryConcern: allAnswers[1],
            routineLevel: allAnswers[2],
            lifestyle: allAnswers[3]
          },
          message: "Based on my profile, please provide personalized skincare recommendations.",
          conversationId: conversationId
        })
      });

      const data = await response.json();
      console.log('📥 Received API response:', data);

      if (response.ok && data.success) {
        // Update conversation ID if provided
        if (data.conversationId) {
          setConversationId(data.conversationId);
        }
        
        // Add bot message with response - check if it's a C1 response
        let response = data.response || "Thank you for completing the assessment! I can now provide personalized skincare recommendations. What would you like to know?";
        // Normalize any HTML-escaped C1 responses
        if (isLikelyC1(response) || response.includes('&quot;') || response.includes('<')) {
          const normalized = normalizeC1Response(response);
          response = normalized;
        }
        const isC1Response = isLikelyC1(response);
        addBotMessage(response, isC1Response);
      } else {
        setError(data.error || 'Failed to get a response from the AI assistant');
        throw new Error(data.error || 'API request failed');
      }
    } catch (error) {
      console.error('❌ API Error:', error);
      // Fallback response
      const analysisMessage = `Based on your responses, I've analyzed your profile:
      
Age Range: ${allAnswers[0]}
Primary Concern: ${allAnswers[1]}
Routine Level: ${allAnswers[2]}
Lifestyle: ${allAnswers[3]}

I can now provide personalized skincare recommendations. What specific advice would you like?`;
      
      addBotMessage(analysisMessage);
    } finally {
      setIsLoading(false);
      setCurrentStep('chat');
      // refresh sidebar conversations after creating new conv
      loadConversations();
    }
  };

  // Clean assistant text from markdown/code artifacts for display
  const cleanAssistantText = (raw: string) => {
    if (!raw) return '';
    let s = raw;
    // Remove code fences and inline backticks
    s = s.replace(/```[\s\S]*?```/g, '');
    s = s.replace(/`([^`]+)`/g, '$1');
    // Remove common markdown artifacts like *, //, -> when isolated
    s = s.replace(/\*\*/g, '');
    s = s.replace(/\* /g, '');
    s = s.replace(/\n\s*\n/g, '\n\n');
    s = s.replace(/\/\//g, '');
    // Trim whitespace
    s = s.trim();
    return s;
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    // Save the message locally
    const messageToSend = inputMessage.trim();
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      console.log(`📤 Sending message to chat API (conversationId: ${conversationId})`);
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageToSend,
          conversationId: conversationId,
          context: { answers }
        })
      });

      const data = await response.json();
      console.log('📥 Received API response:', data);

      if (response.ok && data.success) {
        // Update conversation ID if provided
        if (data.conversationId) {
          setConversationId(data.conversationId);
        }
        
        // Add bot message - handle as C1 response if it's in JSON format
        let responseText = data.response;
        if (isLikelyC1(responseText) || (responseText && (responseText.includes('&quot;') || responseText.includes('<')))) {
          responseText = normalizeC1Response(responseText);
        }
        const isC1Response = isLikelyC1(responseText);
        addBotMessage(responseText, isC1Response);
      } else {
        setError(data.error || 'Failed to get a response from the AI assistant');
        throw new Error(data.error || 'API request failed');
      }
    } catch (error) {
      console.error('❌ Chat Error:', error);
      // Show the error in UI
      setError(error instanceof Error ? error.message : 'Failed to communicate with the skincare assistant');
      
      // Fallback responses
      const responses = [
        "Based on your profile, I recommend starting with a gentle cleanser and a moisturizer with SPF during the day.",
        "For your specific concerns, ingredients like niacinamide and hyaluronic acid would be beneficial.",
        "I suggest introducing products gradually to avoid skin irritation. Start with one new product every 2 weeks.",
        "Consistency is key in skincare. Stick to your routine for at least 6-8 weeks to see results."
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      addBotMessage(randomResponse);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Function to reset the conversation with the backend
  const resetConversation = async () => {
    try {
      console.log(`🔄 Resetting conversation (ID: ${conversationId})`);
      const response = await fetch('http://localhost:5000/api/chat/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: conversationId
        })
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        console.log('✅ Conversation reset successful');
      } else {
        console.error('❌ Failed to reset conversation:', data.error);
      }
    } catch (error) {
      console.error('❌ Error resetting conversation:', error);
    }
  };

  const openNewConversation = () => {
    const newId = `user-${Date.now()}`;
    setConversationId(newId);
    // Start the 4-question profile flow when a new chat is opened
    setMessages([]);
    setAnswers([]);
    setCurrentQuestionIndex(0);
    setCurrentStep('questions');
    // create a fresh conversation on the backend by calling reset with the new id
    fetch('http://localhost:5000/api/chat/reset', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: newId })
    }).catch(() => {});
    // refresh sidebar
    setTimeout(loadConversations, 500);
  };

  const selectConversation = async (id: string) => {
    setConversationId(id);
    // Load conversation messages from debug endpoint
    try {
      const res = await fetch('http://localhost:5000/api/debug/conversations');
      if (!res.ok) return;
      const data = await res.json();
      const conv = data.conversations && data.conversations[id];
      if (conv && conv.messages) {
        const normalized = conv.messages.map((m: any) => ({
          id: `${m.role}-${Math.random().toString(36).slice(2,9)}`,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
          isC1Response: !!(m.content && (typeof m.content === 'string') && (m.content.trim().startsWith('{') || m.content.trim().startsWith('<')))
        }));
        setMessages(normalized);
        setCurrentStep('chat');
      }
    } catch (err) {
      console.warn('Failed to load conversation messages', err);
    }
  };

  useEffect(() => {
    if (currentStep === 'questions' && messages.length === 0) {
      // Reset the conversation with the backend when starting a new chat session
      resetConversation().then(() => {
        // Start with first question
        setTimeout(() => {
          addBotMessage("Hello! I'm your FaceCare AI assistant. I'll ask you a few questions to personalize your skincare journey.");
          setTimeout(() => {
            const askObj = {
              id: `q-0`,
              question: questions[0].question,
              options: questions[0].options
            };
            addBotMessage(questions[0].question, false, askObj);
          }, 1500);
        }, 500);
      });
    }
  }, [currentStep]);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')"
        }}
      ></div>
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/80 to-gray-900/90"></div>
      
      {/* Header */}
      <header className="relative border-b border-gray-800/50 sticky top-0 z-50 bg-black/60 backdrop-blur-md">
        <div className="mx-2 px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors text-gray-400 hover:text-white"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-black" />
                </div>
                <h1 className="text-xl font-bold">FaceCare AI</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Bot className="w-4 h-4" />
              <span>AI Assistant</span>
            </div>
          </div>
        </div>
      </header>

      <div className="relative mx-2 px-4 py-8 min-h-[calc(100vh-4rem)]">
        <div className="flex h-[calc(100vh-4rem)] gap-6">
          {/* Sidebar - conversations */}
          <aside className="w-80 bg-gray-900/70 border border-gray-800 rounded-2xl p-4 overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold">Conversations</h4>
              <button onClick={openNewConversation} className="text-xs bg-white text-black px-3 py-1 rounded">New Chat</button>
            </div>
            <div className="space-y-2">
              {conversations.length === 0 && (
                <div className="text-xs text-gray-400">No recent conversations</div>
              )}
              {conversations.map((conv: any) => (
                <button key={conv.id} onClick={() => selectConversation(conv.id)} className="w-full text-left p-2 rounded-lg hover:bg-gray-800/60 transition-colors flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{conv.id}</div>
                    <div className="text-xs text-gray-400">{conv.message_count} messages</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              ))}
            </div>
          </aside>

          {/* Main chat area (fills remaining) */}
          <main className="flex-1 bg-transparent">
            <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-800/50 overflow-hidden h-full flex flex-col">
              {/* Messages area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
                    style={{ animationDelay: `${index * 0.03}s` }}
                  >
                    <div className={`flex items-start space-x-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.role === 'user' 
                          ? 'bg-white' 
                          : 'bg-gray-700'
                      }`}>
                        {message.role === 'user' ? (
                          <User className="w-4 h-4 text-black" />
                        ) : (
                          <Bot className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div className={`rounded-2xl p-4 ${
                        message.role === 'user'
                          ? 'bg-white text-black'
                          : 'bg-gray-800 text-white border border-gray-700'
                      }`}>
                        {message.role === 'assistant' && message.isC1Response ? (
                          <div className="c1-response-wrapper">
                            <ThemeProvider>
                              {(() => {
                                try {
                                  return <C1Component 
                                    c1Response={message.content} 
                                    isStreaming={false}
                                    onAction={(action) => {
                                      console.log('C1 component action:', action);
                                      const actionMessage = `User action: ${action.llmFriendlyMessage}`;
                                      setInputMessage(actionMessage);
                                      setTimeout(() => handleSendMessage(), 100);
                                    }}
                                  />;
                                } catch (error) {
                                  console.error('Error rendering C1 component:', error);
                                  return (
                                    <div className="p-2 border border-red-500 bg-red-500/20 rounded">
                                      <p className="text-red-400 text-xs">Failed to render interactive content</p>
                                      <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
                                    </div>
                                  );
                                }
                              })()}
                            </ThemeProvider>
                          </div>
                        ) : (
                          <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
                        )}
                        <p className={`text-xs mt-2 ${
                          message.role === 'user' ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {error && (
                  <div className="mx-auto my-4 p-3 border border-red-500 bg-red-500/20 rounded-lg max-w-[80%]">
                    <p className="text-red-400 text-sm">
                      <span className="font-bold">Error:</span> {error}
                    </p>
                  </div>
                )}

                {isLoading && (
                  <div className="flex justify-start animate-slide-up">
                    <div className="flex items-start space-x-3 max-w-[80%]">
                      <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                          <span className="text-sm text-gray-400">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div className="border-t border-gray-800 p-6 flex-shrink-0">
                {currentStep === 'questions' && currentQuestionIndex < questions.length && questions[currentQuestionIndex].options ? (
                  <div className="space-y-3">
                    <p className="text-gray-400 text-sm mb-4">Choose an option:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {questions[currentQuestionIndex].options?.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => handleAnswerSelect(option)}
                          className="p-3 text-left bg-gray-800/60 backdrop-blur-sm hover:bg-white hover:text-black rounded-xl transition-all duration-200 border border-gray-700/50 hover:border-white transform hover:scale-105"
                          disabled={isLoading}
                        >
                          <span className="text-sm">{option}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : currentStep === 'chat' ? (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <button 
                        onClick={() => {
                          // Reset conversation with backend
                          resetConversation();
                          // Clear local messages but keep profile info
                          const initialMessages = messages.slice(0, 2); // Keep system and profile messages
                          setMessages(initialMessages);
                          setError(null);
                        }}
                        className="text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg px-3 py-1 transition-colors"
                      >
                        Reset conversation
                      </button>
                      
                      <div className="text-xs text-gray-400">
                        Conversation ID: {conversationId}
                      </div>
                    </div>
                    
                    <div className="flex space-x-4">
                      <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask me anything about skincare..."
                        className="flex-1 bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-white"
                        disabled={isLoading}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim() || isLoading}
                        className="bg-white text-black p-3 rounded-xl hover:bg-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;