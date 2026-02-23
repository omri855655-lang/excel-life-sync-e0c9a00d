// Audio presets for Deeply - each uses genuinely different synthesis parameters

export interface AudioPreset {
  id: string;
  name: string;
  nameHe: string;
  desc: string;
  category: "focus" | "creative" | "calm" | "study" | "classical";
  // Synthesis parameters
  baseFreq: number;
  binauralOffset: number; // Hz difference between L/R for binaural beat
  waveform: OscillatorType;
  harmonics?: { freq: number; gain: number; wave: OscillatorType }[];
  lfoRate?: number; // slow amplitude modulation rate
  lfoDepth?: number; // 0-1
  gainLevel: number;
}

export const CATEGORIES = [
  { id: "focus", name: "ריכוז עמוק", icon: "🧠", color: "violet" },
  { id: "creative", name: "יצירתיות", icon: "🎨", color: "cyan" },
  { id: "calm", name: "רוגע ומדיטציה", icon: "🧘", color: "emerald" },
  { id: "study", name: "לימודים וקריאה", icon: "📚", color: "amber" },
  { id: "classical", name: "מוזיקה קלאסית", icon: "🎵", color: "rose" },
] as const;

export const AUDIO_PRESETS: AudioPreset[] = [
  // === FOCUS ===
  {
    id: "gamma-focus",
    name: "Gamma Focus",
    nameHe: "גלי גמא — ריכוז חד",
    desc: "40Hz binaural beat לריכוז עמוק ופתרון בעיות",
    category: "focus",
    baseFreq: 200,
    binauralOffset: 40,
    waveform: "sine",
    gainLevel: 0.12,
  },
  {
    id: "beta-high",
    name: "High Beta",
    nameHe: "בטא גבוה — עירנות",
    desc: "30Hz binaural beat לעירנות מקסימלית וביצוע מהיר",
    category: "focus",
    baseFreq: 250,
    binauralOffset: 30,
    waveform: "sine",
    harmonics: [{ freq: 500, gain: 0.03, wave: "sine" }],
    gainLevel: 0.10,
  },
  {
    id: "beta-active",
    name: "Active Mind",
    nameHe: "בטא פעיל — חשיבה לוגית",
    desc: "20Hz binaural beat לחשיבה אנליטית וקבלת החלטות",
    category: "focus",
    baseFreq: 180,
    binauralOffset: 20,
    waveform: "sine",
    gainLevel: 0.12,
  },

  // === CREATIVE ===
  {
    id: "alpha-creative",
    name: "Alpha Flow",
    nameHe: "גלי אלפא — זרימה יצירתית",
    desc: "10Hz binaural beat לפתיחת מחשבה ויצירתיות",
    category: "creative",
    baseFreq: 300,
    binauralOffset: 10,
    waveform: "sine",
    lfoRate: 0.1,
    lfoDepth: 0.3,
    gainLevel: 0.12,
  },
  {
    id: "alpha-low",
    name: "Daydream",
    nameHe: "חלימה בהקיץ — 8Hz",
    desc: "אלפא נמוך לדמיון מודרך ואסוציאציות חופשיות",
    category: "creative",
    baseFreq: 340,
    binauralOffset: 8,
    waveform: "sine",
    lfoRate: 0.07,
    lfoDepth: 0.4,
    gainLevel: 0.11,
  },
  {
    id: "alpha-mid",
    name: "Gentle Waves",
    nameHe: "גלים עדינים — 12Hz",
    desc: "אלפא מאוזן לסיעור מוחות וכתיבה",
    category: "creative",
    baseFreq: 270,
    binauralOffset: 12,
    waveform: "triangle",
    gainLevel: 0.09,
  },

  // === CALM ===
  {
    id: "theta-calm",
    name: "Deep Theta",
    nameHe: "תטא עמוק — רוגע מלא",
    desc: "6Hz binaural beat למדיטציה ורגיעה עמוקה",
    category: "calm",
    baseFreq: 150,
    binauralOffset: 6,
    waveform: "sine",
    lfoRate: 0.05,
    lfoDepth: 0.5,
    gainLevel: 0.10,
  },
  {
    id: "theta-light",
    name: "Light Theta",
    nameHe: "תטא קל — מעבר לשינה",
    desc: "4Hz binaural beat להרפיה ומעבר לשינה",
    category: "calm",
    baseFreq: 120,
    binauralOffset: 4,
    waveform: "sine",
    lfoRate: 0.03,
    lfoDepth: 0.6,
    gainLevel: 0.08,
  },
  {
    id: "delta-rest",
    name: "Delta Rest",
    nameHe: "דלתא — מנוחה מוחלטת",
    desc: "2Hz binaural beat להתאוששות ומנוחת עומק",
    category: "calm",
    baseFreq: 100,
    binauralOffset: 2,
    waveform: "sine",
    lfoRate: 0.02,
    lfoDepth: 0.7,
    gainLevel: 0.07,
  },
  {
    id: "ocean-breath",
    name: "Ocean Breath",
    nameHe: "נשימת אוקיינוס — 3Hz",
    desc: "דלתא-תטא עם מודולציה איטית כמו גלי ים",
    category: "calm",
    baseFreq: 110,
    binauralOffset: 3,
    waveform: "sine",
    lfoRate: 0.04,
    lfoDepth: 0.65,
    harmonics: [
      { freq: 165, gain: 0.03, wave: "sine" },
      { freq: 220, gain: 0.02, wave: "sine" },
    ],
    gainLevel: 0.07,
  },

  // === STUDY ===
  {
    id: "study-focus",
    name: "Study Mode",
    nameHe: "מצב לימודים — 14Hz",
    desc: "בטא נמוך לקריאה ממושכת ושינון",
    category: "study",
    baseFreq: 220,
    binauralOffset: 14,
    waveform: "sine",
    gainLevel: 0.11,
  },
  {
    id: "memory-boost",
    name: "Memory Boost",
    nameHe: "חיזוק זיכרון — 12Hz",
    desc: "אלפא-בטא לשיפור קליטת מידע ושימור",
    category: "study",
    baseFreq: 240,
    binauralOffset: 12,
    waveform: "sine",
    harmonics: [{ freq: 480, gain: 0.02, wave: "sine" }],
    gainLevel: 0.10,
  },
  {
    id: "reading-flow",
    name: "Reading Flow",
    nameHe: "זרימת קריאה — 10Hz",
    desc: "אלפא לקריאה רציפה והבנת טקסטים",
    category: "study",
    baseFreq: 260,
    binauralOffset: 10,
    waveform: "sine",
    lfoRate: 0.08,
    lfoDepth: 0.2,
    gainLevel: 0.10,
  },
  {
    id: "exam-prep",
    name: "Exam Prep",
    nameHe: "הכנה למבחן — 18Hz",
    desc: "בטא ממוקד לחזרה אינטנסיבית לפני מבחנים",
    category: "study",
    baseFreq: 210,
    binauralOffset: 18,
    waveform: "sine",
    gainLevel: 0.11,
  },

  // === CLASSICAL-INSPIRED (synthesized harmonic patterns) ===
  {
    id: "mozart-effect",
    name: "Mozart Effect",
    nameHe: "אפקט מוצארט — K.448",
    desc: "דפוס הרמוני מבוסס על סונטה לשני פסנתרים של מוצארט — משפר חשיבה מרחבית",
    category: "classical",
    baseFreq: 261.63, // C4
    binauralOffset: 10,
    waveform: "sine",
    harmonics: [
      { freq: 329.63, gain: 0.06, wave: "sine" }, // E4
      { freq: 392.00, gain: 0.05, wave: "sine" }, // G4
      { freq: 523.25, gain: 0.03, wave: "sine" }, // C5
    ],
    lfoRate: 0.15,
    lfoDepth: 0.25,
    gainLevel: 0.07,
  },
  {
    id: "beethoven-moonlight",
    name: "Moonlight Sonata",
    nameHe: "סונטת אור ירח — בטהובן",
    desc: "אקורדים מרגיעים מהתנועה הראשונה, C# minor — מושלם להרגעה ומיקוד",
    category: "classical",
    baseFreq: 138.59, // C#3
    binauralOffset: 6,
    waveform: "sine",
    harmonics: [
      { freq: 164.81, gain: 0.07, wave: "sine" }, // E3
      { freq: 207.65, gain: 0.06, wave: "sine" }, // G#3
      { freq: 277.18, gain: 0.04, wave: "sine" }, // C#4
      { freq: 329.63, gain: 0.03, wave: "sine" }, // E4
    ],
    lfoRate: 0.08,
    lfoDepth: 0.35,
    gainLevel: 0.07,
  },
  {
    id: "beethoven-pathetique",
    name: "Pathétique Adagio",
    nameHe: "פתטיק אדג׳יו — בטהובן",
    desc: "התנועה האיטית של הסונטה הפתטית — נוגעת ומרגיעה עמוקות",
    category: "classical",
    baseFreq: 174.61, // F3
    binauralOffset: 5,
    waveform: "sine",
    harmonics: [
      { freq: 220.00, gain: 0.06, wave: "sine" }, // A3
      { freq: 261.63, gain: 0.05, wave: "sine" }, // C4
      { freq: 349.23, gain: 0.03, wave: "sine" }, // F4
      { freq: 440.00, gain: 0.02, wave: "sine" }, // A4
    ],
    lfoRate: 0.06,
    lfoDepth: 0.4,
    gainLevel: 0.06,
  },
  {
    id: "beethoven-fur-elise",
    name: "Für Elise",
    nameHe: "לאליזה — בטהובן",
    desc: "המוטיב המפורסם בגרסה הרמונית עדינה — נוסטלגי ומרגיע",
    category: "classical",
    baseFreq: 329.63, // E4
    binauralOffset: 7,
    waveform: "sine",
    harmonics: [
      { freq: 311.13, gain: 0.06, wave: "sine" }, // D#4/Eb4
      { freq: 293.66, gain: 0.04, wave: "sine" }, // D4
      { freq: 246.94, gain: 0.05, wave: "sine" }, // B3
      { freq: 261.63, gain: 0.04, wave: "sine" }, // C4
    ],
    lfoRate: 0.12,
    lfoDepth: 0.3,
    gainLevel: 0.06,
  },
  {
    id: "bach-prelude",
    name: "Bach Prelude",
    nameHe: "פרלוד באך — C Major",
    desc: "הרמוניות מבוססות על פרלוד של באך — מסדר את המחשבות",
    category: "classical",
    baseFreq: 261.63, // C4
    binauralOffset: 8,
    waveform: "triangle",
    harmonics: [
      { freq: 329.63, gain: 0.06, wave: "triangle" }, // E4
      { freq: 392.00, gain: 0.05, wave: "triangle" }, // G4
      { freq: 493.88, gain: 0.04, wave: "sine" }, // B4
    ],
    lfoRate: 0.12,
    lfoDepth: 0.2,
    gainLevel: 0.06,
  },
  {
    id: "bach-air",
    name: "Air on G String",
    nameHe: "אריה על מיתר סול — באך",
    desc: "מנגינת באך הנצחית — שלווה, עומק ויופי טהור",
    category: "classical",
    baseFreq: 196.00, // G3
    binauralOffset: 6,
    waveform: "sine",
    harmonics: [
      { freq: 246.94, gain: 0.06, wave: "sine" }, // B3
      { freq: 293.66, gain: 0.05, wave: "sine" }, // D4
      { freq: 392.00, gain: 0.03, wave: "sine" }, // G4
      { freq: 493.88, gain: 0.02, wave: "triangle" }, // B4
    ],
    lfoRate: 0.05,
    lfoDepth: 0.35,
    gainLevel: 0.06,
  },
  {
    id: "chopin-nocturne",
    name: "Nocturne Op.9 No.2",
    nameHe: "נוקטורן — שופן",
    desc: "הנוקטורן המפורסם ביותר של שופן — שקט לילי ורומנטי",
    category: "classical",
    baseFreq: 233.08, // Bb3
    binauralOffset: 5,
    waveform: "sine",
    harmonics: [
      { freq: 293.66, gain: 0.06, wave: "sine" }, // D4
      { freq: 349.23, gain: 0.05, wave: "sine" }, // F4
      { freq: 466.16, gain: 0.03, wave: "sine" }, // Bb4
      { freq: 587.33, gain: 0.02, wave: "sine" }, // D5
    ],
    lfoRate: 0.07,
    lfoDepth: 0.4,
    gainLevel: 0.06,
  },
  {
    id: "chopin-raindrop",
    name: "Raindrop Prelude",
    nameHe: "פרלוד טיפות גשם — שופן",
    desc: "הפרלוד של טיפות הגשם — טפטוף מהפנט ומרגיע",
    category: "classical",
    baseFreq: 277.18, // Db4/C#4
    binauralOffset: 4,
    waveform: "sine",
    harmonics: [
      { freq: 349.23, gain: 0.05, wave: "sine" }, // F4
      { freq: 415.30, gain: 0.04, wave: "sine" }, // Ab4
      { freq: 554.37, gain: 0.03, wave: "sine" }, // Db5
    ],
    lfoRate: 0.2, // faster pulse like raindrops
    lfoDepth: 0.3,
    gainLevel: 0.06,
  },
  {
    id: "debussy-reverie",
    name: "Debussy Rêverie",
    nameHe: "חלימה — דביוסי",
    desc: "אקורדים אימפרסיוניסטיים שיוצרים תחושת חלום צבעוני",
    category: "classical",
    baseFreq: 293.66, // D4
    binauralOffset: 5,
    waveform: "sine",
    harmonics: [
      { freq: 369.99, gain: 0.06, wave: "sine" }, // F#4
      { freq: 440.00, gain: 0.05, wave: "sine" }, // A4
      { freq: 554.37, gain: 0.03, wave: "sine" }, // C#5
    ],
    lfoRate: 0.06,
    lfoDepth: 0.45,
    gainLevel: 0.06,
  },
  {
    id: "debussy-clair",
    name: "Clair de Lune",
    nameHe: "אור ירח — דביוסי",
    desc: "יצירת המופת של דביוסי — חלומי, שקט ורגיש",
    category: "classical",
    baseFreq: 277.18, // Db4
    binauralOffset: 4,
    waveform: "sine",
    harmonics: [
      { freq: 349.23, gain: 0.06, wave: "sine" }, // F4
      { freq: 415.30, gain: 0.05, wave: "sine" }, // Ab4
      { freq: 523.25, gain: 0.04, wave: "sine" }, // C5 (almost)
      { freq: 622.25, gain: 0.02, wave: "sine" }, // Eb5
    ],
    lfoRate: 0.04,
    lfoDepth: 0.5,
    gainLevel: 0.05,
  },
  {
    id: "vivaldi-spring",
    name: "Spring — Vivaldi",
    nameHe: "אביב — ויוואלדי",
    desc: "ארבע העונות: אביב — אנרגיה חיובית ושמחת חיים",
    category: "classical",
    baseFreq: 329.63, // E4
    binauralOffset: 10,
    waveform: "triangle",
    harmonics: [
      { freq: 415.30, gain: 0.06, wave: "triangle" }, // G#4
      { freq: 493.88, gain: 0.05, wave: "triangle" }, // B4
      { freq: 659.25, gain: 0.04, wave: "sine" }, // E5
    ],
    lfoRate: 0.18,
    lfoDepth: 0.2,
    gainLevel: 0.07,
  },
  {
    id: "satie-gymnopedie",
    name: "Gymnopédie No.1",
    nameHe: "ג׳ימנופדיה — סאטי",
    desc: "מנגינה מינימליסטית ושקטה — מושלמת ללימודים וקריאה",
    category: "classical",
    baseFreq: 293.66, // D4
    binauralOffset: 6,
    waveform: "sine",
    harmonics: [
      { freq: 369.99, gain: 0.05, wave: "sine" }, // F#4
      { freq: 440.00, gain: 0.04, wave: "sine" }, // A4
      { freq: 523.25, gain: 0.03, wave: "sine" }, // C5
    ],
    lfoRate: 0.04,
    lfoDepth: 0.35,
    gainLevel: 0.06,
  },
  {
    id: "tchaikovsky-swan",
    name: "Swan Lake",
    nameHe: "אגם הברבורים — צ׳ייקובסקי",
    desc: "מוטיב מרכזי מאגם הברבורים — דרמטי, עמוק ומרגש",
    category: "classical",
    baseFreq: 185.00, // F#3/Gb3
    binauralOffset: 5,
    waveform: "sine",
    harmonics: [
      { freq: 220.00, gain: 0.06, wave: "sine" }, // A3
      { freq: 277.18, gain: 0.05, wave: "sine" }, // C#4
      { freq: 369.99, gain: 0.04, wave: "sine" }, // F#4
      { freq: 440.00, gain: 0.02, wave: "sine" }, // A4
    ],
    lfoRate: 0.06,
    lfoDepth: 0.45,
    gainLevel: 0.06,
  },
];

