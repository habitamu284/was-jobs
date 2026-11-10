import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Briefcase,
  Users,
  PlusCircle,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  Eye,
  Download,
  AlertCircle,
  Save,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  CreditCard,
} from 'lucide-react';
import { Job, Company, JobApplication, ApplicationStatus, JobStatus } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { safeJsonFetch } from '../utils/api.ts';

interface EmployerDashboardProps {
  onPostJob: () => void;
  onSelectJob: (job: Job) => void;
  openPaymentModal: () => void;
}

export const EmployerDashboard: React.FC<EmployerDashboardProps> = ({
  onPostJob,
  onSelectJob,
  openPaymentModal,
}) => {
  const { lang, t } = useLanguage();
  const { user, company, updateCompany, authFetch } = useAuth();

  const [activeTab, setActiveTab] = useState<'jobs' | 'applicants' | 'profile'>('jobs');
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [selectedJobFilter, setSelectedJobFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Applicant Review Drawer / Modal
  const [reviewingApp, setReviewingApp] = useState<JobApplication | null>(null);
  const [updatedStatus, setUpdatedStatus] = useState<ApplicationStatus>('under_review');
  const [employerNotes, setEmployerNotes] = useState('');
  const [updatingAppStatus, setUpdatingAppStatus] = useState(false);
  const [statusUpdateSuccessMsg, setStatusUpdateSuccessMsg] = useState<string | null>(null);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);

  // Edit Company State
  const [companyName, setCompanyName] = useState(company?.companyName || '');
  const [industry, setIndustry] = useState(company?.industry || 'Technology');
  const [location, setLocation] = useState(company?.location || 'Addis Ababa');
  const [website, setWebsite] = useState(company?.website || '');
  const [phone, setPhone] = useState(company?.phone || '');
  const [email, setEmail] = useState(company?.email || '');
  const [description, setDescription] = useState(company?.description || '');
  const [tinNumber, setTinNumber] = useState(company?.tinNumber || '');
  const [savingCompany, setSavingCompany] = useState(false);
  const [companySaveMsg, setCompanySaveMsg] = useState<string | null>(null);
  const [companySaveErrorMsg, setCompanySaveErrorMsg] = useState<string | null>(null);

  const fetchEmployerData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/jobs?employerOnly=true');
      const parsed = await safeJsonFetch<{ jobs: Job[] }>(res);
      if (parsed.ok && parsed.data) {
        setMyJobs(parsed.data.jobs || []);

        // Also fetch all applications for employer's jobs
        const jobIds = (parsed.data.jobs || []).map((j: Job) => j.id);
        const appsPromises = jobIds.map((id: string) =>
          authFetch(`/api/applications/job/${id}`)
            .then((r) => safeJsonFetch<{ applications: JobApplication[] }>(r))
            .then((p) => p.data?.applications || [])
        );
        const appsResults = await Promise.all(appsPromises);
        const allEmployerApps: JobApplication[] = [];
        appsResults.forEach((apps) => {
          if (apps) allEmployerApps.push(...apps);
        });
        setApplications(allEmployerApps);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchEmployerData();
  }, [fetchEmployerData]);

  // Handle Job Status Toggle (Active, Paused, Closed)
  const handleJobStatusChange = async (jobId: string, newStatus: JobStatus) => {
    try {
      const res = await authFetch(`/api/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setMyJobs((prev) =>
          prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Job Post
  const executeDeleteJob = async (jobId: string) => {
    try {
      const res = await authFetch(`/api/jobs/${jobId}`, { method: 'DELETE' });
      if (res.ok) {
        setMyJobs((prev) => prev.filter((j) => j.id !== jobId));
        setApplications((prev) => prev.filter((a) => a.jobId !== jobId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingJobId(null);
    }
  };

  // Save Company Profile
  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCompany(true);
    setCompanySaveMsg(null);
    const res = await updateCompany({
      companyName,
      industry,
      location,
      website,
      phone,
      email,
      description,
      tinNumber,
    });
    setSavingCompany(false);
    if (res.success) {
      setCompanySaveMsg(lang === 'am' ? 'የድርጅቱ መረጃ በተሳካ ሁኔታ ተቀምጧል!' : 'Company profile saved successfully!');
      setCompanySaveErrorMsg(null);
    } else {
      setCompanySaveErrorMsg(res.error || 'Failed to update company');
      setCompanySaveMsg(null);
    }
  };

  // Update applicant status
  const handleUpdateApplicantStatus = async () => {
    if (!reviewingApp) return;
    setUpdatingAppStatus(true);
    setStatusUpdateSuccessMsg(null);
    try {
      const res = await authFetch(`/api/applications/${reviewingApp.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: updatedStatus,
          employerNotes,
        }),
      });
      const parsed = await safeJsonFetch<{ application: JobApplication }>(res);
      if (parsed.ok && parsed.data) {
        const updated = parsed.data.application;
        setApplications((prev) =>
          prev.map((a) => (a.id === reviewingApp.id ? updated : a))
        );
        setReviewingApp(updated);
        setStatusUpdateSuccessMsg(lang === 'am' ? 'የአመልካቹ ሁኔታ ተዘምኗል! ማሳወቂያ ለስራ ፈላጊው ተልኳል።' : 'Status updated! Notification sent to applicant.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingAppStatus(false);
    }
  };

  const filteredApplications =
    selectedJobFilter === 'all'
      ? applications
      : applications.filter((a) => a.jobId === selectedJobFilter);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24 animate-in fade-in">
      {/* Top Company Header Card */}
      <div className="bg-[#0B192C] text-white rounded-2xl p-6 mb-6 shadow-md border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#FF6B00] to-amber-500 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white">
                {company?.companyName || user?.fullName}
              </h1>
              {company?.verified ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 bg-blue-900/50 px-2 py-0.5 rounded-full border border-blue-400/30">
                  <CheckCircle2 className="w-3.5 h-3.5 fill-blue-500 text-white" />
                  <span>{lang === 'am' ? 'የተረጋገጠ አሰሪ' : 'Verified'}</span>
                </span>
              ) : (
                <button
                  onClick={openPaymentModal}
                  className="text-[10px] text-amber-400 bg-amber-950/60 hover:bg-amber-900 px-2 py-0.5 rounded-full border border-amber-500/40 font-semibold transition"
                >
                  {lang === 'am' ? '+ እውቅና ያግኙ (Badge)' : '+ Get Verified'}
                </button>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {company?.industry || 'Ethiopian Enterprise'} • {company?.location || 'Addis Ababa'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={openPaymentModal}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-amber-500/30 flex items-center gap-1.5 transition"
          >
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <span>{lang === 'am' ? 'የኮሚሽን ክፍያ (CBE/ቴሌብር)' : 'Pay Commission (CBE/Telebirr)'}</span>
          </button>

          <button
            onClick={onPostJob}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B00] to-orange-600 hover:from-orange-600 text-white font-bold text-xs shadow-lg shadow-orange-500/20 flex items-center gap-2 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('postNewJobBtn')}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 text-xs sm:text-sm font-bold">
        <button
          onClick={() => setActiveTab('jobs')}
          className={`pb-3 px-4 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'jobs'
              ? 'border-[#FF6B00] text-[#FF6B00]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>{t('activeJobsTab')} ({myJobs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('applicants')}
          className={`pb-3 px-4 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'applicants'
              ? 'border-[#FF6B00] text-[#FF6B00]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{t('applicantsTab')} ({applications.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 px-4 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'border-[#FF6B00] text-[#FF6B00]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>{t('companyProfileTab')}</span>
        </button>
      </div>

      {/* TAB 1: Posted Jobs */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          {myJobs.length === 0 && !loading ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">
                {lang === 'am' ? 'እስካሁን ምንም ስራ አልለጠፉም' : 'No jobs posted yet'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {lang === 'am'
                  ? 'የመጀመሪያውን ክፍት የስራ ማስታወቂያ በመለጠፍ ብቁ ኢትዮጵያውያን አመልካቾችን ይቀበሉ።'
                  : 'Post your first vacancy to start receiving applicant resumes and profiles.'}
              </p>
              <button
                onClick={onPostJob}
                className="mt-4 px-5 py-2.5 bg-[#FF6B00] text-white rounded-xl text-xs font-bold hover:bg-orange-600 transition"
              >
                {t('postNewJobBtn')}
              </button>
            </div>
          ) : (
            myJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3
                      onClick={() => onSelectJob(job)}
                      className="text-base font-bold text-slate-900 hover:text-[#FF6B00] cursor-pointer"
                    >
                      {job.title}
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        job.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : job.status === 'paused'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span>{job.location}</span>
                    <span>• {job.category}</span>
                    <span>• {job.applicationsCount || 0} {lang === 'am' ? 'አመልካቾች' : 'applicants'}</span>
                    <span>• {lang === 'am' ? 'ማብቂያ፡' : 'Expires:'} {job.applicationDeadline}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {/* Status Toggle */}
                  <select
                    value={job.status}
                    onChange={(e) => handleJobStatusChange(job.id, e.target.value as JobStatus)}
                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                  >
                    <option value="active">Active (ንቁ)</option>
                    <option value="paused">Paused (ለጊዜው ቆም)</option>
                    <option value="closed">Closed (ዝግ)</option>
                  </select>

                  <button
                    onClick={() => {
                      setSelectedJobFilter(job.id);
                      setActiveTab('applicants');
                    }}
                    className="px-3 py-1.5 bg-orange-50 text-[#FF6B00] hover:bg-orange-100 rounded-lg text-xs font-bold transition flex items-center gap-1"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>{lang === 'am' ? 'አመልካቾችን እይ' : 'Applicants'}</span>
                  </button>

                  {deletingJobId === job.id ? (
                    <div className="flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-200">
                      <span className="text-[10px] text-red-700 font-bold px-1">{lang === 'am' ? 'ይሰረዝ?' : 'Delete?'}</span>
                      <button
                        onClick={() => executeDeleteJob(job.id)}
                        className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded hover:bg-red-700 transition"
                      >
                        {lang === 'am' ? 'አዎ' : 'Yes'}
                      </button>
                      <button
                        onClick={() => setDeletingJobId(null)}
                        className="px-1.5 py-0.5 text-slate-600 text-[10px] hover:bg-slate-200 rounded"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeletingJobId(job.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title={lang === 'am' ? 'ስራውን ሰርዝ' : 'Delete job'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: Applicants */}
      {activeTab === 'applicants' && (
        <div className="space-y-4">
          {/* Job Filter selector */}
          <div className="flex items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-700">
              {lang === 'am' ? 'አመልካቾችን በስራ ማስታወቂያ ለይተህ እይ፡' : 'Filter by Job Vacancy:'}
            </span>
            <select
              value={selectedJobFilter}
              onChange={(e) => setSelectedJobFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
            >
              <option value="all">{lang === 'am' ? 'ሁሉም ስራዎች' : 'All Posted Jobs'}</option>
              {myJobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
          </div>

          {filteredApplications.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">
                {lang === 'am' ? 'ምንም አመልካች አልተገኘም' : 'No applicants yet'}
              </h3>
            </div>
          ) : (
            filteredApplications.map((app) => (
              <div
                key={app.id}
                className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{app.seekerName}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize">
                      {app.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-[#FF6B00] font-semibold">{app.jobTitle}</p>
                  <p className="text-xs text-slate-500">
                    {app.seekerEmail} • {app.seekerPhone} • {new Date(app.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Download CV */}
                  {app.cvUrl && (
                    <a
                      href={app.cvUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{lang === 'am' ? 'ሲቪ (CV) አውርድ' : 'View CV'}</span>
                    </a>
                  )}

                  <button
                    onClick={() => {
                      setReviewingApp(app);
                      setUpdatedStatus(app.status);
                      setEmployerNotes(app.employerNotes || '');
                    }}
                    className="px-4 py-1.5 bg-[#FF6B00] hover:bg-orange-600 text-white rounded-lg text-xs font-bold shadow-xs transition"
                  >
                    {lang === 'am' ? 'ገምግም / ሁኔታ ቀይር' : 'Review & Update Status'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Review & Update Status Modal */}
      {reviewingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-[#FF6B00] uppercase">
                  {reviewingApp.jobTitle}
                </span>
                <h3 className="text-lg font-bold text-slate-900">{reviewingApp.seekerName}</h3>
                <p className="text-xs text-slate-500">
                  {reviewingApp.seekerEmail} • {reviewingApp.seekerPhone}
                </p>
              </div>
              <button
                onClick={() => setReviewingApp(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {statusUpdateSuccessMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{statusUpdateSuccessMsg}</span>
              </div>
            )}

            {/* Candidate Cover Letter */}
            {reviewingApp.coverLetter && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="font-bold text-slate-700 block mb-1">
                  {lang === 'am' ? 'የአመልካቹ ማብራሪያ (Cover Letter):' : 'Candidate Pitch / Cover Letter:'}
                </span>
                <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                  {reviewingApp.coverLetter}
                </p>
              </div>
            )}

            {/* Candidate CV Link */}
            {reviewingApp.cvUrl && (
              <div className="flex items-center justify-between p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-xs">
                <span className="font-semibold text-blue-900">
                  {reviewingApp.cvOriginalName || 'Candidate_CV.pdf'}
                </span>
                <a
                  href={reviewingApp.cvUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CV</span>
                </a>
              </div>
            )}

            {/* Status Selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {lang === 'am' ? 'የማመልከቻውን ሁኔታ ይወስኑ' : 'Update Application Status'}
              </label>
              <select
                value={updatedStatus}
                onChange={(e) => setUpdatedStatus(e.target.value as ApplicationStatus)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
              >
                <option value="pending">Pending (በመጠባበቅ ላይ)</option>
                <option value="under_review">Under Review (በግምገማ ላይ)</option>
                <option value="shortlisted">Shortlisted (በእጩነት ተመርጧል)</option>
                <option value="interviewing">Interview Scheduled (ለቃለ-መጠይቅ ተጠርቷል)</option>
                <option value="hired">Hired / Offer (ተቀጥረዋል)</option>
                <option value="rejected">Not Selected (አልተመረጠም)</option>
              </select>
            </div>

            {/* Employer Notes */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {lang === 'am' ? 'ለአመልካቹ የሚላክ ማስታወሻ / አስተያየት' : 'Note / Feedback for Candidate'}
              </label>
              <textarea
                rows={3}
                value={employerNotes}
                onChange={(e) => setEmployerNotes(e.target.value)}
                placeholder={
                  lang === 'am'
                    ? 'ለምሳሌ፡ የቃለ-መጠይቅ ቀን ማክሰኞ 4 ሰዓት በቴሌግራም/ስልክ ይደወልልዎታል።'
                    : 'e.g. You have been selected for interview on Tuesday 10:00 AM at Bole office.'
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setReviewingApp(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                disabled={updatingAppStatus}
                onClick={handleUpdateApplicantStatus}
                className="px-5 py-2 bg-[#FF6B00] hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
              >
                {updatingAppStatus ? 'Updating...' : (lang === 'am' ? 'ሁኔታውን አዘምን' : 'Save & Notify Candidate')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Company Profile */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveCompany} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              {lang === 'am' ? 'የድርጅት መረጃ እና ህጋዊ ምዝገባ' : 'Company Information & TIN Registration'}
            </h2>
            <div className="flex items-center gap-2">
              {companySaveMsg && (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{companySaveMsg}</span>
                </span>
              )}
              {companySaveErrorMsg && (
                <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{companySaveErrorMsg}</span>
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {lang === 'am' ? 'የድርጅት ስም' : 'Company Legal Name'} *
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {lang === 'am' ? 'የንግድ ዘርፍ' : 'Industry'}
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {lang === 'am' ? 'ዋና መስሪያ ቤት አድራሻ' : 'Headquarters Location'}
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {lang === 'am' ? 'የግብር ከፋይ መለያ (TIN Number)' : 'Tax Identification Number (TIN)'}
              </label>
              <input
                type="text"
                value={tinNumber}
                onChange={(e) => setTinNumber(e.target.value)}
                placeholder="0001234567"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {lang === 'am' ? 'ስልክ ቁጥር' : 'Official Phone'}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {lang === 'am' ? 'ኦፊሴላዊ ድረ-ገጽ' : 'Website'}
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://company.et"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              {lang === 'am' ? 'ስለ ድርጅቱ አጭር መግለጫ' : 'Company Overview'}
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingCompany}
              className="px-6 py-2.5 bg-[#FF6B00] hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{savingCompany ? 'Saving...' : (lang === 'am' ? 'መረጃውን አስቀምጥ' : 'Save Company Profile')}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
