
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useDeviceDiscovery } from '../hooks/useDeviceDiscovery';
import { colors, commonStyles } from '../styles/commonStyles';
import { useFonts, Orbitron_700Bold } from '@expo-google-fonts/orbitron';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function AppSplashScreen() {
  const router = useRouter();
  const { devices } = useDeviceDiscovery();
  const [isLoading, setIsLoading] = useState(true);
  const [appIsReady, setAppIsReady] = useState(false);

  // Load the Orbitron font
  const [fontsLoaded] = useFonts({
    Orbitron_700Bold,
  });

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Splash screen: Initializing R_volution Remote app...');
        
        // Wait for fonts to load
        if (!fontsLoaded) {
          console.log('⏳ Waiting for fonts to load...');
          return;
        }
        
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
  }, [devices, router, fontsLoaded]);

  // Show loading screen while app initializes
  if (!appIsReady || !fontsLoaded) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          {/* R_Volution Brand Text with custom typography */}
          <View style={styles.brandContainer}>
            <Text style={[commonStyles.rVolutionText, styles.brandTitle]}>R_Volution</Text>
            <Text style={[commonStyles.remoteText, styles.brandSubtitle]}>Remote</Text>
          </View>
        </View>
      </View>
    );
  }

  // This should not be reached as navigation happens before appIsReady becomes true
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background, // Use the same background color as the app
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  brandContainer: {
    alignItems: 'flex-start', // Changed to align items to the left
    justifyContent: 'center',
  },
  brandTitle: {
    marginBottom: 8,
  },
  brandSubtitle: {
    alignSelf: 'flex-start', // Ensures it aligns to the left edge of the container
  },
});
