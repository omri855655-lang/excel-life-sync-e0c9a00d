// Major holidays for Israel calendar (Jewish, Muslim, Christian) - 2025-2026
// These are approximate dates that cover the current period

export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
  type: "jewish" | "muslim" | "christian" | "national";
  color: string;
}

// Jewish holidays (Hebrew calendar dates converted to Gregorian for 2025-2026)
const JEWISH_HOLIDAYS_2025: Holiday[] = [
  { date: "2025-03-14", name: "פורים", type: "jewish", color: "#8b5cf6" },
  { date: "2025-04-13", name: "ערב פסח", type: "jewish", color: "#8b5cf6" },
  { date: "2025-04-14", name: "פסח", type: "jewish", color: "#8b5cf6" },
  { date: "2025-04-20", name: "שביעי של פסח", type: "jewish", color: "#8b5cf6" },
  { date: "2025-04-24", name: "יום הזיכרון", type: "national", color: "#64748b" },
  { date: "2025-04-25", name: "יום העצמאות", type: "national", color: "#3b82f6" },
  { date: "2025-05-14", name: "ל\"ג בעומר", type: "jewish", color: "#8b5cf6" },
  { date: "2025-06-02", name: "שבועות", type: "jewish", color: "#8b5cf6" },
  { date: "2025-09-23", name: "ראש השנה", type: "jewish", color: "#8b5cf6" },
  { date: "2025-09-24", name: "ראש השנה ב'", type: "jewish", color: "#8b5cf6" },
  { date: "2025-10-02", name: "יום כיפור", type: "jewish", color: "#8b5cf6" },
  { date: "2025-10-07", name: "סוכות", type: "jewish", color: "#8b5cf6" },
  { date: "2025-10-14", name: "שמחת תורה", type: "jewish", color: "#8b5cf6" },
  { date: "2025-12-15", name: "חנוכה (יום ראשון)", type: "jewish", color: "#8b5cf6" },
];

const JEWISH_HOLIDAYS_2026: Holiday[] = [
  { date: "2026-03-04", name: "פורים", type: "jewish", color: "#8b5cf6" },
  { date: "2026-04-02", name: "ערב פסח", type: "jewish", color: "#8b5cf6" },
  { date: "2026-04-03", name: "פסח", type: "jewish", color: "#8b5cf6" },
  { date: "2026-04-09", name: "שביעי של פסח", type: "jewish", color: "#8b5cf6" },
  { date: "2026-04-13", name: "יום הזיכרון", type: "national", color: "#64748b" },
  { date: "2026-04-14", name: "יום העצמאות", type: "national", color: "#3b82f6" },
  { date: "2026-05-03", name: "ל\"ג בעומר", type: "jewish", color: "#8b5cf6" },
  { date: "2026-05-22", name: "שבועות", type: "jewish", color: "#8b5cf6" },
  { date: "2026-09-12", name: "ראש השנה", type: "jewish", color: "#8b5cf6" },
  { date: "2026-09-13", name: "ראש השנה ב'", type: "jewish", color: "#8b5cf6" },
  { date: "2026-09-21", name: "יום כיפור", type: "jewish", color: "#8b5cf6" },
  { date: "2026-09-26", name: "סוכות", type: "jewish", color: "#8b5cf6" },
  { date: "2026-10-03", name: "שמחת תורה", type: "jewish", color: "#8b5cf6" },
  { date: "2026-12-05", name: "חנוכה (יום ראשון)", type: "jewish", color: "#8b5cf6" },
];

// Muslim holidays (approximate - based on lunar calendar)
const MUSLIM_HOLIDAYS_2025: Holiday[] = [
  { date: "2025-03-01", name: "רמדאן (תחילה)", type: "muslim", color: "#059669" },
  { date: "2025-03-30", name: "עיד אל-פיטר", type: "muslim", color: "#059669" },
  { date: "2025-06-07", name: "עיד אל-אדחא", type: "muslim", color: "#059669" },
  { date: "2025-06-27", name: "ראש השנה ההג'רי", type: "muslim", color: "#059669" },
  { date: "2025-09-05", name: "מולד הנביא", type: "muslim", color: "#059669" },
];

const MUSLIM_HOLIDAYS_2026: Holiday[] = [
  { date: "2026-02-18", name: "רמדאן (תחילה)", type: "muslim", color: "#059669" },
  { date: "2026-03-20", name: "עיד אל-פיטר", type: "muslim", color: "#059669" },
  { date: "2026-05-27", name: "עיד אל-אדחא", type: "muslim", color: "#059669" },
  { date: "2026-06-17", name: "ראש השנה ההג'רי", type: "muslim", color: "#059669" },
  { date: "2026-08-26", name: "מולד הנביא", type: "muslim", color: "#059669" },
];

// Christian holidays
const CHRISTIAN_HOLIDAYS_2025: Holiday[] = [
  { date: "2025-01-06", name: "חג ההתגלות", type: "christian", color: "#dc2626" },
  { date: "2025-04-18", name: "יום שישי הטוב", type: "christian", color: "#dc2626" },
  { date: "2025-04-20", name: "חג הפסחא", type: "christian", color: "#dc2626" },
  { date: "2025-12-25", name: "חג המולד", type: "christian", color: "#dc2626" },
];

const CHRISTIAN_HOLIDAYS_2026: Holiday[] = [
  { date: "2026-01-06", name: "חג ההתגלות", type: "christian", color: "#dc2626" },
  { date: "2026-04-03", name: "יום שישי הטוב", type: "christian", color: "#dc2626" },
  { date: "2026-04-05", name: "חג הפסחא", type: "christian", color: "#dc2626" },
  { date: "2026-12-25", name: "חג המולד", type: "christian", color: "#dc2626" },
];

export const ALL_HOLIDAYS: Holiday[] = [
  ...JEWISH_HOLIDAYS_2025,
  ...JEWISH_HOLIDAYS_2026,
  ...MUSLIM_HOLIDAYS_2025,
  ...MUSLIM_HOLIDAYS_2026,
  ...CHRISTIAN_HOLIDAYS_2025,
  ...CHRISTIAN_HOLIDAYS_2026,
];

export function getHolidaysForDate(dateStr: string): Holiday[] {
  return ALL_HOLIDAYS.filter(h => h.date === dateStr);
}

export function getHolidaysInRange(start: Date, end: Date): Holiday[] {
  const startStr = start.toISOString().split("T")[0];
  const endStr = end.toISOString().split("T")[0];
  return ALL_HOLIDAYS.filter(h => h.date >= startStr && h.date <= endStr);
}
