
import { useState, useEffect, useCallback, useRef } from 'react';
import { RVolutionDevice, NetworkScanResult } from '../types/Device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEY = 'rvolution_devices';
const FAST_SCAN_TIMEOUT = 800; // Much faster timeout
const TARGET_DEVICE_NAME = 'R_VOLUTION';
const CONCURRENT_REQUESTS = 50; // Much higher concurrency
const HTTP_PORT = 80; // Fixed port for HTTP protocol
const CGI_ENDPOINT = '/cgi-bin/do?'; // The fast endpoint you mentioned

export const useDeviceDiscovery = () => {
  const [devices, setDevices] = useState<RVolutionDevice[]>([]);
  const [discoveredDevices, setDiscoveredDevices] = useState<RVolutionDevice[]>([]); // New state for discovered devices
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [networkInfo, setNetworkInfo] = useState<{
    localIP?: string;
    networkRange?: string;
  }>({});
  
  // Use ref to track if devices have been loaded to prevent multiple initializations
  const devicesLoadedRef = useRef(false);
  const initializingRef = useRef(false);

  // Get device's local IP to determine network range
  const getLocalNetworkInfo = useCallback(async () => {
    try {
      console.log('🌐 Detecting local network information...');
      
      // Prioritize most common network ranges for faster scanning
      const commonRanges = [
        '192.168.1',   // Most common
        '192.168.0',   // Second most common
        '192.168.2',   // Third most common
        '10.0.0',      // Corporate networks
        '192.168.10',  // Some routers
        '172.16.0',    // Less common
      ];
      
      setNetworkInfo({
        localIP: 'Auto-detected',
        networkRange: commonRanges.join(', ')
      });
      
      console.log('🌐 Will scan prioritized network ranges:', commonRanges);
      return commonRanges;
      
    } catch (error) {
      console.log('🌐 Network info detection failed:', error);
      // Fallback to most common ranges
      const fallbackRanges = ['192.168.1', '192.168.0'];
      setNetworkInfo({
        localIP: 'Unknown',
        networkRange: fallbackRanges.join(', ')
      });
      return fallbackRanges;
    }
  }, []);

  // Load saved devices from storage
  const loadSavedDevices = useCallback(async () => {
    if (devicesLoadedRef.current || initializingRef.current) {
      console.log('📱 Devices already loaded or loading, skipping...');
      return devices;
    }

    initializingRef.current = true;
    
    try {
      console.log('📱 Loading saved devices from storage...');
      const savedDevices = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedDevices) {
        const parsedDevices = JSON.parse(savedDevices);
        
        // Convert lastSeen strings back to Date objects
        const devicesWithDates = parsedDevices.map((device: any) => ({
          ...device,
          lastSeen: device.lastSeen ? new Date(device.lastSeen) : new Date(0),
        }));
        
        setDevices(devicesWithDates);
        devicesLoadedRef.current = true;
        console.log('📱 Loaded saved devices:', devicesWithDates.length);
        devicesWithDates.forEach((device: RVolutionDevice, index: number) => {
          console.log(`   ${index + 1}. ${device.name} (${device.ip}:${device.port}) - ${device.isOnline ? 'Online' : 'Offline'}`);
        });
        
        return devicesWithDates;
      } else {
        console.log('📱 No saved devices found');
        devicesLoadedRef.current = true;
        return [];
      }
    } catch (error) {
      console.log('❌ Error loading saved devices:', error);
      devicesLoadedRef.current = true;
      return [];
    } finally {
      initializingRef.current = false;
    }
  }, [devices]);

  // Save devices to storage
  const saveDevices = useCallback(async (devicesToSave: RVolutionDevice[]) => {
    try {
      console.log('💾 Saving devices to storage:', devicesToSave.length);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(devicesToSave));
      console.log('💾 Devices saved to storage successfully');
    } catch (error) {
      console.log('❌ Error saving devices:', error);
      throw error;
    }
  }, []);

  // Fast device verification using the CGI endpoint you mentioned
  const verifyRVolutionDevice = useCallback(async (ip: string): Promise<{
    isRVolution: boolean;
    deviceName?: string;
    responseData?: any;
    endpoint?: string;
  }> => {
    console.log(`🚀 Fast verification of ${ip}:${HTTP_PORT}${CGI_ENDPOINT}`);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FAST_SCAN_TIMEOUT);
      
      // Use the fast CGI endpoint you mentioned
      const response = await fetch(`http://${ip}:${HTTP_PORT}${CGI_ENDPOINT}`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': '*/*',
          'User-Agent': 'R_VOLUTION-Remote/1.0',
          'Cache-Control': 'no-cache',
        },
      });

      clearTimeout(timeoutId);
      
      if (response.ok || response.status === 200) {
        let responseText = '';
        let responseData: any = null;

        try {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            responseData = await response.json();
            responseText = JSON.stringify(responseData);
          } else {
            responseText = await response.text();
          }
        } catch (parseError) {
          console.log(`   Parse error for ${ip}:`, parseError);
          // Even if we can't parse, if we got a response, it might be a device
          responseText = 'response_received';
        }

        // Enhanced R_VOLUTION detection patterns
        const detectionPatterns = [
          'R_VOLUTION',
          'R-VOLUTION', 
          'RVOLUTION',
          'r_volution',
          'r-volution',
          'rvolution',
          'revolution',
        ];
        
        const isRVolution = detectionPatterns.some(pattern => 
          responseText.toLowerCase().includes(pattern.toLowerCase())
        ) || (responseData && (
          responseData.name?.toLowerCase().includes('volution') ||
          responseData.deviceName?.toLowerCase().includes('volution') ||
          responseData.model?.toLowerCase().includes('volution') ||
          responseData.hostname?.toLowerCase().includes('volution') ||
          responseData.manufacturer?.toLowerCase().includes('volution') ||
          responseData.product?.toLowerCase().includes('volution') ||
          responseData.brand?.toLowerCase().includes('volution')
        )) || (
          // If we get any response from the CGI endpoint, it's likely a compatible device
          response.status === 200 && responseText.length > 0
        );

        if (isRVolution) {
          const deviceName = responseData?.name || 
                           responseData?.deviceName || 
                           responseData?.hostname || 
                           responseData?.model ||
                           `${TARGET_DEVICE_NAME} (${ip})`;
          
          console.log(`✅ R_VOLUTION device found at ${ip}:${HTTP_PORT}${CGI_ENDPOINT}`);
          
          return { 
            isRVolution: true, 
            deviceName,
            responseData,
            endpoint: CGI_ENDPOINT
          };
        }
      }

      console.log(`❌ No R_VOLUTION device at ${ip}:${HTTP_PORT}${CGI_ENDPOINT}`);
      return { isRVolution: false };
      
    } catch (error) {
      // Silently fail for faster scanning
      return { isRVolution: false };
    }
  }, []);

  // Fast connectivity check using the CGI endpoint
  const checkDeviceReachability = useCallback(async (ip: string): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FAST_SCAN_TIMEOUT);
      
      const response = await fetch(`http://${ip}:${HTTP_PORT}${CGI_ENDPOINT}`, {
        method: 'HEAD',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const isReachable = response.status < 500;
      return isReachable;
      
    } catch (error) {
      return false;
    }
  }, []);

  // Get device info (for diagnostics)
  const getDeviceInfo = useCallback(async (ip: string): Promise<any> => {
    try {
      const result = await verifyRVolutionDevice(ip);
      const reachable = await checkDeviceReachability(ip);
      
      return {
        ip,
        port: HTTP_PORT,
        isRVolution: result.isRVolution,
        deviceName: result.deviceName,
        responseData: result.responseData,
        endpoint: result.endpoint,
        reachable,
      };
    } catch (error) {
      return {
        ip,
        port: HTTP_PORT,
        isRVolution: false,
        reachable: false,
        error: error.message,
      };
    }
  }, [verifyRVolutionDevice, checkDeviceReachability]);

  // Ultra-fast IP batch scanning
  const scanIPBatch = useCallback(async (baseIP: string, startRange: number, endRange: number): Promise<RVolutionDevice[]> => {
    const promises: Promise<RVolutionDevice | null>[] = [];
    
    for (let i = startRange; i <= endRange; i++) {
      const ip = `${baseIP}.${i}`;
      
      const promise = verifyRVolutionDevice(ip).then(async (result) => {
        if (result.isRVolution) {
          console.log(`🎉 R_VOLUTION device discovered: ${result.deviceName} at ${ip}:${HTTP_PORT}`);
          return {
            id: `discovered_${ip}_${Date.now()}`,
            name: result.deviceName || `${TARGET_DEVICE_NAME} (${ip})`,
            ip: ip,
            port: HTTP_PORT,
            isOnline: true,
            lastSeen: new Date(),
            isManuallyAdded: false,
          };
        }
        return null;
      }).catch(() => null); // Silently handle failures for speed
      
      promises.push(promise);
    }
    
    const results = await Promise.all(promises);
    return results.filter((device): device is RVolutionDevice => device !== null);
  }, [verifyRVolutionDevice]);

  // Ultra-fast network scanning using the CGI endpoint
  const scanNetwork = useCallback(async () => {
    setIsScanning(true);
    setScanProgress(0);
    setDiscoveredDevices([]); // Clear previous discovered devices
    
    try {
      console.log('🚀 Starting ULTRA-FAST R_VOLUTION device discovery...');
      console.log(`🎯 Target device name: ${TARGET_DEVICE_NAME}`);
      console.log(`🔌 Protocol: HTTP on port ${HTTP_PORT}`);
      console.log(`🚀 Fast endpoint: ${CGI_ENDPOINT}`);
      console.log(`⏱️  Timeout: ${FAST_SCAN_TIMEOUT}ms per request`);
      console.log(`🔄 Concurrent requests: ${CONCURRENT_REQUESTS}`);
      
      const networkBases = await getLocalNetworkInfo();
      const foundDevices: RVolutionDevice[] = [];
      let totalProgress = 0;
      const totalNetworks = Math.min(networkBases.length, 2); // Only scan first 2 ranges for speed
      
      console.log(`🌐 Ultra-fast scanning ${totalNetworks} priority network ranges...`);
      
      // Scan only the most common network ranges for speed
      for (let networkIndex = 0; networkIndex < totalNetworks; networkIndex++) {
        const baseIP = networkBases[networkIndex];
        console.log(`📡 Fast scanning network ${baseIP}.x (${networkIndex + 1}/${totalNetworks})`);
        
        const batchSize = CONCURRENT_REQUESTS;
        const networkDevices: RVolutionDevice[] = [];
        
        // Prioritize common IP ranges (1-50, 100-150, 200-254)
        const priorityRanges = [
          { start: 1, end: 50 },     // Common device range
          { start: 100, end: 150 },  // Common DHCP range
          { start: 200, end: 254 },  // High range
        ];
        
        for (const range of priorityRanges) {
          for (let start = range.start; start <= range.end; start += batchSize) {
            const end = Math.min(start + batchSize - 1, range.end);
            
            console.log(`🔎 Ultra-fast scanning ${baseIP}.${start}-${end}`);
            
            try {
              const batchDevices = await scanIPBatch(baseIP, start, end);
              networkDevices.push(...batchDevices);
              
              if (batchDevices.length > 0) {
                console.log(`✅ Found ${batchDevices.length} R_VOLUTION devices in batch ${baseIP}.${start}-${end}`);
                batchDevices.forEach(device => {
                  console.log(`   🎵 ${device.name} at ${device.ip}:${device.port}`);
                });
                
                // Update discovered devices in real-time
                setDiscoveredDevices(prev => [...prev, ...batchDevices]);
              }
            } catch (batchError) {
              console.log(`❌ Error scanning batch ${baseIP}.${start}-${end}:`, batchError);
            }
            
            // Update progress
            const rangeProgress = ((end - range.start + 1) / (range.end - range.start + 1)) * 33.33; // Each range is 33.33% of network
            const networkProgress = (rangeProgress / totalNetworks);
            const baseProgress = (networkIndex / totalNetworks) * 100;
            totalProgress = baseProgress + networkProgress;
            setScanProgress(Math.round(totalProgress));
          }
        }
        
        foundDevices.push(...networkDevices);
        console.log(`📊 Network ${baseIP}.x ultra-fast scan complete. Found ${networkDevices.length} devices.`);
      }
      
      console.log(`🎉 Ultra-fast discovery completed! Found ${foundDevices.length} R_VOLUTION devices total:`);
      foundDevices.forEach((device, index) => {
        console.log(`   ${index + 1}. ${device.name} at ${device.ip}:${device.port}`);
      });
      
      if (foundDevices.length === 0) {
        console.log(`🔍 Ultra-fast discovery completed. No R_VOLUTION devices found.`);
        console.log(`💡 Troubleshooting suggestions:`);
        console.log(`   1. Verify R_VOLUTION devices are powered on`);
        console.log(`   2. Ensure devices are connected to Wi-Fi`);
        console.log(`   3. Check that devices are on the same network`);
        console.log(`   4. Verify devices respond to ${CGI_ENDPOINT} endpoint`);
        console.log(`   5. Try manual addition with known IP address`);
      }
      
    } catch (error) {
      console.log('❌ Ultra-fast network discovery failed:', error);
    } finally {
      setIsScanning(false);
      setScanProgress(0);
    }
  }, [getLocalNetworkInfo, scanIPBatch]);

  // Add discovered device to saved devices
  const addDiscoveredDevice = useCallback(async (discoveredDevice: RVolutionDevice) => {
    try {
      console.log('➕ Adding discovered device to saved devices:', discoveredDevice.name);
      
      // Check if device already exists in saved devices
      const existingDevice = devices.find(d => d.ip === discoveredDevice.ip && d.port === discoveredDevice.port);
      if (existingDevice) {
        console.log('❌ Device already exists in saved devices:', existingDevice);
        throw new Error('Cet appareil est déjà dans la liste');
      }

      // Create new device with manual flag set to false (since it was discovered)
      const newDevice: RVolutionDevice = {
        ...discoveredDevice,
        id: `added_${discoveredDevice.ip}_${Date.now()}`,
        isManuallyAdded: false,
      };
      
      // Update devices state
      const updatedDevices = [...devices, newDevice];
      setDevices(updatedDevices);
      
      // Save to storage
      await saveDevices(updatedDevices);
      
      console.log('✅ Discovered device added to saved devices successfully!');
      return newDevice;
      
    } catch (error) {
      console.log('❌ Failed to add discovered device:', error);
      throw error;
    }
  }, [devices, saveDevices]);

  // Manual device addition using the fast CGI endpoint
  const addDeviceManually = useCallback(async (ip: string, port: number = HTTP_PORT, customName?: string): Promise<RVolutionDevice> => {
    console.log('📱 === MANUAL DEVICE ADDITION STARTED ===');
    console.log(`   IP: ${ip}`);
    console.log(`   Port: ${HTTP_PORT} (HTTP protocol enforced)`);
    console.log(`   Fast endpoint: ${CGI_ENDPOINT}`);
    console.log(`   Custom Name: ${customName || 'None'}`);
    
    try {
      // Validate IP format
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!ipRegex.test(ip)) {
        throw new Error('Format d\'adresse IP invalide. Utilisez le format: 192.168.1.100');
      }

      // Validate IP ranges (0-255 for each octet)
      const octets = ip.split('.');
      const invalidOctet = octets.find(octet => {
        const num = parseInt(octet, 10);
        return isNaN(num) || num < 0 || num > 255;
      });
      
      if (invalidOctet) {
        throw new Error('Adresse IP invalide. Chaque partie doit être entre 0 et 255');
      }

      // Check if device already exists
      const existingDevice = devices.find(d => d.ip === ip && d.port === HTTP_PORT);
      if (existingDevice) {
        console.log('❌ Device already exists:', existingDevice);
        throw new Error('Cet appareil est déjà dans la liste');
      }

      console.log('🚀 Testing device connectivity using fast CGI endpoint...');
      
      // Test using the fast CGI endpoint
      const isReachable = await checkDeviceReachability(ip);
      console.log(`🔗 Device reachability: ${isReachable ? 'YES' : 'NO'}`);
      
      // Try to verify as R_VOLUTION device using fast method
      console.log('🎵 Fast verification as R_VOLUTION device...');
      const verificationResult = await verifyRVolutionDevice(ip);
      
      let deviceName = customName || `${TARGET_DEVICE_NAME} (${ip})`;
      let isVerified = verificationResult.isRVolution;
      
      if (isVerified) {
        deviceName = verificationResult.deviceName || deviceName;
        console.log(`✅ Device verified as R_VOLUTION: ${deviceName}`);
      } else if (isReachable) {
        console.log(`⚠️  Device is reachable but not verified as R_VOLUTION`);
        console.log(`   Adding anyway as manual device`);
      } else {
        console.log(`❌ Device is not reachable`);
        console.log(`   Adding anyway as manual device (may be offline)`);
      }
      
      const newDevice: RVolutionDevice = {
        id: `manual_${ip}_${HTTP_PORT}_${Date.now()}`,
        name: deviceName,
        ip: ip,
        port: HTTP_PORT,
        isOnline: isReachable,
        lastSeen: isReachable ? new Date() : new Date(0),
        isManuallyAdded: true,
      };
      
      console.log('📝 Creating device:', {
        id: newDevice.id,
        name: newDevice.name,
        ip: newDevice.ip,
        port: newDevice.port,
        protocol: 'HTTP',
        endpoint: CGI_ENDPOINT,
        verified: isVerified,
        reachable: isReachable,
      });
      
      // Update devices state
      const updatedDevices = [...devices, newDevice];
      console.log('📱 Updating devices state. Total devices:', updatedDevices.length);
      setDevices(updatedDevices);
      
      // Save to storage
      console.log('💾 Saving devices to storage...');
      await saveDevices(updatedDevices);
      
      console.log('✅ Manual device addition completed successfully!');
      console.log('📱 === MANUAL DEVICE ADDITION FINISHED ===');
      
      return newDevice;
      
    } catch (error) {
      console.log('❌ Manual device addition failed:', error);
      console.log('📱 === MANUAL DEVICE ADDITION FAILED ===');
      throw error;
    }
  }, [devices, saveDevices, checkDeviceReachability, verifyRVolutionDevice]);

  // Remove device
  const removeDevice = useCallback(async (deviceId: string) => {
    console.log('🗑️  Removing device:', deviceId);
    const updatedDevices = devices.filter(d => d.id !== deviceId);
    setDevices(updatedDevices);
    await saveDevices(updatedDevices);
    console.log('✅ Device removed successfully');
  }, [devices, saveDevices]);

  // Rename device
  const renameDevice = useCallback(async (deviceId: string, newName: string) => {
    console.log('✏️ Renaming device:', deviceId, 'to', newName);
    const updatedDevices = devices.map(device => 
      device.id === deviceId 
        ? { ...device, name: newName.trim() }
        : device
    );
    setDevices(updatedDevices);
    await saveDevices(updatedDevices);
    console.log('✅ Device renamed successfully');
  }, [devices, saveDevices]);

  // Update device (name and/or IP)
  const updateDevice = useCallback(async (deviceId: string, updates: { name?: string; ip?: string; port?: number }) => {
    console.log('✏️ Updating device:', deviceId, 'with updates:', updates);
    
    try {
      // Find the device to update
      const deviceToUpdate = devices.find(d => d.id === deviceId);
      if (!deviceToUpdate) {
        throw new Error('Device not found');
      }

      // If IP is being changed, validate it and check for duplicates
      if (updates.ip && updates.ip !== deviceToUpdate.ip) {
        // Validate IP format
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipRegex.test(updates.ip)) {
          throw new Error('Format d\'adresse IP invalide. Utilisez le format: 192.168.1.100');
        }

        // Validate IP ranges (0-255 for each octet)
        const octets = updates.ip.split('.');
        const invalidOctet = octets.find(octet => {
          const num = parseInt(octet, 10);
          return isNaN(num) || num < 0 || num > 255;
        });
        
        if (invalidOctet) {
          throw new Error('Adresse IP invalide. Chaque partie doit être entre 0 et 255');
        }

        // Check if another device already uses this IP
        const existingDevice = devices.find(d => d.id !== deviceId && d.ip === updates.ip && d.port === HTTP_PORT);
        if (existingDevice) {
          throw new Error('Un autre appareil utilise déjà cette adresse IP');
        }
      }

      // Create updated device
      const updatedDevice = {
        ...deviceToUpdate,
        ...(updates.name && { name: updates.name.trim() }),
        ...(updates.ip && { ip: updates.ip.trim() }),
        port: HTTP_PORT, // Always enforce HTTP port 80
        // Reset online status if IP changed, will be updated on next status check
        ...(updates.ip && updates.ip !== deviceToUpdate.ip && { isOnline: false, lastSeen: new Date(0) }),
      };

      // Update devices array
      const updatedDevices = devices.map(device => 
        device.id === deviceId ? updatedDevice : device
      );

      setDevices(updatedDevices);
      await saveDevices(updatedDevices);
      console.log('✅ Device updated successfully');
      
      return updatedDevice;
    } catch (error) {
      console.log('❌ Device update failed:', error);
      throw error;
    }
  }, [devices, saveDevices]);

  // Fast device status update using CGI endpoint
  const updateDeviceStatus = useCallback(async () => {
    if (devices.length === 0) {
      console.log('📊 No devices to update status for');
      return;
    }
    
    console.log(`📊 === FAST DEVICE STATUS UPDATE STARTED ===`);
    console.log(`📊 Updating status for ${devices.length} devices using ${CGI_ENDPOINT}...`);
    
    const updatedDevices = await Promise.all(
      devices.map(async (device) => {
        try {
          console.log(`🔄 Fast checking ${device.name} (${device.ip}:${HTTP_PORT}${CGI_ENDPOINT})`);
          
          let isOnline = false;
          let deviceName = device.name;
          
          if (device.isManuallyAdded) {
            // For manually added devices, use fast connectivity check
            isOnline = await checkDeviceReachability(device.ip);
            console.log(`   ${isOnline ? '✅' : '❌'} Manual device ${device.name} is ${isOnline ? 'reachable' : 'offline'}`);
          } else {
            // For auto-discovered devices, use fast R_VOLUTION verification
            const result = await verifyRVolutionDevice(device.ip);
            isOnline = result.isRVolution;
            
            if (isOnline) {
              deviceName = result.deviceName || device.name;
              console.log(`   ✅ Auto device ${device.name} is online and verified`);
            } else {
              // If not verified as R_VOLUTION, check basic connectivity as fallback
              const isReachable = await checkDeviceReachability(device.ip);
              console.log(`   ${isReachable ? '🔗' : '❌'} Auto device ${device.name} is ${isReachable ? 'reachable but not verified' : 'offline'}`);
              // For auto-discovered devices, we still require R_VOLUTION verification
              isOnline = false;
            }
          }
          
          const updatedDevice = {
            ...device,
            isOnline,
            lastSeen: isOnline ? new Date() : device.lastSeen,
            name: deviceName,
            port: HTTP_PORT,
          };
          
          console.log(`   📊 ${device.name} status: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
          return updatedDevice;
        } catch (error) {
          console.log(`❌ ${device.name} status check failed:`, error.message);
          return {
            ...device,
            isOnline: false,
            port: HTTP_PORT,
          };
        }
      })
    );
    
    // Update state and save to storage
    setDevices(updatedDevices);
    await saveDevices(updatedDevices);
    
    const onlineCount = updatedDevices.filter(d => d.isOnline).length;
    console.log(`📊 Fast status update completed: ${onlineCount}/${updatedDevices.length} devices online`);
    console.log(`📊 === FAST DEVICE STATUS UPDATE COMPLETED ===`);
    
    return updatedDevices;
  }, [devices, saveDevices, verifyRVolutionDevice, checkDeviceReachability]);

  // Fast network diagnostic function
  const runNetworkDiagnostic = useCallback(async (targetIP?: string) => {
    console.log('🔧 === FAST NETWORK DIAGNOSTIC STARTED ===');
    
    try {
      const networkBases = await getLocalNetworkInfo();
      console.log('🌐 Network ranges to test:', networkBases);
      
      if (targetIP) {
        console.log(`🎯 Testing specific IP: ${targetIP}${CGI_ENDPOINT}`);
        
        const deviceInfo = await getDeviceInfo(targetIP);
        console.log('📋 Device info:', deviceInfo);
        return deviceInfo;
      }
      
      // Test a few common IPs in the first range only for speed
      const testIPs = [];
      const base = networkBases[0]; // Only test first range
      testIPs.push(`${base}.1`, `${base}.2`, `${base}.10`, `${base}.100`, `${base}.254`);
      
      console.log('🧪 Fast testing sample IPs:', testIPs);
      
      const results = await Promise.all(
        testIPs.map(async (ip) => {
          console.log(`🔍 Fast testing ${ip}${CGI_ENDPOINT}...`);
          const info = await getDeviceInfo(ip);
          console.log(`📋 ${ip}:`, info);
          return info;
        })
      );
      
      const reachableDevices = results.filter(r => r.reachable);
      const rvolutionDevices = results.filter(r => r.isRVolution);
      
      console.log(`📊 Fast diagnostic complete:`);
      console.log(`   ${reachableDevices.length}/${testIPs.length} test IPs reachable`);
      console.log(`   ${rvolutionDevices.length} R_VOLUTION devices found`);
      
      if (rvolutionDevices.length > 0) {
        console.log('🎉 R_VOLUTION devices found:');
        rvolutionDevices.forEach(device => {
          console.log(`   🎵 ${device.deviceName || 'Unknown'} at ${device.ip}:${HTTP_PORT}`);
        });
      }
      
      return results;
      
    } catch (error) {
      console.log('❌ Fast network diagnostic failed:', error);
      throw error;
    } finally {
      console.log('🔧 === FAST NETWORK DIAGNOSTIC FINISHED ===');
    }
  }, [getLocalNetworkInfo, getDeviceInfo]);

  // Test a specific IP address using fast method
  const testSpecificIP = useCallback(async (ip: string) => {
    console.log(`🧪 === FAST TESTING SPECIFIC IP: ${ip}${CGI_ENDPOINT} ===`);
    
    try {
      const deviceInfo = await getDeviceInfo(ip);
      console.log('📋 Device info:', deviceInfo);
      return deviceInfo;
      
    } catch (error) {
      console.log('❌ Fast IP test failed:', error);
      throw error;
    } finally {
      console.log(`🧪 === FAST IP TEST FINISHED ===`);
    }
  }, [getDeviceInfo]);

  // Test device connectivity using fast method
  const testDeviceConnectivity = useCallback(async (device: RVolutionDevice): Promise<boolean> => {
    console.log(`🧪 Fast testing connectivity for ${device.name} (${device.ip}:${HTTP_PORT}${CGI_ENDPOINT})`);
    
    try {
      const isReachable = await checkDeviceReachability(device.ip);
      console.log(`${isReachable ? '✅' : '❌'} ${device.name} fast connectivity test: ${isReachable ? 'PASS' : 'FAIL'}`);
      return isReachable;
    } catch (error) {
      console.log(`❌ Fast connectivity test failed for ${device.name}:`, error);
      return false;
    }
  }, [checkDeviceReachability]);

  // Initialize by loading saved devices
  useEffect(() => {
    if (!devicesLoadedRef.current && !initializingRef.current) {
      console.log('🚀 Initializing ULTRA-FAST device discovery hook...');
      console.log(`🚀 Using fast CGI endpoint: ${CGI_ENDPOINT}`);
      console.log(`⏱️  Fast timeout: ${FAST_SCAN_TIMEOUT}ms`);
      console.log(`🔄 High concurrency: ${CONCURRENT_REQUESTS} requests`);
      loadSavedDevices();
    }
  }, [loadSavedDevices]);

  return {
    devices,
    discoveredDevices, // New: expose discovered devices
    isScanning,
    scanProgress,
    networkInfo,
    scanNetwork,
    addDeviceManually,
    addDiscoveredDevice, // New: function to add discovered device to saved devices
    removeDevice,
    renameDevice,
    updateDevice,
    updateDeviceStatus,
    testDeviceConnectivity,
    verifyRVolutionDevice,
    checkDeviceReachability,
    getDeviceInfo,
    runNetworkDiagnostic,
    testSpecificIP,
  };
};
