import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if this is an update-status request
    const body = await req.json().catch(() => ({}));
    
    if (body.action === "update-status" && body.task_id && body.status) {
      const sourceType = body.source_type || "task";
      
      if (sourceType === "recurring_task") {
        // For recurring tasks, mark today as completed
        if (body.status === "בוצע") {
          const todayStr = new Date().toISOString().split("T")[0];
          await supabase.from("recurring_task_completions").insert({
            recurring_task_id: body.task_id,
            user_id: user.id,
            completed_date: todayStr,
          });
        }
      } else {
        // Regular task - update status
        const { error: updateError } = await supabase
          .from("tasks")
          .update({ status: body.status })
          .eq("id", body.task_id)
          .eq("user_id", user.id);

        if (updateError) throw updateError;
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch last 50 notifications for this user
    const { data: notifications, error } = await supabase
      .from("sent_notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    // For completion notifications, fetch the related task/event info
    const enrichedNotifications = [];
    for (const n of (notifications || [])) {
      const enriched: any = { ...n };
      
      if (n.notification_type === "event_completion" && n.task_id) {
        // Try to get task info
        const { data: task } = await supabase
          .from("tasks")
          .select("id, description, status, task_type")
          .eq("id", n.task_id)
          .single();
        
        if (task) {
          enriched.task_info = task;
        } else {
          // Maybe it's a recurring task
          const { data: recurringTask } = await supabase
            .from("recurring_tasks")
            .select("id, title")
            .eq("id", n.task_id)
            .single();
          if (recurringTask) {
            enriched.task_info = { id: recurringTask.id, description: recurringTask.title, source_type: "recurring_task" };
          }
        }
      }
      
      enrichedNotifications.push(enriched);
    }

    return new Response(JSON.stringify({ notifications: enrichedNotifications }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("get-notifications error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
