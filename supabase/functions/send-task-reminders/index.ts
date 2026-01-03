import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    console.log(`Checking for tasks due on: ${tomorrowStr}`);

    // Get all tasks due tomorrow that are not completed
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("*, user_id")
      .eq("planned_end", tomorrowStr)
      .neq("status", "בוצע");

    if (tasksError) {
      console.error("Error fetching tasks:", tasksError);
      throw tasksError;
    }

    console.log(`Found ${tasks?.length || 0} tasks due tomorrow`);

    if (!tasks || tasks.length === 0) {
      return new Response(
        JSON.stringify({ message: "No tasks due tomorrow", sent: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Group tasks by user
    const tasksByUser: Record<string, typeof tasks> = {};
    for (const task of tasks) {
      if (!tasksByUser[task.user_id]) {
        tasksByUser[task.user_id] = [];
      }
      tasksByUser[task.user_id].push(task);
    }

    let emailsSent = 0;

    // Get user emails and send notifications
    for (const [userId, userTasks] of Object.entries(tasksByUser)) {
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
      
      if (userError || !userData?.user?.email) {
        console.error(`Could not get email for user ${userId}:`, userError);
        continue;
      }

      const userEmail = userData.user.email;
      const taskList = userTasks
        .map((t) => `• ${t.description} (${t.task_type === 'work' ? 'עבודה' : 'אישי'})`)
        .join("\n");

      console.log(`Sending email to ${userEmail} for ${userTasks.length} tasks`);

      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Task Reminder <onboarding@resend.dev>",
            to: [userEmail],
            subject: `📅 תזכורת: ${userTasks.length} משימות מגיעות למועד היעד מחר`,
            html: `
              <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #8b5cf6;">🔔 תזכורת משימות</h1>
                <p>שלום,</p>
                <p>המשימות הבאות מגיעות למועד היעד שלהן <strong>מחר</strong>:</p>
                <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                  <pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">${taskList}</pre>
                </div>
                <p>אל תשכח לסיים אותן בזמן! 💪</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
                <p style="color: #6b7280; font-size: 12px;">הודעה זו נשלחה אוטומטית ממערכת ניהול המשימות שלך.</p>
              </div>
            `,
          }),
        });

        if (!emailResponse.ok) {
          const errorData = await emailResponse.text();
          throw new Error(`Resend API error: ${errorData}`);
        }

        console.log("Email sent successfully to:", userEmail);
        emailsSent++;
      } catch (emailError) {
        console.error(`Failed to send email to ${userEmail}:`, emailError);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Sent ${emailsSent} reminder emails`, 
        sent: emailsSent,
        tasksFound: tasks.length 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-task-reminders function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
