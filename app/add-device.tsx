
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../styles/commonStyles';
import Icon from '../components/Icon';
import Button from '../components/Button';
import DeviceCard from '../components/DeviceCard';
import { useDeviceDiscovery } from '../hooks/useDeviceDiscovery';

const AddDeviceScreen: React.FC = () => {
  const router = useRouter();
  const { 
    devices, 
    scanNetwork, 
    addDeviceManually, 
    removeDevice, 
    renameDevice,
    isScanning, 
    scanProgress 
  } = useDeviceDiscovery();
  
  const [deviceName, setDeviceName] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleScanNetwork = async () => {
    console.log('🔍 Starting automatic network scan');
    try {
      await scanNetwork();
      Alert.alert(
        'Scan terminé',
        'Le scan du réseau est terminé. Vérifiez la liste des appareils découverts.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.log('❌ Network scan failed:', error);
      Alert.alert(
        'Erreur de scan',
        'Impossible de scanner le réseau. Vérifiez votre connexion Wi-Fi.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleAddDevice = async () => {
    if (!deviceName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom pour l\'appareil.');
      return;
    }

    if (!ipAddress.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse IP.');
      return;
    }

    // Validate IP address format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ipAddress.trim())) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse IP valide (ex: 192.168.1.20).');
      return;
    }

    setIsAdding(true);
    try {
      console.log('➕ Adding device manually:', { name: deviceName, ip: ipAddress });
      const newDevice = await addDeviceManually(ipAddress.trim(), 80, deviceName.trim());
      
      console.log('✅ Device added successfully:', newDevice);
      
      // Clear the form
      setDeviceName('');
      setIpAddress('');
      
      Alert.alert(
        'Appareil ajouté',
        `${deviceName} a été ajouté avec succès.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.log('❌ Failed to add device:', error);
      Alert.alert(
        'Erreur d\'ajout',
        error.message || 'Impossible d\'ajouter l\'appareil.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsAdding(false);
    }
  };

  const handleDevicePress = (device: any) => {
    console.log('📱 Device pressed:', device.name);
    router.push(`/device/${device.id}`);
  };

  const handleRemoveDevice = async (deviceId: string) => {
    Alert.alert(
      'Supprimer l\'appareil',
      'Êtes-vous sûr de vouloir supprimer cet appareil ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            try {
              await removeDevice(deviceId);
              console.log('✅ Device removed successfully');
            } catch (error) {
              console.log('❌ Failed to remove device:', error);
              Alert.alert('Erreur', 'Impossible de supprimer l\'appareil.');
            }
          }
        }
      ]
    );
  };

  const handleRenameDevice = (device: any) => {
    Alert.prompt(
      'Renommer l\'appareil',
      'Entrez le nouveau nom :',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Renommer',
          onPress: async (newName) => {
            if (newName && newName.trim()) {
              try {
                await renameDevice(device.id, newName.trim());
                console.log('✅ Device renamed successfully');
              } catch (error) {
                console.log('❌ Failed to rename device:', error);
                Alert.alert('Erreur', 'Impossible de renommer l\'appareil.');
              }
            }
          }
        }
      ],
      'plain-text',
      device.name
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Ajouter un appareil</Text>
        </View>

        {/* Automatic Addition Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ajout automatique</Text>
          <Text style={styles.sectionDescription}>
            Scannez votre réseau pour trouver des appareils
          </Text>
          
          <Button
            text={isScanning ? `Scanner... ${scanProgress}%` : "Scanner"}
            onPress={handleScanNetwork}
            style={[styles.scanButton, { opacity: isScanning ? 0.7 : 1 }]}
          />
          
          {isScanning && (
            <View style={styles.scanningIndicator}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.scanningText}>Recherche en cours...</Text>
            </View>
          )}
        </View>

        {/* Manual Addition Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ajout manuel</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nom</Text>
            <TextInput
              style={styles.input}
              value={deviceName}
              onChangeText={setDeviceName}
              placeholder="Mon lecteur"
              placeholderTextColor={colors.grey + '80'}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>IP / Hôte</Text>
            <TextInput
              style={styles.input}
              value={ipAddress}
              onChangeText={setIpAddress}
              placeholder="192.168.1.20"
              placeholderTextColor={colors.grey + '80'}
              keyboardType="numbers-and-punctuation"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <Button
            text={isAdding ? "Ajout en cours..." : "Ajouter"}
            onPress={handleAddDevice}
            style={[styles.addButton, { opacity: isAdding ? 0.7 : 1 }]}
          />
          
          {isAdding && (
            <View style={styles.addingIndicator}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.addingText}>Ajout en cours...</Text>
            </View>
          )}
        </View>

        {/* Devices List Section */}
        {devices.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Appareils ajoutés ({devices.length})</Text>
            <Text style={styles.sectionDescription}>
              Appuyez sur un appareil pour le contrôler
            </Text>
            
            <View style={styles.devicesList}>
              {devices.map((device) => (
                <View key={device.id} style={styles.deviceCardContainer}>
                  <DeviceCard
                    device={device}
                    onPress={() => handleDevicePress(device)}
                    onRemove={() => handleRemoveDevice(device.id)}
                  />
                  
                  {/* Rename button with white background and black text */}
                  <TouchableOpacity
                    style={styles.renameButton}
                    onPress={() => handleRenameDevice(device)}
                  >
                    <Icon name="create-outline" size={20} color="#000000" />
                    <Text style={styles.renameButtonText}>Renommer</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Empty state */}
        {devices.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="wifi-outline" size={64} color={colors.grey} />
            <Text style={styles.emptyStateTitle}>Aucun appareil trouvé</Text>
            <Text style={styles.emptyStateDescription}>
              Utilisez le scan automatique ou ajoutez un appareil manuellement
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  titleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  section: {
    backgroundColor: colors.backgroundAlt,
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    color: colors.grey,
    marginBottom: 20,
    lineHeight: 22,
  },
  scanButton: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignSelf: 'flex-end',
  },
  scanningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  scanningText: {
    fontSize: 14,
    color: colors.grey,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: colors.grey,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.grey + '30',
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  addingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  addingText: {
    fontSize: 14,
    color: colors.grey,
  },
  devicesList: {
    gap: 12,
  },
  deviceCardContainer: {
    gap: 8,
  },
  renameButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  renameButtonText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 16,
    color: colors.grey,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default AddDeviceScreen;
