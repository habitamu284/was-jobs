import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Send, Check } from 'lucide-react';
import { Job } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { safeJsonFetch } from '../utils/api.ts';

interface ApplyModalProps {
  job: Job;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ApplyModal: React.FC<ApplyModalProps> = ({ job, isOpen, onClose, onSuccess }) => {
  const { lang, t } = useLanguage();
  const { user, authFetch } = useAuth();

  const [coverLetter, setCoverLetter] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [useProfileCv, setUseProfileCv] = useState(!!user?.cvUrl);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUseProfileCv(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      let finalCvUrl = user?.cvUrl;
      let finalCvName = user?.cvOriginalName;

      // If user uploaded a new file in this modal
      if (!useProfileCv && selectedFile) {
        const formData = new FormData();
        formData.append('cv', selectedFile);

        const uploadRes = await authFetch('/api/users/upload-cv', {
          method: 'POST',
          body: formData,
        });

        const uploadParsed = await safeJsonFetch(uploadRes, 'Failed to upload CV');
        if (!uploadParsed.ok || !uploadParsed.data) {
          throw new Error(uploadParsed.error || 'Failed to upload CV');
        }

        finalCvUrl = uploadParsed.data.cvUrl;
        finalCvName = uploadParsed.data.cvOriginalName;
      }

      if (!finalCvUrl) {
        throw new Error(
          lang === 'am'
            ? 'እባክዎ ከማመልከትዎ በፊት ሲቪ (CV) ያያይዙ።'
            : 'Please attach or upload your CV before submitting.'
        );
      }

      const res = await authFetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          coverLetter,
          phone,
          cvUrl: finalCvUrl,
          cvOriginalName: finalCvName,
        }),
      });

      const parsed = await safeJsonFetch(res, 'Failed to submit application');
      if (!parsed.ok || !parsed.data) {
        throw new Error(parsed.error || 'Failed to submit application');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'An error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-[#0B192C] text-white p-5 flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF6B00]">
              {job.companyName}
            </span>
            <h2 className="text-base sm:text-lg font-bold text-white mt-0.5 line-clamp-1">
              {job.title}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {job.location} • {job.employmentType.replace('_', ' ')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {lang === 'am' ? 'ማመልከቻዎ በተሳካ ሁኔታ ደርሷል!' : 'Application Submitted Successfully!'}
            </h3>
            <p className="text-xs text-slate-600 max-w-sm mx-auto">
              {lang === 'am'
                ? `ለ${job.companyName} ያቀረቡት ማመልከቻ ደርሷቸዋል። የሂደቱን ሁኔታ በማመልከቻዎች ዳሽቦርድ መከታተል ይችላሉ።`
                : `Your application has been received by ${job.companyName}. You can track progress in your Applications dashboard.`}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Applicant details preview */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">{lang === 'am' ? 'አመልካች፡' : 'Applicant:'}</span>
                <span className="font-semibold text-slate-900">{user?.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{lang === 'am' ? 'ኢሜል፡' : 'Email:'}</span>
                <span className="font-semibold text-slate-900">{user?.email}</span>
              </div>
            </div>

            {/* Phone input */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {t('phone')} ({lang === 'am' ? 'አሰሪው እንዲያገኝዎት' : 'For employer contact'}) *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09... / +251 9..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#FF6B00]"
              />
            </div>

            {/* CV Attachment Section */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                {t('cvAttachment')} *
              </label>

              {user?.cvUrl && (
                <div className="space-y-2 mb-2">
                  <label
                    onClick={() => setUseProfileCv(true)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer text-xs transition ${
                      useProfileCv
                        ? 'bg-orange-50/80 border-[#FF6B00] text-[#FF6B00]'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <div>
                        <div className="font-bold">{t('useExistingCv')}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[220px]">
                          {user.cvOriginalName || 'My_Curriculum_Vitae.pdf'}
                        </div>
                      </div>
                    </div>
                    {useProfileCv && <CheckCircle2 className="w-4 h-4 text-[#FF6B00]" />}
                  </label>
                </div>
              )}

              {/* Upload fresh CV */}
              <div
                className={`p-3.5 rounded-xl border-2 border-dashed transition text-center ${
                  !useProfileCv && selectedFile
                    ? 'border-emerald-500 bg-emerald-50/50'
                    : 'border-slate-300 hover:border-orange-400 bg-slate-50'
                }`}
              >
                <input
                  type="file"
                  id="cv-file-input"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="cv-file-input"
                  className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
                >
                  <Upload className="w-5 h-5 text-[#FF6B00]" />
                  <span className="text-xs font-semibold text-slate-800">
                    {selectedFile
                      ? selectedFile.name
                      : t('uploadNewCv')}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    PDF, Word, or TXT (Max 10MB)
                  </span>
                </label>
              </div>
            </div>

            {/* Cover letter message */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {t('coverLetterLabel')}
              </label>
              <textarea
                rows={4}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder={t('coverLetterPlaceholder')}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#FF6B00] leading-relaxed"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#FF6B00] to-orange-600 hover:from-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 flex items-center gap-1.5 disabled:opacity-50"
              >
                <span>{isSubmitting ? (lang === 'am' ? 'በመላክ ላይ...' : 'Submitting...') : t('submitApplication')}</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
