

# Comprehensive Fix Pass — All Outstanding Issues

## Issues Found After Full Code Audit

### A. Contact Form: Edge Function Fails (500)
**Root cause**: The `from` address is `Tabro <info@tabro.org>` but the email domain `tabro.org` has status `initiated` (not verified). Resend rejects all sends.
**Fix**: Change `from` to `Tabro <onboarding@resend.dev>` (Resend's shared test domain) until `tabro.org` is verified. Also return 200 with `{ok: false}` instead of 500 to let the frontend read the error body.

### B. PaymentDashboard: Tabs Bar at Bottom
**Issue**: The tab bar (Income/Expenses, History, Add, Guides, AI, Bank) at line 640 is rendered AFTER hero card, budget card, 50/30/20 rule, category breakdown, and charts. User wants it at the TOP right after the header.
**Fix**: Move the `<Tabs>` component to wrap the entire content area so the tab bar appears immediately after the header. Move hero/budget/breakdown/charts inside the "overview" tab.

### C. PaymentDashboard: DashboardDisplayToolbar Broken
**Issue**: The view mode/theme toolbar on PaymentDashboard doesn't affect the layout (it's wired up but has no visual effect on the transaction list). User says "remove the option since it doesn't work."
**Fix**: Remove the `DashboardDisplayToolbar` from PaymentDashboard header. Keep it only in dashboards where it works.

### D. PaymentDashboard: Budget Remaining on Main Screen
**Issue**: User wants "how much left to spend" visible on the main hero card alongside "available to save." Also wants fixed expenses (rent, insurance, etc.) to be categorized separately from weekly/monthly spending.
**Fix**: Add "remaining budget" line to hero card when budgetTarget > 0. Already shows "Available to save" — add budget remaining next to it.

### E. DashboardDisplayToolbar: Hardcoded Hebrew
**Issue**: Labels "טבלה", "קנבן", "רשימה", "כרטיסים", "קומפקט", "עיצוב", "בחר עיצוב" are all hardcoded Hebrew.
**Fix**: Pass `t()` function or use `useLanguage()` inside the component.

### F. Translations: Still Many Hardcoded Hebrew Strings
Found in:
- `DashboardDisplayToolbar.tsx` lines 15-19, 36, 39
- `DeeplyDashboard.tsx` — tooltips ("הסר סרטון", "הסתר סרטון", "פתח ב-YouTube", "קישור YouTube...")
- Various inline strings across components

### G. Design System: Applied but Minimal
The `card-surface` class exists and is used in Dashboard.tsx. The brand colors are in tailwind config. Font imports are in index.html. The design tokens ARE applied but the user wants more visible design changes from the uploaded DESIGN files (glassmorphism effects on hero sections, gradient backgrounds, more prominent use of Indigo/Amber).
**Fix**: Enhance the hero card in PaymentDashboard with glassmorphism (backdrop-blur, semi-transparent bg). Apply Indigo gradient to Dashboard date card. Use Amber for CTA buttons.

### H. Admin Company Mailbox
**Issue**: Not yet implemented. User wants a company inbox in AdminDashboard where they can view email logs, filter, and compose emails.
**Fix**: Add a "Company Mailbox" tab in AdminDashboard with email log table (already fetched), search/filter, and compose form. The compose form calls the admin-analytics edge function with a `send_email` action.

---

## Implementation Plan (8 changes)

### 1. Fix Contact Form Edge Function
**File**: `supabase/functions/send-contact-form/index.ts`
- Change `from: 'Tabro <info@tabro.org>'` to `from: 'Tabro <onboarding@resend.dev>'`
- Change error responses from status 500 to status 200 with `{ok: false, error: "..."}` so frontend can read the error
- Deploy and test

### 2. PaymentDashboard: Move Tabs to Top, Remove Broken Toolbar
**File**: `src/components/dashboards/PaymentDashboard.tsx`
- Remove `DashboardDisplayToolbar` from the header
- Restructure: move the `<Tabs>` component to wrap immediately after the header
- Move hero card, budget target, 50/30/20 rule, category breakdown, and charts INTO the "overview" tab content
- Add budget remaining to hero card when budgetTarget > 0:
  `{isRtl ? "תקציב נותר" : "Budget remaining"}: ₪{(budgetTarget - totalSpending).toLocaleString()}`

### 3. Translate DashboardDisplayToolbar
**File**: `src/components/DashboardDisplayToolbar.tsx`
- Import `useLanguage` and replace hardcoded Hebrew labels with `t()` calls
- Add translation keys: `viewTable`, `viewKanban`, `viewList`, `viewCards`, `viewCompact`, `design`, `chooseDesign`

### 4. Translate Remaining Hebrew Strings
**File**: `src/hooks/useLanguage.tsx`
- Add keys: `viewTable`, `viewKanban`, `viewList`, `viewCards`, `viewCompact`, `design`, `chooseDesign`
- Add: `hideVideo`, `removeVideo`, `openOnYoutube`, `youtubeLink`
**File**: `src/components/deeply/DeeplyDashboard.tsx`
- Replace tooltip strings with `t()` calls

### 5. Enhance Design System Application
**Files**: `src/components/dashboards/PaymentDashboard.tsx`, `src/pages/Landing.tsx`
- PaymentDashboard hero card: Add `backdrop-blur-xl bg-white/80 dark:bg-slate-900/80` for glassmorphism
- Landing hero: Apply Indigo-to-purple gradient background
- Dashboard stat cards: Already have `card-surface border-l-[3px] border-l-brand-primary` — keep

### 6. Admin Company Mailbox
**File**: `src/pages/AdminDashboard.tsx`
- Add a "Company Mailbox" card section with:
  - Table showing `recentEmailLog` data (already fetched from admin-analytics)
  - Search input to filter by recipient or template
  - Status filter dropdown (All / Sent / Failed)
  - Compose email form (to, subject, body) that calls admin-analytics edge function

**File**: `supabase/functions/admin-analytics/index.ts`
- Add `send_email` action that uses Resend to send an email from `onboarding@resend.dev`
- Log the send to `email_send_log`

### 7. PaymentDashboard: Fixed Expenses Separation
Already implemented — line 756-780 shows "Fixed expenses" section with `recurringExpenseEntries`. The user wants clarity that rent/insurance are in this section. No code change needed, just ensure the `recurring` flag is being set properly from the add form (already done at line 872).

### 8. Deploy and Test Edge Functions
- Deploy `send-contact-form` and `admin-analytics`
- Test contact form submission
- Verify emails send successfully

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/send-contact-form/index.ts` | Fix `from` address to use resend.dev, return 200 for errors |
| `src/components/dashboards/PaymentDashboard.tsx` | Move tabs to top, remove DashboardDisplayToolbar, add budget remaining to hero, glassmorphism |
| `src/components/DashboardDisplayToolbar.tsx` | Translate all hardcoded Hebrew |
| `src/hooks/useLanguage.tsx` | Add ~10 missing translation keys |
| `src/components/deeply/DeeplyDashboard.tsx` | Translate tooltip strings |
| `src/pages/AdminDashboard.tsx` | Add company mailbox card with compose form |
| `supabase/functions/admin-analytics/index.ts` | Add send_email action |

No database schema changes needed.

