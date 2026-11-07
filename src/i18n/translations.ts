export type Language = 'am' | 'en';

export const translations = {
  // Navigation & Branding
  brandName: {
    am: 'ዋስ ስራ',
    en: 'WAS Jobs',
  },
  brandTagline: {
    am: 'የኢትዮጵያ ቀዳሚ የስራ እና የቅጥር መድረክ',
    en: 'Ethiopia’s Premier Job Marketplace',
  },
  navJobs: {
    am: 'ስራዎች',
    en: 'Jobs',
  },
  navPostJob: {
    am: 'ስራ ይለጥፉ',
    en: 'Post a Job',
  },
  navApplications: {
    am: 'ማመልከቻዎቼ',
    en: 'My Applications',
  },
  navSaved: {
    am: 'የተቀመጡ',
    en: 'Saved Jobs',
  },
  navEmployerDashboard: {
    am: 'የአሰሪ ዳሽቦርድ',
    en: 'Employer Portal',
  },
  navAdminDashboard: {
    am: 'የአስተዳዳሪ ክፍል',
    en: 'Admin Panel',
  },
  navProfile: {
    am: 'መገለጫዬ',
    en: 'My Profile',
  },
  navLogin: {
    am: 'ይግቡ',
    en: 'Log In',
  },
  navRegister: {
    am: 'ይመዝገቡ',
    en: 'Register',
  },
  navLogout: {
    am: 'ይውጡ',
    en: 'Log Out',
  },
  navNotifications: {
    am: 'ማሳወቂያዎች',
    en: 'Notifications',
  },
  navPayments: {
    am: 'ክፍያዎች',
    en: 'Payments',
  },

  // Hero & Search
  heroTitle: {
    am: 'የህልም ስራዎን በኢትዮጵያ ዛሬ ያግኙ',
    en: 'Find Your Dream Career in Ethiopia Today',
  },
  heroSubtitle: {
    am: 'በሺዎች የሚቆጠሩ ክፍት የስራ ማስታወቂያዎች በቴሌኮም፣ በባንክ፣ በቴክኖሎጂ፣ በጤና እና በሌሎችም ዘርፎች።',
    en: 'Discover verified job vacancies across telecom, banking, tech, health, and beyond.',
  },
  searchPlaceholder: {
    am: 'የስራ መጠሪያ፣ ድርጅት ወይም ክህሎት ይፈልጉ...',
    en: 'Search job title, company, or skill...',
  },
  locationPlaceholder: {
    am: 'ቦታ (አዲስ አበባ፣ ሃዋሳ፣ ባህር ዳር...)',
    en: 'Location (Addis Ababa, Hawassa...)',
  },
  allCategories: {
    am: 'ሁሉም የስራ ዘርፎች',
    en: 'All Categories',
  },
  allLocations: {
    am: 'ሁሉም ከተሞች',
    en: 'All Cities',
  },
  searchBtn: {
    am: 'ስራ ፈልግ',
    en: 'Search Jobs',
  },
  filterBtn: {
    am: 'አጣራ',
    en: 'Filter',
  },
  clearFilters: {
    am: 'አጣራዎችን አጥፋ',
    en: 'Reset Filters',
  },
  recentSearches: {
    am: 'የቅርብ ጊዜ ፍለጋዎች',
    en: 'Recent Searches',
  },
  clearRecentSearches: {
    am: 'አጽዳ',
    en: 'Clear',
  },

  // Categories
  catTechnology: {
    am: 'ቴክኖሎጂ እና አይቲ',
    en: 'Technology',
  },
  catFinance: {
    am: 'ፋይናንስ እና ባንክ',
    en: 'Finance',
  },
  catHealthcare: {
    am: 'የጤና እንክብካቤ',
    en: 'Healthcare',
  },
  catEducation: {
    am: 'ትምህርት እና ስልጠና',
    en: 'Education',
  },
  catTransport: {
    am: 'ትራንስፖርት እና ሎጂስቲክስ',
    en: 'Transport',
  },
  catConstruction: {
    am: 'ኮንስትራክሽን እና ምህንድስና',
    en: 'Construction',
  },
  catSales: {
    am: 'ሽያጭ እና ንግድ',
    en: 'Sales and Retail',
  },
  catHospitality: {
    am: 'ሆቴል እና ቱሪዝም',
    en: 'Hospitality',
  },
  catOther: {
    am: 'ሌሎች የስራ ዘርፎች',
    en: 'Other',
  },

  // Employment Types
  fullTime: {
    am: 'ሙሉ ጊዜ (Full-Time)',
    en: 'Full-Time',
  },
  partTime: {
    am: 'የትርፍ ጊዜ (Part-Time)',
    en: 'Part-Time',
  },
  contract: {
    am: 'የውል ስራ (Contract)',
    en: 'Contract',
  },
  remote: {
    am: 'የርቀት ስራ (Remote)',
    en: 'Remote',
  },
  internship: {
    am: 'ተለማማጅ (Internship)',
    en: 'Internship',
  },

  // Job Details
  salary: {
    am: 'ደመወዝ',
    en: 'Salary',
  },
  salaryNegotiable: {
    am: 'በስምምነት የሚወሰን',
    en: 'Negotiable',
  },
  perMonth: {
    am: 'በወር',
    en: 'per month',
  },
  etb: {
    am: 'ብር',
    en: 'ETB',
  },
  deadline: {
    am: 'የማመልከቻ ማብቂያ ቀን',
    en: 'Application Deadline',
  },
  postedDate: {
    am: 'የተለጠፈበት ቀን',
    en: 'Posted Date',
  },
  qualifications: {
    am: 'ተፈላጊ ችሎታ እና መስፈርቶች',
    en: 'Required Qualifications',
  },
  jobDescription: {
    am: 'የስራው ዝርዝር መግለጫ',
    en: 'Job Description',
  },
  aboutCompany: {
    am: 'ስለ ድርጅቱ',
    en: 'About Company',
  },
  applyNow: {
    am: 'አሁን ያመልክቱ',
    en: 'Apply Now',
  },
  alreadyApplied: {
    am: 'አመልክተዋል',
    en: 'Already Applied',
  },
  saveJob: {
    am: 'አስቀምጥ',
    en: 'Save Job',
  },
  saved: {
    am: 'ተቀምጧል',
    en: 'Saved',
  },
  share: {
    am: 'አጋራ',
    en: 'Share',
  },
  reportJob: {
    am: 'ይህንን ማስታወቂያ ሪፖርት ያድርጉ',
    en: 'Report this job',
  },
  verifiedEmployer: {
    am: 'የተረጋገጠ አሰሪ ድርጅት',
    en: 'Verified Employer',
  },

  // Application Flow
  applyTitle: {
    am: 'የስራ ማመልከቻዎን ያስገቡ',
    en: 'Submit Job Application',
  },
  coverLetterLabel: {
    am: 'የማመልከቻ ደብዳቤ / የራስዎ ማብራሪያ (አማራጭ)',
    en: 'Cover Letter / Brief Pitch (Optional)',
  },
  coverLetterPlaceholder: {
    am: 'ለምን ለዚህ የስራ መደብ ተስማሚ እንደሆኑ በአጭሩ ያብራሩ...',
    en: 'Explain why you are the ideal candidate for this role...',
  },
  cvAttachment: {
    am: 'ሲቪ (CV) ያያይዙ',
    en: 'Attach CV / Resume',
  },
  useExistingCv: {
    am: 'በመገለጫዬ ላይ ያለውን ሲቪ ተጠቀም',
    en: 'Use my uploaded profile CV',
  },
  uploadNewCv: {
    am: 'አዲስ ሲቪ ይጫኑ (PDF / Word)',
    en: 'Upload a new CV (PDF / Word)',
  },
  submitApplication: {
    am: 'ማመልከቻውን ላክ',
    en: 'Submit Application',
  },
  cancel: {
    am: 'ተመለስ',
    en: 'Cancel',
  },

  // Application Statuses
  statusPending: {
    am: 'በመጠባበቅ ላይ',
    en: 'Pending',
  },
  statusUnderReview: {
    am: 'በግምገማ ላይ',
    en: 'Under Review',
  },
  statusShortlisted: {
    am: 'በእጩነት ተመርጧል',
    en: 'Shortlisted',
  },
  statusInterviewing: {
    am: 'ለቃለ-መጠይቅ ተጠርቷል',
    en: 'Interviewing',
  },
  statusRejected: {
    am: 'አልተመረጠም',
    en: 'Not Selected',
  },
  statusHired: {
    am: 'ስራው ተሰጥቷል / ተቀጥረዋል',
    en: 'Hired / Offered',
  },

  // Auth & Roles
  loginTitle: {
    am: 'ወደ ዋስ ስራ ይግቡ',
    en: 'Log In to WAS Jobs',
  },
  registerTitle: {
    am: 'አዲስ መለያ ይፍጠሩ',
    en: 'Create an Account',
  },
  forgotPasswordTitle: {
    am: 'የይለፍ ቃልዎን ይለውጡ',
    en: 'Reset Password',
  },
  roleSeeker: {
    am: 'ስራ ፈላጊ (ተቀጣሪ)',
    en: 'Job Seeker',
  },
  roleEmployer: {
    am: 'አሰሪ (ድርጅት)',
    en: 'Employer / Company',
  },
  roleAdmin: {
    am: 'ዋና አስተዳዳሪ',
    en: 'Administrator',
  },
  fullName: {
    am: 'ሙሉ ስም',
    en: 'Full Name',
  },
  email: {
    am: 'የኢሜል አድራሻ',
    en: 'Email Address',
  },
  password: {
    am: 'የይለፍ ቃል',
    en: 'Password',
  },
  confirmPassword: {
    am: 'የይለፍ ቃሉን ይድገሙ',
    en: 'Confirm Password',
  },
  phone: {
    am: 'ስልክ ቁጥር',
    en: 'Phone Number',
  },
  companyName: {
    am: 'የድርጅቱ ስም',
    en: 'Company Name',
  },
  quickDemoLogin: {
    am: 'የአስተዳዳሪ ፈጣን መግቢያ',
    en: 'Administrator Fast Login',
  },
  demoAdmin: {
    am: 'እንደ አስተዳዳሪ ግባ (ሀብታሙ ጌታቸው)',
    en: 'Admin Login (Habitamu Getachew)',
  },
  demoEmployer: {
    am: 'የአሰሪ መለያ',
    en: 'Employer Account',
  },
  demoSeeker: {
    am: 'የስራ ፈላጊ መለያ',
    en: 'Job Seeker Account',
  },

  // Employer Dashboard
  employerTitle: {
    am: 'የአሰሪ የስራ ማስተዳደሪያ',
    en: 'Employer Management Dashboard',
  },
  postNewJobBtn: {
    am: '+ አዲስ ስራ ይለጥፉ',
    en: '+ Post New Job Vacancy',
  },
  activeJobsTab: {
    am: 'የተለጠፉ ስራዎች',
    en: 'Posted Jobs',
  },
  applicantsTab: {
    am: 'አመልካቾች እና ሲቪ',
    en: 'Applicants & CVs',
  },
  companyProfileTab: {
    am: 'የድርጅት መገለጫ',
    en: 'Company Profile',
  },

  // Admin Dashboard
  adminTitle: {
    am: 'የዋስ ስራ ዋና አስተዳዳሪ ክፍል',
    en: 'WAS Jobs Admin Command Center',
  },
  adminWelcome: {
    am: 'እንኳን ደህና መጡ፣ ሀብታሙ ጌታቸው (habitegechewe@gmail.com)',
    en: 'Welcome, Habitamu Getachew (habitegechewe@gmail.com)',
  },
  statTotalJobs: {
    am: 'ጠቅላላ ስራዎች',
    en: 'Total Jobs',
  },
  statActiveJobs: {
    am: 'ንቁ የስራ ማስታወቂያዎች',
    en: 'Active Postings',
  },
  statUsers: {
    am: 'የተመዘገቡ ተጠቃሚዎች',
    en: 'Total Users',
  },
  statApplications: {
    am: 'የተላኩ ማመልከቻዎች',
    en: 'Applications Sent',
  },
  tabAllJobs: {
    am: 'ሁሉንም ስራዎች አስተዳድር',
    en: 'All Job Postings',
  },
  tabUsers: {
    am: 'ተጠቃሚዎች እና አሰሪዎች',
    en: 'Users & Employers',
  },
  tabReports: {
    am: 'የተላኩ ሪፖርቶች',
    en: 'Reported Content',
  },
  tabPaymentsHub: {
    am: 'የኢትዮጵያ ክፍያዎች ማዕከል',
    en: 'Ethiopian Payments Hub',
  },
  commissionPaymentTitle: {
    am: 'የኮሚሽን እና የክፍያ ማስተላለፊያ (CBE & Telebirr)',
    en: 'Commission & Official Payment Gateway',
  },
  verifiedAccountsLabel: {
    am: 'የተረጋገጡ የባንክ እና የቴሌብር ሒሳቦች',
    en: 'Verified Official Accounts',
  },
  cbeAccountTitle: {
    am: 'የኢትዮጵያ ንግድ ባንክ (CBE)',
    en: 'Commercial Bank of Ethiopia (CBE)',
  },
  telebirrTitle: {
    am: 'ቴሌብር (Telebirr)',
    en: 'Telebirr (Ethio Telecom)',
  },
  cbeAccountNumber: {
    am: '1000769746343',
    en: '1000769746343',
  },
  telebirrPhoneNumber: {
    am: '0966087039',
    en: '0966087039',
  },
  accountHolderName: {
    am: 'ሀብታሙ ጌታቸው (Habitamu Getachew)',
    en: 'Habitamu Getachew',
  },
  copyNumber: {
    am: 'ቁጥሩን ቅዳ',
    en: 'Copy',
  },
  copiedNotice: {
    am: 'ቁጥሩ ተቀድቷል!',
    en: 'Copied!',
  },
  transactionRefLabel: {
    am: 'የግብይት ማረጋገጫ ቁጥር (Transaction Reference / FT ቁጥር)',
    en: 'Transaction Reference / FT / SMS Reference',
  },
  submitPaymentRefBtn: {
    am: 'የክፍያ ማረጋገጫውን ላክ',
    en: 'Submit Payment Reference',
  },
};

export function getTranslation(key: keyof typeof translations, lang: Language): string {
  const item = translations[key];
  if (!item) return key;
  return item[lang] || item.en || key;
}
