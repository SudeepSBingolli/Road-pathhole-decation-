import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';

interface StatCardProps {
  title: string;
  value: number;
  suffix?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  accentColor?: string;
  delay?: number;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  suffix = '',
  icon: Icon,
  trend,
  accentColor = 'text-primary',
  delay = 0
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  // Animated counter
  useEffect(() => {
    let startTime: number;
    const duration = 1200; // ms

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(eased * value));

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };

    requestAnimationFrame(step);
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.1, ease: 'easeOut' }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Card className="border border-border/80 bg-card hover:shadow-soft-lg transition-all duration-300 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-primary/5 blur-2xl pointer-events-none" />

        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className={cn('p-2.5 rounded-2xl bg-muted/60', accentColor)}>
              <Icon className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-foreground font-mono">
              {displayValue.toLocaleString()}
              {suffix}
            </span>
          </div>

          {trend && (
            <div className="mt-3 flex items-center gap-1.5 text-xs">
              {trend.isPositive ? (
                <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <TrendingUp className="h-3.5 w-3.5" />
                  +{trend.value}%
                </span>
              ) : (
                <span className="flex items-center gap-0.5 text-rose-600 dark:text-rose-400 font-semibold">
                  <TrendingDown className="h-3.5 w-3.5" />
                  -{trend.value}%
                </span>
              )}
              <span className="text-muted-foreground">{trend.label || 'from last month'}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
