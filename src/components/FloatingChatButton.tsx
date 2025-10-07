import React from 'react';
import { MessageCircle } from 'lucide-react';

interface FloatingChatButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

const FloatingChatButton: React.FC<FloatingChatButtonProps> = ({ onClick, isOpen }) => {
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 hover:shadow-3xl ${
        isOpen 
          ? 'bg-red-500 hover:bg-red-600 rotate-45' 
          : 'bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600'
      }`}
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
    >
      <div className="flex items-center justify-center text-white">
        {isOpen ? (
          <div className="w-6 h-6 flex items-center justify-center">
            <div className="w-4 h-0.5 bg-white"></div>
          </div>
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </div>
      
      {/* Pulsing ring animation when closed */}
      {!isOpen && (
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 animate-ping opacity-20"></div>
      )}
    </button>
  );
};

export default FloatingChatButton;