export const GUIDES = [
  {
    id: "binaural",
    title: "מה זה Binaural Beats?",
    icon: "🎧",
    content: "כשכל אוזן שומעת תדר קצת שונה, המוח יוצר ״גל פנטום״ בהפרש. למשל: 200Hz באוזן שמאל ו-210Hz בימין = גל אלפא של 10Hz. זה גורם למוח להיכנס למצב ריכוז/רגיעה בהתאם לתדר. חובה להשתמש באוזניות!",
  },
  {
    id: "waves",
    title: "סוגי גלי מוח",
    icon: "🧠",
    content: "דלתא (0.5-4Hz): שינה עמוקה | תטא (4-8Hz): מדיטציה, רגיעה | אלפא (8-13Hz): יצירתיות, זרימה | בטא (13-30Hz): ריכוז, חשיבה | גמא (30-50Hz): ריכוז על, פתרון בעיות",
  },
  {
    id: "mozart",
    title: "אפקט מוצארט",
    icon: "🎹",
    content: "מחקר מ-1993 מצא שהאזנה לסונטה K.448 של מוצארט משפרת חשיבה מרחבית-זמנית. מחקרים נוספים הראו שמוזיקה קלאסית עם מבנה הרמוני מורכב יכולה לשפר ריכוז, זיכרון ולמידה.",
  },
  {
    id: "beethoven",
    title: "בטהובן והרגעה",
    icon: "🎼",
    content: "מחקרים הראו שמוזיקה איטית של בטהובן (60-70 BPM) כמו סונטת אור הירח מורידה קצב לב ולחץ דם. התנועות האיטיות שלו יוצרות תחושת ביטחון ושלווה. בטהובן הלחין חלק מיצירותיו הגדולות כשהיה חירש — מוזיקה שנולדה מתוך שקט פנימי.",
  },
  {
    id: "classical-study",
    title: "מוזיקה קלאסית ולימודים",
    icon: "📖",
    content: "מחקרים מצאו שמוזיקה קלאסית ללא מילים (בטהובן, באך, שופן, סאטי) משפרת ריכוז בזמן לימודים ב-12% בממוצע. המפתח: טמפו איטי (60-80 BPM), בלי מילים, עוצמה נמוכה. ג׳ימנופדיה של סאטי ונוקטורנים של שופן מצוינים ללימוד.",
  },
  {
    id: "pomodoro",
    title: "שיטת פומודורו",
    icon: "🍅",
    content: "עבוד 25 דקות → הפסקה 5 דקות → חזור. אחרי 4 סשנים קח הפסקה ארוכה (15-30 דק׳). השיטה מונעת שחיקה ושומרת על ריכוז גבוה לאורך היום.",
  },
  {
    id: "deep-work",
    title: "עבודה עמוקה vs רדודה",
    icon: "⚡",
    content: "עבודה עמוקה = פעילות שדורשת ריכוז מלא (כתיבה, תכנות, לימוד). עבודה רדודה = מיילים, הודעות, פגישות. הפרד ביניהן! עשה את העמוקה כשהאנרגיה הכי גבוהה.",
  },
  {
    id: "headphones",
    title: "למה חייבים אוזניות?",
    icon: "🎧",
    content: "Binaural beats עובדים רק עם אוזניות! כל אוזן צריכה לשמוע תדר שונה. עם רמקולים הצלילים מתערבבים ואין אפקט. השתמש באוזניות סגורות לתוצאה הכי טובה.",
  },
  {
    id: "motivation-science",
    title: "המדע מאחורי מוטיבציה",
    icon: "🔥",
    content: "דופמין הוא לא הורמון של הנאה — הוא הורמון של ציפייה. כשאתה מגדיר יעד ברור ומתחיל לפעול, המוח משחרר דופמין. טריק: חלק משימות גדולות לקטנות, וחגוג כל השלמה. המוח יגמול לך עם עוד דופמין.",
  },
  {
    id: "flow-state",
    title: "איך נכנסים למצב Flow?",
    icon: "🌊",
    content: "מצב Flow קורה כשהמשימה מאתגרת בדיוק נכון — לא קלה מדי (שעמום) ולא קשה מדי (חרדה). 4 תנאים: 1) יעד ברור 2) פידבק מיידי 3) אתגר מותאם 4) ריכוז ללא הפרעות. Deeply עוזר לך ליצור את התנאי הרביעי.",
  },
  {
    id: "deep-work-rules",
    title: "4 חוקי העבודה העמוקה",
    icon: "📏",
    content: "קל ניופורט — 4 חוקים: 1) תקבע זמנים לעבודה עמוקה (אל תחכה ל'מצב רוח') 2) תתרגל שעמום — אל תפנה לטלפון בכל רגע פנוי, אמן את המוח לריכוז 3) תהיה סלקטיבי עם רשתות חברתיות — 80/20, רוב הערך מגיע ממעט פעולות 4) תנקז את העבודה הרדודה — צמצם מיילים, פגישות ומשימות שטחיות. העבודה העמוקה היא מיומנות — ככל שתתרגל יותר, תשתפר.",
  },
  {
    id: "second-brain",
    title: "מוח חיצוני (Second Brain)",
    icon: "🗄️",
    content: "שיטת PARA של טיאגו פורטה: 1) Projects — פרויקטים פעילים 2) Areas — תחומי אחריות מתמשכים 3) Resources — מידע שימושי לעתיד 4) Archives — ארכיון. הרעיון: המוח נועד ליצירת רעיונות, לא לאחסון. תעביר הכל למערכת חיצונית (אפליקציה, מחברת) ותשחרר את המוח לחשיבה עמוקה. CODE: Capture → Organize → Distill → Express.",
  },
  {
    id: "single-tasking",
    title: "נעילת מוח על משימה",
    icon: "🔒",
    content: "Single-tasking — התרכז במשימה אחת בלבד. הטכניקה: 1) בחר משימה אחת 2) סגור הכל — טאבים, הודעות, מיילים 3) הגדר טיימר (25-50 דק׳) 4) אם עולה מחשבה אחרת — רשום ב'רשימת הסחות' וחזור 5) סיים עם 'טקס סגירה' — רשום היכן עצרת ומה השלב הבא. מחקרים מראים שמעבר בין משימות גורם לאובדן של 23 דקות ריכוז בכל מעבר!",
  },
  {
    id: "time-blocking",
    title: "תבניות גושי זמן (Time Blocking)",
    icon: "📦",
    content: "שיטת Time Blocking: חלק את היום לגושי זמן מוקדשים למשימות ספציפיות. כללים: 1) בוקר = עבודה עמוקה (המוח הכי חד) 2) אחה\"צ = פגישות ועבודה רדודה 3) גוש של 90 דק׳ = אופטימלי (מחזור אולטרדיאני) 4) הפסקה 15-20 דק׳ בין גושים 5) תכנן את הגושים ביום הקודם. קל ניופורט: 'כל דקה ביום צריכה להיות מתוכננת — לא בנוקשות, אלא בכוונה.'",
  },
  {
    id: "three-task-rule",
    title: "כלל 3 המשימות",
    icon: "3️⃣",
    content: "בכל יום, בחר רק 3 משימות חשובות. זה הכל. למה זה עובד: 1) מונע שיתוק בחירה (17 פריטים ברשימה = אף אחד לא ייעשה) 2) יוצר תחושת הישג בסוף היום 3) מכריח תעדוף אמיתי. הכלל: כתוב 3 משימות על פתק. עד הערב — סמן את כולן. אם סיימת, בונוס!",
  },
];

