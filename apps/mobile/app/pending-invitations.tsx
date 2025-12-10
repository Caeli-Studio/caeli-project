import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
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

interface PendingInvitation {
  id: string;
  pseudo: string;
  expires_at: string;
  group: {
    id: string;
    name: string;
    type: string;
  };
}

export default function PendingInvitationsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Reload invitations when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadInvitations();
    }, [])
  );

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<{
        success: boolean;
        invitations: PendingInvitation[];
      }>('/api/invitations/pending');

      if (response.success) {
        setInvitations(response.invitations);
      }
    } catch (error) {
      console.error('Error loading invitations:', error);
      Alert.alert('Erreur', 'Impossible de charger les invitations.');
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async (invitation: PendingInvitation) => {
    try {
      setActionLoading(invitation.id);
      const response = await apiService.post<{
        success: boolean;
        membership: unknown;
        message: string;
      }>(`/api/invitations/${invitation.pseudo}/accept`, {});

      if (response.success) {
        Alert.alert('Succès', `Vous avez rejoint ${invitation.group.name} !`, [
          {
            text: 'OK',
            onPress: () => {
              loadInvitations();
              router.push('/organisation');
            },
          },
        ]);
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      Alert.alert('Erreur', "Impossible d'accepter l'invitation.");
    } finally {
      setActionLoading(null);
    }
  };

  const refuseInvitation = async (invitationId: string) => {
    try {
      setActionLoading(invitationId);
      const response = await apiService.post<{
        success: boolean;
        message: string;
      }>(`/api/invitations/${invitationId}/refuse`, {});

      if (response.success) {
        Alert.alert('Invitation refusée', "L'invitation a été refusée.", [
          {
            text: 'OK',
            onPress: () => loadInvitations(),
          },
        ]);
      }
    } catch (error) {
      console.error('Error refusing invitation:', error);
      Alert.alert('Erreur', "Impossible de refuser l'invitation.");
    } finally {
      setActionLoading(null);
    }
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
    return icons[type] || 'category';
  };

  const formatExpiryDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.ceil(
      (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays < 1) return "Expire aujourd'hui";
    if (diffInDays === 1) return 'Expire demain';
    return `Expire dans ${diffInDays} jours`;
  };

  // Dynamic styles based on theme
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
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
      backgroundColor: theme.colors.primary,
      paddingTop: 60,
      paddingBottom: 20,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
    },
    backButton: {
      marginRight: 15,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#fff',
    },
    content: {
      flex: 1,
      padding: 20,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginBottom: 16,
    },
    invitationCard: {
      marginBottom: 16,
      backgroundColor: theme.colors.card,
    },
    invitationContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
    },
    invitationIcon: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: theme.colors.primaryLight + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    invitationInfo: {
      flex: 1,
    },
    invitationGroupName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    invitationType: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    expiryText: {
      fontSize: 12,
      color: theme.colors.textTertiary,
      fontStyle: 'italic',
    },
    actionsContainer: {
      flexDirection: 'row',
      padding: 16,
      paddingTop: 0,
      gap: 12,
    },
    refuseButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      borderRadius: 8,
      backgroundColor: theme.colors.buttonSecondary,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    refuseButtonText: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 6,
    },
    acceptButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      borderRadius: 8,
      backgroundColor: theme.colors.primary,
    },
    acceptButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 6,
    },
    emptyCard: {
      marginTop: 40,
      backgroundColor: theme.colors.card,
    },
    emptyIcon: {
      alignSelf: 'center',
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 20,
      textAlign: 'center',
      color: theme.colors.text,
    },
    emptyDescription: {
      fontSize: 14,
      textAlign: 'center',
      color: theme.colors.textSecondary,
      marginTop: 8,
    },
  });

  const renderInvitation = (invitation: PendingInvitation) => {
    const isLoading = actionLoading === invitation.id;

    return (
      <Card key={invitation.id} style={styles.invitationCard}>
        <CardContent style={styles.invitationContent}>
          <View style={styles.invitationIcon}>
            <MaterialIcons
              name={getTypeIcon(invitation.group.type)}
              size={32}
              color={theme.colors.primary}
            />
          </View>

          <View style={styles.invitationInfo}>
            <Text style={styles.invitationGroupName}>
              {invitation.group.name}
            </Text>
            <Text style={styles.invitationType}>
              {getTypeLabel(invitation.group.type)}
            </Text>
            <Text style={styles.expiryText}>
              {formatExpiryDate(invitation.expires_at)}
            </Text>
          </View>
        </CardContent>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.refuseButton}
            onPress={() => refuseInvitation(invitation.id)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator
                size="small"
                color={theme.colors.textSecondary}
              />
            ) : (
              <>
                <MaterialIcons
                  name="close"
                  size={20}
                  color={theme.colors.textSecondary}
                />
                <Text style={styles.refuseButtonText}>Refuser</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => acceptInvitation(invitation)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialIcons name="check" size={20} color="#fff" />
                <Text style={styles.acceptButtonText}>Accepter</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Invitations en attente</Text>
        </View>

        <ScrollView style={styles.content}>
          {invitations.length > 0 ? (
            <>
              <Text style={styles.subtitle}>
                Vous avez {invitations.length} invitation
                {invitations.length > 1 ? 's' : ''} en attente
              </Text>
              {invitations.map(renderInvitation)}
            </>
          ) : (
            <Card style={styles.emptyCard}>
              <CardHeader>
                <View style={styles.emptyIcon}>
                  <MaterialIcons
                    name="inbox"
                    size={64}
                    color={theme.colors.textTertiary}
                  />
                </View>
                <CardTitle style={styles.emptyTitle}>
                  Aucune invitation
                </CardTitle>
                <CardDescription style={styles.emptyDescription}>
                  Vous n'avez pas d'invitations en attente pour le moment.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </ScrollView>

        <Navbar />
      </View>
    </ProtectedRoute>
  );
}
