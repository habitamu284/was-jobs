import React, { useState, useEffect, useCallback } from 'react';
import {
  Briefcase,
  TrendingUp,
  Building,
  Users,
  Sparkles,
  Flame,
  CheckCircle2,
  RefreshCw,
  Search,
} from 'lucide-react';
import { Job } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { safeJsonFetch } from '../utils/api.ts';
import { JobCard } from '../components/JobCard.tsx';
import { JobFilters } from '../components/JobFilters.tsx';

interface JobsListProps {
  onSelectJob: (job: Job) => void;
  openAuthModal: () => void;
  openPostJob: () => void;
}

export const JobsList: React.FC<JobsListProps> = ({
  onSelectJob,
  openAuthModal,
  openPostJob,
}) => {
  const { lang, t } = useLanguage();
  const { user, authFetch } = useAuth();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedType, setSelectedType] = useState('all');
  const [minSalary, setMinSalary] = useState<number>(0);

  // Fetch jobs
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (selectedCategory !== 'All') params.set('category', selectedCategory);
      if (selectedLocation !== 'All') params.set('location', selectedLocation);
      if (selectedType !== 'all') params.set('type', selectedType);
      if (minSalary > 0) params.set('minSalary', minSalary.toString());

      const res = await fetch(`/api/jobs?${params.toString()}`);
      const parsed = await safeJsonFetch<{ jobs: Job[] }>(res);
      setJobs(parsed.data?.jobs || []);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedLocation, selectedType, minSalary]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchJobs();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchJobs]);

  // Fetch saved jobs for the user
  useEffect(() => {
    if (user) {
      authFetch('/api/saved-jobs')
        .then((res) => safeJsonFetch<{ savedIds: string[] }>(res))
        .then((parsed) => {
          if (parsed.data?.savedIds) setSavedJobIds(parsed.data.savedIds);
        })
        .catch(console.error);
    } else {
      setSavedJobIds([]);
    }
  }, [user, authFetch]);

  const handleToggleSave = async (jobId: string) => {
    if (!user) {
      openAuthModal();
      return;
    }
    // Optimistic toggle
    setSavedJobIds((prev) =>
      prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]
    );

    try {
      await authFetch(`/api/saved-jobs/${jobId}`, { method: 'POST' });
    } catch (err) {
      console.error('Toggle save error:', err);
      // Revert if error
      setSavedJobIds((prev) =>
        prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]
      );
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedLocation('All');
    setSelectedType('all');
    setMinSalary(0);
  };

  const featuredJobs = jobs.filter((j) => j.isFeatured);

  return (
    <div className="pb-24">
      {/* Ethiopian Themed Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0B192C] via-[#0F223D] to-[#0B192C] text-white pt-8 pb-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700/80 text-xs font-semibold text-amber-400 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#FF6B00]" />
            <span>{t('brandTagline')}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            {t('heroTitle')}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {t('heroSubtitle')}
          </p>

          {/* Quick Stats Pills */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-300 font-medium">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/10">
              <Building className="w-3.5 h-3.5 text-orange-400" />
              <span>{lang === 'am' ? 'ከ150+ የተረጋገጡ አሰሪዎች' : '150+ Verified Employers'}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/10">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === 'am' ? 'ቀጥታ የሲቪ ማመልከቻ' : 'Direct CV Applications'}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/10">
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
              <span>{lang === 'am' ? 'በቴሌኮም እና በባንክ ክፍት ስራዎች' : 'Telecom & Banking Vacancies'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {/* Filters Box */}
        <JobFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedLocation={selectedLocation}
          setSelectedLocation={setSelectedLocation}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          minSalary={minSalary}
          setMinSalary={setMinSalary}
          onReset={handleResetFilters}
        />

        {/* Featured Section */}
        {featuredJobs.length > 0 && selectedCategory === 'All' && !searchQuery && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-[#FF6B00] fill-[#FF6B00]" />
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  {lang === 'am' ? 'ልዩ የስራ ማስታወቂያዎች' : 'Featured Job Opportunities'}
                </h2>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {featuredJobs.length} {lang === 'am' ? 'ስራዎች' : 'jobs'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  isSaved={savedJobIds.includes(job.id)}
                  onToggleSave={handleToggleSave}
                  onSelect={onSelectJob}
                />
              ))}
            </div>
          </div>
        )}

        {/* All Jobs Stream */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-slate-700" />
                <span>
                  {searchQuery || selectedCategory !== 'All' || selectedLocation !== 'All'
                    ? lang === 'am'
                      ? 'የፍለጋ ውጤቶች'
                      : 'Search Results'
                    : lang === 'am'
                    ? 'አዳዲስ የስራ ማስታወቂያዎች'
                    : 'All Active Job Postings'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {jobs.length} {lang === 'am' ? 'ክፍት ስራዎች ተገኝተዋል' : 'open vacancies found'}
              </p>
            </div>

            {loading && (
              <div className="flex items-center gap-1.5 text-xs text-orange-600 font-semibold">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{lang === 'am' ? 'በመጫን ላይ...' : 'Updating...'}</span>
              </div>
            )}
          </div>

          {jobs.length === 0 && !loading ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">
                {lang === 'am' ? 'ምንም ስራ አልተገኘም' : 'No matching jobs found'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {lang === 'am'
                  ? 'የፍለጋ ቃላትን ወይም አጣራዎችን በመቀየር እንደገና ይሞክሩ።'
                  : 'Try adjusting your search keywords, location or category filter.'}
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-4 px-4 py-2 bg-[#FF6B00] text-white rounded-xl text-xs font-bold hover:bg-orange-600 transition"
              >
                {t('clearFilters')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  isSaved={savedJobIds.includes(job.id)}
                  onToggleSave={handleToggleSave}
                  onSelect={onSelectJob}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
