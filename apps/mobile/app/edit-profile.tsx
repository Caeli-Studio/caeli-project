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
import { updateMyProfile } from "@/services/profile.service";
import { API_BASE_URL } from "@/lib/config";
import { storage } from "@/lib/storage";

export default function EditProfileScreen() {
  const { theme } = useTheme();
  const { user, setUser } = useAuth();

  const [name, setName] = useState(user?.display_name || "");
  const [avatar, setAvatar] = useState(user?.avatar_url || null);

  // ---------------------------------------------------------------------
  // 1️⃣ Sélection de l'image
  // ---------------------------------------------------------------------
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission refusée", "Autorisez la galerie");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  // ---------------------------------------------------------------------
  // 2️⃣ Upload avatar → Backend (multipart/form-data)
  // ---------------------------------------------------------------------
  const uploadAvatar = async (uri: string) => {
    const formData = new FormData();

    formData.append("file", {
      uri,
      type: "image/jpeg",
      name: "avatar.jpg",
    } as any);

    const token = await storage.getAccessToken();

    const response = await fetch(`${API_BASE_URL}/api/profile/me/avatar`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.error || "Avatar upload failed");
    }

    return json.profile; // renvoie le profil mis à jour
  };

  // ---------------------------------------------------------------------
  // 3️⃣ Sauvegarde du profil
  // ---------------------------------------------------------------------
  const handleSave = async () => {
    try {
      let updatedProfile = user;

      // Si l’avatar a changé → upload
      if (avatar && avatar !== user?.avatar_url) {
        updatedProfile = await uploadAvatar(avatar);
      }

      // Si le nom a changé → update via backend
      if (name !== user?.display_name) {
        const res = await updateMyProfile({ display_name: name });
        updatedProfile = res.profile;
      }

      // MAJ du contexte utilisateur
      setUser(updatedProfile);

      Alert.alert("Succès", "Profil mis à jour !");
    } catch (err) {
      console.log(err);
      Alert.alert("Erreur", "Impossible de mettre à jour le profil");
    }
  };

  // ---------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------
  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: theme.colors.background },
      ]}
    >
      {/* AVATAR */}
      <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatar} />
        ) : (
          <MaterialIcons name="person" size={80} color={theme.colors.textSecondary} />
        )}
      </TouchableOpacity>

      {/* NOM */}
      <View style={styles.inputBox}>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
          Nom
        </Text>
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

      {/* BOUTON SAVE */}
      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
        onPress={handleSave}
      >
        <Text style={styles.saveText}>Enregistrer</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------
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
