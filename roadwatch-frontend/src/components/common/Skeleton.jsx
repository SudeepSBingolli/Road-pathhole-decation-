import React from 'react';

export const CardSkeleton = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-[#0D2138] border border-[rgba(130,190,230,0.18)] rounded-2xl p-5 shadow-lg animate-pulse space-y-4"
        >
          <div className="h-40 bg-[#102944] rounded-xl w-full" />
          <div className="flex items-center justify-between">
            <div className="h-4 bg-[#102944] rounded w-24" />
            <div className="h-5 bg-[#102944] rounded-full w-16" />
          </div>
          <div className="h-4 bg-[#102944] rounded w-3/4" />
          <div className="h-3 bg-[#102944]/50 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
};

export const TableSkeleton = ({ rows = 5, cols = 5 }) => {
  return (
    <div className="w-full bg-[#0D2138] border border-[rgba(130,190,230,0.18)] rounded-2xl overflow-hidden shadow-xl animate-pulse">
      <div className="h-12 bg-[#071629] border-b border-[rgba(130,190,230,0.15)]" />
      <div className="p-4 space-y-3">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="flex gap-4 items-center">
            {Array.from({ length: cols }).map((_, cIdx) => (
              <div
                key={cIdx}
                className="h-4 bg-[#102944] rounded flex-1"
                style={{ width: `${100 / cols}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
