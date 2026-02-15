import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";
import {
  buildPushPayload,
  type PushSubscription as WebPushSubscription,
  type PushMessage,
  type VapidKeys,
} from "npm:@block65/webcrypto-web-push@1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sendPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  data: object,
  vapid: VapidKeys,
) {
  const sub: WebPushSubscription = {
    endpoint: subscription.endpoint,
    expirationTime: null,
    keys: { p256dh: subscription.p256dh, auth: subscription.auth },
  };

  const message: PushMessage = {
    data: JSON.stringify(data),
    options: { ttl: 86400 },
  };

  const payload = await buildPushPayload(message, sub, vapid);
  const res = await fetch(payload.endpoint, payload);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Push failed (${res.status}): ${text}`);
  }
  return true;
}

async function sendEventEmail(
  email: string,
  event: { title: string; start_time: string; category: string; description?: string },
) {
  if (!RESEND_API_KEY) return;

  const startTime = new Date(event.start_time);
  const timeStr = startTime.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });

  const html = `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
      <div style="background: #eff6ff; border-right: 4px solid #3b82f6; padding: 16px; border-radius: 8px;">
        <h2 style="color: #2563eb; margin: 0 0 8px;">⏰ תזכורת: ${event.title}</h2>
        <p style="margin: 4px 0;">🕐 מתחיל ב-<strong>${timeStr}</strong></p>
        <p style="margin: 4px 0;">📂 ${event.category}</p>
        ${event.description ? `<p style="margin: 4px 0; color: #666;">${event.description}</p>` : ""}
      </div>
      <p style="color: #999; font-size: 11px; margin-top: 12px;">תזכורת אוטומטית ממתכנן הלו״ז שלך</p>
    </div>`;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Task Reminder <onboarding@resend.dev>",
      to: [email],
      subject: `⏰ בעוד 5 דקות: ${event.title}`,
      html,
    }),
  });
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const vapid: VapidKeys = {
      subject: "mailto:push@lovable.app",
      publicKey: vapidPublicKey,
      privateKey: vapidPrivateKey,
    };

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const tomorrowDate = new Date(today);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr = tomorrowDate.toISOString().split("T")[0];
    const hour = today.getUTCHours() + 3; // Israel timezone offset

    console.log(`Push check: ${todayStr}, hour=${hour}`);

    // Get all push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*");

    if (subError || !subscriptions?.length) {
      return new Response(
        JSON.stringify({ message: "No push subscriptions", sent: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    let totalSent = 0;
    const userIds = [...new Set(subscriptions.map((s: any) => s.user_id))];

    for (const userId of userIds) {
      const userSubs = subscriptions.filter((s: any) => s.user_id === userId);
      const notifications: { title: string; body: string; tag: string; url?: string }[] = [];

      // Get user email for email notifications
      let userEmail: string | null = null;
      try {
        const { data: userData } = await supabase.auth.admin.getUserById(userId);
        userEmail = userData?.user?.email || null;
      } catch (_e) { /* ignore */ }

      // ===== 5-minute event reminders =====
      const fiveMinLater = new Date(today.getTime() + 5 * 60 * 1000);
      const tenMinLater = new Date(today.getTime() + 10 * 60 * 1000);
      const { data: soonEvents } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("user_id", userId)
        .gte("start_time", fiveMinLater.toISOString())
        .lte("start_time", tenMinLater.toISOString());

      for (const event of soonEvents || []) {
        const startTime = new Date(event.start_time);
        const timeStr = startTime.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
        notifications.push({
          title: `⏰ בעוד 5 דקות: ${event.title}`,
          body: `מתחיל ב-${timeStr} | ${event.category}`,
          tag: `event-soon-${event.id}`,
          url: "/personal",
        });

        // Also send email reminder
        if (userEmail) {
          try {
            await sendEventEmail(userEmail, event);
            console.log(`Event email sent to ${userEmail}: ${event.title}`);
          } catch (e) {
            console.error("Event email error:", e);
          }
        }
      }

      // ===== Morning summary (7-8 AM Israel time) =====
      if (hour >= 7 && hour < 8) {
        const { data: tasks } = await supabase
          .from("tasks")
          .select("*")
          .eq("user_id", userId)
          .neq("status", "בוצע");

        const dueToday = (tasks || []).filter((t: any) => t.planned_end === todayStr);
        const overdue = (tasks || []).filter((t: any) => t.planned_end && t.planned_end < todayStr);
        const urgent = (tasks || []).filter((t: any) => t.urgent);

        const dayOfWeek = today.getDay();
        const dayOfMonth = today.getDate();
        const { data: recurring } = await supabase.from("recurring_tasks").select("*").eq("user_id", userId);
        const { data: completions } = await supabase
          .from("recurring_task_completions")
          .select("recurring_task_id")
          .eq("user_id", userId)
          .eq("completed_date", todayStr);
        const completedIds = new Set((completions || []).map((c: any) => c.recurring_task_id));
        const recurringDue = (recurring || []).filter((t: any) => {
          if (completedIds.has(t.id)) return false;
          if (t.frequency === "daily") return true;
          if (t.frequency === "weekly") return t.day_of_week === dayOfWeek;
          if (t.frequency === "monthly") return t.day_of_month === dayOfMonth;
          return false;
        });

        const parts: string[] = [];
        if (urgent.length) parts.push(`🔥 ${urgent.length} דחופות`);
        if (overdue.length) parts.push(`⚠️ ${overdue.length} בחריגה`);
        if (dueToday.length) parts.push(`📅 ${dueToday.length} להיום`);
        if (recurringDue.length) parts.push(`🔄 ${recurringDue.length} קבועות`);

        if (parts.length > 0) {
          notifications.push({
            title: "☀️ סיכום בוקר",
            body: parts.join(" | "),
            tag: "morning-summary",
            url: "/personal",
          });
        }
      }

      // ===== Deadline reminders (noon) =====
      if (hour >= 12 && hour < 13) {
        const { data: tomorrowTasks } = await supabase
          .from("tasks")
          .select("*")
          .eq("user_id", userId)
          .eq("planned_end", tomorrowStr)
          .neq("status", "בוצע");

        if (tomorrowTasks?.length) {
          notifications.push({
            title: `📆 ${tomorrowTasks.length} משימות מגיעות מחר`,
            body: tomorrowTasks.slice(0, 3).map((t: any) => t.description).join(", "),
            tag: "deadline-reminder",
            url: "/personal",
          });
        }
      }

      // Send push notifications
      for (const notif of notifications) {
        for (const sub of userSubs) {
          try {
            await sendPush(
              { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
              { ...notif, icon: "/app-icon.png" },
              vapid,
            );
            totalSent++;
          } catch (e: any) {
            console.error(`Push failed to ${sub.endpoint}:`, e.message);
            if (e.message?.includes("410") || e.message?.includes("404")) {
              await supabase.from("push_subscriptions").delete().eq("id", sub.id);
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ message: `Sent ${totalSent} push notifications`, sent: totalSent }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (error: any) {
    console.error("Push notification error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
});
