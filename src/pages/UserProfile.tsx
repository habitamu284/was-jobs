import React, { useState } from 'react';
import {
  User as UserIcon,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Sparkles,
  Upload,
  CheckCircle2,
  Save,
  Download,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { safeJsonFetch } from '../utils/api.ts';

export const UserProfile: React.FC = () => {
  const { lang, t } = useLanguage();
  const { user, updateProfile, refreshUser, authFetch } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [location, setLocation] = useState(user?.location || 'Addis Ababa');
  const [title, setTitle] = useState(user?.title || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [education, setEducation] = useState(user?.education || '');
  const [experience, setExperience] = useState(user?.experience || '');
  const [skillsStr, setSkillsStr] = useState(user?.skills ? user.skills.join(', ') : '');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [cvMsg, setCvMsg] = useState<string | null>(null);
  const [cvError, setCvError] = useState<string | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(null);
    setSaveError(null);

    const skillsArray = skillsStr
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const res = await updateProfile({
      fullName,
      phone,
      location,
      title,
      bio,
      education,
      experience,
      skills: skillsArray,
    });

    setIsSaving(false);
    if (res.success) {
      setSaveSuccess(lang === 'am' ? 'መገለጫዎ በተሳካ ሁኔታ ተቀምጧል!' : 'Profile saved successfully!');
      setSaveError(null);
      setTimeout(() => setSaveSuccess(null), 3000);
    } else {
      setSaveError(res.error || 'Failed to save profile');
      setSaveSuccess(null);
    }
  };

  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setUploadingCv(true);
    setCvMsg(null);
    setCvError(null);

    const formData = new FormData();
    formData.append('cv', file);

    try {
      const res = await authFetch('/api/users/upload-cv', {
        method: 'POST',
        body: formData,
      });
      const parsed = await safeJsonFetch(res, 'Failed to upload CV');
      if (parsed.ok && parsed.data) {
        setCvMsg(lang === 'am' ? 'ሲቪዎ በተሳካ ሁኔታ ተጭኗል!' : 'CV uploaded successfully!');
        await refreshUser();
      } else {
        setCvError(parsed.error || 'Failed to upload CV');
      }
    } catch (err: any) {
      setCvError(err.message || 'Error uploading file');
    } finally {
      setUploadingCv(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Banner */}
        <div className="bg-[#0B192C] text-white p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#FF6B00] to-amber-500 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white">{user?.fullName}</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 uppercase">
                  {user?.role}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {saveSuccess && (
              <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{saveSuccess}</span>
              </div>
            )}
            {saveError && (
              <div className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>{saveError}</span>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="p-6 space-y-5">
          {/* Section 1: Basic Info */}
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
              <UserIcon className="w-4 h-4 text-orange-500" />
              <span>{lang === 'am' ? 'የግል እና የመገኛ መረጃዎች' : 'Personal & Contact Details'}</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {t('fullName')} *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {t('phone')}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+251 9... / 09..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {lang === 'am' ? 'የመኖሪያ ከተማ / ክልል' : 'City / Location'}
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Addis Ababa, Bole / Hawassa..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {lang === 'am' ? 'የሙያ መጠሪያ (Professional Title)' : 'Professional Title'}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Senior Software Engineer / Financial Analyst"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Bio & Profile Pitch */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              {lang === 'am' ? 'ስለ እኔ አጭር ማብራሪያ (Bio / Summary)' : 'Professional Summary / Bio'}
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={
                lang === 'am'
                  ? 'ስለ ሙያዊ ልምድዎ፣ ጥንካሬዎችዎ እና ለስራዎች ያለዎትን ፍላጎት በአጭሩ ያብራሩ...'
                  : 'Summarize your background, core strengths, and career ambitions...'
              }
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed"
            />
          </div>

          {/* Section 3: Education & Experience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                <span>{lang === 'am' ? 'የትምህርት ደረጃ እና ዩኒቨርሲቲ' : 'Education & Degree'}</span>
              </label>
              <textarea
                rows={3}
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                placeholder="B.Sc. in Computer Science - AAU, 2022"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                <span>{lang === 'am' ? 'የስራ ልምድ ማጠቃለያ' : 'Work Experience Summary'}</span>
              </label>
              <textarea
                rows={3}
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="3 years at FinTech Solutions as Senior Frontend Dev"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed"
              />
            </div>
          </div>

          {/* Section 4: Skills */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{lang === 'am' ? 'ክህሎቶች (በነጠላ ሰረዝ ይለዩ)' : 'Key Skills (comma-separated)'}</span>
            </label>
            <input
              type="text"
              value={skillsStr}
              onChange={(e) => setSkillsStr(e.target.value)}
              placeholder="React, TypeScript, Node.js, Accounting, IFRS, Python, Sales"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          {/* Section 5: CV Attachment */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-800 block">
              {lang === 'am' ? 'የሲቪ (CV) ሰነድ' : 'Curriculum Vitae (CV) Document'}
            </span>

            {user?.cvUrl ? (
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 text-xs">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-orange-500" />
                  <span className="font-semibold text-slate-800 truncate max-w-xs">
                    {user.cvOriginalName || 'My_CV.pdf'}
                  </span>
                </div>
                <a
                  href={user.cvUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                {lang === 'am' ? 'እስካሁን የተያያዘ ሲቪ የለም።' : 'No CV currently attached.'}
              </p>
            )}

            <div className="flex items-center gap-3">
              <input
                type="file"
                id="profile-cv-upload"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleCvUpload}
                className="hidden"
              />
              <label
                htmlFor="profile-cv-upload"
                className="px-4 py-2 bg-white border border-slate-300 hover:border-orange-500 rounded-xl text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1.5 transition"
              >
                <Upload className="w-3.5 h-3.5 text-orange-500" />
                <span>
                  {uploadingCv
                    ? 'Uploading...'
                    : lang === 'am'
                    ? 'አዲስ ሲቪ ይጫኑ'
                    : 'Upload / Replace CV'}
                </span>
              </label>
              {cvMsg && <span className="text-xs text-emerald-600 font-bold">{cvMsg}</span>}
              {cvError && <span className="text-xs text-rose-600 font-bold">{cvError}</span>}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-gradient-to-r from-[#FF6B00] to-orange-600 hover:from-orange-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 flex items-center gap-2 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : (lang === 'am' ? 'መገለጫውን አዘምን' : 'Save Profile Changes')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
