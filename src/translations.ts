export type Language = 'en' | 'ur' | 'ps';

export const languageNames = {
  en: 'English',
  ur: 'اردو (Urdu)',
  ps: 'پښتنو (Pashto)'
};

export const translations = {
  en: {
    // Navigation / Header
    home: 'Home Portal',
    register: 'Register Membership',
    cabinet: 'Cabinet Assembly',
    elections: 'Cast Vote',
    report: 'Report Incident',
    chat: 'AI Assistant',
    admin: 'Admin Terminal',
    portalTitle: 'PAKHTOON PORTAL',
    omanChapter: 'Diaspora Chapter',
    omanPakhtoon: 'Pakhtoon Community',
    signIn: 'Sign In',
    signOut: 'Sign Out',
    backToTop: 'Back To Top',
    language: 'Language',
    
    // Hero Dashboard
    welcomeTitle: 'Pakhtoon Community',
    welcomeSubtitle: 'Unity Platform',
    heroDescription: 'The primary network providing general assistance, welfare support coordination, and cooperative services for the diaspora Pakhtoon tribes and families.',
    
    // Quick Statistics
    registeredMembers: 'Registered Members',
    activeFunds: 'Welfare Support Cases',
    reportedIncidents: 'Reported Incidents',
    embassyLiaisons: 'Community Liaisons',
    
    // Register Form Tab
    newMemberRegistry: 'Pakhtoon Diaspora Membership Registration',
    fatherName: 'Father Name',
    cnic: 'CNIC / NICOP Number',
    district: 'Home District (KPK / Balochistan)',
    phone: 'Phone Number',
    whatsapp: 'WhatsApp Number (Optional)',
    address: 'Current Resident Address',
    occupation: 'Occupation / Profession',
    emergency: 'Emergency Contact Person & Phone',
    uploadPhoto: 'Upload Profile Photo',
    submitRegistration: 'Submit Registration Form',
    verifyMembership: 'Verify Registered Status',
    
    // Incident Report Tab
    reportClaim: 'Welfare Report Claim / Emergency Support',
    incidentDescription: 'Please provide details of any accident, emergency, medical crisis, repatriation request, or community issue requiring urgent welfare action.',
    
    // Cabinet Tab
    opcCabinetDirectory: 'Community Directory & Assemblies',
    executiveCabinet: 'Executive Cabinet',
    verifiedMembers: 'Verified Members',
    cabinetAssembly: 'Cabinet Assembly',
    searchPlaceholder: 'Search directory...',
    castVoteText: 'Cast Council Ballot',
    
    // AI Assistant Tab
    aiTitle: 'Pakhtoon Community Welfare Assistant',
    aiSubtitle: 'Speak or type any question regarding membership, executive guidelines, embassy support, or repatriation procedures.',
    aiPlaceholder: 'How can the community support a fellow brother with a medical emergency...',
    
    // Notifications / Alerts
    electionAlerts: 'Election Alerts',
    activePoll: 'Active Poll',
    voted: 'Ballot SECURED',
    voteNow: 'Vote Now',
    noActiveElections: 'No active elections at the moment.',
  },
  ur: {
    // Navigation / Header
    home: 'ہوم پورٹل',
    register: 'ممبرشپ رجسٹریشن',
    cabinet: 'کابینہ',
    elections: 'ووٹ ڈالیں',
    report: 'شکایت / حادثہ',
    chat: 'اے آئی اسسٹنٹ',
    admin: 'ایڈمن ٹرمینل',
    portalTitle: 'کمیونٹی پورٹل',
    omanChapter: 'ڈائیسپورا چیپٹر',
    omanPakhtoon: 'پختون کمیونٹی',
    signIn: 'لاگ ان کریں',
    signOut: 'لاگ آؤٹ کریں',
    backToTop: 'اوپر جائیں',
    language: 'زبان',
    
    // Hero Dashboard
    welcomeTitle: 'پختون کمیونٹی',
    welcomeSubtitle: 'پورٹل',
    heroDescription: 'پختون قبائل کے لیے بنیادی معاونت، فلاحی دعوے اور باہمی تعاون کی خدمات فراہم کرنے والا متحد نیٹ ورک۔',
    
    // Quick Statistics
    registeredMembers: 'رجسٹرڈ ممبران',
    activeFunds: 'فلاحی کیسز',
    reportedIncidents: 'رپورٹ شدہ حادثات',
    embassyLiaisons: 'کمیونٹی رابطے',
    
    // Register Form Tab
    newMemberRegistry: 'پختون ڈائیسپورا رکنیت رجسٹریشن',
    fatherName: 'والد کا نام',
    cnic: 'شناختی کارڈ (CNIC / NICOP) نمبر',
    district: 'آبائی ضلع (کے پی کے / بلوچستان)',
    phone: 'فون نمبر',
    whatsapp: 'واٹس ایپ نمبر (اختیاری)',
    address: 'رہائش کا پتہ',
    occupation: 'پیشہ / ملازمت',
    emergency: 'ہنگامی رابطہ شخص اور فون نمبر',
    uploadPhoto: 'پروفائل تصویر اپ لوڈ کریں',
    submitRegistration: 'رجسٹریشن فارم جمع کروائیں',
    verifyMembership: 'رجسٹریشن کا اسٹیٹس چیک کریں',
    
    // Incident Report Tab
    reportClaim: 'فلاحی دعویٰ / ہنگامی معاونت کی رپورٹ',
    incidentDescription: 'کسی بھی حادثے، ہنگامی صورتحال، طبی بحران، میت کی واپسی کی درخواست یا فوری کارروائی کے لیے تفصیلات فراہم کریں۔',
    
    // Cabinet Tab
    opcCabinetDirectory: 'کمیونٹی ڈائرکٹری اور اسمبلیز',
    executiveCabinet: 'ایگزیکٹو کابینہ',
    verifiedMembers: 'تصدیق شدہ ممبران',
    cabinetAssembly: 'کابینہ اسمبلی',
    searchPlaceholder: 'ڈائرکٹری میں تلاش کریں...',
    castVoteText: 'کونسل بیلٹ کاسٹ کریں',
    
    // AI Assistant Tab
    aiTitle: 'فلاحی اے آئی اسسٹنٹ',
    aiSubtitle: 'ممبرشپ، رجسٹریشن کے رہنما خطوط، سفارت خانے کی معاونت، یا میت کی واپسی کے طریقہ کار کے بارے میں کوئی بھی سوال پوچھیں۔',
    aiPlaceholder: 'کمیونٹی کس طرح ہنگامی طبی صورت حال یا میت کی واپسی میں مدد کر سکتی ہے...',
    
    // Notifications / Alerts
    electionAlerts: 'انتخابی انتباہات',
    activePoll: 'فعال پول',
    voted: 'ووٹ محفوظ ہو گیا',
    voteNow: 'ابھی ووٹ دیں',
    noActiveElections: 'اس وقت کوئی فعال انتخابی سائیکل نہیں ہے۔',
  },
  ps: {
    // Navigation / Header
    home: 'کورنی پورٹل',
    register: 'غړیتوب ثبتول',
    cabinet: 'کابینه',
    elections: 'رایه ورکول',
    report: 'د پیښې راپور',
    chat: 'آئی مرستندوی',
    admin: 'اداري ټرمینل',
    portalTitle: 'کمیونټي پورټل',
    omanChapter: 'ډیاسپورا څانګه',
    omanPakhtoon: 'پښتون ټولنه',
    signIn: 'ننوتل',
    signOut: 'وتل',
    backToTop: 'پورته لاړشئ',
    language: 'ژبه',
    
    // Hero Dashboard
    welcomeTitle: 'د پښتون ټولنه',
    welcomeSubtitle: 'پورټل',
    heroDescription: 'د میشته پښتنو قبایلو لپاره د لومړني ملاتړ، د ژوند د فلاحي دعوو او متقابلو خدماتو شبکه.',
    
    // Quick Statistics
    registeredMembers: 'راجستر شوي غړي',
    activeFunds: 'فلاحي قضیې',
    reportedIncidents: 'راپور شوي پیښې',
    embassyLiaisons: 'د ټولنې اړیکې',
    
    // Register Form Tab
    newMemberRegistry: 'د غړیتوب ثبتولو فورمه',
    fatherName: 'د پلار نوم',
    cnic: 'پيژند پاڼه (CNIC / NICOP) نمبر',
    district: 'اصلي ولسوالۍ / ولایت (KPK / بامیان)',
    phone: 'د تلیفون شمیره',
    whatsapp: 'واټساپ شمیره (اختیاري)',
    address: 'د اوسیدو پته',
    occupation: 'دنده یا مسلک',
    emergency: 'د بیړني تماس شخص او تلیفون شمیره',
    uploadPhoto: 'عکس اپلوډ کړئ',
    submitRegistration: 'د غړیتوب فورمه وسپارئ',
    verifyMembership: 'غړیتوب تصدیق کړئ',
    
    // Incident Report Tab
    reportClaim: 'د فلاحي مرستې یا بیړني حالت راپور',
    incidentDescription: 'د پیښې ، اضطراري طبي بحران ، وطن ته د ستنیدو غوښتنې یا ټولنیزې ستونزې په اړه معلومات ورکړئ د عاجل اقدام ته اړتیا لري.',
    
    // Cabinet Tab
    opcCabinetDirectory: 'د ټولنې ډایرکټري او جرګې',
    executiveCabinet: 'اجراییه کابینه',
    verifiedMembers: 'تصدیق شوي غړي',
    cabinetAssembly: 'د کابینې جرګه (اسمبلی)',
    searchPlaceholder: 'لټون وکړئ...',
    castVoteText: 'خپله رایه ورکړئ',
    
    // AI Assistant Tab
    aiTitle: 'د ټولنې د فلاحي چارو هوښیار مرستندوی',
    aiSubtitle: 'د غړیتوب، د ثبت لارښوونو، سفارت ملاتړ، یا هیواد ته بیرته ستنیدلو په اړه پوښتنې په پښتو یا انګلیسي کې وپوښتئ.',
    aiPlaceholder: 'زه څنګه کولای شم د پښتون ورور عاجل طبي حالت یا مرستي لپاره راپور ورکړم...',
    
    // Notifications / Alerts
    electionAlerts: 'د ټاکنو خبرتیاوې',
    activePoll: 'فعال ټولپوښتنه',
    voted: 'رایه خوندي شوه',
    voteNow: 'اوس رایه ورکړئ',
    noActiveElections: 'اوس مهال د ټاکنو کومه فعاله دوره نشته.',
  }
};
