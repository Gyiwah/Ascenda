import { supabase } from '@/database/client';
import { Student, Assessment, StudentRemark, School, Class, Subject } from '@/types/database';

export interface ReportCardData {
  student: Student;
  school: School;
  class: Class;
  academicYear: string;
  term: number;
  assessments: Array<{
    subject: Subject;
    assessment: Assessment;
    classPosition?: number;
    formPosition?: number;
    teacherInitials?: string;
  }>;
  remarks?: StudentRemark;
  positionInClass?: number;
  formPosition?: number;
  numberOnRoll?: number;
  nextTermReopens?: string;
  promotedTo?: string;
  caMax?: number;
  examMax?: number;
}

export interface GradeBandConfig {
  min: number;
  max: number;
  label: string;
}

/**
 * Get grade meaning based on total score percentage
 */
export function getGradeMeaning(totalScore: number, caMax: number, examMax: number, gradeBands?: GradeBandConfig[] | null): string {
  // Calculate percentage from total score
  const totalMax = caMax + examMax;
  const percentage = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;
  
  // Return based on percentage ranges as specified
  if (percentage >= 80) return 'A';
  if (percentage >= 75) return 'P';
  if (percentage >= 70) return 'AP';
  if (percentage >= 65) return 'D';
  return 'B';
}

/**
 * Calculate student positions in class and form
 */
async function calculatePositions(
  studentId: string,
  classId: string,
  academicYear: string,
  term: number,
  schoolId: string
): Promise<{ classPosition?: number; formPosition?: number; numberOnRoll?: number }> {
  try {
    // Get all students in the class
    const { data: classStudents } = await supabase
      .from('students')
      .select('id')
      .eq('class_id', classId)
      .eq('is_active', true);

    if (!classStudents || classStudents.length === 0) {
      return {};
    }

    // Get all assessments for the class
    const { data: assessments } = await supabase
      .from('assessments')
      .select('student_id, total_score')
      .eq('class_id', classId)
      .eq('academic_year', academicYear)
      .eq('term', term)
      .not('total_score', 'is', null);

    if (!assessments || assessments.length === 0) {
      return { numberOnRoll: classStudents.length };
    }

    // Calculate total scores per student
    const studentTotals: Record<string, number> = {};
    const studentCounts: Record<string, number> = {};

    assessments.forEach((a) => {
      if (!studentTotals[a.student_id]) {
        studentTotals[a.student_id] = 0;
        studentCounts[a.student_id] = 0;
      }
      studentTotals[a.student_id] += a.total_score || 0;
      studentCounts[a.student_id] += 1;
    });

    // Calculate averages
    const studentAverages: Array<{ studentId: string; average: number }> = [];
    Object.keys(studentTotals).forEach((sid) => {
      const count = studentCounts[sid];
      if (count > 0) {
        studentAverages.push({
          studentId: sid,
          average: studentTotals[sid] / count,
        });
      }
    });

    // Sort by average (descending)
    studentAverages.sort((a, b) => b.average - a.average);

    // Find class position
    const classPosition = studentAverages.findIndex((s) => s.studentId === studentId) + 1;

    // Get form position (all classes at same level)
    const { data: currentClass } = await supabase
      .from('classes')
      .select('level')
      .eq('id', classId)
      .single();

    if (currentClass) {
      const { data: formClasses } = await supabase
        .from('classes')
        .select('id')
        .eq('school_id', schoolId)
        .eq('level', currentClass.level)
        .eq('academic_year', academicYear);

      if (formClasses && formClasses.length > 0) {
        const formClassIds = formClasses.map((c) => c.id);
        const { data: formAssessments } = await supabase
          .from('assessments')
          .select('student_id, total_score')
          .in('class_id', formClassIds)
          .eq('academic_year', academicYear)
          .eq('term', term)
          .not('total_score', 'is', null);

        if (formAssessments && formAssessments.length > 0) {
          const formStudentTotals: Record<string, number> = {};
          const formStudentCounts: Record<string, number> = {};

          formAssessments.forEach((a) => {
            if (!formStudentTotals[a.student_id]) {
              formStudentTotals[a.student_id] = 0;
              formStudentCounts[a.student_id] = 0;
            }
            formStudentTotals[a.student_id] += a.total_score || 0;
            formStudentCounts[a.student_id] += 1;
          });

          const formAverages: Array<{ studentId: string; average: number }> = [];
          Object.keys(formStudentTotals).forEach((sid) => {
            const count = formStudentCounts[sid];
            if (count > 0) {
              formAverages.push({
                studentId: sid,
                average: formStudentTotals[sid] / count,
              });
            }
          });

          formAverages.sort((a, b) => b.average - a.average);
          const formPosition = formAverages.findIndex((s) => s.studentId === studentId) + 1;

          return {
            classPosition: classPosition || undefined,
            formPosition: formPosition || undefined,
            numberOnRoll: classStudents.length,
          };
        }
      }
    }

    return {
      classPosition: classPosition || undefined,
      numberOnRoll: classStudents.length,
    };
  } catch (err) {
    console.error('[calculatePositions] Error:', err);
    return {};
  }
}

/**
 * Get subject position in class
 */
