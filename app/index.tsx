
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useDeviceDiscovery } from '../hooks/useDeviceDiscovery';

// Prevent the splash screen from auto-hiding before Asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function AppSplashScreen() {
  const router = useRouter();
  const { devices } = useDeviceDiscovery();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        console.log('🚀 Initializing R_Volution Remote app...');
        
        // Force splash screen to show for exactly 3 seconds
        const splashStartTime = Date.now();
        const minSplashDuration = 3000; // 3 seconds
        
        // Wait for devices to load
        let devicesLoaded = false;
        while (!devicesLoaded) {
          if (devices !== undefined) {
            devicesLoaded = true;
            console.log(`📱 Devices loaded: ${devices.length} registered devices found`);
          } else {
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }
        
        // Ensure minimum splash duration
        const elapsedTime = Date.now() - splashStartTime;
        if (elapsedTime < minSplashDuration) {
          const remainingTime = minSplashDuration - elapsedTime;
          console.log(`⏱️ Showing splash screen for ${remainingTime}ms more...`);
          await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
        
        console.log(`✅ Splash screen completed after ${Date.now() - splashStartTime}ms`);
        
      } catch (e) {
        console.warn('❌ Error during app initialization:', e);
      } finally {
        // Tell the application to render
        setIsReady(true);
      }
    }

    prepare();
  }, [devices]);

  useEffect(() => {
    if (isReady) {
      const navigateToApp = async () => {
        try {
          // Hide the native splash screen
          await SplashScreen.hideAsync();
          
          // Navigate based on device availability
          if (devices && devices.length > 0) {
            const firstDevice = devices[0];
            console.log(`🎮 Navigating to remote control for: ${firstDevice.name} (${firstDevice.ip})`);
            router.replace(`/device/${firstDevice.id}`);
          } else {
            console.log('➕ No devices found, navigating to device registration screen');
            router.replace('/add-device');
          }
        } catch (error) {
          console.error('❌ Navigation error:', error);
          router.replace('/add-device');
        }
      };

      navigateToApp();
    }
  }, [isReady, devices, router]);

  return (
    <View style={styles.container}>
      <Image 
        source={require('../assets/images/167869d5-9c4d-490f-ae3a-6a8528fe7003.png')} 
        style={styles.image} 
      />
      <Text style={styles.rVolutionText}>R_Volution</Text>
      <Text style={styles.remoteText}>Remote</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a2332',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  rVolutionText: {
    color: 'white',
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 2,
    textAlign: 'left',
    marginBottom: 8,
  },
  remoteText: {
    color: 'white',
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 2,
    textAlign: 'left',
    alignSelf: 'flex-start',
    marginLeft: 0,
  },
});
