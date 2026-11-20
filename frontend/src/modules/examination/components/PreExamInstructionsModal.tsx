import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { AssessmentConfig } from '../types';
import { examService } from '../services/examService';
import {
  ShieldAlert,
  Clock,
  HelpCircle,
  Award,
  Maximize2,
  AlertTriangle,
  Lock,
  CheckCircle2,
  X,
  KeyRound,
  ExternalLink,
} from 'lucide-react';

interface PreExamInstructionsModalProps {
  test: AssessmentConfig;
  onClose: () => void;
  onStartExam: () => void;
}

export const PreExamInstructionsModal: React.FC<PreExamInstructionsModalProps> = ({
  test,
  onClose,
  onStartExam,
}) => {
  const [agreed, setAgreed] = useState(false);
  const [secretKeyInput, setSecretKeyInput] = useState('');
  const [keyError, setKeyError] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleStart = async () => {
    if (!agreed) return;

    if (test.publishing_mode === 'pin_protected' && test.is_secret_key_required) {
      setVerifying(true);
      setKeyError('');
      const verify = examService.verifySecretKey(test.id, secretKeyInput);
      setVerifying(false);
      if (!verify.valid) {
        setKeyError(verify.message);
        return;
      }
    }

    // Direct synchronous call to requestFullscreen on user gesture
    try {
      const docEl = document.documentElement as any;
      const rfs =
        docEl.requestFullscreen ||
        docEl.webkitRequestFullscreen ||
        docEl.mozRequestFullScreen ||
        docEl.msRequestFullscreen;
      if (rfs) {
        await rfs.call(docEl);
      }
    } catch (e) {
      console.warn('Fullscreen request bypassed or blocked by browser', e);
    }

    onStartExam();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-inner">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Examination Security & Anti-Cheating Protocol
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Please review assessment instructions and security rules before starting
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 dark:text-slate-300 text-sm">
          {/* Test Meta Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Duration</span>
              <span className="text-base font-black text-slate-900 dark:text-white flex items-center justify-center gap-1 mt-0.5">
                <Clock className="w-4 h-4 text-indigo-500" />
                {test.duration_minutes} Mins
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Questions</span>
              <span className="text-base font-black text-slate-900 dark:text-white flex items-center justify-center gap-1 mt-0.5">
                <HelpCircle className="w-4 h-4 text-emerald-500" />
                {test.total_questions || test.questions?.length || 0} Items
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Pass Threshold</span>
              <span className="text-base font-black text-slate-900 dark:text-white flex items-center justify-center gap-1 mt-0.5">
                {test.passing_percentage}%
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Max Credits</span>
              <span className="text-base font-black text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-1 mt-0.5">
                <Award className="w-4 h-4" />
                {test.category === 'aptitude' || test.category === 'practice'
                  ? '0 pts'
                  : `+${test.credit_tiers?.[0]?.credits || 25} pts`}
              </span>
            </div>
          </div>

          {/* Strict Security Rules List */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span>Strict Rules & Proctoring Restrictions:</span>
            </h4>

            <div className="space-y-2.5">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                <Maximize2 className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">1. Mandatory Fullscreen Mode</h5>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                    The examination must be taken in Fullscreen. Exiting fullscreen mode or resizing your window triggers an alert and is recorded in the proctor audit log.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                    2. Strict {test.max_violations || 3} Tab-Switch Violation Limit
                  </h5>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Leaving this window, opening another tab, or minimizing the browser is strictly prohibited. You receive a maximum of { (test.max_violations || 3) - 1 } warnings. On the <strong>{test.max_violations || 3}rd violation</strong>, your exam will be <strong>automatically submitted and locked immediately</strong>.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-start gap-3">
                <Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                    3. {test.category === 'practice'
                      ? 'Practice Test (Multiple Attempts Allowed)'
                      : test.category === 'aptitude'
                      ? 'Aptitude Assessment (0 Credits • Placement Screening)'
                      : 'One Official Attempt Permitted'}
                  </h5>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {test.category === 'practice'
                      ? 'This is a practice assessment. You can take it multiple times, and complete answer explanations will be displayed immediately upon submission.'
                      : test.category === 'aptitude'
                      ? 'This is a Placement Aptitude Assessment. No academic credits are awarded (0 credits). Your results are tracked for interview shortlisting, speed/accuracy analytics, and placement readiness.'
                      : 'Once this official examination is submitted, retakes are strictly disabled unless your mentor or administrator explicitly grants permission.'}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">4. Continuous Auto-Save & Disconnection Recovery</h5>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Your answers are securely cached locally every second. If your network temporarily drops, your responses remain safely intact.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Secret Key Input (If required) */}
          {test.publishing_mode === 'pin_protected' && test.is_secret_key_required && (
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-indigo-500/30 space-y-2">
              <label className="block text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-indigo-500" />
                <span>Secret Examination Access Key / PIN *</span>
              </label>
              <input
                type="text"
                value={secretKeyInput}
                onChange={(e) => setSecretKeyInput(e.target.value)}
                placeholder="e.g. WEGROW-9842 or PIN-2026"
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm tracking-wider uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
              {keyError ? (
                <p className="text-xs font-bold text-rose-500 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {keyError}
                </p>
              ) : (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Contact your instructor or mentor if you do not have the examination key.
                </p>
              )}
            </div>
          )}

          {/* Agreement Checkbox */}
          <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
            />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
              I have read, understood, and agree to abide by the Examination Security Protocol and Proctoring Rules. I acknowledge that unauthorized tab switching or window minimizing will result in immediate disqualification.
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Cancel & Return
          </button>
          <button
            onClick={handleStart}
            disabled={!agreed || verifying || (test.publishing_mode === 'pin_protected' && test.is_secret_key_required && !secretKeyInput.trim())}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:pointer-events-none transition flex items-center justify-center gap-2"
          >
            <Maximize2 className="w-4 h-4" />
            <span>Enter Fullscreen & Begin Assessment</span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
