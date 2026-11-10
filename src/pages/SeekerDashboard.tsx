import React, { useState, useEffect } from 'react';
import {
  FileText,
  Bookmark,
  Upload,
  CheckCircle2,
  Clock,
  Building2,
  MapPin,
  Calendar,
  ExternalLink,
  Download,
  AlertCircle,
  X,
  UserCheck,
} from 'lucide-react';
import { JobApplication, Job, ApplicationStatus } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { safeJsonFetch } from '../utils/api.ts';
import { JobCard } from '../components/JobCard.tsx';

interface SeekerDashboardProps {
  initialTab?: 'applications' | 'saved' | 'cv';
  onSelectJob: (job: Job) => void;
}

export const SeekerDashboard: React.FC<SeekerDashboardProps> = ({
  initialTab = 'applications',
  onSelectJob,
}) => {
  const { lang, t } = useLanguage();
  const { user, authFetch, refreshUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'applications' | 'saved' | 'cv'>(initialTab);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const [uploadingCv, setUploadingCv] = useState(false);
  const [cvSuccessMsg, setCvSuccessMsg] = useState<string | null>(null);
  const [cvErrorMsg, setCvErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [appsRes, savedRes] = await Promise.all([
        authFetch('/api/applications/my'),
        authFetch('/api/saved-jobs'),
      ]);

      const [appsParsed, savedParsed] = await Promise.all([
        safeJsonFetch<{ applications: JobApplication[] }>(appsRes),
        safeJsonFetch<{ savedJobs: Job[] }>(savedRes),
      ]);

      if (appsParsed.ok && appsParsed.data?.applications) {
        setApplications(appsParsed.data.applications);
      }

      if (savedParsed.ok && savedParsed.data?.savedJobs) {
        setSavedJobs(savedParsed.data.savedJobs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [authFetch]);

  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setUploadingCv(true);
    setCvSuccessMsg(null);

    const formData = new FormData();
    formData.append('cv', file);

    try {
      const res = await authFetch('/api/users/upload-cv', {
        method: 'POST',
        body: formData,
      });
      const parsed = await safeJsonFetch(res, 'Failed to upload CV');
      if (parsed.ok && parsed.data) {
        setCvSuccessMsg(lang === 'am' ? 'ሲቪዎ በተሳካ ሁኔታ ተጭኗል!' : 'CV uploaded successfully!');
        await refreshUser();
      } else {
        setCvErrorMsg(parsed.error || 'Failed to upload CV');
      }
    } catch (err: any) {
      setCvErrorMsg(err.message || 'Error uploading file');
    } finally {
      setUploadingCv(false);
    }
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    const map: Record<ApplicationStatus, { textAm: string; textEn: string; bg: string; text: string }> = {
      pending: {
        textAm: 'በመጠባበቅ ላይ',
        textEn: 'Pending Review',
        bg: 'bg-slate-100',
        text: 'text-slate-700',
      },
      under_review: {
        textAm: 'በግምገማ ላይ',
        textEn: 'Under Review',
        bg: 'bg-blue-50',
        text: 'text-blue-700',
      },
      shortlisted: {
        textAm: 'በእጩነት ተመርጧል',
        textEn: 'Shortlisted',
        bg: 'bg-amber-50',
        text: 'text-amber-800',
      },
      interviewing: {
        textAm: 'ለቃለ-መጠይቅ ተጠርቷል',
        textEn: 'Interview Scheduled',
        bg: 'bg-purple-50',
        text: 'text-purple-800',
      },
      rejected: {
        textAm: 'አልተመረጠም',
        textEn: 'Not Selected',
        bg: 'bg-red-50',
        text: 'text-red-700',
      },
      hired: {
        textAm: 'ተቀጥረዋል / Offer',
        textEn: 'Hired / Offer',
        bg: 'bg-emerald-50',
        text: 'text-emerald-800',
      },
    };

    const item = map[status] || map.pending;
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${item.bg} ${item.text}`}>
        {lang === 'am' ? item.textAm : item.textEn}
      </span>
    );
  };

  // Helper for tracking steps
  const getStepLevel = (status: ApplicationStatus): number => {
    switch (status) {
      case 'pending':
        return 1;
      case 'under_review':
        return 2;
      case 'shortlisted':
        return 3;
      case 'interviewing':
        return 4;
      case 'hired':
        return 5;
      case 'rejected':
        return -1;
      default:
        return 1;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24 animate-in fade-in">
      {/* Seeker Profile Banner */}
      <div className="bg-[#0B192C] text-white rounded-2xl p-6 mb-6 shadow-md border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#FF6B00] to-amber-500 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div>
            <h1 className="text-xl font-black text-white">{user?.fullName}</h1>
            <p className="text-xs text-slate-300 mt-0.5">
              {user?.title || (lang === 'am' ? 'ስራ ፈላጊ መገለጫ' : 'Job Seeker Profile')} • {user?.location || 'Addis Ababa'}
            </p>
            <p className="text-[11px] text-amber-400 mt-1">
              {applications.length} {lang === 'am' ? 'ማመልከቻዎች' : 'applications sent'} • {savedJobs.length} {lang === 'am' ? 'የተቀመጡ' : 'saved'}
            </p>
          </div>
        </div>

        {/* Quick status summary badge */}
        <div className="bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700 text-xs">
          <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
            {lang === 'am' ? 'የሲቪ (CV) ሁኔታ' : 'Active CV Status'}
          </span>
          <span className="font-bold text-white mt-0.5 flex items-center gap-1.5">
            {user?.cvUrl ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">{lang === 'am' ? 'ሲቪ ተጭኗል' : 'CV Attached'}</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-400">{lang === 'am' ? 'ሲቪ አልተጫነም' : 'No CV'}</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 mb-6 text-xs sm:text-sm font-bold">
        <button
          onClick={() => setActiveTab('applications')}
          className={`pb-3 px-4 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'applications'
              ? 'border-[#FF6B00] text-[#FF6B00]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{t('navApplications')} ({applications.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('saved')}
          className={`pb-3 px-4 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'saved'
              ? 'border-[#FF6B00] text-[#FF6B00]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>{t('navSaved')} ({savedJobs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('cv')}
          className={`pb-3 px-4 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'cv'
              ? 'border-[#FF6B00] text-[#FF6B00]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>{lang === 'am' ? 'የእኔ ሲቪ (CV)' : 'My Resume / CV'}</span>
        </button>
      </div>

      {/* TAB 1: Applications */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {applications.length === 0 && !loading ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">
                {lang === 'am' ? 'እስካሁን ምንም ማመልከቻ አላስገቡም' : 'No applications submitted yet'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {lang === 'am'
                  ? 'ክፍት የስራ ማስታወቂያዎችን ይመልከቱ እና የሚፈልጉትን ስራ አሁኑኑ ያመልክቱ።'
                  : 'Explore available vacancies and submit your first application.'}
              </p>
            </div>
          ) : (
            applications.map((app) => {
              const step = getStepLevel(app.status);
              return (
                <div
                  key={app.id}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4 hover:border-slate-300 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF6B00]">
                        {app.companyName || 'Company'}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-0.5">
                        {app.jobTitle || 'Job Title'}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{app.jobLocation || 'Addis Ababa'}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>
                            {lang === 'am' ? 'የተላከው፡' : 'Applied:'}{' '}
                            {new Date(app.createdAt).toLocaleDateString()}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusBadge(app.status)}
                    </div>
                  </div>

                  {/* Visual Status Progress Tracker */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1.5">
                      <span className={step >= 1 ? 'text-[#FF6B00]' : ''}>
                        1. {lang === 'am' ? 'ተልኳል' : 'Submitted'}
                      </span>
                      <span className={step >= 2 ? 'text-[#FF6B00]' : ''}>
                        2. {lang === 'am' ? 'በግምገማ' : 'Reviewing'}
                      </span>
                      <span className={step >= 3 ? 'text-[#FF6B00]' : ''}>
                        3. {lang === 'am' ? 'እጩ' : 'Shortlisted'}
                      </span>
                      <span className={step >= 4 ? 'text-[#FF6B00]' : ''}>
                        4. {lang === 'am' ? 'ቃለ-መጠይቅ' : 'Interview'}
                      </span>
                      <span className={step >= 5 ? 'text-emerald-600 font-bold' : ''}>
                        5. {lang === 'am' ? 'ቅጥር' : 'Offer'}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          app.status === 'rejected'
                            ? 'bg-red-500 w-full'
                            : 'bg-gradient-to-r from-orange-500 to-emerald-500'
                        }`}
                        style={{
                          width:
                            app.status === 'rejected'
                              ? '100%'
                              : `${Math.max(15, (step / 5) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Employer Notes if provided */}
                  {app.employerNotes && (
                    <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-xs">
                      <span className="font-bold text-amber-900 block mb-0.5">
                        {lang === 'am' ? 'ከአሰሪው የተሰጠ ማስታወሻ / አስተያየት፡' : 'Employer Note:'}
                      </span>
                      <p className="text-amber-800 leading-relaxed">{app.employerNotes}</p>
                    </div>
                  )}

                  {/* Cover letter summary */}
                  {app.coverLetter && (
                    <details className="text-xs text-slate-600">
                      <summary className="cursor-pointer font-bold text-slate-700 hover:text-orange-600">
                        {lang === 'am' ? 'የተላከው የማመልከቻ ደብዳቤ' : 'View Submitted Cover Letter'}
                      </summary>
                      <p className="p-3 bg-slate-50 rounded-xl mt-2 whitespace-pre-line border border-slate-100">
                        {app.coverLetter}
                      </p>
                    </details>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: Saved Jobs */}
      {activeTab === 'saved' && (
        <div>
          {savedJobs.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <Bookmark className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">
                {lang === 'am' ? 'ምንም የተቀመጠ ስራ የለም' : 'No saved jobs yet'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {lang === 'am'
                  ? 'የሚወዷቸውን የስራ ማስታወቂያዎች በምልክት በማስቀመጥ በኋላ ላይ በቀላሉ ያግኙ።'
                  : 'Bookmark jobs you are interested in to apply when you are ready.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  isSaved={true}
                  onToggleSave={async (id) => {
                    await authFetch(`/api/saved-jobs/${id}`, { method: 'POST' });
                    setSavedJobs((prev) => prev.filter((j) => j.id !== id));
                  }}
                  onSelect={onSelectJob}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: My CV & Resume Manager */}
      {activeTab === 'cv' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {lang === 'am' ? 'የሲቪ (CV) እና የስራ ማመልከቻ ሰነዶች አስተዳደር' : 'CV & Resume Management'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'am'
                ? 'የተሟላና ዘመናዊ ሲቪ ማያያዝ የአሰሪዎችን ቀልብ በፍጥነት ለመሳብ ይረዳል።'
                : 'A well-crafted CV increases your interview invitation rate across Ethiopian companies.'}
            </p>
          </div>

          {cvSuccessMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{cvSuccessMsg}</span>
            </div>
          )}

          {cvErrorMsg && (
            <div className="p-3 bg-rose-50 text-rose-800 text-xs rounded-xl border border-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>{cvErrorMsg}</span>
            </div>
          )}

          {/* Current CV Display */}
          {user?.cvUrl ? (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                  PDF
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-900 block truncate max-w-xs">
                    {user.cvOriginalName || 'Curriculum_Vitae.pdf'}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {lang === 'am' ? 'በመለያዎ ላይ የተያያዘ ዝግጁ ሲቪ' : 'Active profile CV ready for 1-click apply'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={user.cvUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{lang === 'am' ? 'አውርድ / እይ' : 'Download'}</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
              {lang === 'am'
                ? 'እስካሁን ምንም ሲቪ (CV) አልጫኑም። እባክዎ ከዚህ በታች ያለውን ሳጥን በመጠቀም ሲቪዎን ይጫኑ።'
                : 'No CV is currently uploaded. Upload your CV below for fast 1-click applications.'}
            </div>
          )}

          {/* Upload New CV Box */}
          <div className="p-6 rounded-2xl border-2 border-dashed border-slate-300 hover:border-orange-400 bg-slate-50 text-center transition">
            <input
              type="file"
              id="dashboard-cv-input"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleCvUpload}
              className="hidden"
            />
            <label
              htmlFor="dashboard-cv-input"
              className="cursor-pointer flex flex-col items-center justify-center gap-2"
            >
              <Upload className="w-8 h-8 text-[#FF6B00]" />
              <span className="text-sm font-bold text-slate-800">
                {uploadingCv
                  ? lang === 'am'
                    ? 'ሲቪው በመጫን ላይ ነው...'
                    : 'Uploading CV...'
                  : lang === 'am'
                  ? 'አዲስ ሲቪ (CV) ለመጫን እዚህ ይጫኑ'
                  : 'Click or drag to upload a new CV'}
              </span>
              <span className="text-xs text-slate-400">
                Supported formats: PDF, DOC, DOCX, TXT (Maximum 10MB)
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
