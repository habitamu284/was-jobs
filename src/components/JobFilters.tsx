import React, { useState, useEffect } from 'react';
import { Search, MapPin, Filter, X, SlidersHorizontal, ChevronDown, History } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';

interface JobFiltersProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedLocation: string;
  setSelectedLocation: (loc: string) => void;
  selectedType: string;
  setSelectedType: (type: string) => void;
  minSalary: number;
  setMinSalary: (sal: number) => void;
  onReset: () => void;
}

export const JobFilters: React.FC<JobFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedLocation,
  setSelectedLocation,
  selectedType,
  setSelectedType,
  minSalary,
  setMinSalary,
  onReset,
}) => {
  const { lang, t } = useLanguage();
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Recent Searches stored in localStorage
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('was_jobs_recent_searches');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveRecentSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed || trimmed.length < 2) return;
    setRecentSearches((prev) => {
      const updated = [
        trimmed,
        ...prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase()),
      ].slice(0, 5);
      try {
        localStorage.setItem('was_jobs_recent_searches', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const removeRecentSearch = (termToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item !== termToRemove);
      try {
        localStorage.setItem('was_jobs_recent_searches', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const clearAllRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('was_jobs_recent_searches');
    } catch (e) {
      console.error(e);
    }
  };

  const categories = [
    { id: 'All', nameEn: 'All Categories', nameAm: 'ሁሉም የስራ ዘርፎች' },
    { id: 'Technology', nameEn: 'Technology & IT', nameAm: 'ቴክኖሎጂ እና አይቲ' },
    { id: 'Finance', nameEn: 'Finance & Banking', nameAm: 'ፋይናንስ እና ባንክ' },
    { id: 'Healthcare', nameEn: 'Healthcare & Medicine', nameAm: 'የጤና እንክብካቤ' },
    { id: 'Education', nameEn: 'Education & Teaching', nameAm: 'ትምህርት እና ስልጠና' },
    { id: 'Transport', nameEn: 'Transport & Logistics', nameAm: 'ትራንስፖርት እና ሎጂስቲክስ' },
    { id: 'Construction', nameEn: 'Construction & Eng', nameAm: 'ኮንስትራክሽን እና ምህንድስና' },
    { id: 'Sales and Retail', nameEn: 'Sales & Retail', nameAm: 'ሽያጭ እና ንግድ' },
    { id: 'Hospitality', nameEn: 'Hospitality & Tourism', nameAm: 'ሆቴል እና ቱሪዝም' },
    { id: 'Other', nameEn: 'Other Fields', nameAm: 'ሌሎች የስራ ዘርፎች' },
  ];

  const locations = [
    { id: 'All', nameEn: 'All Cities & Regions', nameAm: 'ሁሉም ከተሞች እና ክልሎች' },
    { id: 'Addis Ababa', nameEn: 'Addis Ababa (አዲስ አበባ)', nameAm: 'አዲስ አበባ' },
    { id: 'Hawassa', nameEn: 'Hawassa (ሀዋሳ)', nameAm: 'ሀዋሳ' },
    { id: 'Bahir Dar', nameEn: 'Bahir Dar (ባህር ዳር)', nameAm: 'ባህር ዳር' },
    { id: 'Dire Dawa', nameEn: 'Dire Dawa (ድሬዳዋ)', nameAm: 'ድሬዳዋ' },
    { id: 'Adama', nameEn: 'Adama / Nazret (አዳማ)', nameAm: 'አዳማ' },
    { id: 'Mekelle', nameEn: 'Mekelle (መቀሌ)', nameAm: 'መቀሌ' },
    { id: 'Jimma', nameEn: 'Jimma (ጅማ)', nameAm: 'ጅማ' },
    { id: 'Bishoftu', nameEn: 'Bishoftu / Debre Zeit (ቢሾፍቱ)', nameAm: 'ቢሾፍቱ' },
    { id: 'Remote', nameEn: 'Remote (የርቀት ስራ)', nameAm: 'የርቀት ስራ (Remote)' },
  ];

  const employmentTypes = [
    { id: 'all', nameEn: 'All Types', nameAm: 'ሁሉም' },
    { id: 'full_time', nameEn: 'Full-Time', nameAm: 'ሙሉ ጊዜ' },
    { id: 'part_time', nameEn: 'Part-Time', nameAm: 'የትርፍ ጊዜ' },
    { id: 'contract', nameEn: 'Contract', nameAm: 'ኮንትራት' },
    { id: 'remote', nameEn: 'Remote', nameAm: 'የርቀት' },
    { id: 'internship', nameEn: 'Internship', nameAm: 'ተለማማጅ' },
  ];

  const hasActiveFilters =
    selectedCategory !== 'All' ||
    selectedLocation !== 'All' ||
    selectedType !== 'all' ||
    minSalary > 0 ||
    searchQuery.length > 0;

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80 mb-6">
      {/* Top Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                saveRecentSearch(searchQuery);
              }
            }}
            onBlur={() => {
              if (searchQuery.trim().length >= 2) {
                saveRecentSearch(searchQuery);
              }
            }}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00] focus:border-[#FF6B00] transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Location Dropdown */}
        <div className="relative sm:w-64">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00] focus:border-[#FF6B00] appearance-none font-medium text-slate-700"
          >
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {lang === 'am' ? loc.nameAm : loc.nameEn}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        {/* Mobile filter toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition ${
            showAdvanced || hasActiveFilters
              ? 'bg-orange-50 border-orange-300 text-[#FF6B00]'
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">{t('filterBtn')}</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-[#FF6B00]" />
          )}
        </button>
      </div>

      {/* Recent Searches Pills */}
      {recentSearches.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs animate-in fade-in">
          <span className="flex items-center gap-1 text-slate-500 font-semibold mr-1 text-[11px]">
            <History className="w-3.5 h-3.5 text-[#FF6B00]" />
            <span>{t('recentSearches')}:</span>
          </span>
          {recentSearches.map((term) => (
            <span
              key={term}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                searchQuery.toLowerCase() === term.toLowerCase()
                  ? 'bg-[#FF6B00] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              onClick={() => {
                setSearchQuery(term);
                saveRecentSearch(term);
              }}
            >
              <span>{term}</span>
              <button
                type="button"
                onClick={(e) => removeRecentSearch(term, e)}
                className="hover:text-red-600 rounded-full p-0.5 ml-0.5 text-slate-400 hover:text-slate-600"
                title="Remove"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={clearAllRecentSearches}
            className="text-[11px] text-slate-400 hover:text-slate-600 underline ml-1 cursor-pointer"
          >
            {t('clearRecentSearches')}
          </button>
        </div>
      )}

      {/* Horizontal Scrollable Category Chips */}
      <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                isSelected
                  ? 'bg-[#0B192C] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {lang === 'am' ? cat.nameAm : cat.nameEn}
            </button>
          );
        })}
      </div>

      {/* Advanced Filter Collapsible Section */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in">
          {/* Employment Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              {lang === 'am' ? 'የስራ ዓይነት' : 'Employment Type'}
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {employmentTypes.map((et) => (
                <button
                  key={et.id}
                  onClick={() => setSelectedType(et.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left truncate transition ${
                    selectedType === et.id
                      ? 'bg-orange-500 text-white font-bold'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/60'
                  }`}
                >
                  {lang === 'am' ? et.nameAm : et.nameEn}
                </button>
              ))}
            </div>
          </div>

          {/* Min Salary Slider (ETB) */}
          <div className="sm:col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {lang === 'am' ? 'አነስተኛ ደመወዝ (ብር/በወር)' : 'Minimum Monthly Salary (ETB)'}
                </label>
                <span className="text-xs font-extrabold text-[#FF6B00]">
                  {minSalary > 0
                    ? `${minSalary.toLocaleString()} ${lang === 'am' ? 'ብር' : 'ETB'}`
                    : lang === 'am'
                    ? 'ሁሉም'
                    : 'Any Salary'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="80000"
                step="5000"
                value={minSalary}
                onChange={(e) => setMinSalary(Number(e.target.value))}
                className="w-full accent-[#FF6B00] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>0</span>
                <span>20,000</span>
                <span>40,000</span>
                <span>60,000</span>
                <span>80,000+ ብር</span>
              </div>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <div className="flex justify-end mt-3">
                <button
                  onClick={onReset}
                  className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>{t('clearFilters')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
