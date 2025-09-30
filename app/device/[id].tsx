
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
  const [retryCount, setRetryCount] = useState(0);

  // Find and set the device whenever devices array changes
  useEffect(() => {
    console.log(`🔍 Looking for device with ID: ${id} (retry: ${retryCount})`);
    console.log(`📱 Available devices: ${devices.length}`);
    
    // Only proceed if we have devices loaded or if we've already checked multiple times
    if (devices.length === 0 && !hasCheckedForDevice && retryCount < 3) {
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
      setRetryCount(0); // Reset retry count on success
    } else if (hasCheckedForDevice || retryCount >= 3) {
      console.log(`❌ Device with ID ${id} not found in devices list after ${retryCount} retries`);
      
      // If we have devices but not the one we're looking for, show error immediately
      if (devices.length > 0 || retryCount >= 3) {
        setIsLoading(false);
        
        // Show alert after a short delay to ensure the component is mounted
        setTimeout(() => {
          Alert.alert(
            'Appareil non trouvé', 
            'L\'appareil sélectionné n\'a pas été trouvé dans la liste. Il se peut qu\'il ait été supprimé ou qu\'il y ait eu un problème de synchronisation.',
            [
              { text: 'Réessayer', onPress: () => {
                setRetryCount(prev => prev + 1);
                setIsLoading(true);
                setHasCheckedForDevice(false);
              }},
              { text: 'Retour aux appareils', onPress: () => router.push('/add-device') }
            ]
          );
        }, 100);
      }
    }
  }, [id, devices, router, hasCheckedForDevice, retryCount]);

  // Set a timeout to stop loading if no devices are found after reasonable time
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!hasCheckedForDevice && devices.length === 0 && retryCount < 3) {
        console.log('⏰ Timeout reached, retrying device search...');
        setRetryCount(prev => prev + 1);
        setHasCheckedForDevice(true);
      }
    }, 2000); // Wait 2 seconds max for devices to load

    return () => clearTimeout(timeout);
  }, [hasCheckedForDevice, devices.length, retryCount]);

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

  const handleBackToAddDevices = () => {
    console.log('🔙 Navigating back to add devices screen');
    router.push('/add-device');
  };

  const handleRetrySearch = () => {
    console.log('🔄 Retrying device search...');
    setRetryCount(prev => prev + 1);
    setIsLoading(true);
    setHasCheckedForDevice(false);
    setDevice(null);
  };

  // Show loading state while checking for device
  if (isLoading) {
    return (
      <SafeAreaView style={commonStyles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackToAddDevices} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {retryCount > 0 ? `Recherche... (${retryCount}/3)` : 'Chargement...'}
          </Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.loadingContainer}>
          <Icon name="refresh" size={32} color={colors.primary} />
          <Text style={styles.loadingText}>
            {retryCount > 0 
              ? `Recherche de l'appareil... (tentative ${retryCount}/3)`
              : 'Chargement de l\'appareil...'
            }
          </Text>
          {retryCount > 0 && (
            <TouchableOpacity style={styles.retryButton} onPress={handleRetrySearch}>
              <Text style={styles.retryButtonText}>Réessayer maintenant</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Show error state if device not found
  if (!device) {
    return (
      <SafeAreaView style={commonStyles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackToAddDevices} style={styles.backButton}>
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
            {retryCount > 0 && ` (${retryCount} tentatives effectuées)`}
          </Text>
          <Text style={styles.errorSubText}>
            Cela peut arriver si l'appareil a été supprimé ou s'il y a eu un problème de synchronisation.
          </Text>
          
          <View style={styles.errorActions}>
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={handleRetrySearch}
            >
              <Icon name="refresh" size={16} color={colors.white} />
              <Text style={styles.retryButtonText}>Réessayer</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.backToDevicesButton} 
              onPress={handleAddDevices}
            >
              <Icon name="list" size={16} color={colors.primary} />
              <Text style={styles.backToDevicesButtonText}>Voir tous les appareils</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackToAddDevices} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{device.name}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Device Status Indicator - Only show when device is offline */}
      {!device.isOnline && (
        <View style={styles.statusContainer}>
          <View style={[styles.statusIndicator, { backgroundColor: colors.accent }]} />
          <Text style={styles.statusText}>Hors ligne</Text>
          <Text style={styles.deviceInfo}>
            {device.ip}:{device.port}
          </Text>
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
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
    height: 40,
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
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 16,
    color: colors.grey,
    marginTop: 12,
    textAlign: 'center',
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
    marginBottom: 8,
  },
  errorSubText: {
    fontSize: 14,
    color: colors.grey,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  errorActions: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  backToDevicesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  backToDevicesButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
