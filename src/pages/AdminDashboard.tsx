import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Briefcase,
  Users,
  CheckCircle2,
  XCircle,
  Flame,
  Trash2,
  Flag,
  CreditCard,
  Building2,
  TrendingUp,
  FileText,
  AlertTriangle,
  RefreshCw,
  Search,
} from 'lucide-react';
import { Job, User, JobReport, JobStatus, PaymentTransaction } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { safeJsonFetch } from '../utils/api.ts';

interface AdminDashboardProps {
  openPaymentModal: () => void;
  onSelectJob: (job: Job) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  openPaymentModal,
  onSelectJob,
}) => {
  const { lang, t } = useLanguage();
  const { user, authFetch } = useAuth();

  const [activeTab, setActiveTab] = useState<'metrics' | 'jobs' | 'users' | 'reports' | 'commissions'>('metrics');
  const [stats, setStats] = useState<any>(null);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allReports, setAllReports] = useState<JobReport[]>([]);
  const [allPayments, setAllPayments] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentActionMsg, setPaymentActionMsg] = useState<string | null>(null);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);

  // Search & Filters
  const [jobSearch, setJobSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, jobsRes, usersRes, reportsRes, paymentsRes] = await Promise.all([
        authFetch('/api/admin/stats'),
        authFetch('/api/jobs?status=all'),
        authFetch('/api/users/admin-list'),
        authFetch('/api/reports'),
        authFetch('/api/payments/admin-transactions'),
      ]);

      const [statsParsed, jobsParsed, usersParsed, reportsParsed, paymentsParsed] = await Promise.all([
        safeJsonFetch<any>(statsRes),
        safeJsonFetch<{ jobs: Job[] }>(jobsRes),
        safeJsonFetch<{ users: User[] }>(usersRes),
        safeJsonFetch<{ reports: JobReport[] }>(reportsRes),
        safeJsonFetch<{ transactions: PaymentTransaction[] }>(paymentsRes),
      ]);

      if (statsParsed.ok && statsParsed.data) setStats(statsParsed.data);
      if (jobsParsed.ok && jobsParsed.data?.jobs) setAllJobs(jobsParsed.data.jobs);
      if (usersParsed.ok && usersParsed.data?.users) setAllUsers(usersParsed.data.users);
      if (reportsParsed.ok && reportsParsed.data?.reports) setAllReports(reportsParsed.data.reports);
      if (paymentsParsed.ok && paymentsParsed.data?.transactions) setAllPayments(paymentsParsed.data.transactions);
    } catch (err) {
      // Gracefully handle transient network errors
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  const handleVerifyPayment = async (paymentId: string, status: 'verified' | 'rejected') => {
    const adminNotes = status === 'rejected'
      ? (lang === 'am' ? 'የባንክ/ቴሌብር ማረጋገጫ አልተገኘም ወይም ትክክል አይደለም።' : 'Transaction reference not found in bank records.')
      : (lang === 'am' ? 'በሀብታሙ ጌታቸው ይፋዊ ሒሳብ ገቢ መሆኑ ተረጋግጧል።' : 'Confirmed received in Habitamu Getachew verified account.');
    try {
      const res = await authFetch(`/api/payments/${paymentId}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNotes }),
      });
      const parsed = await safeJsonFetch<{ transaction: PaymentTransaction }>(res);
      if (parsed.ok && parsed.data) {
        const updated = parsed.data.transaction;
        setAllPayments((prev) =>
          prev.map((p) => (p.id === paymentId ? updated : p))
        );
        setPaymentActionMsg(
          status === 'verified'
            ? lang === 'am'
              ? 'ክፍያው በተሳካ ሁኔታ ተረጋግጧል! ማሳወቂያ ለከፋዩ ተልኳል።'
              : 'Payment verified and approved! Payer notified.'
            : lang === 'am'
            ? 'ክፍያው ውድቅ ተደርጓል።'
            : 'Payment rejected.'
        );
        setTimeout(() => setPaymentActionMsg(null), 5000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  // Job Moderation Handlers
  const handleJobStatus = async (jobId: string, status: JobStatus) => {
    try {
      const res = await authFetch(`/api/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setAllJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status } : j)));
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleFeatured = async (jobId: string, currentFeatured: boolean) => {
    try {
      const res = await authFetch(`/api/jobs/${jobId}/featured`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !currentFeatured }),
      });
      if (res.ok) {
        setAllJobs((prev) =>
          prev.map((j) => (j.id === jobId ? { ...j, isFeatured: !currentFeatured } : j))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const executeDeleteJob = async (jobId: string) => {
    try {
      const res = await authFetch(`/api/jobs/${jobId}`, { method: 'DELETE' });
      if (res.ok) {
        setAllJobs((prev) => prev.filter((j) => j.id !== jobId));
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingJobId(null);
    }
  };

  // Report Resolution
  const handleResolveReport = async (reportId: string, status: 'resolved' | 'dismissed') => {
    try {
      const res = await authFetch(`/api/reports/${reportId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setAllReports((prev) =>
          prev.map((r) => (r.id === reportId ? { ...r, status } : r))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filtered jobs
  const filteredJobs = allJobs.filter(
    (j) =>
      j.title.toLowerCase().includes(jobSearch.toLowerCase()) ||
      j.companyName.toLowerCase().includes(jobSearch.toLowerCase()) ||
      j.location.toLowerCase().includes(jobSearch.toLowerCase())
  );

  // Filtered users
  const filteredUsers = allUsers.filter(
    (u) =>
      u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.companyName && u.companyName.toLowerCase().includes(userSearch.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 animate-in fade-in">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-[#0B192C] via-slate-900 to-[#0B192C] text-white rounded-2xl p-6 mb-6 shadow-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
            <Shield className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                Platform Administrator
              </span>
              <span className="text-xs text-amber-300 font-mono">
                {user?.email || 'habitegechewe@gmail.com'}
              </span>
            </div>
            <h1 className="text-xl font-black text-white mt-1">
              {t('adminTitle')}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAdminData}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={openPaymentModal}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition"
          >
            <CreditCard className="w-4 h-4" />
            <span>{lang === 'am' ? 'የክፍያዎች ሞጁል' : 'Ethiopian Payments Hub'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 text-xs sm:text-sm font-bold">
        <button
          onClick={() => setActiveTab('metrics')}
          className={`pb-3 px-4 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'metrics'
              ? 'border-[#FF6B00] text-[#FF6B00]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>{lang === 'am' ? 'ስታቲስቲክስ እና አጠቃላይ እይታ' : 'Platform Analytics'}</span>
        </button>

        <button
          onClick={() => setActiveTab('jobs')}
          className={`pb-3 px-4 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'jobs'
              ? 'border-[#FF6B00] text-[#FF6B00]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>{t('tabAllJobs')} ({allJobs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-4 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'users'
              ? 'border-[#FF6B00] text-[#FF6B00]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{t('tabUsers')} ({allUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3 px-4 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'reports'
              ? 'border-[#FF6B00] text-[#FF6B00]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Flag className="w-4 h-4" />
          <span>{t('tabReports')} ({allReports.filter((r) => r.status === 'pending').length} new)</span>
        </button>

        <button
          onClick={() => setActiveTab('commissions')}
          className={`pb-3 px-4 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'commissions'
              ? 'border-[#FF6B00] text-[#FF6B00]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4 text-emerald-500" />
          <span>
            {lang === 'am' ? 'የኮሚሽን ክፍያዎች' : 'Commission Payments'} (
            {allPayments.filter((p) => p.status === 'pending_verification').length}{' '}
            {lang === 'am' ? 'አዲስ' : 'pending'})
          </span>
        </button>
      </div>

      {/* TAB 1: Metrics Overview */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                {t('statTotalJobs')}
              </span>
              <span className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 block">
                {stats?.metrics?.totalJobs || allJobs.length}
              </span>
              <span className="text-xs text-emerald-600 font-bold mt-1 block">
                {stats?.metrics?.activeJobs || allJobs.filter((j) => j.status === 'active').length} Active
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                {t('statUsers')}
              </span>
              <span className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 block">
                {stats?.metrics?.totalUsers || allUsers.length}
              </span>
              <span className="text-xs text-slate-500 font-medium mt-1 block">
                {stats?.metrics?.totalSeekers || allUsers.filter((u) => u.role === 'seeker').length} Seekers • {stats?.metrics?.totalEmployers || allUsers.filter((u) => u.role === 'employer').length} Employers
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                {t('statApplications')}
              </span>
              <span className="text-2xl sm:text-3xl font-black text-[#FF6B00] mt-1 block">
                {stats?.metrics?.totalApplications || 0}
              </span>
              <span className="text-xs text-slate-500 font-medium mt-1 block">
                {stats?.metrics?.shortlistedApps || 0} Shortlisted / Interviewing
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                {lang === 'am' ? 'ሪፖርቶች / ጥቆማዎች' : 'Reports & Queries'}
              </span>
              <span className="text-2xl sm:text-3xl font-black text-amber-600 mt-1 block">
                {allReports.length}
              </span>
              <span className="text-xs text-slate-500 font-medium mt-1 block">
                {allReports.filter((r) => r.status === 'pending').length} Pending Review
              </span>
            </div>
          </div>

          {/* Breakdown Charts / Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="font-bold text-sm text-slate-900 mb-3">
                {lang === 'am' ? 'የስራ ማስታወቂያዎች በዘርፍ' : 'Jobs by Category'}
              </h3>
              <div className="space-y-2 text-xs">
                {stats?.categoryStats &&
                  Object.entries(stats.categoryStats).map(([cat, count]: any) => (
                    <div key={cat} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                      <span className="font-semibold text-slate-800">{cat}</span>
                      <span className="font-bold text-[#FF6B00] bg-orange-50 px-2 py-0.5 rounded">
                        {count} {lang === 'am' ? 'ስራዎች' : 'postings'}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Location Distribution */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="font-bold text-sm text-slate-900 mb-3">
                {lang === 'am' ? 'የስራ ማስታወቂያዎች በከተማ / በክልል' : 'Jobs by Location'}
              </h3>
              <div className="space-y-2 text-xs">
                {stats?.locationStats &&
                  Object.entries(stats.locationStats).map(([loc, count]: any) => (
                    <div key={loc} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                      <span className="font-semibold text-slate-800">{loc}</span>
                      <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {count} {lang === 'am' ? 'ስራዎች' : 'postings'}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Jobs Moderation */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={jobSearch}
              onChange={(e) => setJobSearch(e.target.value)}
              placeholder={lang === 'am' ? 'በስራ መጠሪያ፣ በድርጅት ወይም በቦታ ፈልግ...' : 'Filter jobs by title, company, or city...'}
              className="w-full text-xs bg-transparent focus:outline-hidden"
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">{lang === 'am' ? 'ስራ እና ድርጅት' : 'Job & Company'}</th>
                    <th className="p-3.5">{lang === 'am' ? 'ዘርፍ' : 'Category'}</th>
                    <th className="p-3.5">{lang === 'am' ? 'ቦታ' : 'Location'}</th>
                    <th className="p-3.5">{lang === 'am' ? 'ሁኔታ' : 'Status'}</th>
                    <th className="p-3.5 text-right">{lang === 'am' ? 'እርምጃዎች' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredJobs.map((j) => (
                    <tr key={j.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5">
                        <div
                          onClick={() => onSelectJob(j)}
                          className="font-bold text-slate-900 hover:text-[#FF6B00] cursor-pointer"
                        >
                          {j.title}
                        </div>
                        <div className="text-[11px] text-slate-500">{j.companyName}</div>
                      </td>
                      <td className="p-3.5 text-slate-600">{j.category}</td>
                      <td className="p-3.5 text-slate-600">{j.location}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            j.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700'
                              : j.status === 'pending_approval'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {j.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleFeatured(j.id, j.isFeatured)}
                            className={`p-1.5 rounded-lg border text-xs ${
                              j.isFeatured
                                ? 'bg-amber-50 border-amber-300 text-amber-600'
                                : 'bg-slate-50 border-slate-200 text-slate-400'
                            }`}
                            title="Toggle Featured Highlight"
                          >
                            <Flame className={`w-3.5 h-3.5 ${j.isFeatured ? 'fill-amber-500' : ''}`} />
                          </button>

                          {j.status !== 'active' && (
                            <button
                              onClick={() => handleJobStatus(j.id, 'active')}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold"
                            >
                              Approve
                            </button>
                          )}

                          {j.status === 'active' && (
                            <button
                              onClick={() => handleJobStatus(j.id, 'paused')}
                              className="px-2 py-1 bg-slate-600 hover:bg-slate-700 text-white rounded text-[11px] font-bold"
                            >
                              Pause
                            </button>
                          )}

                          {deletingJobId === j.id ? (
                            <div className="flex items-center gap-1 bg-red-50 p-1 rounded border border-red-200">
                              <span className="text-[10px] text-red-700 font-bold px-1">{lang === 'am' ? 'ይሰረዝ?' : 'Delete?'}</span>
                              <button
                                onClick={() => executeDeleteJob(j.id)}
                                className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded hover:bg-red-700"
                              >
                                {lang === 'am' ? 'አዎ' : 'Yes'}
                              </button>
                              <button
                                onClick={() => setDeletingJobId(null)}
                                className="px-1 text-slate-500 hover:text-slate-800 text-[10px]"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeletingJobId(j.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Users & Employers */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder={lang === 'am' ? 'ተጠቃሚዎችን በስም፣ በኢሜይል ወይም በድርጅት ፈልግ...' : 'Search users by name, email, or company...'}
              className="w-full text-xs bg-transparent focus:outline-hidden"
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">{lang === 'am' ? 'ተጠቃሚ' : 'User'}</th>
                    <th className="p-3.5">{lang === 'am' ? 'የመለያ አይነት (Role)' : 'Role'}</th>
                    <th className="p-3.5">{lang === 'am' ? 'ስልክ እና ከተማ' : 'Phone & Location'}</th>
                    <th className="p-3.5">{lang === 'am' ? 'ሲቪ / ድርጅት' : 'CV / Company'}</th>
                    <th className="p-3.5">{lang === 'am' ? 'የተመዘገበበት' : 'Registered'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{u.fullName}</div>
                        <div className="text-[11px] text-slate-500">{u.email}</div>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            u.role === 'admin'
                              ? 'bg-amber-100 text-amber-800'
                              : u.role === 'employer'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600">
                        <div>{u.phone || 'N/A'}</div>
                        <div className="text-[11px] text-slate-400">{u.location || 'Ethiopia'}</div>
                      </td>
                      <td className="p-3.5">
                        {u.companyName ? (
                          <div className="font-semibold text-slate-800">
                            🏢 {u.companyName}
                          </div>
                        ) : u.cvFileName ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>CV Uploaded</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-500 text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Reports */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {allReports.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">
                {lang === 'am' ? 'ምንም ያልተመለሰ ሪፖርት የለም' : 'All clear! No reports pending'}
              </h3>
            </div>
          ) : (
            allReports.map((rep) => (
              <div
                key={rep.id}
                className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Flag className="w-4 h-4 text-red-500" />
                    <span className="font-bold text-sm text-slate-900">{rep.reason}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        rep.status === 'pending'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {rep.status}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[#FF6B00]">
                    Job: {rep.jobTitle || rep.jobId}
                  </p>
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-1">
                    "{rep.details}"
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Reported on {new Date(rep.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {rep.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleResolveReport(rep.id, 'resolved')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700"
                      >
                        Resolve
                      </button>
                      <button
                        onClick={() => handleResolveReport(rep.id, 'dismissed')}
                        className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-300"
                      >
                        Dismiss
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 5: Commission & Fee Payments Management */}
      {activeTab === 'commissions' && (
        <div className="space-y-6">
          {paymentActionMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center gap-2 font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{paymentActionMsg}</span>
            </div>
          )}

          {/* Verified Official Accounts Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-amber-400" />
              <h3 className="font-extrabold text-sm sm:text-base text-white">
                {lang === 'am'
                  ? 'ይፋዊ የተረጋገጡ የዋስ ስራ መቀበያ ሒሳቦች (ሀብታሙ ጌታቸው)'
                  : 'Official Verified Receiving Accounts (Habitamu Getachew)'}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-black/40 rounded-xl border border-purple-500/30">
                <span className="text-[10px] uppercase font-bold text-purple-300 block">
                  {lang === 'am' ? 'የኢትዮጵያ ንግድ ባንክ (CBE)' : 'Commercial Bank of Ethiopia (CBE)'}
                </span>
                <span className="font-mono text-base font-extrabold text-white mt-0.5 block tracking-wider">
                  1000769746343
                </span>
                <div className="text-[11px] text-purple-200 mt-1 flex justify-between">
                  <span>{lang === 'am' ? 'ተቀባይ ስም፡' : 'Account Name:'}</span>
                  <span className="font-bold text-white">ሀብታሙ ጌታቸው (Habitamu Getachew)</span>
                </div>
              </div>

              <div className="p-3.5 bg-black/40 rounded-xl border border-orange-500/30">
                <span className="text-[10px] uppercase font-bold text-orange-300 block">
                  {lang === 'am' ? 'ቴሌብር (Telebirr - Ethio Telecom)' : 'Telebirr (Ethio Telecom)'}
                </span>
                <span className="font-mono text-base font-extrabold text-white mt-0.5 block tracking-wider">
                  0966087039
                </span>
                <div className="text-[11px] text-orange-200 mt-1 flex justify-between">
                  <span>{lang === 'am' ? 'ተቀባይ ስም፡' : 'Receiver Name:'}</span>
                  <span className="font-bold text-white">ሀብታሙ ጌታቸው (Habitamu Getachew)</span>
                </div>
              </div>
            </div>
          </div>

          {/* List of Submitted Payments */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">
                {lang === 'am' ? 'የተላኩ የኮሚሽን እና የአገልግሎት ክፍያዎች' : 'Submitted Commission & Fee Transactions'}
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {allPayments.length} {lang === 'am' ? 'ግብይቶች' : 'transactions'}
              </span>
            </div>

            {allPayments.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-800">
                  {lang === 'am' ? 'ምንም የክፍያ ማረጋገጫ አልቀረበም' : 'No commission payments submitted yet'}
                </h4>
              </div>
            ) : (
              allPayments.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-base text-slate-900">
                        {p.amount} ETB
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          p.provider === 'cbe_birr'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-orange-100 text-orange-800 border border-orange-200'
                        }`}
                      >
                        {p.provider === 'cbe_birr'
                          ? 'CBE (1000769746343)'
                          : 'Telebirr (0966087039)'}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          p.status === 'verified'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 flex flex-wrap items-center gap-3">
                      <span className="font-bold text-[#FF6B00]">
                        Ref: {p.transactionRef}
                      </span>
                      <span>• {p.payerName} ({p.phone})</span>
                      <span className="capitalize">• {p.purpose.replace('_', ' ')}</span>
                      <span>• {new Date(p.createdAt).toLocaleDateString()}</span>
                    </div>

                    {p.notes && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1">
                        "{p.notes}"
                      </p>
                    )}
                  </div>

                  {/* Actions for Admin */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {p.status !== 'verified' && (
                      <button
                        onClick={() => handleVerifyPayment(p.id, 'verified')}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
                      >
                        {lang === 'am' ? '✓ አረጋግጥ (Approve)' : '✓ Verify & Approve'}
                      </button>
                    )}

                    {p.status !== 'rejected' && (
                      <button
                        onClick={() => handleVerifyPayment(p.id, 'rejected')}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 border border-slate-200 font-bold text-xs transition"
                      >
                        {lang === 'am' ? '✕ ውድቅ አድርግ' : '✕ Reject'}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
