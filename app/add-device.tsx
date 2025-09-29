
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../styles/commonStyles';
import Icon from '../components/Icon';
import Button from '../components/Button';
import DeviceCard from '../components/DeviceCard';
import EditDeviceModal from '../components/EditDeviceModal';
import NetworkTroubleshootingModal from '../components/NetworkTroubleshootingModal';
import NetworkHelpModal from '../components/NetworkHelpModal';
import NetworkDiagnosticModal from '../components/NetworkDiagnosticModal';
import { useDeviceDiscovery } from '../hooks/useDeviceDiscovery';
import { RVolutionDevice } from '../types/Device';

const AddDeviceScreen: React.FC = () => {
  const router = useRouter();
  const { 
    devices, 
    discoveredDevices,
    scanNetwork, 
    addDeviceManually, 
    addDiscoveredDevice,
    removeDevice, 
    updateDevice,
    isScanning, 
    scanProgress,
    networkInfo,
    runNetworkDiagnostic
  } = useDeviceDiscovery();
  
  const [deviceName, setDeviceName] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [troubleshootingModalVisible, setTroubleshootingModalVisible] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [diagnosticModalVisible, setDiagnosticModalVisible] = useState(false);
  const [deviceToEdit, setDeviceToEdit] = useState<RVolutionDevice | null>(null);
  const [scanAttempts, setScanAttempts] = useState(0);
  const [showNetworkHelp, setShowNetworkHelp] = useState(false);
  const [diagnosticIP, setDiagnosticIP] = useState<string | undefined>();
  
  // Refs for input fields to control focus
  const deviceNameInputRef = useRef<TextInput>(null);
  const ipAddressInputRef = useRef<TextInput>(null);

  const handleScanNetwork = async () => {
    console.log('🔍 Starting automatic network scan with HTTP protocol');
    setScanAttempts(prev => prev + 1);
    
    try {
      await scanNetwork();
      const foundCount = discoveredDevices.length;
      
      if (foundCount > 0) {
        Alert.alert(
          'Scan terminé',
          `${foundCount} appareil${foundCount > 1 ? 's' : ''} R_volution trouvé${foundCount > 1 ? 's' : ''} ! Vous pouvez maintenant les ajouter à votre liste.`,
          [{ text: 'OK' }]
        );
      } else {
        // Show help options after failed scan
        Alert.alert(
          'Aucun appareil trouvé',
          'Aucun appareil R_volution trouvé sur le réseau. Que souhaitez-vous faire ?',
          [
            { text: 'Annuler', style: 'cancel' },
            { 
              text: 'Aide réseau', 
              onPress: () => setHelpModalVisible(true)
            },
            { 
              text: 'Dépannage', 
              onPress: () => setTroubleshootingModalVisible(true)
            }
          ]
        );
      }
    } catch (error) {
      console.log('❌ Network scan failed:', error);
      Alert.alert(
        'Erreur de scan',
        'Impossible de scanner le réseau. Voulez-vous voir les options d\'aide ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { 
            text: 'Aide réseau', 
            onPress: () => setHelpModalVisible(true)
          }
        ]
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
      
      // Clear the form and remove focus from inputs
      setDeviceName('');
      setIpAddress('');
      
      // Blur both input fields to dismiss keyboard and remove focus
      deviceNameInputRef.current?.blur();
      ipAddressInputRef.current?.blur();
      
      Alert.alert(
        'Appareil ajouté',
        `${deviceName} a été ajouté avec succès.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.log('❌ Failed to add device:', error);
      
      // Remove focus from inputs even on error to prevent keyboard from staying open
      deviceNameInputRef.current?.blur();
      ipAddressInputRef.current?.blur();
      
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
      throw error;
    }
  };

  const handleCloseEditModal = () => {
    setEditModalVisible(false);
    setDeviceToEdit(null);
  };

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

  const handleShowNetworkHelp = () => {
    setShowNetworkHelp(!showNetworkHelp);
  };

  const handleManualAddFromHelp = async (ip: string, name: string) => {
    try {
      await addDeviceManually(ip, 80, name);
      Alert.alert(
        'Appareil ajouté',
        `${name} a été ajouté avec succès.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Erreur d\'ajout',
        error.message || 'Impossible d\'ajouter l\'appareil.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleRunDiagnostic = async (targetIP?: string) => {
    setDiagnosticIP(targetIP);
    setDiagnosticModalVisible(true);
  };

  const getNetworkHelpText = () => {
    if (scanAttempts === 0) {
      return "Appuyez sur 'Scanner le réseau' pour rechercher automatiquement les appareils R_volution.";
    } else if (scanAttempts === 1) {
      return "Premier scan terminé. Si aucun appareil n'a été trouvé, vous êtes peut-être sur un réseau différent.";
    } else {
      return "Plusieurs scans effectués sans succès. Vous semblez être sur un réseau différent de vos appareils.";
    }
  };

  const getNetworkStatusColor = () => {
    if (scanAttempts === 0) return colors.grey;
    if (discoveredDevices.length > 0) return colors.success;
    if (scanAttempts >= 2) return colors.error;
    return colors.warning;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior="padding"
        keyboardVerticalOffset={0}
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

          {/* Network Status Info */}
          <View style={styles.networkStatusSection}>
            <View style={styles.networkStatusHeader}>
              <Icon name="wifi" size={20} color={getNetworkStatusColor()} />
              <Text style={styles.networkStatusTitle}>État du réseau</Text>
              <View style={styles.networkStatusActions}>
                <TouchableOpacity onPress={handleShowNetworkHelp} style={styles.helpButton}>
                  <Icon name="help-circle" size={18} color={colors.grey} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setHelpModalVisible(true)} style={styles.helpButton}>
                  <Icon name="information-circle" size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
            
            <Text style={[styles.networkStatusText, { color: getNetworkStatusColor() }]}>
              {getNetworkHelpText()}
            </Text>
            
            {networkInfo.networkRange && (
              <Text style={styles.networkRangeText}>
                Plages réseau détectées : {networkInfo.networkRange}
              </Text>
            )}

            {scanAttempts >= 2 && discoveredDevices.length === 0 && (
              <View style={styles.networkWarning}>
                <Icon name="warning" size={16} color={colors.warning} />
                <Text style={styles.networkWarningText}>
                  Vous semblez être sur un réseau différent de vos appareils R_volution
                </Text>
              </View>
            )}

            {showNetworkHelp && (
              <View style={styles.networkHelpSection}>
                <Text style={styles.networkHelpTitle}>Conseils de réseau :</Text>
                <Text style={styles.networkHelpText}>• Assurez-vous d'être sur le même réseau Wi-Fi que vos appareils</Text>
                <Text style={styles.networkHelpText}>• Vérifiez que les appareils R_volution sont allumés</Text>
                <Text style={styles.networkHelpText}>• Si vous êtes sur un réseau d'entreprise, des restrictions peuvent bloquer la découverte</Text>
                <Text style={styles.networkHelpText}>• Utilisez l'ajout manuel si la découverte automatique échoue</Text>
              </View>
            )}
          </View>

          {/* Automatic Addition Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Découverte automatique</Text>
              <View style={styles.sectionActions}>
                <TouchableOpacity 
                  onPress={() => handleRunDiagnostic()}
                  style={styles.actionButton}
                >
                  <Icon name="analytics" size={14} color={colors.grey} />
                  <Text style={styles.actionButtonText}>Diagnostic</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setTroubleshootingModalVisible(true)}
                  style={styles.actionButton}
                >
                  <Icon name="settings" size={14} color={colors.grey} />
                  <Text style={styles.actionButtonText}>Dépannage</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <Text style={styles.sectionDescription}>
              Scannez votre réseau pour trouver des appareils R_volution
            </Text>
            
            <View style={styles.scanButtonContainer}>
              <Button
                text={isScanning ? `Scanner... ${scanProgress}%` : "Scanner le réseau"}
                onPress={handleScanNetwork}
                style={[styles.scanButton, { opacity: isScanning ? 0.7 : 1 }]}
              />
              
              {scanAttempts > 0 && !isScanning && (
                <Text style={styles.scanAttemptsText}>
                  {scanAttempts} scan{scanAttempts > 1 ? 's' : ''} effectué{scanAttempts > 1 ? 's' : ''}
                  {discoveredDevices.length > 0 && ` - ${discoveredDevices.length} trouvé${discoveredDevices.length > 1 ? 's' : ''}`}
                </Text>
              )}
            </View>
            
            {isScanning && (
              <View style={styles.scanningIndicator}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.scanningText}>Recherche en cours...</Text>
              </View>
            )}
          </View>

          {/* Discovered Devices Section */}
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
                    <View style={styles.discoveredDeviceActions}>
                      <TouchableOpacity
                        style={styles.diagnosticButton}
                        onPress={() => handleRunDiagnostic(device.ip)}
                      >
                        <Icon name="analytics" size={16} color={colors.grey} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.addDiscoveredButton}
                        onPress={() => handleAddDiscoveredDevice(device)}
                      >
                        <Icon name="add" size={20} color={colors.white} />
                        <Text style={styles.addDiscoveredButtonText}>Ajouter</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Manual Addition Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Ajout manuel</Text>
              <TouchableOpacity 
                onPress={() => setHelpModalVisible(true)}
                style={styles.actionButton}
              >
                <Icon name="help-circle" size={14} color={colors.primary} />
                <Text style={[styles.actionButtonText, { color: colors.primary }]}>Aide</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.sectionDescription}>
              Si la découverte automatique ne fonctionne pas, ajoutez votre appareil manuellement
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nom</Text>
              <TextInput
                ref={deviceNameInputRef}
                style={styles.input}
                value={deviceName}
                onChangeText={setDeviceName}
                placeholder="Mon lecteur R_volution"
                placeholderTextColor={colors.grey + '80'}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Adresse IP</Text>
              <TextInput
                ref={ipAddressInputRef}
                style={styles.input}
                value={ipAddress}
                onChangeText={setIpAddress}
                placeholder="192.168.1.20"
                placeholderTextColor={colors.grey + '80'}
                keyboardType="numbers-and-punctuation"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.inputHint}>
                Trouvez l'IP dans les paramètres réseau de votre appareil R_volution
              </Text>
            </View>

            <View style={styles.manualAddActions}>
              <Button
                text={isAdding ? "Ajout..." : "Ajouter l'appareil"}
                onPress={handleAddDevice}
                style={[styles.addButton, { opacity: isAdding ? 0.7 : 1 }]}
              />
              
              {ipAddress.trim() && (
                <TouchableOpacity
                  style={styles.testButton}
                  onPress={() => handleRunDiagnostic(ipAddress.trim())}
                >
                  <Icon name="analytics" size={16} color={colors.primary} />
                  <Text style={styles.testButtonText}>Tester</Text>
                </TouchableOpacity>
              )}
            </View>
            
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

          {/* Empty state with enhanced help */}
          {devices.length === 0 && discoveredDevices.length === 0 && !isScanning && (
            <View style={styles.emptyState}>
              <Icon name="wifi-outline" size={64} color={colors.grey} />
              <Text style={styles.emptyStateTitle}>Aucun appareil trouvé</Text>
              <Text style={styles.emptyStateDescription}>
                {scanAttempts === 0 
                  ? "Commencez par scanner votre réseau pour trouver vos appareils R_volution"
                  : "La découverte automatique n'a trouvé aucun appareil sur votre réseau"
                }
              </Text>
              
              <View style={styles.emptyStateActions}>
                {scanAttempts === 0 ? (
                  <Button
                    text="Scanner le réseau"
                    onPress={handleScanNetwork}
                    style={styles.primaryActionButton}
                  />
                ) : (
                  <Button
                    text="Essayer un nouveau scan"
                    onPress={handleScanNetwork}
                    style={styles.retryScanButton}
                  />
                )}
                
                <TouchableOpacity 
                  onPress={() => setHelpModalVisible(true)}
                  style={styles.helpLink}
                >
                  <Icon name="help-circle" size={16} color={colors.primary} />
                  <Text style={styles.helpLinkText}>
                    {scanAttempts >= 2 ? "Je suis sur un autre réseau" : "Besoin d'aide ?"}
                  </Text>
                </TouchableOpacity>
              </View>
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

      {/* Network Troubleshooting Modal */}
      <NetworkTroubleshootingModal
        visible={troubleshootingModalVisible}
        onClose={() => setTroubleshootingModalVisible(false)}
        networkInfo={networkInfo}
        scanAttempts={scanAttempts}
        onRetryScan={handleScanNetwork}
      />

      {/* Network Help Modal */}
      <NetworkHelpModal
        visible={helpModalVisible}
        onClose={() => setHelpModalVisible(false)}
        onAddManualDevice={handleManualAddFromHelp}
      />

      {/* Network Diagnostic Modal */}
      <NetworkDiagnosticModal
        visible={diagnosticModalVisible}
        onClose={() => setDiagnosticModalVisible(false)}
        targetIP={diagnosticIP}
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
  networkStatusSection: {
    backgroundColor: colors.backgroundAlt,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    padding: 20,
  },
  networkStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  networkStatusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  networkStatusActions: {
    flexDirection: 'row',
    gap: 8,
  },
  helpButton: {
    padding: 4,
  },
  networkStatusText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  networkRangeText: {
    fontSize: 12,
    color: colors.grey + '80',
    fontStyle: 'italic',
  },
  networkWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '10',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  networkWarningText: {
    flex: 1,
    fontSize: 13,
    color: colors.warning,
    fontWeight: '500',
  },
  networkHelpSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.grey + '20',
  },
  networkHelpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  networkHelpText: {
    fontSize: 13,
    color: colors.grey,
    lineHeight: 18,
    marginBottom: 4,
  },
  section: {
    backgroundColor: colors.backgroundAlt,
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 16,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  sectionActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actionButtonText: {
    fontSize: 12,
    color: colors.grey,
  },
  sectionDescription: {
    fontSize: 16,
    color: colors.grey,
    marginBottom: 16,
    lineHeight: 22,
  },
  scanButtonContainer: {
    alignItems: 'flex-end',
  },
  scanButton: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  scanAttemptsText: {
    fontSize: 12,
    color: colors.grey,
    marginTop: 8,
    fontStyle: 'italic',
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
  discoveredDeviceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  diagnosticButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.backgroundAlt,
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
  inputHint: {
    fontSize: 12,
    color: colors.grey + '80',
    marginTop: 4,
    fontStyle: 'italic',
  },
  manualAddActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  addButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  testButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
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
    marginBottom: 24,
  },
  emptyStateActions: {
    alignItems: 'center',
    gap: 16,
  },
  primaryActionButton: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  retryScanButton: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  helpLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  helpLinkText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
});

export default AddDeviceScreen;
