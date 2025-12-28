import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Image } from 'react-native';
import { useAppTheme } from '@/theme/@ThemeProvider';
import { ReportCardData } from '@/api/headmaster/reportCards';

// A4 dimensions in points (at 72 DPI)
// A4: 210mm x 297mm = 8.27" x 11.69" = 595.44pt x 842.04pt
const A4_WIDTH = 595;
const A4_HEIGHT = 842;
const A4_MARGIN = 20; // Margin for printing

interface TerminalReportCardProps {
  data: ReportCardData;
}

export function TerminalReportCard({ data }: TerminalReportCardProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  // PDF generation removed: Download button and handler were intentionally removed

  const termNames = ['ONE', 'TWO', 'THREE'];
  const termName = termNames[data.term - 1] || `TERM ${data.term}`;
  const studentName = `${data.student.first_name} ${data.student.last_name}`;
  const academicRemark = (data as any)?.remarks?.academic_remark;

  // Format contact information
  const formatContactInfo = () => {
    const parts = [];
    if (data.school.address) {
      // Try to extract P.O. Box if present
      const addressParts = data.school.address.split('\n');
      parts.push(...addressParts);
    }
    if (data.school.contact_phone) {
      parts.push(`TELEPHONE: ${data.school.contact_phone}`);
    }
    if (data.school.contact_email) {
      parts.push(`Email: ${data.school.contact_email}`);
    }
    return parts;
  };

  const contactInfo = formatContactInfo();

  const screenWidth = Dimensions.get('window').width;
  const a4Width = Math.min(screenWidth - 32, A4_WIDTH - A4_MARGIN * 2); // Account for margins

  return (
    <View style={styles.a4Container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.contentContainer, { width: a4Width }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerTop}>
          <Text style={styles.schoolName}>{data.school.name?.toUpperCase() || '{{SCHOOL NAME}}'}</Text>
        </View>
        <View style={styles.headerRow}>
          {/* Logo Left */}
          <View style={styles.logoContainer}>
            {data.school.logo_url ? (
              <Image source={{ uri: data.school.logo_url }} style={styles.logoImage} />
            ) : (
              <View style={styles.logoPlaceholder} />
            )}
          </View>

          {/* Contact Information spanning center to right */}
          <View style={styles.contactInfoContainerFull}>
            {contactInfo.length > 0 ? (
              contactInfo.map((line, index) => (
                <Text key={index} style={styles.contactLine}>
                  {line}
                </Text>
              ))
            ) : (
              <>
                <Text style={styles.contactLine}>P. O. BOX BX 117 FNT</Text>
                <Text style={styles.contactLine}>ACCRA - GHANA</Text>
                <Text style={styles.contactLine}>TELEPHONE: 0545 437 215</Text>
                <Text style={styles.contactLine}>Email: gaf_tech@yahoo.com</Text>
              </>
            )}
          </View>
        </View>

        {/* Title and student name */}
        <View style={styles.titleRow}>
          <View style={styles.titleBox}>
            <Text style={styles.titleText}>TERMINAL REPORT</Text>
          </View>
        </View>
        <View style={styles.studentRow}>
          <Text style={styles.studentNamePlaceholder}>{studentName.toUpperCase()}</Text>
        </View>

        {/* Student Information Section */}
        <View style={styles.studentInfoSection}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Number on Roll</Text>
            <Text style={styles.infoValue}>{data.numberOnRoll ?? '—'}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Next Term Re-opens</Text>
            <Text style={styles.infoValue}>{data.nextTermReopens || '—'}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Promoted To</Text>
            <Text style={styles.infoValue}>{data.promotedTo || 'N/A'}</Text>
          </View>
        </View>

      {/* Subjects Table */}
      <View style={styles.tableContainer}>
        <View style={styles.table}>
          {/* Table Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, styles.tableHeaderCell, styles.colSubject]}>SUBJECTS</Text>
            <Text style={[styles.tableCell, styles.tableHeaderCell, styles.colScore]} allowFontScaling={false}>
              {'CA\u00A0SCORE'} ({data.caMax && data.examMax ? Math.round((data.caMax / (data.caMax + data.examMax)) * 100) : 50}%)
            </Text>
            <Text style={[styles.tableCell, styles.tableHeaderCell, styles.colScore]} allowFontScaling={false}>
              {'EXAM\u00A0SCORE'} ({data.caMax && data.examMax ? Math.round((data.examMax / (data.caMax + data.examMax)) * 100) : 50}%)
            </Text>
            <Text style={[styles.tableCell, styles.tableHeaderCell, styles.colScore]} allowFontScaling={false}>
              {'TOTAL\u00A0SCORE\u00A0(100%)'}
            </Text>
            <View style={[styles.tableCell, styles.tableHeaderCell, styles.colGrade, styles.verticalTextContainer]}>
              <Text style={styles.verticalText}>{'GRADE'}</Text>
            </View>
            <Text style={[styles.tableCell, styles.tableHeaderCell, styles.colPosition]} allowFontScaling={false}>{'SUBJ.\u00A0POS.\u00A0CLASS'}</Text>
            <View style={[styles.tableCell, styles.tableHeaderCell, styles.colTeacher, styles.verticalTextContainer]}>
              <Text style={styles.verticalText}>{'TEACHER'}</Text>
            </View>
          </View>

          {/* Table Rows */}
          {data.assessments.map((item, index) => {
            const caScore = item.assessment.ca_score ?? null;
            const examScore = item.assessment.exam_score ?? null;
            const totalScore = item.assessment.total_score ?? null;
            const grade = item.assessment.grade || '';

            return (
              <View key={item.assessment.id || index} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.colSubject]} numberOfLines={1}>{item.subject.name}</Text>
                <Text style={[styles.tableCell, styles.colScore]}>
                  {caScore != null ? caScore.toFixed(1) : '—'}
                </Text>
                <Text style={[styles.tableCell, styles.colScore]}>
                  {examScore != null ? examScore.toFixed(1) : '—'}
                </Text>
                <Text style={[styles.tableCell, styles.colScore]}>
                  {totalScore != null ? totalScore.toFixed(1) : '—'}
                </Text>
                <Text style={[styles.tableCell, styles.colGrade, styles.gradeText]}>{grade || ''}</Text>
                <Text style={[styles.tableCell, styles.colPosition]}>
                  {item.classPosition ? `${item.classPosition}` : '—'}
                </Text>
                <Text style={[styles.tableCell, styles.colTeacher]}>
                  {item.teacherInitials || '—'}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Behavior/Character Section */}
      <View style={styles.behaviorSection}>
        <View style={styles.behaviorRow}>
          <Text style={styles.behaviorLabel}>INTEREST</Text>
        </View>
        <View style={styles.behaviorRow}>
          <Text style={styles.behaviorLabel}>CONDUCT</Text>
        </View>
        <View style={styles.behaviorRow}>
          <Text style={styles.behaviorLabel}>ATTITUDE</Text>
        </View>
      </View>

      {/* Remarks Section */}
      <View style={styles.remarksSection}>
        <View style={styles.remarkRow}>
          <Text style={styles.remarkLabel}>CLASS TEACHER&apos;S REMARK</Text>
          <Text style={styles.remarkValue}>
            {data.remarks?.remark_text || '—'}
          </Text>
        </View>
        <View style={styles.remarkRow}>
          <Text style={styles.remarkLabel}>ACADEMIC REMARK</Text>
          <Text style={styles.remarkValue}>{academicRemark || '—'}</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.signatureSection}>
          <Text style={styles.signatureLabel}>HEADTEACHER&apos;S SIGNATURE</Text>
          <View style={styles.signatureLine} />
        </View>

        {/* Grade Legend - Table Format */}
        <View style={styles.gradeLegend}>
          <View style={styles.legendTable}>
            {/* Header Row */}
            <View style={[styles.legendTableRow, styles.legendTableHeader]}>
              <Text style={[styles.legendTableCell, styles.legendTableHeaderCell]}>80 – 100%</Text>
              <Text style={[styles.legendTableCell, styles.legendTableHeaderCell]}>75 – 79%</Text>
              <Text style={[styles.legendTableCell, styles.legendTableHeaderCell]}>70 – 74%</Text>
              <Text style={[styles.legendTableCell, styles.legendTableHeaderCell]}>65 – 69%</Text>
              <Text style={[styles.legendTableCell, styles.legendTableHeaderCell]}>64 & Below</Text>
            </View>
            {/* Grade Row */}
            <View style={styles.legendTableRow}>
              <Text style={styles.legendTableCell}>A</Text>
              <Text style={styles.legendTableCell}>P</Text>
              <Text style={styles.legendTableCell}>AP</Text>
              <Text style={styles.legendTableCell}>D</Text>
              <Text style={styles.legendTableCell}>B</Text>
            </View>
            {/* Meaning Row */}
            <View style={[styles.legendTableRow, styles.legendTableRowLast]}>
              <Text style={styles.legendTableCell}>Advance</Text>
              <Text style={styles.legendTableCell}>Proficient</Text>
              <Text style={styles.legendTableCell}>Approaching Proficiency</Text>
              <Text style={styles.legendTableCell}>Developing</Text>
              <Text style={styles.legendTableCell}>Beginning</Text>
            </View>
          </View>
        </View>
      </View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (theme: any) =>
  StyleSheet.create({
    a4Container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
      alignItems: 'center',
      justifyContent: 'flex-start',
    },
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
      width: '100%',
    },
    contentContainer: {
      padding: A4_MARGIN,
      paddingBottom: A4_MARGIN * 2,
      backgroundColor: '#FFFFFF',
      minHeight: A4_HEIGHT - A4_MARGIN * 2,
      alignSelf: 'center',
    },
    headerTop: {
      alignItems: 'center',
      marginBottom: 6,
    },
    schoolName: {
      fontSize: 16,
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text.primary,
      marginBottom: 4,
      textAlign: 'center',
      letterSpacing: 0.5,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 16,
      paddingHorizontal: 0,
    },
    logoContainer: {
      width: 70,
      alignItems: 'center',
      paddingRight: 4,
    },
    logoPlaceholder: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: theme.colors.surface.secondary,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    logoImage: {
      width: 60,
      height: 60,
      borderRadius: 30,
      resizeMode: 'cover',
    },
    contactInfoContainerFull: {
      flex: 1,
      alignItems: 'flex-end',
      paddingLeft: 8,
    },
    contactLine: {
      fontSize: 9,
      color: theme.colors.text.primary,
      textAlign: 'right',
      marginBottom: 2,
      lineHeight: 11,
    },
    titleRow: {
      alignItems: 'center',
      marginTop: 4,
    },
    titleBox: {
      backgroundColor: theme.colors.text.primary,
      paddingVertical: 8,
      paddingHorizontal: 16,
      marginVertical: 8,
      width: '100%',
      alignItems: 'center',
    },
    titleText: {
      fontSize: 14,
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.background.primary,
      letterSpacing: 1,
    },
    studentRow: {
      alignItems: 'center',
      marginTop: 4,
      marginBottom: 8,
    },
    studentNamePlaceholder: {
      fontSize: 13,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.text.primary,
      marginTop: 6,
    },
    studentInfoSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
      gap: 10,
    },
    infoCard: {
      flex: 1,
      padding: 10,
      borderRadius: 12,
      backgroundColor: theme.colors.surface.secondary,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    infoLabel: {
      fontSize: 10,
      color: theme.colors.text.secondary,
      marginBottom: 6,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    infoValue: {
      fontSize: 12,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.text.primary,
    },
    tableContainer: {
      marginBottom: 16,
    },
    table: {
      borderWidth: 1,
      borderColor: theme.colors.text.primary,
      borderRadius: 0,
    },
    tableRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.text.primary,
      minHeight: 28,
    },
    tableHeader: {
      backgroundColor: theme.colors.surface.secondary,
    },
    tableCell: {
      paddingVertical: 4,
      paddingHorizontal: 3,
      fontSize: 9,
      color: theme.colors.text.primary,
      borderRightWidth: 1,
      borderRightColor: theme.colors.text.primary,
      textAlignVertical: 'center',
      lineHeight: 11,
      flexWrap: 'nowrap',
    },
    tableHeaderCell: {
      fontWeight: theme.typography.fontWeights.bold,
      backgroundColor: theme.colors.surface.secondary,
      textAlign: 'center',
      fontSize: 8,
      flexWrap: 'nowrap',
    },
    colSubject: {
      flex: 2.5,
    },
    colScore: {
      flex: 1.2,
      textAlign: 'center',
    },
    colGrade: {
      flex: 0.9,
      textAlign: 'center',
    },
    colPosition: {
      flex: 1.1,
      textAlign: 'center',
    },
    colTeacher: {
      flex: 1,
      textAlign: 'center',
    },
    verticalTextContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 8,
    },
    verticalText: {
      fontSize: 8,
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text.primary,
      transform: [{ rotate: '-90deg' }],
      textAlign: 'center',
    },
    gradeText: {
      fontWeight: theme.typography.fontWeights.bold,
    },
    behaviorSection: {
      marginBottom: 16,
      paddingHorizontal: 0,
    },
    behaviorRow: {
      marginBottom: 12,
      minHeight: 20,
    },
    behaviorLabel: {
      fontSize: 11,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.text.primary,
    },
    remarksSection: {
      marginBottom: 16,
      paddingHorizontal: 0,
    },
    remarkRow: {
      marginBottom: 12,
      minHeight: 35,
    },
    remarkLabel: {
      fontSize: 11,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.text.primary,
      marginBottom: 4,
    },
    remarkValue: {
      fontSize: 10,
      color: theme.colors.text.primary,
      lineHeight: 12,
      minHeight: 18,
    },
    footer: {
      marginTop: 16,
      paddingHorizontal: 0,
    },
    signatureSection: {
      marginBottom: 16,
    },
    signatureLabel: {
      fontSize: 11,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.text.primary,
      marginBottom: 6,
    },
    signatureLine: {
      height: 1,
      backgroundColor: theme.colors.text.primary,
      marginTop: 8,
      width: '100%',
    },
    gradeLegend: {
      marginTop: 12,
    },
    legendTable: {
      borderWidth: 1,
      borderColor: theme.colors.text.primary,
      borderRadius: 0,
    },
    legendTableRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.text.primary,
    },
    legendTableRowLast: {
      borderBottomWidth: 0,
    },
    legendTableHeader: {
      backgroundColor: theme.colors.surface.secondary,
    },
    legendTableCell: {
      flex: 1,
      paddingVertical: 4,
      paddingHorizontal: 4,
      fontSize: 8,
      color: theme.colors.text.primary,
      borderRightWidth: 1,
      borderRightColor: theme.colors.text.primary,
      textAlign: 'center',
      lineHeight: 10,
    },
    legendTableHeaderCell: {
      fontWeight: theme.typography.fontWeights.bold,
      backgroundColor: theme.colors.surface.secondary,
    },
    
  });

