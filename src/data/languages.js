export const SUPPORTED_LANGUAGES = [
  {
    id: 'Telugu',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    script: 'Telugu',
    flag: '🇮🇳',
    tagline: 'కన్నడ సులభంగా నేర్చుకోండి',
    relation: 'Dravidian sister language with very similar grammar and script roots',
    sample: 'నమస్కారం',
  },
  {
    id: 'Tamil',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    script: 'Tamil',
    flag: '🇮🇳',
    tagline: 'கன்னடத்தை எளிதாகக் கற்றுக்கொள்ளுங்கள்',
    relation: 'Close Dravidian sister language sharing numerous root words',
    sample: 'வணக்கம்',
  },
  {
    id: 'Hindi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    script: 'Devanagari',
    flag: '🇮🇳',
    tagline: 'आसानी से कन्नड़ सीखें',
    relation: 'Bridge language sharing many Sanskrit-derived vocabulary items',
    sample: 'नमस्ते',
  },
  {
    id: 'Malayalam',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    script: 'Malayalam',
    flag: '🇮🇳',
    tagline: 'കന്നഡ എളുപ്പത്തിൽ പഠിക്കാം',
    relation: 'Neighboring Dravidian language with rich shared vocabulary',
    sample: 'നമസ്കാരം',
  },
  {
    id: 'Marathi',
    name: 'Marathi',
    nativeName: 'मराठी',
    script: 'Devanagari',
    flag: '🇮🇳',
    tagline: 'सहजपणे कन्नड शिका',
    relation: 'Neighboring state language with strong historical cultural ties',
    sample: 'नमस्कार',
  },
  {
    id: 'Tulu',
    name: 'Tulu',
    nativeName: 'ತುಳು',
    script: 'Kannada script',
    flag: '💛❤️',
    tagline: 'ಕನ್ನಡ ಸುಲಭವಾದ್ ಕಲ್ಪುಲೆ',
    relation: 'Karnataka\'s coastal native sister language sharing deep regional roots',
    sample: 'ಸೊಲ್ಮೆಲು',
  },
  {
    id: 'English',
    name: 'English',
    nativeName: 'English',
    script: 'Latin',
    flag: '🌐',
    tagline: 'Learn Kannada effortlessly',
    relation: 'Global bridge language for newcomers and professionals in Karnataka',
    sample: 'Hello',
  },
];

/**
 * Step 1 Onboarding Languages: "Which language do you speak?"
 * Supports: Kannada, Hindi, English, Telugu, Tamil, Malayalam, Marathi, Bengali, Urdu
 */
