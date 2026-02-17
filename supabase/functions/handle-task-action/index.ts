import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const htmlHeaders = { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" };

  try {
    const url = new URL(req.url);
    const tokenId = url.searchParams.get("token");
    const status = url.searchParams.get("status") || "בוצע";
    const skip = url.searchParams.get("skip") === "true";

    if (!tokenId) {
      return new Response(htmlPage("❌ קישור לא תקין", "חסר טוקן"), {
        status: 400,
        headers: htmlHeaders,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get and validate token
    const { data: token, error: tokenError } = await supabase
      .from("action_tokens")
      .select("*")
      .eq("id", tokenId)
      .single();

    if (tokenError || !token) {
      return new Response(htmlPage("❌ קישור לא תקין", "הקישור לא נמצא או שפג תוקפו"), {
        status: 404,
        headers: htmlHeaders,
      });
    }

    if (token.used) {
      return new Response(htmlPage("✅ כבר בוצע", "המשימה כבר עודכנה"), {
        status: 200,
        headers: htmlHeaders,
      });
    }

    if (new Date(token.expires_at) < new Date()) {
      return new Response(htmlPage("⏰ פג תוקף", "תוקף הקישור פג. עדכן את המשימה ישירות באפליקציה"), {
        status: 410,
        headers: htmlHeaders,
      });
    }

    // If user says "not done" (skip), just mark token as used
    if (skip) {
      await supabase.from("action_tokens").update({ used: true }).eq("id", tokenId);
      return new Response(
        htmlPage("👍 הבנו!", "המשימה תישאר פתוחה. המשך בהצלחה!"),
        { status: 200, headers: htmlHeaders },
      );
    }

    // Map status values
    const statusMap: Record<string, string> = {
      "בוצע": "בוצע",
      "complete": "בוצע",
      "לא התחיל": "לא התחיל",
      "not_started": "לא התחיל",
      "בטיפול": "בטיפול",
      "in_progress": "בטיפול",
    };
    const finalStatus = statusMap[status] || status;

    // Update task status
    const { error: updateError } = await supabase
      .from("tasks")
      .update({ status: finalStatus })
      .eq("id", token.task_id)
      .eq("user_id", token.user_id);

    if (updateError) {
      console.error("Error updating task:", updateError);
      return new Response(htmlPage("❌ שגיאה", "לא הצלחנו לעדכן את המשימה"), {
        status: 500,
        headers: htmlHeaders,
      });
    }

    // Mark token as used
    await supabase.from("action_tokens").update({ used: true }).eq("id", tokenId);

    // Get task details for display
    const { data: task } = await supabase
      .from("tasks")
      .select("description")
      .eq("id", token.task_id)
      .single();

    const taskName = task?.description || "המשימה";

    const statusEmoji: Record<string, string> = {
      "בוצע": "✅",
      "לא התחיל": "⏸️",
      "בטיפול": "🔄",
    };
    const emoji = statusEmoji[finalStatus] || "✅";

    return new Response(
      htmlPage(`${emoji} המשימה עודכנה!`, `"${taskName}" עודכנה לסטטוס: ${finalStatus}. הדשבורד עודכן.`),
      { status: 200, headers: htmlHeaders },
    );
  } catch (error: any) {
    console.error("Action error:", error);
    return new Response(htmlPage("❌ שגיאה", error.message), {
      status: 500,
      headers: htmlHeaders,
    });
  }
});

function htmlPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f8fafc; }
    .card { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
    h1 { font-size: 28px; margin-bottom: 12px; }
    p { color: #64748b; font-size: 16px; line-height: 1.6; }
    a { display: inline-block; margin-top: 20px; background: #8b5cf6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="https://excel-life-sync.lovable.app/personal">פתח את האפליקציה</a>
  </div>
</body>
</html>`;
}
