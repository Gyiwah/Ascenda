import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface BulkPromoteRequest {
  class_id: string;
  academic_year: string;
  exclude_student_ids?: string[];
  target_class_id?: string;
}

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  try {
    const accessToken = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (!accessToken) {
      return jsonResponse(401, { error: 'Missing Authorization header' });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('PROJECT_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return jsonResponse(500, { error: 'Server configuration error' });
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceKey,
      { auth: { persistSession: false } }
    );

    // Verify user identity
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    if (authError || !userData?.user) {
      return jsonResponse(401, { error: 'Invalid or expired token' });
    }

    const userId = userData.user.id;

    // Get user role
    const { data: userInfo, error: roleError } = await supabaseAdmin
      .from('users')
      .select('role, school_id')
      .eq('id', userId)
      .maybeSingle();

    if (roleError || !userInfo || userInfo.role !== 'headmaster') {
      return jsonResponse(403, { error: 'Only headmasters can perform bulk promotions' });
    }

    const body: BulkPromoteRequest = await req.json();
    const { class_id, academic_year, exclude_student_ids = [], target_class_id } = body;

    if (!class_id || !academic_year) {
      return jsonResponse(400, { error: 'class_id and academic_year are required' });
    }

    // Get all students in the class
    const { data: students, error: studentsError } = await supabaseAdmin
      .from('students')
      .select('id, class_id')
      .eq('class_id', class_id)
      .eq('is_active', true);

    if (studentsError) {
      return jsonResponse(400, { error: 'Failed to fetch students' });
    }

    if (!students || students.length === 0) {
      return jsonResponse(400, { error: 'No students found in class' });
    }

    // Filter out excluded students
    const studentsToPromote = students.filter(s => !exclude_student_ids.includes(s.id));

    if (studentsToPromote.length === 0) {
      return jsonResponse(400, { error: 'No students to promote after exclusions' });
    }

    // Build promotion records
    const promotionRecords = studentsToPromote.map((student) => ({
      student_id: student.id,
      from_class_id: class_id,
      to_class_id: target_class_id || null,
      academic_year: academic_year,
      status: target_class_id ? ('promoted' as const) : ('repeated' as const),
      promoted_by: userId,
      notes: null,
    }));

    // Insert promotion history records
    const { data: promotionHistory, error: historyError } = await supabaseAdmin
      .from('promotion_history')
      .insert(promotionRecords)
      .select();

    if (historyError) {
      console.error('[bulk_promote] Error inserting promotion history:', historyError);
      return jsonResponse(400, { error: 'Failed to create promotion records' });
    }

    // Update student class_ids if promoting (not repeating)
    if (target_class_id) {
      const studentIds = studentsToPromote.map(s => s.id);
      const { error: updateError } = await supabaseAdmin
        .from('students')
        .update({ class_id: target_class_id })
        .in('id', studentIds);

      if (updateError) {
        console.error('[bulk_promote] Error updating student classes:', updateError);
        // Don't fail - promotion history is already recorded
      }
    }

    // Log to audit_logs
    await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      action: 'BULK_PROMOTE',
      table_name: 'promotion_history',
      record_id: null,
      old_data: { class_id, student_count: students.length },
      new_data: { promoted_count: studentsToPromote.length, target_class_id },
    });

    return jsonResponse(200, {
      success: true,
      count: studentsToPromote.length,
      excluded_count: exclude_student_ids.length,
      promotions: promotionHistory,
    });
  } catch (error: any) {
    console.error('[bulk_promote] Function error:', error);
    return jsonResponse(500, { error: error.message || 'Unknown error occurred' });
  }
});
