import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Modal,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { Calendar } from 'react-native-calendars';

import type { GetGroupsResponse } from '@/types/group';
import type { TaskWithDetails } from '@/types/task';

import Navbar from '@/components/navbar';
import { useTheme } from '@/contexts/ThemeContext';
import { apiService } from '@/services/api.service';
import { taskService } from '@/services/task.service';

const { width } = Dimensions.get('window');

type RootStackParamList = {
  assignement: { page?: number; selectedDate?: string };
  calendar: { page?: number };
  home: { taskId?: string; groupId?: string };
};

const MyCalendar: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const { theme } = useTheme();

  // ✅ tâches assignées à moi (tous groupes confondus)
  const [myTasks, setMyTasks] = useState<TaskWithDetails[]>([]);
  type MarkedDate = {
    marked?: boolean;
    selected?: boolean;
    selectedColor?: string;
    dotColor?: string;
    customStyles?: {
      container?: object;
      text?: object;
    };
  };

  const [markedTaskDates, setMarkedTaskDates] = useState<
    Record<string, MarkedDate>
  >({});

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const handleDayPress = (day: { dateString: string }) => {
    setSelectedDate(day.dateString);
    setModalVisible(true);
  };

  const handleAddPress = () => {
    setModalVisible(false);
    navigation.navigate('assignement', { page: 1, selectedDate });
  };

  // ✅ Charger les tâches "à moi" pour TOUS les groupes
  useEffect(() => {
    const loadMyAssignedTasks = async () => {
      try {
        const groupsRes =
          await apiService.get<GetGroupsResponse>('/api/groups');

        if (!groupsRes.success) return;

        const allMine: TaskWithDetails[] = [];

        for (const item of groupsRes.data) {
          const groupId = item.group.id;
          const myMembershipId = item.membership.id;

          const tasksRes = await taskService.getTasks(groupId, {
            status: 'open',
            limit: 100,
          });

          if (!tasksRes.success) continue;

          const mine = tasksRes.tasks.filter((task) =>
            task.assignments?.some((a) => a.membership_id === myMembershipId)
          );

          allMine.push(...mine);
        }

        setMyTasks(allMine);
      } catch (e) {
        console.error('Failed to load calendar tasks', e);
      }
    };

    loadMyAssignedTasks();
  }, []);

  // ✅ Construire les dates à marquer
  useEffect(() => {
    const marked: Record<string, any> = {};

    for (const task of myTasks) {
      if (!task.due_at) continue;

      const date = task.due_at.split('T')[0];

      marked[date] = {
        customStyles: {
          container: {
            backgroundColor: `${theme.colors.primary}25`, // 🟦 fond léger
            borderRadius: 8,
          },
          text: {
            color: theme.colors.text,
            fontWeight: 'bold',
          },
        },
        marked: true,
        dotColor: theme.colors.primary, // 🔵 point conservé
      };
    }

    setMarkedTaskDates(marked);
  }, [myTasks, theme.colors.primary, theme.colors.text]);

  // ✅ Fusion : points + sélection du jour
  const markedDates = useMemo(() => {
    return {
      ...markedTaskDates,
      ...(selectedDate && {
        [selectedDate]: {
          ...(markedTaskDates[selectedDate] || {}),
          selected: true,
          selectedColor: theme.colors.primary,
        },
      }),
    };
  }, [markedTaskDates, selectedDate, theme.colors.primary]);

  // (optionnel) compteur dans le modal
  const tasksForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return myTasks.filter((t) => t.due_at?.startsWith(selectedDate));
  }, [myTasks, selectedDate]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    calendarWrapper: {
      width: width * 0.8,
      borderRadius: 10,
      overflow: 'hidden',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: '85%',
      backgroundColor: theme.colors.surface,
      borderRadius: 10,
      padding: 20,
      alignItems: 'center',
    },

    modalDate: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 12,
      color: theme.colors.text,
    },

    modalSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 12,
      textAlign: 'center',
    },

    taskItem: {
      width: '100%',
      backgroundColor: theme.colors.card,
      borderRadius: 8,
      padding: 10,
      marginBottom: 8,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.primary,
    },

    taskTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.text,
    },

    taskDescription: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },

    addButton: {
      alignItems: 'center',
      marginTop: 8,
    },

    addButtonText: {
      marginTop: 4,
      fontSize: 14,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    taskList: {
      width: '100%',
      maxHeight: 260,
      marginBottom: 12,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.calendarWrapper}>
        <Calendar
          onDayPress={handleDayPress}
          markedDates={markedDates}
          markingType="custom"
          theme={{
            backgroundColor: theme.colors.surface,
            calendarBackground: theme.colors.surface,
            textSectionTitleColor: theme.colors.text,
            selectedDayBackgroundColor: theme.colors.primary,
            selectedDayTextColor: '#ffffff',
            todayTextColor: theme.colors.primary,
            dayTextColor: theme.colors.text,
            textDisabledColor: theme.colors.textTertiary,
            monthTextColor: theme.colors.text,
            textMonthFontWeight: 'bold',
            arrowColor: theme.colors.primary,
          }}
        />
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                {/* Date */}
                <Text style={styles.modalDate}>{selectedDate}</Text>

                {/* Sous-titre */}
                <Text style={styles.modalSubtitle}>
                  {tasksForSelectedDate.length === 0
                    ? 'Aucune tâche pour cette journée'
                    : 'Tâches à effectuer'}
                </Text>

                {/* Liste des tâches */}
                {tasksForSelectedDate.length > 0 && (
                  <ScrollView
                    style={styles.taskList}
                    showsVerticalScrollIndicator={false}
                  >
                    {tasksForSelectedDate.map((task) => (
                      <TouchableOpacity
                        key={task.id}
                        style={styles.taskItem}
                        onPress={() => {
                          setModalVisible(false);
                          navigation.navigate('home', {
                            taskId: task.id,
                            groupId: task.group_id,
                          });
                        }}
                      >
                        <Text style={styles.taskTitle}>{task.title}</Text>

                        {task.description && (
                          <Text style={styles.taskDescription}>
                            {task.description}
                          </Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}

                {/* Bouton ajouter */}
                <TouchableOpacity
                  onPress={handleAddPress}
                  style={styles.addButton}
                >
                  <MaterialIcons
                    name="add-circle"
                    size={56}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.addButtonText}>
                    {tasksForSelectedDate.length === 0
                      ? 'Créer une tâche'
                      : 'Ajouter une tâche'}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Navbar />
    </View>
  );
};

export default MyCalendar;
