/**
 * Notification Settings Screen
 *
 * Allows users to manage their notification preferences
 */

import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useNotifications } from '@/contexts/NotificationContext';
import { useTheme } from '@/contexts/ThemeContext';

const NotificationSettings = () => {
  const { theme } = useTheme();
  const { preferences, updatePreferences, permissionsGranted } =
    useNotifications();

  const handleTogglePreference = async (
    key: keyof typeof preferences,
    value: boolean
  ) => {
    // If trying to enable notifications but permissions not granted
    if (key === 'enabled' && value && !permissionsGranted) {
      Alert.alert(
        'Permissions requises',
        'Veuillez autoriser les notifications dans les paramètres de votre appareil.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Ouvrir Paramètres',
            onPress: () => {
              // On mobile, you would use Linking.openSettings() here
              Alert.alert(
                'Info',
                'Veuillez aller dans Paramètres > Notifications > Caeli'
              );
            },
          },
        ]
      );
      return;
    }

    await updatePreferences({ [key]: value });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 50,
      paddingBottom: 20,
      backgroundColor: theme.colors.surface,
      elevation: 2,
    },
    backButton: {
      padding: 8,
      marginRight: 10,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.text,
    },
    section: {
      marginTop: 20,
      paddingHorizontal: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 15,
      marginLeft: 5,
    },
    optionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      padding: 15,
      borderRadius: 10,
      marginBottom: 10,
      elevation: 2,
    },
    optionContent: {
      flex: 1,
      marginLeft: 10,
    },
    optionText: {
      fontSize: 16,
      color: theme.colors.text,
      fontWeight: '500',
    },
    optionDescription: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginTop: 3,
    },
    permissionStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      padding: 15,
      borderRadius: 10,
      marginBottom: 20,
      elevation: 2,
    },
    permissionText: {
      flex: 1,
      marginLeft: 10,
      fontSize: 14,
      color: theme.colors.text,
    },
    disabledOption: {
      opacity: 0.5,
    },
  });

  return (
    <ProtectedRoute>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialIcons
              name="arrow-back"
              size={24}
              color={theme.colors.text}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
          {/* Permission Status */}
          <View style={styles.section}>
            <View style={styles.permissionStatus}>
              <MaterialIcons
                name={permissionsGranted ? 'check-circle' : 'error'}
                size={24}
                color={
                  permissionsGranted ? theme.colors.success : theme.colors.error
                }
              />
              <Text style={styles.permissionText}>
                {permissionsGranted
                  ? 'Permissions accordées'
                  : 'Permissions non accordées - Activez-les dans les paramètres'}
              </Text>
            </View>
          </View>

          {/* Main Toggle */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Paramètres généraux</Text>
            <View style={styles.optionButton}>
              <MaterialIcons
                name="notifications-active"
                size={24}
                color={theme.colors.text}
              />
              <View style={styles.optionContent}>
                <Text style={styles.optionText}>Activer les notifications</Text>
                <Text style={styles.optionDescription}>
                  Recevoir toutes les notifications de l'application
                </Text>
              </View>
              <Switch
                value={preferences.enabled}
                onValueChange={(value) =>
                  handleTogglePreference('enabled', value)
                }
                trackColor={{
                  false: theme.colors.border,
                  true: theme.colors.primary,
                }}
                thumbColor={preferences.enabled ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>

          {/* Notification Types */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Types de notifications</Text>

            <View
              style={[
                styles.optionButton,
                !preferences.enabled && styles.disabledOption,
              ]}
            >
              <MaterialIcons
                name="assignment"
                size={24}
                color={theme.colors.text}
              />
              <View style={styles.optionContent}>
                <Text style={styles.optionText}>Tâches assignées</Text>
                <Text style={styles.optionDescription}>
                  Quand une tâche vous est assignée
                </Text>
              </View>
              <Switch
                value={preferences.task_assigned}
                onValueChange={(value) =>
                  handleTogglePreference('task_assigned', value)
                }
                disabled={!preferences.enabled}
                trackColor={{
                  false: theme.colors.border,
                  true: theme.colors.primary,
                }}
                thumbColor={preferences.task_assigned ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View
              style={[
                styles.optionButton,
                !preferences.enabled && styles.disabledOption,
              ]}
            >
              <MaterialIcons
                name="check-circle"
                size={24}
                color={theme.colors.text}
              />
              <View style={styles.optionContent}>
                <Text style={styles.optionText}>Tâches terminées</Text>
                <Text style={styles.optionDescription}>
                  Quand une tâche est complétée
                </Text>
              </View>
              <Switch
                value={preferences.task_completed}
                onValueChange={(value) =>
                  handleTogglePreference('task_completed', value)
                }
                disabled={!preferences.enabled}
                trackColor={{
                  false: theme.colors.border,
                  true: theme.colors.primary,
                }}
                thumbColor={preferences.task_completed ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View
              style={[
                styles.optionButton,
                !preferences.enabled && styles.disabledOption,
              ]}
            >
              <MaterialIcons
                name="swap-horiz"
                size={24}
                color={theme.colors.text}
              />
              <View style={styles.optionContent}>
                <Text style={styles.optionText}>Demandes de transfert</Text>
                <Text style={styles.optionDescription}>
                  Quand vous recevez une demande de transfert
                </Text>
              </View>
              <Switch
                value={preferences.transfer_request}
                onValueChange={(value) =>
                  handleTogglePreference('transfer_request', value)
                }
                disabled={!preferences.enabled}
                trackColor={{
                  false: theme.colors.border,
                  true: theme.colors.primary,
                }}
                thumbColor={preferences.transfer_request ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View
              style={[
                styles.optionButton,
                !preferences.enabled && styles.disabledOption,
              ]}
            >
              <MaterialIcons
                name="person-add"
                size={24}
                color={theme.colors.text}
              />
              <View style={styles.optionContent}>
                <Text style={styles.optionText}>Nouveaux membres</Text>
                <Text style={styles.optionDescription}>
                  Quand un membre rejoint le groupe
                </Text>
              </View>
              <Switch
                value={preferences.new_member}
                onValueChange={(value) =>
                  handleTogglePreference('new_member', value)
                }
                disabled={!preferences.enabled}
                trackColor={{
                  false: theme.colors.border,
                  true: theme.colors.primary,
                }}
                thumbColor={preferences.new_member ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View
              style={[
                styles.optionButton,
                !preferences.enabled && styles.disabledOption,
              ]}
            >
              <MaterialIcons
                name="admin-panel-settings"
                size={24}
                color={theme.colors.text}
              />
              <View style={styles.optionContent}>
                <Text style={styles.optionText}>Changements de rôle</Text>
                <Text style={styles.optionDescription}>
                  Quand votre rôle est modifié
                </Text>
              </View>
              <Switch
                value={preferences.role_changed}
                onValueChange={(value) =>
                  handleTogglePreference('role_changed', value)
                }
                disabled={!preferences.enabled}
                trackColor={{
                  false: theme.colors.border,
                  true: theme.colors.primary,
                }}
                thumbColor={preferences.role_changed ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </ProtectedRoute>
  );
};

export default NotificationSettings;
