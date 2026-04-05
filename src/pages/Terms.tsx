import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const Terms = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-1 mb-4">
          <ArrowRight className="h-4 w-4" />חזרה
        </Button>
        <h1 className="text-3xl font-bold">תנאי שימוש</h1>
        <p className="text-sm text-muted-foreground">עדכון אחרון: {new Date().toLocaleDateString('he-IL')}</p>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. כללי</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            ברוכים הבאים ל-Tabro ("המערכת"). השימוש במערכת מהווה הסכמה לתנאים אלה. אם אינך מסכים לתנאים, אנא הימנע משימוש במערכת.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. שימוש במערכת</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            המערכת מיועדת לניהול משימות, פרויקטים, לוח זמנים ותוכן אישי. המשתמש אחראי על התוכן שהוא מזין למערכת. אין להשתמש במערכת למטרות בלתי חוקיות או לפגיעה בצדדים שלישיים.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. קניין רוחני</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            כל הזכויות על המערכת, הקוד, העיצוב והתוכן המערכתי שמורות. אין להעתיק, לשכפל, להפיץ או לעשות שימוש מסחרי בכל חלק מהמערכת ללא אישור מפורש בכתב.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. שימוש ב-AI</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            המערכת כוללת תכונות AI (בינה מלאכותית). תוצאות ה-AI הן המלצות בלבד ואינן מהוות ייעוץ מקצועי — לא פיננסי, לא רפואי ולא משפטי. השימוש בהמלצות הוא באחריות המשתמש בלבד.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. שיתוף ושיתוף פעולה</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            המערכת מאפשרת שיתוף גליונות ופרויקטים עם משתמשים אחרים. המשתמש אחראי על ניהול ההרשאות ועל התוכן שהוא משתף. המערכת אינה אחראית לשימוש שיעשו צדדים שלישיים בתוכן משותף.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. הגבלת אחריות</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            המערכת מסופקת "כמות שהיא" (AS IS). אנו עושים מאמץ לשמור על זמינות ואבטחה, אך אין אחריות על אובדן נתונים, השבתות או טעויות. מומלץ לגבות נתונים חשובים באופן עצמאי.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">7. שינויים בתנאים</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            אנו שומרים את הזכות לעדכן תנאים אלו מעת לעת. שימוש מתמשך במערכת מהווה הסכמה לתנאים המעודכנים.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Terms;
