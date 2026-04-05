
# תוכנית יישום — השלמת כל השלבים שנותרו

## סיכום מה נותר

מתוך 9 שלבים שאושרו, שלב 1 יושם חלקית (ספרים, סדרות, פודקאסטים). להלן מה שעדיין חסר:

---

## שלב 1 (השלמה) — תצוגות דשבורדים: קניות, תשלומים, תזונה

**ShoppingDashboard.tsx, PaymentDashboard.tsx, NutritionDashboard.tsx** — כרגע יש `DashboardDisplayToolbar` + `useDashboardDisplay` אבל ה-viewMode לא משנה את הרינדור בפועל. צריך להוסיף רינדור מותנה לפי viewMode (table/list/cards/compact/kanban) בדיוק כמו שנעשה בספרים/סדרות/פודקאסטים, באמצעות הקומפוננטות `ListView`, `CardsView`, `CompactView`, `KanbanView`.

---

## שלב 2+3 — דיאלוג משימה מתקדם בפרויקטים

**קובץ חדש: `src/components/projects/ProjectTaskDialog.tsx`**

דיאלוג שנפתח בלחיצה על משימה, כולל:
- שם, תיאור מלא (`description`), הנחיות ביצוע (`instructions`) — כבר קיימים בDB
- סטטוס, דחוף, תאריך יעד, אחראים
- חיווי "נראה" — שמירת `viewed_by` (jsonb) + `started_by_name` בDB (כבר קיימים)
- טאב AI למשימה: שיחה עם AI דרך `task-ai-helper` עם שמירת היסטוריה ב-`project_task_ai_history`
- הערות צוות

**עדכון ProjectsManager.tsx**: לחיצה על שורת משימה פותחת את הדיאלוג במקום סתם toggle.

---

## שלב 4 — אבני דרך AI שמורות

כרגע אבני הדרך הן state זמני (`aiMilestones` — Record client-side). צריך:

1. לשמור אבני דרך ב-`project_milestones` (כבר קיימת בDB)
2. לטעון אותן מה-DB בעת פתיחת פרויקט
3. להוסיף כפתורים: ערוך, מחק, "הוסף כמשימה", "הוסף הכל כמשימות"
4. בהמרה למשימה — לבחור אחראי ולהגדיר ניתוב

**עדכון ProjectsManager.tsx** — להחליף את `aiMilestones` state ב-fetch/save ל-DB.

---

## שלב 5 — בקרת איכות (QA)

בדיקה ותיקון של כל זרימות הפרויקטים כדי לוודא שכל שדה חדש נשמר ונטען נכון.

---

## שלב 6 — התאמה אישית ברורה

עדכון `SettingsPanel.tsx` להפריד בין:
- **מבנה ניווט** (layout mode — כבר קיים)
- **תצוגת תוכן** (view mode per dashboard)
- **ערכת נושא** (theme — כבר קיים)

בעיקר סידור ויזואלי של ההגדרות כך שהמשתמש מבין מה כל דבר עושה.

---

## שלב 7 — נגישות

1. **Skip Link** — קומפוננטה `SkipLink` ב-`App.tsx` עם `id="main-content"` על אזור התוכן
2. **ARIA labels** — הוספת `aria-label` לכפתורים אינטראקטיביים (ניווט, מחיקה, סגירה)
3. **היררכיית כותרות** — וידוא h1 > h2 > h3 תקין
4. **פוקוס מקלדת** — `focus-visible` rings
5. **דף הצהרת נגישות** — `src/pages/Accessibility.tsx` + route

---

## שלב 8 — דפים משפטיים

1. **`src/pages/Terms.tsx`** — תנאי שימוש בעברית (שימוש בפלטפורמה, אחריות, קניין רוחני, AI כהמלצה)
2. **`src/pages/Privacy.tsx`** — מדיניות פרטיות (מידע שנאסף, שימוש, שיתוף, אבטחה)
3. Routes ב-`App.tsx`: `/terms`, `/privacy`, `/accessibility`
4. קישורים ב-`Landing.tsx` ובדף ההרשמה

---

## שלב 9 — עדכון הדרכה

1. **Landing.tsx** — עדכון FEATURES עם תיאורים מדויקים (תצוגות דשבורד, דיאלוג משימה, אבני דרך)
2. **OnboardingWizard.tsx** — הוספת שלב שמסביר על תצוגות דשבורד ונגישות
3. **send-welcome-email** — סנכרון עם הפיצ'רים שבאמת עובדים

---

## פירוט טכני

### קבצים חדשים
- `src/components/projects/ProjectTaskDialog.tsx`
- `src/pages/Terms.tsx`
- `src/pages/Privacy.tsx`
- `src/pages/Accessibility.tsx`
- `src/components/SkipLink.tsx`

### קבצים שיעודכנו
- `src/components/dashboards/ShoppingDashboard.tsx` — view mode rendering
- `src/components/dashboards/PaymentDashboard.tsx` — view mode rendering
- `src/components/dashboards/NutritionDashboard.tsx` — view mode rendering
- `src/components/ProjectsManager.tsx` — task dialog, persistent milestones, viewed_by
- `src/App.tsx` — routes + SkipLink
- `src/pages/Landing.tsx` — footer links + features update
- `src/components/OnboardingWizard.tsx` — new step
- `src/components/SettingsPanel.tsx` — separated sections

### מיגרציות DB
לא נדרשות — כל השדות כבר קיימים (`description`, `instructions`, `viewed_by`, `started_by_name` ב-project_tasks, וטבלת `project_milestones` + `project_task_ai_history`).

### סדר ביצוע
1. השלמת תצוגות דשבורדים (קניות/תשלומים/תזונה)
2. דיאלוג משימה + viewed/started + AI per task
3. אבני דרך שמורות + המרה למשימות
4. SkipLink + ARIA + דף נגישות
5. דפים משפטיים + routes
6. עדכון Landing + Onboarding + Welcome email
