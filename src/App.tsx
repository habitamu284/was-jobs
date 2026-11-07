import React, { useState } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { NotificationProvider } from './context/NotificationContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { BottomNav } from './components/BottomNav.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { PaymentModal } from './components/PaymentModal.tsx';
import { JobsList } from './pages/JobsList.tsx';
import { JobDetail } from './pages/JobDetail.tsx';
import { PostJob } from './pages/PostJob.tsx';
import { SeekerDashboard } from './pages/SeekerDashboard.tsx';
import { EmployerDashboard } from './pages/EmployerDashboard.tsx';
import { AdminDashboard } from './pages/AdminDashboard.tsx';
import { UserProfile } from './pages/UserProfile.tsx';
import { Job } from './types/index.ts';

function AppContent() {
  const { lang, t } = useLanguage();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<string>('jobs');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const openAuthModal = (mode: 'login' | 'register' | 'forgot' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleSelectJob = (job: Job) => {
    setSelectedJobId(job.id);
    setActiveTab('job-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackFromDetail = () => {
    setSelectedJobId(null);
    setActiveTab('jobs');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'job-detail') setSelectedJobId(null);
        }}
        openAuthModal={openAuthModal}
        openPaymentModal={() => setPaymentModalOpen(true)}
      />

      {/* Main Page Content */}
      <div className="flex-1">
        {activeTab === 'jobs' && (
          <JobsList
            onSelectJob={handleSelectJob}
            openAuthModal={() => openAuthModal('login')}
            openPostJob={() => {
              if (!user) openAuthModal('login');
              else setActiveTab('post-job');
            }}
          />
        )}

        {activeTab === 'job-detail' && selectedJobId && (
          <JobDetail
            jobId={selectedJobId}
            onBack={handleBackFromDetail}
            openAuthModal={() => openAuthModal('login')}
          />
        )}

        {activeTab === 'post-job' && (
          <PostJob
            onSuccess={(jobId) => {
              setSelectedJobId(jobId);
              setActiveTab('job-detail');
            }}
            onCancel={() => setActiveTab('jobs')}
          />
        )}

        {(activeTab === 'applications' || activeTab === 'saved') && (
          <SeekerDashboard
            initialTab={activeTab === 'saved' ? 'saved' : 'applications'}
            onSelectJob={handleSelectJob}
          />
        )}

        {activeTab === 'employer' && (
          <EmployerDashboard
            onPostJob={() => setActiveTab('post-job')}
            onSelectJob={handleSelectJob}
            openPaymentModal={() => setPaymentModalOpen(true)}
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard
            openPaymentModal={() => setPaymentModalOpen(true)}
            onSelectJob={handleSelectJob}
          />
        )}

        {activeTab === 'profile' && <UserProfile />}
      </div>

      {/* Footer */}
      <footer className="bg-[#0B192C] text-slate-400 text-xs border-t border-slate-800 pt-10 pb-20 md:pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#FF6B00] to-amber-500 flex items-center justify-center text-white font-black">
                W
              </div>
              <span className="font-extrabold text-base text-white">WAS Jobs Ethiopia</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              {lang === 'am'
                ? 'በኢትዮጵያ ውስጥ ስራ ፈላጊዎችን እና ድርጅቶችን በቀጥታ የሚያገናኝ ዘመናዊ የቅጥር መድረክ።'
                : 'Directly connecting Ethiopian job seekers with leading public and private enterprises.'}
            </p>
            <div className="text-[11px] text-amber-400 font-semibold">
              {lang === 'am' ? 'ባለቤት እና ዋና አስተዳዳሪ፡' : 'Platform Owner & Administrator:'} ሀብታሙ ጌታቸው (habitegechewe@gmail.com)
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white uppercase tracking-wider mb-3 text-[11px]">
              {lang === 'am' ? 'ዋና ዋና ዘርፎች' : 'Job Sectors'}
            </h4>
            <ul className="space-y-2 text-[11px]">
              <li>{lang === 'am' ? 'ቴክኖሎጂ እና አይቲ' : 'Technology & IT'}</li>
              <li>{lang === 'am' ? 'ፋይናንስ እና ባንክ (CBE, Awash)' : 'Finance & Banking'}</li>
              <li>{lang === 'am' ? 'ጤና እና ህክምና' : 'Healthcare & Medicine'}</li>
              <li>{lang === 'am' ? 'ትምህርት እና ስልጠና' : 'Education & Training'}</li>
              <li>{lang === 'am' ? 'ኮንስትራክሽን እና ምህንድስና' : 'Construction & Engineering'}</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white uppercase tracking-wider mb-3 text-[11px]">
              {lang === 'am' ? 'የክፍያ አጋሮች (ዝግጅት)' : 'Ethiopian Payment Gateways'}
            </h4>
            <ul className="space-y-2 text-[11px]">
              <li className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-400" />
                <span>Telebirr (ቴሌብር - Ethio Telecom)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <span>CBE Birr (የኢትዮጵያ ንግድ ባንክ)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Chapa Financial Technologies</span>
              </li>
              <li className="text-[10px] text-slate-500 pt-1">
                {lang === 'am'
                  ? 'የደህንነት ዋስትና፡ የባንክ ይለፍ ቃል ወይም ፒን በጭራሽ አይቀመጥም።'
                  : 'Zero Bank PIN/Password storage guarantee.'}
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white uppercase tracking-wider mb-3 text-[11px]">
              {lang === 'am' ? 'ከተሞች እና ክልሎች' : 'Locations in Ethiopia'}
            </h4>
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              <span className="bg-slate-800/80 px-2 py-1 rounded">Addis Ababa</span>
              <span className="bg-slate-800/80 px-2 py-1 rounded">Hawassa</span>
              <span className="bg-slate-800/80 px-2 py-1 rounded">Bahir Dar</span>
              <span className="bg-slate-800/80 px-2 py-1 rounded">Dire Dawa</span>
              <span className="bg-slate-800/80 px-2 py-1 rounded">Adama</span>
              <span className="bg-slate-800/80 px-2 py-1 rounded">Mekelle</span>
              <span className="bg-slate-800/80 px-2 py-1 rounded">Jimma</span>
              <span className="bg-slate-800/80 px-2 py-1 rounded">Remote (የርቀት)</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
          <div>
            © {new Date().getFullYear()} WAS Jobs Ethiopia (ዋስ ስራ). All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Amharic (አማርኛ) / English</span>
            <span>•</span>
            <span>Mobile-First Android Ready</span>
          </div>
        </div>
      </footer>

      {/* Mobile-First Thumb Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'job-detail') setSelectedJobId(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        openAuthModal={() => openAuthModal('login')}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
        onSuccessRole={(role) => {
          if (role === 'admin') setActiveTab('admin');
          else if (role === 'employer') setActiveTab('employer');
          else setActiveTab('jobs');
        }}
      />

      {/* Payment Gateway Modal */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
