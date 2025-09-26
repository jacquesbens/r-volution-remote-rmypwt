
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, RefreshControl, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useDeviceDiscovery } from '../hooks/useDeviceDiscovery';
import { RVolutionDevice } from '../types/Device';
import DeviceCard from '../components/DeviceCard';
import AddDeviceModal from '../components/AddDeviceModal';
import Icon from '../components/Icon';
import Button from '../components/Button';
import { commonStyles, colors } from '../styles/commonStyles';

const MainScreen: React.FC = () => {
  const router = useRouter();
  const {
    devices,
    isScanning,
    scanProgress,
    networkInfo,
    scanNetwork,
    addDeviceManually,
    removeDevice,
    updateDeviceStatus,
    runNetworkDiagnostic,
  } = useDeviceDiscovery();

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  useEffect(() => {
    console.log('🏠 MainScreen mounted, devices:', devices.length);
  }, []);

  useEffect(() => {
    console.log('📱 Devices updated:', devices.length);
    devices.forEach((device, index) => {
      console.log(`   ${index + 1}. ${device.name} (${device.ip}:${device.port}) - ${device.isOnline ? 'Online' : 'Offline'}`);
    });
  }, [devices]);

  const handleScanNetwork = async () => {
    console.log('🔍 Network scan requested from UI');
    try {
      await scanNetwork();
      console.log('✅ Network scan completed from UI');
    } catch (error) {
      console.log('❌ Network scan failed from UI:', error);
      Alert.alert(
        'Erreur de scan',
        'Impossible de scanner le réseau. Vérifiez votre connexion Wi-Fi.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleAddDevice = async (ip: string, port: number, name?: string) => {
    console.log('➕ Manual device addition requested from UI');
    console.log(`   IP: ${ip}, Port: ${port}, Name: ${name}`);
    
    try {
      const newDevice = await addDeviceManually(ip, port, name);
      console.log('✅ Device added successfully from UI:', newDevice);
      
      Alert.alert(
        'Appareil ajouté',
        `${newDevice.name} a été ajouté à la liste.${newDevice.isOnline ? '' : '\n\nNote: L\'appareil semble hors ligne.'}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.log('❌ Device addition failed from UI:', error);
      Alert.alert(
        'Erreur d\'ajout',
        error.message || 'Impossible d\'ajouter l\'appareil.',
        [{ text: 'OK' }]
      );
      throw error; // Re-throw to prevent modal from closing
    }
  };

  const handleRemoveDevice = (deviceId: string, deviceName: string) => {
    console.log('🗑️  Device removal requested from UI:', deviceId, deviceName);
    
    Alert.alert(
      'Supprimer l\'appareil',
      `Êtes-vous sûr de vouloir supprimer "${deviceName}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeDevice(deviceId);
              console.log('✅ Device removed successfully from UI');
            } catch (error) {
              console.log('❌ Device removal failed from UI:', error);
              Alert.alert('Erreur', 'Impossible de supprimer l\'appareil.');
            }
          },
        },
      ]
    );
  };

  const handleDevicePress = (deviceId: string) => {
    console.log('📱 Device selected from UI:', deviceId);
    router.push(`/device/${deviceId}`);
  };

  const handleRefresh = async () => {
    console.log('🔄 Refresh requested from UI');
    setIsRefreshing(true);
    try {
      await updateDeviceStatus();
      console.log('✅ Refresh completed from UI');
    } catch (error) {
      console.log('❌ Refresh failed from UI:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTestDevice = async (device: RVolutionDevice): Promise<boolean> => {
    console.log('🧪 Device test requested from UI:', device.name);
    
    try {
      // Import the verification function from the hook
      const { verifyRVolutionDevice } = useDeviceDiscovery();
      const result = await verifyRVolutionDevice(device.ip, device.port);
      
      const isWorking = result.isRVolution;
      console.log(`${isWorking ? '✅' : '❌'} Device test result:`, isWorking);
      
      Alert.alert(
        'Test de connexion',
        isWorking 
          ? `✅ ${device.name} répond correctement.`
          : `❌ ${device.name} ne répond pas ou n'est pas un appareil R_VOLUTION.`,
        [{ text: 'OK' }]
      );
      
      return isWorking;
    } catch (error) {
      console.log('❌ Device test failed from UI:', error);
      Alert.alert(
        'Test de connexion',
        `❌ Impossible de tester ${device.name}.\n\nErreur: ${error.message}`,
        [{ text: 'OK' }]
      );
      return false;
    }
  };

  const handleRunDiagnostic = async () => {
    console.log('🔧 Network diagnostic requested from UI');
    
    Alert.alert(
      'Diagnostic réseau',
      'Voulez-vous lancer un diagnostic du réseau pour identifier les problèmes de connexion ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Lancer',
          onPress: async () => {
            try {
              await runNetworkDiagnostic();
              Alert.alert(
                'Diagnostic terminé',
                'Consultez les logs de la console pour les détails du diagnostic.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.log('❌ Diagnostic failed from UI:', error);
              Alert.alert(
                'Erreur de diagnostic',
                'Impossible de lancer le diagnostic réseau.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };

  const runNetworkDiagnostic = async () => {
    console.log('🔧 === NETWORK DIAGNOSTIC UI ===');
    
    // Test common router IPs
    const commonRouterIPs = ['192.168.1.1', '192.168.0.1', '10.0.0.1'];
    
    console.log('🌐 Testing router connectivity...');
    for (const routerIP of commonRouterIPs) {
      try {
        const response = await fetch(`http://${routerIP}`, {
          method: 'HEAD',
          timeout: 3000,
        });
        console.log(`✅ Router ${routerIP} is reachable (status: ${response.status})`);
      } catch (error) {
        console.log(`❌ Router ${routerIP} is not reachable`);
      }
    }
    
    console.log('🔧 Network diagnostic completed');
  };

  return (
    <SafeAreaView style={[commonStyles.container, styles.container]}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>R_VOLUTION Remote</Text>
          <Text style={styles.subtitle}>
            {devices.length === 0 
              ? 'Aucun appareil trouvé' 
              : `${devices.length} appareil${devices.length > 1 ? 's' : ''} • ${devices.filter(d => d.isOnline).length} en ligne`
            }
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.diagnosticButton}
          onPress={() => setShowDiagnostics(!showDiagnostics)}
        >
          <Icon name="settings" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {showDiagnostics && (
        <View style={styles.diagnosticPanel}>
          <Text style={styles.diagnosticTitle}>Informations réseau</Text>
          <Text style={styles.diagnosticText}>
            IP locale: {networkInfo.localIP || 'Détection...'}
          </Text>
          <Text style={styles.diagnosticText}>
            Plages scannées: {networkInfo.networkRange || 'Détection...'}
          </Text>
          
          <TouchableOpacity 
            style={styles.diagnosticAction}
            onPress={handleRunDiagnostic}
          >
            <Icon name="bug" size={16} color={colors.primary} />
            <Text style={styles.diagnosticActionText}>Lancer diagnostic</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.actions}>
        <Button
          text={isScanning ? `Scan en cours... ${scanProgress}%` : "Scanner le réseau"}
          onPress={handleScanNetwork}
          style={[styles.actionButton, { opacity: isScanning ? 0.6 : 1 }]}
        />
        
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsAddModalVisible(true)}
        >
          <Icon name="add" size={24} color={colors.background} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.deviceList}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {devices.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="musical-notes" size={64} color={colors.grey} />
            <Text style={styles.emptyTitle}>Aucun appareil R_VOLUTION</Text>
            <Text style={styles.emptyDescription}>
              Scannez le réseau pour découvrir automatiquement les appareils ou ajoutez-en un manuellement.
            </Text>
            
            <View style={styles.troubleshootingTips}>
              <Text style={styles.tipsTitle}>💡 Conseils de dépannage :</Text>
              <Text style={styles.tipText}>• Vérifiez que l'appareil R_VOLUTION est allumé</Text>
              <Text style={styles.tipText}>• Assurez-vous qu'il est connecté au Wi-Fi</Text>
              <Text style={styles.tipText}>• Vérifiez que vous êtes sur le même réseau</Text>
              <Text style={styles.tipText}>• L'appareil doit utiliser le port 80</Text>
              <Text style={styles.tipText}>• Essayez l'ajout manuel si vous connaissez l'IP</Text>
            </View>
          </View>
        ) : (
          <View style={styles.deviceGrid}>
            {devices.map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                onPress={() => handleDevicePress(device.id)}
                onRemove={() => handleRemoveDevice(device.id, device.name)}
                onTest={handleTestDevice}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <AddDeviceModal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        onAddDevice={handleAddDevice}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey + '20',
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.grey,
  },
  diagnosticButton: {
    padding: 8,
  },
  diagnosticPanel: {
    backgroundColor: colors.backgroundAlt,
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.grey + '20',
  },
  diagnosticTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  diagnosticText: {
    fontSize: 14,
    color: colors.grey,
    marginBottom: 4,
  },
  diagnosticAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  diagnosticActionText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)',
    elevation: 4,
  },
  deviceList: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: colors.grey,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  troubleshootingTips: {
    backgroundColor: colors.backgroundAlt,
    padding: 20,
    borderRadius: 12,
    width: '100%',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: colors.grey,
    lineHeight: 20,
    marginBottom: 4,
  },
  deviceGrid: {
    padding: 20,
    gap: 16,
  },
});

export default MainScreen;