async function getSubjectPosition(
  studentId: string,
  subjectId: string,
  classId: string,
  academicYear: string,
  term: number
): Promise<number | undefined> {
  try {
    const { data: assessments } = await supabase
      .from('assessments')
      .select('student_id, total_score')
      .eq('class_id', classId)
      .eq('subject_id', subjectId)
      .eq('academic_year', academicYear)
      .eq('term', term)
      .not('total_score', 'is', null)
      .order('total_score', { ascending: false });

    if (!assessments) return undefined;

    const position = assessments.findIndex((a) => a.student_id === studentId) + 1;
    return position > 0 ? position : undefined;
  } catch (err) {
    console.error('[getSubjectPosition] Error:', err);
    return undefined;
  }
}

/**
 * Get subject position in form
 */
async function getSubjectFormPosition(
  studentId: string,
  subjectId: string,
  classId: string,
  academicYear: string,
  term: number,
  schoolId: string
): Promise<number | undefined> {
  try {
    const { data: currentClass } = await supabase
      .from('classes')
      .select('level')
      .eq('id', classId)
      .single();

    if (!currentClass) return undefined;

    const { data: formClasses } = await supabase
      .from('classes')
      .select('id')
      .eq('school_id', schoolId)
      .eq('level', currentClass.level)
      .eq('academic_year', academicYear);

    if (!formClasses || formClasses.length === 0) return undefined;

    const formClassIds = formClasses.map((c) => c.id);
    const { data: assessments } = await supabase
      .from('assessments')
      .select('student_id, total_score')
      .in('class_id', formClassIds)
      .eq('subject_id', subjectId)
      .eq('academic_year', academicYear)
      .eq('term', term)
      .not('total_score', 'is', null)
      .order('total_score', { ascending: false });

    if (!assessments) return undefined;

    const position = assessments.findIndex((a) => a.student_id === studentId) + 1;
    return position > 0 ? position : undefined;
  } catch (err) {
    console.error('[getSubjectFormPosition] Error:', err);
    return undefined;
  }
}

/**
 * Get teacher initials from teacher_id
 */
async function getTeacherInitials(teacherId: string): Promise<string | undefined> {
  try {
    const { data: teacher } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', teacherId)
      .single();

    if (!teacher?.full_name) return undefined;

    const names = teacher.full_name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return teacher.full_name.substring(0, 2).toUpperCase();
  } catch (err) {
    console.error('[getTeacherInitials] Error:', err);
    return undefined;
  }
}

/**
 * Generate report card data for a student
 */
export async function generateReportCardData(
  studentId: string,
  academicYear: string,
  term: number
): Promise<{ data: ReportCardData | null; error: Error | null }> {
  try {
    // Get student with class info
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*, classes(*)')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      return { data: null, error: studentError || new Error('Student not found') };
    }

    const classData = student.classes as Class;

    // Get school info (includes contact_email and contact_phone from migration)
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('*')
      .eq('id', student.school_id)
      .single();

    if (schoolError || !school) {
      return { data: null, error: schoolError || new Error('School not found') };
    }

    // Get assessment settings
    const caMax = Number((school as any).assessment_ca_max) || 40;
    const examMax = Number((school as any).assessment_exam_max) || 60;

    // Get all assessments for the student
    const { data: assessments, error: assessmentsError } = await supabase
      .from('assessments')
      .select('*, subjects(*)')
      .eq('student_id', studentId)
      .eq('academic_year', academicYear)
      .eq('term', term)
      .order('subjects(name)');

    if (assessmentsError) {
      return { data: null, error: assessmentsError };
    }

    // Get remarks
    const { data: remarks } = await supabase
      .from('student_remarks')
      .select('*')
      .eq('student_id', studentId)
      .eq('academic_year', academicYear)
      .eq('term', term)
      .maybeSingle();

    // Calculate positions
    const positions = await calculatePositions(
      studentId,
      student.class_id,
      academicYear,
      term,
      student.school_id
    );

    // Build assessment data with positions
    const assessmentData = await Promise.all(
      (assessments || []).map(async (assessment) => {
        const subject = assessment.subjects as Subject;
        const classPos = await getSubjectPosition(
          studentId,
          assessment.subject_id,
          student.class_id,
          academicYear,
          term
        );
        const formPos = await getSubjectFormPosition(
          studentId,
          assessment.subject_id,
          student.class_id,
          academicYear,
          term,
          student.school_id
        );
        const teacherInitials = await getTeacherInitials(assessment.teacher_id);

        return {
          subject,
          assessment: assessment as Assessment,
          classPosition: classPos,
          formPosition: formPos,
          teacherInitials,
        };
      })
    );

    return {
      data: {
        student: student as Student,
        school: school as School,
        class: classData,
        academicYear,
        term,
        assessments: assessmentData,
        remarks: remarks as StudentRemark | undefined,
        positionInClass: positions.classPosition,
        formPosition: positions.formPosition,
        numberOnRoll: positions.numberOnRoll,
        nextTermReopens: undefined, // Can be set from school settings
        promotedTo: undefined, // Can be set from promotion history
        caMax,
        examMax,
      },
      error: null,
    };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Get grade bands from school config
 */
export async function getSchoolGradeBands(schoolId: string): Promise<GradeBandConfig[] | null> {
  try {
    const { data: school } = await supabase
      .from('schools')
      .select('assessment_grade_config')
      .eq('id', schoolId)
      .single();

    if (!school?.assessment_grade_config || !Array.isArray(school.assessment_grade_config)) {
      return null;
    }

    return school.assessment_grade_config.map((band: any) => ({
      min: Number(band.min) || 0,
      max: Number(band.max) || 0,
      label: String(band.label ?? ''),
    }));
  } catch (err) {
    console.error('[getSchoolGradeBands] Error:', err);
    return null;
  }
}


