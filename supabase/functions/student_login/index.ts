import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  admission_number: string;
  date_of_birth: string; // Format: YYYY-MM-DD
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key for admin access
    // Students don't have auth sessions, so we use service role to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[student_login] Missing environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Parse request body
    let requestBody: RequestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { admission_number, date_of_birth } = requestBody;

    if (!admission_number || !date_of_birth) {
      return new Response(
        JSON.stringify({ error: 'Admission number and date of birth are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Query student from students table
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('id, first_name, last_name, school_id, class_id, admission_number, date_of_birth, is_active')
      .eq('admission_number', admission_number)
      .eq('date_of_birth', date_of_birth)
      .eq('is_active', true)
      .maybeSingle();

    if (studentError) {
      console.error('[student_login] Database error:', studentError);
      return new Response(
        JSON.stringify({ error: 'Database error occurred' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!student) {
      return new Response(
        JSON.stringify({ error: 'Invalid admission number or date of birth' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Return student data (without creating auth session since students don't use auth.users)
    return new Response(
      JSON.stringify({
        success: true,
        student: {
          id: student.id,
          first_name: student.first_name,
          last_name: student.last_name,
          full_name: `${student.first_name} ${student.last_name}`,
          school_id: student.school_id,
          class_id: student.class_id,
          admission_number: student.admission_number,
          role: 'student', // Students always have role 'student'
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Student login error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

