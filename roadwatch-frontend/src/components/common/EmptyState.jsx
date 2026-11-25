import React from 'react';
import { Inbox, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No telemetry records found',
  description = 'There are no active records matching your current filter criteria.',
  actionText,
  actionLink,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center bg-[#0D2138] border border-[rgba(130,190,230,0.18)] border-dashed rounded-2xl my-6 shadow-xl shadow-[#020810]/40">
      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[#102944] text-[#73D4FF] border border-[#73D4FF]/30 mb-4 shadow-md">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-[#F4F8FC] mb-1">{title}</h3>
      <p className="text-xs text-[#91A8BF] max-w-sm mb-6 leading-relaxed">{description}</p>

      {actionText && actionLink && (
        <Link
          to={actionLink}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#030C17] bg-[#73D4FF] hover:bg-[#8ee0ff] rounded-xl shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {actionText}
        </Link>
      )}

      {actionText && onAction && !actionLink && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#030C17] bg-[#73D4FF] hover:bg-[#8ee0ff] rounded-xl shadow-md transition-all cursor-pointer"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
