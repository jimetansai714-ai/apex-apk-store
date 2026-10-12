export type PolicyType = 'privacy' | 'terms' | 'dmca' | 'security' | 'developer' | 'contact';

export interface PolicyDocument {
  id: PolicyType;
  titleEn: string;
  titleMy: string;
  lastUpdated: string;
  sections: {
    headingEn: string;
    headingMy: string;
    contentEn: string;
    contentMy: string;
  }[];
}

export const POLICIES: Record<PolicyType, PolicyDocument> = {
  privacy: {
    id: 'privacy',
    titleEn: 'Privacy Policy',
    titleMy: 'ကိုယ်ရေးကိုယ်တာ အချက်အလက် မူဝါဒ',
    lastUpdated: 'October 2026',
    sections: [
      {
        headingEn: '1. Information We Collect',
        headingMy: '၁။ ကျွန်ုပ်တို့ စုဆောင်းရယူသည့် အချက်အလက်များ',
        contentEn: 'P-Store is committed to safeguarding user privacy. We do NOT require mandatory user accounts to browse or download APK packages. We only collect standard anonymized metrics such as browser type, download counts, and device OS versions to improve service speed and stability.',
        contentMy: 'P-Store သည် အသုံးပြုသူများ၏ ကိုယ်ရေးကိုယ်တာ လုံခြုံမှုကို အလေးထားပါသည်။ အက်ပ်များကို ဒေါင်းလုဒ်ဆွဲရန် အကောင့်ဖွင့်ရန် မလိုအပ်ပါ။ ဝန်ဆောင်မှု မြန်ဆန်ကောင်းမွန်စေရန် ဒေါင်းလုဒ်အရေအတွက်နှင့် အခြေခံ နည်းပညာဆိုင်ရာ အချက်အလက်များကိုသာ စုဆောင်းပါသည်။',
      },
      {
        headingEn: '2. Zero Spyware & Malware Commitment',
        headingMy: '၂။ ထောက်လှမ်းရေးဆော့ဖ်ဝဲနှင့် ဗိုင်းရပ်စ် ကင်းစင်မှု အာမခံချက်',
        contentEn: 'Every Android APK file hosted on our content delivery network is strictly verified against cryptographic SHA-256 checksums and scanned through automated security inspection. We do not modify, inject adware, or tamper with original developer signatures.',
        contentMy: 'ကျွန်ုပ်တို့၏ စနစ်တွင် တင်ထားသော APK ဖိုင်တိုင်းကို မူရင်း SHA-256 Checksum ဖြင့် စစ်ဆေးပြီး ဗိုင်းရပ်စ်နှင့် ကြော်ငြာဆော့ဖ်ဝဲလ်များ မပါဝင်ကြောင်း အဆင့်ဆင့် စစ်ဆေးထားပါသည်။ မူရင်း Developer လက်မှတ်ကို မည်သည့်အခါမျှ ပြုပြင်ခြင်း မပြုလုပ်ပါ။',
      },
      {
        headingEn: '3. Third-Party Services & Cookies',
        headingMy: '၃။ ပြင်ပဝန်ဆောင်မှုများနှင့် ကွတ်ကီးများ',
        contentEn: 'We use local browser storage strictly to remember your preferred language, theme preference (Dark/Light), and download manager progress. We do not sell your browsing activity or data to third-party data brokers.',
        contentMy: 'ဘာသာစကား ရွေးချယ်မှု၊ Dark Mode နှင့် ဒေါင်းလုဒ်အခြေအနေ မှတ်သားရန်အတွက်သာ ကွတ်ကီးများကို သုံးစွဲပါသည်။ အသုံးပြုသူ၏ ဒေတာများကို မည်သည့် ကြော်ငြာကုမ္ပဏီထံသို့မျှ ပြန်လည်ရောင်းချခြင်း မရှိပါ။',
      },
      {
        headingEn: '4. Contacting Our Data Protection Officer',
        headingMy: '၄။ ကိုယ်ရေးကိုယ်တာဆိုင်ရာ မေးမြန်းစုံစမ်းရန်',
        contentEn: 'If you have questions or data removal requests under GDPR / CCPA, contact our privacy officer directly at jimetansai714@gmail.com or via WhatsApp/Telegram at +959977500588.',
        contentMy: 'ကိုယ်ရေးကိုယ်တာ အချက်အလက်များနှင့် ပတ်သက်၍ မေးမြန်းလိုပါက jimetansai714@gmail.com သို့မဟုတ် WhatsApp/Telegram +959977500588 သို့ တိုက်ရိုက် ဆက်သွယ်မေးမြန်းနိုင်ပါသည်။',
      },
    ],
  },
  terms: {
    id: 'terms',
    titleEn: 'Terms of Service',
    titleMy: 'ဝန်ဆောင်မှု အသုံးပြုခြင်းဆိုင်ရာ စည်းမျဉ်းများ',
    lastUpdated: 'October 2026',
    sections: [
      {
        headingEn: '1. Acceptance of Terms',
        headingMy: '၁။ စည်းမျဉ်းများကို သဘောတူညီခြင်း',
        contentEn: 'By accessing or downloading software from P-Store, you agree to comply with these terms, all applicable local and international copyright laws, and the Google Android platform software safety policies.',
        contentMy: 'P-Store ဝဘ်ဆိုက်ကို အသုံးပြုခြင်း သို့မဟုတ် APK ဖိုင်များကို ဒေါင်းလုဒ်ဆွဲခြင်းဖြင့် ဤစည်းမျဉ်းစည်းကမ်းများနှင့် သက်ဆိုင်ရာ ဥပဒေများကို လိုက်နာရန် သဘောတူညီပြီး ဖြစ်ပါသည်။',
      },
      {
        headingEn: '2. Permissible Use',
        headingMy: '၂။ ခွင့်ပြုထားသော အသုံးပြုမှု နယ်ပယ်',
        contentEn: 'P-Store provides direct high-speed access to free and open-source Android applications, utilities, and developer releases. Users are strictly prohibited from using our bandwidth for reverse engineering, automated scraping, or redistributing malicious payloads.',
        contentMy: 'အခမဲ့နှင့် တရားဝင် Android ဆော့ဖ်ဝဲလ်များကို ဒေါင်းလုဒ်ရယူရန် စီစဉ်ပေးထားခြင်း ဖြစ်ပြီး မသမာသော နည်းလမ်းဖြင့် တိုက်ခိုက်ခြင်း၊ ဖျက်ဆီးခြင်းများ မပြုလုပ်ရပါ။',
      },
      {
        headingEn: '3. Intellectual Property Disclaimer',
        headingMy: '၃။ မူပိုင်ခွင့်နှင့် ကုန်အမှတ်တံဆိပ် ရှင်းလင်းချက်',
        contentEn: 'All trademarks, logos, brand names, and software binaries are the property of their respective copyright owners and software developers. P-Store is an independent distribution mirror and is not affiliated with Google LLC.',
        contentMy: 'ဆော့ဖ်ဝဲလ် အမှတ်တံဆိပ်များနှင့် ဖိုင်များသည် သက်ဆိုင်ရာ မူရင်းဖန်တီးသူ Developer များ၏ ပိုင်ဆိုင်မှုသာ ဖြစ်ပါသည်။ P-Store သည် သီးခြား လွတ်လပ်သော ဖြန့်ချိရေး စင်တာတစ်ခု ဖြစ်ပါသည်။',
      },
    ],
  },
  dmca: {
    id: 'dmca',
    titleEn: 'DMCA & Copyright Takedown Policy',
    titleMy: 'မူပိုင်ခွင့် ချိုးဖောက်မှု အရေးယူဆောင်ရွက်ရေး မူဝါဒ (DMCA)',
    lastUpdated: 'October 2026',
    sections: [
      {
        headingEn: '1. Notice and Takedown Procedure',
        headingMy: '၁။ အကြောင်းကြားခြင်းနှင့် ဖယ်ရှားပေးခြင်း လုပ်ငန်းစဉ်',
        contentEn: 'P-Store respects intellectual property rights and complies with the Digital Millennium Copyright Act (DMCA). If you are a copyright owner or authorized representative and believe any hosted file infringes upon your copyright, submit a takedown request immediately.',
        contentMy: 'P-Store သည် မူရင်းတီထွင်သူများ၏ မူပိုင်ခွင့်ကို အပြည့်အဝ လေးစားလိုက်နာပါသည်။ သင်၏ မူပိုင်ခွင့် ပါဝင်နေသည်ဟု ယူဆပါက တရားဝင် အထောက်အထားဖြင့် အချိန်မရွေး ဖယ်ရှားပေးရန် တောင်းဆိုနိုင်ပါသည်။',
      },
      {
        headingEn: '2. Required Information for DMCA Notice',
        headingMy: '၂။ အကြောင်းကြားလွှာတွင် ပါဝင်ရမည့် အချက်များ',
        contentEn: 'Please email: 1) Identification of the copyrighted work; 2) The exact URL of the material on P-Store; 3) Your contact details (Name, Email, Phone); 4) A statement of good faith belief; 5) Electronic or physical signature.',
        contentMy: 'အီးမေးလ် ပေးပို့ရာတွင် မူပိုင်ခွင့်ရှိသည့် အထောက်အထား၊ ဝဘ်ဆိုက်ပေါ်ရှိ လိပ်စာ URL၊ ဆက်သွယ်ရန် အမည်နှင့် ဖုန်းနံပါတ်တို့ကို ရှင်းလင်းစွာ ဖော်ပြပေးရပါမည်။',
      },
      {
        headingEn: '3. Designated Copyright Agent Contact',
        headingMy: '၃။ မူပိုင်ခွင့်ဆိုင်ရာ ဆက်သွယ်ရန် ကိုယ်စားလှယ်',
        contentEn: 'Send all DMCA notices to jimetansai714@gmail.com with subject line "DMCA Takedown Request" or message directly via Telegram/WhatsApp (+959977500588). Valid requests are processed within 24 hours.',
        contentMy: 'DMCA တိုင်ကြားချက်များကို jimetansai714@gmail.com သို့ အကြောင်းအရာ "DMCA Takedown Request" ဖြင့် ပေးပို့နိုင်ပြီး ၂၄ နာရီအတွင်း ချက်ချင်း စစ်ဆေးဖယ်ရှားပေးပါမည်။',
      },
    ],
  },
  security: {
    id: 'security',
    titleEn: 'APK Security & Safe Signing Verification',
    titleMy: 'APK လုံခြုံရေးနှင့် စစ်ဆေးအတည်ပြုမှု မူဝါဒ',
    lastUpdated: 'October 2026',
    sections: [
      {
        headingEn: '1. ApexShield Multi-Layer Security Architecture',
        headingMy: '၁။ ApexShield အဆင့်ဆင့် စစ်ဆေးမှု စနစ်',
        contentEn: 'Our multi-layer verification checks APK structure, verifies Android developer signatures (v1, v2, v3, v4 schemes), and ensures zero unauthorized code modifications or injection.',
        contentMy: 'ကျွန်ုပ်တို့၏ စနစ်သည် Android Developer လက်မှတ်များ (Signing Certificate) ကို အသေးစိတ် စစ်ဆေးပြီး ဖိုင်တွင်း ပြုပြင်ပြောင်းလဲထားခြင်း မရှိစေရန် စစ်ဆေးပေးပါသည်။',
      },
      {
        headingEn: '2. Cryptographic SHA-256 Checksums',
        headingMy: '၂။ SHA-256 ဟက်ရှ်ကုဒ်ဖြင့် တိုက်ဆိုင်စစ်ဆေးခြင်း',
        contentEn: 'Every package detail modal displays the unique cryptographic SHA-256 hash. Users can independently verify file integrity using apksigner or sha256sum before installation.',
        contentMy: 'အက်ပ်တိုင်းအတွက် သီးသန့် SHA-256 Hash ကုဒ်ကို ပွင့်လင်းမြင်သာစွာ ဖော်ပြပေးထားသဖြင့် အသုံးမပြုမီ ကိုယ်တိုင် တိုက်ဆိုင်စစ်ဆေးနိုင်ပါသည်။',
      },
      {
        headingEn: '3. Report a Vulnerability',
        headingMy: '၃။ လုံခြုံရေး ချို့ယွင်းချက် သတင်းပေးပို့ရန်',
        contentEn: 'If you discover any security concern or unexpected behavior, notify our security response desk at jimetansai714@gmail.com or emergency hotline +959977500588.',
        contentMy: 'လုံခြုံရေးဆိုင်ရာ မသင်္ကာဖွယ်ရာ တွေ့ရှိပါက jimetansai714@gmail.com သို့မဟုတ် +959977500588 သို့ ချက်ချင်း အသိပေး အကြောင်းကြားနိုင်ပါသည်။',
      },
    ],
  },
  developer: {
    id: 'developer',
    titleEn: 'Developer Submission Guidelines',
    titleMy: 'ဆော့ဖ်ဝဲလ် ဖန်တီးသူများ တင်သွင်းမှု လမ်းညွှန်ချက်',
    lastUpdated: 'October 2026',
    sections: [
      {
        headingEn: '1. Who Can Publish',
        headingMy: '၁။ မည်သူမဆို တင်သွင်းနိုင်ခြင်း',
        contentEn: 'Independent Android developers, mobile software agencies, and Myanmar engineering teams are welcome to distribute applications via P-Store free of charge.',
        contentMy: 'မြန်မာနှင့် နိုင်ငံတကာမှ Android ဆော့ဖ်ဝဲလ် ရေးသားသူများ အားလုံး အခမဲ့ လာရောက် တင်သွင်းနိုင်ပါသည်။',
      },
      {
        headingEn: '2. Package Requirements',
        headingMy: '၂။ လိုအပ်သော အရည်အသွေး သတ်မှတ်ချက်များ',
        contentEn: 'APKs must be properly signed with release keystores, contain high-resolution launcher icons, define accurate package identifiers, and refrain from abusive background permissions.',
        contentMy: 'APK များသည် Release Keystore ဖြင့် စနစ်တကျ လက်မှတ်ထိုးထားရမည် ဖြစ်ပြီး ကြည်လင်သော Logo နှင့် ခွင့်ပြုချက် သတ်မှတ်ချက်များ တိကျရပါမည်။',
      },
      {
        headingEn: '3. Direct Developer Onboarding',
        headingMy: '၃။ Developer ဆက်သွယ်ရန်',
        contentEn: 'For bulk app onboarding, developer verification, or partnership inquiries, reach out to our engineering desk at jimetansai714@gmail.com or Telegram/WhatsApp @ +959977500588.',
        contentMy: 'ဆော့ဖ်ဝဲလ် အများအပြား တင်သွင်းလိုပါက သို့မဟုတ် Developer အသိအမှတ်ပြုမှု ရယူလိုပါက jimetansai714@gmail.com သို့မဟုတ် +959977500588 သို့ ဆက်သွယ်နိုင်ပါသည်။',
      },
    ],
  },
  contact: {
    id: 'contact',
    titleEn: 'Official Contact & Support Portal',
    titleMy: 'တရားဝင် ဆက်သွယ်ရန်နှင့် အကူအညီ ရယူရေး စင်တာ',
    lastUpdated: 'October 2026',
    sections: [
      {
        headingEn: 'Direct Support Desk',
        headingMy: 'တိုက်ရိုက် ဆက်သွယ်ရန် လိပ်စာများ',
        contentEn: 'Our technical operations and developer relations team is available 24/7 across multiple communication platforms to assist you.',
        contentMy: 'ကျွန်ုပ်တို့၏ နည်းပညာနှင့် ကူညီထောက်ပံ့ရေး အဖွဲ့ကို အောက်ပါ လိုင်းများမှတစ်ဆင့် အချိန်မရွေး တိုက်ရိုက် ဆက်သွယ်နိုင်ပါသည်-',
      },
    ],
  },
};
