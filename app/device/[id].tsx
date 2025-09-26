
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
    } else {
      console.log(`❌ Device with ID ${id} not found in devices list`);
      
      // Show alert after a short delay to ensure the component is mounted
      setTimeout(() => {
        Alert.alert(
          'Appareil non trouvé', 
          'L\'appareil sélectionné n\'a pas été trouvé dans la liste.',
          [
            { text: 'Retour', onPress: () => router.back() }
          ]
        );
      }, 100);
    }
  }, [id, devices, router]);

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
  if (!device) {
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{device.name}</Text>
        <View style={styles.placeholder} />
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  placeholder: {
    width: 40,
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
