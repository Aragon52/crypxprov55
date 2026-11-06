import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  variant?: 'FULL' | 'SYMBOL' | 'WORDMARK';
}

export const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  size = 40, 
  variant = 'FULL' 
}) => {
  const height = size;
  // Apply CSS filter to transform black/original color to Amber Yellow (#FFBF00 / HSL 45 100 50)
  const logoFilter = "brightness(0) saturate(100%) invert(73%) sepia(74%) saturate(2250%) hue-rotate(3deg) brightness(104%) contrast(104%)";

  if (variant === 'SYMBOL') {
    return (
      <div 
        className={`relative overflow-hidden shrink-0 p-1 ${className}`} 
        style={{ width: size * 1.0, height: size }}
      >
        <img 
          src="/logo-full-highres.png" 
          alt="CrypX Pro Symbol" 
          className="absolute max-w-none h-[calc(100%-8px)] w-auto left-1 top-1"
          style={{ filter: logoFilter }}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  if (variant === 'WORDMARK') {
    return (
      <div 
        className={`relative shrink-0 flex items-center ${className}`} 
        style={{ height: size }}
      >
        <img 
          src="/logo-wordmark-highres.png" 
          alt="CrypX Pro Wordmark" 
          className="w-auto object-contain"
          style={{ height: size * 2.5, filter: logoFilter }}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // FULL variant: Symbol + Wordmark
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Symbol part extracted from full logo */}
      <div 
        className="relative overflow-hidden shrink-0 p-1" 
        style={{ width: height * 1.0, height: height }}
      >
        <img 
          src="/logo-full-highres.png" 
          alt="CrypX Pro Symbol" 
          className="absolute max-w-none h-[calc(100%-8px)] w-auto left-1 top-1"
          style={{ filter: logoFilter }}
          referrerPolicy="no-referrer"
        />
      </div>
      
      <div className="flex items-center">
        <img 
          src="/logo-wordmark-highres.png" 
          alt="CrypX Pro Wordmark" 
          className="w-auto object-contain"
          style={{ height: height * 2.5, filter: logoFilter }}
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
};

export default Logo;
