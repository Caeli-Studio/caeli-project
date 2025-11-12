import { MaterialIcons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';

import type { RealtimeChannel } from '@supabase/supabase-js';

import CreateTaskForm from '@/components/CreateTaskForm';
import Navbar from '@/components/navbar';
import TaskList from '@/components/TaskList';
import { getTasks, completeTask, type Task } from '@/lib/api';
import {
  subscribeToTasks,
  unsubscribe,
  type RealtimeTask,
} from '@/lib/realtime';

const { width } = Dimensions.get('window');

const Assignement = () => {
  const [activePage, setActivePage] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const route = useRoute();

  // TODO: Récupérer le groupId depuis le contexte/storage
  const GROUP_ID = 'your-group-id'; // À remplacer par la vraie valeur

  useEffect(() => {
    if ((route.params as any)?.page === 1) {
      setActivePage(1);
      scrollViewRef.current?.scrollTo({ x: width * 0.82, animated: true });
    }
  }, [route.params]);

  // Charger les tâches et s'abonner aux changements
  useEffect(() => {
    loadTasks();

    // S'abonner aux changements en temps réel
    channelRef.current = subscribeToTasks(GROUP_ID, {
      onInsert: (task: RealtimeTask) => {
        setTasks((prev) => [task as Task, ...prev]);
        Alert.alert('Nouvelle tâche', `"${task.title}" a été créée`);
      },
      onUpdate: (task: RealtimeTask) => {
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? (task as Task) : t))
        );
      },
      onDelete: (task: RealtimeTask) => {
        setTasks((prev) => prev.filter((t) => t.id !== task.id));
      },
    });

    // Cleanup: se désabonner lors du démontage
    return () => {
      if (channelRef.current) {
        unsubscribe(channelRef.current);
      }
    };
  }, [GROUP_ID]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await getTasks(GROUP_ID, { status: 'open' });

      if (response.success && response.data) {
        setTasks(response.data);
      } else {
        Alert.alert(
          'Erreur',
          response.message || 'Impossible de charger les tâches'
        );
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      Alert.alert(
        'Erreur',
        'Une erreur est survenue lors du chargement des tâches'
      );
    } finally {
      setLoading(false);
    }
  };

  const pages = [{ text: 'Mes tâches' }, { text: 'Nouvelle tâche' }];

  const handleScroll = (event: any) => {
    const pageIndex = Math.round(
      event.nativeEvent.contentOffset.x / (width * 0.8)
    );
    setActivePage(pageIndex);
  };

  const handleTaskCreated = () => {
    // Recharger les tâches
    loadTasks();

    // Revenir à la première page
    setActivePage(0);
    scrollViewRef.current?.scrollTo({ x: 0, animated: true });
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const response = await completeTask(GROUP_ID, taskId);

      if (response.success) {
        Alert.alert('Succès', 'Tâche complétée !');
        loadTasks(); // Recharger les tâches
      } else {
        Alert.alert(
          'Erreur',
          response.message || 'Impossible de compléter la tâche'
        );
      }
    } catch (error) {
      console.error('Error completing task:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    }
  };

  const handleTaskPress = (task: Task) => {
    Alert.alert(task.title, task.description || 'Aucune description', [
      { text: 'Fermer', style: 'cancel' },
      {
        text: 'Compléter',
        style: 'default',
        onPress: () => handleCompleteTask(task.id),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <MaterialIcons name="settings" size={30} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity>
          <MaterialIcons name="logout" size={30} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

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
                  <View style={{ width: '100%', height: 250 }}>
                    <TaskList
                      tasks={tasks}
                      loading={loading}
                      onTaskPress={handleTaskPress}
                      onCompleteTask={handleCompleteTask}
                    />
                  </View>
                ) : (
                  <View style={{ width: '100%', height: '100%' }}>
                    <Text style={styles.message}>{page.text}</Text>
                    <CreateTaskForm
                      groupId={GROUP_ID}
                      onTaskCreated={handleTaskCreated}
                    />
                  </View>
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
  container: {
    flex: 1,
    backgroundColor: '#C5BD83',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
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
    justifyContent: 'flex-start',
    paddingTop: 8,
  },

  message: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#898989',
    textAlign: 'center',
    marginBottom: 12,
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
});

export default Assignement;
