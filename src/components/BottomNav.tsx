import React from 'react';
import { Briefcase, Bookmark, FileText, Building, Shield, User as UserIcon, PlusCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openAuthModal: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, openAuthModal }) => {
  const { t, lang } = useLanguage();
  const { user } = useAuth();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B192C] border-t border-slate-800 px-2 py-1 flex items-center justify-around shadow-2xl safe-area-bottom">
      {/* 1. Jobs Feed */}
      <button
        onClick={() => setActiveTab('jobs')}
        className={`flex flex-col items-center py-1.5 px-2 rounded-lg transition ${
          activeTab === 'jobs' ? 'text-[#FF6B00]' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Briefcase className="w-5 h-5" />
        <span className="text-[10px] font-semibold mt-0.5">{t('navJobs')}</span>
      </button>

      {/* 2. Middle Role Action */}
      {user?.role === 'seeker' ? (
        <button
          onClick={() => setActiveTab('applications')}
          className={`flex flex-col items-center py-1.5 px-2 rounded-lg transition ${
            activeTab === 'applications' ? 'text-[#FF6B00]' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-0.5">{t('navApplications')}</span>
        </button>
      ) : user?.role === 'employer' ? (
        <button
          onClick={() => setActiveTab('employer')}
          className={`flex flex-col items-center py-1.5 px-2 rounded-lg transition ${
            activeTab === 'employer' ? 'text-[#FF6B00]' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-0.5">{lang === 'am' ? 'አሰሪ' : 'Employer'}</span>
        </button>
      ) : user?.role === 'admin' ? (
        <button
          onClick={() => setActiveTab('admin')}
          className={`flex flex-col items-center py-1.5 px-2 rounded-lg transition ${
            activeTab === 'admin' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-5 h-5 text-amber-400" />
          <span className="text-[10px] font-semibold mt-0.5">{lang === 'am' ? 'አስተዳዳሪ' : 'Admin'}</span>
        </button>
      ) : (
        <button
          onClick={() => setActiveTab('jobs')}
          className={`flex flex-col items-center py-1.5 px-2 rounded-lg transition text-slate-400`}
        >
          <FileText className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-0.5">{t('navApplications')}</span>
        </button>
      )}

      {/* 3. Center Highlight: Post Job for Employers/Admin or Saved for Seeker */}
      {user?.role === 'employer' || user?.role === 'admin' ? (
        <button
          onClick={() => setActiveTab('post-job')}
          className="flex flex-col items-center -mt-4 bg-gradient-to-r from-[#FF6B00] to-orange-600 text-white p-2.5 rounded-full shadow-lg shadow-orange-500/30 transition transform active:scale-95"
        >
          <PlusCircle className="w-6 h-6" />
          <span className="text-[9px] font-bold mt-0.5">{lang === 'am' ? 'ለጥፍ' : 'Post'}</span>
        </button>
      ) : (
        <button
          onClick={() => {
            if (!user) openAuthModal();
            else setActiveTab('saved');
          }}
          className={`flex flex-col items-center py-1.5 px-2 rounded-lg transition ${
            activeTab === 'saved' ? 'text-[#FF6B00]' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bookmark className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-0.5">{t('navSaved')}</span>
        </button>
      )}

      {/* 4. Profile / Account */}
      <button
        onClick={() => {
          if (!user) openAuthModal();
          else setActiveTab('profile');
        }}
        className={`flex flex-col items-center py-1.5 px-2 rounded-lg transition ${
          activeTab === 'profile' ? 'text-[#FF6B00]' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <UserIcon className="w-5 h-5" />
        <span className="text-[10px] font-semibold mt-0.5">
          {user ? (lang === 'am' ? 'መገለጫ' : 'Profile') : (lang === 'am' ? 'ይግቡ' : 'Log In')}
        </span>
      </button>
    </div>
  );
};
