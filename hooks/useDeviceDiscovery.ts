
import { useState, useEffect, useCallback } from 'react';
import { RVolutionDevice, NetworkScanResult } from '../types/Device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEY = 'rvolution_devices';
const SCAN_TIMEOUT = 2000; // Reduced timeout for faster scanning
const TARGET_DEVICE_NAME = 'R_VOLUTION';
const CONCURRENT_REQUESTS = 20; // Number of parallel requests

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

  // Get network base IP (simplified detection)
  const getNetworkBaseIPs = (): string[] => {
    // Common network ranges to scan
    return [
      '192.168.1',    // Most common home router range
      '192.168.0',    // Alternative common range
      '10.0.0',       // Some routers use this
      '172.16.0',     // Less common but possible
      '192.168.2',    // Some ISP routers
    ];
  };

  // Check if device is reachable and is R_VOLUTION
  const checkRVolutionDevice = async (ip: string, port: number = 80): Promise<{ isRVolution: boolean; deviceName?: string }> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), SCAN_TIMEOUT);

      // Try multiple common endpoints that R_VOLUTION devices might use
      const endpoints = ['/info', '/status', '/device', '/api/info', '/'];
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`http://${ip}:${port}${endpoint}`, {
            method: 'GET',
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json, text/plain, */*',
            },
          });

          if (response.ok) {
            const contentType = response.headers.get('content-type');
            let responseData: any = null;
            let responseText = '';

            try {
              if (contentType && contentType.includes('application/json')) {
                responseData = await response.json();
                responseText = JSON.stringify(responseData);
              } else {
                responseText = await response.text();
              }
            } catch (parseError) {
              console.log(`Parse error for ${ip}${endpoint}:`, parseError);
              continue;
            }

            // Check if response contains R_VOLUTION identifier
            const isRVolution = responseText.includes('R_VOLUTION') || 
                               responseText.includes('R-VOLUTION') ||
                               responseText.includes('RVOLUTION') ||
                               (responseData && (
                                 responseData.name?.includes('R_VOLUTION') ||
                                 responseData.deviceName?.includes('R_VOLUTION') ||
                                 responseData.model?.includes('R_VOLUTION') ||
                                 responseData.hostname?.includes('R_VOLUTION')
                               ));

            if (isRVolution) {
              clearTimeout(timeoutId);
              const deviceName = responseData?.name || responseData?.deviceName || responseData?.hostname || TARGET_DEVICE_NAME;
              console.log(`✅ Found R_VOLUTION device at ${ip}:${port}${endpoint} - Name: ${deviceName}`);
              return { isRVolution: true, deviceName };
            }
          }
        } catch (endpointError) {
          // Silently continue to next endpoint
        }
      }

      clearTimeout(timeoutId);
      return { isRVolution: false };
    } catch (error) {
      return { isRVolution: false };
    }
  };

  // Scan a batch of IPs concurrently
  const scanIPBatch = async (baseIP: string, startRange: number, endRange: number): Promise<RVolutionDevice[]> => {
    const promises: Promise<RVolutionDevice | null>[] = [];
    
    for (let i = startRange; i <= endRange; i++) {
      const ip = `${baseIP}.${i}`;
      
      const promise = checkRVolutionDevice(ip, 80).then(async (result) => {
        if (result.isRVolution) {
          // Check if device already exists
          const existingDevice = devices.find(d => d.ip === ip);
          if (!existingDevice) {
            return {
              id: `auto_${ip}_${Date.now()}`,
              name: result.deviceName || TARGET_DEVICE_NAME,
              ip: ip,
              port: 80,
              isOnline: true,
              lastSeen: new Date(),
              isManuallyAdded: false,
            };
          }
        }
        return null;
      }).catch(() => null);
      
      promises.push(promise);
    }
    
    const results = await Promise.all(promises);
    return results.filter((device): device is RVolutionDevice => device !== null);
  };

  // Scan network for R_VOLUTION devices with improved parallel processing
  const scanNetwork = useCallback(async () => {
    setIsScanning(true);
    setScanProgress(0);
    
    try {
      console.log(`🔍 Starting enhanced network scan for ${TARGET_DEVICE_NAME} devices...`);
      
      const networkBases = getNetworkBaseIPs();
      const foundDevices: RVolutionDevice[] = [];
      let totalProgress = 0;
      const totalNetworks = networkBases.length;
      
      // Scan each network base concurrently
      for (let networkIndex = 0; networkIndex < networkBases.length; networkIndex++) {
        const baseIP = networkBases[networkIndex];
        console.log(`📡 Scanning network ${baseIP}.x (${networkIndex + 1}/${totalNetworks})`);
        
        // Scan in smaller batches for better performance and progress tracking
        const batchSize = 25; // Scan 25 IPs at a time
        const networkDevices: RVolutionDevice[] = [];
        
        for (let start = 1; start <= 254; start += batchSize) {
          const end = Math.min(start + batchSize - 1, 254);
          
          console.log(`🔎 Scanning ${baseIP}.${start}-${end}`);
          
          try {
            const batchDevices = await scanIPBatch(baseIP, start, end);
            networkDevices.push(...batchDevices);
            
            if (batchDevices.length > 0) {
              console.log(`✅ Found ${batchDevices.length} R_VOLUTION devices in batch ${baseIP}.${start}-${end}`);
              batchDevices.forEach(device => {
                console.log(`   - ${device.name} at ${device.ip}:${device.port}`);
              });
            }
          } catch (batchError) {
            console.log(`❌ Error scanning batch ${baseIP}.${start}-${end}:`, batchError);
          }
          
          // Update progress
          const networkProgress = ((end / 254) * 100) / totalNetworks;
          const baseProgress = (networkIndex / totalNetworks) * 100;
          totalProgress = baseProgress + networkProgress;
          setScanProgress(Math.round(totalProgress));
        }
        
        foundDevices.push(...networkDevices);
        console.log(`📊 Network ${baseIP}.x scan complete. Found ${networkDevices.length} devices.`);
      }
      
      // Update device list if we found new devices
      if (foundDevices.length > 0) {
        const updatedDevices = [...devices, ...foundDevices];
        setDevices(updatedDevices);
        await saveDevices(updatedDevices);
        console.log(`🎉 Network scan completed successfully! Found ${foundDevices.length} new R_VOLUTION devices:`);
        foundDevices.forEach((device, index) => {
          console.log(`   ${index + 1}. ${device.name} at ${device.ip}:${device.port}`);
        });
      } else {
        console.log(`🔍 Network scan completed. No new R_VOLUTION devices found.`);
        console.log(`💡 Troubleshooting tips:`);
        console.log(`   - Ensure R_VOLUTION devices are powered on and connected to Wi-Fi`);
        console.log(`   - Check that devices are on the same network as this mobile device`);
        console.log(`   - Verify that R_VOLUTION devices are using port 80`);
        console.log(`   - Try manual addition if you know the device IP address`);
      }
      
    } catch (error) {
      console.log('❌ Error during network scan:', error);
    } finally {
      setIsScanning(false);
      setScanProgress(0);
    }
  }, [devices, saveDevices]);

  // Add device manually with optional verification
  const addDeviceManually = useCallback(async (ip: string, port: number = 80, customName?: string) => {
    console.log(`📱 Manual device addition started`);
    console.log(`   IP: ${ip}, Port: ${port}, Custom Name: ${customName}`);
    
    try {
      // Validate IP format
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!ipRegex.test(ip)) {
        throw new Error('Format d\'adresse IP invalide. Utilisez le format: 192.168.1.100');
      }

      // Check if device already exists
      const existingDevice = devices.find(d => d.ip === ip && d.port === port);
      if (existingDevice) {
        console.log('❌ Device already exists:', existingDevice);
        throw new Error('Cet appareil est déjà dans la liste');
      }

      // Try to verify the device first (optional, non-blocking)
      let deviceName = customName || `${TARGET_DEVICE_NAME} (${ip})`;
      let isVerified = false;
      
      console.log(`🔍 Attempting to verify device at ${ip}:${port}...`);
      
      try {
        const verificationResult = await checkRVolutionDevice(ip, port);
        if (verificationResult.isRVolution) {
          isVerified = true;
          deviceName = verificationResult.deviceName || deviceName;
          console.log(`✅ Device verified as R_VOLUTION: ${deviceName}`);
        } else {
          console.log(`⚠️  Device not verified as R_VOLUTION, but adding anyway (manual addition)`);
        }
      } catch (verificationError) {
        console.log(`⚠️  Verification failed, but adding anyway (manual addition):`, verificationError);
      }
      
      const newDevice: RVolutionDevice = {
        id: `manual_${ip}_${port}_${Date.now()}`,
        name: deviceName,
        ip: ip,
        port: port,
        isOnline: isVerified, // Set based on verification result
        lastSeen: new Date(),
        isManuallyAdded: true,
      };
      
      console.log(`📝 Creating new device:`, {
        name: newDevice.name,
        ip: newDevice.ip,
        port: newDevice.port,
        verified: isVerified
      });
      
      const updatedDevices = [...devices, newDevice];
      setDevices(updatedDevices);
      await saveDevices(updatedDevices);
      
      console.log(`✅ Manual device addition completed successfully!`);
      return newDevice;
    } catch (error) {
      console.log(`❌ Manual device addition failed:`, error);
      throw error;
    }
  }, [devices, saveDevices]);

  // Remove device
  const removeDevice = useCallback(async (deviceId: string) => {
    console.log('Removing device:', deviceId);
    const updatedDevices = devices.filter(d => d.id !== deviceId);
    setDevices(updatedDevices);
    await saveDevices(updatedDevices);
    console.log('Device removed successfully');
  }, [devices, saveDevices]);

  // Update device status with improved checking
  const updateDeviceStatus = useCallback(async () => {
    if (devices.length === 0) {
      console.log('📊 No devices to update status for');
      return;
    }
    
    console.log(`📊 Updating status for ${devices.length} devices...`);
    
    const updatedDevices = await Promise.all(
      devices.map(async (device) => {
        try {
          const result = await checkRVolutionDevice(device.ip, device.port);
          const isOnline = result.isRVolution;
          
          if (isOnline) {
            console.log(`✅ ${device.name} (${device.ip}) is online`);
          } else {
            console.log(`❌ ${device.name} (${device.ip}) is offline`);
          }
          
          return {
            ...device,
            isOnline,
            lastSeen: isOnline ? new Date() : device.lastSeen,
            name: result.deviceName || device.name, // Update name if we got a better one
          };
        } catch (error) {
          console.log(`❌ ${device.name} (${device.ip}) status check failed:`, error);
          return {
            ...device,
            isOnline: false,
          };
        }
      })
    );
    
    setDevices(updatedDevices);
    await saveDevices(updatedDevices);
    
    const onlineCount = updatedDevices.filter(d => d.isOnline).length;
    console.log(`📊 Device status update completed: ${onlineCount}/${updatedDevices.length} devices online`);
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
