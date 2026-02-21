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
];

export const MOTIVATION_TIPS = [
  {
    id: "why",
    title: "מצא את ה-WHY שלך",
    icon: "🎯",
    content: "לפני שמתחילים — שאל את עצמך: למה אני עושה את זה? מה יקרה אם אצליח? מה יקרה אם לא? כשה-WHY חזק מספיק, ה-HOW מופיע.",
  },
  {
    id: "small-wins",
    title: "ניצחונות קטנים",
    icon: "🏆",
    content: "המוח לא מבדיל בין ניצחון גדול לקטן — כל סימון V משחרר דופמין. חלק כל משימה ל-3-5 צעדים קטנים ותרגיש התקדמות מיידית.",
  },
  {
    id: "energy",
    title: "נהל אנרגיה, לא זמן",
    icon: "⚡",
    content: "לא כל השעות שוות. זהה מתי האנרגיה שלך הכי גבוהה (בד״כ בוקר) ותכנן את העבודה העמוקה לשם. שמור את הרדודה לשעות הנמוכות.",
  },
  {
    id: "environment",
    title: "עצב את הסביבה",
    icon: "🏠",
    content: "תעצב את הסביבה כך שהבחירה הנכונה תהיה הקלה ביותר. הרחק הסחות, הכן את שולחן העבודה, שים אוזניות מוכנות. 80% מההצלחה זה סביבה.",
  },
  {
    id: "accountability",
    title: "אחריות חיצונית",
    icon: "🤝",
    content: "ספר למישהו מה אתה מתכנן לעשות היום. מחקרים מראים ש-65% סיכוי להשלים משימה כשמספרים למישהו, ו-95% כשיש פגישת מעקב.",
  },
  {
    id: "two-minute",
    title: "כלל שתי הדקות",
    icon: "⏱️",
    content: "אם משימה לוקחת פחות משתי דקות — עשה אותה עכשיו. זה מנקה את הראש ויוצר מומנטום. ההתחלה היא תמיד החלק הקשה ביותר.",
  },
];
