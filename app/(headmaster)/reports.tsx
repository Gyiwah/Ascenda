import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/hooks/useAuth';
import { studentService } from '@/services/supabase/students';
import { classService } from '@/services/supabase/classes';
import { reportService } from '@/services/supabase/reports';
import { colors, spacing, typography, hexToRgba } from '@/theme';
import { ChevronDown } from 'lucide-react-native';

export default function ReportsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedTerm, setSelectedTerm] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showTermModal, setShowTermModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadStudents();
    }
  }, [selectedClass]);

  const loadData = async () => {
    if (!user?.school_id) return;

    setLoading(true);
    const currentYear = new Date().getFullYear();
    const academicYear = `${currentYear}/${currentYear + 1}`;

    const { data } = await classService.getAll(user.school_id, academicYear);
    if (data) {
      setClasses(data);
      if (data.length > 0 && !selectedClass) {
        setSelectedClass(data[0].id);
      }
    }
    setLoading(false);
  };

  const loadStudents = async () => {
    if (!selectedClass || !user?.school_id) return;

    const { data } = await studentService.getAll(user.school_id, selectedClass);
    if (data) setStudents(data);
  };

  const generateReport = async (studentId: string) => {
    if (!user?.school_id) return;

    setGenerating(true);
    const currentYear = new Date().getFullYear();
    const academicYear = `${currentYear}/${currentYear + 1}`;

    try {
      const { data, error } = await reportService.generateReport(
        studentId,
        academicYear,
        selectedTerm,
        'pdf'
      );

      if (error) throw error;

      // If data is HTML, we can open it in a WebView or browser
      if (data && typeof data === 'string') {
        // For HTML reports, we'll create a data URL
        const htmlContent = data;
        const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;
        
        // Open in browser or WebView
        Alert.alert(
          'Report Generated',
          'Report has been generated. You can view it in your browser.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open',
              onPress: () => {
                // In a real app, you might want to use expo-web-browser or a WebView
                // For now, we'll just show an alert
                Alert.alert('Info', 'Report generated successfully. Download functionality requires browser integration.');
              },
            },
          ]
        );
      } else {
        Alert.alert('Success', 'Report generated successfully!');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const exportCSV = async () => {
    if (!selectedClass || !user?.school_id) return;

    setGenerating(true);
    const currentYear = new Date().getFullYear();
    const academicYear = `${currentYear}/${currentYear + 1}`;

    try {
      const { data, error } = await reportService.exportCSV(
        selectedClass,
        academicYear,
        selectedTerm
      );

      if (error) throw error;

      Alert.alert(
        'Success',
        'CSV export completed. In a production app, this would trigger a download.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to export CSV');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <Loader />;

  const selectedClassData = classes.find((c) => c.id === selectedClass);
  const selectedStudentData = students.find((s) => s.id === selectedStudent);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Generate Reports</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Report Settings</Text>

          <TouchableOpacity
            style={styles.selector}
            onPress={() => setShowClassModal(true)}
          >
            <View style={styles.selectorContent}>
              <Text style={styles.selectorLabel}>Class</Text>
              <Text style={styles.selectorValue}>
                {selectedClassData?.name || 'Select Class'}
              </Text>
            </View>
            <ChevronDown size={20} color={colors.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.selector}
            onPress={() => setShowTermModal(true)}
          >
            <View style={styles.selectorContent}>
              <Text style={styles.selectorLabel}>Term</Text>
              <Text style={styles.selectorValue}>Term {selectedTerm}</Text>
            </View>
            <ChevronDown size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Generate Student Report</Text>
          <Text style={styles.cardDescription}>
            Generate a detailed report card for a specific student
          </Text>

          <TouchableOpacity
            style={styles.selector}
            onPress={() => setShowStudentModal(true)}
          >
            <View style={styles.selectorContent}>
              <Text style={styles.selectorLabel}>Student</Text>
              <Text style={styles.selectorValue}>
                {selectedStudentData
                  ? `${selectedStudentData.first_name} ${selectedStudentData.last_name}`
                  : 'Select Student'}
              </Text>
            </View>
            <ChevronDown size={20} color={colors.text.secondary} />
          </TouchableOpacity>

          <Button
            title="Generate Report Card"
            onPress={() => {
              if (!selectedStudent) {
                Alert.alert('Error', 'Please select a student');
                return;
              }
              generateReport(selectedStudent);
            }}
            loading={generating}
            disabled={!selectedStudent || generating}
            style={styles.button}
          />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Export Class Data</Text>
          <Text style={styles.cardDescription}>
            Export all student assessments for the selected class as CSV
          </Text>

          <Button
            title="Export to CSV"
            onPress={exportCSV}
            loading={generating}
            disabled={!selectedClass || generating}
            variant="outline"
            style={styles.button}
          />
        </Card>
      </ScrollView>

      {/* Class Selection Modal */}
      <Modal
        visible={showClassModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowClassModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Class</Text>
            <ScrollView>
              {classes.map((classItem) => (
                <TouchableOpacity
                  key={classItem.id}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedClass(classItem.id);
                    setSelectedStudent(null);
                    setShowClassModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{classItem.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Button
              title="Cancel"
              onPress={() => setShowClassModal(false)}
              variant="outline"
            />
          </View>
        </View>
      </Modal>

      {/* Term Selection Modal */}
      <Modal
        visible={showTermModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTermModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Term</Text>
            {[1, 2, 3].map((term) => (
              <TouchableOpacity
                key={term}
                style={styles.modalItem}
                onPress={() => {
                  setSelectedTerm(term);
                  setShowTermModal(false);
                }}
              >
                <Text style={styles.modalItemText}>Term {term}</Text>
              </TouchableOpacity>
            ))}
            <Button
              title="Cancel"
              onPress={() => setShowTermModal(false)}
              variant="outline"
            />
          </View>
        </View>
      </Modal>

      {/* Student Selection Modal */}
      <Modal
        visible={showStudentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStudentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Student</Text>
            <ScrollView>
              {students.map((student) => (
                <TouchableOpacity
                  key={student.id}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedStudent(student.id);
                    setShowStudentModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>
                    {student.first_name} {student.last_name}
                  </Text>
                  <Text style={styles.modalItemSubtext}>
                    {student.admission_number}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Button
              title="Cancel"
              onPress={() => setShowStudentModal(false)}
              variant="outline"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  header: {
    padding: spacing.xl,
    backgroundColor: colors.primary[600],
  },
  title: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.text.inverse,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  cardTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  cardDescription: {
    fontSize: typography.fontSizes.sm,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.light,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    marginBottom: spacing.sm,
  },
  selectorContent: {
    flex: 1,
  },
  selectorLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.secondary,
    marginBottom: spacing.xs / 2,
  },
  selectorValue: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text.primary,
  },
  button: {
    marginTop: spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: hexToRgba(colors.background.dark ?? '#000000', 0.5),
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.light,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.xl,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  modalItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  modalItemText: {
    fontSize: typography.fontSizes.base,
    color: colors.text.primary,
  },
  modalItemSubtext: {
    fontSize: typography.fontSizes.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs / 2,
  },
});
