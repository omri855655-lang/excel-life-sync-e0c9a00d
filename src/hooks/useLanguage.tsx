import { useState, useEffect, createContext, useContext, ReactNode } from "react";

type Language = "he" | "en";

const translations = {
  he: {
    // Header
    personalArea: "אזור אישי",
    installApp: "התקנת אפליקציה",
    signOut: "התנתק",
    signedOutSuccess: "התנתקת בהצלחה",
    loading: "טוען...",

    // Tabs
    dashboard: "דשבורד",
    personalTasks: "משימות אישיות",
    workTasks: "משימות עבודה",
    books: "ספרים",
    shows: "סדרות",
    podcasts: "פודקאסטים",
    dailyRoutine: "לוז יומי",
    projects: "פרויקטים",
    courses: "קורסים",
    planner: "מתכנן לוז",
    deeply: "Deeply",
    settings: "הגדרות",

    // Settings
    security: "אבטחה",
    pinCode: "קוד גישה (PIN)",
    pinDescription: "דרוש קוד 4 ספרות בכל כניסה לאתר",
    changePin: "שנה קוד גישה",
    setPin: "הגדר קוד גישה",
    enterNewCode: "הזן קוד חדש:",
    cancel: "ביטול",
    customDashboards: "דשבורדים מותאמים אישית",
    customDashboardsDesc: "צור דשבורדים מותאמים לעקוב אחר כל דבר שתרצה (למידה, כושר, מתכונים ועוד). הם יופיעו כלשוניות בסרגל העליון.",
    newDashboard: "דשבורד חדש",
    chooseTemplate: "בחר תבנית",
    taskList: "רשימת משימות (כולל דשבורד)",
    trackingList: "רשימת מעקב (כמו ספרים/פודקאסטים)",
    kanban: "קנבן (לביצוע → בבדיקה → הושלם)",
    custom: "מותאם אישית",
    dashboardName: "שם הדשבורד",
    dashboardNamePlaceholder: 'לדוגמה: "לימודים", "כושר", "מתכונים"',
    statuses: "סטטוסים (מופרדים בפסיק)",
    statusesDesc: "הסטטוסים שיופיעו בתפריט הבחירה של כל פריט",
    showInMainDashboard: "הצג סיכום בדשבורד הראשי",
    createDashboard: "צור דשבורד",
    addNewDashboard: "הוסף דשבורד חדש",
    showTabs: "הצגת לשוניות",
    showTabsDesc: "בחר אילו לשוניות יוצגו בסרגל העליון. לשוניות מוסתרות לא יופיעו אבל הנתונים שלהן נשמרים.",
    displayedInDashboard: "מוצג בדשבורד",
    language: "שפה",
    languageDesc: "בחר את שפת הממשק",
    hebrew: "עברית",
    english: "English",
  },
  en: {
    // Header
    personalArea: "Personal Area",
    installApp: "Install App",
    signOut: "Sign Out",
    signedOutSuccess: "Signed out successfully",
    loading: "Loading...",

    // Tabs
    dashboard: "Dashboard",
    personalTasks: "Personal Tasks",
    workTasks: "Work Tasks",
    books: "Books",
    shows: "Shows",
    podcasts: "Podcasts",
    dailyRoutine: "Daily Routine",
    projects: "Projects",
    courses: "Courses",
    planner: "Planner",
    deeply: "Deeply",
    settings: "Settings",

    // Settings
    security: "Security",
    pinCode: "Access Code (PIN)",
    pinDescription: "Require a 4-digit code on every login",
    changePin: "Change PIN",
    setPin: "Set PIN",
    enterNewCode: "Enter new code:",
    cancel: "Cancel",
    customDashboards: "Custom Dashboards",
    customDashboardsDesc: "Create custom dashboards to track anything you want (learning, fitness, recipes, etc.). They will appear as tabs in the top bar.",
    newDashboard: "New Dashboard",
    chooseTemplate: "Choose Template",
    taskList: "Task List (with dashboard)",
    trackingList: "Tracking List (like books/podcasts)",
    kanban: "Kanban (To Do → Review → Done)",
    custom: "Custom",
    dashboardName: "Dashboard Name",
    dashboardNamePlaceholder: 'e.g. "Learning", "Fitness", "Recipes"',
    statuses: "Statuses (comma-separated)",
    statusesDesc: "The statuses that will appear in the selection menu of each item",
    showInMainDashboard: "Show summary in main dashboard",
    createDashboard: "Create Dashboard",
    addNewDashboard: "Add New Dashboard",
    showTabs: "Tab Visibility",
    showTabsDesc: "Choose which tabs are displayed in the top bar. Hidden tabs won't appear but their data is preserved.",
    displayedInDashboard: "Displayed in dashboard",
    language: "Language",
    languageDesc: "Choose the interface language",
    hebrew: "עברית",
    english: "English",
  },
} as const;

type TranslationKey = keyof typeof translations.he;

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  dir: "rtl" | "ltr";
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "he",
  setLang: () => {},
  t: (key) => translations.he[key],
  dir: "rtl",
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    return (localStorage.getItem("app-language") as Language) || "he";
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("app-language", newLang);
  };

  useEffect(() => {
    document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key: TranslationKey): string => {
    return translations[lang][key] || translations.he[key] || key;
  };

  const dir = lang === "he" ? "rtl" : "ltr";

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
