import React from 'react';
import {
  CheckCircle2,
  Clock,
  Wrench,
  AlertTriangle,
  ArrowRight,
  XCircle,
  Copy,
} from 'lucide-react';

const getStatusIcon = (status) => {
  switch (status) {
    case 'submitted':
      return <Clock className="w-3.5 h-3.5 text-[#73D4FF]" />;
    case 'under-review':
      return <AlertTriangle className="w-3.5 h-3.5 text-purple-400" />;
    case 'assigned':
      return <ArrowRight className="w-3.5 h-3.5 text-[#3998D8]" />;
    case 'in-progress':
      return <Wrench className="w-3.5 h-3.5 text-[#FFB45E]" />;
    case 'repair-completed':
      return <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />;
    case 'verified':
      return <CheckCircle2 className="w-3.5 h-3.5 text-[#35D6A0]" />;
    case 'rejected':
      return <XCircle className="w-3.5 h-3.5 text-[#FF6474]" />;
    case 'duplicate':
      return <Copy className="w-3.5 h-3.5 text-[#91A8BF]" />;
    default:
      return <Clock className="w-3.5 h-3.5 text-[#91A8BF]" />;
  }
};

export const Timeline = ({ history = [] }) => {
  if (!history || history.length === 0) {
    return <p className="text-xs text-[#91A8BF] italic">No historical log entries recorded.</p>;
  }

  // Reverse so newest is at the top
  const sortedHistory = [...history].sort((a, b) => new Date(b.at) - new Date(a.at));

  return (
    <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[rgba(130,190,230,0.18)]">
      {sortedHistory.map((item, index) => {
        const formattedDate = new Date(item.at).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        const actorName = item.by?.name ? `${item.by.name} (${item.by.role || 'Staff'})` : null;

        return (
          <div key={index} className="relative group">
            {/* Dot Indicator */}
            <div className="absolute -left-6 top-1.5 flex items-center justify-center w-6 h-6 rounded-full bg-[#08192B] border-2 border-[rgba(130,190,230,0.25)] shadow-xs group-hover:border-[#73D4FF] transition-colors">
              {getStatusIcon(item.status)}
            </div>

            {/* Content */}
            <div className="bg-[#0D2138] border border-[rgba(130,190,230,0.16)] rounded-xl p-3 hover:bg-[#102944] hover:border-[rgba(130,190,230,0.25)] transition-all">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#73D4FF]">
                  {item.status.replace('-', ' ')}
                </span>
                <span className="text-[11px] font-mono text-[#91A8BF]">{formattedDate}</span>
              </div>

              {actorName && (
                <p className="text-[11px] font-medium text-[#91A8BF] mb-1">By: {actorName}</p>
              )}

              {item.note && (
                <p className="text-xs text-[#F4F8FC] leading-relaxed bg-[#071629] p-2 rounded-lg border border-[rgba(130,190,230,0.1)]">
                  {item.note}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