export const ONBOARDING_PREFERENCE_LANGUAGES = [
  {
    id: 'Kannada',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    flag: '💛❤️',
    script: 'Kannada',
    tagline: 'ಕರ್ನಾಟಕದ ಹೆಮ್ಮೆಯ ಭಾಷೆ',
    sample: 'ನಮಸ್ಕಾರ',
    description: 'Official and classical language of Karnataka.',
  },
  {
    id: 'Hindi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
    script: 'Devanagari',
    tagline: 'भारत की प्रमुख संपर्क भाषा',
    sample: 'नमस्ते',
    description: 'Widely spoken bridge language sharing classical roots.',
  },
  {
    id: 'English',
    name: 'English',
    nativeName: 'English',
    flag: '🌐',
    script: 'Latin',
    tagline: 'Global lingua franca',
    sample: 'Hello',
    description: 'Global bridge language for professionals and students.',
  },
  {
    id: 'Telugu',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    flag: '🇮🇳',
    script: 'Telugu',
    tagline: 'కన్నడకు అత్యంత దగ్గరి సహోదరి భాష',
    sample: 'నమస్కారం',
    description: 'Closest Dravidian sister language sharing similar script styles.',
  },
  {
    id: 'Tamil',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    flag: '🇮🇳',
    script: 'Tamil',
    tagline: 'தொன்மையான திராவிட மொழி',
    sample: 'வணக்கம்',
    description: 'Classical Dravidian sister language with rich shared roots.',
  },
  {
    id: 'Malayalam',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    flag: '🇮🇳',
    script: 'Malayalam',
    tagline: 'കേരളത്തിലെ സഹോദര ഭാഷ',
    sample: 'നമസ്കാരം',
    description: 'Southern Dravidian sister language with shared vocabulary.',
  },
  {
    id: 'Marathi',
    name: 'Marathi',
    nativeName: 'मराठी',
    flag: '🇮🇳',
    script: 'Devanagari',
    tagline: 'शेजारील राज्याची समृद्ध भाषा',
    sample: 'नमस्कार',
    description: 'Neighboring state language sharing cultural and regional ties.',
  },
  {
    id: 'Bengali',
    name: 'Bengali',
    nativeName: 'বাংলা',
    flag: '🇮🇳',
    script: 'Bengali',
    tagline: 'মিষ্টি ও সমৃদ্ধ ভাষা',
    sample: 'নমস্কার',
    description: 'Major Indo-Aryan language spoken across eastern India.',
  },
  {
    id: 'Urdu',
    name: 'Urdu',
    nativeName: 'اردو',
    flag: '🇮🇳',
    script: 'Perso-Arabic',
    tagline: 'دکن کی روایتی تہذیبی زبان',
    sample: 'سلام / آداب',
    description: 'Rich cultural language with deep historical roots in the Deccan.',
  },
];

/**
 * Step 2 Onboarding Target Languages: "Which language do you want to learn?"
 * Includes: Kannada, Hindi, English, Telugu, Tamil, Malayalam, Marathi, Bengali
 */
export const ONBOARDING_TARGET_LANGUAGES = [
  {
    id: 'Kannada',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    flag: '💛❤️',
    script: 'Kannada',
    tagline: 'Learn Kannada. Connect with Karnataka.',
    status: 'supported',
    description: '50+ interactive lessons with audio, native script, and quiz practice.',
  },
  {
    id: 'Hindi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
    script: 'Devanagari',
    tagline: 'Connect across India through Hindi',
    status: 'supported',
    description: '50+ interactive lessons with Devanagari script, pronunciation, and quizzes.',
  },
  {
    id: 'English',
    name: 'English',
    nativeName: 'English',
    flag: '🌐',
    script: 'Latin',
    tagline: 'Global communication & business',
    status: 'supported',
    description: '50+ interactive lessons with pronunciation and bilingual quizzes.',
  },
  {
    id: 'Telugu',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    flag: '🇮🇳',
    script: 'Telugu',
    tagline: 'Explore Andhra & Telangana',
    status: 'supported',
    description: '50+ interactive lessons with Telugu script, pronunciation, and quizzes.',
  },
  {
    id: 'Tamil',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    flag: '🇮🇳',
    script: 'Tamil',
    tagline: 'Discover classical Tamil literature',
    status: 'supported',
    description: '50+ interactive lessons with Tamil script, pronunciation, and quizzes.',
  },
  {
    id: 'Malayalam',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    flag: '🇮🇳',
    script: 'Malayalam',
    tagline: 'Connect with Kerala',
    status: 'supported',
    description: '50+ interactive lessons with Malayalam script, pronunciation, and quizzes.',
  },
  {
    id: 'Marathi',
    name: 'Marathi',
    nativeName: 'मराठी',
    flag: '🇮🇳',
    script: 'Devanagari',
    tagline: 'Experience Maharashtra culture',
    status: 'supported',
    description: '50+ interactive lessons with Devanagari script, pronunciation, and quizzes.',
  },
  {
    id: 'Bengali',
    name: 'Bengali',
    nativeName: 'বাংলা',
    flag: '🇮🇳',
    script: 'Bengali',
    tagline: 'Explore Bengal\'s literary heritage',
    status: 'coming_soon',
    description: 'Curated curriculum in active development.',
  },
];

