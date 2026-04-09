

# תוכנית תיקונים ותוספות — סיבוב מקיף

## סיכום הבעיות שזוהו

### 1. CompactView לא פותח דיאלוג פרטי משימה
**בעיה**: ב-`TaskSpreadsheetDb.tsx`, לחיצה על פריט ב-CompactView מפעילה `setSelectedRow(id)` — אך אין `ItemDetailDialog` שנפתח כש-`selectedRow` מוגדר. בתצוגות אחרות (טבלה) הבחירה מסומנת בשורת הטבלה, אבל ב-Compact אין שום חזות לכך.
**תיקון**: הוספת `ItemDetailDialog` שנפתח כש-`selectedRow !== null` ו-`dashViewMode === "compact"`. הדיאלוג יציג את כל שדות המשימה (תיאור, סטטוס, קטגוריה, הערות, דחיפות) ויאפשר עריכה.

### 2. עריכת סכום בהוצאות לא קיימת
**בעיה**: `saveEntryEdit` מעדכן רק `category` ו`notes` אבל לא את ה-`amount`. המשתמש לא יכול לתקן סכומים שגויים.
**תיקון**: הוספת שדה `editAmount` ל-state, הצגת `Input type="number"` בטופס העריכה, ועדכון ה-`amount` ב-DB.

### 3. תקציב שבועי לא מחשב לפי תאריכים
**בעיה**: `totalSpending` מחשב את כל ההוצאות מאז ומעולם — לא מסנן לפי שבוע/חודש. כשהמשתמש שם יעד שבועי, ההוצאות של החודש כולו נספרות.
**תיקון**: סינון `dashboardEntries` לפי `budgetPeriod` — weekly: ראשון-שבת הנוכחי, monthly: 1 בחודש עד סוף חודש, quarterly: 3 חודשים, yearly: שנה. חישוב `periodSpending` רק מהוצאות בטווח.

### 4. אדמין — שליחת מייל נכשלת לכתובות לא-Gmail
**בעיה**: הפונקציה `send_email` ב-`admin-analytics` שולחת מ-`info@tabro.org` שלא אומת ב-Resend. ה-connector gateway דורש דומיין מאומת.
**תיקון**: שינוי ה-`from` ל-`onboarding@resend.dev` (כמו ב-send-contact-form). דומיין resend.dev מאומת ומאפשר שליחה לכל כתובת. Deploy מחדש.

### 5. אדמין — אין תיבת דואר נכנס
**בעיה**: ה-Admin מציג רק לוג שליחות (email_send_log). אין תצוגה של פניות שנכנסו (contact form submissions).
**תיקון**: שליפת פניות שנשלחו דרך contact-form מה-`email_send_log` (template_name = 'contact-form') והצגתן כ"דואר נכנס" עם נושא, שולח, תאריך. הוספת טאבים "נכנס" / "יוצא" לתיבת המייל.

### 6. RTL — דשבורדים לא מיושרים לימין
**בעיה**: חלק מהדשבורדים חסרים `dir="rtl"` בעברית.
**תיקון**: הוספת `dir={isRtl ? "rtl" : "ltr"}` לכל רכיב ראשי של דשבורד שחסר אותו.

### 7. זימון אנשים במתכנן לוז (פיצ'ר חדש)
**בעיה**: לא קיים. המשתמש רוצה לשלוח הזמנה לאירוע לאנשים — גם פנימיים (משתמשי המערכת) וגם חיצוניים (מייל). ההזמנה מופיעה בצבע מעומעם עד שהמוזמן מאשר.
**תיקון**:
- יצירת טבלת `event_invitations` (event_id, invitee_email, invitee_user_id, status: pending/accepted/declined, responded_at)
- בדיאלוג יצירת/עריכת אירוע — הוספת שדה "הזמן משתתפים" (מיילים)
- Edge function חדשה `send-event-invitation` ששולחת מייל הזמנה עם כפתורי אישור/דחייה
- אירועים עם הזמנות pending מוצגים בשקיפות (opacity-60) עד לאישור
- כשהמוזמן מאשר — שליחת התראה למייל ולאתר (notification bell)
- הוספת הגדרת התראות לזימונים ב-NotificationSettings

