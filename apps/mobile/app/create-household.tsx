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

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="#333" />
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
                  color={selectedType === type.value ? '#C5BD83' : '#666'}
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
                      color="#C5BD83"
                    />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <MaterialIcons name="info" size={20} color="#666" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C5BD83',
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
    color: '#333',
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
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#E74C3C',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    position: 'relative',
  },
  typeCardSelected: {
    borderColor: '#C5BD83',
    backgroundColor: '#f9f8f0',
  },
  typeLabel: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
  },
  typeLabelSelected: {
    color: '#333',
    fontWeight: '600',
  },
  checkMark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  createButton: {
    backgroundColor: '#C5BD83',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  createButtonDisabled: {
    backgroundColor: '#ccc',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
