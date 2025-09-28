
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useDeviceDiscovery } from '../hooks/useDeviceDiscovery';
import { colors } from '../styles/commonStyles';

export default function Index() {
  const router = useRouter();
  const { devices } = useDeviceDiscovery();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    // Add a small delay to ensure the layout is fully mounted
    const timer = setTimeout(() => {
      if (devices !== undefined && !isNavigating) {
        setIsNavigating(true);
        console.log(`📱 ${devices.length} registered devices found`);
        
        if (devices.length > 0) {
          const firstDevice = devices[0];
          console.log(`🎮 Navigating to remote control for: ${firstDevice.name} (${firstDevice.ip})`);
          router.replace(`/device/${firstDevice.id}`);
        } else {
          console.log('➕ No devices found, navigating to device registration screen');
          router.replace('/add-device');
        }
      }
    }, 100); // Small delay to ensure layout is mounted

    return () => clearTimeout(timer);
  }, [devices, router, isNavigating]);

  // Show a loading screen while determining navigation
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>Initialisation...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
});
