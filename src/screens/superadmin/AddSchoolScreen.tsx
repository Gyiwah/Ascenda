import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Building2, Upload, UserPlus, UserCheck, Phone, Mail } from 'lucide-react-native';

import { schoolService } from '@/api/schools';
import { userService } from '@/api/users';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Picker } from '@/components/ui/Picker';
import { Loader } from '@/components/ui/Loader';
import { useToast } from '@/components/ToastContext';
import { useAppTheme } from '@/theme/@ThemeProvider';
import { School } from '@/types/database';
import { useAuth } from '@/utils/useAuth';

export default function AddSchoolScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { showToast } = useToast();
  const { user } = useAuth();
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const schoolId = route.params?.schoolId;
  const isEditing = !!schoolId;

  const [loading, setLoading] = useState(!!schoolId);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [postalAddress, setPostalAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [logoUri, setLogoUri] = useState<string | undefined>(undefined);
  const [isActive, setIsActive] = useState(true);
  const [adminOption, setAdminOption] = useState<'new' | 'existing'>('new');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [selectedAdminId, setSelectedAdminId] = useState<string>('');
  const [existingAdmins, setExistingAdmins] = useState<any[]>([]);

  useEffect(() => {
    if (schoolId) {
      loadSchool();
    }
    loadAdmins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId]);

  const loadSchool = async () => {
    setLoading(true);
    try {
      const { data, error } = await schoolService.getById(schoolId);
      if (error) throw error;
      if (data) {
        setName(data.name || '');
        setCode(data.code || '');
        setAddress(data.address || '');
        setPostalAddress((data as any).postal_address || '');
        setContactPhone(data.contact_phone || '');
        setContactEmail(data.contact_email || '');
        setLogoUri(data.logo_url || undefined);
        setIsActive(data.is_active ?? true);
      }
    } catch (err: any) {
      console.error('Error loading school', err);
      showToast('Failed to load school', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadAdmins = async () => {
    try {
      const { data } = await userService.getByRole('admin');
      setExistingAdmins(data || []);
    } catch (err) {
      console.error('Error loading admins', err);
    }
  };

  const handlePickLogo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast('Permission is required to select a logo', 'warning');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      // mediaTypes defaults to Images, so we can omit it to avoid deprecation warning
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets?.length) {
      setLogoUri(result.assets[0].uri);
      showToast('Logo selected. Will upload when you save.', 'success');
    }
  };

  const handleSave = async () => {
    // Authorization guard: only super_admin may create schools (RLS enforced)
    if (!isEditing && user?.role !== 'super_admin') {
      showToast('You are not authorized to create schools', 'error');
      return;
    }
    const trimmedName = name.trim();
    const trimmedCode = code.trim();
    const trimmedAddress = address.trim();
    const trimmedPostalAddress = postalAddress.trim();
    const trimmedContactPhone = contactPhone.trim();
    const trimmedContactEmail = contactEmail.trim();

    if (!trimmedName) {
      showToast('Please enter school name', 'warning');
      return;
    }

    // Optional but recommended: basic validations to keep data clean
    if (trimmedCode && !/^[A-Z0-9\/-]+$/.test(trimmedCode)) {
      showToast('School code should contain only letters, numbers, forward slashes, and hyphens', 'warning');
      return;
    }

    // Validate contact email if provided
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (trimmedContactEmail && !emailRegex.test(trimmedContactEmail)) {
      showToast('Please provide a valid contact email', 'warning');
      return;
    }

    // Basic phone check (allows +, spaces and digits)
    if (trimmedContactPhone && !/^[+\d][\d\s\-()]{6,}$/.test(trimmedContactPhone)) {
      showToast('Please provide a valid phone number', 'warning');
      return;
    }

    if (!isEditing) {
        if (adminOption === 'new') {
          const trimmedAdminName = adminName.trim();
          const trimmedAdminEmail = adminEmail.trim();
          const trimmedAdminPassword = adminPassword.trim();

          if (!trimmedAdminName || !trimmedAdminEmail || !trimmedAdminPassword) {
          showToast('Please fill the admin information', 'warning');
          return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(trimmedAdminEmail)) {
          showToast('Please provide a valid admin email', 'warning');
          return;
        }
          if (trimmedAdminPassword.length < 8) {
          showToast('Admin password should be at least 8 characters', 'warning');
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      if (isEditing) {
        const payload: Partial<School> & { postal_address?: string } = {
          name: trimmedName,
          code: trimmedCode || undefined,
          address: trimmedAddress || undefined,
          postal_address: trimmedPostalAddress || undefined,
          contact_phone: trimmedContactPhone || undefined,
          contact_email: trimmedContactEmail || undefined,
          is_active: isActive,
        };

        // Upload logo if it's a new local file (not a URL)
        if (
          logoUri &&
          !logoUri.startsWith('http') &&
          logoUri !== (await schoolService.getById(schoolId)).data?.logo_url
        ) {
          setUploadingLogo(true);
          try {
            const uploadedUrl = await schoolService.uploadLogo(logoUri);
            payload.logo_url = uploadedUrl;
          } finally {
            setUploadingLogo(false);
          }
        } else if (logoUri?.startsWith('http')) {
          payload.logo_url = logoUri;
        }

        const { error } = await schoolService.update(schoolId, payload);
        if (error) throw error;
        showToast('School updated', 'success');
      } else {
        if (adminOption === 'new') {
          let logoUrl: string | undefined;
          if (logoUri && !logoUri.startsWith('http')) {
            setUploadingLogo(true);
            try {
              logoUrl = await schoolService.uploadLogo(logoUri);
            } finally {
              setUploadingLogo(false);
            }
          }

          const { error } = await schoolService.createWithAdmin({
            name: trimmedName,
            code: trimmedCode || undefined,
            admin: {
              name: adminName.trim(),
              email: adminEmail.trim(),
              password: adminPassword.trim(),
            },
            logoUri: logoUrl,
            postalAddress: trimmedPostalAddress || undefined,
            contactPhone: trimmedContactPhone || undefined,
            contactEmail: trimmedContactEmail || undefined,
          });
          if (error) throw error;
          showToast('School created and admin invited', 'success');
        } else {
          // Create school and assign existing admin
          let logoUrl: string | undefined;
          if (logoUri && !logoUri.startsWith('http')) {
            setUploadingLogo(true);
            try {
              logoUrl = await schoolService.uploadLogo(logoUri);
            } finally {
              setUploadingLogo(false);
            }
          }

          const payload: Partial<School> & { postal_address?: string } = {
            name: trimmedName,
            code: trimmedCode || undefined,
            address: trimmedAddress || undefined,
            postal_address: trimmedPostalAddress || undefined,
            contact_phone: trimmedContactPhone || undefined,
            contact_email: trimmedContactEmail || undefined,
            logo_url: logoUrl,
          };
          const { data, error } = await schoolService.create(payload);
          if (error) throw error;
          if (selectedAdminId && data) {
            await userService.update(selectedAdminId, { school_id: data.id });
          }
          showToast('School created', 'success');
        }
      }

      navigation.goBack();
    } catch (err: any) {
      console.error('Save school error', err);
      if (err?.response) console.error('Save school error response', err.response);
      if (err?.context) console.error('Save school error context', err.context);
      showToast(err?.message || (err?.response?.data && JSON.stringify(err.response.data)) || 'Save failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader />;

  const adminOptions = existingAdmins
    .filter((a) => !a.school_id)
    .map((admin) => ({
      label: `${admin.full_name || admin.email} (${admin.email})`,
      value: admin.id,
    }));

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>{isEditing ? 'Edit School' : 'New School'}</Text>
        </View>

        <Card style={styles.card}>
          <Input label="School Name *" value={name} onChangeText={setName} />
          <Input
            label="School Code"
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
            style={styles.inputSpacing}
          />
          <Input 
            label="Address" 
            value={address} 
            onChangeText={setAddress} 
            placeholder="Physical location address"
            style={styles.inputSpacing} 
          />
          
          <View style={styles.contactSection}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            <Text style={styles.helperText}>
              Address is for physical location. Postal Address is for mailing/P.O. Box.
            </Text>
            
            <Input 
              label="Postal Address" 
              value={postalAddress} 
              onChangeText={setPostalAddress} 
              placeholder="P.O. Box 123, Accra"
              style={styles.inputSpacing} 
            />
            
            <View style={styles.inputWithIcon}>
              <Phone size={18} color={theme.colors.text.secondary} style={styles.inputIcon} />
              <View style={styles.inputWrapper}>
                <Input 
                  label="Telephone" 
                  value={contactPhone} 
                  onChangeText={setContactPhone} 
                  keyboardType="phone-pad"
                  placeholder="+233 XX XXX XXXX"
                  style={styles.inputNoMargin} 
                />
              </View>
            </View>
            
            <View style={styles.inputWithIcon}>
              <Mail size={18} color={theme.colors.text.secondary} style={styles.inputIcon} />
              <View style={styles.inputWrapper}>
                <Input 
                  label="Email" 
                  value={contactEmail} 
                  onChangeText={setContactEmail} 
                  keyboardType="email-address"
                  placeholder="school@example.com"
                  style={styles.inputNoMargin} 
                />
              </View>
            </View>
          </View>

          <View style={styles.logoRow}>
            {logoUri ? (
              <Image source={{ uri: logoUri }} style={styles.logoPreview} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Building2 size={24} color={theme.colors.text.inverse} />
              </View>
            )}
            <View style={styles.logoActions}>
              <Button title="Choose Logo" onPress={handlePickLogo} icon={<Upload size={16} color="#fff" />} />
              {uploadingLogo && <ActivityIndicator style={{ marginTop: 8 }} />}
            </View>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Active</Text>
            <Switch value={isActive} onValueChange={setIsActive} />
          </View>

          {!isEditing && (
            <View style={styles.adminSection}>
              <Text style={styles.sectionTitle}>Admin</Text>
              <View style={styles.adminOptionRow}>
                <Pressable onPress={() => setAdminOption('new')} style={styles.adminOptionButton}>
                  <UserPlus color={adminOption === 'new' ? theme.colors.primary.base : theme.colors.text.secondary} />
                  <Text style={styles.adminOptionText}>New</Text>
                </Pressable>
                <Pressable onPress={() => setAdminOption('existing')} style={styles.adminOptionButton}>
                  <UserCheck color={adminOption === 'existing' ? theme.colors.primary.base : theme.colors.text.secondary} />
                  <Text style={styles.adminOptionText}>Existing</Text>
                </Pressable>
              </View>

              {adminOption === 'new' ? (
                <>
                  <Input label="Admin Name" value={adminName} onChangeText={setAdminName} />
                  <Input label="Admin Email" value={adminEmail} onChangeText={setAdminEmail} keyboardType="email-address" />
                  <Input label="Admin Password" value={adminPassword} onChangeText={setAdminPassword} secureTextEntry />
                </>
              ) : (
                <Picker label="Choose Admin" options={adminOptions} value={selectedAdminId} onValueChange={setSelectedAdminId} />
              )}
            </View>
          )}

          <View style={styles.actions}>
            <Button title={isEditing ? 'Save' : 'Create'} onPress={handleSave} loading={submitting} />
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    scrollContent: {
      padding: theme.spacing.lg,
      paddingBottom: theme.spacing['2xl'],
    },
    header: {
      marginBottom: theme.spacing.md,
    },
    title: {
      fontSize: theme.typography.fontSizes['2xl'],
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text.primary,
    },
    card: {
      padding: theme.spacing.lg,
    },
    inputSpacing: {
      marginTop: theme.spacing.md,
    },
    logoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      marginTop: theme.spacing.md,
    },
    logoPreview: {
      width: 80,
      height: 80,
      borderRadius: theme.roundness,
    },
    logoPlaceholder: {
      width: 80,
      height: 80,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.primary.base,
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoActions: {
      flex: 1,
      justifyContent: 'center',
    },
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: theme.spacing.md,
    },
    switchLabel: {
      color: theme.colors.text.primary,
      fontSize: theme.typography.fontSizes.base,
    },
    adminSection: {
      marginTop: theme.spacing.lg,
    },
    sectionTitle: {
      fontSize: theme.typography.fontSizes.lg,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.sm,
    },
    adminOptionRow: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    adminOptionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    adminOptionText: {
      marginLeft: theme.spacing.xs,
      color: theme.colors.text.primary,
    },
    actions: {
      marginTop: theme.spacing.lg,
    },
    contactSection: {
      marginTop: theme.spacing.md,
      paddingTop: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    helperText: {
      fontSize: theme.typography.fontSizes.xs,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.sm,
      fontStyle: 'italic',
    },
    inputWithIcon: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginTop: theme.spacing.md,
    },
    inputIcon: {
      marginTop: theme.spacing.md + 20, // Align with input field (label height + input padding)
      marginRight: theme.spacing.sm,
    },
    inputWrapper: {
      flex: 1,
    },
    inputNoMargin: {
      marginBottom: 0,
    },
  });
