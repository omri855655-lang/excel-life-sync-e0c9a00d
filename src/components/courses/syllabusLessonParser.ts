export interface ParsedSyllabusLesson {
  title: string;
  duration_minutes: number;
}

const LESSON_PREFIX_REGEX = /^(?:שיעור|פרק|מפגש|נושא|lesson|module|unit)\s*[#\dא-תivxlcdm\.\-\)]*\s*[:\-–]?\s*(.+)$/i;
const NUMBERED_REGEX = /^(?:\d{1,2}|[א-ת]|[ivxlcdm]+)[\.\)\-:]\s+(.+)$/i;
const BULLET_REGEX = /^[-•*]\s+(.+)$/;
const GENERIC_HEADING_REGEX = /^(?:סילבוס|תיאור הקורס|מטרות הקורס|דרישות קדם|דרישות|הערכה|ביבליוגרפיה|מטלות|לוח זמנים)\s*:?$/i;

const extractDurationFromTitle = (raw: string): number => {
  const match = raw.match(/(\d{1,3})\s*(?:דק(?:ות)?|ד׳|min|mins|minutes)/i);
  if (!match) return 30;

  const duration = Number(match[1]);
  if (Number.isNaN(duration)) return 30;

  return Math.min(300, Math.max(5, duration));
};

const cleanLessonTitle = (raw: string): string =>
  raw
    .replace(/\(\s*\d{1,3}\s*(?:דק(?:ות)?|ד׳|min|mins|minutes)\s*\)/gi, "")
    .replace(/\s*[-–:]\s*\d{1,3}\s*(?:דק(?:ות)?|ד׳|min|mins|minutes)\s*$/gi, "")
    .replace(/\s+/g, " ")
    .trim();

const extractFallbackLessonTitles = (syllabus: string): string[] => {
  const chunks = syllabus
    .replace(/\r/g, "")
    .split(/\n|[.;]|(?:\s-\s)/g)
    .map((chunk) => cleanLessonTitle(chunk))
    .filter((chunk) => chunk.length >= 4 && chunk.length <= 120)
    .filter((chunk) => !GENERIC_HEADING_REGEX.test(chunk));

  return Array.from(new Set(chunks)).slice(0, 60);
};

export const extractLessonsFromSyllabus = (syllabus: string): ParsedSyllabusLesson[] => {
  const lines = syllabus
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const lessons: ParsedSyllabusLesson[] = [];

  for (const line of lines) {
    const matched = line.match(LESSON_PREFIX_REGEX) || line.match(NUMBERED_REGEX) || line.match(BULLET_REGEX);
    if (!matched?.[1]) continue;

    const title = cleanLessonTitle(matched[1]);
    if (title.length < 2) continue;

    lessons.push({
      title,
      duration_minutes: extractDurationFromTitle(line),
    });
  }

  if (lessons.length >= 2) {
    return lessons.slice(0, 60);
  }

  const fallbackLessons = extractFallbackLessonTitles(syllabus).map((title) => ({
    title,
    duration_minutes: 30,
  }));

  if (fallbackLessons.length >= 2) {
    return fallbackLessons;
  }

  return lessons.slice(0, 60);
};
