
import { useState, useEffect, useCallback } from 'react';
import { RVolutionDevice, NetworkScanResult } from '../types/Device';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'rvolution_devices';
const SCAN_TIMEOUT = 2000;

export const useDeviceDiscovery = () => {
  const [devices, setDevices] = useState<RVolutionDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // Load saved devices from storage
  const loadSavedDevices = useCallback(async () => {
    try {
      const savedDevices = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedDevices) {
        const parsedDevices = JSON.parse(savedDevices);
        setDevices(parsedDevices);
        console.log('Loaded saved devices:', parsedDevices);
      }
    } catch (error) {
      console.log('Error loading saved devices:', error);
    }
  }, []);

  // Save devices to storage
  const saveDevices = useCallback(async (devicesToSave: RVolutionDevice[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(devicesToSave));
      console.log('Devices saved to storage');
    } catch (error) {
      console.log('Error saving devices:', error);
    }
  }, []);

  // Check if device is reachable
  const checkDeviceReachability = async (ip: string, port: number = 8080): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), SCAN_TIMEOUT);

      const response = await fetch(`http://${ip}:${port}/status`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.log(`Device ${ip} not reachable:`, error);
      return false;
    }
  };

  // Get device info
  const getDeviceInfo = async (ip: string, port: number = 8080): Promise<string | null> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), SCAN_TIMEOUT);

      const response = await fetch(`http://${ip}:${port}/info`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        return data.name || data.deviceName || 'R_VOLUTION';
      }
    } catch (error) {
      console.log(`Error getting device info for ${ip}:`, error);
    }
    return null;
  };

  // Scan network for R_VOLUTION devices
  const scanNetwork = useCallback(async () => {
    setIsScanning(true);
    setScanProgress(0);
    
    try {
      // Get current network info (simplified for demo)
      const baseIP = '192.168.1'; // This would normally be detected from network info
      const foundDevices: RVolutionDevice[] = [];
      
      // Scan common IP range (1-254)
      const totalIPs = 254;
      
      for (let i = 1; i <= totalIPs; i++) {
        const ip = `${baseIP}.${i}`;
        setScanProgress((i / totalIPs) * 100);
        
        const isReachable = await checkDeviceReachability(ip);
        
        if (isReachable) {
          const deviceName = await getDeviceInfo(ip);
          
          if (deviceName && deviceName.includes('R_VOLUTION')) {
            const existingDevice = devices.find(d => d.ip === ip);
            
            if (!existingDevice) {
              const newDevice: RVolutionDevice = {
                id: `${ip}_${Date.now()}`,
                name: deviceName,
                ip: ip,
                port: 8080,
                isOnline: true,
                lastSeen: new Date(),
                isManuallyAdded: false,
              };
              
              foundDevices.push(newDevice);
              console.log('Found R_VOLUTION device:', newDevice);
            }
          }
        }
      }
      
      if (foundDevices.length > 0) {
        const updatedDevices = [...devices, ...foundDevices];
        setDevices(updatedDevices);
        await saveDevices(updatedDevices);
      }
      
    } catch (error) {
      console.log('Error during network scan:', error);
    } finally {
      setIsScanning(false);
      setScanProgress(0);
    }
  }, [devices, saveDevices]);

  // Add device manually
  const addDeviceManually = useCallback(async (ip: string, port: number = 8080, customName?: string) => {
    try {
      const isReachable = await checkDeviceReachability(ip, port);
      
      if (!isReachable) {
        throw new Error('Device not reachable at this IP address');
      }
      
      const deviceName = customName || await getDeviceInfo(ip, port) || 'R_VOLUTION Device';
      
      const newDevice: RVolutionDevice = {
        id: `${ip}_${Date.now()}`,
        name: deviceName,
        ip: ip,
        port: port,
        isOnline: true,
        lastSeen: new Date(),
        isManuallyAdded: true,
      };
      
      const updatedDevices = [...devices, newDevice];
      setDevices(updatedDevices);
      await saveDevices(updatedDevices);
      
      console.log('Manually added device:', newDevice);
      return newDevice;
    } catch (error) {
      console.log('Error adding device manually:', error);
      throw error;
    }
  }, [devices, saveDevices]);

  // Remove device
  const removeDevice = useCallback(async (deviceId: string) => {
    const updatedDevices = devices.filter(d => d.id !== deviceId);
    setDevices(updatedDevices);
    await saveDevices(updatedDevices);
    console.log('Device removed:', deviceId);
  }, [devices, saveDevices]);

  // Update device status
  const updateDeviceStatus = useCallback(async () => {
    const updatedDevices = await Promise.all(
      devices.map(async (device) => {
        const isOnline = await checkDeviceReachability(device.ip, device.port);
        return {
          ...device,
          isOnline,
          lastSeen: isOnline ? new Date() : device.lastSeen,
        };
      })
    );
    
    setDevices(updatedDevices);
    await saveDevices(updatedDevices);
  }, [devices, saveDevices]);

  useEffect(() => {
    loadSavedDevices();
  }, [loadSavedDevices]);

  return {
    devices,
    isScanning,
    scanProgress,
    scanNetwork,
    addDeviceManually,
    removeDevice,
    updateDeviceStatus,
  };
};
