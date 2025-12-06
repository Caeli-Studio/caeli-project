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
  Modal, // Importé pour la fenêtre de modification du nom
  TextInput, // Importé pour la saisie du nouveau nom
} from 'react-native';

import Navbar from '@/components/navbar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

const Profile = () => {
  // NOTE: J'ai supposé que le hook useAuth fournit une fonction
  // pour mettre à jour le nom (updateUserName) pour la persistance.
  const { user, signOut, updateUserName } = useAuth();
  const { isDark, themeMode, setThemeMode, theme } = useTheme();

  // État pour le nom/pseudo modifiable
  const [userName, setUserName] = useState<string>(user?.name || 'User');

  const [profileImage, setProfileImage] = useState<string | null>(
    user?.avatar || null
  );

  // État pour la visibilité de la modal de modification du nom
  const [isModalVisible, setIsModalVisible] = useState(false);
  // État pour la valeur temporaire du TextInput dans la modal
  const [inputNickname, setInputNickname] = useState<string>(userName);

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.status !== 'granted') {
      Alert.alert(
        'Permission refusée',
        "Autorisez l'accès à la galerie pour changer la photo."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setProfileImage(uri);
    }
  };

  /**
   * Ouvre la Modal pour modifier le nom d'utilisateur.
   */
  const handleEditNickname = () => {
    setInputNickname(userName); // Initialise l'input avec le nom actuel
    setIsModalVisible(true); // Ouvre la modal
  };

  /**
   * Sauvegarde le nouveau nom d'utilisateur.
   */
  const saveNickname = async () => {
    if (inputNickname && inputNickname.trim().length > 0) {
      const trimmedNickname = inputNickname.trim();
      setUserName(trimmedNickname); // Mise à jour de l'état local

      // Si updateUserName existe dans AuthContext, on met à jour le backend/contexte
      if (updateUserName) {
        // NOTE: Vous devez implémenter cette fonction dans votre AuthContext.tsx
        const success = await updateUserName(trimmedNickname);
        if (!success) {
          // Revert l'état local si l'update échoue
          setUserName(user?.name || 'User');
          Alert.alert(
            'Erreur',
            'Impossible de sauvegarder le nom. Veuillez réessayer.'
          );
        }
      }
      setIsModalVisible(false); // Ferme la modal
    } else {
      Alert.alert('Erreur', "Le nom d'utilisateur ne peut pas être vide.");
    }
  };

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
    // --- Styles de la Modal ---
    centeredView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.6)',
    },
    modalView: {
      margin: 20,
      backgroundColor: theme.colors.card,
      borderRadius: 15,
      padding: 25,
      alignItems: 'center',
      width: '80%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    modalTitle: {
      marginBottom: 20,
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.text,
    },
    textInput: {
      width: '100%',
      height: 45,
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderWidth: 1,
      borderRadius: 8,
      marginBottom: 20,
      paddingHorizontal: 15,
      fontSize: 16,
      color: theme.colors.text,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
    },
    button: {
      borderRadius: 10,
      padding: 10,
      elevation: 2,
      flex: 1,
      marginHorizontal: 5,
      alignItems: 'center',
    },
    buttonCancel: {
      backgroundColor: theme.colors.border,
    },
    buttonSave: {
      backgroundColor: theme.colors.primary,
    },
    textStyle: {
      color: theme.colors.surface,
      fontWeight: 'bold',
      textAlign: 'center',
    },
  });

  return (
    <ProtectedRoute>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          {/* PHOTO DE PROFIL */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.profilePic} onPress={pickImage}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.image} />
              ) : (
                <MaterialIcons
                  name="person"
                  size={60}
                  color={theme.colors.surface}
                />
              )}
            </TouchableOpacity>
            {/* AFFICHAGE DU PSEUDO MODIFIABLE */}
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.userRole}>{user?.email || ''}</Text>
          </View>

          {/* STATS */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>42</Text>
              <Text style={styles.statLabel}>Tâches faites</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>5</Text>
              <Text style={styles.statLabel}>Aujourd’hui</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>7🔥</Text>
              <Text style={styles.statLabel}>Jours actifs</Text>
            </View>
          </View>

          {/* OPTIONS */}
          <View style={styles.optionsContainer}>
            {/* BOUTON MODIFIER LE NOM (PSEUDO) */}
            <TouchableOpacity
              style={styles.optionButton}
              onPress={handleEditNickname} // Appel pour ouvrir la modal
            >
              <MaterialIcons name="edit" size={24} color={theme.colors.text} />
              <Text style={styles.optionText}>
                Modifier le nom d'utilisateur
              </Text>
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

        {/* --- MODAL DE MODIFICATION DU NOM --- */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={isModalVisible}
          onRequestClose={() => setIsModalVisible(false)}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>Modifier le nom</Text>
              <TextInput
                style={styles.textInput}
                onChangeText={setInputNickname}
                value={inputNickname}
                placeholder="Nouveau pseudo"
                placeholderTextColor={theme.colors.textSecondary}
              />
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonCancel]}
                  onPress={() => setIsModalVisible(false)}
                >
                  <Text style={styles.textStyle}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSave]}
                  onPress={saveNickname}
                >
                  <Text style={styles.textStyle}>Sauvegarder</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ProtectedRoute>
  );
};

export default Profile;
