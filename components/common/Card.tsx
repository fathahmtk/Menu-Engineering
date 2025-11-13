

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', noPadding = false }) => {
  const paddingClass = noPadding ? '' : 'p-4 md:p-6';
  return (
    <div className={`ican-card ${paddingClass} ${className}`} style={{ animation: 'slideUp 0.5s ease-out forwards' }}>
      {children}
    </div>
  );
};

export default Card;