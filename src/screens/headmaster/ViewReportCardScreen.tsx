// ViewReportCardScreen.tsx
import React, { useState, useMemo, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Share as RNShare, Alert, Linking, Platform } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/utils/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { useToast } from '@/components/ToastContext';
import { useAppTheme } from '@/theme/@ThemeProvider';
import { TerminalReportCard } from '@/components/reports/TerminalReportCard';
import { generateReportCardData, getSchoolGradeBands, ReportCardData, getGradeMeaning } from '@/api/headmaster/reportCards';
import { Download, Share2, ArrowLeft } from 'lucide-react-native';

// Expo print/share — install: expo install expo-print expo-sharing
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function ViewReportCardScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const studentId = route.params?.studentId;
  const studentName = route.params?.studentName || 'Student';
  const currentYear = new Date().getFullYear();
  const defaultAcademicYear = `${currentYear}/${currentYear + 1}`;
  const academicYear = route.params?.academicYear || defaultAcademicYear;
  const term = route.params?.term || 1;

  const [reportData, setReportData] = useState<ReportCardData | null>(null);
  const [gradeBands, setGradeBands] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const printingRef = useRef(false);

  const loadReportData = useCallback(async () => {
    if (!studentId) return;

    setLoading(true);
    try {
      // Dynamic data generation
      const { data, error } = await generateReportCardData(studentId, academicYear, term);
      if (error) throw error;
      setReportData(data);

      // Load school grade bands dynamically
      if (user?.school_id) {
        const bands = await getSchoolGradeBands(user.school_id);
        setGradeBands(bands);
      }
    } catch (err: any) {
      console.error('[ViewReportCardScreen] Error loading report:', err);
      showToast('Failed to load report card', 'error');
    } finally {
      setLoading(false);
    }
  }, [studentId, academicYear, term, showToast, user?.school_id]);

  useFocusEffect(
    useCallback(() => {
      if (studentId && user?.school_id) {
        loadReportData();
      }
    }, [loadReportData, studentId, user?.school_id])
  );

  // Create PDF from HTML and return file URI
  const createPdf = async (data: ReportCardData) => {
    const html = generateReportHTML(data, gradeBands);
    try {
      const { uri } = await Print.printToFileAsync({ html });
      return uri;
    } catch (err) {
      console.error('[ViewReportCardScreen] createPdf error', err);
      throw err;
    }
  };

  const handleShare = async () => {
    if (!reportData) return;
    setGenerating(true);

    try {
      // Try to generate PDF first
      let pdfUri: string | undefined;
      try {
        pdfUri = await createPdf(reportData);
      } catch (err) {
        console.warn('PDF generation failed, will share as text fallback', err);
      }

      if (pdfUri) {
        if (Platform.OS === 'web') {
          // Web: open print dialog as a reliable share/print flow
          const html = generateReportHTML(reportData, gradeBands);
          await Print.printAsync({ html });
        } else {
          const shareAvailable = await Sharing.isAvailableAsync();
          if (shareAvailable) {
            await Sharing.shareAsync(pdfUri, {
              mimeType: 'application/pdf',
              dialogTitle: `Report Card - ${studentName}`,
            });
          } else {
            // Native fallback: OS share sheet via react-native-share
            await RNShare.share({
              url: pdfUri,
              title: `Report Card - ${studentName}`,
              message: `Report Card for ${studentName}.`,
            });
          }
        }
        showToast('Report card shared', 'success');
      } else {
        // Fallback: share text summary
        const message = `Report Card for ${studentName}\nClass: ${reportData.class.name}\nTerm: ${reportData.term}\nAcademic Year: ${reportData.academicYear}`;
        await RNShare.share({ message, title: `Report Card - ${studentName}` });
        showToast('Report card shared (text)', 'success');
      }
    } catch (err: any) {
      console.error('[ViewReportCardScreen] Error sharing:', err);
      showToast('Failed to share report card', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = async () => {
    if (!reportData) return;

    // Prevent concurrent print requests
    if (printingRef.current) {
      showToast('A print request is already in progress', 'info');
      return;
    }

    printingRef.current = true;
    setGenerating(true);
    try {
      // Preferred: print directly from HTML
      const html = generateReportHTML(reportData, gradeBands);

      // Expo Print: prints or opens native print/save dialog
      await Print.printAsync({ html });
      showToast('Print dialog opened', 'success');
    } catch (err: any) {
      console.error('[ViewReportCardScreen] Error printing:', err);
      showToast('Failed to print report card', 'error');
    } finally {
      printingRef.current = false;
      setGenerating(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  if (!reportData) {
    return (
      <View style={styles.container}>
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>Failed to load report card data</Text>
          <Button title="Retry" onPress={loadReportData} style={styles.retryButton} />
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Actions */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>{studentName} - Report Card</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={handleShare} style={styles.actionButton} disabled={generating}>
            <Share2 size={20} color={theme.colors.primary.base} />
          </Pressable>
          <Pressable onPress={handlePrint} style={styles.actionButton} disabled={generating}>
            <Download size={20} color={theme.colors.primary.base} />
          </Pressable>
        </View>
      </View>

      {/* Report Card */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <TerminalReportCard data={reportData} />
      </ScrollView>
    </View>
  );
}

/**
 * Get grade meaning text based on grade letter
 */
function getGradeMeaningText(grade: string): string {
  const gradeMap: Record<string, string> = {
    'A': 'Advance',
    'P': 'Proficient',
    'AP': 'Approaching Proficiency',
    'D': 'Developing',
    'B': 'Beginning',
  };
  return gradeMap[grade.toUpperCase()] || '';
}

/**
 * Generate printable HTML for the report card (used for print/pdf)
 * This is dynamic and reads entirely from `data`
 */
function generateReportHTML(data: ReportCardData, gradeBands?: any[] | null): string {
  const termNames = ['ONE', 'TWO', 'THREE'];
  const termName = termNames[data.term - 1] || `TERM ${data.term}`;
  const studentName = `${data.student.first_name} ${data.student.last_name}`;

  const assessmentsRows = (data.assessments || [])
    .map((item) => {
      const caScore = item.assessment.ca_score ?? null;
      const examScore = item.assessment.exam_score ?? null;
      const totalScore = item.assessment.total_score ?? null;
      const grade = item.assessment.grade ?? '';
      // Get remark text from grade letter
      const remark = getGradeMeaningText(grade);

      const caHtml = caScore != null ? Number(caScore).toFixed(1) : '';
      const examHtml = examScore != null ? Number(examScore).toFixed(1) : '';
      const totalHtml = totalScore != null ? Number(totalScore).toFixed(1) : '';

      return `
        <tr>
          <td class="col-subject">${escapeHtml(item.subject.name || '')}</td>
          <td class="col-score">${caHtml}</td>
          <td class="col-score">${examHtml}</td>
          <td class="col-score">${totalHtml}</td>
          <td class="col-grade">${escapeHtml(grade)}</td>
          <td class="col-pos">${escapeHtml(String(item.classPosition ?? ''))}</td>
          <td class="col-teacher">${escapeHtml(item.teacherInitials ?? '')}</td>
          <td class="col-remark">${escapeHtml(remark)}</td>
        </tr>`;
    })
    .join('');

  const contact = data.school?.address ? escapeHtml(data.school.address).replace(/\n/g, '<br/>') : '';
  const phone = data.school?.contact_phone ? `TELEPHONE: ${escapeHtml(data.school.contact_phone)}` : '';
  const email = data.school?.contact_email ? `Email: ${escapeHtml(data.school.contact_email)}` : '';

  return `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8"/>
      <meta name="viewport" content="width=device-width,initial-scale=1"/>
      <title>Terminal Report - ${escapeHtml(studentName)}</title>
      <style>
        @media print { @page { margin: 12mm; } }
        body { font-family: Arial, Helvetica, sans-serif; color: #000; padding: 14px; font-size: 12px; }
        .ges-header { text-align:center; font-weight:700; font-size:24px; letter-spacing:1px; margin-bottom:12px; text-transform:uppercase; }
        .header { display:flex; align-items:center; justify-content:space-between; margin-bottom:6px; }
        .logo { width:72px; height:72px; background:#f4f4f4; border:1px solid #ddd; display:inline-block; }
        .header-center { text-align:center; flex:1; padding:0 8px; }
        .school-name { font-weight:700; font-size:18px; letter-spacing:0.6px; text-transform:uppercase; margin-bottom:4px; }
        .contact { font-size:11px; color:#222; margin-bottom:6px; }
        .title { display:inline-block; background:#000; color:#fff; padding:8px 14px; font-weight:700; margin:6px 0; }
        .student { font-weight:700; margin-top:6px; font-size:14px; }
        .student-info { display:flex; justify-content:space-between; margin:10px 0 14px 0; font-size:12px; }
        .student-info div { flex-basis:48%; }
        table { width:100%; border-collapse:collapse; table-layout:fixed; }
        th, td { border:1px solid #000; padding:6px 8px; font-size:11px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        thead th { background:#f6f6f6; font-weight:700; text-align:center; }
        .col-subject { width:28%; text-align:left; }
        .col-score { width:9%; text-align:center; }
        .col-grade { width:7%; text-align:center; font-weight:700; }
        .col-pos { width:9%; text-align:center; }
        .col-teacher { width:9%; text-align:center; }
        .col-remark { width:9%; text-align:center; }
        .footer { margin-top:12px; font-size:11px; }
        .signature { margin-top:14px; }
        .legend { margin-top:8px; border:1px solid #000; padding:6px; }
      </style>
    </head>
    <body>
      <div class="ges-header">GHANA EDUCATION SERVICE</div>
      <div class="header">
        <div class="logo">
          ${data.school?.logo_url ? `<img src="${escapeHtml(data.school.logo_url)}" alt="School Logo" style="width:72px;height:72px;object-fit:cover;border-radius:50%;" />` : ''}
        </div>
        <div class="header-center">
          <div class="school-name">${escapeHtml((data.school?.name || '').toUpperCase())}</div>
          <div class="contact">${contact}${contact && (phone || email) ? '<br />' : ''}${phone} ${email}</div>
          <div class="title">TERMINAL REPORT</div>
          <div class="student">&lt;&lt; ${escapeHtml(studentName.toUpperCase())} &gt;&gt;</div>
        </div>
        <div style="width:72px"></div>
      </div>

      <div class="student-info">
        <div>
          <div><strong>CLASS:</strong> ${escapeHtml(data.class?.name || '')}</div>
          <div><strong>POSITION IN CLASS:</strong> ${escapeHtml(String(data.positionInClass ?? ''))}</div>
          <div><strong>NEXT TERM RE-OPENS:</strong> ${escapeHtml(String(data.nextTermReopens ?? ''))}</div>
        </div>
        <div style="text-align:right;">
          <div><strong>ACADEMIC YEAR:</strong> ${escapeHtml(String(data.academicYear || ''))}</div>
          <div><strong>NUMBER ON ROLL:</strong> ${escapeHtml(String(data.numberOnRoll ?? ''))}</div>
          <div><strong>ACADEMIC TERM:</strong> ${escapeHtml(termName)}</div>
          <div><strong>FORM POSITION:</strong> ${escapeHtml(String(data.formPosition ?? ''))}</div>
          <div><strong>PROMOTED TO:</strong> ${escapeHtml(String(data.promotedTo ?? 'N/A'))}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th class="col-subject">SUBJECTS</th>
            <th class="col-score">CLASS SCORE (50%)</th>
            <th class="col-score">EXAM SCORE (50%)</th>
            <th class="col-score">TOTAL SCORE (100%)</th>
            <th class="col-grade">GRADE</th>
            <th class="col-pos">SUBJ. POS. CLASS</th>
            <th class="col-teacher">TEACHER</th>
            <th class="col-remark">REMARK</th>
          </tr>
        </thead>
        <tbody>
          ${assessmentsRows}
        </tbody>
      </table>

      <div class="footer">
        <div class="signature"><strong>HEADTEACHER'S SIGNATURE</strong></div>
        <div class="legend">
          <div><strong>GRADING SCALE</strong></div>
          <div>80 – 100% = A (Advance)</div>
          <div>75 – 79% = P (Proficient)</div>
          <div>70 – 74% = AP (Approaching Proficiency)</div>
          <div>65 – 69% = D (Developing)</div>
          <div>64 & Below = B (Beginning)</div>
        </div>
      </div>
    </body>
  </html>
  `;
}

// small helper to avoid HTML injection in generated HTML
function escapeHtml(input: any) {
  if (input === null || input === undefined) return '';
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const makeStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.secondary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface.primary,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: {
      padding: theme.spacing.xs,
    },
    headerTitle: {
      flex: 1,
      fontSize: theme.typography.fontSizes.lg,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.text.primary,
      marginLeft: theme.spacing.sm,
    },
    headerActions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    actionButton: {
      padding: theme.spacing.xs,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: theme.spacing.xl,
    },
    errorCard: {
      margin: theme.spacing.lg,
      padding: theme.spacing.xl,
      alignItems: 'center',
    },
    errorText: {
      fontSize: theme.typography.fontSizes.base,
      color: theme.colors.error.base,
      marginBottom: theme.spacing.md,
      textAlign: 'center',
    },
    retryButton: {
      marginTop: theme.spacing.md,
    },
  });
