import { MaterialIcons } from '@expo/vector-icons';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';

import type { GetGroupsResponse } from '@/types/group';
import type { TaskWithDetails } from '@/types/task';

import Navbar from '@/components/navbar';
import { apiService } from '@/services/api.service';
import { taskService } from '@/services/task.service';

const { width } = Dimensions.get('window');

type RouteParams = {
  assignement: {
    page?: number;
    selectedDate?: string;
  };
};

const Assignement = () => {
  const router = useRouter();
  const [activePage, setActivePage] = useState(0);
  const [taskName, setTaskName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Tasks fetched from API
  const [tasks, setTasks] = useState<TaskWithDetails[]>([]);

  // Current selected group
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groups, setGroups] = useState<GetGroupsResponse['data']>([]);

  const scrollViewRef = useRef<ScrollView>(null);
  const route = useRoute<RouteProp<RouteParams, 'assignement'>>();
  const dateSelected = route.params?.selectedDate;

  const [taskDate] = useState(
    dateSelected || new Date().toISOString().split('T')[0]
  );

  // Load user's groups on mount
  useEffect(() => {
    loadGroups();
  }, []);

  // Load tasks when group is selected
  useEffect(() => {
    if (selectedGroupId) {
      loadTasks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroupId]);

  useEffect(() => {
    if (route.params?.page === 1) {
      setActivePage(1);
      scrollViewRef.current?.scrollTo({ x: width * 0.82, animated: true });
    }
  }, [route.params]);

  const loadGroups = async () => {
    try {
      const response = await apiService.get<GetGroupsResponse>('/api/groups');
      if (response.success && response.data.length > 0) {
        setGroups(response.data);
        setSelectedGroupId(response.data[0].group.id);
      }
    } catch (error) {
      console.error('Failed to load groups:', error);
      Alert.alert('Erreur', 'Impossible de charger les foyers');
    }
  };

  const loadTasks = async () => {
    if (!selectedGroupId) return;

    setLoadingTasks(true);
    try {
      const response = await taskService.getTasks(selectedGroupId, {
        status: 'open',
        limit: 50,
      });

      if (response.success) {
        setTasks(response.tasks);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
      Alert.alert('Erreur', 'Impossible de charger les tâches');
    } finally {
      setLoadingTasks(false);
    }
  };

  const pages = [
    {
      text:
        tasks.length === 0
          ? "Vous n'avez aucune tâche de prévue pour le moment"
          : 'Mes tâches',
    },
    { text: 'Nouvelle tâche' },
  ];

  const handleScroll = (event: {
    nativeEvent: { contentOffset: { x: number } };
  }) => {
    const pageIndex = Math.round(
      event.nativeEvent.contentOffset.x / (width * 0.8)
    );
    setActivePage(pageIndex);
  };

  const handleAddTask = async () => {
    if (!taskName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer le nom de la tâche.');
      return;
    }

    if (!selectedGroupId) {
      Alert.alert('Erreur', 'Aucun foyer sélectionné');
      return;
    }

    setLoading(true);

    try {
      const dueDate = taskDate ? `${taskDate}T23:59:59Z` : undefined;

      const response = await taskService.createTask(selectedGroupId, {
        title: taskName.trim(),
        description: taskDescription.trim() || undefined,
        due_at: dueDate,
      });

      if (response.success) {
        Alert.alert('Succès', 'Tâche créée avec succès !');

        setTaskName('');
        setTaskDescription('');

        await loadTasks();

        setActivePage(0);
        scrollViewRef.current?.scrollTo({ x: 0, animated: true });
      }
    } catch (error: unknown) {
      console.error('Failed to create task:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Impossible de créer la tâche';
      Alert.alert('Erreur', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/organisation')}>
          <MaterialIcons name="group" size={30} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/profile')}>
          <MaterialIcons name="person" size={30} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Group Selector */}
      {groups.length > 0 && (
        <View style={styles.groupSelector}>
          <Text style={styles.groupLabel}>Foyer:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {groups.map((item) => (
              <TouchableOpacity
                key={item.group.id}
                style={[
                  styles.groupChip,
                  selectedGroupId === item.group.id && styles.groupChipActive,
                ]}
                onPress={() => setSelectedGroupId(item.group.id)}
              >
                <Text
                  style={[
                    styles.groupChipText,
                    selectedGroupId === item.group.id &&
                      styles.groupChipTextActive,
                  ]}
                >
                  {item.group.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Contenu centré */}
      <View style={styles.centeredContent}>
        <View style={styles.card}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
            contentContainerStyle={{
              alignItems: 'center',
              height: '100%',
            }}
          >
            {pages.map((page, index) => (
              <View style={styles.innerContent} key={index}>
                {index === 0 ? (
                  loadingTasks ? (
                    <ActivityIndicator size="large" color="#898989" />
                  ) : tasks.length === 0 ? (
                    <Text style={styles.message}>{page.text}</Text>
                  ) : (
                    <>
                      <Text style={styles.pageTitle}>{page.text}</Text>
                      <ScrollView
                        style={{ width: '100%', maxHeight: 270 }}
                        showsVerticalScrollIndicator={true}
                      >
                        {tasks.map((task) => (
                          <View key={task.id} style={styles.taskBox}>
                            <Text style={styles.taskTitle}>{task.title}</Text>
                            {task.description && (
                              <Text style={styles.taskDesc}>
                                {task.description}
                              </Text>
                            )}
                            {task.assigned_members &&
                              task.assigned_members.length > 0 && (
                                <Text style={styles.taskAssign}>
                                  👤{' '}
                                  {task.assigned_members
                                    .map((m) => m.profile.display_name)
                                    .join(', ')}
                                </Text>
                              )}
                            {task.due_at && (
                              <Text style={styles.taskDate}>
                                📅 {formatDate(task.due_at)}
                              </Text>
                            )}
                          </View>
                        ))}
                      </ScrollView>
                    </>
                  )
                ) : (
                  // Deuxième page : formulaire
                  <>
                    <Text style={styles.message}>{page.text}</Text>

                    <TextInput
                      style={styles.input}
                      placeholder="Nom de la tâche *"
                      value={taskName}
                      onChangeText={setTaskName}
                      editable={!loading}
                    />

                    <TextInput
                      style={styles.input}
                      placeholder="Description de la tâche ..."
                      value={taskDescription}
                      onChangeText={setTaskDescription}
                      multiline
                      numberOfLines={2}
                      editable={!loading}
                    />

                    <TextInput
                      style={styles.input}
                      placeholder="Date d'échéance (AAAA-MM-JJ)"
                      value={taskDate}
                      editable={false}
                    />

                    <Text style={styles.noteText}>
                      💡 Assignation de membres : à venir
                    </Text>

                    <TouchableOpacity
                      style={styles.buttonAdd}
                      onPress={handleAddTask}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.buttonText}>Créer la tâche</Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </View>
            ))}
          </ScrollView>

          {/* Dots */}
          <View style={styles.dotContainer}>
            {pages.map((_, index) => (
              <View
                key={index}
                style={[styles.dot, activePage === index && styles.activeDot]}
              />
            ))}
          </View>
        </View>
      </View>

      <Navbar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#C5BD83' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
  },

  groupSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
  },

  groupLabel: {
    color: '#FFF',
    fontWeight: 'bold',
    marginRight: 10,
  },

  groupChip: {
    backgroundColor: '#FFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },

  groupChipActive: {
    backgroundColor: '#898989',
  },

  groupChipText: {
    color: '#898989',
    fontWeight: '600',
  },

  groupChipTextActive: {
    color: '#FFF',
  },

  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  card: {
    backgroundColor: '#D9D9D9',
    borderRadius: 10,
    padding: 16,
    maxWidth: '90%',
    height: 350,
    alignItems: 'center',
    justifyContent: 'center',
  },

  innerContent: {
    width: width * 0.82,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  pageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },

  message: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#898989',
    textAlign: 'center',
    marginBottom: 12,
  },

  noteText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
    fontStyle: 'italic',
  },

  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    backgroundColor: '#fff',
  },

  buttonAdd: {
    backgroundColor: '#898989',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    minWidth: 150,
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  dotContainer: {
    flexDirection: 'row',
    marginTop: 16,
    justifyContent: 'center',
  },

  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#C0C0C0',
    marginHorizontal: 4,
  },

  activeDot: {
    backgroundColor: '#898989',
  },

  taskBox: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },

  taskDesc: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },

  taskAssign: {
    fontSize: 13,
    color: '#444',
    marginTop: 4,
  },

  taskDate: {
    fontSize: 13,
    color: '#555',
    marginTop: 4,
  },
});

export default Assignement;
