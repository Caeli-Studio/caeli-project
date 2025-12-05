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
import { apiService } from '@/services/api.service';

export default function JoinHouseholdScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<'choice' | 'scan' | 'manual'>('choice');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
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
      setLoading(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!inviteCode || inviteCode.length !== 6) {
      Alert.alert('Erreur', 'Veuillez entrer un code à 6 caractères.');
      return;
    }

    await handleScanCode(inviteCode);
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (data && data.length === 6) {
      handleScanCode(data);
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
                <CardTitle>Scanner un QR code</CardTitle>
                <CardDescription>
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
                <CardTitle>Entrer un code manuellement</CardTitle>
                <CardDescription>
                  Saisissez le code à 6 caractères que vous avez reçu
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => setMode('manual')}
                >
                  <MaterialIcons name="edit" size={24} color="#C5BD83" />
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
              onBarcodeScanned={handleBarCodeScanned}
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

        {/* Manual Entry View */}
        {mode === 'manual' && (
          <View style={styles.content}>
            <Card style={styles.card}>
              <CardHeader>
                <CardTitle>Code d'invitation</CardTitle>
                <CardDescription>
                  Entrez le code à 6 caractères reçu
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TextInput
                  style={styles.codeInput}
                  value={inviteCode}
                  onChangeText={(text) => setInviteCode(text.toUpperCase())}
                  placeholder="ABC123"
                  maxLength={6}
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
    paddingBottom: 100,
  },
  card: {
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#C5BD83',
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
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#C5BD83',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButtonText: {
    color: '#C5BD83',
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
    backgroundColor: '#e5e5e5',
  },
  orText: {
    fontSize: 14,
    color: '#666',
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
    borderColor: '#C5BD83',
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
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#C5BD83',
    fontSize: 16,
    fontWeight: '600',
  },
  codeInput: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#C5BD83',
    borderRadius: 12,
    padding: 20,
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 20,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#C5BD83',
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
    color: '#666',
    fontSize: 14,
  },
});
