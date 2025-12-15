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
};

const MyCalendar: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const { theme } = useTheme();

  // ✅ tâches assignées à moi (tous groupes confondus)
  const [myTasks, setMyTasks] = useState<TaskWithDetails[]>([]);
  const [markedTaskDates, setMarkedTaskDates] = useState<Record<string, any>>(
    {}
  );

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
      width: '70%',
      backgroundColor: theme.colors.surface,
      borderRadius: 10,
      padding: 20,
      alignItems: 'center',
    },
    modalText: {
      fontSize: 16,
      marginBottom: 10,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    modalDate: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 12,
      color: theme.colors.text,
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
                <Text style={styles.modalDate}>{selectedDate}</Text>

                <Text style={styles.modalText}>
                  {tasksForSelectedDate.length === 0
                    ? 'Aucune tâche prévue'
                    : `${tasksForSelectedDate.length} tâche(s) à faire`}
                </Text>

                <TouchableOpacity onPress={handleAddPress}>
                  <MaterialIcons
                    name="add-circle"
                    size={60}
                    color={theme.colors.primary}
                  />
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
