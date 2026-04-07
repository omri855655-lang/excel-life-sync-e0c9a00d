
בדקתי את הקוד עצמו, ואתה צודק: כרגע יש פער בין מה שנבנה לבין מה שבאמת עובד.

1. מה שבור כרגע
- בנק/אשראי: `salt-edge-connect` פותח session אבל אין בכלל טיפול ב-`action=callback`, לכן לא נשמרים `salt_edge_connection_id` ו-`provider_name`. בפועל נשמרת רק רשומת `pending`, ולכן חיבור האשראי לא באמת נסגר ולא יכול להסתנכרן.
- מיילים: `gmail-auth` ו-`email-sync` חלקיים. ה-flow קיים, אבל הוא שביר: ה-connection נשמר בלי flow קשיח, ויש גם חוסר התאמה בין קטגוריות שה-backend מחזיר (`payments/tasks/bills`) למה שה-UI מצפה (`payment/task/bill`), אז גם התצוגה נשברת.
- שפות: `useLanguage.tsx` עודכן רק חלקית. יש עדיין הרבה טקסט עברי hardcoded ברכיבים מרכזיים, במיוחד `PaymentDashboard.tsx`, וגם בעוד רכיבי הגדרות, onboarding, התראות, auth ומדיה.
- נגישות: יש widget בסיסי ו-CSS בסיסי, אבל אין השלמה מערכתית. דף הנגישות מצהיר על יכולות שלא נאכפות באמת בכל המסכים.

2. תוכנית תיקון
א. לייצב קודם את הזרימות האמיתיות
- להשלים את `salt-edge-connect` ל-flow מלא:
  - יצירת session
  - callback/return handler אמיתי
  - שמירת `salt_edge_connection_id`, `provider_name`, `status`
  - סנכרון עסקאות רק אחרי חיבור מאושר
- להשלים את `gmail-auth` ל-OAuth אמיתי:
  - state/nonce תקין
  - callback מסודר עם success/error
  - שמירה עקבית של connection
  - טיפול נכון ב-refresh token ושגיאות Google
- ליישר backend + frontend:
  - קטגוריות מייל אחידות
  - constraints/indexes חסרים במסד
  - לא להציג providers כאילו הם עובדים אם הם לא סגורים end-to-end

ב. לתקן את הממשקים כך שישקפו מצב אמיתי
- `BankConnect.tsx`: להפסיק להציג pending בלי completion אמיתי; להוסיף polling/refresh אמיתי אחרי popup ושגיאות ברורות.
- `EmailConnectionDialog.tsx`: Gmail יעבוד באמת; Outlook/IMAP או שיושלמו באמת או שיוסרו זמנית מה-UI.
- `EmailIntegration.tsx` ו-`EmailInsightsWidget.tsx`: איחוד מלא של category keys, labels, badges ו-summary.

ג. להשלים תרגום מלא באמת
- להעביר את כל המחרוזות hardcoded למפת תרגומים מסודרת.
- להתחיל מהרכיבים עם הכי הרבה חוסרים:
  - `PaymentDashboard.tsx`
  - `ShoppingDashboard.tsx`
  - `SettingsPanel.tsx`
  - `NotificationSettings.tsx`
  - `OnboardingWizard.tsx`
  - `Personal.tsx`
  - `BooksManager.tsx`, `ShowsManager.tsx`, `PodcastsManager.tsx`
  - `ResetPassword.tsx` ורכיבי auth/empty states
- להוציא גם מערכים דינמיים לתרגום: קטגוריות, מדריכים פיננסיים, סטטוסים, יחידות ו-labels קבועים.

ד. להשלים נגישות מערכתית
- audit לרכיבי ליבה: dialogs, tabs, forms, nav, dashboard cards.
- לוודא בפועל:
  - labels ו-ARIA
  - סדר פוקוס תקין
  - focus-visible ברור
  - ניווט מקלדת מלא
  - landmarks וכותרות
  - contrast ו-reduced motion
  - Skip link שעובד בכל layout
- לעדכן את `/accessibility` כך שישקף את המצב האמיתי אחרי התיקונים.

3. קבצים שאעדכן
- Backend:
  - `supabase/functions/salt-edge-connect/index.ts`
  - `supabase/functions/gmail-auth/index.ts`
  - `supabase/functions/email-sync/index.ts`
  - migration נוספת עבור `bank_connections` / `email_connections` אם חסרים constraints או שדות
- Frontend:
  - `src/components/dashboards/BankConnect.tsx`
  - `src/components/EmailConnectionDialog.tsx`
  - `src/components/EmailIntegration.tsx`
  - `src/components/EmailInsightsWidget.tsx`
  - `src/components/dashboards/PaymentDashboard.tsx`
  - `src/hooks/useLanguage.tsx`
  - `src/components/AccessibilityWidget.tsx`
  - `src/pages/Accessibility.tsx`
  - ורכיבי ה-hardcoded שיימצאו בסריקת ההשלמה

4. סדר ביצוע
1) לתקן חיבור בנק/אשראי עד שעובד מקצה לקצה  
2) לתקן Gmail OAuth + sync עד שעובד מקצה לקצה  
3) ליישר DB/UI ולנקות אי-התאמות  
4) להשלים i18n בכל המסכים המרכזיים  
5) לבצע audit נגישות ולסגור את הפערים  
6) לבצע בדיקה end-to-end לכל flow, לא רק “הקוד קיים”

5. פרטים טכניים חשובים
- אני לא אשאיר יותר flow שיוצר `pending` בלי callback/completion.
- במיילים אאחד את הקטגוריות לסט אחד עקבי בכל המערכת.
- אם חסר unique constraint ל-`email_connections`, אוסיף אותו במיגרציה כדי שה-upsert יעבוד יציב.
- אם Outlook/IMAP לא נתמכים באמת, הם לא יישארו מוצגים כאילו הם עובדים.
- בנגישות, המדד יהיה התנהגות בפועל — לא רק טקסט בדף הצהרה.

6. התוצאה המצופה אחרי הסבב הזה
- חיבור בנק/אשראי ייצור connection אמיתי שניתן לסנכרון.
- Gmail יתחבר דרך OAuth ויחזיר חשבון פעיל עם sync תקין.
- המסכים המרכזיים לא יישארו עם עברית hardcoded בשפות אחרות.
- שכבת הנגישות תהיה תואמת הרבה יותר למה שהמערכת מצהירה עליו.
