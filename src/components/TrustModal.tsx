import React, { useState } from 'react';
import { X, ShieldCheck, FileText, Phone, Mail, MapPin, AlertTriangle, CheckCircle, ExternalLink, Lock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';

export type TrustModalTab = 'privacy' | 'terms' | 'safety' | 'contact';

interface TrustModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: TrustModalTab;
}

export const TrustModal: React.FC<TrustModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'privacy',
}) => {
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<TrustModalTab>(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="bg-[#0B192C] text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#FF6B00] to-amber-500 flex items-center justify-center text-white font-black">
              W
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">
                WAS Jobs Ethiopia (ዋስ ስራ)
              </h3>
              <p className="text-[11px] text-slate-300">
                {lang === 'am' ? 'የደህንነት፣ የግላዊነት እና የአጠቃቀም መመሪያዎች' : 'Trust, Privacy & Platform Policies'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 min-w-[120px] py-3 px-2 flex items-center justify-center gap-1.5 transition ${
              activeTab === 'privacy'
                ? 'border-b-2 border-[#FF6B00] text-[#FF6B00] bg-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{lang === 'am' ? 'የግላዊነት ፖሊሲ' : 'Privacy Policy'}</span>
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`flex-1 min-w-[120px] py-3 px-2 flex items-center justify-center gap-1.5 transition ${
              activeTab === 'terms'
                ? 'border-b-2 border-[#FF6B00] text-[#FF6B00] bg-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{lang === 'am' ? 'የአጠቃቀም ደንቦች' : 'Terms & Conditions'}</span>
          </button>
          <button
            onClick={() => setActiveTab('safety')}
            className={`flex-1 min-w-[120px] py-3 px-2 flex items-center justify-center gap-1.5 transition ${
              activeTab === 'safety'
                ? 'border-b-2 border-[#FF6B00] text-[#FF6B00] bg-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>{lang === 'am' ? 'የማጭበርበር ጥንቃቄ' : 'Anti-Fraud & Safety'}</span>
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={`flex-1 min-w-[120px] py-3 px-2 flex items-center justify-center gap-1.5 transition ${
              activeTab === 'contact'
                ? 'border-b-2 border-[#FF6B00] text-[#FF6B00] bg-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>{lang === 'am' ? 'ያግኙን' : 'Contact Us'}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed">
          {activeTab === 'privacy' && (
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>{lang === 'am' ? 'የግላዊነት እና የመረጃ ደህንነት ፖሊሲ' : 'Privacy & Data Protection Policy'}</span>
              </div>
              <p>
                {lang === 'am'
                  ? 'ዋስ ስራ (WAS Jobs) የተጠቃሚዎችን የግል መረጃ እና ደህንነት ለመጠበቅ ጽኑ ቁርጠኝነት አለው። እርስዎ ሲመዘገቡ ወይም ለስራ ሲያመለክቱ የሚሰጡት ማንኛውም መረጃ በጥብቅ የተጠበቀ ነው።'
                  : 'WAS Jobs is deeply committed to user confidentiality and data security. Any personal information provided during registration or job applications is handled with utmost care.'}
              </p>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900">
                  {lang === 'am' ? 'ዋና ዋና የጥበቃ መርሆዎች፡' : 'Key Protection Guarantees:'}
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>
                    {lang === 'am'
                      ? 'የስልክ ቁጥርዎ ወይም የኢሜይል አድራሻዎ ለሶስተኛ ወገን ወይም ለማስታወቂያ በጭራሽ አይሸጥም ወይም አይተላለፍም።'
                      : 'We never sell or distribute your phone number or email address to third-party marketers.'}
                  </li>
                  <li>
                    {lang === 'am'
                      ? 'የጫኑት ሲቪ (CV) እና የግል ማመልከቻ ዝርዝር ሊታይ የሚችለው እርስዎ በፈቃድዎ ላመለከቱለት አሰሪ እና ለስርዓቱ ዋና አስተዳዳሪ ብቻ ነው።'
                      : 'Your uploaded CV and personal details are accessible exclusively by employers whose jobs you specifically apply for, and system administration.'}
                  </li>
                  <li>
                    {lang === 'am'
                      ? 'የይለፍ ቃልዎ በዘመናዊ SHA-256 ምስጠራ (encryption) ተቆልፎ የሚቀመጥ ሲሆን ማንም ሊያየው አይችልም።'
                      : 'Passwords are encrypted using industry-standard SHA-256 cryptographic salts.'}
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <FileText className="w-5 h-5 text-[#FF6B00]" />
                <span>{lang === 'am' ? 'የአጠቃቀም ደንቦች እና ግዴታዎች' : 'Terms & Conditions of Service'}</span>
              </div>
              <p>
                {lang === 'am'
                  ? 'ወደ ዋስ ስራ መድረክ ሲገቡ ወይም ሲጠቀሙ የሚከተሉትን ህጋዊ ደንቦች ለማክበር ተስማምተዋል፡'
                  : 'By accessing or using WAS Jobs Ethiopia, you agree to adhere to the following platform standards:'}
              </p>
              <div className="space-y-2.5">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <h5 className="font-bold text-emerald-950 mb-1">
                    {lang === 'am' ? '፩. ለስራ ፈላጊዎች ነፃ አገልግሎት' : '1. 100% Free for Job Seekers'}
                  </h5>
                  <p className="text-emerald-900">
                    {lang === 'am'
                      ? 'ስራዎችን መፈለግ፣ መመዝገብ፣ ሲቪ መስቀል እና ማመልከት ለማንኛውም ስራ ፈላጊ ሙሉ በሙሉ ነፃ ነው። ምንም አይነት የአባልነት ወይም የማመልከቻ ክፍያ አይጠየቅም።'
                      : 'Browsing vacancies, account registration, CV storage, and job applications are permanently free for job seekers.'}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <h5 className="font-bold text-slate-900 mb-1">
                    {lang === 'am' ? '፪. የአሰሪዎች ግዴታ' : '2. Employer Obligations'}
                  </h5>
                  <p className="text-slate-600">
                    {lang === 'am'
                      ? 'አሰሪዎች የሚለጥፏቸው የስራ ማስታወቂያዎች እውነተኛ፣ ትክክለኛ መረጃ የያዙ እና የኢትዮጵያ የሰራተኛ ህግን ያከበሩ መሆን አለባቸው። ህገ-ወጥ ወይም የሀሰት የስራ ማስታወቂያ ያወጣ ድርጅት አካውንቱ ወዲያውኑ ይሰረዛል።'
                      : 'Employers must post authentic, accurate, and lawful vacancies adhering to Ethiopian Labor Proclamation laws. False or scam listings result in immediate account termination.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'safety' && (
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 text-sm font-bold text-red-600">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span>{lang === 'am' ? 'አስፈላጊ የደህንነት እና የማጭበርበር ጥንቃቄ' : 'Important Safety & Anti-Fraud Notice'}</span>
              </div>
              <div className="p-3.5 bg-red-50 rounded-xl border border-red-200 text-red-900 space-y-2">
                <p className="font-bold text-red-950">
                  {lang === 'am'
                    ? '⚠️ ለማንኛውም ስራ በቅድሚያ ክፍያ አይክፈሉ!'
                    : '⚠️ Never pay upfront money for job applications!'}
                </p>
                <p>
                  {lang === 'am'
                    ? 'ትክክለኛ አሰሪ ድርጅት ለስራ ማመልከቻ፣ ለፈተና፣ ለዩኒፎርም ወይም ለመመዝገቢያ በሚል በቴሌብርም ሆነ በባንክ በቅድሚያ ገንዘብ በጭራሽ አይጠይቅም። ገንዘብ የሚጠይቅ አሰሪ ካጋጠመዎት አጭበርባሪ በመሆኑ ምንም አይነት ገንዘብ እንዳይከፍሉ!'
                    : 'Legitimate employers never demand upfront processing fees, uniform costs, or registration fees via Telebirr or CBE. If anyone solicits money in exchange for employment, it is a scam.'}
                </p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                <h5 className="font-bold mb-1">
                  {lang === 'am' ? 'አጠራጣሪ ስራ ካጋጠመዎት ምን ማድረግ አለብዎት?' : 'What to do if you encounter a suspicious job?'}
                </h5>
                <p>
                  {lang === 'am'
                    ? 'በእያንዳንዱ የስራ ማስታወቂያ ዝርዝር ውስጥ የሚገኘውን «ሪፖርት አድርግ» (Report Job) የሚለውን ቁልፍ በመጫን ወዲያውኑ ያሳውቁን። የአስተዳዳሪ ቡድናችን ወዲያውኑ አጣርቶ እርምጃ ይወስዳል።'
                    : 'Click the "Report Job" button located on every job posting page to notify our administrator immediately for swift investigation and removal.'}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Phone className="w-5 h-5 text-[#FF6B00]" />
                <span>{lang === 'am' ? 'ያግኙን እና የደንበኞች ድጋፍ' : 'Contact Us & Platform Support'}</span>
              </div>
              <p>
                {lang === 'am'
                  ? 'ስለ ዋስ ስራ ማንኛውም ጥያቄ፣ አስተያየት ወይም የድርጅት ማረጋገጫ ድጋፍ ከፈለጉ በቀጥታ ያግኙን፡'
                  : 'For any inquiries, feedback, or employer verification support, reach out directly to platform administration:'}
              </p>
              <div className="space-y-2.5">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-[#FF6B00]">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">{lang === 'am' ? 'ስልክ ቁጥር' : 'Phone'}</div>
                    <a href="tel:0966087039" className="font-extrabold text-slate-900 hover:text-[#FF6B00]">
                      0966087039
                    </a>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">{lang === 'am' ? 'ኢሜይል' : 'Email'}</div>
                    <a href="mailto:habitegechewe@gmail.com" className="font-extrabold text-slate-900 hover:text-[#FF6B00]">
                      habitegechewe@gmail.com
                    </a>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">{lang === 'am' ? 'አድራሻ' : 'Office Location'}</div>
                    <div className="font-bold text-slate-900">
                      Addis Ababa, Ethiopia (አዲስ አበባ፣ ኢትዮጵያ)
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="text-[10px] text-amber-800 font-bold uppercase mb-1">
                    {lang === 'am' ? 'ዋና መስራች እና አስተዳዳሪ' : 'Platform Founder & Administrator'}
                  </div>
                  <div className="font-extrabold text-slate-900">
                    ሀብታሙ ጌታቸው (Habitamu Getachew)
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
          >
            {lang === 'am' ? 'ዝጋ' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
