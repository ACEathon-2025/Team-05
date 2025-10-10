import React from 'react';

interface GlowButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

const GlowButton: React.FC<GlowButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
}) => {
  const baseClasses = 'relative overflow-hidden font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100';
  
  const variantClasses = variant === 'primary'
    ? 'bg-gradient-to-r from-green-600 to-green-500 text-white hover:glow-green disabled:hover:from-green-600 disabled:hover:to-green-500'
    : 'bg-gradient-to-r from-gray-700 to-gray-800 text-white hover:glow-cyan border border-purple-500/30 disabled:hover:from-gray-700 disabled:hover:to-gray-800';
    
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses} ${sizeClasses[size]} ${className}`}
    >
      <span className="relative z-10">{children}</span>
      <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 to-green-400/20 opacity-0 hover:opacity-100 transition-opacity duration-300" />
    </button>
  );
};

export default GlowButton;