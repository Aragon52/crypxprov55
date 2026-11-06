import React from 'react';

interface WotBadgeProps {
  id?: string;
  className?: string;
  variant?: 'white' | 'dark';
}

export const WotBadge: React.FC<WotBadgeProps> = ({
  id = 'wot-badge0',
  className = '',
  variant = 'white',
}) => {
  return (
    <a
      id={id}
      className={`wot-badge ${className}`}
      href={`https://www.mywot.com/scorecard/?wot_badge=0_${variant}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Web of Trust Verified Website Badge"
    >
      <div className="wot-logo" />
      <div className="wot-shield" />
      <p className="wot-secured">Verified Website</p>
      <div className="wot-vertical" />
      <p className="wot-report">See Report</p>
    </a>
  );
};
