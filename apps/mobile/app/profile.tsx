import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  Switch,
} from 'react-native';

import Navbar from '@/components/navbar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

import { useRouter } from 'expo-router';

const Profile = () => {
  const { user, signOut } = useAuth();
  const { isDark, themeMode, setThemeMode, theme } = useTheme();
  const router = useRouter();


  const handleSignOut = () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  // Dynamic styles based on theme
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      alignItems: 'center',
      marginTop: 50,
    },
    profilePic: {
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    userName: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.text,
      marginTop: 15,
    },
    userRole: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginTop: 5,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      flexWrap: 'wrap',
      marginTop: 30,
    },
    statCard: {
      backgroundColor: theme.colors.card,
      paddingVertical: 15,
      borderRadius: 15,
      alignItems: 'center',
      elevation: 3,
      marginHorizontal: 10,
      marginBottom: 10,
      minWidth: 120,
      flex: 1,
      maxWidth: 150,
    },
    statNumber: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.text,
    },
    statLabel: {
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
    optionsContainer: {
      marginTop: 30,
      paddingHorizontal: 20,
    },
    optionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      padding: 15,
      borderRadius: 10,
      marginBottom: 10,
      elevation: 2,
    },
    optionText: {
      marginLeft: 10,
      fontSize: 16,
      color: theme.colors.text,
      fontWeight: '500',
      flex: 1,
    },
  });

  return (
    <ProtectedRoute>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          {/* PHOTO DE PROFIL */}
          <View style={styles.header}>
            <View style={styles.profilePic}>
              {user?.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.image} />
              ) : (
                <MaterialIcons name="person" size={60} color={theme.colors.surface} />
              )}
            </View>
            <Text style={styles.userName}>{user?.display_name || 'User'}</Text>
            <Text style={styles.userRole}>{user?.email || ''}</Text>
          </View>

          {/* STATS */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>42</Text>
              <Text style={styles.statLabel}>Tâches faites</Text>
            </View>
          </View>

          {/* OPTIONS */}
          <View style={styles.optionsContainer}>
            <TouchableOpacity 
            style={styles.optionButton}
            onPress={() => router.push("/edit-profile")}
            >
              <MaterialIcons name="edit" size={24} color={theme.colors.text} />
              <Text style={styles.optionText}>Modifier le profil</Text>
            </TouchableOpacity>

            <View style={styles.optionButton}>
              <MaterialIcons
                name="palette"
                size={24}
                color={theme.colors.text}
              />
              <Text style={styles.optionText}>
                Thème {isDark ? 'Sombre' : 'Clair'}
              </Text>
              <Switch
                value={themeMode === 'dark'}
                onValueChange={(value) =>
                  setThemeMode(value ? 'dark' : 'light')
                }
                trackColor={{
                  false: theme.colors.border,
                  true: theme.colors.primary,
                }}
                thumbColor={themeMode === 'dark' ? '#fff' : '#f4f3f4'}
              />
            </View>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => Alert.alert('Notifications')}
            >
              <MaterialIcons
                name="notifications"
                size={24}
                color={theme.colors.text}
              />
              <Text style={styles.optionText}>Notifications</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionButton,
                { backgroundColor: theme.colors.error },
              ]}
              onPress={handleSignOut}
            >
              <MaterialIcons name="logout" size={24} color="#fff" />
              <Text style={[styles.optionText, { color: '#fff' }]}>
                Se déconnecter
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <Navbar />
      </View>
    </ProtectedRoute>
  );
};

export default Profile;
