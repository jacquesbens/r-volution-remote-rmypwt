
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../styles/commonStyles';
import Icon from '../components/Icon';
import Button from '../components/Button';
import DeviceCard from '../components/DeviceCard';
import EditDeviceModal from '../components/EditDeviceModal';
import { useDeviceDiscovery } from '../hooks/useDeviceDiscovery';
import { RVolutionDevice } from '../types/Device';

const AddDeviceScreen: React.FC = () => {
  const router = useRouter();
  const { 
    devices, 
    discoveredDevices, // New: get discovered devices
    scanNetwork, 
    addDeviceManually, 
    addDiscoveredDevice, // New: function to add discovered device
    removeDevice, 
    updateDevice,
    isScanning, 
    scanProgress 
  } = useDeviceDiscovery();
  
  const [deviceName, setDeviceName] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deviceToEdit, setDeviceToEdit] = useState<RVolutionDevice | null>(null);

  const handleScanNetwork = async () => {
    console.log('🔍 Starting automatic network scan with HTTP protocol');
    try {
      await scanNetwork();
      const foundCount = discoveredDevices.length;
      Alert.alert(
        'Scan terminé',
        foundCount > 0 
          ? `${foundCount} appareil${foundCount > 1 ? 's' : ''} R_volution trouvé${foundCount > 1 ? 's' : ''} ! Vous pouvez maintenant les ajouter à votre liste.`
          : 'Aucun appareil R_volution trouvé sur le réseau. Vérifiez que vos appareils sont allumés et connectés au Wi-Fi.',
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
    try {
      await removeDevice(deviceId);
      console.log('✅ Device removed successfully');
    } catch (error) {
      console.log('❌ Failed to remove device:', error);
      Alert.alert('Erreur', 'Impossible de supprimer l\'appareil.');
    }
  };

  const handleEditDevice = (device: RVolutionDevice) => {
    console.log('✏️ Edit device pressed:', device.name);
    setDeviceToEdit(device);
    setEditModalVisible(true);
  };

  const handleUpdateDevice = async (deviceId: string, updates: { name?: string; ip?: string; port?: number }) => {
    try {
      await updateDevice(deviceId, updates);
      console.log('✅ Device updated successfully');
      Alert.alert(
        'Appareil modifié',
        'Les modifications ont été enregistrées avec succès.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.log('❌ Failed to update device:', error);
      throw error; // Re-throw to let the modal handle the error display
    }
  };

  const handleCloseEditModal = () => {
    setEditModalVisible(false);
    setDeviceToEdit(null);
  };

  // Modified: Handle adding a discovered device to saved devices and remove from discovered list
  const handleAddDiscoveredDevice = async (discoveredDevice: RVolutionDevice) => {
    try {
      console.log('➕ Adding discovered device to saved devices:', discoveredDevice.name);
      await addDiscoveredDevice(discoveredDevice);
      Alert.alert(
        'Appareil ajouté',
        `${discoveredDevice.name} a été ajouté à votre liste d'appareils.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.log('❌ Failed to add discovered device:', error);
      Alert.alert(
        'Erreur d\'ajout',
        error.message || 'Impossible d\'ajouter l\'appareil découvert.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>R_volution Remote</Text>
            <Text style={styles.subtitle}>ajouter un appareil</Text>
          </View>

          {/* Automatic Addition Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ajout automatique</Text>
            <Text style={styles.sectionDescription}>
              Scannez votre réseau pour trouver des appareils R_volution
            </Text>
            
            <Button
              text={isScanning ? `Scanner... ${scanProgress}%` : "Scanner le réseau"}
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

          {/* Discovered Devices Section - NEW */}
          {discoveredDevices.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Appareils découverts ({discoveredDevices.length})</Text>
              <Text style={styles.sectionDescription}>
                Appareils R_volution trouvés sur le réseau. Appuyez sur "Ajouter" pour les sauvegarder.
              </Text>
              
              <View style={styles.devicesList}>
                {discoveredDevices.map((device) => (
                  <View key={device.id} style={styles.discoveredDeviceCard}>
                    <View style={styles.discoveredDeviceInfo}>
                      <View style={styles.discoveredDeviceHeader}>
                        <Icon name="wifi" size={20} color={colors.success} />
                        <Text style={styles.discoveredDeviceName}>{device.name}</Text>
                      </View>
                      <Text style={styles.discoveredDeviceDetails}>
                        {device.ip}
                      </Text>
                      <View style={styles.discoveredDeviceStatus}>
                        <View style={styles.onlineIndicator} />
                        <Text style={styles.onlineText}>En ligne</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.addDiscoveredButton}
                      onPress={() => handleAddDiscoveredDevice(device)}
                    >
                      <Icon name="add" size={20} color={colors.white} />
                      <Text style={styles.addDiscoveredButtonText}>Ajouter</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

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
              text={isAdding ? "Ajout..." : "Ajouter"}
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

          {/* Saved Devices List Section */}
          {devices.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Mes appareils ({devices.length})</Text>
              <Text style={styles.sectionDescription}>
                Appuyez sur un appareil pour le contrôler
              </Text>
              
              <View style={styles.devicesList}>
                {devices.map((device) => (
                  <DeviceCard
                    key={device.id}
                    device={device}
                    onPress={() => handleDevicePress(device)}
                    onRemove={() => handleRemoveDevice(device.id)}
                    onEdit={() => handleEditDevice(device)}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Empty state */}
          {devices.length === 0 && discoveredDevices.length === 0 && !isScanning && (
            <View style={styles.emptyState}>
              <Icon name="wifi-outline" size={64} color={colors.grey} />
              <Text style={styles.emptyStateTitle}>Aucun appareil trouvé</Text>
              <Text style={styles.emptyStateDescription}>
                Utilisez le scan automatique ou ajoutez un appareil manuellement
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Edit Device Modal */}
      <EditDeviceModal
        visible={editModalVisible}
        device={deviceToEdit}
        onClose={handleCloseEditModal}
        onUpdateDevice={handleUpdateDevice}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
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
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.grey,
    marginTop: 4,
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
    marginBottom: 16,
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
  // New styles for discovered devices
  discoveredDeviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.success + '30',
  },
  discoveredDeviceInfo: {
    flex: 1,
  },
  discoveredDeviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  discoveredDeviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  discoveredDeviceDetails: {
    fontSize: 14,
    color: colors.grey,
    marginBottom: 6,
  },
  discoveredDeviceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  onlineText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '500',
  },
  addDiscoveredButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 4,
  },
  addDiscoveredButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
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
