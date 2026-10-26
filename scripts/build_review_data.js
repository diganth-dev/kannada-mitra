import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { VOCABULARY } from '../src/data/vocabulary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const candidates = [
  // 1. GREETINGS (8 items)
  {
    id: 'greet_001',
    bengali: {
      vocabulary_translation: 'নমস্কার',
      romanization: 'Nomoshkar',
      example_sentence: 'সবাইকে নমস্কার।',
      example_romanization: 'Shobaike nomoshkar.',
    },
    urdu: {
      vocabulary_translation: 'سلام / آداب',
      romanization: 'Salaam / Aadaab',
      example_sentence: 'سب کو سلام۔',
      example_romanization: 'Sab ko salaam.',
    },
    reviewer_notes:
      'Universal polite greeting. In Bengali, "Nomoshkar" is standard public etiquette. In Urdu, "Adaab" or "Salaam" is common across diverse communities in the Deccan/Karnataka region. Awaiting native reviewer preference for headword display.',
  },
  {
    id: 'greet_002',
    bengali: {
      vocabulary_translation: 'ধন্যবাদ',
      romanization: 'Dhonnobad',
      example_sentence: 'আপনার সাহায্যের জন্য ধন্যবাদ।',
      example_romanization: 'Apnar shahajjer jonno dhonnobad.',
    },
    urdu: {
      vocabulary_translation: 'شکریہ',
      romanization: 'Shukriya',
      example_sentence: 'آپ کی مدد کا شکریہ۔',
      example_romanization: 'Aap ki madad ka shukriya.',
    },
    reviewer_notes:
      'Standard expression of gratitude. Note Bengali phonology /o/ rounding in "Dhonnobad". Urdu "Shukriya" is universally used across Karnataka.',
  },
  {
    id: 'greet_003',
    bengali: {
      vocabulary_translation: 'সুপ্রভাত',
      romanization: 'Shuprobhat',
      example_sentence: 'সুপ্রভাত, আপনার দিনটি ভালো কাটুক।',
      example_romanization: 'Shuprobhat, apnar dinti bhalo katuk.',
    },
    urdu: {
      vocabulary_translation: 'صبح بخیر',
      romanization: 'Subah bakhair',
      example_sentence: 'صبح بخیر، آپ کا دن اچھا گزرے۔',
      example_romanization: 'Subah bakhair, aap ka din accha guzre.',
    },
    reviewer_notes:
      'Formal morning greetings. In casual everyday conversation, native speakers of both languages frequently use general greetings ("Nomoshkar" / "Salaam") rather than time-specific greetings. Flagged for register review.',
  },
  {
    id: 'greet_004',
    bengali: {
      vocabulary_translation: 'কেমন আছেন?',
      romanization: 'Kemon achen?',
      example_sentence: 'নমস্কার স্যার, কেমন আছেন?',
      example_romanization: 'Nomoshkar sir, kemon achen?',
    },
    urdu: {
      vocabulary_translation: 'آپ کیسے ہیں؟',
      romanization: 'Aap kaise hain?',
      example_sentence: 'سلام سر، آپ کیسے ہیں؟',
      example_romanization: 'Salaam sir, aap kaise hain?',
    },
    reviewer_notes:
      'Formal honorific address matching Kannada "-ra" suffix. Urdu has gender inflection: "Aap kaise hain?" (masculine/default polite) vs "Aap kaisi hain?" (feminine). In Dakhni Urdu, "Kaise hain ji?" is widespread.',
  },
  {
    id: 'greet_005',
    bengali: {
      vocabulary_translation: 'ভালো আছি',
      romanization: 'Bhalo achi',
      example_sentence: 'আমি ভালো আছি, আপনি কেমন আছেন?',
      example_romanization: 'Ami bhalo achi, apni kemon achen?',
    },
    urdu: {
      vocabulary_translation: 'میں ٹھیک ہوں',
      romanization: 'Main theek hoon',
      example_sentence: 'میں ٹھیک ہوں، اور آپ؟',
      example_romanization: 'Main theek hoon, aur aap?',
    },
    reviewer_notes:
      'Standard affirmative reply. In colloquial Bengali, subject pronoun "ami" is optionally omitted. In Dakhni Urdu, "Main accha hoon" is also frequent.',
  },
  {
    id: 'greet_006',
    bengali: {
      vocabulary_translation: 'দয়া করে',
      romanization: 'Doya kore',
      example_sentence: 'দয়া করে এখানে বসুন।',
      example_romanization: 'Doya kore ekhane boshun.',
    },
    urdu: {
      vocabulary_translation: 'براہِ کرم / برائے مہربانی',
      romanization: 'Barahe karam / Baraye mehrbani',
      example_sentence: 'براہِ کرم یہاں تشریف رکھیے۔',
      example_romanization: 'Barahe karam yahan tashreef rakhiye.',
    },
    reviewer_notes:
      'Urdu has high register "Barahe karam" and colloquial "Baraye mehrbani". In Dakhni Urdu, "Meharbani karke" or "Zara" is often preferred for daily requests.',
  },
  {
    id: 'greet_007',
    bengali: {
      vocabulary_translation: 'মাফ করবেন',
      romanization: 'Maaf korben',
      example_sentence: 'মাফ করবেন, আমার দেরি হয়ে গেল।',
      example_romanization: 'Maaf korben, amar deri hoye gelo.',
    },
    urdu: {
      vocabulary_translation: 'معاف کیجیے',
      romanization: 'Maaf kijiye',
      example_sentence: 'معاف کیجیے، مجھے دیر ہو گئی۔',
      example_romanization: 'Maaf kijiye, mujhe der ho gayi.',
    },
    reviewer_notes:
      'Used for both "Excuse me" (seeking attention) and "Sorry" (apology). Semantically identical to Kannada "Kshamisi".',
  },
  {
    id: 'greet_008',
    bengali: {
      vocabulary_translation: 'আবার দেখা হবে',
      romanization: 'Abar dekha hobe',
      example_sentence: 'এখন আসি, আবার দেখা হবে।',
      example_romanization: 'Ekhon ashi, abar dekha hobe.',
    },
    urdu: {
      vocabulary_translation: 'پھر ملیں گے / خدا حافظ',
      romanization: 'Phir milenge / Khuda hafiz',
      example_sentence: 'چلتا ہوں، پھر ملیں گے۔',
      example_romanization: 'Chalta hoon, phir milenge.',
    },
    reviewer_notes:
      'Parting phrases. Note the strong cultural parallel: Kannada "Hogi baruttene" and Bengali "Ekhon ashi" both express "I take leave now with the intention to return". Urdu uses "Phir milenge" or "Khuda/Allah hafiz".',
  },

  // 2. EVERYDAY WORDS (8 items)
  {
    id: 'everyday_001',
    bengali: {
      vocabulary_translation: 'হ্যাঁ',
      romanization: 'Hyan',
      example_sentence: 'হ্যাঁ, এটি আমার বই।',
      example_romanization: 'Hyan, eti amar boi.',
    },
    urdu: {
      vocabulary_translation: 'ہاں / جی ہاں',
      romanization: 'Haan / Jee haan',
      example_sentence: 'جی ہاں، یہ میری کتاب ہے۔',
      example_romanization: 'Jee haan, yeh meri kitaab hai.',
    },
    reviewer_notes:
      'Standard affirmation. Bengali has candrabindu nasalization ("Hyã"). Urdu "Jee haan" denotes respect.',
  },
  {
    id: 'everyday_002',
    bengali: {
      vocabulary_translation: 'না / নেই',
      romanization: 'Na / Nei',
      example_sentence: 'না, আমার লাগবে না।',
      example_romanization: 'Na, amar lagbe na.',
    },
    urdu: {
      vocabulary_translation: 'نہیں / نہیں ہے',
      romanization: 'Nahin / Nahin hai',
      example_sentence: 'نہیں، مجھے نہیں چاہیے۔',
      example_romanization: 'Nahin, mujhe nahin chahiye.',
    },
    reviewer_notes:
      'Crucial semantic distinction: Kannada "Illa" denotes both negation ("No") and absence ("Not there/Not available"). Bengali splits this into "Na" (negation) and "Nei" (absence). Urdu uses "Nahin" vs "Nahin hai". Reviewer must confirm best presentation.',
  },
  {
    id: 'everyday_003',
    bengali: {
      vocabulary_translation: 'চাই / লাগবে',
      romanization: 'Chai / Lagbe',
      example_sentence: 'আমার জল লাগবে।',
      example_romanization: 'Amar jol lagbe.',
    },
    urdu: {
      vocabulary_translation: 'چاہیے',
      romanization: 'Chahiye',
      example_sentence: 'مجھے پانی چاہیے۔',
      example_romanization: 'Mujhe paani chahiye.',
    },
    reviewer_notes:
      'Dative subject construction matching Kannada "Nanage neeru beku". Colloquial Bengali "Amar jol lagbe" directly parallels Kannada syntax. In Dakhni Urdu, "Hona" ("Mereku paani hona") is a famous local mirror of Dravidian "Beku".',
  },
  {
    id: 'everyday_004',
    bengali: {
      vocabulary_translation: 'লাগবে না / চাই না',
      romanization: 'Lagbe na / Chai na',
      example_sentence: 'চিনি লাগবে না।',
      example_romanization: 'Chini lagbe na.',
    },
    urdu: {
      vocabulary_translation: 'نہیں چاہیے',
      romanization: 'Nahin chahiye',
      example_sentence: 'چینی نہیں چاہیے۔',
      example_romanization: 'Cheeni nahin chahiye.',
    },
    reviewer_notes:
      'Polite refusal of items/service. In Dakhni Urdu in Bangalore/Mysore, "Nako" ("Shakkar nako") is universally used as the exact functional equivalent of Kannada "Beda".',
  },
  {
    id: 'everyday_005',
    bengali: {
      vocabulary_translation: 'জানা আছে / চিনি',
      romanization: 'Jana ache / Chini',
      example_sentence: 'আমি এই রাস্তা চিনি।',
      example_romanization: 'Ami ei rasta chini.',
    },
    urdu: {
      vocabulary_translation: 'معلوم ہے / پتا ہے',
      romanization: 'Maaloom hai / Pata hai',
      example_sentence: 'مجھے یہ راستہ معلوم ہے۔',
      example_romanization: 'Mujhe yeh raasta maaloom hai.',
    },
    reviewer_notes:
      'Bengali lexical nuance: "Chena/Chini" is specifically used for knowing/recognizing roads, places, and people, while "Jana" is used for facts/information.',
  },
  {
    id: 'everyday_006',
    bengali: {
      vocabulary_translation: 'জানা নেই / জানি না',
      romanization: 'Jana nei / Jani na',
      example_sentence: 'আমি ওটা জানি না।',
      example_romanization: 'Ami ota jani na.',
    },
    urdu: {
      vocabulary_translation: 'معلوم نہیں / پتا نہیں',
      romanization: 'Maaloom nahin / Pata nahin',
      example_sentence: 'مجھے اس بارے میں پتا نہیں ہے۔',
      example_romanization: 'Mujhe is baare mein pata nahin hai.',
    },
    reviewer_notes:
      'Negative knowledge. In everyday Urdu, "Pata nahin" is common; in Dakhni Urdu, "Nai maaloom" is very standard.',
  },
  {
    id: 'everyday_007',
    bengali: {
      vocabulary_translation: 'ঠিক আছে',
      romanization: 'Thik ache',
      example_sentence: 'ঠিক আছে, সেটাই করা যাক।',
      example_romanization: 'Thik ache, shetai kora jaak.',
    },
    urdu: {
      vocabulary_translation: 'ٹھیک ہے / صحیح',
      romanization: 'Theek hai / Sahi',
      example_sentence: 'ٹھیک ہے، ویسا ہی کرتے ہیں۔',
      example_romanization: 'Theek hai, waisa hi karte hain.',
    },
    reviewer_notes:
      'Everyday agreement/acknowledgment. Notice historical cognate: Urdu "Sahi" and Kannada "Sari".',
  },
  {
    id: 'everyday_008',
    bengali: {
      vocabulary_translation: 'খুব / অনেক',
      romanization: 'Khub / Onek',
      example_sentence: 'আপনাকে অনেক ধন্যবাদ।',
      example_romanization: 'Apnake onek dhonnobad.',
    },
    urdu: {
      vocabulary_translation: 'بہت',
      romanization: 'Bahut',
      example_sentence: 'بہت بہت شکریہ۔',
      example_romanization: 'Bahut bahut shukriya.',
    },
    reviewer_notes:
      'Quantifier/intensifier adverb matching Kannada "Tumba". Bengali uses "Khub" (very) and "Onek" (a lot/many).',
  },

  // 3. NUMBERS (8 items)
  {
    id: 'num_001',
    bengali: {
      vocabulary_translation: 'এক',
      romanization: 'Ek',
      example_sentence: 'একটি কফি দিন।',
      example_romanization: 'Ekti coffee din.',
    },
    urdu: {
      vocabulary_translation: 'ایک',
      romanization: 'Ek',
      example_sentence: 'ایک کافی دیجیے۔',
      example_romanization: 'Ek coffee dijiye.',
    },
    reviewer_notes: 'Cardinal number 1. Bengali uses numerical classifier suffix "-ti" / "-ta" for objects ("ekti coffee").',
  },
  {
    id: 'num_002',
    bengali: {
      vocabulary_translation: 'দুই',
      romanization: 'Dui',
      example_sentence: 'দুটো টিকিট চাই।',
      example_romanization: 'Duto ticket chai.',
    },
    urdu: {
      vocabulary_translation: 'دو',
      romanization: 'Do',
      example_sentence: 'دو ٹکٹ چاہییں۔',
      example_romanization: 'Do ticket chahiyein.',
    },
    reviewer_notes: 'Cardinal number 2. Bengali "duto" (two items).',
  },
  {
    id: 'num_003',
    bengali: {
      vocabulary_translation: 'তিন',
      romanization: 'Tin',
      example_sentence: 'আমরা তিনজন আছি।',
      example_romanization: 'Amra tinjon achi.',
    },
    urdu: {
      vocabulary_translation: 'تین',
      romanization: 'Teen',
      example_sentence: 'ہم تین لوگ ہیں۔',
      example_romanization: 'Hum teen log hain.',
    },
    reviewer_notes: 'Cardinal number 3. Bengali human classifier "-jon" ("tinjon").',
  },
  {
    id: 'num_004',
    bengali: {
      vocabulary_translation: 'চার',
      romanization: 'Char',
      example_sentence: 'চার কিলোমিটার দূরে।',
      example_romanization: 'Char kilometer dure.',
    },
    urdu: {
      vocabulary_translation: 'چار',
      romanization: 'Chaar',
      example_sentence: 'چار کلومیٹر دور ہے۔',
      example_romanization: 'Chaar kilometer door hai.',
    },
    reviewer_notes: 'Cardinal number 4.',
  },
  {
    id: 'num_005',
    bengali: {
      vocabulary_translation: 'পাঁচ',
      romanization: 'Panch',
      example_sentence: 'পাঁচ টাকার খুচরো দিন।',
      example_romanization: 'Panch takar khuchro din.',
    },
    urdu: {
      vocabulary_translation: 'پانچ',
      romanization: 'Paanch',
      example_sentence: 'پانچ روپے کے کھلے دیجیے۔',
      example_romanization: 'Paanch rupaye ke khule dijiye.',
    },
    reviewer_notes: 'Cardinal number 5. Bengali has nasalized vowel with candrabindu.',
  },
  {
    id: 'num_006',
    bengali: {
      vocabulary_translation: 'দশ',
      romanization: 'Dosh',
      example_sentence: 'দশ মিনিটে আসছি।',
      example_romanization: 'Dosh minite aschi.',
    },
    urdu: {
      vocabulary_translation: 'دس',
      romanization: 'Das',
      example_sentence: 'دس منٹ میں آتا ہوں۔',
      example_romanization: 'Das minute mein aata hoon.',
    },
    reviewer_notes: 'Cardinal number 10. Note Bengali rounded vowel pronunciation "Dosh" vs Urdu "Das".',
  },
  {
    id: 'num_007',
    bengali: {
      vocabulary_translation: 'কুড়ি / বিশ',
      romanization: 'Kuri / Bish',
      example_sentence: 'মাত্র কুড়ি টাকা।',
      example_romanization: 'Matro kuri taka.',
    },
    urdu: {
      vocabulary_translation: 'بیس',
      romanization: 'Bees',
      example_sentence: 'صرف بیس روپے۔',
      example_romanization: 'Sirf bees rupaye.',
    },
    reviewer_notes: 'Cardinal number 20. In Bengali, indigenous "Kuri" is common in daily markets alongside Sanskrit-derived "Bish".',
  },
  {
    id: 'num_008',
    bengali: {
      vocabulary_translation: 'একশো',
      romanization: 'Eksho',
      example_sentence: 'একশো টাকা হয়েছে।',
      example_romanization: 'Eksho taka hoyeche.',
    },
    urdu: {
      vocabulary_translation: 'سو',
      romanization: 'Sau',
      example_sentence: 'سو روپے ہوئے۔',
      example_romanization: 'Sau rupaye hue.',
    },
    reviewer_notes: 'Cardinal number 100. Bengali "Eksho" vs Urdu "Sau".',
  },

  // 4. FOOD (6 items)
  {
    id: 'food_001',
    bengali: {
      vocabulary_translation: 'খাবার',
      romanization: 'Khabar',
      example_sentence: 'খাওয়া হয়েছে?',
      example_romanization: 'Khaoa hoyeche?',
    },
    urdu: {
      vocabulary_translation: 'کھانا',
      romanization: 'Khaana',
      example_sentence: 'کھانا ہو گیا؟',
      example_romanization: 'Khaana ho gaya?',
    },
    reviewer_notes:
      'Cultural greeting context: In Karnataka, asking "Oota aayta?" is a warm greeting equivalent to "How are you?". Both Bengali "Khaoa hoyeche?" and Urdu "Khaana ho gaya?" carry this exact hospitality sentiment.',
  },
  {
    id: 'food_002',
    bengali: {
      vocabulary_translation: 'জলখাবার / নাস্তা',
      romanization: 'Jolkhabar / Nasta',
      example_sentence: 'সকালের জলখাবার কী?',
      example_romanization: 'Shokaler jolkhabar ki?',
    },
    urdu: {
      vocabulary_translation: 'ناشتہ',
      romanization: 'Naashta',
      example_sentence: 'صبح کا ناشتہ کیا ہے؟',
      example_romanization: 'Subah ka naashta kya hai?',
    },
    reviewer_notes:
      'Kannada "Tindi" covers breakfast and snacks/tiffin. In Bengali, "Jolkhabar" is traditional West Bengal standard; "Nasta" is common across communities and regions. Urdu "Naashta" strictly refers to breakfast.',
  },
  {
    id: 'food_003',
    bengali: {
      vocabulary_translation: 'জল / পানি',
      romanization: 'Jol / Pani',
      example_sentence: 'খাওয়ার জল দিন।',
      example_romanization: 'Khaowar jol din.',
    },
    urdu: {
      vocabulary_translation: 'پانی',
      romanization: 'Paani',
      example_sentence: 'پینے کا پانی دیجیے۔',
      example_romanization: 'Peene ka paani dijiye.',
    },
    reviewer_notes:
      'Dialectal sensitivity: Bengali speakers in West Bengal predominantly use "Jol", while Bengali speakers in Bangladesh and Muslim communities commonly use "Pani". Both are noted for inclusive learning.',
  },
  {
    id: 'food_004',
    bengali: {
      vocabulary_translation: 'কফি',
      romanization: 'Coffee',
      example_sentence: 'এক কাপ গরম ফিল্টার কফি দিন।',
      example_romanization: 'Ek cup gorom filter coffee din.',
    },
    urdu: {
      vocabulary_translation: 'کافی',
      romanization: 'Coffee',
      example_sentence: 'ایک گرم فلٹر کافی دیجیے۔',
      example_romanization: 'Ek garam filter coffee dijiye.',
    },
    reviewer_notes: 'Loanword universally understood in darshinis and cafes across Karnataka.',
  },
  {
    id: 'food_005',
    bengali: {
      vocabulary_translation: 'সুস্বাদু / স্বাদ',
      romanization: 'Shushwadu / Shaad',
      example_sentence: 'দোসা খুব সুস্বাদু হয়েছে।',
      example_romanization: 'Dosa khub shushwadu hoyeche.',
    },
    urdu: {
      vocabulary_translation: 'لذیذ / مزے دار',
      romanization: 'Lazeez / Mazedaar',
      example_sentence: 'ڈوسا بہت مزے دار ہے۔',
      example_romanization: 'Dosa bahut mazedaar hai.',
    },
    reviewer_notes:
      'Colloquial vs formal: Bengali "Bhalo shaad" or "Khabar khub bhalo" is everyday; "Shushwadu" is textbook. In Urdu, "Mazedaar" is standard everyday; "Lazeez" is formal.',
  },
  {
    id: 'food_006',
    bengali: {
      vocabulary_translation: 'গরম',
      romanization: 'Gorom',
      example_sentence: 'গরম সাম্বার দিন।',
      example_romanization: 'Gorom sambar din.',
    },
    urdu: {
      vocabulary_translation: 'گرم',
      romanization: 'Garam',
      example_sentence: 'گرم سانبھر ڈالیے۔',
      example_romanization: 'Garam sambar daliye.',
    },
    reviewer_notes: 'Temperature descriptor. Both Bengali "Gorom" and Urdu "Garam" share cognate roots.',
  },

  // 5. TRAVEL (6 items)
  {
    id: 'travel_001',
    bengali: {
      vocabulary_translation: 'কোথায়?',
      romanization: 'Kothay?',
      example_sentence: 'বাসস্ট্যান্ড কোথায়?',
      example_romanization: 'Bus stand kothay?',
    },
    urdu: {
      vocabulary_translation: 'کہاں؟',
      romanization: 'Kahaan?',
      example_sentence: 'بس اسٹینڈ کہاں ہے؟',
      example_romanization: 'Bus stand kahaan hai?',
    },
    reviewer_notes: 'Location interrogative.',
  },
  {
    id: 'travel_002',
    bengali: {
      vocabulary_translation: 'যান / চলুন',
      romanization: 'Jan / Cholun',
      example_sentence: 'চলুন, যাওয়া যাক।',
      example_romanization: 'Cholun, jaowa jaak.',
    },
    urdu: {
      vocabulary_translation: 'جائیے / چلیں',
      romanization: 'Jaiye / Chalein',
      example_sentence: 'چلیں، چلتے ہیں۔',
      example_romanization: 'Chalein, chalte hain.',
    },
    reviewer_notes:
      'Honorific imperative "Go" ("Jan" / "Jaiye") vs cohortative "Let\'s go" ("Cholun" / "Chalein"). Matches Kannada dual usage of "Hogi" (Go) and "Hogona" (Let us go).',
  },
  {
    id: 'travel_003',
    bengali: {
      vocabulary_translation: 'আসুন',
      romanization: 'Ashun',
      example_sentence: 'ভেতরে আসুন।',
      example_romanization: 'Bhetore ashun.',
    },
    urdu: {
      vocabulary_translation: 'آئیے',
      romanization: 'Aaiye',
      example_sentence: 'اندر آئیے۔',
      example_romanization: 'Andar aaiye.',
    },
    reviewer_notes: 'Respectful invitation to enter or come, matching Kannada "Banni". In Dakhni Urdu: "Aao ji / Aaiye".',
  },
  {
    id: 'travel_004',
    bengali: {
      vocabulary_translation: 'কাছে',
      romanization: 'Kache',
      example_sentence: 'মেট্রো স্টেশন কাছেই।',
      example_romanization: 'Metro station kachei.',
    },
    urdu: {
      vocabulary_translation: 'قریب / نزدیک',
      romanization: 'Qareeb / Nazdeek',
      example_sentence: 'میٹرو اسٹیشن قریب ہی ہے۔',
      example_romanization: 'Metro station qareeb hi hai.',
    },
    reviewer_notes: 'Spatial proximity near.',
  },
  {
    id: 'travel_005',
    bengali: {
      vocabulary_translation: 'দূরে',
      romanization: 'Dure',
      example_sentence: 'এয়ারপোর্ট এখান থেকে অনেক দূরে।',
      example_romanization: 'Airport ekhan theke onek dure.',
    },
    urdu: {
      vocabulary_translation: 'دور',
      romanization: 'Door',
      example_sentence: 'ایئرپورٹ یہاں سے بہت دور ہے۔',
      example_romanization: 'Airport yahan se bahut door hai.',
    },
    reviewer_notes: 'Spatial distance far.',
  },
  {
    id: 'travel_006',
    bengali: {
      vocabulary_translation: 'এখানে থামান',
      romanization: 'Ekhane thaman',
      example_sentence: 'দয়া করে এখানে অটো থামান।',
      example_romanization: 'Doya kore ekhane auto thaman.',
    },
    urdu: {
      vocabulary_translation: 'یہاں روکیے',
      romanization: 'Yahan rokiye',
      example_sentence: 'براہِ کرم آٹو یہاں روکیے۔',
      example_romanization: 'Barahe karam auto yahan rokiye.',
    },
    reviewer_notes:
      'Transit instruction for autos and taxis. In Dakhni Urdu in Bangalore/Mysore, "Yahan roko ji" or "Yahan rok dijiye" is the exact street vernacular.',
  },

  // 6. SHOPPING (6 items)
  {
    id: 'shop_001',
    bengali: {
      vocabulary_translation: 'কত?',
      romanization: 'Koto?',
      example_sentence: 'এটার দাম কত?',
      example_romanization: 'Etar dam koto?',
    },
    urdu: {
      vocabulary_translation: 'کتنا؟',
      romanization: 'Kitna?',
      example_sentence: 'اس کی قیمت کتنی ہے؟',
      example_romanization: 'Is ki qeemat kitni hai?',
    },
    reviewer_notes: 'Price and quantity question interrogative.',
  },
  {
    id: 'shop_002',
    bengali: {
      vocabulary_translation: 'দাম',
      romanization: 'Dam',
      example_sentence: 'সঠিক দাম বলুন।',
      example_romanization: 'Sothik dam bolun.',
    },
    urdu: {
      vocabulary_translation: 'قیمت',
      romanization: 'Qeemat',
      example_sentence: 'صحیح قیمت بتائیے۔',
      example_romanization: 'Sahi qeemat bataiye.',
    },
    reviewer_notes: 'Price noun.',
  },
  {
    id: 'shop_003',
    bengali: {
      vocabulary_translation: 'একটু কম করুন',
      romanization: 'Ektu kom korun',
      example_sentence: 'দয়া করে একটু কম রাখুন।',
      example_romanization: 'Doya kore ektu kom rakhun.',
    },
    urdu: {
      vocabulary_translation: 'کم کیجیے',
      romanization: 'Kam kijiye',
      example_sentence: 'براہِ کرم قیمت تھوڑی کم کیجیے۔',
      example_romanization: 'Barahe karam qeemat thodi kam kijiye.',
    },
    reviewer_notes:
      'Market bargaining phrase. In Dakhni Urdu, "Thoda kam karo ji" is common in market interactions.',
  },
  {
    id: 'shop_004',
    bengali: {
      vocabulary_translation: 'এটা / এটি',
      romanization: 'Eta / Eti',
      example_sentence: 'এটা ভালো।',
      example_romanization: 'Eta bhalo.',
    },
    urdu: {
      vocabulary_translation: 'یہ',
      romanization: 'Yeh',
      example_sentence: 'یہ اچھا ہے۔',
      example_romanization: 'Yeh accha hai.',
    },
    reviewer_notes: 'Proximal demonstrative pronoun this.',
  },
  {
    id: 'shop_005',
    bengali: {
      vocabulary_translation: 'ওটা / সেটি',
      romanization: 'Ota / Sheti',
      example_sentence: 'ওটা দেখান।',
      example_romanization: 'Ota dekhan.',
    },
    urdu: {
      vocabulary_translation: 'وہ',
      romanization: 'Woh',
      example_sentence: 'وہ دکھائیے۔',
      example_romanization: 'Woh dikhaiye.',
    },
    reviewer_notes: 'Distal demonstrative pronoun that.',
  },
  {
    id: 'shop_006',
    bengali: {
      vocabulary_translation: 'খুচরো আছে কি?',
      romanization: 'Khuchro ache ki?',
      example_sentence: 'পাঁচশো টাকার খুচরো আছে?',
      example_romanization: 'Panchsho takar khuchro ache?',
    },
    urdu: {
      vocabulary_translation: 'کھلے ہیں کیا؟',
      romanization: 'Khule hain kya?',
      example_sentence: 'پانچ سو روپے کے کھلے ہیں؟',
      example_romanization: 'Paanch sau rupaye ke khule hain?',
    },
    reviewer_notes:
      'Inquiry for small currency/change. Bengali specifically uses "Khuchro"; Urdu uses "Khule paise" or "Rezgari" / "Chillar" (shared Deccan slang).',
  },

  // 7. COMMON QUESTIONS (6 items)
  {
    id: 'quest_001',
    bengali: {
      vocabulary_translation: 'আপনার নাম কী?',
      romanization: 'Apnar naam ki?',
      example_sentence: 'নমস্কার, আপনার নাম কী?',
      example_romanization: 'Nomoshkar, apnar naam ki?',
    },
    urdu: {
      vocabulary_translation: 'آپ کا نام کیا ہے؟',
      romanization: 'Aap ka naam kya hai?',
      example_sentence: 'سلام، آپ کا نام کیا ہے؟',
      example_romanization: 'Salaam, aap ka naam kya hai?',
    },
    reviewer_notes: 'Polite name inquiry.',
  },
  {
    id: 'quest_002',
    bengali: {
      vocabulary_translation: 'কটা বাজে?',
      romanization: 'Kota baje?',
      example_sentence: 'এখন কটা বাজে?',
      example_romanization: 'Ekhon kota baje?',
    },
    urdu: {
      vocabulary_translation: 'وقت کیا ہوا ہے؟',
      romanization: 'Waqt kya hua hai?',
      example_sentence: 'ابھی وقت کیا ہوا ہے؟',
      example_romanization: 'Abhi waqt kya hua hai?',
    },
    reviewer_notes: 'Time inquiry. Bengali idiomatically asks "Kota baje?" (How many strikes have rung?).',
  },
  {
    id: 'quest_003',
    bengali: {
      vocabulary_translation: 'কেন?',
      romanization: 'Keno?',
      example_sentence: 'দেরি হলো কেন?',
      example_romanization: 'Deri holo keno?',
    },
    urdu: {
      vocabulary_translation: 'کیوں؟',
      romanization: 'Kyon?',
      example_sentence: 'دیر کیوں ہوئی؟',
      example_romanization: 'Der kyon hui?',
    },
    reviewer_notes: 'Interrogative reason why.',
  },
  {
    id: 'quest_004',
    bengali: {
      vocabulary_translation: 'কখন?',
      romanization: 'Kokhon?',
      example_sentence: 'বাস কখন আসবে?',
      example_romanization: 'Bus kokhon ashbe?',
    },
    urdu: {
      vocabulary_translation: 'کب؟',
      romanization: 'Kab?',
      example_sentence: 'بس کب آئے گی؟',
      example_romanization: 'Bus kab aaye gi?',
    },
    reviewer_notes: 'Time interrogative when.',
  },
  {
    id: 'quest_005',
    bengali: {
      vocabulary_translation: 'কীভাবে / কেমন করে?',
      romanization: 'Kibhabe / Kemon kore?',
      example_sentence: 'ওখানে কীভাবে যাব?',
      example_romanization: 'Okhane kibhabe jabo?',
    },
    urdu: {
      vocabulary_translation: 'کیسے؟',
      romanization: 'Kaise?',
      example_sentence: 'وہاں کیسے جائیں؟',
      example_romanization: 'Wahan kaise jaaein?',
    },
    reviewer_notes: 'Manner interrogative how.',
  },
  {
    id: 'quest_006',
    bengali: {
      vocabulary_translation: 'কী খবর?',
      romanization: 'Ki khobor?',
      example_sentence: 'কেমন আছেন, কী খবর?',
      example_romanization: 'Kemon achen, ki khobor?',
    },
    urdu: {
      vocabulary_translation: 'کیا حال چال؟',
      romanization: 'Kya haal chaal?',
      example_sentence: 'کیسے ہیں، کیا خبر ہے؟',
      example_romanization: 'Kaise hain, kya khabar hai?',
    },
    reviewer_notes: 'Casual inquiry matching Kannada "Enu samachara?".',
  },

  // 8. USEFUL SENTENCES (6 items)
  {
    id: 'sent_001',
    bengali: {
      vocabulary_translation: 'আমি একটু কন্নড় জানি',
      romanization: 'Ami ektu Kannada jani',
      example_sentence: 'মাফ করবেন, আমি একটু কন্নড় জানি।',
      example_romanization: 'Maaf korben, ami ektu Kannada jani.',
    },
    urdu: {
      vocabulary_translation: 'مجھے تھوڑی کنڑ آتی ہے',
      romanization: 'Mujhe thodi Kannada aati hai',
      example_sentence: 'معاف کیجیے، مجھے تھوڑی کنڑ آتی ہے۔',
      example_romanization: 'Maaf kijiye, mujhe thodi Kannada aati hai.',
    },
    reviewer_notes: 'Critical beginner sentence. Notice in Urdu: "Kannada aati hai" uses feminine agreement for language.',
  },
  {
    id: 'sent_002',
    bengali: {
      vocabulary_translation: 'আমি কন্নড় শিখছি',
      romanization: 'Ami Kannada shikhchi',
      example_sentence: 'আমি কন্নড় শিখছি, একটু সাহায্য করুন।',
      example_romanization: 'Ami Kannada shikhchi, ektu shahajjo korun.',
    },
    urdu: {
      vocabulary_translation: 'میں کنڑ سیکھ رہا/رہی ہوں',
      romanization: 'Main Kannada seekh raha hoon',
      example_sentence: 'میں کنڑ سیکھ رہا ہوں، مدد کیجیے۔',
      example_romanization: 'Main Kannada seekh raha hoon, madad kijiye.',
    },
    reviewer_notes:
      'Urdu gender agreement note: Male speaker: "seekh raha hoon"; Female speaker: "seekh rahi hoon". Reviewer should confirm if dual form display is preferred.',
  },
  {
    id: 'sent_003',
    bengali: {
      vocabulary_translation: 'আস্তে কথা বলুন',
      romanization: 'Aaste kotha bolun',
      example_sentence: 'দয়া করে একটু আস্তে কথা বলুন।',
      example_romanization: 'Doya kore ektu aaste kotha bolun.',
    },
    urdu: {
      vocabulary_translation: 'آہستہ بولیے',
      romanization: 'Aahista boliye',
      example_sentence: 'براہِ کرم آہستہ بولیے۔',
      example_romanization: 'Barahe karam aahista boliye.',
    },
    reviewer_notes: 'Pacing request for learners.',
  },
  {
    id: 'sent_004',
    bengali: {
      vocabulary_translation: 'সাহায্য করুন',
      romanization: 'Shahajjo korun',
      example_sentence: 'দয়া করে আমাকে একটু সাহায্য করুন।',
      example_romanization: 'Doya kore amake ektu shahajjo korun.',
    },
    urdu: {
      vocabulary_translation: 'مدد کیجیے',
      romanization: 'Madad kijiye',
      example_sentence: 'براہِ کرم میری تھوڑی مدد کیجیے۔',
      example_romanization: 'Barahe karam meri thodi madad kijiye.',
    },
    reviewer_notes: 'Polite help request.',
  },
  {
    id: 'sent_005',
    bengali: {
      vocabulary_translation: 'আমি বুঝতে পারিনি',
      romanization: 'Ami bujhte parini',
      example_sentence: 'মাফ করবেন, আমি বুঝতে পারিনি।',
      example_romanization: 'Maaf korben, ami bujhte parini.',
    },
    urdu: {
      vocabulary_translation: 'مجھے سمجھ نہیں آیا',
      romanization: 'Mujhe samajh nahin aaya',
      example_sentence: 'معاف کیجیے، مجھے سمجھ نہیں آیا۔',
      example_romanization: 'Maaf kijiye, mujhe samajh nahin aaya.',
    },
    reviewer_notes: 'Comprehension clarification.',
  },
  {
    id: 'sent_006',
    bengali: {
      vocabulary_translation: 'বেঙ্গালুরু খুব সুন্দর',
      romanization: 'Bengaluru khub shundor',
      example_sentence: 'কর্ণাটক ও বেঙ্গালুরু খুব সুন্দর।',
      example_romanization: 'Kornatok o Bengaluru khub shundor.',
    },
    urdu: {
      vocabulary_translation: 'بنگلور بہت خوبصورت ہے',
      romanization: 'Bengaluru bahut khoobsurat hai',
      example_sentence: 'کرناٹک اور بنگلور بہت خوبصورت ہیں۔',
      example_romanization: 'Karnataka aur Bengaluru bahut khoobsurat hain.',
    },
    reviewer_notes: 'Appreciation expression. Both Bengali and Urdu forms express natural admiration for Bengaluru and Karnataka.',
  },
];

