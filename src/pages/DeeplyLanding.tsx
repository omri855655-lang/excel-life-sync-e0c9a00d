import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Star, Headphones, Timer, LayoutGrid, Map, Check, Shield, ArrowLeft, Globe } from "lucide-react";

type Lang = "he" | "en";

const t = (he: string, en: string, lang: Lang) => lang === "he" ? he : en;

const DeeplyLanding = () => {
  const navigate = useNavigate();
  const [lang, setLang] = useState<Lang>("he");
  const dir = lang === "he" ? "rtl" : "ltr";

  const scrollToPricing = () => {
    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8ed]" dir={dir}>
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">Deeply</span>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setLang(lang === "he" ? "en" : "he")} className="text-[#e8e8ed]/60 hover:text-[#e8e8ed]">
              <Globe className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/personal")} className="text-[#e8e8ed]/60 hover:text-[#e8e8ed] gap-1">
              <ArrowLeft className="h-4 w-4" />
              {t("חזרה", "Back", lang)}
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-1 mb-6 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm">
            {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}
            <span className="mr-2 ml-2">5.0</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold leading-tight mb-6">
            {t("להספיק בשעתיים", "Accomplish in 2 hours", lang)}{" "}
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              {t("מה שפעם לקח יום", "what used to take a day", lang)}
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-[#e8e8ed]/60 max-w-2xl mx-auto mb-10">
            {t(
              "סיסטם שמכניס אותך לפוקוס תוך פחות מ-60 שניות. בלי טריקים, בלי אפליקציות מיותרות.",
              "A system that gets you into focus in under 60 seconds. No tricks, no unnecessary apps.",
              lang
            )}
          </p>
          <Button onClick={scrollToPricing} className="bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 text-white px-8 py-6 text-lg rounded-full shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40">
            {t("תראה לי איך זה עובד", "Show me how it works", lang)}
          </Button>
        </div>
      </section>

      {/* Problem */}
      <section className="py-20 px-6 bg-[#0d0d14]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">
            {t("הבעיה שאף אחד לא מדבר עליה", "The problem nobody talks about", lang)}
          </h2>
          <div className="bg-white/5 rounded-2xl p-8 border border-white/5">
            <p className="text-[#e8e8ed]/70 text-lg leading-relaxed mb-6">
              {t(
                "אתה יושב לעבוד. פותח את הלפטופ. ואז — הודעה בוואטסאפ, סטורי באינסטגרם, תגובה בפייסבוק. עוברות 3 שעות ולא עשית כלום. זה לא חוסר מוטיבציה. זה לא עצלנות.",
                "You sit down to work. Open your laptop. Then — a WhatsApp message, an Instagram story, a Facebook comment. 3 hours pass and you've done nothing. It's not a lack of motivation. It's not laziness.",
                lang
              )}
            </p>
            <p className="text-xl font-semibold text-violet-300">
              {t(
                "הבעיה היא לא אצלך. הבעיה היא שאין לך סיסטם שמגן על הקשב שלך.",
                "The problem isn't you. The problem is you don't have a system that protects your attention.",
                lang
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-4 text-center">
            {t("הפתרון: המעטפת של Deeply", "The Solution: The Deeply Envelope", lang)}
          </h2>
          <p className="text-[#e8e8ed]/50 text-center mb-12 max-w-2xl mx-auto">
            {t("ארבעה רכיבים שעוטפים אותך בפוקוס מוחלט", "Four components that wrap you in absolute focus", lang)}
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { icon: Headphones, title: t("הסאונד", "The Sound", lang), desc: t("נגן תדרים פסיכו-אקוסטיים שמכוון את המוח שלך לעבודה. לא פלייליסטים — תדרים מדעיים.", "Psycho-acoustic frequency player that tunes your brain for work. Not playlists — scientific frequencies.", lang), color: "from-violet-500 to-violet-700" },
              { icon: Timer, title: t("הקצב", "The Rhythm", lang), desc: t("טיימרים ייעודיים — Pomodoro לסשנים קצרים, Sprints לעבודה עמוקה. הקצב שלך, השליטה שלך.", "Dedicated timers — Pomodoro for short sessions, Sprints for deep work. Your rhythm, your control.", lang), color: "from-cyan-500 to-cyan-700" },
              { icon: LayoutGrid, title: t("הסדר", "The Order", lang), desc: t("דשבורד שמפריד בין עבודה עמוקה לעבודה רדודה. תדע בדיוק מה לעשות ומתי.", "Dashboard that separates deep work from shallow work. Know exactly what to do and when.", lang), color: "from-emerald-500 to-emerald-700" },
              { icon: Map, title: t("השיטה", "The Method", lang), desc: t("Roadmap של 4 שלבים שלוקח אותך מרעש מוחלט לפוקוס מלא. צעד אחרי צעד.", "A 4-step roadmap from total noise to full focus. Step by step.", lang), color: "from-amber-500 to-amber-700" },
            ].map((item, i) => (
              <Card key={i} className="bg-white/5 border-white/5 hover:border-white/10 transition-all group">
                <CardContent className="p-8">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                    <item.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-[#e8e8ed]">{item.title}</h3>
                  <p className="text-[#e8e8ed]/60">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="py-20 px-6 bg-[#0d0d14]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">{t("הדרך לפוקוס — 4 שלבים", "The Path to Focus — 4 Steps", lang)}</h2>
          <div className="space-y-8">
            {[
              {
                step: 1, title: t("ניקוי רעשים", "Noise Clearing", lang), goal: t("לסלק את כל מה שגונב לך קשב", "Eliminate everything stealing your attention", lang), time: t("15 דקות", "15 min", lang),
                items: lang === "he" ? ["כבה את כל ההתראות בטלפון", "סגור טאבים מיותרים", "הפעל מצב 'נא לא להפריע'", "נקה את שולחן העבודה"] : ["Turn off all phone notifications", "Close unnecessary tabs", "Enable 'Do Not Disturb' mode", "Clear your workspace"]
              },
              {
                step: 2, title: t("סידור המוח", "Mind Organization", lang), goal: t("לארגן את כל מה שצריך לעשות במקום אחד", "Organize everything you need to do in one place", lang), time: t("10 דקות", "10 min", lang),
                items: lang === "he" ? ["רשום את כל המשימות", "הפרד בין עבודה עמוקה לרדודה", "תעדף לפי דחיפות וחשיבות", "הגדר 3 משימות ליום", "בחר משימה אחת להתחלה"] : ["Write down all tasks", "Separate deep from shallow work", "Prioritize by urgency and importance", "Define 3 daily tasks", "Choose one task to start"]
              },
              {
                step: 3, title: t("טריגר פוקוס", "Focus Trigger", lang), goal: t("להיכנס לזרימה תוך 60 שניות", "Enter flow state within 60 seconds", lang), time: t("1 דקה", "1 min", lang),
                items: lang === "he" ? ["הפעל את התדרים המתאימים", "הגדר טיימר (25 או 50 דקות)", "לחץ Start — ותתחיל"] : ["Activate the right frequencies", "Set timer (25 or 50 min)", "Press Start — and begin"]
              },
              {
                step: 4, title: t("שימור אנרגיה", "Energy Preservation", lang), goal: t("לסיים את היום עם אנרגיה ולא שחוק", "End the day with energy, not burned out", lang), time: t("5 דקות בין סשנים", "5 min between sessions", lang),
                items: lang === "he" ? ["הפסקה אמיתית בין סשנים", "עקוב אחרי כמה סשנים עשית", "אל תעבור את 4 סשנים רצופים", "סיכום יומי — מה הספקת?"] : ["Real break between sessions", "Track how many sessions you did", "Don't exceed 4 consecutive sessions", "Daily summary — what did you accomplish?"]
              },
            ].map((s) => (
              <div key={s.step} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
                  {s.step}
                </div>
                <div className="flex-1 bg-white/5 rounded-2xl p-6 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold">{s.title}</h3>
                    <span className="text-sm text-violet-300 bg-violet-500/10 px-3 py-1 rounded-full">{s.time}</span>
                  </div>
                  <p className="text-[#e8e8ed]/60 mb-4">{s.goal}</p>
                  <ul className="space-y-2">
                    {s.items.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-[#e8e8ed]/70">
                        <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who is it for */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">{t("למי זה מתאים?", "Who is it for?", lang)}</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { emoji: "🚀", title: t("עצמאיים ויזמים", "Freelancers & Entrepreneurs", lang), desc: t("שרוצים להספיק יותר בפחות שעות", "Who want to accomplish more in fewer hours", lang) },
              { emoji: "📚", title: t("סטודנטים", "Students", lang), desc: t("שצריכים לסיים עבודות בלי הסחות", "Who need to finish assignments without distractions", lang) },
              { emoji: "🧠", title: t("אנשים עם ADHD", "People with ADHD", lang), desc: t("שמחפשים מבנה שעוזר להם להתמקד", "Looking for structure that helps them focus", lang) },
            ].map((p, i) => (
              <Card key={i} className="bg-white/5 border-white/5 text-center">
                <CardContent className="p-8">
                  <div className="text-4xl mb-4">{p.emoji}</div>
                  <h3 className="text-lg font-bold mb-2 text-[#e8e8ed]">{p.title}</h3>
                  <p className="text-[#e8e8ed]/60 text-sm">{p.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-20 px-6 bg-[#0d0d14]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">{t("מה משתמשים חושבים", "What users think", lang)}</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { name: t("יואב מ.", "Yoav M.", lang), role: t("יזם", "Entrepreneur", lang), text: t("עברתי מ-4 שעות מולטיטסקינג לשעתיים של פוקוס אמיתי. שינוי מטורף.", "Went from 4 hours of multitasking to 2 hours of real focus. Insane change.", lang) },
              { name: t("שירה כ.", "Shira K.", lang), role: t("סטודנטית", "Student", lang), text: t("התדרים ממש עובדים. אני נכנסת לזרימה תוך דקה. ממש לא מגזימה.", "The frequencies really work. I enter flow within a minute. I'm not exaggerating.", lang) },
              { name: t("דניאל ל.", "Daniel L.", lang), role: t("מפתח עם ADHD", "Developer with ADHD", lang), text: t("הסיסטם הזה עוזר לי יותר מכל אפליקציית פרודוקטיביות שניסיתי.", "This system helps me more than any productivity app I've tried.", lang) },
            ].map((r, i) => (
              <Card key={i} className="bg-white/5 border-white/5">
                <CardContent className="p-6">
                  <div className="flex gap-0.5 mb-4">{[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />)}</div>
                  <p className="text-[#e8e8ed]/70 mb-4 text-sm leading-relaxed">"{r.text}"</p>
                  <div>
                    <p className="font-semibold text-[#e8e8ed]">{r.name}</p>
                    <p className="text-xs text-[#e8e8ed]/40">{r.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-lg mx-auto">
          <h2 className="text-3xl font-bold mb-4 text-center">{t("גישה לכל החיים", "Lifetime Access", lang)}</h2>
          <p className="text-[#e8e8ed]/50 text-center mb-10">{t("תשלום חד-פעמי. בלי מנויים. בלי הפתעות.", "One-time payment. No subscriptions. No surprises.", lang)}</p>
          <Card className="bg-gradient-to-b from-violet-500/10 to-cyan-500/5 border-violet-500/20">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <span className="text-[#e8e8ed]/40 line-through text-2xl">₪397</span>
                <div className="text-5xl font-bold mt-1">
                  <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">₪147</span>
                </div>
                <p className="text-sm text-emerald-400 mt-2">{t("חיסכון של 63%", "Save 63%", lang)}</p>
              </div>
              <ul className="space-y-3 mb-8">
                {(lang === "he" ? [
                  "גישה לאפליקציית סאונד ותדרים",
                  "טיימרים לספרינטים ועבודה עמוקה",
                  "תבנית Notion מוכנה + מדריך שימוש",
                  "ה-Roadmap המלא (4 שלבים)",
                  "עדכונים עתידיים — בחינם"
                ] : [
                  "Sound & frequency app access",
                  "Sprint & deep work timers",
                  "Ready Notion template + usage guide",
                  "The full Roadmap (4 steps)",
                  "Future updates — free"
                ]).map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-[#e8e8ed]/80">
                    <Check className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder={t("הכנס את המייל שלך", "Enter your email", lang)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[#e8e8ed] placeholder:text-[#e8e8ed]/30 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
                <Button className="w-full bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 text-white py-6 text-lg rounded-xl shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40">
                  {t("אני מוכן להתחיל — תנו לי גישה", "I'm ready to start — give me access", lang)}
                </Button>
              </div>
              <div className="flex items-center justify-center gap-2 mt-4 text-sm text-[#e8e8ed]/40">
                <Shield className="h-4 w-4" />
                {t("אחריות 7 ימים — בלי שאלות", "7-day guarantee — no questions asked", lang)}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 bg-[#0d0d14]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">{t("שאלות נפוצות", "FAQ", lang)}</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {[
              { q: t("אני כבר מקשיב למוזיקה בזמן עבודה, מה ההבדל?", "I already listen to music while working, what's different?", lang), a: t("מוזיקה רגילה מפעילה את המוח הרגשי. התדרים שלנו (Binaural Beats) מכוונים את גלי המוח ישירות למצב פוקוס — בלי מילים, בלי הסחות.", "Regular music activates the emotional brain. Our frequencies (Binaural Beats) tune brainwaves directly to focus state — no words, no distractions.", lang) },
              { q: t("אני דחיין כרוני, זה יעזור לי?", "I'm a chronic procrastinator, will this help?", lang), a: t("בהחלט. השיטה בנויה כדי להוריד את חסם ההתחלה ל-60 שניות. הטיימרים יוצרים דחיפות, התדרים מורידים התנגדות.", "Absolutely. The method is designed to lower the starting barrier to 60 seconds. Timers create urgency, frequencies lower resistance.", lang) },
              { q: t("מה זה בדיוק תדרים?", "What exactly are frequencies?", lang), a: t("Binaural Beats — שני צלילים בתדרים שונים שנשמעים דרך אוזניות. המוח מייצר תדר שלישי שמכניס אותך למצב קוגניטיבי ספציפי.", "Binaural Beats — two tones at different frequencies heard through headphones. Your brain produces a third frequency that puts you in a specific cognitive state.", lang) },
              { q: t("חייב להשתמש ב-Notion?", "Do I have to use Notion?", lang), a: t("לא חובה. הדשבורד שלנו מספק את כל מה שצריך. התבנית ב-Notion היא בונוס למי שרוצה.", "Not required. Our dashboard provides everything you need. The Notion template is a bonus for those who want it.", lang) },
              { q: t("יש לי ADHD, זה מותאם?", "I have ADHD, is it adapted?", lang), a: t("כן. הסיסטם בנוי עם מבנה ברור, הפסקות מובנות, וטריגרים חזותיים שמתאימים במיוחד ל-ADHD.", "Yes. The system is built with clear structure, built-in breaks, and visual triggers especially suited for ADHD.", lang) },
              { q: t("מה קורה אם זה לא עובד לי?", "What if it doesn't work for me?", lang), a: t("יש אחריות של 7 ימים. אם לא מרגיש שינוי — מחזירים לך את הכסף, בלי שאלות.", "There's a 7-day guarantee. If you don't feel a change — full refund, no questions asked.", lang) },
            ].map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-white/5 bg-white/5 rounded-xl px-6">
                <AccordionTrigger className="text-[#e8e8ed] hover:no-underline">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-[#e8e8ed]/60">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#e8e8ed]/30">
          <span>© 2026 Deeply. {t("כל הזכויות שמורות", "All rights reserved", lang)}.</span>
          <div className="flex gap-6">
            <button className="hover:text-[#e8e8ed]/60 transition-colors">{t("תנאי שימוש", "Terms", lang)}</button>
            <button className="hover:text-[#e8e8ed]/60 transition-colors">{t("פרטיות", "Privacy", lang)}</button>
            <button className="hover:text-[#e8e8ed]/60 transition-colors">{t("יצירת קשר", "Contact", lang)}</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DeeplyLanding;
