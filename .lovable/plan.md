
## תוכנית המשך ממוקדת — לפי הבדיקה בקוד ובנתונים

### מה מצאתי בפועל
1. **השגיאה “error sending mail” באדמין היא אמיתית בבאקאנד**  
   הבעיה לא רק במסך. כרגע יש כמה מסלולי מייל שונים, וחלקם עדיין משתמשים בשליחה מוגבלת:
   - `admin-analytics` שולח מיילים בכתובת בטוחה, אבל כשהמערכת נופלת למסלול מוגבל של שליחה ניסיונית, שליחה לכתובות שאינן כתובת הבעלים נכשלת.
   - `send-welcome-email` עדיין שולח מכתובת `info@tabro.org`, ולכן ממשיך ליפול עם שגיאת דומיין לא מאומת.
   - גם פונקציות נוספות של התראות/תזכורות עדיין משתמשות במסלול הישן, ולכן יש כשלי מייל עקביים.

2. **חלון עריכת אירוע לא טוען את המיילים שכבר הוזמנו**
   ב־`PersonalPlanner.tsx` בעת עריכה מוגדר תמיד `inviteeEmails: ""`, ולכן אין טעינה של המוזמנים הקיימים.

3. **הזימון לא מופיע “מיד” אצל המוזמן**
   יש כבר טבלת זימונים ו־RLS צפייה, אבל:
   - אין **Realtime** על `calendar_events` ו־`event_invitations`
   - אין **subscription** ב־`useCalendarEvents`
   - אין refetch מיידי אצל הצד המקבל  
   לכן גם אם ההזמנה נשמרת, היא לא קופצת בזמן אמת בלוז של המוזמן.

4. **התראות זימונים עדיין לא מחוברות באמת**
   יש הגדרת `invitationsEnabled` ב־`NotificationSettings`, אבל בפועל אין כתיבה מתאימה ל־`sent_notifications` ואין מסלול מלא של “נשלח זימון” / “אישר/דחה” עם התראה באתר ובמייל.

5. **יש חור נוסף: ערוצים ישנים של מיילים עדיין נשארו בקוד**
   גם אחרי התיקונים הקודמים יש פונקציות נוספות שעדיין משתמשות בכתובת/מפתח של השליחה הישנה. אם לא נסגור את כולן, יהיו עדיין נפילות “אקראיות”.

---

## מה אבצע עכשיו

### שלב 1 — סגירת כל תקלות המייל, לא רק במסך האדמין
אעדכן את כל פונקציות המייל הרלוונטיות כך שישתמשו באותו מסלול שליחה תקין ואחיד, ולא ינסו לשלוח מכתובת לא מאומתת או במסלול מוגבל:
- `supabase/functions/admin-analytics/index.ts`
- `supabase/functions/send-contact-form/index.ts`
- `supabase/functions/send-welcome-email/index.ts`
- `supabase/functions/send-event-invitation/index.ts`
- `supabase/functions/send-push-notifications/index.ts`
- `supabase/functions/send-task-reminders/index.ts`
- `supabase/functions/notify-shared-task/index.ts`

מה אסגור שם:
- מסלול שליחה אחיד
- כתובת שולח בטוחה עד שהדומיין של המייל יושלם ב־Cloud → Emails
- לוג מסודר גם לכישלונות, כדי שבאדמין תופיע השגיאה האמיתית ולא רק “error sending mail”

### שלב 2 — תיקון מלא של עריכת מוזמנים באירוע
ב־`PersonalPlanner.tsx` אטען את המוזמנים הקיימים בזמן פתיחת אירוע לעריכה:
- שליפת הזימונים של אותו אירוע
- הצגת כל המיילים בשדה ההזמנה
- שמירה חכמה של הבדלים: הוספה / הסרה / מניעת כפילויות

בנוסף אוסיף הגנת DB קטנה כדי למנוע כפילויות של אותו מייל באותו אירוע.

