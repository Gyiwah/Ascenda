import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ExportRequest {
  classId: string;
  academicYear: string;
  term: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { classId, academicYear, term }: ExportRequest = await req.json();

    const { data: students, error } = await supabase
      .from('students')
      .select(`
        *,
        assessments!inner(*, subjects(name, code))
      `)
      .eq('class_id', classId)
      .eq('assessments.academic_year', academicYear)
      .eq('assessments.term', term);

    if (error) throw error;

    let csv = 'Admission Number,First Name,Last Name,Subject,CA Score,Exam Score,Total,Grade\n';

    students?.forEach((student: any) => {
      student.assessments?.forEach((assessment: any) => {
        csv += `${student.admission_number},${student.first_name},${student.last_name},${assessment.subjects.name},${assessment.ca_score},${assessment.exam_score},${assessment.total_score},${assessment.grade}\n`;
      });
    });

    return new Response(csv, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="class_report_${classId}_${academicYear}_term${term}.csv"`,
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});
