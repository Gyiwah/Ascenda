// Deno Deploy (Supabase Edge Function)
// Endpoint: POST /
// Body: { name, email, password, role }
// Auth: Bearer <access_token> (caller must be admin (School Admin))

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
  role?: string; // 'headmaster' | 'teacher'
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

    // Validate caller
    const { data: authedUser, error: authErr } = await supabaseAdmin.auth.getUser(accessToken);
    if (authErr || !authedUser?.user) {
      return jsonResponse(401, { error: "Invalid token" });
    }

    const callerId = authedUser.user.id;

    // Fetch profile to check role and school scope
    const { data: callerProfile, error: profErr } = await supabaseAdmin
      .from("users")
      .select("id, role, school_id")
      .eq("id", callerId)
      .maybeSingle();

    if (profErr || !callerProfile) {
      return jsonResponse(403, { error: "Caller profile not found" });
    }

    if (callerProfile.role !== "admin") {
      return jsonResponse(403, { error: "Forbidden: requires school admin" });
    }

    if (!callerProfile.school_id) {
      return jsonResponse(400, { error: "Caller missing school_id" });
    }

    const body = (await req.json()) as RequestBody;
    const { name, email, password, role } = body;
    
    console.log('[create_school_user] request body', { email, role });
    
    if (!name || !email || !password || !role) {
      console.warn('[create_school_user] missing required fields', { name: !!name, email: !!email, password: !!password, role: !!role });
      return jsonResponse(400, { error: "Missing fields: name, email, password, role are required" });
    }

    const normalized = String(role).toLowerCase();
    if (!["headmaster", "teacher"].includes(normalized)) {
      console.warn('[create_school_user] invalid role', { role: normalized });
      return jsonResponse(400, { error: "Invalid role. Must be 'headmaster' or 'teacher'" });
    }

    // Validate password length
    if (password.length < 6) {
      console.warn('[create_school_user] password too short', { length: password.length });
      return jsonResponse(400, { error: "Password must be at least 6 characters (Supabase requirement)" });
    }

    // Create auth user
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        role: normalized,
        school_id: callerProfile.school_id,
      },
    });
    if (createErr || !created?.user) {
      console.error('[create_school_user] failed to create auth user', {
        error: createErr?.message || "Unknown error",
        status: (createErr as any)?.status,
        details: JSON.stringify(createErr)
      });
      return jsonResponse(400, { error: createErr?.message || "Failed to create auth user" });
    }

    console.log('[create_school_user] auth user created', { userId: created.user.id, email });

    const newUserId = created.user.id;

    // Insert into users table (or update if trigger already created it)
    // The handle_new_user trigger may have already created the profile, so we use upsert
    const { data: userRow, error: insertErr } = await supabaseAdmin
      .from("users")
      .upsert({
        id: newUserId,
        email,
        full_name: name,
        role: normalized,
        school_id: callerProfile.school_id,
        is_active: true,
      }, {
        onConflict: 'id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (insertErr) {
      console.error('[create_school_user] failed to upsert user profile', {
        error: insertErr.message,
        code: insertErr.code,
        details: JSON.stringify(insertErr),
      });
      return jsonResponse(400, { error: insertErr.message || 'Failed to upsert user profile' });
    }

    console.log('[create_school_user] user profile inserted', { userId: newUserId, email });

    // Audit log
    await supabaseAdmin.from("audit_logs").insert({
      user_id: callerId,
      action: "create_user",
      table_name: "users",
      record_id: newUserId,
      new_data: { role: normalized, email, school_id: callerProfile.school_id, full_name: name },
      user_agent: req.headers.get("user-agent") || undefined,
      ip_address: req.headers.get("x-forwarded-for") || undefined,
    });

    return jsonResponse(200, { user: userRow });
  } catch (e: unknown) {
    const msg = (e as any)?.message || String(e);
    return jsonResponse(500, { error: msg || "Unexpected error" });
  }
});