### שלב 3 — הופעה מיידית של זימון אצל המוזמן
אוסיף שכבת עדכון בזמן אמת:
- הוספת `calendar_events` ו־`event_invitations` ל־Realtime publication
- subscription ב־`useCalendarEvents.ts`
- refetch אוטומטי כשמגיע שינוי רלוונטי
- רענון מיידי גם אחרי שליחת זימון וגם אחרי אישור/דחייה

המטרה: אם למוזמן יש חשבון, האירוע יופיע אצלו בלוז כמעט מיד, בלי רענון ידני.

### שלב 4 — תצוגת pending בהירה עד אישור, בכל הזרימה
אחזק את ההתנהגות שכבר קיימת חלקית:
- אירוע מוזמן יוצג בהיר/מעומעם עד אישור
- התצוגה תהיה עקבית בלוז, לא רק בחלק מהמקרים
- אישור יסיר את מצב ה־pending
- דחייה תסיר את האירוע מהתצוגה של המוזמן

### שלב 5 — התראות זימונים אמיתיות באתר ובמייל
אחבר את הזימונים למערכת ההתראות הקיימת:
- בעת יצירת זימון: יצירת התראת אתר למוזמן
- בעת אישור/דחייה: יצירת התראת אתר למזמין
- אם הגדרות המשתמש מאפשרות — גם מייל / Push
- שימוש ב־`sent_notifications` כדי שה־NotificationBell יציג את זה בפועל
- חיבור מלא ל־`invitationsEnabled` שכבר קיים בהגדרות

כאן אעדכן גם את `get-notifications` כדי להעשיר התראות זימון בצורה נכונה.

### שלב 6 — יישור וסיום תיבת האדמין
אעדכן גם את מסך האדמין עצמו כדי שיציג את המידע השימושי:
- הודעת שגיאה אמיתית מהשרת
- סטטוס failure גם ל־admin compose
- הרחבת נתוני תיבת המייל כך שאפשר יהיה לראות טוב יותר מי נכשל, למה, ועל מה

---

## שינויי backend שאדרש להם
1. **מיגרציה קצרה ל־Realtime**
   - הוספת `calendar_events`
   - הוספת `event_invitations`

2. **מיגרציה קצרה למניעת כפילויות זימון**
   - unique constraint / unique index על אירוע + אימייל מוזמן

3. **ייתכן עדכון קטן ל־RLS אם אזהה חוסר ב־update flow**
   כרגע ה־SELECT נראה נכון, אבל אאמת גם את זרימת האישור/עדכון דרך השרת.

---

## קבצים עיקריים שאעדכן
- `src/components/PersonalPlanner.tsx`
- `src/hooks/useCalendarEvents.ts`
- `src/pages/AdminDashboard.tsx`
- `src/components/NotificationSettings.tsx`
- `supabase/functions/admin-analytics/index.ts`
- `supabase/functions/send-event-invitation/index.ts`
- `supabase/functions/send-contact-form/index.ts`
- `supabase/functions/send-welcome-email/index.ts`
- `supabase/functions/get-notifications/index.ts`
- `supabase/functions/send-push-notifications/index.ts`
- `supabase/functions/send-task-reminders/index.ts`
- `supabase/functions/notify-shared-task/index.ts`
- `supabase/migrations/...` (Realtime + מניעת כפילויות)

---

## התוצאה אחרי הסבב הזה
- שליחת מייל מהאדמין תפסיק ליפול במסלולים השבורים.
- זימון ישמר ויופיע גם בעריכה, עם כל המיילים שכבר הוזמנו.
- משתמש עם חשבון יראה את הפגישה אצלו בלוז כמעט מייד.
- האירוע יופיע בהיר עד שהוא מאשר.
- אישור/דחייה ישלחו התראה באתר ולפי ההגדרות גם בערוצים נוספים.
- תיבת האדמין תציג כשלי מייל בצורה ברורה במקום הודעת שגיאה כללית בלבד.
