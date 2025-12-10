import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect, Stack } from 'expo-router';
import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';

import Navbar from '@/components/navbar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/contexts/ThemeContext';
import { apiService } from '@/services/api.service';
import { Group, Membership, GetGroupsResponse } from '@/types/group';

interface GroupWithMembership {
  group: Group;
  membership: Membership;
}

export default function HouseholdsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [households, setHouseholds] = useState<GroupWithMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [pendingInvitationsCount, setPendingInvitationsCount] = useState(0);

  // Reload households when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadHouseholds();
      loadPendingInvitations();
    }, [])
  );

  const loadHouseholds = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<GetGroupsResponse>('/api/groups');

      if (response.success) {
        setHouseholds(response.data);
      }
    } catch (error) {
      console.error('Error loading households:', error);
      Alert.alert(
        'Erreur',
        'Impossible de charger les foyers. Veuillez réessayer.'
      );
    } finally {
      setLoading(false);
    }
  };

  const loadPendingInvitations = async () => {
    try {
      const response = await apiService.get<{
        success: boolean;
        invitations: unknown[];
      }>('/api/invitations/pending');

      if (response.success) {
        setPendingInvitationsCount(response.invitations.length);
      }
    } catch (error) {
      console.error('Error loading pending invitations:', error);
      // Don't show error to user, just silently fail
      setPendingInvitationsCount(0);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      owner: 'Maître de foyer',
      admin: 'Administrateur',
      member: 'Membre',
      child: 'Enfant',
      guest: 'Invité',
    };
    return labels[role] || role;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      family: 'Famille',
      roommates: 'Colocataires',
      company: 'Entreprise',
      other: 'Autre',
    };
    return labels[type] || type;
  };

  const getTypeIcon = (
    type: string
  ): 'home' | 'people' | 'business' | 'category' => {
    const icons: Record<string, 'home' | 'people' | 'business' | 'category'> = {
      family: 'home',
      roommates: 'people',
      company: 'business',
      other: 'category',
    };
    return (
      (icons[type] as 'home' | 'people' | 'business' | 'category') || 'category'
    );
  };

  const renderHousehold = ({ item }: { item: GroupWithMembership }) => (
    <Card style={styles.householdCard}>
      <TouchableOpacity
        onPress={() => {
          router.push({
            pathname: '/household-details',
            params: {
              groupId: item.group.id,
              groupName: item.group.name,
            },
          });
        }}
      >
        <CardContent style={styles.householdCardContent}>
          <View style={styles.householdIcon}>
            <MaterialIcons
              name={getTypeIcon(item.group.type)}
              size={32}
              color={theme.colors.primary}
            />
          </View>
          <View style={styles.householdInfo}>
            <Text style={styles.householdName}>{item.group.name}</Text>
            <Text style={styles.householdType}>
              {getTypeLabel(item.group.type)}
            </Text>
            <Text style={styles.householdRole}>
              {getRoleLabel(item.membership.role_name)}
            </Text>
          </View>
          <MaterialIcons
            name="chevron-right"
            size={28}
            color={theme.colors.primary}
          />
        </CardContent>
      </TouchableOpacity>
    </Card>
  );

  // Dynamic styles based on theme
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.divider,
    },
    emptyContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    emptyStateContainer: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 20,
      paddingTop: 30,
      paddingBottom: 16,
    },
    scrollContent: {
      padding: 20,
      paddingTop: 60,
      paddingBottom: 100,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#fff',
      lineHeight: 32,
    },
    headerSubtitle: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.9)',
      marginTop: 4,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    invitationsButton: {
      padding: 8,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 20,
      position: 'relative',
    },
    badge: {
      position: 'absolute',
      top: -4,
      right: -4,
      backgroundColor: '#ff4444',
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 4,
    },
    badgeText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: 'bold',
    },
    refreshButton: {
      padding: 8,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 20,
    },
    listContainer: {
      padding: 16,
      paddingBottom: 100,
    },
    householdCard: {
      marginBottom: 12,
      backgroundColor: theme.colors.card,
      borderWidth: 0,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    householdCardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
    },
    householdIcon: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: theme.colors.divider,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    householdInfo: {
      flex: 1,
    },
    householdName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    householdType: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    householdRole: {
      fontSize: 12,
      color: theme.colors.textTertiary,
      fontStyle: 'italic',
    },
    welcomeIcon: {
      alignSelf: 'center',
      marginBottom: 16,
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.divider,
      justifyContent: 'center',
      alignItems: 'center',
    },
    welcomeCard: {
      backgroundColor: theme.colors.card,
      borderWidth: 0,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    welcomeTitle: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: 'center',
    },
    welcomeDescription: {
      fontSize: 16,
      color: theme.colors.text,
      textAlign: 'center',
      lineHeight: 24,
      marginTop: 8,
    },
    actionCard: {
      backgroundColor: theme.colors.card,
      borderWidth: 0,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    cardTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
    },
    cardDescription: {
      fontSize: 15,
      color: theme.colors.textSecondary,
      lineHeight: 22,
    },
    primaryButton: {
      backgroundColor: theme.colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      borderRadius: 8,
      gap: 8,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    secondaryButton: {
      backgroundColor: theme.colors.surface,
      borderWidth: 2,
      borderColor: theme.colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      borderRadius: 8,
      gap: 8,
    },
    secondaryButtonText: {
      color: theme.colors.primary,
      fontSize: 16,
      fontWeight: '600',
    },
    fab: {
      position: 'absolute',
      bottom: 90,
      right: 20,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 8,
    },
    fabMenuItem: {
      position: 'absolute',
      bottom: 160,
      right: 20,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.card,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 25,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 5,
      gap: 8,
    },
    fabMenuText: {
      color: theme.colors.primary,
      fontSize: 16,
      fontWeight: '600',
    },
  });

  if (loading) {
    return (
      <ProtectedRoute>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement des foyers...</Text>
        </View>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Stack.Screen options={{ headerShown: true, title: 'Organisation' }} />
      <View
        style={households.length > 0 ? styles.container : styles.emptyContainer}
      >
        {/* Households List */}
        {households.length > 0 ? (
          <>
            {/* Header for list view */}
            <View style={styles.header}>
              <View>
                <Text style={styles.headerTitle}>Mes Foyers</Text>
                <Text style={styles.headerSubtitle}>
                  {households.length} organisation
                  {households.length > 1 ? 's' : ''}
                </Text>
              </View>
              <View style={styles.headerActions}>
                {pendingInvitationsCount > 0 && (
                  <TouchableOpacity
                    onPress={() => router.push('/pending-invitations')}
                    style={styles.invitationsButton}
                  >
                    <MaterialIcons name="mail" size={24} color="#fff" />
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {pendingInvitationsCount}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={loadHouseholds}
                  style={styles.refreshButton}
                >
                  <MaterialIcons name="refresh" size={28} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            <FlatList
              data={households}
              keyExtractor={(item) => item.group.id}
              renderItem={renderHousehold}
              contentContainerStyle={styles.listContainer}
            />

            {/* FAB Menu */}
            {showFabMenu && (
              <>
                <TouchableOpacity
                  style={[styles.fabMenuItem, { bottom: 230 }]}
                  onPress={() => {
                    setShowFabMenu(false);
                    router.push('/create-household');
                  }}
                >
                  <MaterialIcons
                    name="home"
                    size={20}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.fabMenuText}>Créer un foyer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.fabMenuItem, { bottom: 160 }]}
                  onPress={() => {
                    setShowFabMenu(false);
                    router.push('/join-household');
                  }}
                >
                  <MaterialIcons
                    name="qr-code-scanner"
                    size={20}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.fabMenuText}>Rejoindre un foyer</Text>
                </TouchableOpacity>
              </>
            )}

            {/* FAB Button */}
            <TouchableOpacity
              style={styles.fab}
              onPress={() => setShowFabMenu(!showFabMenu)}
            >
              <MaterialIcons
                name={showFabMenu ? 'close' : 'add'}
                size={32}
                color="#fff"
              />
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.emptyStateContainer}>
            {/* Main Content */}
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Welcome Card */}
              <Card className="mb-6" style={styles.welcomeCard}>
                <CardHeader>
                  <View style={styles.welcomeIcon}>
                    <MaterialIcons
                      name="home-work"
                      size={48}
                      color={theme.colors.primary}
                    />
                  </View>
                  <CardTitle
                    className="text-center"
                    style={styles.welcomeTitle}
                  >
                    Bienvenue !
                  </CardTitle>
                  <CardDescription
                    className="text-center"
                    style={styles.welcomeDescription}
                  >
                    Vous n'appartenez à aucune organisation pour le moment.
                    Créez-en une ou rejoignez une organisation existante.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Create Organization Card */}
              <Card className="mb-4" style={styles.actionCard}>
                <CardHeader>
                  <CardTitle style={styles.cardTitle}>
                    Créer une organisation
                  </CardTitle>
                  <CardDescription style={styles.cardDescription}>
                    Commencez votre aventure en créant votre propre organisation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TouchableOpacity
                    onPress={() => router.push('/create-household')}
                    style={styles.primaryButton}
                  >
                    <MaterialIcons name="add-circle" size={20} color="#fff" />
                    <Text style={styles.primaryButtonText}>
                      Créer une organisation
                    </Text>
                  </TouchableOpacity>
                </CardContent>
              </Card>

              {/* Join Organization Card */}
              <Card className="mb-4" style={styles.actionCard}>
                <CardHeader>
                  <CardTitle style={styles.cardTitle}>
                    Rejoindre une organisation
                  </CardTitle>
                  <CardDescription style={styles.cardDescription}>
                    Scannez un QR code ou entrez le code d'invitation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TouchableOpacity
                    onPress={() => router.push('/join-household')}
                    style={styles.secondaryButton}
                  >
                    <MaterialIcons
                      name="qr-code-scanner"
                      size={20}
                      color={theme.colors.primary}
                    />
                    <Text style={styles.secondaryButtonText}>
                      Rejoindre un foyer
                    </Text>
                  </TouchableOpacity>
                </CardContent>
              </Card>
            </ScrollView>
          </View>
        )}

        <Navbar />
      </View>
    </ProtectedRoute>
  );
}
