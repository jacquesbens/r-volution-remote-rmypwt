
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useDeviceDiscovery } from '../hooks/useDeviceDiscovery';
import { colors } from '../styles/commonStyles';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function AppSplashScreen() {
  const router = useRouter();
  const { devices } = useDeviceDiscovery();
  const [isLoading, setIsLoading] = useState(true);
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Splash screen: Initializing R_volution Remote app...');
        
        // Wait a minimum time to show the splash screen
        const minSplashTime = 2500; // 2.5 seconds to show the beautiful splash
        const startTime = Date.now();
        
        // Wait for devices to be loaded
        await new Promise(resolve => {
          const checkDevices = () => {
            // Check if devices have been loaded (either empty array or with devices)
            if (devices !== undefined) {
              console.log(`📱 Devices loaded: ${devices.length} registered devices found`);
              resolve(true);
            } else {
              setTimeout(checkDevices, 100);
            }
          };
          checkDevices();
        });
        
        // Ensure minimum splash time for better UX
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime < minSplashTime) {
          console.log(`⏱️ Waiting ${minSplashTime - elapsedTime}ms more for splash screen...`);
          await new Promise(resolve => setTimeout(resolve, minSplashTime - elapsedTime));
        }
        
        console.log(`📱 App initialization complete. Found ${devices.length} registered devices`);
        
        // Mark app as ready
        setAppIsReady(true);
        
        // Navigate based on device availability
        if (devices.length > 0) {
          // If devices exist, navigate to the first device's remote control
          const firstDevice = devices[0];
          console.log(`🎮 Navigating to remote control for: ${firstDevice.name} (${firstDevice.ip})`);
          router.replace(`/device/${firstDevice.id}`);
        } else {
          // If no devices, navigate to add device screen
          console.log('➕ No devices found, navigating to device registration screen');
          router.replace('/add-device');
        }
        
      } catch (error) {
        console.log('❌ App initialization error:', error);
        // On error, navigate to add device screen as fallback
        router.replace('/add-device');
      } finally {
        setIsLoading(false);
        // Hide the native splash screen
        await SplashScreen.hideAsync();
      }
    };

    initializeApp();
  }, [devices, router]);

  // Show loading screen while app initializes
  if (!appIsReady) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* R_volution Splash Screen Image */}
          <Image
            source={require('../assets/images/feeccb3e-8345-49bd-9e2e-d401524b7d27.png')}
            style={styles.splashImage}
            resizeMode="contain"
          />
          
          {/* Loading Indicator */}
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Initialisation...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // This should not be reached as navigation happens before appIsReady becomes true
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a2332', // Dark blue background matching the R_volution splash image
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  splashImage: {
    width: '100%',
    height: '60%',
    maxWidth: 400,
    maxHeight: 400,
    marginBottom: 60,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 120,
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 18,
    marginTop: 20,
    fontWeight: '300',
    letterSpacing: 0.5,
  },
});
