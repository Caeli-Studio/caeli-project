import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter, Stack } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';

import Navbar from '@/components/navbar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/contexts/ThemeContext';
import { apiService } from '@/services/api.service';

export default function JoinHouseholdScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [mode, setMode] = useState<'choice' | 'scan' | 'manual' | 'confirm'>(
    'choice'
  );
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedInvitation, setScannedInvitation] = useState<{
    code: string;
    groupName: string;
    groupId: string;
    membersCount?: number;
  } | null>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const handleScanCode = async (code: string) => {
    try {
      setLoading(true);
      const response = await apiService.post<{
        success: boolean;
        membership: unknown;
        message: string;
      }>(`/api/invitations/${code}/accept`, {
        code_or_pseudo: code,
      });

      if (response.success) {
        Alert.alert('Succès', 'Vous avez rejoint le foyer avec succès !', [
          {
            text: 'OK',
            onPress: () => router.push('/organisation'),
          },
        ]);
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      Alert.alert('Erreur', "Code d'invitation invalide ou expiré.");
    } finally {
      setIsScanning(false);
      setLoading(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!inviteCode || inviteCode.length !== 8) {
      Alert.alert('Erreur', 'Veuillez entrer un code à 8 caractères.');
      return;
    }

    await handleScanCode(inviteCode);
  };

  const handleConfirmJoin = async () => {
    if (!scannedInvitation) return;

    try {
      setLoading(true);
      const response = await apiService.post<{
        success: boolean;
        membership: unknown;
        message: string;
      }>(`/api/invitations/${scannedInvitation.code}/accept`, {
        code_or_pseudo: scannedInvitation.code,
      });

      if (response.success) {
        Alert.alert(
          'Succès',
          `Vous avez rejoint ${scannedInvitation.groupName} !`,
          [
            {
              text: 'OK',
              onPress: () => router.push('/organisation'),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Error accepting invitation:', error);

      // Check if user is already a member
      if (
        error?.response?.status === 400 &&
        (error?.response?.data?.error === 'Already a member' ||
          error?.response?.data?.error === 'Failed to join group' ||
          error?.response?.data?.message
            ?.toLowerCase()
            ?.includes('already a member') ||
          error?.response?.data?.message
            ?.toLowerCase()
            ?.includes('duplicate key'))
      ) {
        Alert.alert(
          'Déjà membre',
          `Vous êtes déjà membre de ${scannedInvitation.groupName}`,
          [
            {
              text: 'OK',
              onPress: () => router.push('/organisation'),
            },
          ]
        );
        return;
      }

      // Check for invitation not found (404)
      if (error?.response?.status === 404) {
        Alert.alert(
          'Invitation invalide',
          "Ce code d'invitation n'existe pas ou a été révoqué. Veuillez demander un nouveau code.",
          [
            {
              text: 'OK',
              onPress: () => {
                setScannedInvitation(null);
                setIsScanning(false);
                setMode('choice');
              },
            },
          ]
        );
        return;
      }

      // Check for expired or fully used invitations
      if (error?.response?.status === 410) {
        const errorMsg =
          error?.response?.data?.error === 'Invitation expired'
            ? 'Cette invitation a expiré'
            : "Cette invitation a atteint son nombre maximum d'utilisations";
        Alert.alert('Invitation invalide', errorMsg);
        setScannedInvitation(null);
        setIsScanning(false);
        setMode('choice');
        return;
      }

      // Generic error - allow retry by not resetting state
      Alert.alert(
        'Erreur',
        "Impossible de rejoindre l'organisation. Vérifiez votre connexion et réessayez.",
        [
          {
            text: 'Réessayer',
            onPress: () => handleConfirmJoin(),
          },
          {
            text: 'Annuler',
            style: 'cancel',
            onPress: () => {
              setScannedInvitation(null);
              setIsScanning(false);
              setMode('choice');
            },
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    // Prevent re-scan if already scanning or already have a scanned invitation
    if (isScanning || scannedInvitation) {
      return;
    }

    console.log('QR Code scanné:', data, 'Longueur:', data?.length);
    if (data && data.length === 8) {
      setIsScanning(true);
      console.log("Code valide, récupération des détails de l'invitation...");

      try {
        // Fetch invitation details
        const response = await apiService.get<{
          success: boolean;
          invitation: {
            code: string;
            group: {
              id: string;
              name: string;
              members_count?: number;
            };
          };
        }>(`/api/invitations/${data}`);

        if (response.success) {
          // Store invitation details and switch to confirmation mode
          setScannedInvitation({
            code: data,
            groupName: response.invitation.group.name,
            groupId: response.invitation.group.id,
            membersCount: response.invitation.group.members_count,
          });
          setMode('confirm');
          console.log('Invitation trouvée:', response.invitation.group.name);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de l'invitation:", error);
        Alert.alert('Erreur', "Code d'invitation invalide ou expiré");
        setIsScanning(false);
      }
    } else {
      console.log('Code invalide - longueur différente de 8 caractères');
    }
  };

  const openScanner = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          'Permission refusée',
          "Vous devez autoriser l'accès à la caméra pour scanner un QR code."
        );
        return;
      }
    }
    setMode('scan');
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
      paddingBottom: 100,
    },
    card: {
      marginBottom: 20,
      backgroundColor: theme.colors.card,
    },
    primaryButton: {
      backgroundColor: theme.colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      borderRadius: 12,
      gap: 8,
    },
    primaryButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    secondaryButton: {
      backgroundColor: theme.colors.surface,
      borderWidth: 2,
      borderColor: theme.colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      borderRadius: 12,
      gap: 8,
    },
    secondaryButtonText: {
      color: theme.colors.primary,
      fontSize: 16,
      fontWeight: '600',
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 20,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.colors.border,
    },
    orText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      paddingHorizontal: 12,
      fontWeight: '500',
    },
    scannerContainer: {
      flex: 1,
    },
    camera: {
      flex: 1,
    },
    scannerOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    scannerFrame: {
      width: 250,
      height: 250,
      borderWidth: 3,
      borderColor: theme.colors.primary,
      borderRadius: 12,
      backgroundColor: 'transparent',
    },
    scannerText: {
      marginTop: 30,
      color: '#fff',
      fontSize: 16,
      textAlign: 'center',
      paddingHorizontal: 40,
    },
    cancelButton: {
      position: 'absolute',
      bottom: 100,
      left: 20,
      right: 20,
      backgroundColor: theme.colors.card,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    cancelButtonText: {
      color: theme.colors.primary,
      fontSize: 16,
      fontWeight: '600',
    },
    codeInput: {
      backgroundColor: theme.colors.surface,
      borderWidth: 2,
      borderColor: theme.colors.primary,
      borderRadius: 12,
      padding: 20,
      fontSize: 32,
      fontWeight: 'bold',
      textAlign: 'center',
      letterSpacing: 8,
      marginBottom: 20,
      color: theme.colors.text,
    },
    submitButton: {
      backgroundColor: theme.colors.primary,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 16,
    },
    submitButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    backToChoiceButton: {
      padding: 12,
      alignItems: 'center',
    },
    backToChoiceText: {
      color: theme.colors.textSecondary,
      fontSize: 14,
    },
    confirmDetails: {
      alignItems: 'center',
      paddingVertical: 20,
      marginBottom: 20,
    },
    orgName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
    },
    orgMembers: {
      fontSize: 16,
      color: theme.colors.textSecondary,
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rejoindre un foyer</Text>
        </View>

        {/* Choice View */}
        {mode === 'choice' && (
          <View style={styles.content}>
            <Card style={styles.card}>
              <CardHeader>
                <CardTitle style={{ color: theme.colors.text }}>
                  Scanner un QR code
                </CardTitle>
                <CardDescription style={{ color: theme.colors.textSecondary }}>
                  Scannez le QR code affiché par un membre du foyer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={openScanner}
                >
                  <MaterialIcons
                    name="qr-code-scanner"
                    size={24}
                    color="#fff"
                  />
                  <Text style={styles.primaryButtonText}>
                    Ouvrir le scanner
                  </Text>
                </TouchableOpacity>
              </CardContent>
            </Card>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.orText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            <Card style={styles.card}>
              <CardHeader>
                <CardTitle style={{ color: theme.colors.text }}>
                  Entrer un code manuellement
                </CardTitle>
                <CardDescription style={{ color: theme.colors.textSecondary }}>
                  Saisissez le code à 8 caractères que vous avez reçu
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => setMode('manual')}
                >
                  <MaterialIcons
                    name="edit"
                    size={24}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.secondaryButtonText}>Saisir le code</Text>
                </TouchableOpacity>
              </CardContent>
            </Card>
          </View>
        )}

        {/* Scanner View */}
        {mode === 'scan' && (
          <View style={styles.scannerContainer}>
            <CameraView
              style={styles.camera}
              facing="back"
              onBarcodeScanned={isScanning ? undefined : handleBarCodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
            >
              <View style={styles.scannerOverlay}>
                <View style={styles.scannerFrame} />
                <Text style={styles.scannerText}>
                  Positionnez le QR code dans le cadre
                </Text>
              </View>
            </CameraView>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setMode('choice')}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Confirmation View */}
        {mode === 'confirm' && scannedInvitation && (
          <View style={styles.content}>
            <Card style={styles.card}>
              <CardHeader>
                <CardTitle style={{ color: theme.colors.text }}>
                  Rejoindre cette organisation ?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <View style={styles.confirmDetails}>
                  <Text style={styles.orgName}>
                    {scannedInvitation.groupName}
                  </Text>
                  {scannedInvitation.membersCount !== undefined && (
                    <Text style={styles.orgMembers}>
                      {scannedInvitation.membersCount} membre(s)
                    </Text>
                  )}
                </View>

                <Button
                  variant="default"
                  onPress={handleConfirmJoin}
                  disabled={loading}
                  style={styles.submitButton}
                >
                  {loading ? (
                    <Text style={styles.submitButtonText}>Connexion...</Text>
                  ) : (
                    <Text style={styles.submitButtonText}>Rejoindre</Text>
                  )}
                </Button>

                <TouchableOpacity
                  style={styles.backToChoiceButton}
                  onPress={() => {
                    setScannedInvitation(null);
                    setIsScanning(false);
                    setMode('choice');
                  }}
                >
                  <Text style={styles.backToChoiceText}>Annuler</Text>
                </TouchableOpacity>
              </CardContent>
            </Card>
          </View>
        )}

        {/* Manual Entry View */}
        {mode === 'manual' && (
          <View style={styles.content}>
            <Card style={styles.card}>
              <CardHeader>
                <CardTitle style={{ color: theme.colors.text }}>
                  Code d'invitation
                </CardTitle>
                <CardDescription style={{ color: theme.colors.textSecondary }}>
                  Entrez le code à 8 caractères reçu
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TextInput
                  style={styles.codeInput}
                  value={inviteCode}
                  onChangeText={(text) => setInviteCode(text.toUpperCase())}
                  placeholder="ABC12345"
                  maxLength={8}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />

                <Button
                  variant="default"
                  onPress={handleManualSubmit}
                  disabled={loading}
                  style={styles.submitButton}
                >
                  {loading ? (
                    <Text style={styles.submitButtonText}>Vérification...</Text>
                  ) : (
                    <Text style={styles.submitButtonText}>
                      Rejoindre le foyer
                    </Text>
                  )}
                </Button>

                <TouchableOpacity
                  style={styles.backToChoiceButton}
                  onPress={() => setMode('choice')}
                >
                  <Text style={styles.backToChoiceText}>
                    Retour aux options
                  </Text>
                </TouchableOpacity>
              </CardContent>
            </Card>
          </View>
        )}

        <Navbar />
      </View>
    </ProtectedRoute>
  );
}
