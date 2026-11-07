import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Copy,
  Check,
  Building2,
  Phone,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Send,
  Clock,
  History,
  FileCheck2,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { PaymentTransaction } from '../types/index.ts';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPurpose?: 'commission' | 'featured_job' | 'company_verification';
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  defaultPurpose = 'commission',
}) => {
  const { lang, t } = useLanguage();
  const { user, authFetch } = useAuth();

  const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit');

  // Form State
  const [purpose, setPurpose] = useState<'commission' | 'featured_job' | 'company_verification'>(
    defaultPurpose
  );
  const [provider, setProvider] = useState<'cbe_birr' | 'telebirr'>('cbe_birr');
  const [amount, setAmount] = useState<number>(1000);
  const [transactionRef, setTransactionRef] = useState('');
  const [payerName, setPayerName] = useState(user?.fullName || '');
  const [payerPhone, setPayerPhone] = useState(user?.phone || '0966087039');
  const [notes, setNotes] = useState('');

  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // History State
  const [myTransactions, setMyTransactions] = useState<PaymentTransaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Copy Feedback
  const [copiedCBE, setCopiedCBE] = useState(false);
  const [copiedTelebirr, setCopiedTelebirr] = useState(false);

  useEffect(() => {
    if (purpose === 'featured_job') setAmount(500);
    else if (purpose === 'company_verification') setAmount(1500);
    else if (amount !== 1000 && amount !== 500 && amount !== 1500) {
      // keep custom
    } else {
      setAmount(1000);
    }
  }, [purpose]);

  const fetchTransactions = async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const res = await authFetch('/api/payments/my-transactions');
      if (res.ok) {
        const data = await res.json();
        setMyTransactions(data.transactions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTransactions();
      setSubmitSuccess(null);
      setSubmitError(null);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleCopy = (text: string, type: 'cbe' | 'telebirr') => {
    navigator.clipboard.writeText(text);
    if (type === 'cbe') {
      setCopiedCBE(true);
      setTimeout(() => setCopiedCBE(false), 2000);
    } else {
      setCopiedTelebirr(true);
      setTimeout(() => setCopiedTelebirr(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setSubmitError(lang === 'am' ? 'እባክዎ መጀመሪያ ይግቡ።' : 'Please log in to submit payment.');
      return;
    }

    if (!transactionRef.trim()) {
      setSubmitError(
        lang === 'am'
          ? 'እባክዎ የግብይት ቁጥር (Transaction Reference / FT ቁጥር) ያስገቡ።'
          : 'Please enter your Transaction Reference / FT Code.'
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const res = await authFetch('/api/payments/submit-commission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          provider,
          purpose,
          transactionRef: transactionRef.trim(),
          payerName,
          payerPhone,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit transaction');
      }

      setSubmitSuccess(
        lang === 'am'
          ? 'የክፍያ ማረጋገጫ ቁጥርዎ በተሳካ ሁኔታ ለአስተዳዳሪው ደርሷል! እየተጣራ ነው።'
          : 'Payment reference submitted successfully! Administrator verification in progress.'
      );
      setTransactionRef('');
      setNotes('');
      fetchTransactions();
    } catch (err: any) {
      setSubmitError(err.message || 'Error submitting payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-[#0B192C] text-white p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-[#FF6B00]">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {lang === 'am' ? 'የኮሚሽን እና የክፍያ ማስተላለፊያ' : 'Official Commission & Payments Hub'}
              </h2>
              <p className="text-xs text-slate-300">
                {lang === 'am'
                  ? 'በኢትዮጵያ ንግድ ባንክ (CBE) እና በቴሌብር (Telebirr) የተረጋገጡ ሒሳቦች'
                  : 'Verified Commercial Bank of Ethiopia (CBE) & Telebirr Accounts'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 max-h-[80vh] overflow-y-auto space-y-5">
          {/* Section: Official Verified Accounts Cards */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>
                {lang === 'am'
                  ? 'የተረጋገጡ ይፋዊ የክፍያ መቀበያ ሒሳቦች (ሀብታሙ ጌታቸው)'
                  : 'Official Verified Accounts (Habitamu Getachew)'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Account 1: Commercial Bank of Ethiopia (CBE) */}
              <div className="bg-gradient-to-br from-purple-900 to-indigo-950 text-white p-4 rounded-xl shadow-md border border-purple-800/80 relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-purple-300" />
                    <div>
                      <span className="font-bold text-xs block text-purple-200">
                        {lang === 'am' ? 'የኢትዮጵያ ንግድ ባንክ' : 'Commercial Bank of Ethiopia'}
                      </span>
                      <span className="text-[10px] text-purple-300">CBE Official Account</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>{lang === 'am' ? 'የተረጋገጠ' : 'Verified'}</span>
                  </span>
                </div>

                <div className="mt-3 bg-black/30 p-2.5 rounded-lg border border-purple-700/50 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-purple-300 block uppercase font-bold tracking-wider">
                      {lang === 'am' ? 'የሒሳብ ቁጥር (CBE)' : 'Account Number'}
                    </span>
                    <span className="font-mono font-extrabold text-sm sm:text-base text-white tracking-wider">
                      1000769746343
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy('1000769746343', 'cbe')}
                    className="p-1.5 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-xs font-semibold flex items-center gap-1 transition"
                    title="Copy Account Number"
                  >
                    {copiedCBE ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="text-[10px]">{copiedCBE ? (lang === 'am' ? 'ተቀድቷል' : 'Copied') : (lang === 'am' ? 'ቅዳ' : 'Copy')}</span>
                  </button>
                </div>

                <div className="mt-2 text-[11px] text-purple-200 flex justify-between">
                  <span>{lang === 'am' ? 'ተቀባይ ስም፡' : 'Account Name:'}</span>
                  <span className="font-bold text-white">ሀብታሙ ጌታቸው (Habitamu Getachew)</span>
                </div>
              </div>

              {/* Account 2: Telebirr (Ethio Telecom) */}
              <div className="bg-gradient-to-br from-[#0B192C] to-slate-900 text-white p-4 rounded-xl shadow-md border border-orange-500/30 relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Phone className="w-5 h-5 text-orange-400" />
                    <div>
                      <span className="font-bold text-xs block text-orange-300">
                        {lang === 'am' ? 'ቴሌብር (Telebirr)' : 'Telebirr (Ethio Telecom)'}
                      </span>
                      <span className="text-[10px] text-slate-300">Mobile Money Transfer</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>{lang === 'am' ? 'የተረጋገጠ' : 'Verified'}</span>
                  </span>
                </div>

                <div className="mt-3 bg-black/30 p-2.5 rounded-lg border border-orange-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-orange-300 block uppercase font-bold tracking-wider">
                      {lang === 'am' ? 'የቴሌብር ስልክ ቁጥር' : 'Telebirr Phone'}
                    </span>
                    <span className="font-mono font-extrabold text-sm sm:text-base text-white tracking-wider">
                      0966087039
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy('0966087039', 'telebirr')}
                    className="p-1.5 rounded-lg bg-[#FF6B00] hover:bg-orange-600 text-white text-xs font-semibold flex items-center gap-1 transition"
                    title="Copy Telebirr Number"
                  >
                    {copiedTelebirr ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="text-[10px]">{copiedTelebirr ? (lang === 'am' ? 'ተቀድቷል' : 'Copied') : (lang === 'am' ? 'ቅዳ' : 'Copy')}</span>
                  </button>
                </div>

                <div className="mt-2 text-[11px] text-slate-300 flex justify-between">
                  <span>{lang === 'am' ? 'ተቀባይ ስም፡' : 'Receiver Name:'}</span>
                  <span className="font-bold text-white">ሀብታሙ ጌታቸው (Habitamu Getachew)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex border-b border-slate-200 text-xs font-bold">
            <button
              onClick={() => setActiveTab('submit')}
              className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'submit'
                  ? 'border-[#FF6B00] text-[#FF6B00]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>{lang === 'am' ? 'የክፍያ ማረጋገጫ ቁጥር አስገባ' : 'Submit Payment Reference'}</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'border-[#FF6B00] text-[#FF6B00]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>{lang === 'am' ? 'የክፍያ ታሪክ እና ሁኔታ' : 'My Payment History'} ({myTransactions.length})</span>
            </button>
          </div>

          {/* TAB 1: Submit Form */}
          {activeTab === 'submit' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {submitSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{submitSuccess}</span>
                </div>
              )}

              {submitError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Purpose Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {lang === 'am' ? 'የክፍያ ዓላማ (Purpose)' : 'Payment Purpose'} *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPurpose('commission')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition ${
                      purpose === 'commission'
                        ? 'border-[#FF6B00] bg-orange-50 font-bold text-[#FF6B00]'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="block font-bold">
                      {lang === 'am' ? 'የኮሚሽን ክፍያ' : 'Commission Payment'}
                    </span>
                    <span className="text-[10px] text-slate-500">1,000 ብር (ወይም የፈለጉት መጠን)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPurpose('featured_job')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition ${
                      purpose === 'featured_job'
                        ? 'border-[#FF6B00] bg-orange-50 font-bold text-[#FF6B00]'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="block font-bold">
                      {lang === 'am' ? 'የተለየ የስራ ማስታወቂያ' : 'Featured Job Spotlight'}
                    </span>
                    <span className="text-[10px] text-slate-500">500 ብር (ለ14 ቀናት)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPurpose('company_verification')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition ${
                      purpose === 'company_verification'
                        ? 'border-[#FF6B00] bg-orange-50 font-bold text-[#FF6B00]'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="block font-bold">
                      {lang === 'am' ? 'የተረጋገጠ አሰሪ (Blue Badge)' : 'Employer Verification'}
                    </span>
                    <span className="text-[10px] text-slate-500">1,500 ብር (ለ1 ዓመት)</span>
                  </button>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {lang === 'am' ? 'የተከፈለበት ዘዴ' : 'Payment Method Used'} *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setProvider('cbe_birr')}
                    className={`p-3 rounded-xl border flex items-center gap-2 text-xs transition ${
                      provider === 'cbe_birr'
                        ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-purple-700" />
                    <div className="text-left">
                      <div>{lang === 'am' ? 'የኢትዮጵያ ንግድ ባንክ' : 'Commercial Bank of Ethiopia'}</div>
                      <div className="text-[10px] text-purple-600 font-mono">1000769746343</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProvider('telebirr')}
                    className={`p-3 rounded-xl border flex items-center gap-2 text-xs transition ${
                      provider === 'telebirr'
                        ? 'border-orange-500 bg-orange-50 text-orange-900 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Phone className="w-4 h-4 text-orange-600" />
                    <div className="text-left">
                      <div>{lang === 'am' ? 'ቴሌብር (Telebirr)' : 'Telebirr (Ethio Telecom)'}</div>
                      <div className="text-[10px] text-orange-600 font-mono">0966087039</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Amount & Transaction Reference Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {lang === 'am' ? 'የተከፈለው መጠን (ብር - ETB)' : 'Amount Paid (ETB)'} *
                  </label>
                  <input
                    type="number"
                    required
                    min={10}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#FF6B00]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {lang === 'am'
                      ? 'የግብይት ቁጥር (FT ቁጥር / ቴሌብር ማረጋገጫ)'
                      : 'Transaction Ref / FT Code'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="e.g. FT2603810293 or TB-202611"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-[#FF6B00]"
                  />
                </div>
              </div>

              {/* Payer Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {lang === 'am' ? 'የከፋዩ ስም (ወይም የድርጅት ስም)' : 'Payer Name / Company'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {lang === 'am' ? 'ክፍያው የተላከበት ስልክ ቁጥር' : 'Sender Phone Number'} *
                  </label>
                  <input
                    type="tel"
                    required
                    value={payerPhone}
                    onChange={(e) => setPayerPhone(e.target.value)}
                    placeholder="09... / +251 9..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Additional notes */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {lang === 'am' ? 'ተጨማሪ ማስታወሻ (አማራጭ)' : 'Additional Notes (Optional)'}
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    lang === 'am'
                      ? 'ለምሳሌ፡ ለሶፍትዌር ኢንጂነር ስራ ማስታወቂያ ወይም ለተቀጠረ ሰራተኛ ኮሚሽን'
                      : 'e.g. For Senior Software Engineer hiring commission'
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B00] to-orange-600 hover:from-orange-600 text-white font-black text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? lang === 'am'
                      ? 'በመላክ ላይ...'
                      : 'Submitting...'
                    : lang === 'am'
                    ? 'የክፍያ ማረጋገጫ ቁጥሩን ላክ'
                    : 'Submit Payment Reference'}
                </span>
              </button>
            </form>
          )}

          {/* TAB 2: History & Verification Status */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {myTransactions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  {lang === 'am'
                    ? 'እስካሁን ያስገቡት የክፍያ ማረጋገጫ የለም።'
                    : 'No payment submissions yet.'}
                </div>
              ) : (
                myTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">
                          {tx.amount} ETB
                        </span>
                        <span className="font-semibold text-slate-500 capitalize">
                          via {tx.provider === 'cbe_birr' ? 'CBE (1000769746343)' : 'Telebirr (0966087039)'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        <span className="font-mono font-bold text-slate-800">
                          Ref: {tx.transactionRef}
                        </span>{' '}
                        • {tx.purpose.replace('_', ' ')} • {new Date(tx.createdAt).toLocaleDateString()}
                      </div>
                      {tx.notes && (
                        <p className="text-[10px] text-slate-500 mt-1 italic">{tx.notes}</p>
                      )}
                    </div>

                    <div>
                      {tx.status === 'verified' ? (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{lang === 'am' ? 'የተረጋገጠ (ጸድቋል)' : 'Verified & Approved'}</span>
                        </span>
                      ) : tx.status === 'rejected' ? (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-800 flex items-center gap-1">
                          <X className="w-3.5 h-3.5 text-red-600" />
                          <span>{lang === 'am' ? 'ውድቅ የተደረገ' : 'Rejected'}</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>{lang === 'am' ? 'በማረጋገጥ ላይ...' : 'Pending Verification'}</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-500">
            {lang === 'am' ? 'ተቀባይ፡ ሀብታሙ ጌታቸው (Habitamu Getachew)' : 'Receiver: Habitamu Getachew'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-900 transition"
          >
            {lang === 'am' ? 'ዝጋ' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
