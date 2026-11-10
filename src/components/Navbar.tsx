import React, { useState } from 'react';
import {
  Briefcase,
  Globe,
  Bell,
  User as UserIcon,
  PlusCircle,
  Bookmark,
  FileText,
  Building,
  Shield,
  LogOut,
  Menu,
  X,
  CreditCard,
  CheckCircle,
  ExternalLink,
  Send,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useNotifications } from '../context/NotificationContext.tsx';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openAuthModal: (mode?: 'login' | 'register' | 'forgot') => void;
  openPaymentModal: () => void;
  openPostJobModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  openAuthModal,
  openPaymentModal,
}) => {
  const { lang, toggleLang, t } = useLanguage();
  const { user, company, logout, demoLogin } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showDemoMenu, setShowDemoMenu] = useState(false);

  const handleDemoSwitch = async (role: 'admin' | 'employer' | 'seeker') => {
    setShowDemoMenu(false);
    setShowMobileMenu(false);
    await demoLogin(role);
    if (role === 'admin') setActiveTab('admin');
    else if (role === 'employer') setActiveTab('employer');
    else setActiveTab('jobs');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0B192C] text-white shadow-md border-b border-slate-800">
      {/* Top emergency/demo testing banner */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 text-white text-xs font-medium px-4 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2 truncate">
          <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
            {lang === 'am' ? 'ኢትዮጵያ' : 'Ethiopia'}
          </span>
          <span className="truncate">
            {lang === 'am'
              ? 'ዋስ ስራ - ዘመናዊ የኢትዮጵያውያን የስራ እና የቅጥር ገበያ'
              : 'WAS Jobs - Modern Ethiopian Employment Marketplace'}
          </span>
        </div>

        {/* Top actions: Telegram Channel & Administrator Access */}
        <div className="flex items-center gap-2">
          <a
            href="https://t.me/wasjobs"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 bg-[#24A1DE]/40 hover:bg-[#24A1DE]/70 text-white text-[11px] font-semibold px-2 py-0.5 rounded transition"
            title="Join WAS Jobs Telegram Channel"
          >
            <Send className="w-3 h-3 text-sky-200" />
            <span className="hidden sm:inline">Telegram: @wasjobs</span>
            <span className="sm:hidden">@wasjobs</span>
          </a>

          <button
            onClick={() => {
              if (user?.role === 'admin') {
                setActiveTab('admin');
              } else {
                openAuthModal('login');
              }
            }}
            className="flex items-center gap-1.5 bg-black/30 hover:bg-black/50 text-[11px] font-semibold px-2.5 py-0.5 rounded transition"
            title="Administrator Access (ሀብታሙ ጌታቸው)"
          >
            <Shield className="w-3.5 h-3.5 text-amber-300" />
            <span>
              {user?.role === 'admin'
                ? (lang === 'am' ? '👑 አስተዳዳሪ (ሀብታሙ ጌታቸው)' : '👑 Admin (Habitamu Getachew)')
                : (lang === 'am' ? 'የአስተዳዳሪ መግቢያ (ሀብታሙ)' : 'Admin Login (Habitamu)')}
            </span>
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => setActiveTab('jobs')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF6B00] to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white font-black text-xl">
              W
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-white">WAS</span>
                <span className="font-extrabold text-xl tracking-tight text-[#FF6B00]">Jobs</span>
                <span className="text-[11px] bg-slate-800 text-amber-400 font-bold px-1.5 py-0.5 rounded ml-1">
                  ET
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium -mt-1">
                {lang === 'am' ? 'ዋስ ስራ - ኢትዮጵያ' : 'Ethiopia Job Market'}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('jobs')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === 'jobs'
                  ? 'bg-slate-800 text-[#FF6B00]'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {t('navJobs')}
            </button>

            {user?.role === 'seeker' && (
              <>
                <button
                  onClick={() => setActiveTab('applications')}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                    activeTab === 'applications'
                      ? 'bg-slate-800 text-[#FF6B00]'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {t('navApplications')}
                </button>
                <button
                  onClick={() => setActiveTab('saved')}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                    activeTab === 'saved'
                      ? 'bg-slate-800 text-[#FF6B00]'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {t('navSaved')}
                </button>
              </>
            )}

            {(user?.role === 'employer' || user?.role === 'admin') && (
              <button
                onClick={() => setActiveTab('employer')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                  activeTab === 'employer'
                    ? 'bg-slate-800 text-[#FF6B00]'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {t('navEmployerDashboard')}
              </button>
            )}

            {user?.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 ${
                  activeTab === 'admin'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'text-amber-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Shield className="w-4 h-4 text-amber-400" />
                {t('navAdminDashboard')}
              </button>
            )}

            <button
              onClick={openPaymentModal}
              className="px-3 py-2 rounded-lg text-sm font-semibold text-emerald-400 hover:text-white hover:bg-slate-800/60 transition flex items-center gap-1.5"
            >
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>{lang === 'am' ? 'ክፍያና ኮሚሽን (CBE/ቴሌብር)' : 'Payments & Commission'}</span>
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
              title="ቋንቋ ቀይር / Change Language"
            >
              <Globe className="w-3.5 h-3.5 text-[#FF6B00]" />
              <span>{lang === 'am' ? 'English' : 'አማርኛ'}</span>
            </button>

            {/* Notification Bell */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 relative transition"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                    <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-orange-400" />
                        <span className="font-bold text-sm">{t('navNotifications')}</span>
                        {unreadCount > 0 && (
                          <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-orange-400 hover:text-orange-300 font-medium"
                        >
                          {lang === 'am' ? 'ሁሉንም እንዳነበብኩ አድርግ' : 'Mark all read'}
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-xs">
                          {lang === 'am' ? 'ምንም አዲስ ማሳወቂያ የለም' : 'No notifications yet'}
                        </div>
                      ) : (
                        notifications.slice(0, 8).map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => {
                              markAsRead(notif.id);
                              if (notif.link) {
                                if (notif.link.includes('applications')) setActiveTab('applications');
                                else if (notif.link.includes('employer')) setActiveTab('employer');
                                else if (notif.link.includes('admin')) setActiveTab('admin');
                              }
                              setShowNotifications(false);
                            }}
                            className={`p-3 text-xs hover:bg-slate-50 cursor-pointer transition ${
                              !notif.read ? 'bg-orange-50/60 font-medium' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-semibold text-slate-900">
                                {lang === 'am' ? notif.titleAm : notif.titleEn}
                              </span>
                              {!notif.read && (
                                <span className="w-2 h-2 rounded-full bg-orange-500 mt-1 flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-slate-600 mt-0.5 line-clamp-2">
                              {lang === 'am' ? notif.messageAm : notif.messageEn}
                            </p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {new Date(notif.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Post Job button for Employer or Admin */}
            {(user?.role === 'employer' || user?.role === 'admin') && (
              <button
                onClick={() => setActiveTab('post-job')}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#FF6B00] to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t('navPostJob')}</span>
              </button>
            )}

            {/* User Profile or Login Button */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
                >
                  <div className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-xs">
                    {user.fullName.charAt(0)}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-semibold text-white truncate max-w-[100px]">
                      {user.fullName.split(' ')[0]}
                    </div>
                    <div className="text-[10px] text-amber-400 capitalize">
                      {user.role === 'admin'
                        ? 'Admin'
                        : user.role === 'employer'
                        ? 'Employer'
                        : 'Seeker'}
                    </div>
                  </div>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="font-bold text-sm text-slate-900 truncate">{user.fullName}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                        {user.role}
                      </span>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setActiveTab('profile');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        <span>{t('navProfile')}</span>
                      </button>

                      {user.role === 'seeker' && (
                        <>
                          <button
                            onClick={() => {
                              setActiveTab('applications');
                              setShowUserMenu(false);
                            }}
                            className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                          >
                            <FileText className="w-4 h-4 text-slate-400" />
                            <span>{t('navApplications')}</span>
                          </button>
                          <button
                            onClick={() => {
                              setActiveTab('saved');
                              setShowUserMenu(false);
                            }}
                            className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                          >
                            <Bookmark className="w-4 h-4 text-slate-400" />
                            <span>{t('navSaved')}</span>
                          </button>
                        </>
                      )}

                      {(user.role === 'employer' || user.role === 'admin') && (
                        <button
                          onClick={() => {
                            setActiveTab('employer');
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                        >
                          <Building className="w-4 h-4 text-slate-400" />
                          <span>{t('navEmployerDashboard')}</span>
                        </button>
                      )}

                      {user.role === 'admin' && (
                        <button
                          onClick={() => {
                            setActiveTab('admin');
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs hover:bg-amber-50 flex items-center gap-2 text-amber-700 font-semibold"
                        >
                          <Shield className="w-4 h-4 text-amber-500" />
                          <span>{t('navAdminDashboard')}</span>
                        </button>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs hover:bg-red-50 text-red-600 flex items-center gap-2 font-semibold"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{t('navLogout')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuthModal('login')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 transition"
                >
                  {t('navLogin')}
                </button>
                <button
                  onClick={() => openAuthModal('register')}
                  className="px-3.5 py-1.5 rounded-lg bg-[#FF6B00] hover:bg-orange-600 text-white text-xs font-bold shadow transition"
                >
                  {t('navRegister')}
                </button>
              </div>
            )}

            {/* Mobile menu hamburger */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 rounded-lg bg-slate-800 text-slate-200"
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {showMobileMenu && (
        <div className="md:hidden bg-[#0B192C] border-t border-slate-800 px-4 pt-3 pb-6 space-y-2">
          <button
            onClick={() => {
              setActiveTab('jobs');
              setShowMobileMenu(false);
            }}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 ${
              activeTab === 'jobs' ? 'bg-[#FF6B00] text-white' : 'text-slate-200'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>{t('navJobs')}</span>
          </button>

          {user?.role === 'seeker' && (
            <>
              <button
                onClick={() => {
                  setActiveTab('applications');
                  setShowMobileMenu(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 ${
                  activeTab === 'applications' ? 'bg-[#FF6B00] text-white' : 'text-slate-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>{t('navApplications')}</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('saved');
                  setShowMobileMenu(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 ${
                  activeTab === 'saved' ? 'bg-[#FF6B00] text-white' : 'text-slate-200'
                }`}
              >
                <Bookmark className="w-4 h-4" />
                <span>{t('navSaved')}</span>
              </button>
            </>
          )}

          {(user?.role === 'employer' || user?.role === 'admin') && (
            <>
              <button
                onClick={() => {
                  setActiveTab('post-job');
                  setShowMobileMenu(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 ${
                  activeTab === 'post-job' ? 'bg-[#FF6B00] text-white' : 'text-slate-200'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t('navPostJob')}</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('employer');
                  setShowMobileMenu(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 ${
                  activeTab === 'employer' ? 'bg-[#FF6B00] text-white' : 'text-slate-200'
                }`}
              >
                <Building className="w-4 h-4" />
                <span>{t('navEmployerDashboard')}</span>
              </button>
            </>
          )}

          {user?.role === 'admin' && (
            <button
              onClick={() => {
                setActiveTab('admin');
                setShowMobileMenu(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-500/30`}
            >
              <Shield className="w-4 h-4 text-amber-400" />
              <span>{t('navAdminDashboard')}</span>
            </button>
          )}

          <button
            onClick={() => {
              openPaymentModal();
              setShowMobileMenu(false);
            }}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 text-slate-200"
          >
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <span>{t('navPayments')}</span>
          </button>
        </div>
      )}
    </header>
  );
};
