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
    cabinet: 'OPC Cabinet',
    elections: 'Cast Vote',
    report: 'Report Incident',
    chat: 'AI Assistant',
    admin: 'Admin Terminal',
    portalTitle: 'OPC PORTAL',
    omanChapter: 'Sultanate of Oman Chapter',
    omanPakhtoon: 'Oman Pakhtoon Community',
    signIn: 'Sign In',
    signOut: 'Sign Out',
    backToTop: 'Back To Top',
    language: 'Language',
    
    // Hero Dashboard
    welcomeTitle: 'Oman Pakhtoon Community',
    welcomeSubtitle: 'Portal',
    heroDescription: 'The primary network providing general assistance, lifetime welfare claim support, and cooperative services for the diaspora Pakhtoon tribes living in Muscat, Salalah, Sohar and across Oman.',
    
    // Quick Statistics
    registeredMembers: 'Registered Members',
    activeFunds: 'Active Welfare Funds',
    reportedIncidents: 'Reported Incidents',
    embassyLiaisons: 'Embassy Liaisons',
    
    // Register Form Tab
    newMemberRegistry: 'OPC Diaspora Membership registration',
    fatherName: 'Father Name',
    cnic: 'CNIC / NICOP Number',
    district: 'Home District (KPK / Balochistan)',
    phone: 'Phone Number (Oman)',
    whatsapp: 'WhatsApp Number (Optional)',
    address: 'Address in Oman',
    occupation: 'Occupation / Profession',
    emergency: 'Emergency Contact Person & Phone',
    uploadPhoto: 'Upload Profile Photo',
    submitRegistration: 'Submit Registration Form',
    verifyMembership: 'Verify Registered Status',
    
    // Incident Report Tab
    reportClaim: 'Welfare Report Claim / Emergency Support',
    incidentDescription: 'Please provide details of any accident, emergency, medical crisis, repatriation request, or community issue requiring urgent OPC action.',
    
    // Cabinet Tab
    opcCabinetDirectory: 'OPC Directory & Assemblies',
    executiveCabinet: 'Executive Cabinet',
    verifiedMembers: 'Verified Members',
    cabinetAssembly: 'Cabinet Assembly',
    searchPlaceholder: 'Search directory...',
    castVoteText: 'Cast Council Ballot',
    
    // AI Assistant Tab
    aiTitle: 'OPC AI Welfare Assistant',
    aiSubtitle: 'Speak or type any question regarding OPC membership, registered executive guidelines, Benazir Income Support, embassy support, or repatriation procedures in Oman.',
    aiPlaceholder: 'How can OPC support a fellow brother with medical emergency repatriation...',
  },
  ur: {
    // Navigation / Header
    home: 'ہوم پورٹل',
    register: 'ممبرشپ رجسٹریشن',
    cabinet: 'او پی سی کابینہ',
    elections: 'ووٹ ڈالیں',
    report: 'شکایت / حادثہ',
    chat: 'اے آئی اسسٹنٹ',
    admin: 'ایڈمن ٹرمینل',
    portalTitle: 'کمیونٹی پورٹل',
    omanChapter: 'سلطنتِ عمان چیپٹر',
    omanPakhtoon: 'عمان پختون کمیونٹی',
    signIn: 'لاگ ان کریں',
    signOut: 'لاگ آؤٹ کریں',
    backToTop: 'اوپر جائیں',
    language: 'زبان',
    
    // Hero Dashboard
    welcomeTitle: 'عمان پختون کمیونٹی',
    welcomeSubtitle: 'پورٹل',
    heroDescription: 'مسقط، صلالہ، سہار اور پورے عمان میں بسنے والے پختون قبائل کے لیے بنیادی معاونت، لائف ٹائم ویلفیئر دعوے اور باہمی تعاون کی خدمات فراہم کرنے والا نیٹ ورک۔',
    
    // Quick Statistics
    registeredMembers: 'رجسٹرڈ ممبران',
    activeFunds: 'فعال ویلفیئر فنڈز',
    reportedIncidents: 'رپورٹ شدہ حادثات',
    embassyLiaisons: 'سفارت خانہ رابطہ',
    
    // Register Form Tab
    newMemberRegistry: 'او پی سی ڈائیسپورا رکنیت رجسٹریشن',
    fatherName: 'والد کا نام',
    cnic: 'شناختی کارڈ (CNIC / NICOP) نمبر',
    district: 'آبائی ضلع (کے پی کے / بلوچستان)',
    phone: 'فون نمبر (عمان)',
    whatsapp: 'واٹس ایپ نمبر (اختیاری)',
    address: 'عمان میں رہائش کا پتہ',
    occupation: 'پیشہ / ملازمت',
    emergency: 'ہنگامی رابطہ شخص اور فون نمبر',
    uploadPhoto: 'پروفائل تصویر اپ لوڈ کریں',
    submitRegistration: 'رجسٹریشن فارم جمع کروائیں',
    verifyMembership: 'رجسٹریشن کا اسٹیٹس چیک کریں',
    
    // Incident Report Tab
    reportClaim: 'فلاحی دعویٰ / ہنگامی معاونت کی رپورٹ',
    incidentDescription: 'کسی بھی حادثے، ہنگامی صورتحال، طبی بحران، میت کی واپسی کی درخواست یا او پی سی کی فوری کارروائی کے لیے تفصیلات فراہم کریں۔',
    
    // Cabinet Tab
    opcCabinetDirectory: 'او پی سی ڈائرکٹری اور اسمبلیز',
    executiveCabinet: 'ایگزیکٹو کابینہ',
    verifiedMembers: 'تصدیق شدہ ممبران',
    cabinetAssembly: 'کابینہ اسمبلی',
    searchPlaceholder: 'ڈائرکٹری میں تلاش کریں...',
    castVoteText: 'کونسل بیلٹ کاسٹ کریں',
    
    // AI Assistant Tab
    aiTitle: 'او پی سی فلاحی اے آئی اسسٹنٹ',
    aiSubtitle: 'او پی سی ممبرشپ، رجسٹریشن کے رہنما خطوط، سفارت خانے کی معاونت، یا عمان میں میت کی واپسی کے طریقہ کار کے بارے میں کوئی بھی سوال پوچھیں یا ٹائپ کریں۔',
    aiPlaceholder: 'او پی سی کس طرح ہنگامی طبی صورت حال یا میت کی واپسی میں مدد کر سکتا ہے...',
  },
  ps: {
    // Navigation / Header
    home: 'کورنی پورٹل',
    register: 'غړیتوب ثبتول',
    cabinet: 'او پی سی کابینه',
    elections: 'رایه ورکول',
    report: 'د پیښې راپور',
    chat: 'آئی مرستندوی',
    admin: 'اداري ټرمینل',
    portalTitle: 'کمیونټي پورټل',
    omanChapter: 'عمان څانګه',
    omanPakhtoon: 'عمان پښتون ټولنه',
    signIn: 'ننوتل',
    signOut: 'وتل',
    backToTop: 'پورته لاړشئ',
    language: 'ژبه',
    
    // Hero Dashboard
    welcomeTitle: 'د عمان پښتون ټولنه',
    welcomeSubtitle: 'پورټل',
    heroDescription: 'په مسقط، صلاله، سحار او ټول عمان کې د میشته پښتنو قبایلو لپاره د لومړني ملاتړ، د ژوند د فلاحي دعوو او متقابلو خدماتو شبکه.',
    
    // Quick Statistics
    registeredMembers: 'راجستر شوي غړي',
    activeFunds: 'فعال ویلفیئر فنډونه',
    reportedIncidents: 'راپور شوي پیښې',
    embassyLiaisons: 'د سفارت تواصل',
    
    // Register Form Tab
    newMemberRegistry: 'د غړیتوب ثبتولو فورمه',
    fatherName: 'د پلار نوم',
    cnic: 'پيژند پاڼه (CNIC / NICOP) نمبر',
    district: 'اصلي ولسوالۍ / ولایت (KPK / بامیان)',
    phone: 'د تلیفون شمیره (عمان)',
    whatsapp: 'واټساپ شمیره (اختیاري)',
    address: 'په عمان کې د اوسیدو پته',
    occupation: 'دنده یا مسلک',
    emergency: 'د بیړني تماس شخص او تلیفون شمیره',
    uploadPhoto: 'عکس اپلوډ کړئ',
    submitRegistration: 'د غړیتوب فورمه وسپارئ',
    verifyMembership: 'غړیتوب تصدیق کړئ',
    
    // Incident Report Tab
    reportClaim: 'د فلاحي مرستې یا بیړني حالت راپور',
    incidentDescription: 'د پیښې ، اضطراري طبي بحران ، وطن ته د ستنیدو غوښتنې یا ټولنیزې ستونزې په اړه معلومات ورکړئ چې د OPC عاجل اقدام ته اړتیا لري.',
    
    // Cabinet Tab
    opcCabinetDirectory: 'د او پی سی ډایرکټري او جرګې',
    executiveCabinet: 'اجراییه کابینه',
    verifiedMembers: 'تصدیق شوي غړي',
    cabinetAssembly: 'د کابینې جرګه (اسمبلی)',
    searchPlaceholder: 'لټون وکړئ...',
    castVoteText: 'خپله رایه ورکړئ',
    
    // AI Assistant Tab
    aiTitle: 'د او پی سي د فلاحي چارو هوښیار مرستندوی',
    aiSubtitle: 'د او پی سي غړیتوب، د ثبت لارښوونو، سفارت ملاتړ، یا عمان کې هیواد ته بیرته ستنیدلو په اړه پوښتنې په پښتو یا انګلیسي کې وپوښتئ.',
    aiPlaceholder: 'زه څنګه کولای شم په عمان کی د پښتون ورور عاجل طبي حالت یا مرستي لپاره راپور ورکړم...',
  }
};
