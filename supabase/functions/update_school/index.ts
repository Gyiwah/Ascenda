// Deno Deploy (Supabase Edge Function)
// Endpoint: POST /
// Body: { schoolId, name?, code?, address?, logo_url?, is_active? }
// Auth: Bearer <access_token> (caller must be super_admin or admin updating their own school)

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

interface UpdateSchoolRequest {
  schoolId: string;
  name?: string;
  code?: string;
  address?: string;
  logo_url?: string;
  is_active?: boolean;
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
    const urlEnv = Deno.env.get("PROJECT_URL") || Deno.env.get("SUPABASE_URL");
    if (!serviceKey || !urlEnv) {
      console.error("[update_school] Missing Supabase environment variables");
      return jsonResponse(500, { error: "Server configuration error" });
    }

    // Use service role client to validate caller and read user profile (bypass RLS safely on server)
    const supabaseAdmin = createClient(urlEnv, serviceKey, { auth: { persistSession: false } });

    // Verify user identity using the admin client
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    if (authError || !userData?.user) {
      console.warn('[update_school] invalid token or failed to get user', { authError });
      return jsonResponse(401, { error: "Invalid or expired token" });
    }

    const userId = userData.user.id;

    // Get user role from users table using admin client so we can read regardless of RLS
    const { data: userInfo, error: roleError } = await supabaseAdmin
      .from("users")
      .select("role, school_id")
      .eq("id", userId)
      .maybeSingle();

    if (roleError || !userInfo) {
      console.warn('[update_school] user profile lookup failed', { roleError });
      return jsonResponse(404, { error: "User not found in system" });
    }

    const userRole = userInfo.role;
    const userSchoolId = userInfo.school_id;

    // Parse request body
    const body: UpdateSchoolRequest = await req.json();
    const { schoolId, ...updates } = body;

    if (!schoolId) {
      return jsonResponse(400, { error: "School ID is required" });
    }

    // Authorization: Super admin can update any school, admins can only update their own school
    if (userRole !== "super_admin") {
      if (userRole !== "admin" || userSchoolId !== schoolId) {
        return jsonResponse(403, {
          error: "You are not authorized to update this school",
        });
      }
    }

    // Update school using the admin client (service role) which bypasses RLS
    const { data, error } = await supabaseAdmin
      .from("schools")
      .update(updates)
      .eq("id", schoolId)
      .select()
      .single();

    if (error) {
      console.error("[update_school] Update error:", error);
      return jsonResponse(400, {
        error: error.message || "Failed to update school",
      });
    }

    return jsonResponse(200, data || {});
  } catch (err) {
    console.error("[update_school] Function error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse(500, { error: message });
  }
});
