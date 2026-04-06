
# תוכנית מקיפה: 5 שיפורים מרכזיים

---

## שיפור 1 — סל מחזור גלובלי

**מיגרציה:**
```text
recycle_bin table:
  id, user_id, source_table, source_id,
  item_data (jsonb), deleted_at, expires_at (7 days)
  + RLS policy for authenticated users
```

**קבצים חדשים:**
- `src/hooks/useRecycleBin.ts` — softDelete, restore, fetchAll, cleanupExpired
- `src/components/RecycleBin.tsx` — תצוגה לפי מקור, שחזור, מחיקה לצמיתות

**קבצים מעודכנים (מחיקה רכה):**
- `BooksManager.tsx`, `ShowsManager.tsx`, `PodcastsManager.tsx`
- `TaskSpreadsheetDb.tsx`, `ProjectsManager.tsx`, `CoursesManager.tsx`
- `CustomBoardManager.tsx`
- `SettingsPanel.tsx` — טאב סל מחזור

---

## שיפור 2 — דיאלוג פרטים מלאים (ItemDetailDialog)

**קובץ חדש:** `src/components/ItemDetailDialog.tsx`
- שם (editable), סטטוס (select), הערות (textarea), subtitle
- כפתור שמירה + מחיקה
- תמיכה מלאה בכל השפות (כפתורים, labels, placeholders)

**עדכון:** CompactView, ListView, CardsView — onClick פותח דיאלוג

---

## שיפור 3 — לוקליזציה מלאה ל-6 שפות

**המטרה:** כל שפה מקבלת ממשק מלא ומושלם כמו העברית — אף מפתח לא חסר.

**שפות:** עברית (he), אנגלית (en), ספרדית (es), סינית (zh), ערבית (ar), רוסית (ru — חדשה)

**מה ייעשה:**
- `useLanguage.tsx` — סריקה מלאה של כל ~120+ מפתחות תרגום, השלמת חסרים בכל שפה
- הוספת `"ru"` ל-type Language + תרגום מלא לרוסית
- וידוא שכל מפתח חדש (סל מחזור, דיאלוג פרטים, מייל, תצוגות) מתורגם לכל 6 השפות
- `SettingsPanel.tsx` — "Русский" בבחירת שפה
- `OnboardingWizard.tsx` — רוסית ברשימת השפות
- בדיקת RTL/LTR: עברית וערבית RTL, שאר LTR

---

## שיפור 4 — חיבור מייל אישי (Gmail/Outlook/IMAP)

**מיגרציות DB:**
```text
email_connections table:
  id, user_id, provider (gmail/outlook/imap),
  access_token (encrypted), refresh_token (encrypted),
  email_address, settings (jsonb), connected_at, last_sync

email_analyses table:
  id, user_id, connection_id, email_subject, email_from,
  email_date, category (payment/task/shopping/bill/personal),
  suggested_action (jsonb), analysis_depth,
  is_processed, created_at
```

**Edge Functions חדשות:**
- `email-oauth-callback/index.ts` — OAuth callback מ-Gmail/Outlook
- `email-sync/index.ts` — סנכרון מיילים (IMAP/Gmail API/Outlook API)
- `email-analyze/index.ts` — ניתוח AI לסיווג + הצעות פעולה

**קבצים חדשים בצד לקוח:**
- `src/components/EmailIntegration.tsx` — דף ראשי
- `src/components/EmailConnectionDialog.tsx` — חיבור חשבון
- `src/components/EmailInsightsWidget.tsx` — ווידג'ט דשבורד
- `src/hooks/useEmailIntegration.ts` — hook לניהול

**יכולות AI:** סיווג אוטומטי, הצעת פעולות, סיכום שבועי, עומק ניתוח לבחירה

**שילוב:** טאב "מייל", ווידג'ט בדשבורד, הגדרות ב-Settings — הכל מתורגם ל-6 שפות

---

## שיפור 5 — תצוגות עובדות בכל הדשבורדים

**הבעיה:** סרגל "עיצוב" קיים אבל תמיד מוצגת טבלה בלבד — viewMode לא משפיע.

**מה ייעשה:**
- `TaskSpreadsheetDb.tsx` — רינדור מותנה לפי dashViewMode (טבלה / רשימה / כרטיסים / קנבן / קומפקט)
- `ShoppingDashboard.tsx` — רינדור מותנה לפי viewMode
- `PaymentDashboard.tsx` — רינדור מותנה לפי viewMode
- `NutritionDashboard.tsx` — רינדור מותנה לפי viewMode
- כל תצוגה תומכת בעריכה: שם, הערות, סטטוס — לא רק בטבלה
- סטטוסים לקנבן: טרם החל / בטיפול / בוצע (מותאם לכל דשבורד)
- הכל מתורגם ל-6 שפות

---

## סיכום קבצים

### מיגרציות (2):
1. `recycle_bin` + RLS
2. `email_connections` + `email_analyses` + RLS

### קבצים חדשים (~11):
- `src/hooks/useRecycleBin.ts`
- `src/components/RecycleBin.tsx`
- `src/components/ItemDetailDialog.tsx`
- `src/components/EmailIntegration.tsx`
- `src/components/EmailConnectionDialog.tsx`
- `src/components/EmailInsightsWidget.tsx`
- `src/hooks/useEmailIntegration.ts`
- `supabase/functions/email-oauth-callback/index.ts`
- `supabase/functions/email-sync/index.ts`
- `supabase/functions/email-analyze/index.ts`

### קבצים מעודכנים (~17):
- `useLanguage.tsx` — לוקליזציה מלאה ל-6 שפות (כל מפתח, כולל חדשים)
- `SettingsPanel.tsx` — סל מחזור + רוסית + הגדרות מייל
- `OnboardingWizard.tsx` — רוסית
- `BooksManager.tsx`, `ShowsManager.tsx`, `PodcastsManager.tsx` — softDelete
- `TaskSpreadsheetDb.tsx` — softDelete + תצוגות עובדות
- `ProjectsManager.tsx`, `CoursesManager.tsx`, `CustomBoardManager.tsx` — softDelete
- `CompactView.tsx`, `ListView.tsx`, `CardsView.tsx` — ItemDetailDialog
- `ShoppingDashboard.tsx`, `PaymentDashboard.tsx`, `NutritionDashboard.tsx` — תצוגות עובדות
- `Personal.tsx` — טאב מייל

### סודות נדרשים:
- OAuth עבור Gmail: Client ID + Client Secret (מ-Google Cloud Console)
- OAuth עבור Outlook: Client ID + Client Secret (מ-Azure Portal)
- ייבקשו מהמשתמש לפני יישום שלב 4
