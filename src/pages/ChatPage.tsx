import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Send, 
  Bot, 
  User,
  Sparkles,
  MessageCircle,
  ChevronRight
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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
  const [showChatbox, setShowChatbox] = useState(false);
  const [answers, setAnswers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const questions: QuestionData[] = [
    {
      question: "What's your biological age range?",
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

  const handleStartConsultation = () => {
    setCurrentStep('questions');
    setTimeout(() => setShowChatbox(true), 300);
  };

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
        setCurrentQuestionIndex(prev => prev + 1);
        addBotMessage(questions[currentQuestionIndex + 1].question);
      }, 1000);
    } else {
      // All questions answered, send to API
      setTimeout(() => {
        handleSendAnswersToAPI(newAnswers);
      }, 1000);
    }
  };

  const addBotMessage = (content: string) => {
    const botMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, botMessage]);
  };

  const handleSendAnswersToAPI = async (allAnswers: string[]) => {
    setIsLoading(true);
    
    try {
      // Simulate API call to /chat endpoint
      const response = await fetch('/api/chat', {
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
          message: "Based on my profile, please provide personalized skincare recommendations."
        })
      });

      if (response.ok) {
        const data = await response.json();
        addBotMessage(data.response || "Thank you for completing the assessment! I can now provide personalized recommendations. What would you like to know?");
      } else {
        throw new Error('API request failed');
      }
    } catch (error) {
      console.error('API Error:', error);
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
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage.trim(),
          context: { answers }
        })
      });

      if (response.ok) {
        const data = await response.json();
        addBotMessage(data.response);
      } else {
        throw new Error('API request failed');
      }
    } catch (error) {
      console.error('Chat Error:', error);
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

  useEffect(() => {
    if (currentStep === 'questions' && showChatbox && messages.length === 0) {
      // Start with first question
      setTimeout(() => {
        addBotMessage("Hello! I'm your FaceCare AI assistant. I'll ask you a few questions to personalize your skincare journey.");
        setTimeout(() => {
          addBotMessage(questions[0].question);
        }, 1500);
      }, 500);
    }
  }, [currentStep, showChatbox]);

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
        {currentStep === 'intro' && (
          <div className="text-center space-y-8 animate-fade-in max-w-3xl mx-auto">
            <div className="space-y-4">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto">
                <MessageCircle className="w-12 h-12 text-black" />
              </div>
              <h2 className="text-4xl font-bold">
                AI Skincare Consultation
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Get personalized skincare recommendations based on your unique profile and concerns
              </p>
            </div>

            <div className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6 text-left">
                <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                  <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center mb-4">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Personal Assessment</h3>
                  <p className="text-gray-400 text-sm">Quick questions about your age, skin type, and lifestyle</p>
                </div>

                <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                  <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center mb-4">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">AI Analysis</h3>
                  <p className="text-gray-400 text-sm">Advanced algorithms analyze your responses for insights</p>
                </div>

                <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                  <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center mb-4">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Custom Recommendations</h3>
                  <p className="text-gray-400 text-sm">Tailored skincare routine and product suggestions</p>
                </div>
              </div>

              <button
                onClick={handleStartConsultation}
                className="bg-white text-black px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex items-center space-x-2 mx-auto"
              >
                <span>Start Consultation</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {(currentStep === 'questions' || currentStep === 'chat') && (
          <div className={`transition-all duration-500 h-full ${showChatbox ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-800/50 overflow-hidden max-w-5xl mx-auto h-[80vh] flex flex-col">
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
                    style={{ animationDelay: `${index * 0.1}s` }}
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
                        <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
                        <p className={`text-xs mt-2 ${
                          message.role === 'user' ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

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

              {/* Question Options or Input */}
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
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;