export const MOTIVATION_TIPS = [
  {
    id: "atomic-habits",
    title: "הרגלים אטומיים",
    icon: "⚛️",
    content: "ג'יימס קליר: 'אל תתמקד במטרה, תתמקד במערכת.' שינוי של 1% ביום = שיפור של 37 פעמים בשנה. 4 חוקי ההרגל: 1) הפוך אותו לברור 2) הפוך אותו למושך 3) הפוך אותו לקל 4) הפוך אותו למספק. שרשור הרגלים: 'אחרי ש[הרגל קיים], אני [הרגל חדש].'",
  },
  {
    id: "deep-work",
    title: "עבודה עמוקה",
    icon: "🧠",
    content: "קל ניופורט (Deep Work): '4 שעות עבודה עמוקה ממוקדת שוות יותר מ-8 שעות רדודות.' כללי ברזל: זמן קבוע, מקום קבוע, אפס הסחות. Digital Minimalism: צמצם רעש דיגיטלי, בנה קשר בריא לטלפון. Hyperfocus (ביילי): 'שליטה בקשב = שליטה בחיים.'",
  },
  {
    id: "eat-frog",
    title: "אכול את הצפרדע",
    icon: "🐸",
    content: "בריאן טרייסי: 'אם הדבר הראשון שאתה עושה בבוקר זה לאכול צפרדע חיה, השאר של היום יהיה קל.' התחל מהמשימה הכי קשה/מאיימה. The One Thing (קלר): 'מה הדבר האחד שאם אעשה אותו, הכל השאר יהיה קל יותר או מיותר?' Essentialism (מקיון): 'תגיד לא לכל מה שלא חיוני.'",
  },
  {
    id: "tiny-habits",
    title: "צעדים זעירים",
    icon: "👣",
    content: "BJ Fogg (Tiny Habits): 'אחרי ש[הרגל קיים], אני [צעד זעיר]. תחגוג מיד.' The Compound Effect (הארדי): 'עקביות קטנה כל יום = תוצאות ענקיות.' The Motivation Myth (היידן): 'מוטיבציה לא גורמת לפעולה — פעולה גורמת למוטיבציה. תתחיל, ואז יבוא החשק.'",
  },
  {
    id: "war-of-art",
    title: "לנצח את ההתנגדות",
    icon: "⚔️",
    content: "סטיבן פרספילד (The War of Art): 'ההתנגדות היא הכוח שמונע ממך ליצור. היא הכי חזקה ברגע שאתה הכי קרוב לפריצת דרך.' The Now Habit (פיורה): 'דחיינות = הגנה מפני חרדה. תכנן זמן להנאה — ופתאום יש כוח לעבוד.' Indistractable (אייל): 'הסחת דעת היא בריחה מכאב פנימי.'",
  },
  {
    id: "flow-state",
    title: "מצב זרימה (Flow)",
    icon: "🌊",
    content: "צ'יקסנטמיהאי: 'Flow = אתגר מותאם + יעד ברור + פידבק מיידי. זה מצב האושר האמיתי.' Make Time (קנאפ): 'בחר היי-לייט יומי אחד. הגן עליו מהסחות. זה מספיק.' Peak (אריקסון): 'אימון מכוון (Deliberate Practice) — תרגול ממוקד בנקודות החולשה.'",
  },
  {
    id: "stoic-wisdom",
    title: "חוכמה סטואית",
    icon: "🏛️",
    content: "מרקוס אורליוס: 'שלוט במה שבידיך, קבל את מה שלא.' The Obstacle Is the Way (הולידיי): 'המכשול הוא הדרך. כל קושי מלמד משהו שאי אפשר ללמוד אחרת.' סנקה: 'אנחנו סובלים יותר בדמיון מאשר במציאות.' The Daily Stoic: 'בכל יום: מה בשליטתי? איפה כדאי לשחרר?'",
  },
  {
    id: "meaning-purpose",
    title: "משמעות ומטרה",
    icon: "🎯",
    content: "ויקטור פרנקל (Man's Search for Meaning): 'מי שיש לו למה לחיות, יכול לשאת כמעט כל איך.' Start with Why (סינק): 'אנשים לא קונים מה שאתה עושה, אלא למה.' Drive (פינק): 'מוטיבציה פנימית = אוטונומיה + שליטה + משמעות.'",
  },
  {
    id: "self-compassion",
    title: "קבלה עצמית וחמלה",
    icon: "💚",
    content: "ברנה בראון (Daring Greatly): 'פגיעות = אומץ. להראות שאתה לא מושלם זה הדבר החזק ביותר.' Radical Acceptance (טארה ברך): 'אני בסדר עכשיו, גם אם לא מושלם.' The Gifts of Imperfection: 'שחרר פרפקציוניזם — הוא שריון שמונע חיבור.' The Subtle Art (מנסון): 'תבחר על מה אכפת לך. הכאב הוא חלק מהדרך.'",
  },
  {
    id: "mindset-grit",
    title: "מיינדסט והתמדה",
    icon: "💎",
    content: "קרול דווק (Mindset): 'מיינדסט מתפתח: אני עדיין לא יודע — במקום אני לא מסוגל. טעויות = הזדמנויות.' Grit (דאקוורת'): 'התמדה + תשוקה לאורך זמן > כישרון.' The Confidence Gap (האריס): 'ביטחון לא בא לפני פעולה — הוא מגיע אחריה. תפעל למרות הפחד.'",
  },
  {
    id: "willpower-energy",
    title: "כוח רצון ואנרגיה",
    icon: "⚡",
    content: "The Willpower Instinct (מקגוניגל): 'כוח רצון הוא שריר — הוא מתעייף אבל אפשר לאמן אותו. שינה, תזונה ומדיטציה מחזקים אותו.' The 5 AM Club (שארמה): 'שגרת בוקר מוקדמת = יציבות ומשמעת.' Miracle Morning (אלרוד): '6 פעולות בוקר: שקט, אישורים, ויזואליזציה, ספורט, קריאה, כתיבה.'",
  },
  {
    id: "antifragile",
    title: "להתחזק מלחץ",
    icon: "🔥",
    content: "נסים טאלב (Antifragile): 'תבנה את עצמך כך שלחץ מחזק אותך במקום לשבור.' The Upside of Stress (מקגוניגל): 'סטרס לא הורס אותך — האמונה שסטרס הורס אותך היא מה שמזיק.' The Happiness Advantage (אקור): 'אושר מוביל להצלחה, לא להיפך. 3 דברים טובים ביום = שינוי מוחי.'",
  },
  {
    id: "ownership",
    title: "אחריות מלאה",
    icon: "🎖️",
    content: "Extreme Ownership (ג'וקו): 'קח אחריות מלאה. אין תירוצים. המצב שלך = ההחלטות שלך.' The Courage to Be Disliked (קישימי): 'חופש אמיתי = לקבל שלא כולם יאהבו אותך. זו הבחירה שלך.' Principles (דליו): 'כאב + השתקפות = התקדמות.'",
  },
  {
    id: "communication",
    title: "תקשורת ויחסים",
    icon: "🗣️",
    content: "NVC (רוזנברג): 'תצפית → רגש → צורך → בקשה.' Crucial Conversations: 'עובדות → רגשות → צרכים. שיחות קשות בלי להתפוצץ.' How to Win Friends (קארנגי): 'תתעניין באנשים. תקשיב. תזכור שמות.' Never Split the Difference (ווס): 'הקשב קודם. אמפתיה פותחת דלתות.'",
  },
  {
    id: "wealth-mindset",
    title: "חשיבה פיננסית",
    icon: "💰",
    content: "The Psychology of Money (האוסל): 'עושר = סבלנות. לא מה שאתה מרוויח, אלא מה שאתה חוסך.' Rich Dad Poor Dad (קיוסאקי): 'עשירים קונים נכסים, עניים קונים התחייבויות.' Naval Ravikant: 'עושר = מינוף + מיומנות + זמן. חפש הכנסה שלא תלויה בשעות.'",
  },
  {
    id: "two-minute",
    title: "כלל שתי הדקות",
    icon: "⏱️",
    content: "GTD (דייוויד אלן): 'אם משימה לוקחת פחות משתי דקות — עשה אותה עכשיו. זה מנקה את הראש ויוצר מומנטום.' The Procrastination Equation (סטיל): 'מוטיבציה = (ציפייה × ערך) / (דחפים × עיכוב). הגדל ציפייה וערך, הקטן הסחות.'",
  },
];
