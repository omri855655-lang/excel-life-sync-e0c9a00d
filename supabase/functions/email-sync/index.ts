import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsH = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsH });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsH });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsH });

    const { connectionId } = await req.json();
    if (!connectionId) return new Response(JSON.stringify({ error: "connectionId required" }), { status: 400, headers: corsH });

    // Fetch connection details
    const { data: conn, error: connErr } = await supabase
      .from("email_connections")
      .select("*")
      .eq("id", connectionId)
      .eq("user_id", user.id)
      .single();

    if (connErr || !conn) {
      return new Response(JSON.stringify({ error: "Connection not found" }), { status: 404, headers: corsH });
    }

    // For IMAP connections, we would connect and fetch email headers here.
    // For Gmail/Outlook OAuth, we'd use their APIs with the stored tokens.
    // This is a placeholder implementation that marks the sync as complete.

    // Update last_sync timestamp
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await serviceClient
      .from("email_connections")
      .update({ last_sync: new Date().toISOString() })
      .eq("id", connectionId);

    // TODO: Implement actual IMAP fetching and AI categorization
    // For now, return success with a note
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Email sync placeholder - IMAP/OAuth integration pending",
      emails_processed: 0,
    }), {
      headers: { ...corsH, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsH });
  }
});
