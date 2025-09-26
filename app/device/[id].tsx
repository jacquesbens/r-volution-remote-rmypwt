
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
  const { devices, updateDeviceStatus, checkDeviceReachability } = useDeviceDiscovery();
  const [device, setDevice] = useState<RVolutionDevice | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  useEffect(() => {
    const foundDevice = devices.find(d => d.id === id);
    if (foundDevice) {
      setDevice(foundDevice);
      
      // Force a status check when entering the device control screen
      checkDeviceStatusOnEntry(foundDevice);
    } else {
      Alert.alert('Erreur', 'Appareil non trouvé', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
  }, [id, devices, router]);

  // Check device status when entering the screen
  const checkDeviceStatusOnEntry = async (deviceToCheck: RVolutionDevice) => {
    console.log(`🔄 Checking device status on entry for ${deviceToCheck.name}`);
    setIsCheckingStatus(true);
    
    try {
      let isOnline = false;
      
      if (deviceToCheck.isManuallyAdded) {
        // For manually added devices, use basic connectivity check
        console.log(`   📱 Manual device - checking basic connectivity`);
        isOnline = await checkDeviceReachability(deviceToCheck.ip, deviceToCheck.port, 1);
      } else {
        // For auto-discovered devices, run full status update
        console.log(`   🤖 Auto-discovered device - running full status update`);
        await updateDeviceStatus();
        return; // updateDeviceStatus will update the devices state
      }
      
      // Update the device status in the devices array
      const updatedDevices = devices.map(d => 
        d.id === deviceToCheck.id 
          ? { ...d, isOnline, lastSeen: isOnline ? new Date() : d.lastSeen }
          : d
      );
      
      // Find the updated device
      const updatedDevice = updatedDevices.find(d => d.id === deviceToCheck.id);
      if (updatedDevice) {
        setDevice(updatedDevice);
      }
      
      console.log(`✅ Device status check complete: ${deviceToCheck.name} is ${isOnline ? 'online' : 'offline'}`);
      
    } catch (error) {
      console.log(`❌ Device status check failed:`, error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  useEffect(() => {
    // Update device status every 30 seconds
    const interval = setInterval(() => {
      updateDeviceStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, [updateDeviceStatus]);

  if (!device) {
    return (
      <SafeAreaView style={commonStyles.container}>
        <View style={commonStyles.content}>
          <Text style={commonStyles.text}>Chargement...</Text>
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

      {isCheckingStatus && (
        <View style={styles.statusCheckingBanner}>
          <Icon name="refresh" size={16} color="#2196F3" />
          <Text style={styles.statusCheckingText}>Vérification du statut...</Text>
        </View>
      )}

      {!device.isOnline && !isCheckingStatus && (
        <View style={styles.offlineWarning}>
          <Icon name="warning" size={20} color="#FF9800" />
          <Text style={styles.offlineText}>Appareil hors ligne</Text>
          <TouchableOpacity 
            onPress={() => checkDeviceStatusOnEntry(device)}
            style={styles.retryButton}
          >
            <Icon name="refresh" size={16} color="#FF9800" />
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      )}

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
  statusCheckingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 16,
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
    justifyContent: 'center',
    backgroundColor: '#FF9800',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
  },
  offlineText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  retryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
});
