import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Trash2, CreditCard, TrendingUp, TrendingDown, DollarSign, Check, Calendar, Sparkles, MessageCircle, ChevronDown, ChevronUp, BookOpen, PiggyBank, AlertTriangle, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useDashboardChatHistory } from "@/hooks/useDashboardChatHistory";

interface Payment {
  id: string;
  title: string;
  amount: number;
  currency: string;
  category: string | null;
  payment_type: string;
  payment_method: string | null;
  due_date: string | null;
  paid: boolean;
  recurring: boolean;
  recurring_frequency: string | null;
  notes: string | null;
  sheet_name: string;
  archived: boolean;
  created_at: string;
}

const FINANCIAL_GUIDES = [
  {
    id: "saving",
    icon: PiggyBank,
    title: "מדריך לחיסכון כסף",
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    sections: [
      { title: "כלל 50/30/20", content: "חלק את ההכנסה: 50% לצרכים (שכירות, אוכל, חשבונות), 30% לרצונות (בילויים, קניות), 20% לחיסכון והשקעות. זה הבסיס לכל תקציב בריא." },
      { title: "שלם לעצמך קודם", content: "ברגע שהמשכורת נכנסת, העבר אוטומטית 10-20% לחשבון חיסכון נפרד. אל תחכה לסוף החודש - מה שנשאר לעולם לא מספיק." },
      { title: "ביטול מנויים מיותרים", content: "בדוק את כל המנויים החודשיים שלך. ביטול של 3-4 מנויים של ₪30-50 = חיסכון של ₪1,200-2,400 בשנה." },
      { title: "כלל 24 השעות", content: "לפני כל קנייה מעל ₪100, חכה 24 שעות. ב-70% מהמקרים תגלה שאתה לא באמת צריך את זה." },
      { title: "אתגר 52 שבועות", content: "שבוע 1 = חסוך ₪1, שבוע 2 = ₪2, שבוע 52 = ₪52. בסוף השנה יהיו לך ₪1,378. אפשר גם להתחיל מ-₪10 ולהכפיל." },
    ]
  },
  {
    id: "invest",
    icon: TrendingUp,
    title: "איך לעשות כסף מהכסף שלך",
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    sections: [
      { title: "קרן חירום קודם", content: "לפני כל השקעה, בנה קרן חירום של 3-6 חודשי הוצאות. זה הביטוח שלך נגד מצבים לא צפויים." },
      { title: "ריבית דריבית - הכוח השמיני", content: "השקעה של ₪500 בחודש עם תשואה ממוצעת של 8% = ₪450,000 אחרי 20 שנה. הזמן הוא הנכס הכי חשוב שלך." },
      { title: "פיזור סיכונים", content: "לעולם אל תשים את כל הביצים בסל אחד. חלק בין מניות, אג\"ח, נדל\"ן, וקרנות מחקות. ככל שאתה צעיר יותר - יותר מניות." },
      { title: "קרנות מחקות (ETF)", content: "במקום לנסות לבחור מניות - השקע בקרנות שמחקות את המדד (S&P 500, ת\"א 125). סטטיסטית, 90% מהמשקיעים הפרטיים לא מנצחים את המדד." },
      { title: "הכנסה פסיבית", content: "חפש דרכים ליצור הכנסה שלא תלויה בשעות עבודה: השכרת נכסים, דיבידנדים, קורסים דיגיטליים, תוכן אונליין." },
    ]
  },
  {
    id: "impulse",
    icon: AlertTriangle,
    title: "איך להימנע מקניות אימפולסיביות",
    color: "text-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-950/20",
    sections: [
      { title: "זהה את הטריגרים", content: "קניות אימפולסיביות נובעות מרגשות: שעמום, עצב, לחץ, FOMO. כשאתה מרגיש דחף לקנות - שאל את עצמך 'מה אני מרגיש עכשיו?'" },
      { title: "רשימת קניות מראש", content: "לעולם אל תלך לקנות בלי רשימה. מחקרים מראים שקניות ללא רשימה עולות 40% יותר בממוצע." },
      { title: "כלל 10/10/10", content: "לפני קנייה, שאל: איך ארגיש לגבי זה בעוד 10 דקות? 10 שעות? 10 ימים? אם התשובה 'לא אכפת לי' - אל תקנה." },
      { title: "מחק אפליקציות קניות", content: "הסר אפליקציות כמו שיין, עלי אקספרס, אמזון מהטלפון. הקושי הנוסף של לפתוח דפדפן = פחות קניות דחף." },
      { title: "חשב בשעות עבודה", content: "אם המוצר עולה ₪300 ואתה מרוויח ₪60 לשעה - זה עולה 5 שעות עבודה. האם שווה לך?" },
    ]
  },
  {
    id: "tips",
    icon: Lightbulb,
    title: "טיפים פיננסיים חכמים",
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
    sections: [
      { title: "The Psychology of Money", content: "מורגן האוסל: 'עושר הוא מה שאתה לא רואה. זה הרכב שלא נקנה, היהלום שלא נרכש. עושר הוא ההכנסה שלא הוצאת.'" },
      { title: "Rich Dad Poor Dad", content: "רוברט קיוסאקי: 'עשירים קונים נכסים שמייצרים הכנסה. עניים קונים התחייבויות שהם חושבים שהן נכסים.'" },
      { title: "אוטומציה פיננסית", content: "הגדר העברות אוטומטיות: חיסכון, השקעות, ביטוחים - הכל ביום שהמשכורת נכנסת. אל תסמוך על כוח הרצון." },
      { title: "ניהול חובות", content: "שיטת המפולת: שלם קודם את החוב עם הריבית הגבוהה ביותר. שיטת כדור השלג: שלם קודם את החוב הקטן ביותר לתחושת הישג." },
      { title: "⚠️ הערה חשובה", content: "כל המידע הפיננסי כאן הוא לצרכי למידה בלבד ואינו מהווה ייעוץ השקעות. מומלץ להתייעץ עם יועץ מוסמך לפני קבלת החלטות פיננסיות." },
    ]
  },
];

