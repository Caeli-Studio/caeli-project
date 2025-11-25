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
} from 'react-native';

import Navbar from '../components/navbar';

import type { GetGroupsResponse } from '@/types/group';
import type { TaskWithDetails, TaskStatus } from '@/types/task';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api.service';
import { taskService } from '@/services/task.service';

type FilterType = 'all' | 'mine' | 'open' | 'done';

const Home: React.FC = () => {
  const { user, signOut } = useAuth();
  const router = useRouter();

  // State
  const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<TaskWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
  const [myMembershipId, setMyMembershipId] = useState<string | null>(null);

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
        return '#4CAF50';
      case 'open':
        return '#FF9800';
      case 'cancelled':
        return '#F44336';
      default:
        return '#999';
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

  if (loading) {
    return (
      <ProtectedRoute>
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color="#4CAF50" />
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
            <Ionicons name="log-out-outline" size={28} color="#FF5252" />
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
            <Ionicons name="clipboard-outline" size={64} color="#aaa" />
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

        <Navbar />
      </View>
    </ProtectedRoute>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E9E4B8',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
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
    color: '#555',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    width: 90,
  },
  cardNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  cardLabel: {
    fontSize: 13,
    color: '#666',
  },
  progressContainer: {
    marginHorizontal: 20,
    marginBottom: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
  },
  progressText: {
    fontSize: 14,
    color: '#333',
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
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  filterText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
  },
  sectionTitle: {
    marginHorizontal: 20,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  task: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  taskDone: {
    backgroundColor: '#e7f6e7',
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
    color: '#333',
    fontWeight: '600',
  },
  taskTextDone: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  taskDesc: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  taskDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  taskAssigned: {
    fontSize: 12,
    color: '#555',
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
    color: '#666',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 30,
    backgroundColor: '#4CAF50',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 5,
  },
});

export default Home;
