// Deno Deploy (Supabase Edge Function)
// Endpoint: POST /
// Body: { email, full_name, role, school_id }
// Auth: Bearer <access_token> (caller must be super_admin)
// This function invites a new user by sending a password reset email

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
  email?: string;
  full_name?: string;
  role?: string;
  school_id?: string;
  temporary_password?: string;
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
    console.log('[invite_user] incoming request', { method: req.method, hasAuth: !!accessToken });
    if (!accessToken) {
      console.warn('[invite_user] missing authorization header');
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
  console.log('[invite_user] caller validated', { callerId });

    // Fetch profile to check role
    const { data: callerProfile, error: profErr } = await supabaseAdmin
      .from("users")
      .select("id, role")
      .eq("id", callerId)
      .maybeSingle();

    if (profErr || !callerProfile) {
      console.warn('[invite_user] caller profile missing or error', { profErr });
      return jsonResponse(403, { error: "Caller profile not found" });
    }

    if (callerProfile.role !== "super_admin") {
      console.warn('[invite_user] caller not super_admin', { callerId, role: callerProfile.role });
      return jsonResponse(403, { error: "Forbidden: requires super_admin role" });
    }

    const body = (await req.json()) as RequestBody;
    const { email, full_name, role, school_id, temporary_password } = body;

    console.log('[invite_user] request body', { email, role, school_id, hasPassword: !!temporary_password });

    if (!email) {
      console.warn('[invite_user] missing email');
      return jsonResponse(400, { error: "Missing field: email is required" });
    }

    // Validate role if provided
    const validRoles = ["super_admin", "admin", "headmaster", "teacher", "student"];
    const normalizedRole = (role || "student").toLowerCase();
    if (!validRoles.includes(normalizedRole)) {
      console.warn('[invite_user] invalid role', { role: normalizedRole });
      return jsonResponse(400, { error: `Invalid role. Must be one of: ${validRoles.join(", ")}` });
    }

    // Validate temporary_password if provided
    if (temporary_password && temporary_password.length < 6) {
      console.warn('[invite_user] password too short', { length: temporary_password.length });
      return jsonResponse(400, { error: "Password must be at least 6 characters (Supabase requirement)" });
    }

    // Create auth user with a temporary password (if provided) or send password reset email
    const createUserOptions: any = {
      email,
      user_metadata: {
        full_name: full_name || email,
        role: normalizedRole,
        school_id: school_id || null,
      },
    };

    if (temporary_password) {
      // If temporary password is provided, use it and confirm email
      createUserOptions.password = temporary_password;
      createUserOptions.email_confirm = true;
    } else {
      // Otherwise, send password reset email
      createUserOptions.email_confirm = false;
    }

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser(createUserOptions);

    if (createErr || !created?.user) {
      console.error('[invite_user] failed to create auth user', { 
        error: createErr?.message || "Unknown error",
        status: (createErr as any)?.status,
        details: JSON.stringify(createErr)
      });
      return jsonResponse(400, { error: createErr?.message || "Failed to create auth user" });
    }

    const newUserId = created.user.id;

    // Insert into users table (or update if trigger already created it)
    // The handle_new_user trigger may have already created the profile, so we use upsert
    const { data: userRow, error: insertErr } = await supabaseAdmin
      .from("users")
      .upsert({
        id: newUserId,
        email,
        full_name: full_name || email,
        role: normalizedRole,
        school_id: school_id || null,
        is_active: true,
      }, {
        onConflict: 'id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (insertErr) {
      console.error('[invite_user] failed to upsert user profile', {
        error: insertErr.message,
        code: insertErr.code,
        details: JSON.stringify(insertErr),
      });

      // For errors, attempt cleanup of the created auth user and fail.
      try {
        await supabaseAdmin.auth.admin.deleteUser(newUserId);
      } catch (cleanupErr) {
        console.error('[invite_user] failed to delete auth user during cleanup', { cleanupErr });
      }

      return jsonResponse(400, { error: insertErr.message || 'Failed to upsert user profile' });
    }

    console.log('[invite_user] user profile inserted successfully', { newUserId, email });

    // Send password reset email only if no temporary password was provided
    if (!temporary_password) {
      const { error: resetErr } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo: `${url.replace(/\/$/, "")}/auth/reset-password`,
      });

      if (resetErr) {
        console.warn(`Password reset email failed for ${email}:`, resetErr);
        // Don't fail the whole operation, just log it
      }
    }

    // Audit log
    await supabaseAdmin.from("audit_logs").insert({
      user_id: callerId,
      action: "invite_user",
      table_name: "users",
      record_id: newUserId,
      new_data: { email, role: normalizedRole, full_name, school_id },
      user_agent: req.headers.get("user-agent") || undefined,
      ip_address: req.headers.get("x-forwarded-for") || undefined,
    });

    return jsonResponse(200, { user: userRow, message: "Invitation sent" });
  } catch (e: unknown) {
    const msg = (e as any)?.message || String(e);
    return jsonResponse(500, { error: msg || "Unexpected error" });
  }
});
