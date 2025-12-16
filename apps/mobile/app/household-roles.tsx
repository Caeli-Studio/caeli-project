import { MaterialIcons } from '@expo/vector-icons';
import {
  Stack,
  useRouter,
  useLocalSearchParams,
  useFocusEffect,
} from 'expo-router';
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';

import type { GroupRoleWithStats } from '@/types/role';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { roleService } from '@/services/role.service';
import { ROLE_COLORS } from '@/types/role';

export default function HouseholdRolesScreen() {
  const router = useRouter();
  const { groupId, groupName } = useLocalSearchParams<{
    groupId: string;
    groupName: string;
  }>();
  const { theme } = useTheme();
  useAuth(); // Ensure user is authenticated

  const [roles, setRoles] = useState<GroupRoleWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [canManageRoles, setCanManageRoles] = useState(false);

  const loadRoles = useCallback(async () => {
    if (!groupId) return;

    try {
      setLoading(true);
      console.log('[household-roles] Loading roles for group:', groupId);
      const fetchedRoles = await roleService.getRoles(groupId);
      console.log('[household-roles] Fetched roles:', fetchedRoles);
      setRoles(fetchedRoles);

      // Check if current user can manage roles
      // This is a simplified check - you might want to fetch this from membership
      const hasOwnerRole = fetchedRoles.some((role) => {
        const count =
          typeof role.member_count === 'object'
            ? role.member_count?.count
            : role.member_count;
        return role.name === 'owner' && count && count > 0;
      });
      setCanManageRoles(hasOwnerRole);
      console.log('[household-roles] Can manage roles:', hasOwnerRole);
    } catch (error) {
      console.error('[household-roles] Error loading roles:', error);
      Alert.alert(
        'Erreur',
        'Impossible de charger les rôles. Détails: ' +
          (error instanceof Error ? error.message : String(error))
      );
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useFocusEffect(
    useCallback(() => {
      loadRoles();
    }, [loadRoles])
  );

  const handleDeleteRole = async (role: GroupRoleWithStats) => {
    // Owner role cannot be deleted
    if (role.name === 'owner') {
      Alert.alert(
        'Erreur',
        'Le rôle "Maître de foyer" ne peut pas être supprimé.'
      );
      return;
    }

    const count =
      typeof role.member_count === 'object'
        ? role.member_count?.count
        : role.member_count;
    if (count && count > 0) {
      Alert.alert(
        'Impossible de supprimer',
        `Ce rôle est assigné à ${count} membre${count > 1 ? 's' : ''}. Changez d'abord le rôle de ces membres.`
      );
      return;
    }

    // Warning for system roles
    const warningText = role.is_default
      ? '⚠️ Ce rôle est un rôle système. Cette action est irréversible.\n\n'
      : '';

    Alert.alert(
      'Supprimer le rôle',
      `${warningText}Êtes-vous sûr de vouloir supprimer le rôle "${role.display_name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await roleService.deleteRole(groupId!, role.id);
              Alert.alert('Succès', 'Rôle supprimé avec succès.');
              loadRoles();
            } catch (error: any) {
              console.error('Error deleting role:', error);
              Alert.alert(
                'Erreur',
                error?.response?.data?.error ||
                  'Impossible de supprimer le rôle.'
              );
            }
          },
        },
      ]
    );
  };

  const handleRolePress = (role: GroupRoleWithStats) => {
    // Owner role cannot be edited
    if (role.name === 'owner') {
      Alert.alert(
        'Information',
        'Le rôle "Maître de foyer" ne peut pas être modifié.'
      );
      return;
    }

    if (canManageRoles) {
      router.push({
        pathname: '/edit-role',
        params: {
          groupId,
          groupName,
          roleId: role.id,
          roleName: role.display_name,
          isSystemRole: role.is_default ? 'true' : 'false',
        },
      });
    }
  };

  const handleCreateRole = () => {
    router.push({
      pathname: '/edit-role',
      params: {
        groupId,
        groupName,
      },
    });
  };

  const getRoleColor = (roleName: string, isDefault: boolean) => {
    if (isDefault && ROLE_COLORS[roleName]) {
      return ROLE_COLORS[roleName];
    }
    return ROLE_COLORS.custom;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      padding: 20,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    roleCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderLeftWidth: 5,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 4,
    },
    roleHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    roleTitleContainer: {
      flex: 1,
      gap: 4,
    },
    roleTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.text,
      letterSpacing: 0.3,
    },
    roleSubtitle: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    roleDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
      marginBottom: 12,
    },
    roleInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    roleStats: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.divider,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    roleStatsText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.text,
      marginLeft: 6,
    },
    roleBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.divider,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    roleBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.text,
      marginLeft: 4,
    },
    roleActions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 10,
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginLeft: 6,
    },
    deleteButton: {
      backgroundColor: theme.colors.error,
    },
    deleteButtonText: {
      color: '#FFFFFF',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: 40,
    },
    fab: {
      position: 'absolute',
      right: 24,
      bottom: 24,
      backgroundColor: theme.colors.primary,
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 10,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 60,
      paddingBottom: 20,
      backgroundColor: theme.colors.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    headerTitleContainer: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.text,
    },
    headerSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
  });

  return (
    <ProtectedRoute>
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />

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
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Gestion des rôles</Text>
            <Text style={styles.headerSubtitle}>{groupName || 'Groupe'}</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <>
            <ScrollView style={styles.content}>
              {roles.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <MaterialIcons
                    name="shield"
                    size={64}
                    color={theme.colors.textSecondary}
                  />
                  <Text style={styles.emptyText}>Aucun rôle disponible</Text>
                  <Text style={styles.emptySubtext}>
                    Les rôles permettent de gérer les permissions des membres.
                  </Text>
                </View>
              ) : (
                roles
                  .sort((a, b) => (b.importance || 0) - (a.importance || 0))
                  .map((role) => {
                    const memberCount =
                      typeof role.member_count === 'object'
                        ? role.member_count?.count || 0
                        : role.member_count || 0;

                    return (
                      <TouchableOpacity
                        key={role.id}
                        style={[
                          styles.roleCard,
                          {
                            borderLeftColor: getRoleColor(
                              role.name,
                              role.is_default
                            ),
                          },
                        ]}
                        onPress={() => handleRolePress(role)}
                        activeOpacity={role.name === 'owner' ? 1 : 0.7}
                      >
                        <View style={styles.roleHeader}>
                          <View style={styles.roleTitleContainer}>
                            <Text style={styles.roleTitle}>
                              {role.display_name}
                            </Text>
                            <Text style={styles.roleSubtitle}>
                              @{role.name} • Importance: {role.importance}
                            </Text>
                          </View>
                          {role.name !== 'owner' && canManageRoles && (
                            <MaterialIcons
                              name="chevron-right"
                              size={26}
                              color={theme.colors.textSecondary}
                            />
                          )}
                        </View>

                        {role.description && (
                          <Text style={styles.roleDescription}>
                            {role.description}
                          </Text>
                        )}

                        <View style={styles.roleInfoRow}>
                          <View style={styles.roleStats}>
                            <MaterialIcons
                              name="people"
                              size={16}
                              color={theme.colors.text}
                            />
                            <Text style={styles.roleStatsText}>
                              {memberCount} membre{memberCount > 1 ? 's' : ''}
                            </Text>
                          </View>

                          <View style={styles.roleBadge}>
                            <MaterialIcons
                              name={role.is_default ? 'shield' : 'star'}
                              size={14}
                              color={theme.colors.text}
                            />
                            <Text style={styles.roleBadgeText}>
                              {role.is_default ? 'Système' : 'Personnalisé'}
                            </Text>
                          </View>
                        </View>

                        {role.name !== 'owner' && canManageRoles && (
                          <View style={styles.roleActions}>
                            <TouchableOpacity
                              style={[styles.actionButton, styles.deleteButton]}
                              onPress={() => handleDeleteRole(role)}
                            >
                              <MaterialIcons
                                name="delete"
                                size={18}
                                color="#FFFFFF"
                              />
                              <Text
                                style={[
                                  styles.actionButtonText,
                                  styles.deleteButtonText,
                                ]}
                              >
                                Supprimer
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })
              )}
            </ScrollView>

            {canManageRoles && (
              <TouchableOpacity style={styles.fab} onPress={handleCreateRole}>
                <MaterialIcons
                  name="add"
                  size={28}
                  color={theme.colors.buttonPrimaryText}
                />
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </ProtectedRoute>
  );
}
