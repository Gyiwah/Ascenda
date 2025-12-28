// Deno Deploy (Supabase Edge Function)
// Endpoint: POST /
// Body: { imageData: string (base64 or data URL), fileName?: string }
// Auth: Bearer <access_token> (caller must be super_admin or admin)

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

interface UploadLogoRequest {
  imageData: string; // base64 string or data URL
  fileName?: string; // optional custom filename
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
      console.error("[upload_logo] Missing Supabase environment variables");
      return jsonResponse(500, { error: "Server configuration error" });
    }

    // Use service role client to bypass RLS
    const supabaseAdmin = createClient(urlEnv, serviceKey, { auth: { persistSession: false } });

    // Verify user identity using the admin client
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    if (authError || !userData?.user) {
      console.warn('[upload_logo] invalid token or failed to get user', { authError });
      return jsonResponse(401, { error: "Invalid or expired token" });
    }

    const userId = userData.user.id;

    // Get user role from users table using admin client
    const { data: userInfo, error: roleError } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (roleError || !userInfo) {
      console.warn('[upload_logo] user profile lookup failed', { roleError });
      return jsonResponse(404, { error: "User not found in system" });
    }

    const userRole = userInfo.role;

    // Authorization: Only super_admin and admin can upload logos
    if (userRole !== "super_admin" && userRole !== "admin") {
      return jsonResponse(403, {
        error: "You are not authorized to upload logos",
      });
    }

    // Parse request body
    let body: UploadLogoRequest;
    try {
      body = await req.json();
    } catch (err) {
      console.error("[upload_logo] Failed to parse request body", err);
      return jsonResponse(400, { error: "Invalid request body" });
    }

    const { imageData, fileName } = body;

    if (!imageData) {
      return jsonResponse(400, { error: "Image data is required" });
    }

    // Handle base64 data URL (data:image/jpeg;base64,...) or plain base64
    let base64Data = imageData;
    let contentType = "image/jpeg";
    let extension = "jpg";

    if (imageData.startsWith("data:")) {
      // Extract content type and base64 data from data URL
      const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        contentType = matches[1];
        base64Data = matches[2];
        // Extract extension from content type
        if (contentType.includes("png")) {
          extension = "png";
        } else if (contentType.includes("webp")) {
          extension = "webp";
        } else if (contentType.includes("jpeg") || contentType.includes("jpg")) {
          extension = "jpg";
        }
      }
    }

    // Convert base64 to Uint8Array
    let fileData: Uint8Array;
    try {
      const binaryString = atob(base64Data);
      fileData = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        fileData[i] = binaryString.charCodeAt(i);
      }
    } catch (err) {
      console.error("[upload_logo] Failed to decode base64", err);
      return jsonResponse(400, { error: "Invalid image data format" });
    }

    // Generate file path
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1_000_000);
    const finalFileName = fileName || `schools/${timestamp}-${random}.${extension}`;
    const path = finalFileName.startsWith("schools/") ? finalFileName : `schools/${finalFileName}`;

    // Upload to storage using admin client (bypasses RLS)
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("logos")
      .upload(path, fileData, {
        upsert: true,
        cacheControl: "3600",
        contentType: contentType,
      });

    if (uploadError) {
      console.error("[upload_logo] Storage upload error:", uploadError);
      return jsonResponse(500, {
        error: uploadError.message || "Failed to upload logo",
      });
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage.from("logos").getPublicUrl(path);
    if (!urlData || !urlData.publicUrl) {
      console.error("[upload_logo] Failed to get public URL", { path });
      return jsonResponse(500, { error: "Failed to get public URL for uploaded logo" });
    }

    return jsonResponse(200, {
      url: urlData.publicUrl,
      path: path,
    });
  } catch (err) {
    console.error("[upload_logo] Function error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse(500, { error: message });
  }
});

