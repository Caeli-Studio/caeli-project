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
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
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
  const { theme } = useTheme();
  const [activePage, setActivePage] = useState(0);
  const [taskName, setTaskName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingTasks] = useState(false);
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groups, setGroups] = useState<GetGroupsResponse['data']>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const scrollViewRef = useRef<ScrollView>(null);
  const route = useRoute<RouteProp<RouteParams, 'assignement'>>();
  const dateSelected = route.params?.selectedDate;

  const [taskDate] = useState(
    dateSelected || new Date().toISOString().split('T')[0]
  );
  const [rawTasks, setRawTasks] = useState<TaskWithDetails[]>([]);

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      loadMembers();
      loadRawTasks();
    }
  }, [selectedGroupId]);

  useEffect(() => {
    if (members.length === 0 || rawTasks.length === 0) return;

    const myMembership = members.find((m) => m.user?.id === user?.id);

    if (!myMembership) {
      setTasks([]);
      return;
    }

    console.log('My membership ID:', myMembership.id);

    const mine = rawTasks.filter((task) =>
      task.assignments?.some((a) => a.membership_id === myMembership.id)
    );

    setTasks(mine);
  }, [members, rawTasks]);

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

  const loadMembers = async () => {
    if (!selectedGroupId) return;

    try {
      type MembersResponse = {
        success: boolean;
        members: any[];
      };

      const res = await apiService.get<MembersResponse>(
        `/api/groups/${selectedGroupId}/members`
      );

      if (res.success && res.members) {
        setMembers(res.members);
      }
    } catch (error) {
      console.error('Failed to load members:', error);
    }
  };

  const loadRawTasks = async () => {
    if (!selectedGroupId) return;

    try {
      const response = await taskService.getTasks(selectedGroupId, {
        status: 'open',
        limit: 50,
      });

      if (response.success) {
        setRawTasks(response.tasks);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', 'Impossible de charger les tâches');
    }
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
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
        assigned_membership_ids: selectedMembers,
      });

      if (response.success) {
        Alert.alert('Succès', 'Tâche créée avec succès !');

        setTaskName('');
        setTaskDescription('');
        setSelectedMembers([]);

        await loadMembers();
        await loadRawTasks();

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

  // Styles
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },

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
      color: theme.colors.text,
      fontWeight: 'bold',
      marginRight: 10,
    },

    groupChip: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 15,
      paddingVertical: 8,
      borderRadius: 20,
      marginRight: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },

    groupChipActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },

    groupChipText: {
      color: theme.colors.text,
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
      backgroundColor: theme.colors.surface,
      borderRadius: 10,
      padding: 16,
      maxWidth: '90%',
      height: 350,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.colors.shadow,
      shadowOpacity: 0.1,
      shadowRadius: 5,
      elevation: 3,
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
      color: theme.colors.text,
      marginBottom: 10,
    },

    message: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: 12,
    },

    input: {
      width: '100%',
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 10,
      borderRadius: 5,
      marginBottom: 10,
      backgroundColor: theme.colors.card,
      color: theme.colors.text,
    },

    assignLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 5,
      alignSelf: 'flex-start',
    },

    chipContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      rowGap: 10,
      columnGap: 10,
      marginBottom: 10,
      width: '100%',
    },

    chip: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 20,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },

    chipSelected: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },

    chipText: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: '500',
    },

    chipTextSelected: {
      color: '#fff',
      fontWeight: '600',
    },

    buttonAdd: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 6,
      minWidth: 150,
      alignItems: 'center',
      marginTop: 10,
    },

    noteText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 10,
      fontStyle: 'italic',
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
      backgroundColor: theme.colors.border,
      marginHorizontal: 4,
    },

    activeDot: {
      backgroundColor: theme.colors.primary,
    },

    taskBox: {
      backgroundColor: theme.colors.card,
      borderRadius: 10,
      padding: 15,
      marginBottom: 10,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },

    taskTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
    },

    taskDesc: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },

    taskAssign: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },

    taskDate: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/organisation')}>
          <MaterialIcons name="group" size={30} color={theme.colors.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/profile')}>
          <MaterialIcons name="person" size={30} color={theme.colors.text} />
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

      {/* CONTENT */}
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
            {/* PAGE 1 — LISTE DES TÂCHES */}
            {pages.map((page, index) => (
              <View style={styles.innerContent} key={index}>
                {index === 0 ? (
                  loadingTasks ? (
                    <ActivityIndicator
                      size="large"
                      color={theme.colors.primary}
                    />
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
                  // PAGE 2 — CRÉATION DE TÂCHE
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
                      editable={!loading}
                    />

                    <Text style={styles.assignLabel}>Assigné à :</Text>

                    <View style={styles.chipContainer}>
                      {members.length === 0 ? (
                        <Text style={styles.noteText}>
                          Aucun membre dans ce foyer.
                        </Text>
                      ) : (
                        members.map((m) => {
                          const selected = selectedMembers.includes(m.id);

                          return (
                            <TouchableOpacity
                              key={m.id}
                              style={[
                                styles.chip,
                                selected && styles.chipSelected,
                              ]}
                              onPress={() => toggleMember(m.id)}
                            >
                              <Text
                                style={[
                                  styles.chipText,
                                  selected && styles.chipTextSelected,
                                ]}
                              >
                                {m.profile.display_name}
                              </Text>
                            </TouchableOpacity>
                          );
                        })
                      )}
                    </View>

                    <TextInput
                      style={styles.input}
                      value={taskDate}
                      editable={false}
                    />

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

          {/* DOTS */}
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

export default Assignement;
