
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
  const { devices, updateDeviceStatus } = useDeviceDiscovery();
  const [device, setDevice] = useState<RVolutionDevice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCheckedForDevice, setHasCheckedForDevice] = useState(false);

  // Find and set the device whenever devices array changes
  useEffect(() => {
    console.log(`🔍 Looking for device with ID: ${id}`);
    console.log(`📱 Available devices: ${devices.length}`);
    
    // Only proceed if we have devices loaded or if we've already checked
    if (devices.length === 0 && !hasCheckedForDevice) {
      console.log('⏳ Waiting for devices to load...');
      return;
    }

    setHasCheckedForDevice(true);
    
    devices.forEach((d, index) => {
      console.log(`   ${index + 1}. ${d.name} (${d.id}) - ${d.isOnline ? 'Online' : 'Offline'}`);
    });

    const foundDevice = devices.find(d => d.id === id);
    if (foundDevice) {
      console.log(`✅ Device found: ${foundDevice.name} (${foundDevice.ip}:${foundDevice.port})`);
      setDevice(foundDevice);
      setIsLoading(false);
    } else if (hasCheckedForDevice) {
      console.log(`❌ Device with ID ${id} not found in devices list`);
      setIsLoading(false);
      
      // Show alert after a short delay to ensure the component is mounted
      setTimeout(() => {
        Alert.alert(
          'Appareil non trouvé', 
          'L\'appareil sélectionné n\'a pas été trouvé dans la liste.',
          [
            { text: 'Ajouter des appareils', onPress: () => router.push('/add-device') },
            { text: 'Retour', onPress: () => router.back() }
          ]
        );
      }, 100);
    }
  }, [id, devices, router, hasCheckedForDevice]);

  // Set a timeout to stop loading if no devices are found after reasonable time
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!hasCheckedForDevice && devices.length === 0) {
        console.log('⏰ Timeout reached, checking for device anyway');
        setHasCheckedForDevice(true);
      }
    }, 2000); // Wait 2 seconds max for devices to load

    return () => clearTimeout(timeout);
  }, [hasCheckedForDevice, devices.length]);

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

  const handleAddDevices = () => {
    console.log('➕ Navigating to add devices screen');
    router.push('/add-device');
  };

  // Show loading state while checking for device
  if (isLoading) {
    return (
      <SafeAreaView style={commonStyles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chargement...</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.loadingContainer}>
          <Icon name="refresh" size={32} color={colors.primary} />
          <Text style={styles.loadingText}>Chargement de l'appareil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state if device not found
  if (!device) {
    return (
      <SafeAreaView style={commonStyles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Erreur</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={48} color={colors.accent} />
          <Text style={styles.errorTitle}>Appareil non trouvé</Text>
          <Text style={styles.errorText}>
            L'appareil sélectionné n'a pas été trouvé dans la liste.
          </Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={handleAddDevices}
          >
            <Text style={styles.retryButtonText}>Ajouter des appareils</Text>
          </TouchableOpacity>
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
        <Text style={styles.headerTitle}>{device.name}</Text>
        <TouchableOpacity onPress={handleAddDevices} style={styles.addButton}>
          <Icon name="add" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Device Status Indicator */}
      <View style={styles.statusContainer}>
        <View style={[styles.statusIndicator, { backgroundColor: device.isOnline ? colors.success : colors.accent }]} />
        <Text style={styles.statusText}>
          {device.isOnline ? 'En ligne' : 'Hors ligne'}
        </Text>
        <Text style={styles.deviceInfo}>
          {device.ip}:{device.port}
        </Text>
      </View>

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
  addButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.backgroundAlt,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.backgroundAlt,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  deviceInfo: {
    fontSize: 12,
    color: colors.grey,
    marginLeft: 'auto',
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
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: colors.grey,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