const PaymentDashboard = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newType, setNewType] = useState("expense");
  const [newMethod, setNewMethod] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newRecurring, setNewRecurring] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [aiChat, setAiChat] = useState("");
  const { messages: aiMessages, setMessages: setAiMessages, clearHistory: clearAiHistory } = useDashboardChatHistory("payments");
  const [aiLoading, setAiLoading] = useState(false);
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("payment_tracking")
      .select("*")
      .eq("user_id", user.id)
      .eq("archived", false)
      .order("created_at", { ascending: false });
    setPayments((data as any[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const addPayment = async () => {
    if (!user || !newTitle.trim() || !newAmount) return;
    const { error } = await supabase.from("payment_tracking").insert({
      user_id: user.id,
      title: newTitle.trim(),
      amount: parseFloat(newAmount),
      category: newCategory.trim() || null,
      payment_type: newType,
      payment_method: newMethod.trim() || null,
      due_date: newDueDate || null,
      recurring: newRecurring,
    });
    if (error) { toast.error("שגיאה"); return; }
    setNewTitle(""); setNewAmount(""); setNewCategory(""); setNewMethod(""); setNewDueDate("");
    toast.success("נוסף");
    fetchPayments();
  };

  const togglePaid = async (id: string, paid: boolean) => {
    await supabase.from("payment_tracking").update({ paid: !paid }).eq("id", id);
    setPayments(prev => prev.map(p => p.id === id ? { ...p, paid: !paid } : p));
  };

  const deletePayment = async (id: string) => {
    await supabase.from("payment_tracking").delete().eq("id", id);
    setPayments(prev => prev.filter(p => p.id !== id));
  };

  const totalExpenses = useMemo(() => payments.filter(p => p.payment_type === "expense").reduce((s, p) => s + p.amount, 0), [payments]);
  const totalIncome = useMemo(() => payments.filter(p => p.payment_type === "income").reduce((s, p) => s + p.amount, 0), [payments]);
  const balance = totalIncome - totalExpenses;
  const unpaidExpenses = useMemo(() => payments.filter(p => p.payment_type === "expense" && !p.paid).reduce((s, p) => s + p.amount, 0), [payments]);
  const overdue = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return payments.filter(p => !p.paid && p.due_date && p.due_date < today);
  }, [payments]);

  const sendAiMessage = async () => {
    if (!aiChat.trim()) return;
    const userMsg = { role: "user", content: aiChat };
    setAiMessages(prev => [...prev, userMsg]);
    setAiChat("");
    setAiLoading(true);

    try {
      const context = `הוצאות: ₪${totalExpenses.toFixed(0)}, הכנסות: ₪${totalIncome.toFixed(0)}, מאזן: ₪${balance.toFixed(0)}, לא שולמו: ₪${unpaidExpenses.toFixed(0)}, באיחור: ${overdue.length}. קטגוריות: ${[...new Set(payments.map(p => p.category).filter(Boolean))].join(", ")}`;
      const { data, error } = await supabase.functions.invoke("task-ai-helper", {
        body: {
          taskDescription: aiChat,
          taskCategory: "finance",
          customPrompt: `אתה יועץ פיננסי חכם ומקצועי. הנה המצב הפיננסי של המשתמש:
${context}

בסיס הידע שלך כולל: The Psychology of Money (מורגן האוסל), Rich Dad Poor Dad (קיוסאקי), The Almanack of Naval Ravikant, Principles (ריי דליו), I Will Teach You to Be Rich (רמית סתי).

תן עצות מעשיות, ספציפיות ומבוססות מחקר. השתמש באימוג'ים. דבר בעברית. ציין שזו המלצה בלבד ולא ייעוץ מקצועי.

המשתמש שואל: ${aiChat}`,
        },
      });
      if (error) throw error;
      setAiMessages(prev => [...prev, { role: "assistant", content: data?.suggestion || "אין תשובה" }]);
    } catch {
      setAiMessages(prev => [...prev, { role: "assistant", content: "שגיאה בקבלת תשובה" }]);
    }
    setAiLoading(false);
  };

  if (loading) return <div className="p-6 text-center text-muted-foreground">טוען...</div>;

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto" dir="rtl">
      <div className="flex items-center gap-3 mb-4">
        <CreditCard className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">מעקב תשלומים</h2>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <CardContent className="p-3 text-center">
            <TrendingUp className="h-5 w-5 text-green-500 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">הכנסות</p>
            <p className="font-bold text-green-600">₪{totalIncome.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
          <CardContent className="p-3 text-center">
            <TrendingDown className="h-5 w-5 text-red-500 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">הוצאות</p>
            <p className="font-bold text-red-600">₪{totalExpenses.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className={`${balance >= 0 ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200" : "bg-red-100 dark:bg-red-950/30 border-red-300"}`}>
          <CardContent className="p-3 text-center">
            <DollarSign className="h-5 w-5 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">מאזן</p>
            <p className={`font-bold ${balance >= 0 ? "text-emerald-600" : "text-red-600"}`}>₪{balance.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className={`${overdue.length > 0 ? "bg-red-100 dark:bg-red-950/30 border-red-300" : "bg-muted/30"}`}>
          <CardContent className="p-3 text-center">
            <Calendar className="h-5 w-5 text-red-500 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">באיחור</p>
            <p className="font-bold">{overdue.length}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full flex-wrap h-auto">
          <TabsTrigger value="overview" className="flex-1">תשלומים</TabsTrigger>
          <TabsTrigger value="add" className="flex-1 gap-1"><Plus className="h-3 w-3" />הוסף</TabsTrigger>
          <TabsTrigger value="guides" className="flex-1 gap-1"><BookOpen className="h-3 w-3" />מדריכים</TabsTrigger>
          <TabsTrigger value="ai" className="flex-1 gap-1"><Sparkles className="h-3 w-3" />יועץ AI</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-2">
          {payments.map(p => (
            <Card key={p.id} className={p.payment_type === "income" ? "border-green-200 dark:border-green-800" : ""}>
              <CardContent className="py-2 px-3 flex items-center gap-3">
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => togglePaid(p.id, p.paid)}>
                  {p.paid ? <Check className="h-4 w-4 text-green-600" /> : <div className="h-4 w-4 border-2 rounded" />}
                </Button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${p.paid ? "line-through text-muted-foreground" : ""}`}>{p.title}</p>
                  <div className="flex gap-2 items-center flex-wrap">
                    {p.category && <Badge variant="outline" className="text-[10px]">{p.category}</Badge>}
                    {p.due_date && <span className="text-[10px] text-muted-foreground">{format(new Date(p.due_date), "dd/MM/yy")}</span>}
                    {p.recurring && <Badge variant="secondary" className="text-[10px]">חוזר</Badge>}
                    {p.payment_method && <span className="text-[10px] text-muted-foreground">{p.payment_method}</span>}
                  </div>
                </div>
                <span className={`font-bold text-sm whitespace-nowrap ${p.payment_type === "income" ? "text-green-600" : "text-red-600"}`}>
                  {p.payment_type === "income" ? "+" : "-"}₪{p.amount.toLocaleString()}
                </span>
                <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => deletePayment(p.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          ))}
          {payments.length === 0 && <p className="text-center text-muted-foreground py-8">אין תשלומים עדיין</p>}
        </TabsContent>

        <TabsContent value="add">
          <Card>
            <CardContent className="pt-4 space-y-3">
              <Input placeholder="שם התשלום (משכורת, שכירות, חשמל...)" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
              <div className="flex gap-2">
                <Input placeholder="סכום" type="number" value={newAmount} onChange={e => setNewAmount(e.target.value)} dir="ltr" className="flex-1" />
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">הוצאה</SelectItem>
                    <SelectItem value="income">הכנסה</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Input placeholder="קטגוריה" value={newCategory} onChange={e => setNewCategory(e.target.value)} className="flex-1" />
                <Input placeholder="אמצעי תשלום" value={newMethod} onChange={e => setNewMethod(e.target.value)} className="flex-1" />
              </div>
              <Input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} dir="ltr" />
              <Button onClick={addPayment} className="w-full gap-2"><Plus className="h-4 w-4" />הוסף תשלום</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guides" className="space-y-3">
          {FINANCIAL_GUIDES.map(guide => (
            <Collapsible key={guide.id} open={expandedGuide === guide.id} onOpenChange={() => setExpandedGuide(expandedGuide === guide.id ? null : guide.id)}>
              <CollapsibleTrigger className="w-full">
                <Card className={`${guide.bgColor} cursor-pointer hover:shadow-md transition-all`}>
                  <CardContent className="py-3 px-4 flex items-center gap-3">
                    <guide.icon className={`h-6 w-6 ${guide.color} shrink-0`} />
                    <span className="font-semibold flex-1 text-right">{guide.title}</span>
                    {expandedGuide === guide.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </CardContent>
                </Card>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-2 mt-2 px-2">
                  {guide.sections.map((section, i) => (
                    <Card key={i} className="border-muted">
                      <CardContent className="py-3 px-4">
                        <h4 className="font-semibold text-sm mb-1">{section.title}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{section.content}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </TabsContent>

        <TabsContent value="ai">
          <Card>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-5 w-5" />יועץ פיננסי AI</CardTitle>
                {aiMessages.length > 0 && <Button size="sm" variant="ghost" onClick={clearAiHistory} className="text-xs">נקה היסטוריה</Button>}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">שאל על תקציב, חיסכון, ניתוח הוצאות, השקעות ועוד. ⚠️ זו המלצה בלבד ולא ייעוץ מקצועי.</p>
              <div className="border rounded-lg p-3 min-h-[200px] max-h-[400px] overflow-y-auto space-y-3">
                {aiMessages.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">התחל שיחה עם היועץ הפיננסי...</p>}
                {aiMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {aiLoading && <div className="text-sm text-muted-foreground animate-pulse">חושב...</div>}
              </div>
              <div className="flex gap-2">
                <Input placeholder="שאל שאלה על הכסף שלך..." value={aiChat} onChange={e => setAiChat(e.target.value)} onKeyDown={e => e.key === "Enter" && sendAiMessage()} />
                <Button onClick={sendAiMessage} disabled={aiLoading}><MessageCircle className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentDashboard;
