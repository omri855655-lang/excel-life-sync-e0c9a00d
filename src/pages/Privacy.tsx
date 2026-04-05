import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const Privacy = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-1 mb-4">
          <ArrowRight className="h-4 w-4" />חזרה
        </Button>
        <h1 className="text-3xl font-bold">מדיניות פרטיות</h1>
        <p className="text-sm text-muted-foreground">עדכון אחרון: {new Date().toLocaleDateString('he-IL')}</p>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. מידע שאנו אוספים</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            בעת ההרשמה אנו אוספים כתובת אימייל, שם תצוגה ופרטים נוספים שתבחר למסור. בנוסף, המערכת שומרת את התוכן שתזין: משימות, פרויקטים, פתקים, אירועים ונתונים נוספים.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. כיצד אנו משתמשים במידע</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            המידע משמש אך ורק לצורך הפעלת המערכת, שיפור חוויית המשתמש, שליחת התראות ותזכורות (על פי בחירתך), ומתן שירותי AI מותאמים. איננו מוכרים או משתפים מידע אישי עם צדדים שלישיים.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. אבטחת מידע</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            אנו משתמשים בפרוטוקולי אבטחה מתקדמים כולל הצפנה, אימות רב-שלבי וגישה מאובטחת לבסיס הנתונים. עם זאת, אין שיטת אבטחה מושלמת ואיננו יכולים להבטיח הגנה מוחלטת.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. שיתוף מידע</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            כאשר תשתף גליונות, פרויקטים או רשימות עם משתמשים אחרים, הם יוכלו לראות את התוכן ששיתפת. אחריות השיתוף היא שלך.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. זכויותיך</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            באפשרותך לעדכן, לערוך או למחוק את המידע שלך בכל עת דרך הגדרות החשבון. כמו כן, תוכל לבקש מחיקת חשבון מלאה.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. עוגיות</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            המערכת משתמשת בעוגיות (cookies) לצורך אימות, שמירת העדפות ושיפור חוויית השימוש. אין שימוש בעוגיות מעקב של צדדים שלישיים.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Privacy;
