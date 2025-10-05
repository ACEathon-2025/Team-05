import React from 'react';

interface GlowButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const GlowButton: React.FC<GlowButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
}) => {
  const baseClasses = 'relative overflow-hidden font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl';
  
  const variantClasses = variant === 'primary'
    ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white hover:glow-purple'
    : 'bg-gradient-to-r from-gray-700 to-gray-800 text-white hover:glow-cyan border border-purple-500/30';
    
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses} ${sizeClasses[size]} ${className}`}
    >
      <span className="relative z-10">{children}</span>
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300" />
    </button>
  );
};

export default GlowButton;