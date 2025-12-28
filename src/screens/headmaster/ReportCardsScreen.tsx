import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/utils/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { useToast } from '@/components/ToastContext';
import { useAppTheme } from '@/theme/@ThemeProvider';
import { classService } from '@/api/classes';
import { Picker } from '@/components/ui/Picker';
import { studentService } from '@/api/students';
import { Class, Student } from '@/types/database';
import { FileText, Users, User } from 'lucide-react-native';

export default function ReportCardsScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [academicYear, setAcademicYear] = useState<string | undefined>(undefined);
  const [term, setTerm] = useState<number>(1);
  const [showAllClasses, setShowAllClasses] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (user?.school_id) {
        loadClasses();
      }
    }, [user?.school_id, academicYear])
  );

  // Reload students when term changes if a class is already selected
  useEffect(() => {
    if (selectedClassId && user?.school_id) {
      loadStudents(selectedClassId, false); // Don't show loading spinner for term changes
    }
  }, [term]);

  const loadClasses = async () => {
    if (!user?.school_id) return;

    setLoadingClasses(true);
    try {
      // Try without academic year first to get all classes, then filter if needed
      const { data, error } = await classService.getAll(user.school_id);
      if (error) throw error;
      
      // Filter by academic year if provided and not showing all
      let filteredData = data || [];
      if (academicYear && !showAllClasses) {
        filteredData = filteredData.filter((cls) => cls.academic_year === academicYear);
      }
      
      console.log('[ReportCardsScreen] Loaded classes:', {
        total: data?.length || 0,
        filtered: filteredData.length,
        academicYear,
        classes: filteredData.map((c) => ({ id: c.id, name: c.name, year: c.academic_year })),
      });
      
      setClasses(filteredData);
      
      if (filteredData.length === 0 && data && data.length > 0) {
        showToast(`No classes found for academic year ${academicYear}`, 'info');
      }
    } catch (err: any) {
      console.error('[ReportCardsScreen] Error loading classes:', err);
      showToast('Failed to load classes', 'error');
      setClasses([]);
    } finally {
      setLoadingClasses(false);
    }
  };

  const loadStudents = async (classId: string, showLoading = true) => {
    if (!user?.school_id) return;

    if (showLoading) {
      setLoadingStudents(true);
    }
    try {
      const { data, error } = await studentService.getAll(user.school_id, classId);
      if (error) throw error;
      setStudents(data || []);
    } catch (err: any) {
      console.error('[ReportCardsScreen] Error loading students:', err);
      showToast('Failed to load students', 'error');
    } finally {
      if (showLoading) {
        setLoadingStudents(false);
      }
    }
  };

  

  const handleIndividualReport = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    navigation.navigate('ViewReportCard', {
      studentId,
      studentName: `${student.first_name} ${student.last_name}`,
      classId: selectedClassId,
      className: classes.find((c) => c.id === selectedClassId)?.name || 'Class',
      academicYear,
      term,
    });
  };

  const handleBulkReports = () => {
    if (!selectedClassId || students.length === 0) {
      showToast('Please select a class first', 'warning');
      return;
    }

    navigation.navigate('BulkReportCards', {
      classId: selectedClassId,
      className: classes.find((c) => c.id === selectedClassId)?.name || 'Class',
      studentIds: students.map((s) => s.id),
      academicYear,
      term,
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadClasses();
    if (selectedClassId) {
      await loadStudents(selectedClassId);
    }
    setRefreshing(false);
  };

  if (loadingClasses && classes.length === 0) {
    return <Loader />;
  }

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      {/* Filters */}
      <Card style={styles.filterCard}>
        <Text style={styles.sectionTitle}>Select Class & Term</Text>
        <View style={styles.filterRow}>
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Academic Year</Text>
            <Picker
              value={academicYear || ''}
              onValueChange={(val) => {
                setAcademicYear(val || undefined);
                setShowAllClasses(!val);
              }}
              options={(() => {
                const currentYear = new Date().getFullYear();
                const opts = [] as { label: string; value: string }[];
                // provide three options: current/current+1, +1/+2, +2/+3
                for (let i = 0; i < 3; i++) {
                  const start = currentYear + i;
                  const label = `${start}/${start + 1}`;
                  opts.push({ label, value: label });
                }
                // allow clearing to see all years
                return [{ label: 'All Years', value: '' }, ...opts];
              })()}
              placeholder="All Years"
            />
          </View>
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Term</Text>
            <View style={styles.termButtons}>
              {[1, 2, 3].map((t) => (
                <Pressable
                  key={t}
                  style={[styles.termButton, term === t && styles.termButtonActive]}
                  onPress={() => setTerm(t)}
                >
                  <Text style={[styles.termButtonText, term === t && styles.termButtonTextActive]}>
                    {t}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Card>

      {/* Class Selection */}
      <Card style={styles.classCard}>
        <Text style={styles.sectionTitle}>Select Class</Text>
        {classes.length > 0 ? (
          <Picker
            value={selectedClassId}
            onValueChange={(val) => {
              setSelectedClassId(val);
              if (val) loadStudents(val);
              else setStudents([]);
            }}
            options={[{ label: 'Select a class...', value: '' }, ...classes.map((c) => ({ label: c.name, value: c.id }))]}
            placeholder="Select a class..."
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {loadingClasses
                ? 'Loading classes...'
                : `No classes found${academicYear ? ` for ${academicYear}` : ''}. Please check the academic year or create classes.`}
            </Text>
            {!loadingClasses && academicYear && (
              <Button
                title="Show All Classes"
                onPress={() => {
                  setShowAllClasses(true);
                  setAcademicYear(undefined);
                }}
                variant="outline"
                style={styles.showAllButton}
              />
            )}
          </View>
        )}
      </Card>

      {/* Students List */}
      {selectedClassId && students.length > 0 && (
        <Card style={styles.studentsCard}>
          <View style={styles.studentsHeader}>
            <Text style={styles.sectionTitle}>
              Students ({students.length}) - {selectedClass?.name}
            </Text>
            <Button
              title="Generate All"
              onPress={handleBulkReports}
              icon={<Users size={18} color={theme.colors.background.primary} />}
              style={styles.bulkButton}
            />
          </View>
          <View style={styles.studentsList}>
            {students.map((student) => (
              <Pressable
                key={student.id}
                style={styles.studentItem}
                onPress={() => handleIndividualReport(student.id)}
              >
                <View style={styles.studentInfo}>
                  <User size={20} color={theme.colors.primary.base} />
                  <View style={styles.studentDetails}>
                    <Text style={styles.studentName}>
                      {student.first_name} {student.last_name}
                    </Text>
                    <Text style={styles.studentAdmission}>{student.admission_number}</Text>
                  </View>
                </View>
                <FileText size={20} color={theme.colors.text.secondary} />
              </Pressable>
            ))}
          </View>
        </Card>
      )}

      {selectedClassId && students.length === 0 && !loadingStudents && (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>No students found in this class</Text>
        </Card>
      )}

      {selectedClassId && loadingStudents && (
        <Card style={styles.emptyCard}>
          <Loader />
          <Text style={styles.emptyText}>
            Loading students...
          </Text>
        </Card>
      )}

      {!selectedClassId && (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>Please select a class to view students</Text>
        </Card>
      )}
    </ScrollView>
  );
}

const makeStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.secondary,
    },
    contentContainer: {
      padding: theme.spacing.md,
      paddingBottom: theme.spacing.xl * 2,
    },
    filterCard: {
      marginBottom: theme.spacing.md,
    },
    sectionTitle: {
      fontSize: theme.typography.fontSizes.lg,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.md,
    },
    filterRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
    },
    filterItem: {
      flex: 1,
    },
    filterLabel: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.xs,
    },
    filterValue: {
      fontSize: theme.typography.fontSizes.base,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.text.primary,
    },
    termButtons: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
    },
    termButton: {
      flex: 1,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.roundness,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface.primary,
      alignItems: 'center',
    },
    termButtonActive: {
      backgroundColor: theme.colors.primary.base,
      borderColor: theme.colors.primary.base,
    },
    termButtonText: {
      fontSize: theme.typography.fontSizes.base,
      color: theme.colors.text.primary,
      fontWeight: theme.typography.fontWeights.semibold,
    },
    termButtonTextActive: {
      color: theme.colors.background.primary,
    },
    classCard: {
      marginBottom: theme.spacing.md,
    },
    classGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    classButton: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.roundness,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface.primary,
      minWidth: 100,
      alignItems: 'center',
    },
    classButtonActive: {
      backgroundColor: theme.colors.primary.base,
      borderColor: theme.colors.primary.base,
    },
    classButtonText: {
      fontSize: theme.typography.fontSizes.base,
      color: theme.colors.text.primary,
      fontWeight: theme.typography.fontWeights.medium,
    },
    classButtonTextActive: {
      color: theme.colors.background.primary,
    },
    studentsCard: {
      marginBottom: theme.spacing.md,
    },
    studentsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    bulkButton: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    studentsList: {
      gap: theme.spacing.xs,
    },
    studentItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.md,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface.secondary,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    studentInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      flex: 1,
    },
    studentDetails: {
      flex: 1,
    },
    studentName: {
      fontSize: theme.typography.fontSizes.base,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs / 2,
    },
    studentAdmission: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
    },
    emptyCard: {
      padding: theme.spacing.xl,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: theme.typography.fontSizes.base,
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
    emptyState: {
      padding: theme.spacing.lg,
      alignItems: 'center',
    },
    yearButton: {
      padding: theme.spacing.xs,
    },
    showAllButton: {
      marginTop: theme.spacing.md,
    },
  });

