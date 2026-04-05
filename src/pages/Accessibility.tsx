import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const Accessibility = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-1 mb-4">
          <ArrowRight className="h-4 w-4" />חזרה
        </Button>
        <h1 className="text-3xl font-bold">הצהרת נגישות</h1>
        <p className="text-sm text-muted-foreground">עדכון אחרון: {new Date().toLocaleDateString('he-IL')}</p>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">מחויבות לנגישות</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            אנו מחויבים להנגיש את מערכת Tabro לכלל האוכלוסייה, כולל אנשים עם מוגבלויות, בהתאם לתקן הישראלי (ת"י 5568) ולהנחיות WCAG 2.1 ברמה AA.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">מה עשינו</h2>
          <ul className="list-disc list-inside text-sm leading-relaxed text-muted-foreground space-y-1">
            <li>תמיכה מלאה בניווט מקלדת</li>
            <li>תמיכה ב-RTL (ימין לשמאל) לעברית</li>
            <li>היררכיית כותרות תקינה (H1-H6)</li>
            <li>תוויות ARIA באלמנטים אינטראקטיביים</li>
            <li>ניגודיות צבעים מספקת</li>
            <li>כפתור "דלג לתוכן" (Skip Link) לניווט מהיר</li>
            <li>מצב כהה ובהיר לנוחות צפייה</li>
            <li>טפסים עם תוויות ברורות והודעות שגיאה</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">מגבלות ידועות</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            ייתכנו רכיבים מסוימים שעדיין אינם מונגשים באופן מלא. אנו עובדים באופן שוטף על שיפור הנגישות.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">יצירת קשר</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            נתקלת בבעיית נגישות? נשמח לשמוע ממך. ניתן לפנות דרך טופס יצירת הקשר באתר.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Accessibility;
