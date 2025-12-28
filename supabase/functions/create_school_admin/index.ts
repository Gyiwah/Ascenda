// Deno Deploy (Supabase Edge Function)
// Endpoint: POST /
// Body: { name, email, password, school_id }
// Auth: Bearer <access_token> (caller must be super_admin)

// @ts-ignore: remote Deno import (edge function runtime)
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
// @ts-ignore: remote Deno import (edge function runtime)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

// Provide minimal typings for the bundler/linter in a Node dev environment
declare const Deno: {
  env: {
    get(name: string): string | undefined;
  };
};

interface RequestBody {
  name?: string;
  email?: string;
  password?: string;
  school_id?: string;
}

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return jsonResponse(405, { error: "Method not allowed" });
    }

    const accessToken = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!accessToken) {
      return jsonResponse(401, { error: "Missing Authorization header" });
    }

    // Prefer non-reserved secret names (SERVICE_ROLE_KEY / PROJECT_URL). Fall back to SUPABASE_* for local/dev compatibility.
    const serviceKey = Deno.env.get("SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const url = Deno.env.get("PROJECT_URL") || Deno.env.get("SUPABASE_URL");
    if (!serviceKey || !url) {
      return jsonResponse(500, { error: "Service not configured: missing SERVICE_ROLE_KEY or PROJECT_URL" });
    }

    const supabaseAdmin = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });

    // Validate caller and get role + id
    const { data: authedUser, error: authErr } = await supabaseAdmin.auth.getUser(accessToken);
    if (authErr || !authedUser?.user) {
      return jsonResponse(401, { error: "Invalid token" });
    }

    const callerId = authedUser.user.id;

    // Fetch profile to check role and (optionally) school_id
    const { data: callerProfile, error: profErr } = await supabaseAdmin
      .from("users")
      .select("id, role, school_id")
      .eq("id", callerId)
      .maybeSingle();

    if (profErr || !callerProfile) {
      return jsonResponse(403, { error: "Caller profile not found" });
    }

    if (callerProfile.role !== "super_admin") {
      return jsonResponse(403, { error: "Forbidden: requires super_admin" });
    }

    const body = (await req.json()) as RequestBody;
    const { name, email, password, school_id } = body;
    if (!name || !email || !password || !school_id) {
      return jsonResponse(400, { error: "Missing fields: name, email, password, school_id are required" });
    }

    // Create auth user
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        role: 'admin',
        school_id: school_id,
      },
    });
    if (createErr || !created?.user) {
      return jsonResponse(400, { error: createErr?.message || "Failed to create auth user" });
    }

    const newUserId = created.user.id;

    // Insert into users table
    const { data: userRow, error: insertErr } = await supabaseAdmin
      .from("users")
      .insert({
        id: newUserId,
        email,
        full_name: name,
        role: "admin", // School Admin
        school_id,
        is_active: true,
      })
      .select()
      .single();

    if (insertErr) {
      return jsonResponse(400, { error: insertErr.message || "Failed to insert user profile" });
    }

    // Audit log
    await supabaseAdmin.from("audit_logs").insert({
      user_id: callerId,
      action: "create_user",
      table_name: "users",
      record_id: newUserId,
      new_data: { role: "admin", email, school_id, full_name: name },
      user_agent: req.headers.get("user-agent") || undefined,
      ip_address: req.headers.get("x-forwarded-for") || undefined,
    });

    return jsonResponse(200, { user: userRow });
  } catch (e: unknown) {
    const msg = (e as any)?.message || String(e);
    return jsonResponse(500, { error: msg || "Unexpected error" });
  }
});


