import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { taskDescription, taskCategory } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = taskCategory?.startsWith('daily_planning') 
      ? `אתה מתכנן יום אישי מקצועי. אתה מבין עברית ושעון ישראלי (24 שעות).

כללים חשובים:
1. כשהמשתמש אומר "19 בערב" או "19:00" - זו השעה 19:00, לא 21:00
2. תמיד השתמש בפורמט שעון 24 שעות (07:00, 14:30, 19:00 וכו')
3. צור לו"ז בפורמט טבלאי מסודר שאפשר להעתיק לוורד

פורמט הטבלה:
| שעה | משימה | משך | הערות |
|-----|--------|-----|-------|
| 07:00 | משימה 1 | 30 דק' | פרטים |

עקרונות תכנון:
- משימות דחופות ובאיחור קודם כל
- הפסקות קצרות כל שעה-שעתיים
- משימות קשות בבוקר כשהריכוז גבוה
- אל תכלול יותר ממה שאפשר לעשות ביום אחד
- השאר זמן לארוחות ומנוחה`
      : `אתה עוזר אישי מומחה בניהול משימות. המשתמש יתן לך תיאור של משימה, ואתה צריך לספק:
1. הצעה קצרה וברורה איך הכי כדאי לבצע את המשימה (2-3 משפטים)
2. הערכת זמן ריאליסטית לביצוע המשימה

התשובה צריכה להיות בעברית, קצרה וממוקדת.
תגיב בפורמט הבא:
💡 איך לבצע: [הסבר קצר]
⏱️ זמן משוער: [הערכת זמן]`;

    const userPrompt = taskCategory 
      ? `משימה: ${taskDescription}\nקטגוריה: ${taskCategory}`
      : `משימה: ${taskDescription}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "יותר מדי בקשות, נסה שוב מאוחר יותר" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "נדרש תשלום עבור שימוש ב-AI" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "שגיאה בשירות ה-AI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const suggestion = data.choices?.[0]?.message?.content;

    return new Response(JSON.stringify({ suggestion }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("task-ai-helper error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "שגיאה לא צפויה" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
