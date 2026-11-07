import React from 'react';
import { MapPin, Briefcase, Calendar, CheckCircle2, Bookmark, Flame, Building2 } from 'lucide-react';
import { Job } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';

interface JobCardProps {
  job: Job;
  isSaved?: boolean;
  onToggleSave?: (jobId: string) => void;
  onSelect: (job: Job) => void;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  isSaved = false,
  onToggleSave,
  onSelect,
}) => {
  const { lang, t } = useLanguage();
  const { user } = useAuth();

  const formatSalary = () => {
    if (job.isNegotiableSalary || (!job.salaryMin && !job.salaryMax)) {
      return lang === 'am' ? 'በስምምነት የሚወሰን' : 'Negotiable Salary';
    }
    const min = job.salaryMin ? `${job.salaryMin.toLocaleString()}` : '';
    const max = job.salaryMax ? `${job.salaryMax.toLocaleString()}` : '';
    const currency = lang === 'am' ? 'ብር' : 'ETB';

    if (min && max) {
      return `${min} - ${max} ${currency}`;
    }
    return `${min || max} ${currency}`;
  };

  const calculateDaysLeft = (deadlineStr: string) => {
    const deadline = new Date(deadlineStr).getTime();
    const today = new Date().getTime();
    const diffDays = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { text: lang === 'am' ? 'ተዘግቷል' : 'Closed', isExpired: true };
    if (diffDays === 0) return { text: lang === 'am' ? 'ዛሬ ያልቃል' : 'Ends today', isUrgent: true };
    return {
      text: lang === 'am' ? `${diffDays} ቀናት ቀሩት` : `${diffDays} days left`,
      isUrgent: diffDays <= 3,
    };
  };

  const daysInfo = calculateDaysLeft(job.applicationDeadline);

  return (
    <div
      onClick={() => onSelect(job)}
      className="group relative bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 hover:border-orange-400 hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
    >
      {/* Top row: Company, Featured pill, Save button */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {job.companyLogo ? (
              <img
                src={job.companyLogo}
                alt={job.companyName}
                className="w-11 h-11 rounded-lg object-cover border border-slate-100 shadow-xs"
              />
            ) : (
              <div className="w-11 h-11 rounded-lg bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-base border border-slate-200">
                <Building2 className="w-5 h-5 text-slate-500" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-xs sm:text-sm text-slate-700 truncate max-w-[180px] sm:max-w-[240px]">
                  {job.companyName}
                </span>
                <span title="Verified Employer" className="text-blue-500">
                  <CheckCircle2 className="w-3.5 h-3.5 fill-blue-500 text-white" />
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                <span className="truncate">{job.location}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {job.isFeatured && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                <Flame className="w-3 h-3 text-amber-600 fill-amber-500" />
                <span>{lang === 'am' ? 'ልዩ' : 'Featured'}</span>
              </span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onToggleSave) onToggleSave(job.id);
              }}
              className={`p-1.5 rounded-lg border transition ${
                isSaved
                  ? 'bg-orange-50 border-orange-300 text-[#FF6B00]'
                  : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-orange-500 hover:bg-orange-50'
              }`}
              title={isSaved ? t('saved') : t('saveJob')}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#FF6B00]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Job Title */}
        <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-[#FF6B00] transition-colors mt-3 line-clamp-2">
          {job.title}
        </h3>

        {/* Snippet */}
        <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
          {job.description}
        </p>

        {/* Badges / Tags */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700">
            <Briefcase className="w-3 h-3 text-slate-500" />
            <span>{job.category}</span>
          </span>

          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 capitalize">
            {job.employmentType.replace('_', ' ')}
          </span>

          {job.applicationsCount !== undefined && (
            <span className="text-[11px] text-slate-400 font-medium">
              • {job.applicationsCount} {lang === 'am' ? 'አመልካቾች' : 'applicants'}
            </span>
          )}
        </div>
      </div>

      {/* Bottom row: Salary & Deadline */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            {t('salary')}
          </span>
          <span className="font-extrabold text-slate-900 text-xs sm:text-sm text-emerald-700">
            {formatSalary()}
          </span>
        </div>

        <div className="text-right">
          <div className="flex items-center gap-1 text-[11px] text-slate-500 justify-end">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span
              className={`font-semibold ${
                daysInfo.isExpired
                  ? 'text-red-500'
                  : daysInfo.isUrgent
                  ? 'text-amber-600'
                  : 'text-slate-600'
              }`}
            >
              {daysInfo.text}
            </span>
          </div>
          <span className="text-[10px] text-slate-400">
            {job.applicationDeadline}
          </span>
        </div>
      </div>
    </div>
  );
};
