

# תוכנית מלאה: Salt Edge + Gmail OAuth + תרגום מלא

## סיכום
3 שיפורים משולבים: (1) חיבור בנקים/אשראי עם Salt Edge API, (2) חיבור Gmail אמיתי עם OAuth, (3) תרגום מלא של כל הטקסט ה-hardcoded בעברית ל-6 שפות.

---

## 1. חיבור בנקים ואשראי עם Salt Edge

**Secrets**: `SALT_EDGE_APP_ID`, `SALT_EDGE_SECRET`

**מיגרציה** — טבלת `bank_connections`:
- `user_id`, `salt_edge_connection_id`, `salt_edge_customer_id`, `provider_name`, `status`, `last_sync`
- RLS: user_id = auth.uid()

**Edge Function**: `salt-edge-connect/index.ts`
- Actions: `create_customer` → `create_connect_session` → `list_connections` → `fetch_transactions`
- Salt Edge API v5 headers: `App-id` + `Secret`
- שמירת עסקאות ב-`payment_tracking`

**רכיב חדש**: `BankConnect.tsx` (מחליף CreditCardConnect + CreditCardImport)
- כפתור "חבר בנק/אשראי" → Salt Edge Connect URL בחלון חדש
- רשימת חיבורים + רענון + מחיקה
- עסקאות: ירוק להכנסות, אדום להוצאות

**עדכון**: `PaymentDashboard.tsx` — טאב "אשראי" → "בנק ואשראי"

---

## 2. חיבור Gmail אמיתי עם OAuth

**Secrets**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

**Edge Function חדשה**: `gmail-auth/index.ts`
- `get_auth_url`: מחזיר URL הסכמה של Google
- `exchange_code`: מחליף code ל-tokens, שומר ב-`email_connections`

**עדכון**: `email-sync/index.ts`
- קריאה ל-Gmail API עם access_token
- רענון token אוטומטי
- סיווג AI של מיילים

**עדכון**: `EmailConnectionDialog.tsx`
- Gmail → פתיחת OAuth window (לא טופס ידני)

---

## 3. תרגום מלא של כל ה-hardcoded

**רכיבים שיתעדכנו**:
- `SettingsPanel.tsx`: labels סיסמה, PIN, boards, themes — כל ה-toast messages
- `TelegramSettings.tsx`: כל הטקסט
- `ShoppingDashboard.tsx`: 12 קטגוריות, 10 יחידות, 300+ פריטים
- `PaymentDashboard.tsx`: 23 קטגוריות, 4 מדריכים פיננסיים
- `NutritionDashboard.tsx`: labels תזונה/שינה
- `EmailConnectionDialog.tsx`: fallbacks
- `BooksManager.tsx`, `ShowsManager.tsx`, `PodcastsManager.tsx`: סטטוסים

**`useLanguage.tsx`**: הוספת ~120 מפתחות × 6 שפות

---

## סיכום קבצים

| פעולה | קבצים |
|-------|--------|
| Secrets | `SALT_EDGE_APP_ID`, `SALT_EDGE_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| מיגרציה | `bank_connections` + RLS |
| Edge Functions חדשות | `salt-edge-connect`, `gmail-auth` |
| Edge Functions מעודכנות | `email-sync` |
| רכיב חדש | `BankConnect.tsx` |
| מחיקה | `CreditCardConnect.tsx`, `CreditCardImport.tsx` |
| תרגום | `useLanguage.tsx` + ~10 רכיבים |

