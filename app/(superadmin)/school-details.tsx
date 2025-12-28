import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, spacing, typography } from '@/theme';
import { schoolService } from '@/services/supabase/schools';
import { userService } from '@/services/supabase/users';
import { School, User } from '@/types/database';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Loader } from '@/components/ui/Loader';
import { UserForm } from '@/components/forms/UserForm';
import { School as SchoolIcon, MapPin, Hash, Mail, Phone, Users, ArrowLeft } from 'lucide-react-native';

export default function SchoolDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const schoolId = params.id as string;
  
  const [school, setSchool] = useState<School | null>(null);
  const [admins, setAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);

  const loadSchool = async () => {
    if (!schoolId) return;
    const { data, error } = await schoolService.getById(schoolId);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setSchool(data);
    }
  };

  const loadAdmins = async () => {
    if (!schoolId) return;
    const { data } = await userService.getByRole('admin', schoolId);
    setAdmins(data || []);
  };

  const load = async () => {
    setLoading(true);
    await Promise.all([loadSchool(), loadAdmins()]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [schoolId]);

  const onAddAdmin = async (values: any) => {
    Alert.alert(
      'Add School Admin',
      'To create a new user, you need to:\n\n1. Create the user in Supabase Auth (Authentication → Users)\n2. Copy the user UUID\n3. Then update their profile here with role "admin" and assign to this school.\n\nFor now, you can edit existing users to assign them as admins to this school.',
      [{ text: 'OK' }]
    );
    setShowAddAdminModal(false);
  };

  if (loading) return <Loader />;
  if (!school) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.text.inverse} />
          </TouchableOpacity>
          <Text style={styles.title}>School Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>School not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text.inverse} />
        </TouchableOpacity>
        <Text style={styles.title}>School Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.schoolCard}>
          <View style={styles.schoolHeader}>
            <View style={styles.iconContainer}>
              <SchoolIcon size={32} color={colors.primary[600]} />
            </View>
            <View style={styles.schoolInfo}>
              <Text style={styles.schoolName}>{school.name}</Text>
              <View style={styles.schoolMeta}>
                <View style={styles.metaRow}>
                  <Hash size={16} color={colors.text.secondary} />
                  <Text style={styles.metaText}>{school.code}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>School Information</Text>
            
            {school.address && (
              <View style={styles.detailRow}>
                <MapPin size={20} color={colors.text.secondary} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Address</Text>
                  <Text style={styles.detailValue}>{school.address}</Text>
                </View>
              </View>
            )}

            <View style={styles.detailRow}>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>School Code</Text>
                <Text style={styles.detailValue}>{school.code}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Created</Text>
                <Text style={styles.detailValue}>
                  {new Date(school.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.adminsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>School Admins</Text>
              <Button
                title="Add Admin"
                onPress={() => setShowAddAdminModal(true)}
                style={styles.addButton}
              />
            </View>

            {admins.length === 0 ? (
              <View style={styles.emptyAdmins}>
                <Users size={24} color={colors.text.secondary} />
                <Text style={styles.emptyText}>No admins assigned</Text>
                <Text style={styles.emptySubtext}>Add an admin to manage this school</Text>
              </View>
            ) : (
              <View style={styles.adminsList}>
                {admins.map((admin) => (
                  <Card key={admin.id} style={styles.adminCard}>
                    <View style={styles.adminInfo}>
                      <View style={styles.adminIcon}>
                        <Users size={20} color={colors.primary[600]} />
                      </View>
                      <View style={styles.adminDetails}>
                        <Text style={styles.adminName}>{admin.full_name}</Text>
                        <View style={styles.adminMeta}>
                          <Mail size={14} color={colors.text.secondary} />
                          <Text style={styles.adminEmail}>{admin.email}</Text>
                        </View>
                      </View>
                    </View>
                  </Card>
                ))}
              </View>
            )}
          </View>
        </Card>
      </ScrollView>

      <Modal visible={showAddAdminModal} onRequestClose={() => setShowAddAdminModal(false)}>
        <Text style={styles.modalTitle}>Add School Admin</Text>
        <Text style={styles.modalSubtitle}>
          Create a user in Supabase Auth first, then assign them as admin here.
        </Text>
        <UserForm
          initial={{ school_id: schoolId, role: 'admin' }}
          onSubmit={onAddAdmin}
          schools={[school]}
        />
        <Button
          title="Close"
          variant="outline"
          onPress={() => setShowAddAdminModal(false)}
          style={{ marginTop: spacing.md }}
        />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.primary[600],
  },
  title: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.inverse,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  schoolCard: {
    padding: spacing.lg,
  },
  schoolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  schoolInfo: {
    flex: 1,
  },
  schoolName: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  schoolMeta: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
  },
  metaText: {
    fontSize: typography.fontSizes.sm,
    color: colors.text.secondary,
  },
  detailsSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.text.secondary,
    marginBottom: spacing.xs / 2,
  },
  detailValue: {
    fontSize: typography.fontSizes.base,
    color: colors.text.primary,
  },
  adminsSection: {
    marginTop: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  addButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  emptyAdmins: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.neutral[50],
    borderRadius: 12,
  },
  emptyText: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.medium,
    color: colors.text.primary,
    marginTop: spacing.sm,
  },
  emptySubtext: {
    fontSize: typography.fontSizes.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs / 2,
    textAlign: 'center',
  },
  adminsList: {
    gap: spacing.sm,
  },
  adminCard: {
    padding: spacing.md,
  },
  adminInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  adminDetails: {
    flex: 1,
  },
  adminName: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
  },
  adminMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
  },
  adminEmail: {
    fontSize: typography.fontSizes.sm,
    color: colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: typography.fontSizes.base,
    color: colors.error[600],
  },
  modalTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
});

