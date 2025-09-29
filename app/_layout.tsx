
import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack, useGlobalSearchParams } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { setupErrorLogging } from '../utils/errorLogger';

const STORAGE_KEY = 'natively_emulate_mobile';

export default function RootLayout() {
  const { emulate } = useGlobalSearchParams();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setupErrorLogging();
        console.log('🚀 App initialization complete');
        setIsReady(true);
      } catch (error) {
        console.error('❌ Error during app initialization:', error);
        setIsReady(true); // Still set ready to prevent infinite loading
      }
    };

    initializeApp();
  }, []);

  // Don't render the Stack until the app is ready
  if (!isReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen 
            name="index" 
            options={{
              headerShown: false,
              gestureEnabled: false,
            }}
          />
          <Stack.Screen 
            name="add-device" 
            options={{
              headerShown: false,
              animation: 'fade',
            }}
          />
          <Stack.Screen 
            name="device/[id]" 
            options={{
              presentation: 'card',
              animation: 'slide_from_right',
            }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
