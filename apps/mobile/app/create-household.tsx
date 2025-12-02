import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';

import { useTheme } from '@/contexts/ThemeContext';
import { apiService } from '@/services/api.service';

type GroupType = 'family' | 'roommates' | 'company' | 'other';
type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

interface CreateGroupRequest {
  name: string;
  type?: GroupType;
}

interface CreateGroupResponse {
  success: boolean;
  data: {
    group: {
      id: string;
      name: string;
      type: GroupType;
      created_at: string;
    };
    membership: {
      id: string;
      role_name: string;
    };
  };
  message: string;
}

export default function CreateHouseholdScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState<GroupType>('family');
  const [loading, setLoading] = useState(false);

  const groupTypes: { value: GroupType; label: string; icon: IconName }[] = [
    { value: 'family', label: 'Famille', icon: 'home' },
    { value: 'roommates', label: 'Colocataires', icon: 'people' },
    { value: 'company', label: 'Entreprise', icon: 'business' },
    { value: 'other', label: 'Autre', icon: 'category' },
  ];

  const handleCreate = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Erreur', 'Le nom du foyer est obligatoire');
      return;
    }

    setLoading(true);

    try {
      const payload: CreateGroupRequest = {
        name: name.trim(),
        type: selectedType,
      };

      const response = await apiService.post<CreateGroupResponse>(
        '/api/groups',
        payload
      );

      if (response.success) {
        Alert.alert('Succès', response.message || 'Foyer créé avec succès', [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to organisation to see the new household
              router.replace('/organisation');
            },
          },
        ]);
      }
    } catch (error) {
      console.error('Error creating household:', error);
      Alert.alert(
        'Erreur',
        error instanceof Error
          ? error.message
          : 'Impossible de créer le foyer. Veuillez réessayer.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Dynamic styles based on theme
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 12,
      paddingTop: 48,
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#fff',
      marginLeft: 16,
    },
    form: {
      padding: 16,
    },
    inputGroup: {
      marginBottom: 24,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    required: {
      color: theme.colors.error,
    },
    input: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: theme.colors.text,
    },
    typeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    typeCard: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: theme.colors.surface,
      borderWidth: 2,
      borderColor: theme.colors.border,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 120,
      position: 'relative',
    },
    typeCardSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.divider,
    },
    typeLabel: {
      marginTop: 8,
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    typeLabelSelected: {
      color: theme.colors.text,
      fontWeight: '600',
    },
    checkMark: {
      position: 'absolute',
      top: 8,
      right: 8,
    },
    infoBox: {
      flexDirection: 'row',
      backgroundColor: theme.colors.infoLight,
      borderRadius: 8,
      padding: 12,
      marginBottom: 24,
      gap: 12,
    },
    infoText: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    createButton: {
      backgroundColor: theme.colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      borderRadius: 8,
      gap: 8,
    },
    createButtonDisabled: {
      backgroundColor: theme.colors.border,
    },
    createButtonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '600',
    },
  });

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Créer un foyer</Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        {/* Name Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Nom du foyer <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Famille Dupont"
            value={name}
            onChangeText={setName}
            maxLength={100}
            autoFocus
          />
        </View>

        {/* Type Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Type de foyer</Text>
          <View style={styles.typeGrid}>
            {groupTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.typeCard,
                  selectedType === type.value && styles.typeCardSelected,
                ]}
                onPress={() => setSelectedType(type.value)}
              >
                <MaterialIcons
                  name={type.icon}
                  size={32}
                  color={
                    selectedType === type.value
                      ? theme.colors.primary
                      : theme.colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.typeLabel,
                    selectedType === type.value && styles.typeLabelSelected,
                  ]}
                >
                  {type.label}
                </Text>
                {selectedType === type.value && (
                  <View style={styles.checkMark}>
                    <MaterialIcons
                      name="check-circle"
                      size={20}
                      color={theme.colors.primary}
                    />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <MaterialIcons name="info" size={20} color={theme.colors.info} />
          <Text style={styles.infoText}>
            Vous deviendrez automatiquement le maître de foyer avec tous les
            droits d'administration.
          </Text>
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons name="add-circle" size={24} color="#fff" />
              <Text style={styles.createButtonText}>Créer le foyer</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
