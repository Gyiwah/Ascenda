// Deno Deploy (Supabase Edge Function)
// Endpoint: POST /
// Body: { name, code, logo_url?, admin_name, admin_email, admin_password }
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
  code?: string;
  logo_url?: string;
  admin_name?: string;
  admin_email?: string;
  admin_password?: string;
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
    console.log('[create_school_with_admin] incoming request', { method: req.method, hasAuth: !!accessToken });
    if (!accessToken) {
      console.warn('[create_school_with_admin] missing authorization header');
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

    // Validate caller and role
    const { data: authedUser, error: authErr } = await supabaseAdmin.auth.getUser(accessToken);
    if (authErr || !authedUser?.user) {
      return jsonResponse(401, { error: "Invalid token" });
    }

  const callerId = authedUser.user.id;
  console.log('[create_school_with_admin] caller validated', { callerId });

    const { data: callerProfile, error: profErr } = await supabaseAdmin
      .from("users")
      .select("id, role")
      .eq("id", callerId)
      .maybeSingle();

    if (profErr || !callerProfile) {
      console.warn('[create_school_with_admin] caller profile missing or error', { profErr });
      return jsonResponse(403, { error: "Caller profile not found" });
    }
    if (callerProfile.role !== "super_admin") {
      console.warn('[create_school_with_admin] caller not super_admin', { callerId, role: callerProfile.role });
      return jsonResponse(403, { error: "Forbidden: requires super_admin" });
    }

    const body = (await req.json()) as RequestBody;
    const { name, code, logo_url, admin_name, admin_email, admin_password } = body;
    
    console.log('[create_school_with_admin] request body', { name, code, hasLogoUrl: !!logo_url, admin_email });
    
    if (!name || !code || !admin_name || !admin_email || !admin_password) {
      console.warn('[create_school_with_admin] missing required fields', { name: !!name, code: !!code, admin_name: !!admin_name, admin_email: !!admin_email, admin_password: !!admin_password });
      return jsonResponse(400, { error: "Missing fields: name, code, admin_name, admin_email, admin_password are required" });
    }

    // Validate password length
    if (admin_password.length < 6) {
      console.warn('[create_school_with_admin] admin password too short', { length: admin_password.length });
      return jsonResponse(400, { error: "Admin password must be at least 6 characters (Supabase requirement)" });
    }

    // Create school
    const { data: school, error: schoolErr } = await supabaseAdmin
      .from("schools")
      .insert({ name, code, logo_url })
      .select()
      .single();
    if (schoolErr || !school) {
      console.error('[create_school_with_admin] failed to create school', { 
        error: schoolErr?.message,
        code: schoolErr?.code,
        details: JSON.stringify(schoolErr)
      });
      return jsonResponse(400, { error: schoolErr?.message || "Failed to create school" });
    }

    console.log('[create_school_with_admin] school created successfully', { schoolId: school.id, name });

    // Create admin user for this school
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: admin_email,
      password: admin_password,
      email_confirm: true,
      user_metadata: {
        full_name: admin_name,
        role: 'admin',
        school_id: school.id,
      }, 
    });
    if (createErr || !created?.user) {
      console.error('[create_school_with_admin] failed to create admin auth user', { 
        error: createErr?.message || "Unknown error",
        status: (createErr as any)?.status,
        details: JSON.stringify(createErr)
      });
      return jsonResponse(400, { error: createErr?.message || "Failed to create admin auth user" });
    }

    console.log('[create_school_with_admin] admin auth user created', { adminId: created.user.id, email: admin_email });

    const newAdminId = created.user.id;

    // Insert profile
    const { data: adminRow, error: insertErr } = await supabaseAdmin
      .from("users")
      .insert({
        id: newAdminId,
        email: admin_email,
        full_name: admin_name,
        role: "admin",
        school_id: school.id,
        is_active: true,
      })
      .select()
      .single();
    if (insertErr) {
      console.error('[create_school_with_admin] failed to insert admin profile', {
        error: insertErr.message,
        code: insertErr.code,
        details: JSON.stringify(insertErr),
      });

      const isDuplicate = (insertErr as any)?.code === '23505' || /duplicate key value/i.test(insertErr.message || '');
      if (isDuplicate) {
        try {
          const { data: existing, error: fetchErr } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', newAdminId)
            .maybeSingle();

          if (!fetchErr && existing) {
            console.warn('[create_school_with_admin] insert collided - returning existing admin profile', { newAdminId });
            return jsonResponse(200, { user: existing, message: 'Admin already exists' });
          }
        } catch (e) {
          console.error('[create_school_with_admin] error fetching existing admin after duplicate insert', { e });
        }
      }

      return jsonResponse(400, { error: insertErr.message || 'Failed to insert admin profile' });
    }

    console.log('[create_school_with_admin] admin profile inserted successfully', { adminId: newAdminId });

    // Audit logs
    await supabaseAdmin.from("audit_logs").insert([
      {
        user_id: callerId,
        action: "create_school",
        table_name: "schools",
        record_id: school.id,
        new_data: { name, code, logo_url },
        user_agent: req.headers.get("user-agent") || undefined,
        ip_address: req.headers.get("x-forwarded-for") || undefined,
      },
      {
        user_id: callerId,
        action: "create_user",
        table_name: "users",
        record_id: newAdminId,
        new_data: { role: "admin", email: admin_email, school_id: school.id, full_name: admin_name },
        user_agent: req.headers.get("user-agent") || undefined,
        ip_address: req.headers.get("x-forwarded-for") || undefined,
      },
    ]);

    return jsonResponse(200, { school, admin: adminRow });
  } catch (e: unknown) {
    const msg = (e as any)?.message || String(e);
    return jsonResponse(500, { error: msg || "Unexpected error" });
  }
});


