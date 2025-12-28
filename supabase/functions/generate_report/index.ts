// @ts-ignore: remote Deno import (edge function runtime)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

// Provide minimal typings for the bundler/linter in a Node dev environment
declare const Deno: {
  env: {
    get(name: string): string | undefined;
  };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ReportRequest {
  studentId: string;
  academicYear: string;
  term: number;
  format?: 'pdf' | 'json';
}

function generateReportHTML(
  student: any,
  school: any,
  assessments: any[],
  remarks: any,
  academicYear: string,
  term: number
): string {
  const studentName = `${student.first_name} ${student.last_name}`;
  const termNames = ['First', 'Second', 'Third'];
  const termName = termNames[term - 1] || `Term ${term}`;

  const assessmentsRows = assessments
    .map(
      (a) => `
      <tr>
        <td>${a.subjects?.name || a.subjects?.code || 'N/A'}</td>
        <td>${a.ca_score}</td>
        <td>${a.exam_score}</td>
        <td>${a.total_score}</td>
        <td><strong>${a.grade}</strong></td>
      </tr>
    `
    )
    .join('');

  const totalScore = assessments.reduce((sum, a) => sum + a.total_score, 0);
  const averageScore = assessments.length > 0 ? (totalScore / assessments.length).toFixed(2) : '0.00';
  const overallGrade = assessments.length > 0
    ? assessments.reduce((sum, a) => {
        const gradePoints = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 }[a.grade] || 0;
        return sum + gradePoints;
      }, 0) / assessments.length
    : 0;
  const overallGradeLetter =
    overallGrade >= 4.5 ? 'A' : overallGrade >= 3.5 ? 'B' : overallGrade >= 2.5 ? 'C' : overallGrade >= 1.5 ? 'D' : overallGrade >= 0.5 ? 'E' : 'F';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Report Card - ${studentName}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
      color: #333;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .school-name {
      font-size: 24px;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 5px;
    }
    .school-address {
      font-size: 12px;
      color: #666;
    }
    .student-info {
      margin-bottom: 30px;
    }
    .info-row {
      display: flex;
      margin-bottom: 10px;
    }
    .info-label {
      font-weight: bold;
      width: 150px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
    }
    th {
      background-color: #2563eb;
      color: white;
      font-weight: bold;
    }
    tr:nth-child(even) {
      background-color: #f9fafb;
    }
    .summary {
      margin-top: 30px;
      padding: 20px;
      background-color: #f3f4f6;
      border-radius: 8px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      font-size: 16px;
    }
    .summary-label {
      font-weight: bold;
    }
    .remarks {
      margin-top: 30px;
      padding: 15px;
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      border-radius: 4px;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      font-size: 12px;
      color: #666;
      border-top: 1px solid #ddd;
      padding-top: 20px;
    }
    .signature-section {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
    }
    .signature-box {
      width: 200px;
      text-align: center;
      border-top: 1px solid #333;
      padding-top: 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="school-name">${school?.name || 'School Name'}</div>
    ${school?.address ? `<div class="school-address">${school.address}</div>` : ''}
  </div>

  <div class="student-info">
    <div class="info-row">
      <span class="info-label">Student Name:</span>
      <span>${studentName}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Admission Number:</span>
      <span>${student.admission_number}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Class:</span>
      <span>${student.classes?.name || 'N/A'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Academic Year:</span>
      <span>${academicYear}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Term:</span>
      <span>${termName}</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Subject</th>
        <th>CA Score (40)</th>
        <th>Exam Score (60)</th>
        <th>Total (100)</th>
        <th>Grade</th>
      </tr>
    </thead>
    <tbody>
      ${assessmentsRows}
    </tbody>
  </table>

  <div class="summary">
    <div class="summary-row">
      <span class="summary-label">Average Score:</span>
      <span><strong>${averageScore}%</strong></span>
    </div>
    <div class="summary-row">
      <span class="summary-label">Overall Grade:</span>
      <span><strong>${overallGradeLetter}</strong></span>
    </div>
  </div>

  ${remarks ? `
    <div class="remarks">
      <strong>Teacher's Remarks:</strong>
      <p>${remarks.remark_text || 'No remarks provided'}</p>
    </div>
  ` : ''}

  <div class="signature-section">
    <div class="signature-box">
      <div>Class Teacher</div>
    </div>
    <div class="signature-box">
      <div>Headmaster</div>
    </div>
  </div>

  <div class="footer">
    Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
  </div>
</body>
</html>
  `;
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

    const { studentId, academicYear, term, format = 'json' }: ReportRequest = await req.json();

    // Fetch student with class info
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*, classes(name, level)')
      .eq('id', studentId)
      .single();

    if (studentError) throw studentError;

    // Fetch school info
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('*')
      .eq('id', student.school_id)
      .single();

    if (schoolError) throw schoolError;

    // Fetch assessments
    const { data: assessments, error: assessmentsError } = await supabase
      .from('assessments')
      .select('*, subjects(name, code)')
      .eq('student_id', studentId)
      .eq('academic_year', academicYear)
      .eq('term', term)
      .order('subjects(name)');

    if (assessmentsError) throw assessmentsError;

    // Fetch remarks
    const { data: remarks, error: remarksError } = await supabase
      .from('student_remarks')
      .select('*')
      .eq('student_id', studentId)
      .eq('academic_year', academicYear)
      .eq('term', term)
      .maybeSingle();

    if (remarksError) throw remarksError;

    // Return JSON format
    if (format === 'json') {
      const reportData = {
        student,
        school,
        assessments,
        remarks: remarks?.remark_text || 'No remarks provided',
        generatedAt: new Date().toISOString(),
      };

      return new Response(JSON.stringify(reportData), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    }

    // Generate HTML report
    const html = generateReportHTML(
      student,
      school,
      assessments || [],
      remarks,
      academicYear,
      term
    );

    // For PDF, we return HTML that can be converted client-side
    // In production, you might want to use a PDF library like pdfkit or puppeteer
    return new Response(html, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="report_${student.admission_number}_${academicYear}_term${term}.html"`,
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
