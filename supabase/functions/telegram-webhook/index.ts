import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TELEGRAM_API = "https://api.telegram.org/bot";

async function sendMessage(token: string, chatId: number, text: string, replyMarkup?: any) {
  const body: any = { chat_id: chatId, text, parse_mode: "HTML" };
  if (replyMarkup) body.reply_markup = replyMarkup;
  await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
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
    // Handle setup request (non-Telegram)
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    const update = await req.json();

    // Handle action=setup_webhook
    if (update.action === "setup_webhook") {
      const webhookUrl = update.webhook_url;
      const res = await fetch(`${TELEGRAM_API}${BOT_TOKEN}/setWebhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: webhookUrl }),
      });
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle link_user action (from the app)
    if (update.action === "link_user") {
      const { user_id, link_code } = update;
      // Store pending link
      const { error } = await supabase
        .from("telegram_users")
        .upsert({ user_id, chat_id: 0, username: `pending:${link_code}` }, { onConflict: "user_id", ignoreDuplicates: false });

      // Actually we need a different approach - generate a code, user sends it to bot
      return new Response(JSON.stringify({ success: true, code: link_code }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Telegram webhook update
    const message = update.message;
    if (!message?.text) {
      return new Response("OK", { status: 200 });
    }

    const chatId = message.chat.id;
    const text = message.text.trim();
    const username = message.from?.username || message.from?.first_name || "";

    // /start command with link code
    if (text.startsWith("/start")) {
      const parts = text.split(" ");
      if (parts.length > 1) {
        const linkCode = parts[1];
        // Find pending link
        const { data: pending } = await supabase
          .from("telegram_users")
          .select("*")
          .eq("username", `pending:${linkCode}`)
          .single();

        if (pending) {
          await supabase
            .from("telegram_users")
            .update({ chat_id: chatId, username, is_active: true })
            .eq("id", pending.id);

          await sendMessage(BOT_TOKEN, chatId,
            `✅ <b>החשבון חובר בהצלחה!</b>\n\nעכשיו תקבל:\n• 📋 סיכום יומי של המשימות שלך\n• ⏰ תזכורות למשימות דחופות\n• 💬 אפשרות לנהל משימות מכאן\n\nשלח /help לרשימת הפקודות.`
          );
          return new Response("OK", { status: 200 });
        }
      }

      await sendMessage(BOT_TOKEN, chatId,
        `👋 <b>שלום!</b>\n\nכדי לחבר את חשבון הטלגרם שלך, לך להגדרות באפליקציה ולחץ "חבר טלגרם".\n\nשלח /help לעזרה.`
      );
      return new Response("OK", { status: 200 });
    }

    // Find linked user
    const { data: telegramUser } = await supabase
      .from("telegram_users")
      .select("*")
      .eq("chat_id", chatId)
      .eq("is_active", true)
      .single();

    if (!telegramUser) {
      await sendMessage(BOT_TOKEN, chatId,
        "❌ החשבון שלך לא מחובר. לך להגדרות באפליקציה ולחץ 'חבר טלגרם'."
      );
      return new Response("OK", { status: 200 });
    }

    const userId = telegramUser.user_id;

    // /help
    if (text === "/help") {
      await sendMessage(BOT_TOKEN, chatId,
        `📋 <b>פקודות זמינות:</b>\n\n/tasks - המשימות שלי להיום\n/urgent - משימות דחופות\n/summary - סיכום מצב משימות\n/done [טקסט] - סמן משימה כהושלמה\n/help - עזרה`
      );
      return new Response("OK", { status: 200 });
    }

    // /tasks - today's tasks
    if (text === "/tasks") {
      const { data: tasks } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userId)
        .eq("archived", false)
        .neq("status", "הושלם")
        .order("urgent", { ascending: false })
        .limit(15);

      if (!tasks || tasks.length === 0) {
        await sendMessage(BOT_TOKEN, chatId, "🎉 אין משימות פתוחות! כל הכבוד!");
      } else {
        let msg = `📋 <b>המשימות שלך (${tasks.length}):</b>\n\n`;
        tasks.forEach((t, i) => {
          const urgent = t.urgent ? "🔴 " : "";
          const status = t.status || "לא התחיל";
          msg += `${i + 1}. ${urgent}<b>${t.description}</b>\n   סטטוס: ${status}\n`;
        });
        await sendMessage(BOT_TOKEN, chatId, msg);
      }
      return new Response("OK", { status: 200 });
    }

    // /urgent
    if (text === "/urgent") {
      const { data: tasks } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userId)
        .eq("archived", false)
        .eq("urgent", true)
        .neq("status", "הושלם")
        .limit(10);

      if (!tasks || tasks.length === 0) {
        await sendMessage(BOT_TOKEN, chatId, "✅ אין משימות דחופות כרגע!");
      } else {
        let msg = `🔴 <b>משימות דחופות (${tasks.length}):</b>\n\n`;
        tasks.forEach((t, i) => {
          msg += `${i + 1}. <b>${t.description}</b>\n   סטטוס: ${t.status || "לא התחיל"}\n`;
        });
        await sendMessage(BOT_TOKEN, chatId, msg);
      }
      return new Response("OK", { status: 200 });
    }

    // /summary
    if (text === "/summary") {
      const { data: allTasks } = await supabase
        .from("tasks")
        .select("status, urgent")
        .eq("user_id", userId)
        .eq("archived", false);

      if (!allTasks || allTasks.length === 0) {
        await sendMessage(BOT_TOKEN, chatId, "📊 אין משימות במערכת.");
      } else {
        const total = allTasks.length;
        const done = allTasks.filter((t) => t.status === "הושלם").length;
        const inProgress = allTasks.filter((t) => t.status === "בתהליך").length;
        const urgent = allTasks.filter((t) => t.urgent).length;
        const notStarted = total - done - inProgress;

        await sendMessage(BOT_TOKEN, chatId,
          `📊 <b>סיכום משימות:</b>\n\n` +
          `📌 סה"כ: ${total}\n` +
          `✅ הושלמו: ${done}\n` +
          `🔄 בתהליך: ${inProgress}\n` +
          `⏳ טרם התחילו: ${notStarted}\n` +
          `🔴 דחופות: ${urgent}\n\n` +
          `📈 התקדמות: ${Math.round((done / total) * 100)}%`
        );
      }
      return new Response("OK", { status: 200 });
    }

    // /done [text] - mark task as complete
    if (text.startsWith("/done ")) {
      const search = text.slice(6).trim();
      const { data: tasks } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userId)
        .eq("archived", false)
        .neq("status", "הושלם")
        .ilike("description", `%${search}%`)
        .limit(1);

      if (tasks && tasks.length > 0) {
        await supabase
          .from("tasks")
          .update({ status: "הושלם" })
          .eq("id", tasks[0].id);
        await sendMessage(BOT_TOKEN, chatId,
          `✅ המשימה "<b>${tasks[0].description}</b>" סומנה כהושלמה!`
        );
      } else {
        await sendMessage(BOT_TOKEN, chatId, `❌ לא נמצאה משימה התואמת ל-"${search}"`);
      }
      return new Response("OK", { status: 200 });
    }

    // Default response
    await sendMessage(BOT_TOKEN, chatId,
      "🤖 לא הבנתי. שלח /help לרשימת הפקודות."
    );

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return new Response("Error", { status: 500 });
  }
});
