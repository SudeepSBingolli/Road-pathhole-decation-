import React from 'react';
import { Priority } from '../../types';
import { PRIORITY_CONFIG } from '../../lib/constants';
import { cn } from '../../lib/utils';

interface PriorityBadgeProps {
  priority: Priority;
  size?: 'sm' | 'default';
  className?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  size = 'default',
  className
}) => {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.low;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-semibold uppercase tracking-wider',
        config.bg,
        config.text,
        config.border,
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        className
      )}
    >
      <span className={cn('h-2 w-2 rounded-full', config.dot)} />
      {config.label}
    </span>
  );
};
