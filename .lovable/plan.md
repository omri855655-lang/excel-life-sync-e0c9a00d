

# תוכנית תיקונים — שעות, מיילים, זימונים, RTL ומובייל

## בעיות שזוהו בדיקת קוד בפועל

### 1. באג קריטי בשעות — toLocalISOString שובר timezone
**מה קורה**: המשתמש רושם 11:10, `toLocalISOString` יוצר `"2026-04-13T11:10:45"` (ללא timezone). Postgres `timestamptz` מפרש את זה כ-UTC. כשהנתון חוזר מה-DB עם `+00`, הדפדפן ממיר ל-UTC+3 (ישראל) → מציג 14:10.
**תיקון**: עדכון `toLocalISOString` כך שיוסיף את ה-timezone offset של הדפדפן (לדוגמה `+03:00`). כך Postgres ישמור נכון ב-UTC, וכל דפדפן/מוזמן יציג לפי האזור שלו.

### 2. מיילים לכתובות שאינן Gmail נכשלים
**שורש הבעיה**: כל ה-Edge Functions שולחות מ-`onboarding@resend.dev` — זו כתובת sandbox של Resend. במצב sandbox, ניתן לשלוח **רק לכתובת הבעלים** (omri855655@gmail.com). כל כתובת אחרת (כולל Gmail אחר, Outlook, gov.il) תיכשל.
**פתרון**: הדומיין `notify.tabro.org` מוגדר אבל **ממתין לאימות DNS**. ברגע שה-DNS יאומת, ניתן יהיה לשלוח מ-`noreply@notify.tabro.org` לכל כתובת. עד אז — אין דרך לשלוח לכתובות שאינן של בעל החשבון ב-Resend.
**מה אעשה**: אכין את כל ה-Edge Functions כך שישתמשו ב-`notify.tabro.org` כשהדומיין מאומת, וב-sandbox כ-fallback. אוסיף הודעת שגיאה ברורה לאדמין כש-sandbox חוסם שליחה.

### 3. זימונים — המוזמן לא רואה אירוע בלוז שלו
**מה מצאתי**: ה-RLS תקין, ה-Realtime מופעל, ה-invitee_user_id מוגדר נכון (8b7b6ea4). הבעיה היא **באג ב-query עצמה**: ב-`useCalendarEvents.ts` שורה 105, ה-`.or()` filter עלול להיכשל כי PostgREST דורש syntax ספציפי עבור `ilike` עם ערכי מייל. בנוסף, ה-Realtime channel לא מסנן לפי user, אז מגיעים אירועים של כולם, וה-refetch חוזר ושולף רק אירועים ספציפיים. צריך גם לוודא שהמוזמן רשום עם אותו email שנשלח אליו.

### 4. מיילים לתיבת "עדכונים" ולא Inbox ראשי
**סיבה**: ספקי מייל (Gmail, Outlook) מסווגים מיילים מ-`onboarding@resend.dev` כ"עדכונים" כי זה דומיין משותף. שימוש בדומיין מאומת משלך (`notify.tabro.org`) ישפר את ההגעה ל-Primary Inbox.

### 5. RTL ומובייל — לא הושלם
**מה חסר**: דשבורדים עדיין LTR בחלקים, מובייל לא מותאם מספיק.

---

## שלבי ביצוע

### שלב 1 — תיקון timezone (קריטי)
**קובץ**: `src/components/PersonalPlanner.tsx`
- עדכון `toLocalISOString` להוספת timezone offset:
  ```
  // לדוגמה: "2026-04-13T11:10:00+03:00" במקום "2026-04-13T11:10:00"
  ```
- כך Postgres ישמור כ-UTC 08:10, וכל דפדפן יציג לפי האזור המקומי שלו
- עדכון גם ב-`send-event-invitation` לשימוש באזור זמן ישראל לתצוגה

### שלב 2 — תיקון query של זימונים
**קובץ**: `src/hooks/useCalendarEvents.ts`
- תיקון ה-`.or()` filter כך שיעבוד בצורה אמינה עם PostgREST
- הוספת טיפול נכון ב-email שעלול להכיל תווים מיוחדים
- וידוא ש-refetch עובד נכון אחרי שינוי realtime

### שלב 3 — הכנת Edge Functions לדומיין מאומת
**קבצים**: כל Edge Functions ששולחות מייל
- הוספת בדיקה: אם `notify.tabro.org` מאומת → שליחה ממנו; אחרת → sandbox עם הודעת שגיאה ברורה
- לוג מפורט לאדמין כדי שיהיה ברור למה מייל נכשל
- עדכון `send-welcome-email`, `admin-analytics`, `send-event-invitation`, `send-contact-form`

### שלב 4 — RTL לדשבורדים
**קבצים**: `PaymentDashboard.tsx`, `AdminDashboard.tsx`, ודשבורדים נוספים
- הוספת/תיקון `dir="rtl"` בכותרות, כרטיסים, טבלאות
- יישור לימין עקבי

### שלב 5 — התאמת מובייל/אייפון
**קבצים**: `PersonalPlanner.tsx`, `PaymentDashboard.tsx`, דשבורדים
- הוספת responsive breakpoints למובייל
- גודל גופן מינימלי 16px לשדות קלט (מניעת zoom)
- טבלאות גלילתיות עם עמודות sticky
- כפתורים וטאבים בגודל נוח למגע

### שלב 6 — שדרוג תיבת מייל אדמין
**קובץ**: `src/pages/AdminDashboard.tsx`
- הצגת שגיאות מפורטות (domain not verified, sandbox limitation)
- סינון לפי סטטוס (נשלח/נכשל)
- שיפור תצוגת פניות נכנסות

---

## דגש חשוב לגבי מיילים

**עד שהדומיין `notify.tabro.org` יאומת**, שליחת מיילים לכתובות שאינן omri855655@gmail.com **תמשיך להיכשל**. זו מגבלה של Resend sandbox ולא באג בקוד. הפתרון הוא להשלים את אימות ה-DNS ב-**Cloud → Emails**. אכין את הקוד כך שברגע שהדומיין מאומת, הכל יעבוד אוטומטית.

---

## קבצים לעדכון

| קובץ | שינוי |
|-------|-------|
| `src/components/PersonalPlanner.tsx` | timezone fix, mobile responsive |
| `src/hooks/useCalendarEvents.ts` | invitation query fix |
| `src/components/dashboards/PaymentDashboard.tsx` | RTL, mobile |
| `src/pages/AdminDashboard.tsx` | mailbox improvements, RTL |
| `supabase/functions/send-welcome-email/index.ts` | domain-aware sending |
| `supabase/functions/admin-analytics/index.ts` | domain-aware sending, error detail |
| `supabase/functions/send-event-invitation/index.ts` | domain-aware, timezone |
| `supabase/functions/send-contact-form/index.ts` | domain-aware sending |

