import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';

import type { Permission } from '@/types/role';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useTheme } from '@/contexts/ThemeContext';
import { roleService } from '@/services/role.service';
import { PERMISSION_LABELS, SYSTEM_ROLES } from '@/types/role';

export default function EditRoleScreen() {
  const router = useRouter();
  const { groupId, roleId, roleName } = useLocalSearchParams<{
    groupId: string;
    roleId?: string;
    roleName?: string;
  }>();
  const { theme } = useTheme();

  const [loading, setLoading] = useState(false);
  const [loadingRole, setLoadingRole] = useState(false);
  const [name, setName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [importance, setImportance] = useState(50);
  const [permissions, setPermissions] = useState<Partial<Permission>>({
    can_create_tasks: false,
    can_assign_tasks: false,
    can_delete_tasks: false,
    can_manage_members: false,
    can_edit_group: false,
    can_manage_roles: false,
  });

  const isEditMode = !!roleId;

  useEffect(() => {
    if (isEditMode && roleId) {
      loadRole();
    }
  }, [roleId]);

  const loadRole = async () => {
    try {
      setLoadingRole(true);
      const role = await roleService.getRole(groupId!, roleId!);
      setName(role.name);
      setDisplayName(role.display_name);
      setDescription(role.description || '');
      setImportance(role.importance);
      setPermissions(role.permissions);
      setIsDefault(role.is_default);
    } catch (error) {
      console.error('Error loading role:', error);
      Alert.alert('Erreur', 'Impossible de charger le rôle.');
      router.back();
    } finally {
      setLoadingRole(false);
    }
  };

  const validateForm = (): string | null => {
    if (!name.trim()) {
      return 'Le nom technique est requis.';
    }

    if (!/^[a-z0-9-]+$/.test(name)) {
      return 'Le nom technique ne peut contenir que des lettres minuscules, chiffres et tirets.';
    }

    if (SYSTEM_ROLES.includes(name.toLowerCase()) && !isEditMode) {
      return 'Ce nom est réservé aux rôles système.';
    }

    if (!displayName.trim()) {
      return 'Le nom affiché est requis.';
    }

    if (displayName.trim().length < 3) {
      return 'Le nom affiché doit contenir au moins 3 caractères.';
    }

    if (importance < 0 || importance > 100) {
      return "L'importance doit être entre 0 et 100.";
    }

    const hasAtLeastOnePermission = Object.values(permissions).some(
      (p) => p === true
    );
    if (!hasAtLeastOnePermission) {
      return 'Au moins une permission doit être activée.';
    }

    return null;
  };

  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      Alert.alert('Validation', validationError);
      return;
    }

    // Warning for system roles
    if (isDefault && isEditMode) {
      Alert.alert(
        '⚠️ Modifier un rôle système',
        'Vous êtes sur le point de modifier un rôle système. Cette action peut affecter le fonctionnement du foyer. Continuer ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Continuer', onPress: () => performSave() },
        ]
      );
      return;
    }

    performSave();
  };

  const performSave = async () => {
    try {
      setLoading(true);

      if (isEditMode) {
        await roleService.updateRole(groupId!, roleId!, {
          display_name: displayName.trim(),
          description: description.trim() || undefined,
          importance,
          permissions,
        });
        Alert.alert('Succès', 'Rôle modifié avec succès.');
      } else {
        await roleService.createRole(groupId!, {
          name: name.trim().toLowerCase(),
          display_name: displayName.trim(),
          description: description.trim() || undefined,
          importance,
          permissions,
        });
        Alert.alert('Succès', 'Rôle créé avec succès.');
      }

      router.back();
    } catch (error: any) {
      console.error('Error saving role:', error);
      const errorMessage =
        error?.response?.data?.error ||
        (isEditMode
          ? 'Impossible de modifier le rôle.'
          : 'Impossible de créer le rôle.');
      Alert.alert('Erreur', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (key: keyof Permission) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 60,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text,
      flex: 1,
      textAlign: 'center',
    },
    closeButton: {
      padding: 8,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    section: {
      marginBottom: 24,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: theme.colors.text,
    },
    textArea: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    helperText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    importanceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 8,
    },
    importanceButton: {
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      padding: 8,
    },
    importanceValueContainer: {
      flex: 1,
      gap: 8,
    },
    importanceValue: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.primary,
      textAlign: 'center',
    },
    importanceBar: {
      height: 8,
      backgroundColor: theme.colors.divider,
      borderRadius: 4,
      overflow: 'hidden',
    },
    importanceBarFill: {
      height: '100%',
      borderRadius: 4,
    },
    permissionsContainer: {
      gap: 12,
    },
    permissionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.colors.card,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    permissionLabel: {
      fontSize: 15,
      color: theme.colors.text,
      flex: 1,
    },
    footer: {
      flexDirection: 'row',
      gap: 12,
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    button: {
      flex: 1,
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButton: {
      backgroundColor: theme.colors.surface,
    },
    saveButton: {
      backgroundColor: theme.colors.primary,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButtonText: {
      color: theme.colors.text,
    },
    saveButtonText: {
      color: theme.colors.buttonPrimaryText,
    },
  });

  if (loadingRole) {
    return (
      <ProtectedRoute>
        <View style={styles.container}>
          <Stack.Screen options={{ headerShown: false }} />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        </View>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <MaterialIcons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditMode ? `Modifier ${roleName}` : 'Créer un rôle'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.label}>Nom technique *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="ex: chef-cuisinier"
              placeholderTextColor={theme.colors.textTertiary}
              autoCapitalize="none"
              editable={!isEditMode}
            />
            <Text style={styles.helperText}>
              {isEditMode
                ? 'Le nom technique ne peut pas être modifié'
                : 'Minuscules, chiffres et tirets uniquement'}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Nom affiché *</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="ex: Chef cuisinier"
              placeholderTextColor={theme.colors.textTertiary}
            />
            <Text style={styles.helperText}>
              Nom visible pour les utilisateurs
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Description (optionnel)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Décrivez les responsabilités de ce rôle..."
              placeholderTextColor={theme.colors.textTertiary}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Importance</Text>
            <View style={styles.importanceContainer}>
              <TouchableOpacity
                style={styles.importanceButton}
                onPress={() => setImportance(Math.max(0, importance - 5))}
              >
                <MaterialIcons
                  name="remove"
                  size={24}
                  color={theme.colors.text}
                />
              </TouchableOpacity>
              <View style={styles.importanceValueContainer}>
                <Text style={styles.importanceValue}>{importance}</Text>
                <View style={styles.importanceBar}>
                  <View
                    style={[
                      styles.importanceBarFill,
                      {
                        width: `${importance}%`,
                        backgroundColor: theme.colors.primary,
                      },
                    ]}
                  />
                </View>
              </View>
              <TouchableOpacity
                style={styles.importanceButton}
                onPress={() => setImportance(Math.min(100, importance + 5))}
              >
                <MaterialIcons name="add" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.helperText}>
              Détermine l'ordre d'affichage et la priorité du rôle (0-100)
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Permissions *</Text>
            <View style={styles.permissionsContainer}>
              {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
                <View key={key} style={styles.permissionRow}>
                  <Text style={styles.permissionLabel}>{label}</Text>
                  <Switch
                    value={permissions[key as keyof Permission] || false}
                    onValueChange={() =>
                      togglePermission(key as keyof Permission)
                    }
                    trackColor={{
                      false: theme.colors.border,
                      true: theme.colors.primary,
                    }}
                    thumbColor="#fff"
                  />
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={[styles.buttonText, styles.cancelButtonText]}>
              Annuler
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.saveButton,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[styles.buttonText, styles.saveButtonText]}>
                Enregistrer
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ProtectedRoute>
  );
}
