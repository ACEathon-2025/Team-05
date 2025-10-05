import React from 'react';

const ParticleBackground: React.FC = () => {
  const particles = Array.from({ length: 50 }, (_, i) => (
    <div
      key={i}
      className="absolute w-1 h-1 bg-purple-500 rounded-full particle-animation opacity-30"
      style={{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 6}s`,
        animationDuration: `${6 + Math.random() * 4}s`,
      }}
    />
  ));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles}
    </div>
  );
};

export default ParticleBackground;