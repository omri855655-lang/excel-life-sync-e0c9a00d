import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Web Push utilities
async function generateVapidAuth(endpoint: string, vapidPublicKey: string, vapidPrivateKey: string) {
  const urlObj = new URL(endpoint);
  const audience = `${urlObj.protocol}//${urlObj.host}`;

  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 3600,
    sub: "mailto:push@lovable.app",
  };

  const enc = new TextEncoder();
  const b64url = (buf: ArrayBuffer) => {
    const bytes = new Uint8Array(buf);
    let s = "";
    for (const b of bytes) s += String.fromCharCode(b);
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  };
  const b64urlStr = (s: string) => btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const headerB64 = b64urlStr(JSON.stringify(header));
  const payloadB64 = b64urlStr(JSON.stringify(payload));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import VAPID private key
  const rawKey = Uint8Array.from(atob(vapidPrivateKey.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    enc.encode(unsignedToken)
  );

  // Convert DER signature to raw r||s format
  const sigBytes = new Uint8Array(signature);
  let r: Uint8Array, s: Uint8Array;
  if (sigBytes.length === 64) {
    r = sigBytes.slice(0, 32);
    s = sigBytes.slice(32, 64);
  } else {
    // DER format
    const rLen = sigBytes[3];
    const rStart = 4;
    r = sigBytes.slice(rStart, rStart + rLen);
    const sLen = sigBytes[rStart + rLen + 1];
    const sStart = rStart + rLen + 2;
    s = sigBytes.slice(sStart, sStart + sLen);
    // Pad/trim to 32 bytes
    if (r.length > 32) r = r.slice(r.length - 32);
    if (s.length > 32) s = s.slice(s.length - 32);
    if (r.length < 32) { const p = new Uint8Array(32); p.set(r, 32 - r.length); r = p; }
    if (s.length < 32) { const p = new Uint8Array(32); p.set(s, 32 - s.length); s = p; }
  }

  const rawSig = new Uint8Array(64);
  rawSig.set(r, 0);
  rawSig.set(s, 32);

  const jwt = `${unsignedToken}.${b64url(rawSig.buffer)}`;
  return { jwt, vapidPublicKey };
}

async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: object,
  vapidPublicKey: string,
  vapidPrivateKey: string
) {
  const { jwt } = await generateVapidAuth(subscription.endpoint, vapidPublicKey, vapidPrivateKey);

  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "TTL": "86400",
      "Authorization": `vapid t=${jwt}, k=${vapidPublicKey}`,
      "Content-Encoding": "aes128gcm",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Push failed (${response.status}): ${text}`);
  }
  return true;
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

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const tomorrowDate = new Date(today);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr = tomorrowDate.toISOString().split("T")[0];
    const hour = today.getUTCHours() + 3; // Israel timezone offset

    console.log(`Push notifications check: ${todayStr}, hour=${hour}`);

    // Get all push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*");

    if (subError || !subscriptions?.length) {
      return new Response(
        JSON.stringify({ message: "No push subscriptions", sent: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let totalSent = 0;
    const userIds = [...new Set(subscriptions.map((s) => s.user_id))];

    for (const userId of userIds) {
      const userSubs = subscriptions.filter((s) => s.user_id === userId);
      const notifications: { title: string; body: string; tag: string; url?: string }[] = [];

      // Morning summary (7-8 AM Israel time)
      if (hour >= 7 && hour < 8) {
        const { data: tasks } = await supabase
          .from("tasks")
          .select("*")
          .eq("user_id", userId)
          .neq("status", "בוצע");

        const dueToday = (tasks || []).filter((t) => t.planned_end === todayStr);
        const overdue = (tasks || []).filter((t) => t.planned_end && t.planned_end < todayStr);
        const urgent = (tasks || []).filter((t) => t.urgent);

        // Recurring tasks
        const dayOfWeek = today.getDay();
        const dayOfMonth = today.getDate();
        const { data: recurring } = await supabase.from("recurring_tasks").select("*").eq("user_id", userId);
        const { data: completions } = await supabase
          .from("recurring_task_completions")
          .select("recurring_task_id")
          .eq("user_id", userId)
          .eq("completed_date", todayStr);
        const completedIds = new Set((completions || []).map((c) => c.recurring_task_id));
        const recurringDue = (recurring || []).filter((t) => {
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

      // Event reminders - check events starting in the next hour
      const nowISO = today.toISOString();
      const oneHourLater = new Date(today.getTime() + 60 * 60 * 1000).toISOString();
      const { data: upcomingEvents } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("user_id", userId)
        .gte("start_time", nowISO)
        .lte("start_time", oneHourLater);

      for (const event of upcomingEvents || []) {
        const startTime = new Date(event.start_time);
        const timeStr = startTime.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
        notifications.push({
          title: `⏰ ${event.title}`,
          body: `מתחיל ב-${timeStr} | ${event.category}`,
          tag: `event-${event.id}`,
          url: "/personal",
        });
      }

      // Deadline reminders (check tasks due tomorrow, sent at noon)
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
            body: tomorrowTasks.slice(0, 3).map((t) => t.description).join(", "),
            tag: "deadline-reminder",
            url: "/personal",
          });
        }
      }

      // Send notifications
      for (const notif of notifications) {
        for (const sub of userSubs) {
          try {
            await sendPushNotification(
              { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
              { ...notif, icon: "/app-icon.png" },
              vapidPublicKey,
              vapidPrivateKey
            );
            totalSent++;
          } catch (e) {
            console.error(`Failed to push to ${sub.endpoint}:`, e);
            // Clean up invalid subscriptions
            if (e.message?.includes("410") || e.message?.includes("404")) {
              await supabase.from("push_subscriptions").delete().eq("id", sub.id);
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ message: `Sent ${totalSent} push notifications`, sent: totalSent }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Push notification error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
