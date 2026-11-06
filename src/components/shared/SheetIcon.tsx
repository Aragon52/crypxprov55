import React from 'react';
import { Logo } from './Logo';

interface SheetIconProps {
  x?: number; // 0-100 percentage
  y?: number; // 0-100 percentage
  scale?: number; // Zoom level
  size?: number;
  className?: string;
}

/**
 * A component to display the brand logo.
 * Deprecated the cropping logic as the user prefers the full logo without backgrounds.
 */
export const SheetIcon: React.FC<SheetIconProps> = ({ 
  size = 24, 
  className = "" 
}) => {
  return (
    <Logo size={size} variant="SYMBOL" className={className} />
  );
};
