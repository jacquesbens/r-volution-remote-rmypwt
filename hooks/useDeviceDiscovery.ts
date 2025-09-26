
import { useState, useEffect, useCallback } from 'react';
import { RVolutionDevice, NetworkScanResult } from '../types/Device';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'rvolution_devices';
const SCAN_TIMEOUT = 3000; // Increased timeout for better reliability
const TARGET_DEVICE_NAME = 'R_VOLUTION';

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

  // Check if device is reachable and has the correct name
  const checkDeviceReachability = async (ip: string, port: number = 80): Promise<boolean> => {
    try {
      console.log(`Checking reachability for ${ip}:${port}`);
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
      console.log(`Device ${ip}:${port} reachability check result: ${response.ok}`);
      return response.ok;
    } catch (error) {
      console.log(`Device ${ip}:${port} not reachable:`, error);
      return false;
    }
  };

  // Get device info and verify it's an R_VOLUTION device
  const getDeviceInfo = async (ip: string, port: number = 80): Promise<string | null> => {
    try {
      console.log(`Getting device info for ${ip}:${port}`);
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
        const deviceName = data.name || data.deviceName || data.hostname || '';
        
        console.log(`Device info response for ${ip}:${port}:`, data);
        
        // Check if the device name matches our target device name
        if (deviceName === TARGET_DEVICE_NAME || deviceName.includes(TARGET_DEVICE_NAME)) {
          console.log(`Found R_VOLUTION device at ${ip}: ${deviceName}`);
          return deviceName;
        } else {
          console.log(`Device at ${ip} is not R_VOLUTION: ${deviceName}`);
          return null;
        }
      }
    } catch (error) {
      console.log(`Error getting device info for ${ip}:`, error);
    }
    return null;
  };

  // Alternative method to check device by trying to connect and verify response
  const verifyRVolutionDevice = async (ip: string, port: number = 80): Promise<boolean> => {
    try {
      console.log(`Verifying R_VOLUTION device at ${ip}:${port}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), SCAN_TIMEOUT);

      // Try multiple endpoints that R_VOLUTION devices might respond to
      const endpoints = ['/info', '/status', '/device', '/'];
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying endpoint ${endpoint} for ${ip}:${port}`);
          const response = await fetch(`http://${ip}:${port}${endpoint}`, {
            method: 'GET',
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const text = await response.text();
            console.log(`Response from ${ip}${endpoint}:`, text.substring(0, 200));
            
            // Check if response contains R_VOLUTION identifier
            if (text.includes('R_VOLUTION') || text.includes('R-VOLUTION')) {
              console.log(`Verified R_VOLUTION device at ${ip}${endpoint}`);
              clearTimeout(timeoutId);
              return true;
            }
          }
        } catch (endpointError) {
          console.log(`Endpoint ${endpoint} failed for ${ip}:`, endpointError);
        }
      }

      clearTimeout(timeoutId);
      return false;
    } catch (error) {
      console.log(`Error verifying R_VOLUTION device at ${ip}:`, error);
      return false;
    }
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
      
      console.log(`Starting network scan for ${TARGET_DEVICE_NAME} devices...`);
      
      for (let i = 1; i <= totalIPs; i++) {
        const ip = `${baseIP}.${i}`;
        setScanProgress((i / totalIPs) * 100);
        
        // First check if device is reachable
        const isReachable = await checkDeviceReachability(ip);
        
        if (isReachable) {
          console.log(`Device found at ${ip}, checking if it's R_VOLUTION...`);
          
          // Try to get device info first
          let deviceName = await getDeviceInfo(ip);
          
          // If device info doesn't work, try verification method
          if (!deviceName) {
            const isRVolution = await verifyRVolutionDevice(ip);
            if (isRVolution) {
              deviceName = TARGET_DEVICE_NAME;
            }
          }
          
          if (deviceName) {
            const existingDevice = devices.find(d => d.ip === ip);
            
            if (!existingDevice) {
              const newDevice: RVolutionDevice = {
                id: `${ip}_${Date.now()}`,
                name: deviceName,
                ip: ip,
                port: 80,
                isOnline: true,
                lastSeen: new Date(),
                isManuallyAdded: false,
              };
              
              foundDevices.push(newDevice);
              console.log('Found and verified R_VOLUTION device:', newDevice);
            } else {
              console.log(`R_VOLUTION device at ${ip} already exists in list`);
            }
          }
        }
      }
      
      if (foundDevices.length > 0) {
        const updatedDevices = [...devices, ...foundDevices];
        setDevices(updatedDevices);
        await saveDevices(updatedDevices);
        console.log(`Network scan completed. Found ${foundDevices.length} new R_VOLUTION devices.`);
      } else {
        console.log('Network scan completed. No new R_VOLUTION devices found.');
      }
      
    } catch (error) {
      console.log('Error during network scan:', error);
    } finally {
      setIsScanning(false);
      setScanProgress(0);
    }
  }, [devices, saveDevices]);

  // Add device manually
  const addDeviceManually = useCallback(async (ip: string, port: number = 80, customName?: string) => {
    console.log(`=== MANUAL DEVICE ADDITION STARTED ===`);
    console.log(`IP: ${ip}, Port: ${port}, Custom Name: ${customName}`);
    
    try {
      // Check if device already exists
      const existingDevice = devices.find(d => d.ip === ip && d.port === port);
      if (existingDevice) {
        console.log('Device already exists:', existingDevice);
        throw new Error('Cet appareil R_VOLUTION est déjà dans la liste');
      }

      console.log(`Checking reachability for manual addition: ${ip}:${port}`);
      const isReachable = await checkDeviceReachability(ip, port);
      
      if (!isReachable) {
        console.log(`Manual addition failed: Device not reachable at ${ip}:${port}`);
        throw new Error(`Appareil R_VOLUTION non accessible à l'adresse ${ip}:${port}. Vérifiez que l'appareil est allumé et connecté au réseau.`);
      }
      
      console.log(`Device is reachable, attempting to verify R_VOLUTION device...`);
      
      // Try to verify it's an R_VOLUTION device
      let deviceName = customName;
      
      if (!deviceName) {
        console.log('No custom name provided, trying to get device info...');
        deviceName = await getDeviceInfo(ip, port);
        
        // If we can't get device info, try verification
        if (!deviceName) {
          console.log('Device info failed, trying verification method...');
          const isRVolution = await verifyRVolutionDevice(ip, port);
          if (isRVolution) {
            deviceName = TARGET_DEVICE_NAME;
            console.log('Device verified as R_VOLUTION through verification method');
          } else {
            // Allow manual addition even if we can't verify, but warn the user
            deviceName = `${TARGET_DEVICE_NAME} (Manuel)`;
            console.log(`Warning: Could not verify device at ${ip}:${port} as R_VOLUTION, adding manually anyway`);
          }
        }
      }
      
      const newDevice: RVolutionDevice = {
        id: `manual_${ip}_${port}_${Date.now()}`,
        name: deviceName || `${TARGET_DEVICE_NAME} (Manuel)`,
        ip: ip,
        port: port,
        isOnline: true,
        lastSeen: new Date(),
        isManuallyAdded: true,
      };
      
      console.log('Creating new device:', newDevice);
      
      const updatedDevices = [...devices, newDevice];
      setDevices(updatedDevices);
      await saveDevices(updatedDevices);
      
      console.log('=== MANUAL DEVICE ADDITION COMPLETED SUCCESSFULLY ===');
      console.log('Device added:', newDevice);
      return newDevice;
    } catch (error) {
      console.log('=== MANUAL DEVICE ADDITION FAILED ===');
      console.log('Error details:', error);
      throw error;
    }
  }, [devices, saveDevices, checkDeviceReachability, getDeviceInfo, verifyRVolutionDevice]);

  // Remove device
  const removeDevice = useCallback(async (deviceId: string) => {
    console.log('Removing device:', deviceId);
    const updatedDevices = devices.filter(d => d.id !== deviceId);
    setDevices(updatedDevices);
    await saveDevices(updatedDevices);
    console.log('Device removed successfully');
  }, [devices, saveDevices]);

  // Update device status
  const updateDeviceStatus = useCallback(async () => {
    console.log('Updating device status for all devices...');
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
    console.log('Device status update completed');
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
