

# תוכנית מקיפה: סל מחזור + דיאלוג פרטים + רוסית + חיבור מייל אישי

## סיכום
יישום 4 פיצ'רים מרכזיים: סל מחזור גלובלי, דיאלוג עריכת פריט, שפה רוסית מלאה, וחיבור מייל אישי (Gmail/Outlook/IMAP) עם ניתוח AI.

---

## שלב 1 — סל מחזור גלובלי

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

## שלב 2 — דיאלוג פרטים מלאים (ItemDetailDialog)

**קובץ חדש:** `src/components/ItemDetailDialog.tsx`
- שם (editable), סטטוס (select), הערות (textarea), subtitle
- כפתור שמירה + מחיקה

**עדכון:** CompactView, ListView, CardsView — onClick פותח דיאלוג

---

## שלב 3 — רוסית (שפה שישית)

- `useLanguage.tsx` — הוספת `"ru"` ל-type Language + תרגום מלא ~120 מפתחות
- `SettingsPanel.tsx` — "Русский" בבחירת שפה
- `OnboardingWizard.tsx` — רוסית ברשימת השפות

---

## שלב 4 — חיבור מייל אישי (Gmail/Outlook/IMAP)

### מבנה טכני

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
- `email-oauth-callback/index.ts` — טיפול ב-OAuth callback מ-Gmail/Outlook
- `email-sync/index.ts` — סנכרון מיילים חדשים (IMAP/Gmail API/Outlook API)
- `email-analyze/index.ts` — שליחת מיילים ל-AI לסיווג + הצעת פעולות

**קבצים חדשים בצד לקוח:**
- `src/components/EmailIntegration.tsx` — דף ראשי: חיבור חשבון + תצוגת תובנות
- `src/components/EmailConnectionDialog.tsx` — חיבור Gmail/Outlook/IMAP
- `src/components/EmailInsightsWidget.tsx` — ווידג'ט לדשבורד ראשי
- `src/hooks/useEmailIntegration.ts` — hook לניהול חיבורים וסנכרון

**זרימת OAuth:**
1. משתמש לוחץ "חבר Gmail" → redirect ל-Google OAuth
2. Google מחזיר code → Edge Function מחליף ל-tokens
3. tokens נשמרים מוצפנים ב-DB
4. סנכרון ראשוני → ניתוח AI → תובנות מוצגות

**יכולות AI:**
- סיווג אוטומטי: תשלומים, משימות, קניות, חשבונות, אישי
- הצעת פעולות: "חשבונית — להוסיף להוצאות?"
- סיכום שבועי: "47 מיילים: 12 תשלומים, 8 משימות..."
- עומק ניתוח לבחירת המשתמש (נושא / נושא+גוף)

**שילוב בממשק:**
- טאב "מייל" בסרגל העליון (ניתן להסתרה)
- ווידג'ט בדשבורד הראשי עם תובנות
- הגדרות חיבור ב-Settings

---

## סיכום קבצים

### מיגרציות (2):
1. `recycle_bin` + RLS
2. `email_connections` + `email_analyses` + RLS

### קבצים חדשים (8):
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

### קבצים מעודכנים (13):
- `useLanguage.tsx` — רוסית מלאה
- `SettingsPanel.tsx` — סל מחזור + רוסית + הגדרות מייל
- `OnboardingWizard.tsx` — רוסית
- `BooksManager.tsx`, `ShowsManager.tsx`, `PodcastsManager.tsx` — softDelete
- `TaskSpreadsheetDb.tsx`, `ProjectsManager.tsx`, `CoursesManager.tsx`, `CustomBoardManager.tsx` — softDelete
- `CompactView.tsx`, `ListView.tsx`, `CardsView.tsx` — ItemDetailDialog
- `Personal.tsx` — טאב מייל

### סודות נדרשים:
- OAuth עבור Gmail/Outlook דורש Client ID ו-Client Secret מ-Google Cloud Console ו-Azure Portal. אבקש מהמשתמש להגדיר אותם לפני יישום שלב 4.

