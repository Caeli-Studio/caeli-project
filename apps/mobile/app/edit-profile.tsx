import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { MaterialIcons } from "@expo/vector-icons";

import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { updateMyProfile } from "../services/profile.service";

export default function EditProfileScreen() {
  const { theme } = useTheme();
  const { user, setUser } = useAuth();

  // IMPORTANT : ton backend utilise display_name
  const [name, setName] = useState(user?.display_name || "");
  const [avatar, setAvatar] = useState(user?.avatar_url || null);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission refusée", "Autorisez la galerie");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    try {
      // Mise à jour DU NOM uniquement pour le moment
      const res = await updateMyProfile({
        display_name: name,
        // avatar_url: "À GÉRER APRÈS UPLOAD STORAGE"
      });

      // IMPORTANT : ton backend renvoie "profile"
      setUser(res.profile);

      Alert.alert("Succès", "Profil mis à jour !");
    } catch (err) {
      console.log(err);
      Alert.alert("Erreur", "Impossible de mettre à jour le profil");
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* PHOTO */}
      <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatar} />
        ) : (
          <MaterialIcons name="person" size={80} color={theme.colors.textSecondary} />
        )}
      </TouchableOpacity>

      {/* INPUT NAME */}
      <View style={styles.inputBox}>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Nom</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Ton nom"
          placeholderTextColor={theme.colors.textSecondary}
          style={[
            styles.input,
            { backgroundColor: theme.colors.surface, color: theme.colors.text },
          ]}
        />
      </View>

      {/* SAVE BUTTON */}
      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
        onPress={handleSave}
      >
        <Text style={styles.saveText}>Enregistrer</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  avatarContainer: {
    alignSelf: "center",
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: "hidden",
    backgroundColor: "#cccccc40",
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  inputBox: {
    marginTop: 30,
  },
  label: {
    fontSize: 16,
    marginBottom: 6,
  },
  input: {
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  saveButton: {
    marginTop: 40,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  saveText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
});