### 8. משימות חוזרות במתכנן הלוז
**בעיה**: משימות חוזרות (ריצה, כדורים) מופיעות ב-"לוז יומי" אבל לא ככלל אירועים קבועים במתכנן הלוז עצמו, עם התראה לפני.
**תיקון**: במתכנן הלוז, הצגת משימות חוזרות שמגיעות היום כ-events עם זמן default (בוקר/ערב) ושליחת push/email לפני הזמן שנקבע. הוספת אופציית "שעת תזכורת" לכל משימה חוזרת.

### 9. עיצובים חסרים לדשבורדים
**בעיה**: העיצובים (themes) שנשלחו קודם לא מוחלים. ה-`DashboardDisplayToolbar` הוסר מ-PaymentDashboard ובמקומות אחרים הוא לא עובד כמו שצריך.
**תיקון**: בדיקת `useDashboardDisplay` בכל דשבורד — אם ה-theme לא מחיל שינוי ויזואלי, יש להחיל CSS classes בפועל (gradient backgrounds, border colors) על פי ה-theme שנבחר.

---

## סדר ביצוע

### שלב 1: תיקונים קריטיים בהוצאות/הכנסות
- **PaymentDashboard.tsx**: הוספת עריכת סכום (amount edit), סינון תקציב לפי תקופה, RTL
- **saveEntryEdit**: עדכון amount ב-DB

### שלב 2: CompactView — דיאלוג פרטי משימה
- **TaskSpreadsheetDb.tsx**: הוספת `ItemDetailDialog` לתצוגה קומפקטית
- **ItemDetailDialog.tsx**: עדכון/יצירת דיאלוג עם כל שדות המשימה

### שלב 3: תיקון מייל אדמין + תיבת דואר נכנס
- **admin-analytics/index.ts**: שינוי from ל-`onboarding@resend.dev`, הוספת שליפת פניות נכנסות
- **AdminDashboard.tsx**: הוספת טאבים נכנס/יוצא, תצוגת פניות
- Deploy מחדש

### שלב 4: זימונים במתכנן לוז
- Migration: טבלת `event_invitations`
- **PersonalPlanner.tsx**: UI הזמנת משתתפים, תצוגת אירוע pending
- Edge function: `send-event-invitation`
- **NotificationSettings.tsx**: הגדרות התראות לזימונים

### שלב 5: משימות חוזרות במתכנן + תזכורות
- **useRecurringTasks.ts**: הוספת שדה `reminder_time`
- **PersonalPlanner.tsx**: הצגת recurring tasks כ-events קבועים
- Migration: הוספת עמודת `reminder_time` ל-`recurring_tasks`

### שלב 6: עיצובים ו-RTL
- החלת themes בפועל על דשבורדים
- הוספת `dir="rtl"` חסרים

---

## קבצים לעדכון

| קובץ | שינויים |
|-------|---------|
| `src/components/dashboards/PaymentDashboard.tsx` | עריכת סכום, סינון תקציב לפי תקופה, RTL |
| `src/components/TaskSpreadsheetDb.tsx` | ItemDetailDialog ב-compact mode |
| `src/components/ItemDetailDialog.tsx` | דיאלוג פרטי משימה מלא |
| `src/pages/AdminDashboard.tsx` | טאבים נכנס/יוצא, פניות |
| `supabase/functions/admin-analytics/index.ts` | from → onboarding@resend.dev, שליפת פניות |
| `src/components/PersonalPlanner.tsx` | זימונים, recurring events |
| `src/hooks/useRecurringTasks.ts` | שדה reminder_time |
| `src/components/NotificationSettings.tsx` | הגדרות זימונים |

**שינויי DB**: טבלת `event_invitations`, עמודת `reminder_time` ב-`recurring_tasks`

