import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations, getTranslation } from '../i18n/translations.ts';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (key: keyof typeof translations) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to Amharic as requested
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('was_jobs_lang');
    return (saved === 'en' ? 'en' : 'am') as Language;
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('was_jobs_lang', newLang);
  };

  const toggleLang = () => {
    setLang(lang === 'am' ? 'en' : 'am');
  };

  const t = (key: keyof typeof translations): string => {
    return getTranslation(key, lang);
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
