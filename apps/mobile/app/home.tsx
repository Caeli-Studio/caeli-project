import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';

import Navbar from '../components/navbar';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

const Home: React.FC = () => {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState([
    { id: '1', title: 'Faire les courses 🛒', done: false },
    { id: '2', title: 'Réviser le chapitre 5 📚', done: true },
    { id: '3', title: 'Envoyer un mail à Clara ✉️', done: false },
  ]);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;
  const progress = total === 0 ? 0 : (done / total) * 100;

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const greeting = user?.name
    ? `Bonjour ${user.name.split(' ')[0]} 👋`
    : 'Bonjour 👋';

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
            <Text style={styles.cardNumber}>{total - done}</Text>
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

        {/* TÂCHES */}
        <Text style={styles.sectionTitle}>Tâches du jour</Text>

        {tasks.length > 0 ? (
          <FlatList
            data={tasks}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => toggleTask(item.id)}
                style={[styles.task, item.done && styles.taskDone]}
              >
                <Ionicons
                  name={item.done ? 'checkmark-circle' : 'ellipse-outline'}
                  size={24}
                  color={item.done ? '#4CAF50' : '#555'}
                />
                <Text
                  style={[styles.taskText, item.done && styles.taskTextDone]}
                >
                  {item.title}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        ) : (
          <View style={styles.empty}>
            <Ionicons name="clipboard-outline" size={64} color="#aaa" />
            <Text style={styles.emptyText}>Aucune tâche pour l’instant</Text>
          </View>
        )}

        {/* FAB */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/create-household')}
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
  taskText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  taskTextDone: {
    textDecorationLine: 'line-through',
    color: '#999',
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
