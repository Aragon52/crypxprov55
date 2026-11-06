import React from 'react';

interface AnimatedBalanceProps {
  value: string;
  hidden: boolean;
  className?: string;
}

export const AnimatedBalance: React.FC<AnimatedBalanceProps> = ({ value, hidden, className = '' }) => (
  <span className={`relative inline-block ${className}`}>
    <span className={`transition-all duration-500 ease-in-out block font-mono ${hidden ? 'opacity-0 blur-md select-none scale-95' : 'opacity-100 blur-0 scale-100'}`}>
      {value}
    </span>
    <span className={`absolute left-0 top-0 h-full w-full flex items-center transition-all duration-500 ease-in-out font-mono tracking-[0.1em] ${hidden ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-md scale-105'}`}>
      <span className="mt-[0.3em]">******</span>
    </span>
  </span>
);

export default AnimatedBalance;
