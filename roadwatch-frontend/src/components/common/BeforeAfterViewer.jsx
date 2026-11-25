import React, { useState } from 'react';
import { Eye, ArrowRightLeft } from 'lucide-react';

export const BeforeAfterViewer = ({ beforeImages = [], afterImages = [] }) => {
  const [viewMode, setViewMode] = useState('side-by-side'); // 'side-by-side' | 'toggle'
  const [activeToggle, setActiveToggle] = useState('before'); // 'before' | 'after'

  const beforeImg =
    beforeImages[0]?.url || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800';
  const afterImg =
    afterImages[0]?.url || 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=800';

  return (
    <div className="bg-[#071629] border border-[rgba(130,190,230,0.18)] rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#73D4FF] flex items-center gap-2">
          <Eye className="w-4 h-4 text-[#73D4FF]" />
          <span>Repair Photo Evidence Audit</span>
        </h4>

        <button
          type="button"
          onClick={() =>
            setViewMode((prev) => (prev === 'side-by-side' ? 'toggle' : 'side-by-side'))
          }
          className="text-xs font-mono font-bold text-[#73D4FF] hover:bg-[#16375c] flex items-center gap-1.5 px-3 py-1 bg-[#102944] border border-[rgba(130,190,230,0.2)] rounded-lg transition-colors cursor-pointer"
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          {viewMode === 'side-by-side' ? 'Switch to Toggle View' : 'Switch to Side-by-Side'}
        </button>
      </div>

      {viewMode === 'side-by-side' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Before Photo */}
          <div className="space-y-1.5">
            <div className="relative aspect-4/3 rounded-xl overflow-hidden border border-[#FF6474]/40 bg-[#030C17] shadow-lg">
              <img
                src={beforeImg}
                alt="Before repair damage"
                className="w-full h-full object-cover"
              />
              <span className="absolute top-2 left-2 px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase rounded-md bg-[#2B0E14] text-[#FF6474] border border-[#FF6474]/50 shadow-md">
                Before Repair
              </span>
            </div>
            <p className="text-[11px] font-mono text-[#91A8BF] text-center">
              Initial road damage reported
            </p>
          </div>

          {/* After Photo */}
          <div className="space-y-1.5">
            <div className="relative aspect-4/3 rounded-xl overflow-hidden border border-[#35D6A0]/40 bg-[#030C17] shadow-lg">
              <img
                src={afterImg}
                alt="After repair completed"
                className="w-full h-full object-cover"
              />
              <span className="absolute top-2 left-2 px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase rounded-md bg-[#08281C] text-[#35D6A0] border border-[#35D6A0]/50 shadow-md">
                After Repair
              </span>
            </div>
            <p className="text-[11px] font-mono text-[#91A8BF] text-center">
              Completed asphalt patch
            </p>
          </div>
        </div>
      ) : (
        /* Toggle View */
        <div className="space-y-3">
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={() => setActiveToggle('before')}
              className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeToggle === 'before'
                  ? 'bg-[#FF6474] text-[#030C17] shadow-md'
                  : 'bg-[#102944] text-[#91A8BF] hover:text-[#F4F8FC]'
              }`}
            >
              Before Repair
            </button>
            <button
              type="button"
              onClick={() => setActiveToggle('after')}
              className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeToggle === 'after'
                  ? 'bg-[#35D6A0] text-[#030C17] shadow-md'
                  : 'bg-[#102944] text-[#91A8BF] hover:text-[#F4F8FC]'
              }`}
            >
              After Repair
            </button>
          </div>

          <div className="relative aspect-16/9 rounded-xl overflow-hidden border border-[rgba(130,190,230,0.2)] bg-[#030C17] max-w-xl mx-auto shadow-2xl">
            <img
              src={activeToggle === 'before' ? beforeImg : afterImg}
              alt="Evidence comparison"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
    </div>
  );
};
