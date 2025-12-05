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
import { apiService } from '@/services/api.service';

interface Member {
  id: string;
  user_id: string;
  role_name: string;
  joined_at: string;
  profile: {
    name: string;
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

  const loadMembers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.get<{
        success: boolean;
        members: Member[];
      }>(`/api/groups/${groupId}/members`);

      if (response.success) {
        setMembers(response.members);
      }
    } catch (error) {
      console.error('Error loading members:', error);
      Alert.alert('Erreur', 'Impossible de charger les membres.');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

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
    } catch (error) {
      console.error('Error sending invitation:', error);
      Alert.alert(
        'Erreur',
        "Impossible d'envoyer l'invitation. Vérifiez que le pseudo existe."
      );
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
      owner: '#C5BD83',
      admin: '#8B7355',
      member: '#666',
      child: '#999',
      guest: '#bbb',
    };
    return colors[role] || '#666';
  };

  const renderMember = (member: Member) => (
    <Card key={member.id} style={styles.memberCard}>
      <CardContent style={styles.memberContent}>
        <View style={styles.memberAvatar}>
          <Ionicons name="person-circle" size={48} color="#C5BD83" />
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{member.profile.name}</Text>
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
      </CardContent>
    </Card>
  );

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
                <ActivityIndicator size="large" color="#C5BD83" />
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
                <Ionicons name="close" size={28} color="#666" />
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
                    <MaterialIcons name="qr-code" size={32} color="#C5BD83" />
                    <View style={styles.inviteOptionText}>
                      <Text style={styles.inviteOptionTitle}>Code QR</Text>
                      <Text style={styles.inviteOptionDesc}>
                        Générer un QR code à scanner
                      </Text>
                    </View>
                    <MaterialIcons
                      name="chevron-right"
                      size={24}
                      color="#999"
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.inviteOptionButton}
                    onPress={generateTextCode}
                    disabled={inviteLoading}
                  >
                    <MaterialIcons name="pin" size={32} color="#C5BD83" />
                    <View style={styles.inviteOptionText}>
                      <Text style={styles.inviteOptionTitle}>
                        Code à 6 caractères
                      </Text>
                      <Text style={styles.inviteOptionDesc}>
                        Générer un code à partager
                      </Text>
                    </View>
                    <MaterialIcons
                      name="chevron-right"
                      size={24}
                      color="#999"
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.inviteOptionButton}
                    onPress={() => setInviteType('pseudo')}
                  >
                    <MaterialIcons
                      name="person-add"
                      size={32}
                      color="#C5BD83"
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
                      color="#999"
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
                        <ActivityIndicator size="large" color="#C5BD83" />
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
                          color="#333"
                          backgroundColor="#fff"
                        />
                      </View>

                      <View style={styles.codeContainer}>
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

              {/* Text Code Only View */}
              {inviteType === 'code' && (
                <>
                  {!inviteCode || inviteLoading ? (
                    <>
                      <Text style={styles.modalTitle}>
                        Génération du code...
                      </Text>
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#C5BD83" />
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
                      color="#999"
                    />
                    <TextInput
                      style={styles.pseudoInput}
                      value={pseudoInput}
                      onChangeText={setPseudoInput}
                      placeholder="pseudo"
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#C5BD83',
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
  },
  memberCard: {
    marginBottom: 12,
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
    color: '#333',
    marginBottom: 4,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  inviteButton: {
    backgroundColor: '#C5BD83',
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
    backgroundColor: '#fff',
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
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  qrCodeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  codeContainer: {
    backgroundColor: '#f9f8f0',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#C5BD83',
    borderStyle: 'dashed',
  },
  textCodeContainer: {
    backgroundColor: '#f9f8f0',
    padding: 32,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#C5BD83',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteCodeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    letterSpacing: 4,
  },
  shareButton: {
    backgroundColor: '#C5BD83',
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
    backgroundColor: '#f9f8f0',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  inviteOptionText: {
    flex: 1,
    marginLeft: 12,
  },
  inviteOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  inviteOptionDesc: {
    fontSize: 14,
    color: '#666',
  },
  pseudoInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f8f0',
    borderWidth: 2,
    borderColor: '#C5BD83',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  pseudoInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
    padding: 0,
  },
  backButtonText: {
    color: '#666',
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
});
