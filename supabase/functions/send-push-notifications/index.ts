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

async function sendEmail(
  email: string,
  subject: string,
  html: string,
) {
  if (!RESEND_API_KEY) {
    console.error("No RESEND_API_KEY configured");
    return false;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Task Reminder <onboarding@resend.dev>",
      to: [email],
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`Email failed: ${text}`);
    return false;
  }
  return true;
}

async function wasAlreadySent(
  supabase: any,
  userId: string,
  eventId: string,
  notificationType: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("sent_notifications")
    .select("id")
    .eq("user_id", userId)
    .eq("event_id", eventId)
    .eq("notification_type", notificationType)
    .limit(1);
  return (data?.length || 0) > 0;
}

async function markSent(
  supabase: any,
  userId: string,
  eventId: string,
  notificationType: string,
  channel: string,
) {
  await supabase.from("sent_notifications").insert({
    user_id: userId,
    event_id: eventId,
    notification_type: notificationType,
    channel,
  });
}

function buildEventEmailHtml(
  event: { title: string; start_time: string; category: string; description?: string },
  minutesBefore: number,
  actionUrl?: string,
) {
  const startTime = new Date(event.start_time);
  const timeStr = startTime.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
  const label = minutesBefore === 60 ? "שעה" : `${minutesBefore} דקות`;

  return `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
      <div style="background: #eff6ff; border-right: 4px solid #3b82f6; padding: 16px; border-radius: 8px;">
        <h2 style="color: #2563eb; margin: 0 0 8px;">⏰ בעוד ${label}: ${event.title}</h2>
        <p style="margin: 4px 0;">🕐 מתחיל ב-<strong>${timeStr}</strong></p>
        <p style="margin: 4px 0;">📂 ${event.category}</p>
        ${event.description ? `<p style="margin: 4px 0; color: #666;">${event.description}</p>` : ""}
      </div>
      ${actionUrl ? `
      <div style="margin-top: 16px; text-align: center;">
        <a href="${actionUrl}" style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
          ✅ סיימתי את המשימה
        </a>
      </div>` : ""}
      <p style="color: #999; font-size: 11px; margin-top: 12px;">תזכורת אוטומטית ממתכנן הלו״ז שלך</p>
    </div>`;
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

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const tomorrowDate = new Date(now);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr = tomorrowDate.toISOString().split("T")[0];
    const hour = now.getUTCHours() + 3; // Israel timezone

    console.log(`Push check: ${todayStr}, hour=${hour}, now=${now.toISOString()}`);

    // Reminder windows: 5min, 15min, 60min
    const windows = [
      { name: "event_5min", minMs: 4 * 60 * 1000, maxMs: 6 * 60 * 1000, label: "5 דקות" },
      { name: "event_15min", minMs: 14 * 60 * 1000, maxMs: 16 * 60 * 1000, label: "15 דקות" },
      { name: "event_1hour", minMs: 59 * 60 * 1000, maxMs: 61 * 60 * 1000, label: "שעה" },
    ];

    // Get all users with events in the next ~65 minutes
    const maxFuture = new Date(now.getTime() + 62 * 60 * 1000);
    const minFuture = new Date(now.getTime() + 3 * 60 * 1000);

    const { data: upcomingEvents } = await supabase
      .from("calendar_events")
      .select("*")
      .gte("start_time", minFuture.toISOString())
      .lte("start_time", maxFuture.toISOString());

    // Get all push subscriptions
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("*");

    // Get all unique user IDs from events
    const eventUserIds = [...new Set((upcomingEvents || []).map((e: any) => e.user_id))];
    
    // Also include users with push subs for morning/deadline notifications
    const subUserIds = [...new Set((subscriptions || []).map((s: any) => s.user_id))];
    const allUserIds = [...new Set([...eventUserIds, ...subUserIds])];

    let totalSent = 0;
    let emailsSent = 0;

    for (const userId of allUserIds) {
      // Get user email
      let userEmail: string | null = null;
      try {
        const { data: userData } = await supabase.auth.admin.getUserById(userId);
        userEmail = userData?.user?.email || null;
      } catch (_e) { /* ignore */ }

      const userSubs = (subscriptions || []).filter((s: any) => s.user_id === userId);
      const userEvents = (upcomingEvents || []).filter((e: any) => e.user_id === userId);

      // ===== Event reminders at 5min, 15min, 1hour =====
      for (const event of userEvents) {
        const eventStart = new Date(event.start_time).getTime();
        const diffMs = eventStart - now.getTime();

        for (const win of windows) {
          if (diffMs >= win.minMs && diffMs <= win.maxMs) {
            // Check if already sent
            const alreadySent = await wasAlreadySent(supabase, userId, event.id, win.name);
            if (alreadySent) continue;

            const minutesBefore = win.name === "event_1hour" ? 60 : win.name === "event_15min" ? 15 : 5;
            const startTimeStr = new Date(event.start_time).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });

            // Create action token for "mark as done" if event has source task
            let actionUrl: string | undefined;
            if (event.source_id && event.source_type) {
              const tableName = event.source_type === "personal_task" || event.source_type === "work_task" ? "tasks" : null;
              if (tableName) {
                const { data: token } = await supabase.from("action_tokens").insert({
                  user_id: userId,
                  task_id: event.source_id,
                  action: "complete",
                }).select("id").single();
                if (token) {
                  actionUrl = `${supabaseUrl}/functions/v1/handle-task-action?token=${token.id}`;
                }
              }
            }

            // Send email
            if (userEmail) {
              const html = buildEventEmailHtml(event, minutesBefore, actionUrl);
              const subject = `⏰ בעוד ${win.label}: ${event.title}`;
              const sent = await sendEmail(userEmail, subject, html);
              if (sent) {
                emailsSent++;
                await markSent(supabase, userId, event.id, win.name, "email");
                console.log(`Email sent (${win.name}): ${event.title} to ${userEmail}`);
              }
            }

            // Send push
            for (const sub of userSubs) {
              try {
                await sendPush(
                  { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
                  {
                    title: `⏰ בעוד ${win.label}: ${event.title}`,
                    body: `מתחיל ב-${startTimeStr} | ${event.category}`,
                    tag: `${win.name}-${event.id}`,
                    url: "/personal",
                    icon: "/app-icon.png",
                  },
                  vapid,
                );
                totalSent++;
                await markSent(supabase, userId, event.id, win.name, "push");
              } catch (e: any) {
                console.error(`Push failed:`, e.message);
                if (e.message?.includes("410") || e.message?.includes("404")) {
                  await supabase.from("push_subscriptions").delete().eq("id", sub.id);
                }
              }
            }
          }
        }
      }

      // ===== Morning summary (7-8 AM Israel) =====
      if (hour >= 7 && hour < 8) {
        const { data: tasks } = await supabase
          .from("tasks")
          .select("*")
          .eq("user_id", userId)
          .neq("status", "בוצע");

        const dueToday = (tasks || []).filter((t: any) => t.planned_end === todayStr);
        const overdue = (tasks || []).filter((t: any) => t.planned_end && t.planned_end < todayStr);
        const urgent = (tasks || []).filter((t: any) => t.urgent);

        const parts: string[] = [];
        if (urgent.length) parts.push(`🔥 ${urgent.length} דחופות`);
        if (overdue.length) parts.push(`⚠️ ${overdue.length} בחריגה`);
        if (dueToday.length) parts.push(`📅 ${dueToday.length} להיום`);

        if (parts.length > 0) {
          for (const sub of userSubs) {
            try {
              await sendPush(
                { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
                { title: "☀️ סיכום בוקר", body: parts.join(" | "), tag: "morning-summary", url: "/personal", icon: "/app-icon.png" },
                vapid,
              );
              totalSent++;
            } catch (e: any) {
              console.error(`Push failed:`, e.message);
              if (e.message?.includes("410") || e.message?.includes("404")) {
                await supabase.from("push_subscriptions").delete().eq("id", sub.id);
              }
            }
          }
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
          for (const sub of userSubs) {
            try {
              await sendPush(
                { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
                {
                  title: `📆 ${tomorrowTasks.length} משימות מגיעות מחר`,
                  body: tomorrowTasks.slice(0, 3).map((t: any) => t.description).join(", "),
                  tag: "deadline-reminder",
                  url: "/personal",
                  icon: "/app-icon.png",
                },
                vapid,
              );
              totalSent++;
            } catch (e: any) {
              console.error(`Push failed:`, e.message);
              if (e.message?.includes("410") || e.message?.includes("404")) {
                await supabase.from("push_subscriptions").delete().eq("id", sub.id);
              }
            }
          }
        }
      }
    }

    // Cleanup old sent_notifications (older than 2 days)
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    await supabase.from("sent_notifications").delete().lt("created_at", twoDaysAgo.toISOString());

    return new Response(
      JSON.stringify({ message: `Push: ${totalSent}, Email: ${emailsSent}`, pushSent: totalSent, emailsSent }),
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
