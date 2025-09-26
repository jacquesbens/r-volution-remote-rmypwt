
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RVolutionDevice } from '../../types/Device';
import { colors, commonStyles } from '../../styles/commonStyles';
import { useDeviceDiscovery } from '../../hooks/useDeviceDiscovery';
import RemoteControl from '../../components/RemoteControl';
import Icon from '../../components/Icon';

export default function DeviceControlScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { devices, updateDeviceStatus, checkDeviceReachability, verifyRVolutionDevice } = useDeviceDiscovery();
  const [device, setDevice] = useState<RVolutionDevice | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [deviceNotFound, setDeviceNotFound] = useState(false);

  // Find and set the device whenever devices array changes
  useEffect(() => {
    console.log(`🔍 Looking for device with ID: ${id}`);
    console.log(`📱 Available devices: ${devices.length}`);
    devices.forEach((d, index) => {
      console.log(`   ${index + 1}. ${d.name} (${d.id}) - ${d.isOnline ? 'Online' : 'Offline'}`);
    });

    const foundDevice = devices.find(d => d.id === id);
    if (foundDevice) {
      console.log(`✅ Device found: ${foundDevice.name} (${foundDevice.ip}:${foundDevice.port})`);
      setDevice(foundDevice);
      setDeviceNotFound(false);
      
      // Check device status when entering the screen
      checkDeviceStatusOnEntry(foundDevice);
    } else {
      console.log(`❌ Device with ID ${id} not found in devices list`);
      setDeviceNotFound(true);
      
      // Show alert after a short delay to ensure the component is mounted
      setTimeout(() => {
        Alert.alert(
          'Appareil non trouvé', 
          'L\'appareil sélectionné n\'a pas été trouvé dans la liste.',
          [
            { text: 'Retour', onPress: () => router.back() },
            { text: 'Actualiser', onPress: () => {
              console.log('🔄 Refreshing device list...');
              updateDeviceStatus();
            }}
          ]
        );
      }, 100);
    }
  }, [id, devices, router, updateDeviceStatus]);

  // Check device status when entering the screen
  const checkDeviceStatusOnEntry = async (deviceToCheck: RVolutionDevice) => {
    console.log(`🔄 === DEVICE STATUS CHECK STARTED ===`);
    console.log(`   Device: ${deviceToCheck.name}`);
    console.log(`   IP: ${deviceToCheck.ip}:${deviceToCheck.port}`);
    console.log(`   Type: ${deviceToCheck.isManuallyAdded ? 'Manual' : 'Auto-discovered'}`);
    console.log(`   Current status: ${deviceToCheck.isOnline ? 'Online' : 'Offline'}`);
    
    setIsCheckingStatus(true);
    
    try {
      let isOnline = false;
      let deviceName = deviceToCheck.name;
      let actualPort = deviceToCheck.port;
      
      if (deviceToCheck.isManuallyAdded) {
        // For manually added devices, use basic connectivity check
        console.log(`   📱 Manual device - checking basic connectivity`);
        isOnline = await checkDeviceReachability(deviceToCheck.ip, deviceToCheck.port, 2);
        console.log(`   🔗 Connectivity result: ${isOnline ? 'REACHABLE' : 'UNREACHABLE'}`);
      } else {
        // For auto-discovered devices, use R_VOLUTION verification
        console.log(`   🤖 Auto-discovered device - verifying R_VOLUTION compatibility`);
        const verificationResult = await verifyRVolutionDevice(deviceToCheck.ip, deviceToCheck.port);
        isOnline = verificationResult.isRVolution;
        
        if (verificationResult.isRVolution) {
          deviceName = verificationResult.deviceName || deviceToCheck.name;
          actualPort = verificationResult.actualPort || deviceToCheck.port;
          console.log(`   ✅ R_VOLUTION verification: SUCCESS`);
          console.log(`   📝 Device name: ${deviceName}`);
          console.log(`   🔌 Actual port: ${actualPort}`);
        } else {
          console.log(`   ❌ R_VOLUTION verification: FAILED`);
          // Fallback to basic connectivity for auto-discovered devices
          const isReachable = await checkDeviceReachability(deviceToCheck.ip, deviceToCheck.port, 1);
          console.log(`   🔗 Fallback connectivity: ${isReachable ? 'REACHABLE' : 'UNREACHABLE'}`);
          // For auto-discovered devices, we still require R_VOLUTION verification to be considered online
          isOnline = false;
        }
      }
      
      // Update the device object with new status
      const updatedDevice = {
        ...deviceToCheck,
        isOnline,
        lastSeen: isOnline ? new Date() : deviceToCheck.lastSeen,
        name: deviceName,
        port: actualPort,
      };
      
      console.log(`   📊 Final status: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
      console.log(`🔄 === DEVICE STATUS CHECK COMPLETED ===`);
      
      // Update the local device state
      setDevice(updatedDevice);
      
      // Trigger a full device list update to sync with storage
      await updateDeviceStatus();
      
    } catch (error) {
      console.log(`❌ Device status check failed:`, error);
      console.log(`🔄 === DEVICE STATUS CHECK FAILED ===`);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Periodic status updates
  useEffect(() => {
    if (!device) return;

    console.log(`⏰ Setting up periodic status updates for ${device.name}`);
    
    // Update device status every 30 seconds
    const interval = setInterval(() => {
      console.log(`⏰ Periodic status update for ${device.name}`);
      updateDeviceStatus();
    }, 30000);

    return () => {
      console.log(`⏰ Clearing periodic status updates for ${device.name}`);
      clearInterval(interval);
    };
  }, [device, updateDeviceStatus]);

  // Show loading state while checking for device
  if (deviceNotFound) {
    return (
      <SafeAreaView style={commonStyles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Appareil non trouvé</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={64} color="#F44336" />
          <Text style={styles.errorTitle}>Appareil non trouvé</Text>
          <Text style={styles.errorDescription}>
            L'appareil sélectionné n'existe plus dans la liste des appareils.
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              console.log('🔄 Retry button pressed - updating device status');
              updateDeviceStatus();
            }}
          >
            <Icon name="refresh" size={20} color="white" />
            <Text style={styles.retryButtonText}>Actualiser</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!device) {
    return (
      <SafeAreaView style={commonStyles.container}>
        <View style={commonStyles.content}>
          <View style={styles.loadingContainer}>
            <Icon name="refresh" size={32} color={colors.primary} />
            <Text style={styles.loadingText}>Chargement de l'appareil...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Télécommande</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Device Info Banner */}
      <View style={styles.deviceInfoBanner}>
        <View style={styles.deviceInfoContent}>
          <Text style={styles.deviceInfoName}>{device.name}</Text>
          <Text style={styles.deviceInfoAddress}>{device.ip}:{device.port}</Text>
        </View>
        <View style={[styles.statusIndicator, { backgroundColor: device.isOnline ? '#4CAF50' : '#F44336' }]}>
          <Text style={styles.statusText}>
            {device.isOnline ? 'En ligne' : 'Hors ligne'}
          </Text>
        </View>
      </View>

      {/* Status Checking Banner */}
      {isCheckingStatus && (
        <View style={styles.statusCheckingBanner}>
          <Icon name="refresh" size={16} color="#2196F3" />
          <Text style={styles.statusCheckingText}>Vérification du statut...</Text>
        </View>
      )}

      {/* Offline Warning */}
      {!device.isOnline && !isCheckingStatus && (
        <View style={styles.offlineWarning}>
          <Icon name="warning" size={20} color="#FF9800" />
          <Text style={styles.offlineText}>
            {device.isManuallyAdded 
              ? 'Appareil hors ligne - Vérifiez que l\'appareil est allumé et connecté au réseau'
              : 'Appareil non détecté - L\'appareil ne répond pas aux requêtes R_VOLUTION'
            }
          </Text>
          <TouchableOpacity 
            onPress={() => checkDeviceStatusOnEntry(device)}
            style={styles.retryButton}
          >
            <Icon name="refresh" size={16} color="#FF9800" />
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Remote Control */}
      <RemoteControl device={device} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.backgroundAlt,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.backgroundAlt,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  deviceInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundAlt,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
  },
  deviceInfoContent: {
    flex: 1,
  },
  deviceInfoName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  deviceInfoAddress: {
    fontSize: 14,
    color: colors.grey,
    fontFamily: 'monospace',
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  statusCheckingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  statusCheckingText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 8,
  },
  offlineWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9800',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  offlineText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  retryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorDescription: {
    fontSize: 16,
    color: colors.grey,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  loadingText: {
    fontSize: 16,
    color: colors.grey,
    marginTop: 12,
  },
});
