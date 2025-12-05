import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';

import Navbar from '../components/navbar';

import type { GetGroupsResponse } from '@/types/group';
import type { TaskWithDetails, TaskStatus } from '@/types/task';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { apiService } from '@/services/api.service';
import { taskService } from '@/services/task.service';

type FilterType = 'all' | 'mine' | 'open' | 'done';

const Home: React.FC = () => {
  const { user, signOut } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  // State
  const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<TaskWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
  const [myMembershipId, setMyMembershipId] = useState<string | null>(null);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(
    null
  );

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Apply filters when tasks or filter changes
  useEffect(() => {
    applyFilters();
  }, [tasks, currentFilter, myMembershipId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Load groups to get the first group
      const groupsResponse =
        await apiService.get<GetGroupsResponse>('/api/groups');

      if (groupsResponse.success && groupsResponse.data.length > 0) {
        const firstGroup = groupsResponse.data[0];
        setSelectedGroupId(firstGroup.group.id);
        setMyMembershipId(firstGroup.membership.id);

        // Load tasks for this group
        await loadTasks(firstGroup.group.id);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async (groupId: string) => {
    try {
      const response = await taskService.getTasks(groupId, {
        limit: 100,
      });

      if (response.success) {
        // Sort by due date
        const sortedTasks = response.tasks.sort((a, b) => {
          if (!a.due_at) return 1;
          if (!b.due_at) return -1;
          return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
        });
        setTasks(sortedTasks);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    if (!selectedGroupId) return;
    setRefreshing(true);
    await loadTasks(selectedGroupId);
    setRefreshing(false);
  }, [selectedGroupId]);

  const applyFilters = () => {
    let filtered = [...tasks];

    switch (currentFilter) {
      case 'mine':
        filtered = filtered.filter((task) =>
          task.assignments?.some((a) => a.membership_id === myMembershipId)
        );
        break;
      case 'open':
        filtered = filtered.filter((task) => task.status === 'open');
        break;
      case 'done':
        filtered = filtered.filter((task) => task.status === 'done');
        break;
      default:
        // 'all' - no filter
        break;
    }

    setFilteredTasks(filtered);
  };

  const openStatusModal = (task: TaskWithDetails) => {
    setSelectedTask(task);
    setStatusModalVisible(true);
  };

  const closeStatusModal = () => {
    setStatusModalVisible(false);
    setSelectedTask(null);
  };

  const changeTaskStatus = async (newStatus: TaskStatus) => {
    if (!selectedGroupId || !selectedTask) return;

    try {
      closeStatusModal();

      const response = await taskService.updateTask(
        selectedGroupId,
        selectedTask.id,
        { status: newStatus }
      );

      if (response.success) {
        // Reload tasks
        await loadTasks(selectedGroupId);

        const statusLabels: Record<TaskStatus, string> = {
          open: 'À faire',
          done: 'Terminée',
          cancelled: 'Annulée',
        };

        Alert.alert(
          'Succès',
          `Tâche marquée comme "${statusLabels[newStatus]}" !`
        );
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Impossible de changer le statut';
      Alert.alert('Erreur', errorMessage);
    }
  };

  const deleteTask = async () => {
    if (!selectedGroupId || !selectedTask) return;

    // Show confirmation dialog
    Alert.alert(
      'Confirmer la suppression',
      `Êtes-vous sûr de vouloir supprimer la tâche "${selectedTask.title}" ?`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              closeStatusModal();

              const response = await taskService.deleteTask(
                selectedGroupId,
                selectedTask.id
              );

              if (response.success) {
                // Reload tasks
                await loadTasks(selectedGroupId);
                Alert.alert('Succès', 'Tâche supprimée avec succès !');
              }
            } catch (error) {
              console.error('Failed to delete task:', error);
              const errorMessage =
                error instanceof Error
                  ? error.message
                  : 'Impossible de supprimer la tâche';
              Alert.alert('Erreur', errorMessage);
            }
          },
        },
      ]
    );
  };

  const toggleTaskComplete = async (task: TaskWithDetails) => {
    if (!selectedGroupId) return;

    try {
      if (task.status === 'done') {
        Alert.alert('Info', 'Cette tâche est déjà terminée');
        return;
      }

      const response = await taskService.completeTask(selectedGroupId, task.id);

      if (response.success) {
        // Reload tasks
        await loadTasks(selectedGroupId);
        Alert.alert('Succès', 'Tâche marquée comme terminée !');
      }
    } catch (error) {
      console.error('Failed to complete task:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Impossible de terminer la tâche';
      Alert.alert('Erreur', errorMessage);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Se déconnecter',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  // Calculate stats
  const total = filteredTasks.length;
  const done = filteredTasks.filter((t) => t.status === 'done').length;
  const open = filteredTasks.filter((t) => t.status === 'open').length;
  const progress = total === 0 ? 0 : (done / total) * 100;

  // Counters by category
  const allCount = tasks.length;
  const mineCount = tasks.filter((task) =>
    task.assignments?.some((a) => a.membership_id === myMembershipId)
  ).length;
  const openCount = tasks.filter((t) => t.status === 'open').length;
  const doneCount = tasks.filter((t) => t.status === 'done').length;

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const greeting = user?.name
    ? `Bonjour ${user.name.split(' ')[0]} 👋`
    : 'Bonjour 👋';

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'done':
        return theme.colors.taskDone;
      case 'open':
        return theme.colors.taskOpen;
      case 'cancelled':
        return theme.colors.taskCancelled;
      default:
        return theme.colors.textTertiary;
    }
  };

  const getStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case 'done':
        return 'Terminée';
      case 'open':
        return 'À faire';
      case 'cancelled':
        return 'Annulée';
      default:
        return '';
    }
  };

  // Dynamic styles based on theme
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    centered: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 10,
      color: theme.colors.textSecondary,
      fontSize: 16,
    },
    header: {
      marginTop: 50,
      marginHorizontal: 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    date: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.text,
    },
    stats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginVertical: 20,
    },
    card: {
      backgroundColor: theme.colors.card,
      padding: 15,
      borderRadius: 12,
      alignItems: 'center',
      shadowColor: theme.colors.shadow,
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
      width: 90,
    },
    cardNumber: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.text,
    },
    cardLabel: {
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
    progressContainer: {
      marginHorizontal: 20,
      marginBottom: 10,
    },
    progressBar: {
      height: 8,
      backgroundColor: theme.colors.success,
      borderRadius: 10,
    },
    progressText: {
      fontSize: 14,
      color: theme.colors.text,
      marginTop: 6,
      textAlign: 'center',
    },
    filtersContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      marginBottom: 15,
      gap: 10,
    },
    filterButton: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    filterButtonActive: {
      backgroundColor: theme.colors.success,
      borderColor: theme.colors.success,
    },
    filterText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontWeight: '600',
    },
    filterTextActive: {
      color: '#fff',
    },
    sectionTitle: {
      marginHorizontal: 20,
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 10,
    },
    task: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.surface,
      padding: 15,
      marginHorizontal: 20,
      marginBottom: 10,
      borderRadius: 10,
      shadowColor: theme.colors.shadow,
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    taskDone: {
      backgroundColor: theme.colors.successLight,
    },
    taskLeft: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      flex: 1,
    },
    taskContent: {
      flex: 1,
      marginLeft: 10,
    },
    taskText: {
      fontSize: 16,
      color: theme.colors.text,
      fontWeight: '600',
    },
    taskTextDone: {
      textDecorationLine: 'line-through',
      color: theme.colors.textTertiary,
    },
    taskDesc: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    taskDate: {
      fontSize: 12,
      color: theme.colors.textTertiary,
      marginTop: 4,
    },
    taskAssigned: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      color: '#fff',
      fontSize: 11,
      fontWeight: '600',
    },
    empty: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyText: {
      marginTop: 10,
      color: theme.colors.textSecondary,
      fontSize: 16,
    },
    fab: {
      position: 'absolute',
      bottom: 80,
      right: 30,
      backgroundColor: theme.colors.success,
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: theme.colors.shadow,
      shadowOpacity: 0.2,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 5,
      elevation: 5,
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: 15,
      padding: 20,
      width: '100%',
      maxWidth: 400,
      shadowColor: theme.colors.shadow,
      shadowOpacity: 0.25,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 10,
      elevation: 5,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    modalSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 20,
      textAlign: 'center',
    },
    statusOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 15,
      borderRadius: 10,
      marginBottom: 10,
      backgroundColor: theme.colors.divider,
    },
    statusOpen: {
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.taskOpen,
    },
    statusDone: {
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.taskDone,
    },
    statusCancelled: {
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.taskCancelled,
    },
    statusDelete: {
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.error,
      backgroundColor: theme.colors.errorLight,
      marginTop: 10,
    },
    statusOptionText: {
      fontSize: 16,
      color: theme.colors.text,
      marginLeft: 15,
      fontWeight: '500',
    },
    statusDeleteText: {
      fontSize: 16,
      color: theme.colors.error,
      marginLeft: 15,
      fontWeight: '600',
    },
    modalCancelButton: {
      marginTop: 10,
      padding: 15,
      backgroundColor: theme.colors.divider,
      borderRadius: 10,
      alignItems: 'center',
    },
    modalCancelText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
  });

  if (loading) {
    return (
      <ProtectedRoute>
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color={theme.colors.success} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.date}>
              {today.charAt(0).toUpperCase() + today.slice(1)}
            </Text>
            <Text style={styles.title}>{greeting}</Text>
          </View>
          <TouchableOpacity onPress={handleSignOut}>
            <Ionicons
              name="log-out-outline"
              size={28}
              color={theme.colors.error}
            />
          </TouchableOpacity>
        </View>

        {/* STATS SECTION */}
        <View style={styles.stats}>
          <View style={styles.card}>
            <Text style={styles.cardNumber}>{total}</Text>
            <Text style={styles.cardLabel}>Total</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardNumber}>{done}</Text>
            <Text style={styles.cardLabel}>Terminées</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardNumber}>{open}</Text>
            <Text style={styles.cardLabel}>À faire</Text>
          </View>
        </View>

        {/* PROGRESS */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
          <Text style={styles.progressText}>
            Progression : {Math.round(progress)}%
          </Text>
        </View>

        {/* FILTERS */}
        <View style={styles.filtersContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              currentFilter === 'all' && styles.filterButtonActive,
            ]}
            onPress={() => setCurrentFilter('all')}
          >
            <Text
              style={[
                styles.filterText,
                currentFilter === 'all' && styles.filterTextActive,
              ]}
            >
              Toutes ({allCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              currentFilter === 'mine' && styles.filterButtonActive,
            ]}
            onPress={() => setCurrentFilter('mine')}
          >
            <Text
              style={[
                styles.filterText,
                currentFilter === 'mine' && styles.filterTextActive,
              ]}
            >
              Mes tâches ({mineCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              currentFilter === 'open' && styles.filterButtonActive,
            ]}
            onPress={() => setCurrentFilter('open')}
          >
            <Text
              style={[
                styles.filterText,
                currentFilter === 'open' && styles.filterTextActive,
              ]}
            >
              À faire ({openCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              currentFilter === 'done' && styles.filterButtonActive,
            ]}
            onPress={() => setCurrentFilter('done')}
          >
            <Text
              style={[
                styles.filterText,
                currentFilter === 'done' && styles.filterTextActive,
              ]}
            >
              Terminées ({doneCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* TÂCHES */}
        <Text style={styles.sectionTitle}>
          {currentFilter === 'mine'
            ? 'Mes tâches'
            : currentFilter === 'open'
              ? 'Tâches à faire'
              : currentFilter === 'done'
                ? 'Tâches terminées'
                : 'Toutes les tâches'}
        </Text>

        {filteredTasks.length > 0 ? (
          <FlatList
            data={filteredTasks}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => toggleTaskComplete(item)}
                onLongPress={() => openStatusModal(item)}
                style={[styles.task, item.status === 'done' && styles.taskDone]}
              >
                <View style={styles.taskLeft}>
                  <Ionicons
                    name={
                      item.status === 'done'
                        ? 'checkmark-circle'
                        : 'ellipse-outline'
                    }
                    size={24}
                    color={getStatusColor(item.status)}
                  />
                  <View style={styles.taskContent}>
                    <Text
                      style={[
                        styles.taskText,
                        item.status === 'done' && styles.taskTextDone,
                      ]}
                    >
                      {item.title}
                    </Text>
                    {item.description && (
                      <Text style={styles.taskDesc}>{item.description}</Text>
                    )}
                    {item.due_at && (
                      <Text style={styles.taskDate}>
                        📅 {formatDate(item.due_at)}
                      </Text>
                    )}
                    {item.assigned_members &&
                      item.assigned_members.length > 0 && (
                        <Text style={styles.taskAssigned}>
                          👤{' '}
                          {item.assigned_members
                            .map((m) => m.profile.display_name)
                            .join(', ')}
                        </Text>
                      )}
                  </View>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(item.status) },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {getStatusLabel(item.status)}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        ) : (
          <View style={styles.empty}>
            <Ionicons
              name="clipboard-outline"
              size={64}
              color={theme.colors.textTertiary}
            />
            <Text style={styles.emptyText}>Aucune tâche trouvée</Text>
          </View>
        )}

        {/* FAB */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() =>
            router.push({ pathname: '/assignement', params: { page: 1 } })
          }
        >
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>

        {/* Status Change Modal */}
        <Modal
          visible={statusModalVisible}
          transparent
          animationType="fade"
          onRequestClose={closeStatusModal}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={closeStatusModal}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Changer le statut</Text>
              <Text style={styles.modalSubtitle}>
                {selectedTask?.title || ''}
              </Text>

              <TouchableOpacity
                style={[styles.statusOption, styles.statusOpen]}
                onPress={() => changeTaskStatus('open')}
              >
                <Ionicons name="ellipse-outline" size={24} color="#FF9800" />
                <Text style={styles.statusOptionText}>À faire</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statusOption, styles.statusDone]}
                onPress={() => changeTaskStatus('done')}
              >
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                <Text style={styles.statusOptionText}>Terminée</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statusOption, styles.statusCancelled]}
                onPress={() => changeTaskStatus('cancelled')}
              >
                <Ionicons name="close-circle" size={24} color="#F44336" />
                <Text style={styles.statusOptionText}>Annulée</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statusOption, styles.statusDelete]}
                onPress={deleteTask}
              >
                <Ionicons name="trash-outline" size={24} color="#E74C3C" />
                <Text style={styles.statusDeleteText}>Supprimer la tâche</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={closeStatusModal}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        <Navbar />
      </View>
    </ProtectedRoute>
  );
};

export default Home;
