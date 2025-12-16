import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';

import type { GetGroupsResponse } from '@/types/group';
import type { TransferWithDetails } from '@/types/transfer';

import Navbar from '@/components/navbar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { apiService } from '@/services/api.service';
import { transferService } from '@/services/transfer.service';

export default function TaskTransfersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { groupId, groupName } = useLocalSearchParams<{
    groupId: string;
    groupName: string;
  }>();

  const [transfers, setTransfers] = useState<TransferWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'received' | 'sent'>('received');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadTransfers = useCallback(async () => {
    try {
      setLoading(true);
      const params =
        filter === 'received'
          ? { to_me: true, status: 'pending' as const }
          : filter === 'sent'
            ? { from_me: true }
            : {};

      if (groupId) {
        // Load transfers for specific group
        const response = await transferService.getTransfers(groupId, params);
        if (response.success) {
          setTransfers(response.transfers);
        }
      } else {
        // Load transfers from all groups
        const groupsResponse =
          await apiService.get<GetGroupsResponse>('/api/groups');

        if (groupsResponse.success) {
          // Load transfers from all groups and merge them
          const allTransfers: TransferWithDetails[] = [];
          for (const { group } of groupsResponse.data) {
            try {
              const response = await transferService.getTransfers(
                group.id,
                params
              );
              if (response.success) {
                allTransfers.push(...response.transfers);
              }
            } catch (error) {
              console.error(
                `Error loading transfers for group ${group.id}:`,
                error
              );
            }
          }

          // Sort by creation date (newest first)
          allTransfers.sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          );

          setTransfers(allTransfers);
        }
      }
    } catch (error) {
      console.error('Error loading transfers:', error);
      Alert.alert('Erreur', 'Impossible de charger les transferts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [groupId, filter]);

  useEffect(() => {
    loadTransfers();
  }, [loadTransfers]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadTransfers();
  }, [loadTransfers]);

  const handleAccept = async (transferId: string) => {
    const transfer = transfers.find((t) => t.id === transferId);
    if (!transfer) return;

    try {
      setProcessingId(transferId);
      await transferService.acceptTransfer(transfer.group_id, transferId);
      Alert.alert('Succès', 'Transfert accepté');
      loadTransfers();
    } catch (error) {
      console.error('Error accepting transfer:', error);
      Alert.alert('Erreur', "Impossible d'accepter le transfert");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRefuse = async (transferId: string) => {
    const transfer = transfers.find((t) => t.id === transferId);
    if (!transfer) return;

    Alert.alert(
      'Refuser le transfert',
      'Êtes-vous sûr de vouloir refuser ce transfert ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Refuser',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingId(transferId);
              await transferService.refuseTransfer(
                transfer.group_id,
                transferId
              );
              Alert.alert('Succès', 'Transfert refusé');
              loadTransfers();
            } catch (error) {
              console.error('Error refusing transfer:', error);
              Alert.alert('Erreur', 'Impossible de refuser le transfert');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const handleCancel = async (transferId: string) => {
    const transfer = transfers.find((t) => t.id === transferId);
    if (!transfer) return;

    Alert.alert(
      'Annuler le transfert',
      'Êtes-vous sûr de vouloir annuler ce transfert ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingId(transferId);
              await transferService.cancelTransfer(
                transfer.group_id,
                transferId
              );
              Alert.alert('Succès', 'Transfert annulé');
              loadTransfers();
            } catch (error) {
              console.error('Error cancelling transfer:', error);
              Alert.alert('Erreur', "Impossible d'annuler le transfert");
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return theme.colors.warning;
      case 'accepted':
        return theme.colors.success;
      case 'refused':
      case 'cancelled':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'accepted':
        return 'Accepté';
      case 'refused':
        return 'Refusé';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  };

  const renderTransferCard = (transfer: TransferWithDetails) => {
    const isReceived = transfer.to_member?.user_id === user?.id;
    const isPending = transfer.status === 'pending';
    const isProcessing = processingId === transfer.id;

    return (
      <Card key={transfer.id} style={styles.card}>
        <CardHeader>
          <View style={styles.cardHeaderRow}>
            <CardTitle style={{ flex: 1 }}>{transfer.task.title}</CardTitle>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(transfer.status) },
              ]}
            >
              <Text style={styles.statusText}>
                {getStatusLabel(transfer.status)}
              </Text>
            </View>
          </View>
        </CardHeader>

        <CardContent>
          <View style={styles.transferInfo}>
            <View style={styles.infoRow}>
              <MaterialIcons
                name="person"
                size={16}
                color={theme.colors.textSecondary}
              />
              <Text style={[styles.infoLabel, { color: theme.colors.text }]}>
                De :
              </Text>
              <Text
                style={[
                  styles.infoValue,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {transfer.from_member.profile.display_name}
              </Text>
            </View>

            {transfer.to_member && (
              <View style={styles.infoRow}>
                <MaterialIcons
                  name="person-outline"
                  size={16}
                  color={theme.colors.textSecondary}
                />
                <Text style={[styles.infoLabel, { color: theme.colors.text }]}>
                  Pour :
                </Text>
                <Text
                  style={[
                    styles.infoValue,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {transfer.to_member.profile.display_name}
                </Text>
              </View>
            )}

            {transfer.message && (
              <View
                style={[
                  styles.messageContainer,
                  { backgroundColor: theme.colors.card },
                ]}
              >
                <Text
                  style={[styles.messageLabel, { color: theme.colors.text }]}
                >
                  Message :
                </Text>
                <Text
                  style={[
                    styles.messageText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {transfer.message}
                </Text>
              </View>
            )}

            <Text
              style={[styles.dateText, { color: theme.colors.textSecondary }]}
            >
              {new Date(transfer.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>

          {isPending && (
            <View style={styles.actionButtons}>
              {isReceived ? (
                <>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      styles.acceptButton,
                      { backgroundColor: theme.colors.success },
                    ]}
                    onPress={() => handleAccept(transfer.id)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <MaterialIcons name="check" size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>Accepter</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      styles.refuseButton,
                      { backgroundColor: theme.colors.error },
                    ]}
                    onPress={() => handleRefuse(transfer.id)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <MaterialIcons name="close" size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>Refuser</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.cancelButton,
                    { backgroundColor: theme.colors.error },
                  ]}
                  onPress={() => handleCancel(transfer.id)}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <MaterialIcons name="cancel" size={20} color="#fff" />
                      <Text style={styles.actionButtonText}>Annuler</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <ProtectedRoute>
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <MaterialIcons
              name="arrow-back"
              size={24}
              color={theme.colors.text}
            />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {groupName ? `Transferts - ${groupName}` : 'Transferts de tâches'}
          </Text>
        </View>

        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              { borderColor: theme.colors.border },
              filter === 'all' && {
                backgroundColor: theme.colors.primary,
              },
            ]}
            onPress={() => setFilter('all')}
          >
            <Text
              style={[
                styles.filterText,
                { color: theme.colors.text },
                filter === 'all' && styles.filterTextActive,
              ]}
            >
              Tous
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              { borderColor: theme.colors.border },
              filter === 'received' && {
                backgroundColor: theme.colors.primary,
              },
            ]}
            onPress={() => setFilter('received')}
          >
            <Text
              style={[
                styles.filterText,
                { color: theme.colors.text },
                filter === 'received' && styles.filterTextActive,
              ]}
            >
              Reçus
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              { borderColor: theme.colors.border },
              filter === 'sent' && {
                backgroundColor: theme.colors.primary,
              },
            ]}
            onPress={() => setFilter('sent')}
          >
            <Text
              style={[
                styles.filterText,
                { color: theme.colors.text },
                filter === 'sent' && styles.filterTextActive,
              ]}
            >
              Envoyés
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : transfers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons
                name="swap-horiz"
                size={64}
                color={theme.colors.textSecondary}
              />
              <Text
                style={[
                  styles.emptyText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Aucun transfert{' '}
                {filter === 'received'
                  ? 'reçu'
                  : filter === 'sent'
                    ? 'envoyé'
                    : ''}
              </Text>
            </View>
          ) : (
            transfers.map(renderTransferCard)
          )}
        </ScrollView>

        <Navbar />
      </View>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  card: {
    marginBottom: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  transferInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
  },
  messageContainer: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
  },
  messageLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
  },
  dateText: {
    fontSize: 12,
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 8,
  },
  acceptButton: {},
  refuseButton: {},
  cancelButton: {},
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
