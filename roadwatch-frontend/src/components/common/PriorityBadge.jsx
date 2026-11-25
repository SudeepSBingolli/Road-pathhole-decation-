import React from 'react';

const PRIORITY_CONFIG = {
  low: {
    label: 'Low',
    bg: 'bg-[#08281C]/80',
    text: 'text-[#35D6A0]',
    border: 'border-[#35D6A0]/30',
    dot: 'bg-[#35D6A0]',
  },
  medium: {
    label: 'Medium',
    bg: 'bg-[#291B08]/80',
    text: 'text-[#FFB45E]',
    border: 'border-[#FFB45E]/30',
    dot: 'bg-[#FFB45E]',
  },
  high: {
    label: 'High',
    bg: 'bg-[#2E1408]/80',
    text: 'text-[#F97316]',
    border: 'border-[#F97316]/30',
    dot: 'bg-[#F97316]',
  },
  critical: {
    label: 'Critical',
    bg: 'bg-[#2B0E14]/80',
    text: 'text-[#FF6474]',
    border: 'border-[#FF6474]/40',
    dot: 'bg-[#FF6474]',
  },
};

export const PriorityBadge = ({ priority = 'low', size = 'sm' }) => {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.low;

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[10px]',
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border backdrop-blur-md shadow-xs ${config.bg} ${config.text} ${config.border} ${sizeClasses[size] || sizeClasses.sm}`}
    >
      <span className="relative flex h-2 w-2">
        {priority === 'critical' && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6474] opacity-75"></span>
        )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${config.dot}`}
        ></span>
      </span>
      {config.label}
    </span>
  );
};
