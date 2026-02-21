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
    desc: "דפוס הרמוני מבוסס על סונטה לשני פסנתרים של מוצארט",
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
    desc: "דפוס הרמוני מבוסס על הסונטה לאור ירח, מרגיע ומרכז",
    category: "classical",
    baseFreq: 138.59, // C#3
    binauralOffset: 6,
    waveform: "sine",
    harmonics: [
      { freq: 164.81, gain: 0.07, wave: "sine" }, // E3
      { freq: 207.65, gain: 0.06, wave: "sine" }, // G#3
      { freq: 277.18, gain: 0.04, wave: "sine" }, // C#4
    ],
    lfoRate: 0.08,
    lfoDepth: 0.35,
    gainLevel: 0.07,
  },
  {
    id: "bach-prelude",
    name: "Bach Prelude",
    nameHe: "פרלוד באך — C Major",
    desc: "הרמוניות מבוססות על פרלוד של באך, מסדר את המחשבות",
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
    id: "debussy-reverie",
    name: "Debussy Rêverie",
    nameHe: "חלימה — דביוסי",
    desc: "אקורדים אימפרסיוניסטיים שיוצרים תחושת חלום",
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
];
