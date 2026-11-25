import React from 'react';
import { ReportStatus } from '../../types';
import { STATUS_CONFIG } from '../../lib/constants';
import { cn } from '../../lib/utils';

interface StatusBadgeProps {
  status: ReportStatus;
  size?: 'sm' | 'default';
  showDot?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'default',
  showDot = true,
  className
}) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.submitted;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors',
        config.bg,
        config.text,
        config.border,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs',
        className
      )}
      title={config.description}
    >
      {showDot && (
        <span className={cn('h-1.5 w-1.5 rounded-full animate-pulse', config.dot)} />
      )}
      {config.label}
    </span>
  );
};
