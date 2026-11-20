import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, Edit3, Plus, AlertCircle, CheckCircle2, X } from 'lucide-react';

export interface ActionOption {
  label: string;
  onClick: () => void | Promise<void>;
  variant?: 'danger' | 'primary' | 'neutral' | 'subtle';
  isDangerous?: boolean;
}

export interface ActionConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  type?: 'delete' | 'add' | 'edit' | 'warning' | 'info';
  options?: ActionOption[];
  cancelText?: string;
  children?: React.ReactNode;
}

export const ActionConfirmModal: React.FC<ActionConfirmModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  type = 'delete',
  options = [],
  cancelText = 'Cancel',
  children,
}) => {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Backdrop overlay (dimmed background matching mobile/web modal dialogs) */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Centered Modal Dialog Card (Matching reference WhatsApp/native dialog styling) */}
      <div className="relative w-full max-w-sm sm:max-w-md bg-white dark:bg-[#131b2e] rounded-[28px] p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800/80 z-10 animate-in zoom-in-95 fade-in duration-150 select-none">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2.5">
            {type === 'delete' && (
              <div className="w-9 h-9 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
            )}
            {type === 'edit' && (
              <div className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Edit3 className="w-5 h-5" />
              </div>
            )}
            {type === 'add' && (
              <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Plus className="w-5 h-5" />
              </div>
            )}
            {type === 'warning' && (
              <div className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
            )}
            {type === 'info' && (
              <div className="w-9 h-9 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            )}

            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
              {title}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Optional Description / Prompt Text */}
        {description && (
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4 pl-0.5">
            {description}
          </p>
        )}

        {/* Custom Body (If used for Add/Edit inputs) */}
        {children && <div className="mb-4">{children}</div>}

        {/* Action Buttons Column / Stack (Clean list of options like WhatsApp popup) */}
        <div className="flex flex-col items-end gap-1.5 pt-2">
          {options.map((opt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                opt.onClick();
              }}
              className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-right transition cursor-pointer ${
                opt.variant === 'danger' || opt.isDangerous
                  ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50'
                  : opt.variant === 'primary'
                  ? 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {opt.label}
            </button>
          ))}

          {/* Cancel Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-right text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition cursor-pointer"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
