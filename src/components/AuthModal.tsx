import React, { useState } from 'react';
import { X, Lock, Mail, User, Phone, Building, Shield, ArrowRight, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { UserRole } from '../types/index.ts';
import { safeJsonFetch } from '../utils/api.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'forgot';
  onSuccessRole?: (role: UserRole) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccessRole,
}) => {
  const { lang, t } = useLanguage();
  const { login, register, demoLogin } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [role, setRole] = useState<'seeker' | 'employer'>('seeker');

  // Form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [location, setLocation] = useState('Addis Ababa');

  // Statuses
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const res = await login(email, password);
        if (!res.success) {
          setError(res.error || 'Login failed');
        } else {
          onClose();
        }
      } else if (mode === 'register') {
        if (password !== confirmPassword) {
          setError(lang === 'am' ? 'የይለፍ ቃሎቹ አይመሳሰሉም!' : 'Passwords do not match!');
          setIsSubmitting(false);
          return;
        }

        const res = await register({
          fullName,
          email,
          password,
          role,
          phone,
          companyName: role === 'employer' ? companyName : undefined,
          location,
        });

        if (!res.success) {
          setError(res.error || 'Registration failed');
        } else {
          if (onSuccessRole) onSuccessRole(role);
          onClose();
        }
      } else if (mode === 'forgot') {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, newPassword: password }),
        });
        const parsed = await safeJsonFetch(res, lang === 'am' ? 'የይለፍ ቃል መቀየር አልተሳካም።' : 'Reset failed');
        if (!parsed.ok || !parsed.data) {
          setError(parsed.error || 'Reset failed');
        } else {
          setSuccessMsg(parsed.data.message || (lang === 'am' ? 'የይለፍ ቃልዎ ተቀይሯል።' : 'Password updated successfully.'));
          setTimeout(() => {
            setMode('login');
          }, 1500);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoClick = async (demoRole: UserRole) => {
    setIsSubmitting(true);
    const res = await demoLogin(demoRole);
    setIsSubmitting(false);
    if (res.success) {
      if (onSuccessRole) onSuccessRole(demoRole);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-[#0B192C] text-white p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl text-white">WAS</span>
              <span className="font-black text-xl text-[#FF6B00]">Jobs</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {mode === 'login'
                ? t('loginTitle')
                : mode === 'register'
                ? t('registerTitle')
                : t('forgotPasswordTitle')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Administrator Quick Access */}
        <div className="bg-amber-50/80 p-3 border-b border-amber-200/80">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-900 uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5 text-amber-700" />
              <span>{lang === 'am' ? 'የዋና አስተዳዳሪ ፈጣን መግቢያ' : 'Platform Administrator Fast Login'}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setEmail('habitegechewe@gmail.com');
                setPassword('Admin12345!');
                setShowPassword(true);
                setError(null);
                setSuccessMsg(lang === 'am' ? 'የአስተዳዳሪው መረጃ ተሞልቷል (ሚስጥር ቃል፡ Admin12345!)። «ይግቡ» የሚለውን ይጫኑ።' : 'Administrator credentials filled (Password: Admin12345!). Click Sign In.');
              }}
              className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
            >
              <span>👑 {lang === 'am' ? 'ሀብታሙ ጌታቸው (የአስተዳዳሪ መግቢያ)' : 'Habitamu Getachew (Admin Login)'}</span>
            </button>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex border-b border-slate-200 text-xs font-bold text-center">
          <button
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-3 transition ${
              mode === 'login'
                ? 'border-b-2 border-[#FF6B00] text-[#FF6B00] bg-orange-50/20'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t('navLogin')}
          </button>
          <button
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-3 transition ${
              mode === 'register'
                ? 'border-b-2 border-[#FF6B00] text-[#FF6B00] bg-orange-50/20'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t('navRegister')}
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 font-medium">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Registration Role Selector */}
          {mode === 'register' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                {lang === 'am' ? 'የመለያ አይነት ይምረጡ' : 'Select Account Type'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('seeker')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    role === 'seeker'
                      ? 'bg-orange-50 border-[#FF6B00] text-[#FF6B00]'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>{t('roleSeeker')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('employer')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    role === 'employer'
                      ? 'bg-orange-50 border-[#FF6B00] text-[#FF6B00]'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Building className="w-4 h-4" />
                  <span>{t('roleEmployer')}</span>
                </button>
              </div>
            </div>
          )}

          {/* Full Name (for register) */}
          {mode === 'register' && (
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {t('fullName')} *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={lang === 'am' ? 'ሙሉ ስምዎን ያስገቡ' : 'Enter your full name'}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#FF6B00] focus:border-[#FF6B00]"
                />
              </div>
            </div>
          )}

          {/* Company Name (for employer register) */}
          {mode === 'register' && role === 'employer' && (
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {t('companyName')} *
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder={lang === 'am' ? 'የድርጅትዎ ስም' : 'Your Company or Organization'}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#FF6B00] focus:border-[#FF6B00]"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              {t('email')} *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#FF6B00] focus:border-[#FF6B00]"
              />
            </div>
          </div>

          {/* Phone (for register) */}
          {mode === 'register' && (
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {t('phone')}
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+251 9... / 09..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#FF6B00] focus:border-[#FF6B00]"
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                {mode === 'forgot'
                  ? lang === 'am'
                    ? 'አዲስ የይለፍ ቃል'
                    : 'New Password'
                  : t('password')}{' '}
                *
              </label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-[11px] text-[#FF6B00] hover:underline"
                >
                  {lang === 'am' ? 'የይለፍ ቃል ረሱ?' : 'Forgot password?'}
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#FF6B00] focus:border-[#FF6B00]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password (register) */}
          {mode === 'register' && (
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {t('confirmPassword')} *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#FF6B00] focus:border-[#FF6B00]"
                />
              </div>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B00] to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>
              {mode === 'login'
                ? t('navLogin')
                : mode === 'register'
                ? t('navRegister')
                : lang === 'am'
                ? 'የይለፍ ቃል ቀይር'
                : 'Reset Password'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
