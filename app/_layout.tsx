
import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack, useGlobalSearchParams } from 'expo-router';
import { SafeAreaProvider, useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { setupErrorLogging } from '../utils/errorLogger';

const STORAGE_KEY = 'natively_emulate_mobile';

export default function RootLayout() {
  const { emulate } = useGlobalSearchParams();
  const insets = useSafeAreaInsets();
  const [isMobileEmulation, setIsMobileEmulation] = useState(false);

  useEffect(() => {
    setupErrorLogging();
  }, []);

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
              gestureEnabled: false, // Disable swipe back on splash screen
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
