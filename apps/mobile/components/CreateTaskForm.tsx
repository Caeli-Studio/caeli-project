/**
 * Composant de formulaire pour créer une nouvelle tâche
 */

import { MaterialIcons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';

import {
  createTask,
  getGroupMembers,
  type CreateTaskRequest,
  type Member,
} from '@/lib/api';

interface CreateTaskFormProps {
  groupId: string;
  onTaskCreated?: () => void;
  onCancel?: () => void;
}

const CreateTaskForm: React.FC<CreateTaskFormProps> = ({
  groupId,
  onTaskCreated,
  onCancel,
}) => {
  // États du formulaire
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [importance, setImportance] = useState<'low' | 'medium' | 'high' | ''>(
    ''
  );

  // États UI
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [showImportancePicker, setShowImportancePicker] = useState(false);

  const importanceOptions = [
    { value: 'low', label: 'Faible', color: '#4CAF50', icon: 'arrow-downward' },
    { value: 'medium', label: 'Moyenne', color: '#FF9800', icon: 'remove' },
    { value: 'high', label: 'Élevée', color: '#F44336', icon: 'arrow-upward' },
  ];

  // Charger les membres du groupe
  useEffect(() => {
    loadMembers();
  }, [groupId]);

  const loadMembers = async () => {
    try {
      setLoadingMembers(true);
      const response = await getGroupMembers(groupId);
      if (response.success && response.data) {
        setMembers(response.data);
      } else {
        Alert.alert('Erreur', 'Impossible de charger les membres');
      }
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert('Erreur', 'Le titre de la tâche est obligatoire');
      return;
    }

    try {
      setLoading(true);

      const taskData: CreateTaskRequest = {
        title: title.trim(),
        description: description.trim() || undefined,
        due_at: dueDate || undefined,
        assigned_to: selectedMembers.length > 0 ? selectedMembers : undefined,
        is_free: selectedMembers.length === 0, // Tâche libre si personne n'est assigné
      };

      const response = await createTask(groupId, taskData);

      if (response.success) {
        Alert.alert('Succès', 'Tâche créée avec succès', [
          {
            text: 'OK',
            onPress: () => {
              resetForm();
              onTaskCreated?.();
            },
          },
        ]);
      } else {
        Alert.alert(
          'Erreur',
          response.message || 'Impossible de créer la tâche'
        );
      }
    } catch (error) {
      console.error('Error creating task:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDueDate('');
    setSelectedMembers([]);
    setImportance('');
  };

  const getImportanceDisplay = () => {
    if (!importance) return "Sélectionner l'importance";
    const option = importanceOptions.find((opt) => opt.value === importance);
    return option?.label || '';
  };

  const getImportanceColor = () => {
    const option = importanceOptions.find((opt) => opt.value === importance);
    return option?.color || '#999';
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.formContent}>
        {/* Titre */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Titre <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Nom de la tâche"
            value={title}
            onChangeText={setTitle}
            maxLength={200}
            placeholderTextColor="#999"
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description de la tâche..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={1000}
            placeholderTextColor="#999"
            textAlignVertical="top"
          />
        </View>

        {/* Date d'échéance */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date d'échéance</Text>
          <TextInput
            style={styles.input}
            placeholder="AAAA-MM-JJ"
            value={dueDate}
            onChangeText={setDueDate}
            placeholderTextColor="#999"
          />
          <Text style={styles.hint}>Format: 2025-11-15</Text>
        </View>

        {/* Importance */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Importance</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowImportancePicker(!showImportancePicker)}
          >
            <View style={styles.pickerButtonContent}>
              {importance && (
                <View
                  style={[
                    styles.importanceDot,
                    { backgroundColor: getImportanceColor() },
                  ]}
                />
              )}
              <Text
                style={[
                  styles.pickerButtonText,
                  !importance && styles.placeholder,
                ]}
              >
                {getImportanceDisplay()}
              </Text>
            </View>
            <MaterialIcons
              name={showImportancePicker ? 'arrow-drop-up' : 'arrow-drop-down'}
              size={24}
              color="#666"
            />
          </TouchableOpacity>

          {showImportancePicker && (
            <View style={styles.dropdown}>
              {importanceOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.dropdownOption}
                  onPress={() => {
                    setImportance(option.value as any);
                    setShowImportancePicker(false);
                  }}
                >
                  <View
                    style={[
                      styles.importanceDot,
                      { backgroundColor: option.color },
                    ]}
                  />
                  <Text style={styles.dropdownOptionText}>{option.label}</Text>
                  {importance === option.value && (
                    <MaterialIcons
                      name="check"
                      size={20}
                      color="#4CAF50"
                      style={styles.checkIcon}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Assigner à */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Assigner à</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowMemberPicker(!showMemberPicker)}
            disabled={loadingMembers}
          >
            <Text
              style={[
                styles.pickerButtonText,
                selectedMembers.length === 0 && styles.placeholder,
              ]}
            >
              {loadingMembers
                ? 'Chargement...'
                : selectedMembers.length === 0
                  ? 'Sélectionner des membres'
                  : `${selectedMembers.length} membre(s) sélectionné(s)`}
            </Text>
            <MaterialIcons
              name={showMemberPicker ? 'arrow-drop-up' : 'arrow-drop-down'}
              size={24}
              color="#666"
            />
          </TouchableOpacity>

          {showMemberPicker && (
            <View style={styles.dropdown}>
              {members.length === 0 ? (
                <Text style={styles.emptyText}>Aucun membre disponible</Text>
              ) : (
                members.map((member) => (
                  <TouchableOpacity
                    key={member.id}
                    style={styles.dropdownOption}
                    onPress={() => toggleMemberSelection(member.id)}
                  >
                    <View style={styles.memberOption}>
                      <View style={styles.avatar}>
                        {member.avatar_url ? (
                          <Text>👤</Text>
                        ) : (
                          <Text style={styles.avatarText}>
                            {member.display_name.charAt(0).toUpperCase()}
                          </Text>
                        )}
                      </View>
                      <View style={styles.memberInfo}>
                        <Text style={styles.memberName}>
                          {member.display_name}
                        </Text>
                        <Text style={styles.memberRole}>{member.role}</Text>
                      </View>
                    </View>
                    {selectedMembers.includes(member.id) && (
                      <MaterialIcons name="check" size={20} color="#4CAF50" />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {selectedMembers.length === 0 && (
            <Text style={styles.hint}>
              Laissez vide pour créer une tâche libre (tout le monde peut la
              prendre)
            </Text>
          )}
        </View>

        {/* Boutons */}
        <View style={styles.buttonContainer}>
          {onCancel && (
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.button,
              styles.submitButton,
              loading && styles.disabledButton,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialIcons
                  name="add"
                  size={20}
                  color="#fff"
                  style={styles.buttonIcon}
                />
                <Text style={styles.submitButtonText}>Créer la tâche</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  formContent: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#F44336',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  pickerButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#333',
  },
  placeholder: {
    color: '#999',
  },
  dropdown: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    maxHeight: 200,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  checkIcon: {
    marginLeft: 'auto',
  },
  importanceDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  memberOption: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#C5BD83',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  memberRole: {
    fontSize: 12,
    color: '#999',
    textTransform: 'capitalize',
  },
  emptyText: {
    padding: 16,
    textAlign: 'center',
    color: '#999',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#898989',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonIcon: {
    marginRight: 4,
  },
});

export default CreateTaskForm;
