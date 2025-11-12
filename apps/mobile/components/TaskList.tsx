/**
 * Composant de liste de tâches
 */

import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

import type { Task } from '@/lib/api';

interface TaskListProps {
  tasks: Task[];
  loading?: boolean;
  onTaskPress?: (task: Task) => void;
  onCompleteTask?: (taskId: string) => void;
  emptyMessage?: string;
}

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  loading = false,
  onTaskPress,
  onCompleteTask,
  emptyMessage = "Vous n'avez aucune tâche de prévue pour le moment",
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;

    try {
      const date = new Date(dateString);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Réinitialiser les heures pour la comparaison
      today.setHours(0, 0, 0, 0);
      tomorrow.setHours(0, 0, 0, 0);
      date.setHours(0, 0, 0, 0);

      if (date.getTime() === today.getTime()) {
        return "Aujourd'hui";
      } else if (date.getTime() === tomorrow.getTime()) {
        return 'Demain';
      } else if (date < today) {
        return '⚠️ En retard';
      } else {
        return date.toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
        });
      }
    } catch {
      return dateString;
    }
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'done':
        return { name: 'check-circle' as const, color: '#4CAF50' };
      case 'cancelled':
        return { name: 'cancel' as const, color: '#F44336' };
      default:
        return { name: 'radio-button-unchecked' as const, color: '#999' };
    }
  };

  const getStatusLabel = (status: Task['status']) => {
    switch (status) {
      case 'done':
        return 'Terminée';
      case 'cancelled':
        return 'Annulée';
      default:
        return 'En cours';
    }
  };

  const isOverdue = (task: Task) => {
    if (!task.due_at || task.status !== 'open') return false;
    return new Date(task.due_at) < new Date();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#898989" />
        <Text style={styles.loadingText}>Chargement des tâches...</Text>
      </View>
    );
  }

  if (tasks.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="check-circle-outline" size={64} color="#ccc" />
        <Text style={styles.emptyMessage}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={true}
      contentContainerStyle={styles.scrollContent}
    >
      {tasks.map((task) => {
        const statusIcon = getStatusIcon(task.status);
        const overdue = isOverdue(task);

        return (
          <TouchableOpacity
            key={task.id}
            style={[styles.taskCard, overdue && styles.taskCardOverdue]}
            onPress={() => onTaskPress?.(task)}
            activeOpacity={0.7}
          >
            {/* En-tête de la tâche */}
            <View style={styles.taskHeader}>
              <View style={styles.taskHeaderLeft}>
                <MaterialIcons
                  name={statusIcon.name}
                  size={24}
                  color={statusIcon.color}
                />
                <Text
                  style={[
                    styles.taskTitle,
                    task.status === 'done' && styles.taskTitleDone,
                  ]}
                  numberOfLines={2}
                >
                  {task.title}
                </Text>
              </View>

              {task.status === 'open' && onCompleteTask && (
                <TouchableOpacity
                  style={styles.completeButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    onCompleteTask(task.id);
                  }}
                >
                  <MaterialIcons name="check" size={20} color="#4CAF50" />
                </TouchableOpacity>
              )}
            </View>

            {/* Description */}
            {task.description && (
              <Text style={styles.taskDescription} numberOfLines={2}>
                {task.description}
              </Text>
            )}

            {/* Métadonnées */}
            <View style={styles.taskMeta}>
              {/* Date d'échéance */}
              {task.due_at && (
                <View style={styles.metaItem}>
                  <MaterialIcons
                    name="event"
                    size={16}
                    color={overdue ? '#F44336' : '#666'}
                  />
                  <Text
                    style={[styles.metaText, overdue && styles.metaTextOverdue]}
                  >
                    {formatDate(task.due_at)}
                  </Text>
                </View>
              )}

              {/* Tâche libre */}
              {task.is_free && (
                <View style={styles.metaItem}>
                  <MaterialIcons name="group" size={16} color="#2196F3" />
                  <Text style={styles.metaText}>Tâche libre</Text>
                </View>
              )}

              {/* Statut */}
              {task.status !== 'open' && (
                <View style={styles.metaItem}>
                  <Text
                    style={[
                      styles.statusBadge,
                      task.status === 'done' && {
                        backgroundColor: '#E8F5E9',
                        color: '#4CAF50',
                      },
                      task.status === 'cancelled' && {
                        backgroundColor: '#FFEBEE',
                        color: '#F44336',
                      },
                    ]}
                  >
                    {getStatusLabel(task.status)}
                  </Text>
                </View>
              )}
            </View>

            {/* Indicateur visuel pour tâches en retard */}
            {overdue && (
              <View style={styles.overdueIndicator}>
                <MaterialIcons name="warning" size={16} color="#fff" />
                <Text style={styles.overdueText}>En retard</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyMessage: {
    marginTop: 16,
    fontSize: 16,
    color: '#898989',
    textAlign: 'center',
    fontWeight: '500',
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskCardOverdue: {
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  taskHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  taskTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  completeButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#E8F5E9',
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  taskMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#666',
  },
  metaTextOverdue: {
    color: '#F44336',
    fontWeight: '600',
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  overdueIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F44336',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  overdueText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
});

export default TaskList;
