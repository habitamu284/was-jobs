import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';
import { useLanguage } from '../context/LanguageContext.tsx';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { lang } = useLanguage();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 rounded-lg bg-[#FF6B00] hover:bg-orange-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-sm transition cursor-pointer"
        title={lang === 'am' ? 'መተግበሪያውን በስልክዎ ላይ ይጫኑ' : 'Install WAS Jobs App'}
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{lang === 'am' ? 'አፑን ጫን' : 'Install App'}</span>
        <span className="sm:hidden">{lang === 'am' ? 'ጫን' : 'App'}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-lg border border-orange-400/50 bg-orange-500/20 hover:bg-orange-500/30 px-2.5 py-1.5 text-xs font-bold text-orange-200 transition cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{lang === 'am' ? 'በiOS ጫን' : 'Install App'}</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-slate-900">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-extrabold text-[#0B192C]">
                  {lang === 'am' ? 'በ iPhone / iPad ላይ ይጫኑ' : 'Install on iPhone / iPad'}
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed space-y-2">
                {lang === 'am' ? (
                  <>
                    1. በ Safari ታችኛው ክፍል ያለውን <strong>Share</strong> ምልክት ይጫኑ።<br />
                    2. ወደ ታች ሸብልለው <strong>Add to Home Screen</strong> የሚለውን ይምረጡ።
                  </>
                ) : (
                  <>
                    1. Tap the <strong>Share</strong> button in the Safari toolbar.<br />
                    2. Scroll down and tap <strong>Add to Home Screen</strong>.
                  </>
                )}
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-xl bg-[#0B192C] py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition"
              >
                {lang === 'am' ? 'ዝጋ' : 'Close'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
