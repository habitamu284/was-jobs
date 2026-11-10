import React, { useState } from 'react';
import { X, Flag, CheckCircle, AlertCircle } from 'lucide-react';
import { Job } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { safeJsonFetch } from '../utils/api.ts';

interface ReportModalProps {
  job: Job;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ job, isOpen, onClose }) => {
  const { lang } = useLanguage();
  const { user, authFetch } = useAuth();

  const [reason, setReason] = useState('Misleading information');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const reasons = [
    { id: 'Misleading information', labelEn: 'Misleading or incorrect information', labelAm: 'የተሳሳተ ወይም አሳሳች መረጃ' },
    { id: 'Expired listing', labelEn: 'Job is already closed or expired', labelAm: 'ስራው ቀደም ሲል የተዘጋ ነው' },
    { id: 'Discriminatory terms', labelEn: 'Discriminatory or unfair terms', labelAm: 'አድሏዊ ወይም አግባብ ያልሆነ መስፈርት' },
    { id: 'Suspicious contact/scam', labelEn: 'Suspicious contact or potential scam', labelAm: 'አጠራጣሪ አድራሻ ወይም ማጭበርበር' },
    { id: 'Other', labelEn: 'Other question or issue', labelAm: 'ሌላ ጥያቄ ወይም አስተያየት' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError(lang === 'am' ? 'ሪፖርት ለማድረግ እባክዎ መጀመሪያ ይግቡ።' : 'Please log in to submit a report.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await authFetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          reason,
          details,
        }),
      });

      const parsed = await safeJsonFetch(res, 'Failed to submit report');
      if (!parsed.ok || !parsed.data) {
        throw new Error(parsed.error || 'Failed to submit report');
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1600);
    } catch (e: any) {
      setError(e.message || 'Error submitting report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-orange-400" />
            <h3 className="font-bold text-sm text-white">
              {lang === 'am' ? 'ስራውን ሪፖርት ያድርጉ' : 'Report Job Posting'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-6 text-center space-y-2">
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
            <p className="font-bold text-sm text-slate-800">
              {lang === 'am' ? 'ሪፖርትዎ ለአስተዳዳሪው ደርሷል!' : 'Report Submitted for Administrator Review!'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
            {error && (
              <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {lang === 'am' ? 'የሪፖርት ምክንያት ይምረጡ' : 'Select Reason'}
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              >
                {reasons.map((r) => (
                  <option key={r.id} value={r.id}>
                    {lang === 'am' ? r.labelAm : r.labelEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {lang === 'am' ? 'ተጨማሪ ዝርዝር ማብራሪያ' : 'Additional Details'}
              </label>
              <textarea
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={lang === 'am' ? 'ጉዳዩን በአጭሩ ያብራሩ...' : 'Explain the issue in detail...'}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-xl text-xs text-slate-600 hover:bg-slate-100"
              >
                {lang === 'am' ? 'ተመለስ' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs"
              >
                {isSubmitting ? (lang === 'am' ? 'በመላክ ላይ...' : 'Submitting...') : (lang === 'am' ? 'ሪፖርት ላክ' : 'Submit Report')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
