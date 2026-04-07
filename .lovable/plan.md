

# תוכנית: חיבור אשראי + תרגום מלא + נגישות + תיקון מייל

## סיכום
4 שיפורים: (1) חיבור לאפליקציות אשראי ישראליות בזמן אמת + ייבוא CSV, (2) תרגום אמיתי של כל הממשק ל-6 שפות, (3) נגישות לפי ת"י 5568, (4) תיקון סנכרון מייל.

---

## 1. חיבור אפליקציות אשראי (Max, Cal, Isracard, Visa)

חברות האשראי בישראל לא מספקות API פתוח — הדרך לגשת לנתונים היא דרך פרויקט הקוד הפתוח **israeli-bank-scrapers** שמדמה כניסה לאתר חברת האשראי ושולף עסקאות.

**מה ייבנה:**

- **רכיב חדש** `CreditCardConnect.tsx` — טופס חיבור לחברת אשראי:
  - בחירת חברה (Max, Cal, Isracard, Visa Cal, Leumi Card, Amex)
  - הזנת שם משתמש + סיסמה (מוצפנים, לא נשמרים בצד לקוח)
  - כפתור "סנכרן עכשיו" + סנכרון תקופתי
  - תצוגת עסקאות אחרונות עם סיווג אוטומטי לקטגוריות

- **Edge Function חדשה** `credit-card-sync/index.ts`:
  - מקבלת credentials מוצפנים + שם חברה
  - משתמשת ב-israeli-bank-scrapers לשליפת עסקאות
  - AI (Gemini) מסווג כל עסקה לקטגוריה (סופר, דלק, ביגוד...)
  - שומרת ב-`payment_tracking` עם `payment_method: "credit_card"`

- **טבלת DB חדשה** `credit_card_connections`:
  - `user_id`, `provider`, `encrypted_credentials`, `last_sync`, `sync_status`
  - RLS: רק המשתמש רואה את שלו

- **שילוב בדשבורד תשלומים**: כפתור "חבר כרטיס אשראי" + תצוגת עסקאות מסונכרנות + גרפים לפי קטגוריה

- **ייבוא CSV/PDF**: גם אפשרות ידנית לייבוא דפי פירוט

---

## 2. תרגום מלא — תיקון כל הטקסט ה-hardcoded

**הבעיה**: טאבים כמו "תזונה ושינה", "קניות", "הכנסות והוצאות", "מפת חלומות", "שיתופים" הם hardcoded בעברית ב-`Personal.tsx`. קטגוריות תשלום/קניות גם הן בעברית בלבד.

**מה יתוקן:**

- **`Personal.tsx`** שורות 89-95 — החלפה ל-`t("nutrition")`, `t("dreams")`, `t("shopping")`, `t("payments")`, `t("notes")`, `t("sharing")`
- **`useLanguage.tsx`** — הוספת ~60 מפתחות חדשים לכל 6 שפות:
  - שמות טאבים, קטגוריות תשלום (23), קטגוריות קניות (12), סטטוסים
  - פורמט תאריכים/מספרים/מטבע לפי locale
- **`PaymentDashboard.tsx`** — קטגוריות `CATEGORIES` ו-`FINANCIAL_GUIDES` מתורגמים
- **`ShoppingDashboard.tsx`** — קטגוריות סופר מתורגמות
- **`NutritionDashboard.tsx`** — כל התוויות מתורגמות
- **`AccessibilityWidget.tsx`** — כפתורים ותוויות מתורגמים
- **`OnboardingWizard.tsx`** — רוסית בבחירת שפות
- **כללי RTL/LTR**: he+ar → RTL, שאר → LTR

---

## 3. נגישות מלאה (ת"י 5568 / WCAG 2.1 AA)

- **`index.css`**: focus-visible outline (3px), high-contrast mode, prefers-reduced-motion
- **`AccessibilityWidget.tsx`**: תרגום לכל 6 שפות + `aria-label` דינמי
- **`Accessibility.tsx`**: דף הצהרת נגישות מתורגם
- **`SkipLink.tsx`**: תרגום "דלג לתוכן"
- **סקירת ARIA**: בדיקת heading hierarchy, labels בטפסים, ניגודיות צבעים

---

## 4. תיקון סנכרון מייל

- **Edge Function חדשה** `email-sync/index.ts` — כרגע לא קיימת, לכן הסנכרון נכשל
- תתמוך ב-IMAP (חיבור ישיר) + placeholder ל-Gmail/Outlook OAuth
- AI סיווג מיילים לקטגוריות (תשלום, משימה, קניות)

---

## סיכום טכני

| סוג | קבצים |
|-----|--------|
| מיגרציה | `credit_card_connections` + RLS |
| Edge Functions חדשות | `credit-card-sync`, `email-sync` |
| רכיבים חדשים | `CreditCardConnect.tsx`, `CreditCardImport.tsx` |
| עדכונים | `useLanguage.tsx` (~60 מפתחות × 6 שפות), `Personal.tsx`, `PaymentDashboard.tsx`, `ShoppingDashboard.tsx`, `NutritionDashboard.tsx`, `AccessibilityWidget.tsx`, `Accessibility.tsx`, `SkipLink.tsx`, `OnboardingWizard.tsx`, `index.css` |

**הערה חשובה**: חיבור אפליקציות אשראי דורש הרצת scraper בצד שרת. הספרייה `israeli-bank-scrapers` פועלת ב-Node.js עם puppeteer/playwright — ייתכן שנצטרך להריץ אותה כ-microservice חיצוני (Deno Edge Functions לא תומכות ב-puppeteer). אציע פתרון חלופי: API של שירות כמו **Caspion** או **Fincheck** שמספקים גישה ל-scrapers כשירות ענן, או לחלופין נתחיל עם ייבוא CSV + סנכרון ידני ונוסיף חיבור ישיר בהמשך.

