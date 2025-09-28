
import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useDeviceDiscovery } from '../hooks/useDeviceDiscovery';

export default function Index() {
  const router = useRouter();
  const { devices } = useDeviceDiscovery();

  useEffect(() => {
    if (devices !== undefined) {
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
  }, [devices, router]);

  // Return null since we're immediately redirecting
  return null;
}
