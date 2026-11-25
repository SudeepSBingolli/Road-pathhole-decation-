import React from 'react';
import { motion } from 'framer-motion';
import { StatusHistoryItem } from '../../types';
import { StatusBadge } from './StatusBadge';
import { formatDateTime } from '../../lib/utils';
import { CheckCircle2, Clock, UserCheck } from 'lucide-react';

interface TimelineProps {
  history: StatusHistoryItem[];
  className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({ history, className }) => {
  if (!history || history.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-muted-foreground">
        No status history recorded yet.
      </div>
    );
  }

  // Reverse so newest is at the top, or keep chronological
  // Usually chronological (first to last) is best for audit trail
  return (
    <div className={`relative pl-6 space-y-6 before:absolute before:bottom-2 before:top-2 before:left-[11px] before:w-[2px] before:bg-border ${className}`}>
      {history.map((item, index) => {
        const isLatest = index === history.length - 1;

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.08 }}
            className="relative group"
          >
            {/* Timeline Dot */}
            <div
              className={`absolute -left-[30px] top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
                isLatest
                  ? 'border-primary bg-primary text-primary-foreground shadow-glow-primary scale-110'
                  : 'border-border bg-background text-muted-foreground group-hover:border-primary/50'
              }`}
            >
              {isLatest ? (
                <Clock className="h-3 w-3 animate-spin" style={{ animationDuration: '6s' }} />
              ) : (
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              )}
            </div>

            {/* Content Card */}
            <div className="rounded-2xl border border-border/70 bg-card/60 p-4 shadow-sm backdrop-blur-sm hover:border-border transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <StatusBadge status={item.status} size="sm" />
                <span className="text-xs text-muted-foreground font-mono">
                  {formatDateTime(item.at)}
                </span>
              </div>

              {item.note && (
                <p className="mt-2.5 text-sm text-foreground/90 leading-relaxed bg-muted/40 p-2.5 rounded-xl border border-border/40">
                  {item.note}
                </p>
              )}

              {item.by && (
                <div className="mt-2.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <UserCheck className="h-3.5 w-3.5 text-primary" />
                  <span>Action recorded by: <strong className="text-foreground">{item.by.name}</strong></span>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
