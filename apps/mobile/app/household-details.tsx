import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Share,
  TextInput,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import Navbar from '@/components/navbar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { apiService } from '@/services/api.service';

interface Member {
  id: string;
  user_id: string;
  role_name: string;
  joined_at: string;
  profile: {
    display_name: string;
    pseudo: string;
    avatar_url?: string;
  };
}

interface Invitation {
  id: string;
  code?: string;
  pseudo?: string;
  expires_at: string;
  max_uses: number;
  current_uses: number;
}

export default function HouseholdDetailsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { groupId, groupName } = useLocalSearchParams<{
    groupId: string;
    groupName: string;
  }>();

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteType, setInviteType] = useState<
    'choice' | 'qr' | 'code' | 'pseudo'
  >('choice');
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [pseudoInput, setPseudoInput] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  const loadMembers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.get<{
        success: boolean;
        members: Member[];
      }>(`/api/groups/${groupId}/members`);

      if (response.success) {
        setMembers(response.members);

        // Check if current user is owner
        const currentUserMember = response.members.find(
          (m) => m.user_id === user?.id
        );
        setIsOwner(currentUserMember?.role_name === 'owner');
      }
    } catch (error) {
      console.error('Error loading members:', error);
      Alert.alert('Erreur', 'Impossible de charger les membres.');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  const removeMember = async (member: Member) => {
    // Extract values before Alert to avoid closure issues
    const memberId = member.id;
    const memberName = member.profile.display_name;

    // Confirmation dialog
    Alert.alert(
      'Retirer le membre',
      `Êtes-vous sûr de vouloir retirer ${memberName} du foyer ?`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: async () => {
            try {
              setRemovingMemberId(memberId);

              const response = await apiService.delete<{
                success: boolean;
                message: string;
              }>(`/api/groups/${groupId}/members/${memberId}`);

              if (response.success) {
                Alert.alert('Succès', `${memberName} a été retiré du foyer.`);
                // Refresh members list
                await loadMembers();
              }
            } catch (error: any) {
              console.error('Error removing member:', error);

              // Handle specific error messages
              if (error?.response?.data?.error === 'Cannot remove yourself') {
                Alert.alert(
                  'Erreur',
                  'Vous ne pouvez pas vous retirer vous-même.'
                );
              } else if (
                error?.response?.data?.error === 'Cannot remove the last owner'
              ) {
                Alert.alert(
                  'Erreur',
                  'Impossible de retirer le dernier maître de foyer.'
                );
              } else {
                Alert.alert('Erreur', 'Impossible de retirer ce membre.');
              }
            } finally {
              setRemovingMemberId(null);
            }
          },
        },
      ]
    );
  };

  const deleteGroup = async () => {
    Alert.alert(
      'Supprimer le foyer',
      `Êtes-vous sûr de vouloir supprimer définitivement "${groupName}" ?\n\nCette action est irréversible et supprimera :\n- Tous les membres\n- Toutes les tâches\n- Toutes les invitations\n- Tout l'historique`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await apiService.delete<{
                success: boolean;
                message: string;
              }>(`/api/groups/${groupId}`);

              if (response.success) {
                Alert.alert(
                  'Foyer supprimé',
                  'Le foyer a été supprimé avec succès.',
                  [
                    {
                      text: 'OK',
                      onPress: () => router.replace('/organisation'),
                    },
                  ]
                );
              }
            } catch (error: any) {
              console.error('Error deleting group:', error);

              if (error?.response?.status === 403) {
                Alert.alert(
                  'Permission refusée',
                  'Seul le propriétaire du foyer peut le supprimer.'
                );
              } else {
                Alert.alert(
                  'Erreur',
                  error?.response?.data?.message ||
                    'Impossible de supprimer le foyer.'
                );
              }
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    loadMembers();
    // Reset invite modal state when component mounts
    setInviteType('choice');
    setInviteCode(null);
    setPseudoInput('');
  }, [groupId, loadMembers]);

  const generateInvitation = () => {
    setInviteType('choice');
    setInviteCode(null);
    setPseudoInput('');
    setShowInviteModal(true);
  };

  const generateQRCode = async () => {
    try {
      setInviteLoading(true);
      const response = await apiService.post<{
        success: boolean;
        invitation: Invitation;
      }>(`/api/groups/${groupId}/invitations`, {
        type: 'qr',
      });

      if (response.success && response.invitation.code) {
        setInviteCode(response.invitation.code);
        setInviteType('qr');
      }
    } catch (error) {
      console.error('Error generating invitation:', error);
      Alert.alert('Erreur', "Impossible de générer le code d'invitation.");
    } finally {
      setInviteLoading(false);
    }
  };

  const generateTextCode = async () => {
    try {
      setInviteLoading(true);
      const response = await apiService.post<{
        success: boolean;
        invitation: Invitation;
      }>(`/api/groups/${groupId}/invitations`, {
        type: 'qr',
      });

      if (response.success && response.invitation.code) {
        setInviteCode(response.invitation.code);
        setInviteType('code');
      }
    } catch (error) {
      console.error('Error generating invitation:', error);
      Alert.alert('Erreur', "Impossible de générer le code d'invitation.");
    } finally {
      setInviteLoading(false);
    }
  };

  const sendPseudoInvitation = async () => {
    if (!pseudoInput.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un pseudo.');
      return;
    }

    try {
      setInviteLoading(true);
      const response = await apiService.post<{
        success: boolean;
        invitation: Invitation;
      }>(`/api/groups/${groupId}/invitations`, {
        type: 'pseudo',
        pseudo: pseudoInput.trim(),
      });

      if (response.success) {
        Alert.alert('Succès', `Invitation envoyée à @${pseudoInput.trim()} !`, [
          {
            text: 'OK',
            onPress: () => {
              setShowInviteModal(false);
              setPseudoInput('');
              setInviteType('choice');
            },
          },
        ]);
      }
    } catch (error: any) {
      console.error('Error sending invitation:', error);

      // Check if invitation already exists
      if (
        error?.response?.status === 400 &&
        (error?.response?.data?.error === 'Invitation already exists' ||
          error?.response?.data?.message
            ?.toLowerCase()
            ?.includes('already exists'))
      ) {
        Alert.alert(
          'Invitation existante',
          `Une invitation est déjà en attente pour @${pseudoInput.trim()}. L'utilisateur peut utiliser son invitation existante pour rejoindre le foyer.`,
          [
            {
              text: 'OK',
              onPress: () => {
                setShowInviteModal(false);
                setPseudoInput('');
                setInviteType('choice');
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Erreur',
          "Impossible d'envoyer l'invitation. Vérifiez que le pseudo existe."
        );
      }
    } finally {
      setInviteLoading(false);
    }
  };

  const shareInviteCode = async () => {
    if (!inviteCode) return;

    try {
      await Share.share({
        message: `Rejoins mon foyer "${groupName}" avec ce code: ${inviteCode}\n\nLe code expire dans 7 jours.`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      owner: 'Maître de foyer',
      admin: 'Administrateur',
      member: 'Membre',
      child: 'Enfant',
      guest: 'Invité',
    };
    return labels[role] || role;
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      owner: theme.colors.primary,
      admin: theme.colors.primaryDark,
      member: theme.colors.textSecondary,
      child: theme.colors.textTertiary,
      guest: theme.colors.textTertiary,
    };
    return colors[role] || theme.colors.textSecondary;
  };

  const renderMember = (member: Member) => {
    // Identify current user's membership
    const currentUserMembership = members.find((m) => m.user_id === user?.id);

    const isCurrentUser = member.user_id === user?.id;
    const canManageMembers =
      currentUserMembership?.role_name === 'owner' ||
      currentUserMembership?.role_name === 'admin';
    const showRemoveButton = canManageMembers && !isCurrentUser;
    const isRemoving = removingMemberId === member.id;

    return (
      <Card key={member.id} style={styles.memberCard}>
        <CardContent style={styles.memberContent}>
          <View style={styles.memberAvatar}>
            <Ionicons
              name="person-circle"
              size={48}
              color={theme.colors.primary}
            />
          </View>
          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>{member.profile.display_name}</Text>
            <Text style={styles.memberPseudo}>@{member.profile.pseudo}</Text>
            <View
              style={[
                styles.roleBadge,
                { backgroundColor: getRoleColor(member.role_name) },
              ]}
            >
              <Text style={styles.roleText}>
                {getRoleLabel(member.role_name)}
              </Text>
            </View>
          </View>

          {/* Remove button - only show for owners/admins on other members */}
          {showRemoveButton && (
            <TouchableOpacity
              onPress={() => removeMember(member)}
              disabled={isRemoving}
              style={styles.removeButton}
            >
              {isRemoving ? (
                <ActivityIndicator size="small" color={theme.colors.error} />
              ) : (
                <MaterialIcons
                  name="person-remove"
                  size={24}
                  color={theme.colors.error}
                />
              )}
            </TouchableOpacity>
          )}
        </CardContent>
      </Card>
    );
  };

  // Dynamic styles based on theme
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      backgroundColor: theme.colors.primary,
      paddingTop: 60,
      paddingBottom: 20,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
    },
    backButton: {
      marginRight: 15,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#fff',
    },
    content: {
      flex: 1,
      padding: 20,
    },
    section: {
      marginBottom: 20,
      backgroundColor: theme.colors.card,
    },
    memberCard: {
      marginBottom: 12,
      backgroundColor: theme.colors.card,
    },
    memberContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
    },
    memberAvatar: {
      marginRight: 12,
    },
    memberInfo: {
      flex: 1,
    },
    memberName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 2,
    },
    memberPseudo: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginBottom: 6,
    },
    roleBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      marginTop: 4,
    },
    roleText: {
      fontSize: 12,
      color: '#fff',
      fontWeight: '500',
    },
    inviteButton: {
      backgroundColor: theme.colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      borderRadius: 12,
      marginBottom: 100,
    },
    inviteIcon: {
      marginRight: 8,
    },
    inviteButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: theme.colors.card,
      borderRadius: 20,
      padding: 24,
      width: '100%',
      maxWidth: 400,
    },
    modalClose: {
      position: 'absolute',
      top: 16,
      right: 16,
      zIndex: 1,
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    modalDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 24,
      textAlign: 'center',
      lineHeight: 20,
    },
    qrCodeContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    textCodeContainer: {
      backgroundColor: theme.colors.divider,
      paddingVertical: 50,
      paddingHorizontal: 20,
      borderRadius: 12,
      marginBottom: 24,
      borderWidth: 2,
      borderColor: theme.colors.primary,
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
    },
    inviteCodeText: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: 'center',
      letterSpacing: 2,
      lineHeight: 40,
      includeFontPadding: false,
    },
    shareButton: {
      backgroundColor: theme.colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      borderRadius: 12,
    },
    shareButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    inviteOptionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.divider,
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    inviteOptionText: {
      flex: 1,
      marginLeft: 12,
    },
    inviteOptionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    inviteOptionDesc: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    pseudoInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.divider,
      borderWidth: 2,
      borderColor: theme.colors.primary,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginBottom: 20,
    },
    pseudoInput: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.text,
      marginLeft: 8,
      padding: 0,
    },
    backButtonText: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      textAlign: 'center',
      marginTop: 12,
    },
    loadingContainer: {
      paddingVertical: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    removeButton: {
      padding: 8,
      marginLeft: 8,
    },
    dangerZone: {
      paddingHorizontal: 16,
      marginTop: 8,
      marginBottom: 20,
    },
    deleteButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: '#ff4444',
    },
    deleteButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
  });

  return (
    <ProtectedRoute>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{groupName}</Text>
        </View>

        <ScrollView style={styles.content}>
          {/* Members Section */}
          <Card style={styles.section}>
            <CardHeader>
              <CardTitle>Membres du foyer</CardTitle>
              <CardDescription>
                {members.length} membre{members.length > 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <ActivityIndicator size="large" color={theme.colors.primary} />
              ) : (
                <View>{members.map(renderMember)}</View>
              )}
            </CardContent>
          </Card>

          {/* Invite Button */}
          <TouchableOpacity
            style={styles.inviteButton}
            onPress={generateInvitation}
            disabled={inviteLoading}
          >
            {inviteLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialIcons
                  name="person-add"
                  size={24}
                  color="#fff"
                  style={styles.inviteIcon}
                />
                <Text style={styles.inviteButtonText}>Inviter des membres</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Delete Group Button */}
          {isOwner && (
            <View style={styles.dangerZone}>
              <TouchableOpacity
                onPress={deleteGroup}
                disabled={loading}
                style={[styles.deleteButton, loading && styles.buttonDisabled]}
              >
                <MaterialIcons name="delete-outline" size={18} color="#fff" />
                <Text style={styles.deleteButtonText}>Supprimer le foyer</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Invite Modal */}
        <Modal
          visible={showInviteModal}
          transparent
          animationType="slide"
          onRequestClose={() => {
            setShowInviteModal(false);
            setInviteType('choice');
            setInviteCode(null);
            setPseudoInput('');
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => {
                  setShowInviteModal(false);
                  setInviteType('choice');
                  setInviteCode(null);
                  setPseudoInput('');
                }}
              >
                <Ionicons
                  name="close"
                  size={28}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>

              {/* Choice View */}
              {inviteType === 'choice' && (
                <>
                  <Text style={styles.modalTitle}>Inviter des membres</Text>
                  <Text style={styles.modalDescription}>
                    Choisissez comment inviter des membres à rejoindre ce foyer
                  </Text>

                  <TouchableOpacity
                    style={styles.inviteOptionButton}
                    onPress={generateQRCode}
                    disabled={inviteLoading}
                  >
                    <MaterialIcons
                      name="qr-code"
                      size={32}
                      color={theme.colors.primary}
                    />
                    <View style={styles.inviteOptionText}>
                      <Text style={styles.inviteOptionTitle}>Code QR</Text>
                      <Text style={styles.inviteOptionDesc}>
                        Générer un QR code à scanner
                      </Text>
                    </View>
                    <MaterialIcons
                      name="chevron-right"
                      size={24}
                      color={theme.colors.textSecondary}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.inviteOptionButton}
                    onPress={generateTextCode}
                    disabled={inviteLoading}
                  >
                    <MaterialIcons
                      name="pin"
                      size={32}
                      color={theme.colors.primary}
                    />
                    <View style={styles.inviteOptionText}>
                      <Text style={styles.inviteOptionTitle}>
                        Code à 8 caractères
                      </Text>
                      <Text style={styles.inviteOptionDesc}>
                        Générer un code à partager
                      </Text>
                    </View>
                    <MaterialIcons
                      name="chevron-right"
                      size={24}
                      color={theme.colors.textSecondary}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.inviteOptionButton}
                    onPress={() => setInviteType('pseudo')}
                  >
                    <MaterialIcons
                      name="person-add"
                      size={32}
                      color={theme.colors.primary}
                    />
                    <View style={styles.inviteOptionText}>
                      <Text style={styles.inviteOptionTitle}>Par pseudo</Text>
                      <Text style={styles.inviteOptionDesc}>
                        Inviter un utilisateur par son pseudo
                      </Text>
                    </View>
                    <MaterialIcons
                      name="chevron-right"
                      size={24}
                      color={theme.colors.textSecondary}
                    />
                  </TouchableOpacity>
                </>
              )}

              {/* QR Code View */}
              {inviteType === 'qr' && (
                <>
                  {!inviteCode || inviteLoading ? (
                    <>
                      <Text style={styles.modalTitle}>
                        Génération du code...
                      </Text>
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator
                          size="large"
                          color={theme.colors.primary}
                        />
                      </View>
                    </>
                  ) : (
                    <>
                      <Text style={styles.modalTitle}>Code d'invitation</Text>
                      <Text style={styles.modalDescription}>
                        Scannez le QR code ou partagez le code pour inviter des
                        membres.
                        {'\n'}Le code expire dans 7 jours.
                      </Text>

                      <View style={styles.qrCodeContainer}>
                        <QRCode
                          value={inviteCode}
                          size={200}
                          color={theme.isDark ? '#fff' : '#333'}
                          backgroundColor={theme.isDark ? '#333' : '#fff'}
                        />
                      </View>

                      <TouchableOpacity
                        onPress={shareInviteCode}
                        style={styles.shareButton}
                      >
                        <MaterialIcons name="share" size={20} color="#fff" />
                        <Text style={styles.shareButtonText}>
                          Partager le code
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          setInviteType('choice');
                          setInviteCode(null);
                        }}
                        style={styles.backButton}
                      >
                        <Text style={styles.backButtonText}>Retour</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </>
              )}

              {/* Text Code Only View */}
              {inviteType === 'code' && (
                <>
                  {!inviteCode || inviteLoading ? (
                    <>
                      <Text style={styles.modalTitle}>
                        Génération du code...
                      </Text>
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator
                          size="large"
                          color={theme.colors.primary}
                        />
                      </View>
                    </>
                  ) : (
                    <>
                      <Text style={styles.modalTitle}>Code d'invitation</Text>
                      <Text style={styles.modalDescription}>
                        Partagez ce code pour inviter des membres.
                        {'\n'}Le code expire dans 7 jours.
                      </Text>

                      <View style={styles.textCodeContainer}>
                        <Text style={styles.inviteCodeText}>{inviteCode}</Text>
                      </View>

                      <TouchableOpacity
                        onPress={shareInviteCode}
                        style={styles.shareButton}
                      >
                        <MaterialIcons name="share" size={20} color="#fff" />
                        <Text style={styles.shareButtonText}>
                          Partager le code
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          setInviteType('choice');
                          setInviteCode(null);
                        }}
                        style={styles.backButton}
                      >
                        <Text style={styles.backButtonText}>Retour</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </>
              )}

              {/* Pseudo Invitation View */}
              {inviteType === 'pseudo' && (
                <>
                  <Text style={styles.modalTitle}>Inviter par pseudo</Text>
                  <Text style={styles.modalDescription}>
                    Entrez le pseudo de l'utilisateur que vous souhaitez inviter
                  </Text>

                  <View style={styles.pseudoInputContainer}>
                    <MaterialIcons
                      name="alternate-email"
                      size={24}
                      color={theme.colors.textSecondary}
                    />
                    <TextInput
                      style={styles.pseudoInput}
                      value={pseudoInput}
                      onChangeText={setPseudoInput}
                      placeholder="pseudo"
                      placeholderTextColor={theme.colors.textTertiary}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  <TouchableOpacity
                    onPress={sendPseudoInvitation}
                    disabled={inviteLoading || !pseudoInput.trim()}
                    style={[
                      styles.shareButton,
                      (inviteLoading || !pseudoInput.trim()) &&
                        styles.buttonDisabled,
                    ]}
                  >
                    {inviteLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <MaterialIcons name="send" size={20} color="#fff" />
                        <Text style={styles.shareButtonText}>
                          Envoyer l'invitation
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setInviteType('choice');
                      setPseudoInput('');
                    }}
                    style={styles.backButton}
                  >
                    <Text style={styles.backButtonText}>Retour</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>

        <Navbar />
      </View>
    </ProtectedRoute>
  );
}
