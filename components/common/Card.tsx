
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`luxury-card p-4 md:p-6 ${className}`} style={{ animation: 'slideUp 0.5s ease-out' }}>
      {children}
    </div>
  );
};

export default Card;