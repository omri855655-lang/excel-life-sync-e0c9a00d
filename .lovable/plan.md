

# תוכנית תיקונים מקיפה

## בעיות שזוהו

### 1. מייל נכשל — "Credential not found" (קריטי)
**שורש הבעיה**: ה-Edge Functions משתמשות ב-`RESEND_API_KEY` (סוד ידני) כ-`X-Connection-Api-Key` בקריאה ל-connector gateway. אבל ה-gateway מזהה רק את `RESEND_API_KEY_1` (מה-Resend connector שזה עתה חובר). לכן ה-gateway מחזיר "Credential not found".

**תיקון**: עדכון `send-contact-form` ו-`admin-analytics` לשימוש ב-`RESEND_API_KEY_1` במקום `RESEND_API_KEY` בקריאות gateway. Deploy מחדש.

### 2. הוצאות קבועות (שכירות, ביטוחים) — חסר סימון ייעודי
**בעיה**: יש רק `recurring` toggle. המשתמש רוצה שהוצאות קבועות (שכ"ד, ביטוחים) לא ייספרו בתקציב השבועי/חודשי.
**מצב נוכחי**: `periodSpending` כבר מחריג `recurring` entries (שורה 335). אבל אין דרך נוחה לסמן הוצאה כ"קבועה" מתוך הטופס או מרשימת התנועות. 
**תיקון**: הוספת checkbox "תשלום קבוע (לא נספר בתקציב)" בטופס ההוספה. הוספת כפתור toggle "קבוע" ליד כל הוצאה ברשימה. הצגת סיכום הוצאות קבועות בכרטיס Hero.

### 3. לוז יומי → אירוע קבוע במתכנן
**בעיה**: אין אפשרות לקחת משימה חוזרת (כמו "לקחת תרופות") ולהציג אותה כאירוע קבוע במתכנן הלוז עם שעה ספציפית.
**תיקון**: 
- ב-PersonalPlanner — שליפת `recurringTasks` שיש להם `reminder_time` והצגתם כאירועים קבועים בלוח בכל יום שהם חלים
- ב-DailyRoutine — הוספת בחירת שעה (`reminder_time`) לכל משימה חוזרת

### 4. זימונים במתכנן לוז (UI)
**בעיה**: טבלת `event_invitations` נוצרה אך אין UI.
**תיקון**: בדיאלוג יצירת/עריכת אירוע — הוספת שדה "הזמן משתתפים" (הכנסת מיילים). שליחת הזמנה ב-DB + מייל. אירועים pending מוצגים ב-opacity-60.

### 5. Edge function לשליחת הזמנות
**תיקון**: יצירת `send-event-invitation` edge function ששולחת מייל הזמנה עם לינק אישור/דחייה.

### 6. עיצובים ו-RTL לדשבורדים
**בעיה**: themes לא מוחלים בפועל, חלק מהדשבורדים לא מיושרים ל-RTL.
**תיקון**: הוספת `dir={isRtl ? "rtl" : "ltr"}` לדשבורדים שחסר, החלת theme classes בפועל.

### 7. הגדרות התראות לזימונים
**תיקון**: הוספת אפשרות ב-NotificationSettings לניהול התראות זימונים.

---

## סדר ביצוע

### שלב 1: תיקון מייל (קריטי ביותר)
**קבצים**: `supabase/functions/send-contact-form/index.ts`, `supabase/functions/admin-analytics/index.ts`
- החלפת `RESEND_API_KEY` ב-`RESEND_API_KEY_1` בקריאות gateway
- Deploy שתי הפונקציות

### שלב 2: הוצאות קבועות + עריכה
**קובץ**: `src/components/dashboards/PaymentDashboard.tsx`
- Checkbox "תשלום קבוע" בטופס הוספה (`newRecurring` כבר קיים — הוספת UI ברור)
- כפתור toggle "קבוע/משתנה" ליד כל הוצאה ברשימה
- הצגת סיכום הוצאות קבועות בכרטיס Hero

### שלב 3: משימות חוזרות כאירועים במתכנן
**קבצים**: `src/components/PersonalPlanner.tsx`, `src/components/DailyRoutine.tsx`
- ב-DailyRoutine — הוספת בחירת שעה לכל משימה חוזרת
- ב-PersonalPlanner — שליפת recurring tasks עם reminder_time והצגתם כאירועים

### שלב 4: UI זימונים במתכנן
**קובץ**: `src/components/PersonalPlanner.tsx`
- הוספת שדה "הזמן משתתפים" בדיאלוג אירוע
- שמירה ב-event_invitations
- תצוגת pending ב-opacity-60

### שלב 5: Edge function הזמנות
**קובץ חדש**: `supabase/functions/send-event-invitation/index.ts`
- שליחת מייל הזמנה דרך Resend connector gateway
- לינק אישור/דחייה

### שלב 6: הגדרות התראות + עיצוב + RTL
**קבצים**: `src/components/NotificationSettings.tsx`, דשבורדים שונים
- הוספת הגדרת זימונים
- dir="rtl" חסרים
- Theme classes

---

## קבצים לעדכון

| קובץ | שינויים |
|-------|---------|
| `supabase/functions/send-contact-form/index.ts` | RESEND_API_KEY → RESEND_API_KEY_1 |
| `supabase/functions/admin-analytics/index.ts` | RESEND_API_KEY → RESEND_API_KEY_1 |
| `src/components/dashboards/PaymentDashboard.tsx` | UI הוצאות קבועות, toggle, סיכום |
| `src/components/PersonalPlanner.tsx` | recurring events, זימונים UI |
| `src/components/DailyRoutine.tsx` | בחירת שעת תזכורת |
| `supabase/functions/send-event-invitation/index.ts` | חדש — שליחת הזמנות |
| `src/components/NotificationSettings.tsx` | הגדרות זימונים |

**ללא שינויי DB** — טבלאות כבר קיימות מהמיגרציה האחרונה.

