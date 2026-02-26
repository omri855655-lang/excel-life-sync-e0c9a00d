import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TELEGRAM_API = "https://api.telegram.org/bot";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function sendMessage(token: string, chatId: number, text: string) {
  await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!BOT_TOKEN) {
    return new Response("Bot token not configured", { status: 500 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // Get all active telegram users
    const { data: telegramUsers } = await supabase
      .from("telegram_users")
      .select("*")
      .eq("is_active", true)
      .gt("chat_id", 0);

    if (!telegramUsers || telegramUsers.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sent = 0;

    for (const tu of telegramUsers) {
      const { data: tasks } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", tu.user_id)
        .eq("archived", false)
        .neq("status", "הושלם");

      if (!tasks || tasks.length === 0) {
        await sendMessage(BOT_TOKEN, tu.chat_id,
          "☀️ <b>בוקר טוב!</b>\n\nאין משימות פתוחות. יום מעולה! 🎉"
        );
      } else {
        const urgent = tasks.filter((t) => t.urgent);
        const today = new Date().toISOString().split("T")[0];
        const dueToday = tasks.filter((t) => t.planned_end === today);

        let msg = `☀️ <b>סיכום יומי</b>\n\n`;
        msg += `📌 משימות פתוחות: ${tasks.length}\n`;

        if (urgent.length > 0) {
          msg += `\n🔴 <b>דחופות (${urgent.length}):</b>\n`;
          urgent.forEach((t) => {
            msg += `• ${t.description}\n`;
          });
        }

        if (dueToday.length > 0) {
          msg += `\n📅 <b>מסתיימות היום (${dueToday.length}):</b>\n`;
          dueToday.forEach((t) => {
            msg += `• ${t.description}\n`;
          });
        }

        msg += `\nשלח /tasks לרשימה מלאה`;
        await sendMessage(BOT_TOKEN, tu.chat_id, msg);
      }
      sent++;
    }

    return new Response(JSON.stringify({ sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Daily summary error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
