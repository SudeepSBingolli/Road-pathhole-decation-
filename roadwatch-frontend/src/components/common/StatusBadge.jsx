import React from 'react';

const STATUS_CONFIG = {
  submitted: {
    label: 'Submitted',
    bg: 'bg-[#0A233A]/80',
    text: 'text-[#73D4FF]',
    border: 'border-[#73D4FF]/30',
    dot: 'bg-[#73D4FF]',
  },
  'under-review': {
    label: 'Under Review',
    bg: 'bg-purple-950/60',
    text: 'text-purple-300',
    border: 'border-purple-500/30',
    dot: 'bg-purple-400',
  },
  assigned: {
    label: 'Assigned',
    bg: 'bg-[#0C2744]/80',
    text: 'text-[#3998D8]',
    border: 'border-[#3998D8]/30',
    dot: 'bg-[#3998D8]',
  },
  'in-progress': {
    label: 'In Progress',
    bg: 'bg-[#291B08]/80',
    text: 'text-[#FFB45E]',
    border: 'border-[#FFB45E]/30',
    dot: 'bg-[#FFB45E] animate-pulse',
  },
  'repair-completed': {
    label: 'Repair Completed',
    bg: 'bg-teal-950/60',
    text: 'text-teal-300',
    border: 'border-teal-400/30',
    dot: 'bg-teal-400',
  },
  verified: {
    label: 'Verified & Fixed',
    bg: 'bg-[#08281C]/80',
    text: 'text-[#35D6A0]',
    border: 'border-[#35D6A0]/30',
    dot: 'bg-[#35D6A0]',
  },
  rejected: {
    label: 'Rejected',
    bg: 'bg-[#2B0E14]/80',
    text: 'text-[#FF6474]',
    border: 'border-[#FF6474]/30',
    dot: 'bg-[#FF6474]',
  },
  duplicate: {
    label: 'Duplicate',
    bg: 'bg-[#0B1A2A]/80',
    text: 'text-[#91A8BF]',
    border: 'border-[rgba(130,190,230,0.18)]',
    dot: 'bg-[#91A8BF]',
  },
};

export const StatusBadge = ({ status = 'submitted', size = 'sm' }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.submitted;

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[10px]',
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border backdrop-blur-md shadow-xs ${config.bg} ${config.text} ${config.border} ${sizeClasses[size] || sizeClasses.sm}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};