const candidateMap = new Map(candidates.map((c) => [c.id, c]));

const entries = VOCABULARY.map((v) => {
  const candidate = candidateMap.get(v.id);
  if (!candidate) {
    throw new Error(`Missing candidate entry for ${v.id}`);
  }
  return {
    id: v.id,
    category: v.category,
    english: v.english,
    kannada: v.kannada,
    kannada_pronunciation: v.pronunciation,
    kannada_example: v.example?.kannada || '',
    kannada_example_pronunciation: v.example?.pronunciation || '',
    english_example: v.example?.english || '',
    bengali: candidate.bengali,
    urdu: candidate.urdu,
    verification_status: 'pending_review',
    reviewer_notes: candidate.reviewer_notes,
  };
});

const output = {
  _metadata: {
    title: 'Kannada Mitra — Bengali & Urdu Pending Translations Review Dataset',
    description:
      'Structured candidate review data for 54 foundation vocabulary items. Strictly isolated from the active runtime learning dataset. All items require verified review by a native speaker before ingestion into production vocabulary.',
    version: '1.0.0',
    totalEntries: entries.length,
    status: 'pending_review',
    isolationNotice:
      'This file is exclusively a review manifest. It is NOT loaded into active vocabulary, flashcards, or quizzes.',
    requiredReviewFields: [
      'bengali_translation',
      'bengali_romanization',
      'bengali_example',
      'bengali_example_romanization',
      'urdu_translation',
      'urdu_romanization',
      'urdu_example',
      'urdu_example_romanization',
      'verification_status',
      'reviewer_notes',
    ],
  },
  entries,
};

const targetPath = path.resolve(__dirname, '../src/data/pending_translations_bengali_urdu.json');
fs.writeFileSync(targetPath, JSON.stringify(output, null, 2), 'utf-8');
console.log(`Successfully generated enriched review file at ${targetPath} with ${entries.length} entries.`);
