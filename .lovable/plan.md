
# תוכנית מלאה: Salt Edge + Gmail OAuth + תרגום מלא

## חלק 1: חיבור בנקים ואשראי עם Salt Edge

### Secrets נדרשים
- `SALT_EDGE_APP_ID` — מ-Salt Edge dashboard
- `SALT_EDGE_SECRET` — מ-Salt Edge dashboard

### מיגרציה — טבלת `bank_connections`
- `id`, `user_id`, `salt_edge_connection_id`, `salt_edge_customer_id`, `provider_name`, `status`, `last_sync`, `created_at`
- RLS: רק המשתמש רואה את שלו

### Edge Function חדשה: `salt-edge-connect/index.ts`
- Actions: `create_customer`, `create_connect_session`, `list_connections`, `fetch_transactions`
- Headers: `App-id` + `Secret` מ-secrets
- Salt Edge API v5 (`https://www.saltedge.com/api/v5/`)
- שמירת עסקאות ב-`payment_tracking`

### רכיב חדש: `BankConnect.tsx` (מחליף CreditCardConnect + CreditCardImport)
- כפתור "חבר בנק/אשראי" → פותח Salt Edge Connect URL
- רשימת חיבורים + סטטוס + כפתור רענון
- תצוגת עסקאות: ירוק להכנסות, אדום להוצאות

### עדכון: `PaymentDashboard.tsx`
- טאב "אשראי" → "בנק ואשראי" עם `BankConnect`
- מחיקת imports ישנים

---

## חלק 2: חיבור Gmail אמיתי עם OAuth

### Secrets נדרשים
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

### Edge Function חדשה: `gmail-auth/index.ts`
- Action `get_auth_url`: יוצר URL הסכמה של Google OAuth 2.0
- Action `exchange_code`: מחליף authorization code ל-tokens
- שומר `access_token` + `refresh_token` ב-`email_connections`

### עדכון: `email-sync/index.ts`
- קריאה אמיתית ל-Gmail API עם access_token
- רענון token אוטומטי עם refresh_token
- שליפת headers של מיילים + סיווג AI (Gemini)

### עדכון: `EmailConnectionDialog.tsx`
- לחיצה על Gmail → פתיחת חלון OAuth (לא טופס ידני)
- callback שומר את החיבור

---

## חלק 3: תרגום מלא — כל ה-hardcoded בעברית

### `SettingsPanel.tsx` (618 שורות)
- שורה 29: "סיסמה חייבת להכיל..." → `t("passwordMinLength")`
- שורה 30: "הסיסמאות לא תואמות" → `t("passwordsMismatch")`
- שורה 34/36: הודעות שגיאה/הצלחה
- שורה 42-49: labels של סיסמה
- שורה 72: "לביצוע,בתהליך,הושלם" → translated defaults
- שורה 117-119: הודעות PIN
- כל labels בהמשך הקובץ (theme, layout, language, boards)

### `TelegramSettings.tsx` (207 שורות)
- כל הטקסט: "בוט טלגרם", "מחובר", "שלבים לחיבור", הודעות toast

### `ShoppingDashboard.tsx` (895 שורות)
- שורה 36: `SUPERMARKET_CATEGORIES` — 12 קטגוריות
- שורה 38: `QUANTITY_UNITS` — 10 יחידות
- שורה 40-200+: `CATEGORY_ITEMS` — 300+ פריטים (ירקות, חלב, בשר...)
- כל labels וכפתורים בהמשך

### `PaymentDashboard.tsx` (714 שורות)
- שורה 44: `CATEGORIES` — 23 קטגוריות
- שורות 46-80: `FINANCIAL_GUIDES` — 4 מדריכים עם כותרות ותוכן
- כל labels, כפתורים, הודעות

### `NutritionDashboard.tsx` (267 שורות)
- כל labels: "תזונה", "שינה", "פרופיל בריאות", שמות שדות

### `EmailConnectionDialog.tsx`
- fallback עברי → `t()` keys

### `BooksManager.tsx`, `ShowsManager.tsx`, `PodcastsManager.tsx`
- סטטוסים hardcoded ("לקרוא", "קורא", "סיימתי")

### `useLanguage.tsx`
- הוספת ~120 מפתחות חדשים × 6 שפות (he, en, es, zh, ar, ru)
- כולל: קטגוריות תשלום, קטגוריות קניות, יחידות כמות, סטטוסים, הודעות מערכת, מדריכים פיננסיים

---

## סיכום קבצים

| פעולה | קבצים |
|-------|--------|
| Secrets חדשים | `SALT_EDGE_APP_ID`, `SALT_EDGE_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| מיגרציה | `bank_connections` table + RLS |
| Edge Functions חדשות | `salt-edge-connect`, `gmail-auth` |
| Edge Functions מעודכנות | `email-sync` |
| רכיב חדש | `BankConnect.tsx` |
| מחיקה | `CreditCardConnect.tsx`, `CreditCardImport.tsx` |
| תרגום | `useLanguage.tsx` (~120 keys × 6), `SettingsPanel.tsx`, `TelegramSettings.tsx`, `ShoppingDashboard.tsx`, `PaymentDashboard.tsx`, `NutritionDashboard.tsx`, `EmailConnectionDialog.tsx`, `BooksManager.tsx`, `ShowsManager.tsx`, `PodcastsManager.tsx` |