/**
 * Languages with 100% complete, verified vocabulary, pronunciation, and example sentences
 */
export const VERIFIED_DATASET_LANGUAGES = [
  'Kannada',
  'Hindi',
  'English',
  'Telugu',
  'Tamil',
  'Malayalam',
  'Marathi',
  'Tulu',
];

/**
 * Checks if a specific (Target, Preferred) language combination is currently
 * supported with complete vocabulary, translations, examples, and audio in the dataset.
 */
export const isLanguagePairSupported = (targetLanguage, preferredLanguage) => {
  if (!targetLanguage || !preferredLanguage || targetLanguage === preferredLanguage) {
    return false;
  }
  return (
    VERIFIED_DATASET_LANGUAGES.includes(targetLanguage) &&
    VERIFIED_DATASET_LANGUAGES.includes(preferredLanguage)
  );
};

/**
 * Returns supported alternative bridge languages for learning the target language.
 */
export const getSupportedAlternatives = (targetLanguage) => {
  if (VERIFIED_DATASET_LANGUAGES.includes(targetLanguage)) {
    return VERIFIED_DATASET_LANGUAGES.filter((lang) => lang !== targetLanguage);
  }
  return ['Kannada', 'Hindi', 'English', 'Telugu', 'Tamil', 'Malayalam', 'Marathi'];
};

/**
 * Returns metadata object for a language ID
 */
export const getLanguageMetadata = (langId) => {
  const match =
    ONBOARDING_PREFERENCE_LANGUAGES.find((l) => l.id === langId) ||
    ONBOARDING_TARGET_LANGUAGES.find((l) => l.id === langId) ||
    SUPPORTED_LANGUAGES.find((l) => l.id === langId);

  return match || { id: langId, name: langId, nativeName: langId, flag: '🌐' };
};

export const CATEGORIES = [
  { id: 'all', name: 'All Words', icon: 'Sparkles', description: 'Explore all vocabulary across categories' },
  { id: 'Greetings', name: 'Greetings', icon: 'Smile', description: 'Polite words to say hello, thank you, and greet people' },
  { id: 'Everyday Words', name: 'Everyday Words', icon: 'MessageSquare', description: 'Essential yes/no, want/need, and daily basics' },
  { id: 'Numbers', name: 'Numbers', icon: 'Hash', description: 'Count and understand prices and quantities' },
  { id: 'Food', name: 'Food', icon: 'Utensils', description: 'Order delicious Karnataka dishes, coffee, and water' },
  { id: 'Travel', name: 'Travel', icon: 'Compass', description: 'Navigate autos, buses, metros, and directions' },
  { id: 'Shopping', name: 'Shopping', icon: 'ShoppingBag', description: 'Ask prices, bargain, and request change' },
  { id: 'Common Questions', name: 'Common Questions', icon: 'HelpCircle', description: 'Ask who, what, where, when, and how' },
  { id: 'Useful Sentences', name: 'Useful Sentences', icon: 'BookOpen', description: 'Conversational phrases to connect with locals' },
  { id: 'Family', name: 'Family', icon: 'Users', description: 'Family members, relatives, and relationships' },
  { id: 'Time', name: 'Time', icon: 'Clock', description: 'Days, hours, minutes, and temporal terms' },
  { id: 'Directions', name: 'Directions', icon: 'MapPin', description: 'Locations, navigation, and cardinal directions' },
  { id: 'Verbs', name: 'Verbs', icon: 'Zap', description: 'Action verbs for everyday communication' },
  { id: 'Home', name: 'Home', icon: 'Home', description: 'Household items, rooms, and domestic essentials' },
  { id: 'Health', name: 'Health', icon: 'Heart', description: 'Body parts, common ailments, and medical care' },
  { id: 'Work', name: 'Work', icon: 'Briefcase', description: 'Office, jobs, workplace terms, and professional life' },
];
