import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-xl',
  footer,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030C17]/85 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidth} bg-[#08192B] rounded-2xl shadow-2xl border border-[rgba(130,190,230,0.22)] overflow-hidden flex flex-col max-h-[90vh] text-[#F4F8FC] shadow-black/80`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0D2138] border-b border-[rgba(130,190,230,0.15)]">
          <h3 className="text-base font-mono font-bold uppercase tracking-wide text-[#73D4FF]">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-[#91A8BF] hover:text-[#F4F8FC] rounded-lg hover:bg-[#102944] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-3.5 bg-[#071629] border-t border-[rgba(130,190,230,0.12)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
