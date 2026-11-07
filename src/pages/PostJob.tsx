import React, { useState } from 'react';
import {
  Briefcase,
  Building,
  MapPin,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { EmploymentType } from '../types/index.ts';

interface PostJobProps {
  onSuccess: (jobId: string) => void;
  onCancel: () => void;
}

export const PostJob: React.FC<PostJobProps> = ({ onSuccess, onCancel }) => {
  const { lang, t } = useLanguage();
  const { user, company, authFetch } = useAuth();

  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState(company?.companyName || user?.fullName || '');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(company?.location || 'Addis Ababa');
  const [category, setCategory] = useState('Technology');
  const [employmentType, setEmploymentType] = useState<EmploymentType>('full_time');
  const [salaryMin, setSalaryMin] = useState<string>('30000');
  const [salaryMax, setSalaryMax] = useState<string>('50000');
  const [isNegotiableSalary, setIsNegotiableSalary] = useState(false);
  const [qualifications, setQualifications] = useState('');
  const [applicationDeadline, setApplicationDeadline] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [contactEmail, setContactEmail] = useState(company?.email || user?.email || '');
  const [contactPhone, setContactPhone] = useState(company?.phone || user?.phone || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    { id: 'Technology', labelEn: 'Technology & IT', labelAm: 'ቴክኖሎጂ እና አይቲ' },
    { id: 'Finance', labelEn: 'Finance & Banking', labelAm: 'ፋይናንስ እና ባንክ' },
    { id: 'Healthcare', labelEn: 'Healthcare & Medicine', labelAm: 'የጤና እንክብካቤ' },
    { id: 'Education', labelEn: 'Education & Teaching', labelAm: 'ትምህርት እና ስልጠና' },
    { id: 'Transport', labelEn: 'Transport & Logistics', labelAm: 'ትራንስፖርት እና ሎጂስቲክስ' },
    { id: 'Construction', labelEn: 'Construction & Eng', labelAm: 'ኮንስትራክሽን እና ምህንድስና' },
    { id: 'Sales and Retail', labelEn: 'Sales & Retail', labelAm: 'ሽያጭ እና ንግድ' },
    { id: 'Hospitality', labelEn: 'Hospitality & Tourism', labelAm: 'ሆቴል እና ቱሪዝም' },
    { id: 'Other', labelEn: 'Other Fields', labelAm: 'ሌሎች የስራ ዘርፎች' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        title,
        companyName,
        description,
        location,
        category,
        employmentType,
        salaryMin: isNegotiableSalary ? undefined : Number(salaryMin),
        salaryMax: isNegotiableSalary ? undefined : Number(salaryMax),
        salaryCurrency: 'ETB',
        salaryPeriod: 'monthly',
        isNegotiableSalary,
        requiredQualifications: qualifications,
        applicationDeadline,
        contactEmail,
        contactPhone,
      };

      const res = await authFetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to post job');
      }

      onSuccess(data.job.id);
    } catch (err: any) {
      setError(err.message || 'Error creating job posting');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-24 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-[#0B192C] text-white p-6">
          <div className="flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-[#FF6B00]" />
            <h1 className="text-lg sm:text-xl font-black">
              {lang === 'am' ? 'አዲስ የስራ ማስታወቂያ ይለጥፉ' : 'Post a New Job Vacancy'}
            </h1>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            {lang === 'am'
              ? 'መረጃዎችን በትክክል በማስገባት ብቁ ኢትዮጵያውያን አመልካቾችን በፍጥነት ያግኙ።'
              : 'Reach qualified Ethiopian professionals across Addis Ababa and all regions.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Job Title & Company Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {lang === 'am' ? 'የስራ መጠሪያ (Job Title)' : 'Job Title'} *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={lang === 'am' ? 'ለምሳሌ፡ ሲኒየር አካውንታንት' : 'e.g. Senior Software Engineer'}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#FF6B00]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {lang === 'am' ? 'የድርጅቱ ስም' : 'Company Name'} *
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder={lang === 'am' ? 'የድርጅትዎ ወይም የተቋምዎ ስም' : 'Your Company or Organization Name'}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#FF6B00]"
              />
            </div>
          </div>

          {/* Category & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {lang === 'am' ? 'የስራ ዘርፍ (Category)' : 'Job Category'} *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {lang === 'am' ? c.labelAm : c.labelEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {lang === 'am' ? 'የስራ ቦታ (ከተማ / ክልል)' : 'Location (City / Region)'} *
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Addis Ababa, Bole / Hawassa..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#FF6B00]"
              />
            </div>
          </div>

          {/* Employment Type */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              {lang === 'am' ? 'የቅጥር አይነት' : 'Employment Type'} *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: 'full_time', label: lang === 'am' ? 'ሙሉ ጊዜ' : 'Full-Time' },
                { id: 'part_time', label: lang === 'am' ? 'የትርፍ ጊዜ' : 'Part-Time' },
                { id: 'contract', label: lang === 'am' ? 'ኮንትራት' : 'Contract' },
                { id: 'remote', label: lang === 'am' ? 'የርቀት' : 'Remote' },
                { id: 'internship', label: lang === 'am' ? 'ተለማማጅ' : 'Internship' },
              ].map((tItem) => (
                <button
                  key={tItem.id}
                  type="button"
                  onClick={() => setEmploymentType(tItem.id as EmploymentType)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold text-center border transition ${
                    employmentType === tItem.id
                      ? 'bg-orange-50 border-[#FF6B00] text-[#FF6B00]'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {tItem.label}
                </button>
              ))}
            </div>
          </div>

          {/* Salary Section */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>{lang === 'am' ? 'የወር ደመወዝ (በብር - ETB)' : 'Monthly Salary Range (ETB)'}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={isNegotiableSalary}
                  onChange={(e) => setIsNegotiableSalary(e.target.checked)}
                  className="rounded text-[#FF6B00] focus:ring-[#FF6B00]"
                />
                <span>{lang === 'am' ? 'በስምምነት የሚወሰን' : 'Negotiable'}</span>
              </label>
            </div>

            {!isNegotiableSalary && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">
                    {lang === 'am' ? 'ዝቅተኛ (Min)' : 'Minimum ETB'}
                  </label>
                  <input
                    type="number"
                    value={salaryMin}
                    onChange={(e) => setSalaryMin(e.target.value)}
                    placeholder="25,000"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">
                    {lang === 'am' ? 'ከፍተኛ (Max)' : 'Maximum ETB'}
                  </label>
                  <input
                    type="number"
                    value={salaryMax}
                    onChange={(e) => setSalaryMax(e.target.value)}
                    placeholder="45,000"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Job Description */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              {lang === 'am' ? 'የስራው ዝርዝር መግለጫ (Job Description)' : 'Job Description'} *
            </label>
            <textarea
              required
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                lang === 'am'
                  ? 'የስራውን ዋና ዋና ኃላፊነቶች እና የቡድኑን ባህሪ ይግለጹ...'
                  : 'Describe core responsibilities, team structure, and day-to-day deliverables...'
              }
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#FF6B00] leading-relaxed"
            />
          </div>

          {/* Required Qualifications */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              {lang === 'am'
                ? 'ተፈላጊ መስፈርቶች እና ችሎታዎች (በእያንዳንዱ መስመር አንድ)'
                : 'Required Qualifications (one per line)'} *
            </label>
            <textarea
              required
              rows={4}
              value={qualifications}
              onChange={(e) => setQualifications(e.target.value)}
              placeholder={
                lang === 'am'
                  ? 'በኮምፒውተር ሳይንስ የመጀመሪያ ዲግሪ\nቢያንስ 3 ዓመት የስራ ልምድ\nበአማርኛ እና በእንግሊዝኛ አቀላጥፎ መግባባት'
                  : 'B.Sc. in relevant engineering or business field\nMinimum 3+ years experience\nStrong analytical and teamwork skills'
              }
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#FF6B00] leading-relaxed"
            />
          </div>

          {/* Application Deadline & Contact info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {lang === 'am' ? 'የማብቂያ ቀን (Deadline)' : 'Application Deadline'} *
              </label>
              <input
                type="date"
                required
                value={applicationDeadline}
                onChange={(e) => setApplicationDeadline(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#FF6B00]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {lang === 'am' ? 'የመገናኛ ኢሜይል' : 'Contact Email'} *
              </label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="hr@company.com"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#FF6B00]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {lang === 'am' ? 'የመገናኛ ስልክ' : 'Contact Phone'} *
              </label>
              <input
                type="tel"
                required
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+251 9... / 011..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#FF6B00]"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B00] to-orange-600 hover:from-orange-600 text-white font-black text-xs shadow-md shadow-orange-500/20 flex items-center gap-2 transition disabled:opacity-50"
            >
              <span>{isSubmitting ? (lang === 'am' ? 'በመለጠፍ ላይ...' : 'Publishing...') : (lang === 'am' ? 'ስራውን ይለጥፉ' : 'Publish Job Vacancy')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
