import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  Calendar,
  Clock,
  Phone,
  Mail,
  Building2,
  CheckCircle2,
  Bookmark,
  Share2,
  Flag,
  Flame,
  Check,
  Send,
  Download,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { Job, Company } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { safeJsonFetch } from '../utils/api.ts';
import { ApplyModal } from '../components/ApplyModal.tsx';
import { ReportModal } from '../components/ReportModal.tsx';

interface JobDetailProps {
  jobId: string;
  onBack: () => void;
  openAuthModal: () => void;
  isSaved?: boolean;
  onToggleSave?: (jobId: string) => void;
}

export const JobDetail: React.FC<JobDetailProps> = ({
  jobId,
  onBack,
  openAuthModal,
  isSaved = false,
  onToggleSave,
}) => {
  const { lang, t } = useLanguage();
  const { user, authFetch } = useAuth();

  const [job, setJob] = useState<Job | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/jobs/${jobId}`)
      .then((res) => safeJsonFetch<{ job: Job; company?: Company }>(res))
      .then((parsed) => {
        if (parsed.data?.job) {
          setJob(parsed.data.job);
          setCompany(parsed.data.company || null);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });

    // Check if user has already applied
    if (user?.role === 'seeker') {
      authFetch('/api/applications/my')
        .then((res) => safeJsonFetch<{ applications: any[] }>(res))
        .then((parsed) => {
          if (parsed.data?.applications) {
            const applied = parsed.data.applications.some((a: any) => a.jobId === jobId);
            setHasApplied(applied);
          }
        })
        .catch(console.error);
    }
  }, [jobId, user, authFetch]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="inline-block w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 mt-2">
          {lang === 'am' ? 'የስራው ዝርዝር በመጫን ላይ...' : 'Loading job details...'}
        </p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
        <h3 className="text-base font-bold text-slate-800">
          {lang === 'am' ? 'የስራ ማስታወቂያው አልተገኘም' : 'Job Posting Not Found'}
        </h3>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
        >
          {lang === 'am' ? 'ወደ ስራዎች ተመለስ' : 'Back to Jobs'}
        </button>
      </div>
    );
  }

  const formatSalary = () => {
    if (job.isNegotiableSalary || (!job.salaryMin && !job.salaryMax)) {
      return lang === 'am' ? 'በስምምነት የሚወሰን' : 'Negotiable Salary';
    }
    const min = job.salaryMin ? `${job.salaryMin.toLocaleString()}` : '';
    const max = job.salaryMax ? `${job.salaryMax.toLocaleString()}` : '';
    const currency = lang === 'am' ? 'ብር' : 'ETB';

    if (min && max) {
      return `${min} - ${max} ${currency} / ${lang === 'am' ? 'በወር' : 'month'}`;
    }
    return `${min || max} ${currency} / ${lang === 'am' ? 'በወር' : 'month'}`;
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleApplyClick = () => {
    if (!user) {
      openAuthModal();
      return;
    }
    setShowApplyModal(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-24 animate-in fade-in">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-200 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{lang === 'am' ? 'ወደ ስራዎች ዝርዝር ተመለስ' : 'Back to Jobs'}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? (lang === 'am' ? 'ሊንኩ ተቀድቷል' : 'Copied!') : t('share')}</span>
          </button>

          <button
            onClick={() => onToggleSave && onToggleSave(job.id)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
              isSaved
                ? 'bg-orange-50 border-orange-300 text-[#FF6B00]'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-[#FF6B00]' : ''}`} />
            <span>{isSaved ? t('saved') : t('saveJob')}</span>
          </button>
        </div>
      </div>

      {/* Main Job Banner Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-7 shadow-sm border border-slate-200 mb-6">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {job.companyLogo ? (
              <img
                src={job.companyLogo}
                alt={job.companyName}
                className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-xs"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-600">
                <Building2 className="w-8 h-8" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-slate-800">{job.companyName}</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3 fill-blue-600 text-white" />
                  <span>{t('verifiedEmployer')}</span>
                </span>
                {job.isFeatured && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    <Flame className="w-3 h-3 fill-amber-500 text-amber-600" />
                    <span>{lang === 'am' ? 'ልዩ የስራ ማስታወቂያ' : 'Featured Job'}</span>
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                {job.title}
              </h1>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{job.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <span>{job.category}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="capitalize">{job.employmentType.replace('_', ' ')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Apply Button in Header */}
          <div className="w-full sm:w-auto flex-shrink-0">
            {hasApplied ? (
              <div className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200 flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{t('alreadyApplied')}</span>
              </div>
            ) : (
              <button
                onClick={handleApplyClick}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF6B00] to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black text-sm shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition"
              >
                <Send className="w-4 h-4" />
                <span>{t('applyNow')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Highlights Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              {t('salary')}
            </span>
            <span className="font-extrabold text-slate-900 text-xs sm:text-sm text-emerald-700 mt-0.5 block">
              {formatSalary()}
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              {t('deadline')}
            </span>
            <span className="font-extrabold text-slate-900 text-xs sm:text-sm mt-0.5 block">
              {job.applicationDeadline}
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              {t('postedDate')}
            </span>
            <span className="font-extrabold text-slate-900 text-xs sm:text-sm mt-0.5 block">
              {new Date(job.createdAt).toLocaleDateString()}
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              {lang === 'am' ? 'እይታ / አመልካች' : 'Views & Applicants'}
            </span>
            <span className="font-extrabold text-slate-900 text-xs sm:text-sm mt-0.5 block">
              {job.viewsCount || 1} {lang === 'am' ? 'እይታ' : 'views'} • {job.applicationsCount || 0} {lang === 'am' ? 'ማመልከቻ' : 'applied'}
            </span>
          </div>
        </div>

        {/* Anti-Fraud Protection Notice */}
        <div className="mt-4 p-3.5 bg-amber-50/90 rounded-xl border border-amber-200/90 flex items-start gap-3 text-xs text-amber-900">
          <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-black text-amber-950">
              {lang === 'am' ? 'የስራ ፈላጊዎች የደህንነት ጥበቃ፡ ' : 'Job Seeker Safe Hiring Guarantee: '}
            </span>
            <span>
              {lang === 'am'
                ? 'በዋስ ስራ ላይ ስራ መፈለግ እና ማመልከት 100% ነፃ ነው። ማንኛውም አሰሪ ለቃለ-መጠይቅ፣ ለመመዝገቢያ ወይም ለዩኒፎርም በሚል በቴሌብርም ሆነ በባንክ በቅድሚያ ክፍያ እንዲከፍሉ ከጠየቀ አጭበርባሪ በመሆኑ አይክፈሉ፤ ወዲያውኑ ሪፖርት ያድርጉ።'
                : 'Applying on WAS Jobs is 100% free. Legitimate employers never request advance fees for interviews or uniforms via Telebirr/Bank. Report suspicious activity immediately.'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Main Details & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Job Description & Qualifications */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Description */}
          <div className="bg-white rounded-2xl p-5 sm:p-7 shadow-sm border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF6B00]" />
              <span>{t('jobDescription')}</span>
            </h2>
            <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line space-y-2">
              {job.description}
            </div>
          </div>

          {/* Required Qualifications */}
          <div className="bg-white rounded-2xl p-5 sm:p-7 shadow-sm border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF6B00]" />
              <span>{t('qualifications')}</span>
            </h2>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700">
              {job.requiredQualifications && job.requiredQualifications.length > 0 ? (
                job.requiredQualifications.map((reqQual, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>{reqQual}</span>
                  </li>
                ))
              ) : (
                <li className="text-slate-500">
                  {lang === 'am' ? 'ተዛማጅ የስራ ልምድ እና ተነሳሽነት።' : 'Relevant field experience and enthusiasm.'}
                </li>
              )}
            </ul>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-2xl p-5 sm:p-7 shadow-sm border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 mb-3">
              {lang === 'am' ? 'የአሰሪው አድራሻ እና የስልክ መረጃ' : 'Employer Contact Information'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <Mail className="w-4 h-4 text-orange-500" />
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">{t('email')}</span>
                  <span className="font-semibold text-slate-800">{job.contactEmail}</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <Phone className="w-4 h-4 text-orange-500" />
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">{t('phone')}</span>
                  <span className="font-semibold text-slate-800">{job.contactPhone}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Company Profile & Action Card */}
        <div className="space-y-6">
          {/* Apply Card */}
          <div className="bg-gradient-to-br from-[#0B192C] to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800">
            <h3 className="font-bold text-base text-white mb-2">
              {lang === 'am' ? 'ይህን ስራ ለመቀላቀል ዝግጁ ኖት?' : 'Ready to Take This Opportunity?'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              {lang === 'am'
                ? 'ሲቪዎን (CV) በማያያዝ ማመልከቻዎን በቀጥታ ወደ አሰሪው ድርጅት ይላኩ።'
                : 'Submit your resume directly to the employer review committee.'}
            </p>

            {hasApplied ? (
              <div className="w-full py-2.5 rounded-xl bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-center font-bold text-xs flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('alreadyApplied')}</span>
              </div>
            ) : (
              <button
                onClick={handleApplyClick}
                className="w-full py-3 rounded-xl bg-[#FF6B00] hover:bg-orange-600 text-white font-black text-xs shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 transition"
              >
                <Send className="w-4 h-4" />
                <span>{t('applyNow')}</span>
              </button>
            )}

            <div className="mt-4 pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
              <span>{lang === 'am' ? 'አሰሪው በቀጥታ ያገኝዎታል' : 'Direct Employer Review'}</span>
              <span>100% Free</span>
            </div>
          </div>

          {/* About Company Card */}
          {company && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-3">
              <h3 className="font-bold text-sm text-slate-900">{t('aboutCompany')}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {company.description}
              </p>
              <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-400">{lang === 'am' ? 'ዘርፍ፡' : 'Industry:'}</span>
                  <span className="font-semibold text-slate-800">{company.industry}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{lang === 'am' ? 'ዋና መስሪያ ቤት፡' : 'HQ:'}</span>
                  <span className="font-semibold text-slate-800">{company.location}</span>
                </div>
                {company.website && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">{lang === 'am' ? 'ድረ-ገጽ፡' : 'Website:'}</span>
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-[#FF6B00] hover:underline truncate max-w-[150px]"
                    >
                      {company.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Report Button */}
          <div className="text-center">
            <button
              onClick={() => setShowReportModal(true)}
              className="text-xs text-slate-400 hover:text-red-500 flex items-center justify-center gap-1.5 mx-auto transition"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>{t('reportJob')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ApplyModal
        job={job}
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        onSuccess={() => {
          setHasApplied(true);
        }}
      />

      <ReportModal
        job={job}
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />
    </div>
  );
};
