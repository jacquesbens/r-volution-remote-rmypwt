
import { useState, useEffect, useCallback, useRef } from 'react';
import { RVolutionDevice, NetworkScanResult } from '../types/Device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEY = 'rvolution_devices';
const SCAN_TIMEOUT = 5000; // Reduced timeout for faster scanning
const TARGET_DEVICE_NAME = 'R_VOLUTION';
const CONCURRENT_REQUESTS = 15; // Increased for faster scanning
const HTTP_PORT = 80; // Fixed port for HTTP protocol

export const useDeviceDiscovery = () => {
  const [devices, setDevices] = useState<RVolutionDevice[]>([]);
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
      
      // For local network detection, we'll use common ranges
      const commonRanges = [
        '192.168.1',
        '192.168.0', 
        '192.168.2',
        '192.168.10',
        '192.168.100',
        '10.0.0',
        '172.16.0',
      ];
      
      setNetworkInfo({
        localIP: 'Auto-detected',
        networkRange: commonRanges.join(', ')
      });
      
      console.log('🌐 Will scan common network ranges:', commonRanges);
      return commonRanges;
      
    } catch (error) {
      console.log('🌐 Network info detection failed:', error);
      // Fallback to common ranges
      const fallbackRanges = ['192.168.1', '192.168.0', '10.0.0'];
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

  // Enhanced device verification using only HTTP port 80
  const verifyRVolutionDevice = useCallback(async (ip: string): Promise<{
    isRVolution: boolean;
    deviceName?: string;
    responseData?: any;
    endpoint?: string;
  }> => {
    console.log(`🔍 Verifying R_VOLUTION device at ${ip}:${HTTP_PORT} (HTTP only)`);
    
    try {
      // Try multiple endpoints that R_VOLUTION devices might use
      const endpoints = [
        '/',
        '/info',
        '/status', 
        '/device',
        '/api/info',
        '/api/status',
        '/api/device',
        '/system',
        '/config',
      ];
      
      for (const endpoint of endpoints) {
        try {
          console.log(`   Testing HTTP ${ip}:${HTTP_PORT}${endpoint}`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), SCAN_TIMEOUT);
          
          const response = await fetch(`http://${ip}:${HTTP_PORT}${endpoint}`, {
            method: 'GET',
            signal: controller.signal,
            headers: {
              'Accept': 'application/json, text/plain, text/html, */*',
              'User-Agent': 'R_VOLUTION-Remote/1.0',
              'Cache-Control': 'no-cache',
            },
          });

          clearTimeout(timeoutId);
          console.log(`   Response status: ${response.status}`);
          
          if (response.ok) {
            const contentType = response.headers.get('content-type') || '';
            let responseData: any = null;
            let responseText = '';

            try {
              if (contentType.includes('application/json')) {
                responseData = await response.json();
                responseText = JSON.stringify(responseData);
                console.log(`   JSON response:`, responseData);
              } else {
                responseText = await response.text();
                console.log(`   Text response (first 200 chars):`, responseText.substring(0, 200));
              }
            } catch (parseError) {
              console.log(`   Parse error:`, parseError);
              continue;
            }

            // Enhanced R_VOLUTION detection patterns
            const detectionPatterns = [
              'R_VOLUTION',
              'R-VOLUTION', 
              'RVOLUTION',
              'r_volution',
              'r-volution',
              'rvolution',
              'revolution', // Sometimes the underscore might be missing
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
            ));

            if (isRVolution) {
              const deviceName = responseData?.name || 
                               responseData?.deviceName || 
                               responseData?.hostname || 
                               responseData?.model ||
                               `${TARGET_DEVICE_NAME} (${ip})`;
              
              console.log(`✅ R_VOLUTION device confirmed at ${ip}:${HTTP_PORT}${endpoint}`);
              console.log(`   Device name: ${deviceName}`);
              
              return { 
                isRVolution: true, 
                deviceName,
                responseData,
                endpoint
              };
            } else {
              console.log(`   No R_VOLUTION patterns found in response`);
            }
          } else {
            console.log(`   HTTP ${response.status}: ${response.statusText}`);
          }
        } catch (endpointError) {
          console.log(`   Endpoint ${endpoint} failed:`, endpointError.message);
        }
      }

      console.log(`❌ No R_VOLUTION device found at ${ip}:${HTTP_PORT}`);
      return { isRVolution: false };
      
    } catch (error) {
      console.log(`❌ Verification failed for ${ip}:${HTTP_PORT}:`, error.message);
      return { isRVolution: false };
    }
  }, []);

  // Check basic HTTP connectivity to an IP on port 80
  const checkDeviceReachability = useCallback(async (ip: string, retries: number = 2): Promise<boolean> => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        console.log(`🔗 Testing HTTP connectivity to ${ip}:${HTTP_PORT} (attempt ${attempt + 1}/${retries + 1})`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        
        const response = await fetch(`http://${ip}:${HTTP_PORT}/`, {
          method: 'HEAD', // Use HEAD for faster response
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        const isReachable = response.status < 500; // Accept any response that's not a server error
        console.log(`${isReachable ? '✅' : '❌'} ${ip}:${HTTP_PORT} is ${isReachable ? 'reachable' : 'unreachable'} (status: ${response.status})`);
        return isReachable;
        
      } catch (error) {
        console.log(`❌ ${ip}:${HTTP_PORT} attempt ${attempt + 1} failed:`, error.message);
        if (attempt < retries) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }
    
    console.log(`❌ ${ip}:${HTTP_PORT} is unreachable after ${retries + 1} attempts`);
    return false;
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

  // Scan a batch of IPs concurrently with improved error handling
  const scanIPBatch = useCallback(async (baseIP: string, startRange: number, endRange: number): Promise<RVolutionDevice[]> => {
    const promises: Promise<RVolutionDevice | null>[] = [];
    
    for (let i = startRange; i <= endRange; i++) {
      const ip = `${baseIP}.${i}`;
      
      const promise = verifyRVolutionDevice(ip).then(async (result) => {
        if (result.isRVolution) {
          // Check if device already exists
          const existingDevice = devices.find(d => d.ip === ip);
          if (!existingDevice) {
            console.log(`🎉 New R_VOLUTION device discovered: ${result.deviceName} at ${ip}:${HTTP_PORT}`);
            return {
              id: `auto_${ip}_${Date.now()}`,
              name: result.deviceName || `${TARGET_DEVICE_NAME} (${ip})`,
              ip: ip,
              port: HTTP_PORT,
              isOnline: true,
              lastSeen: new Date(),
              isManuallyAdded: false,
            };
          } else {
            console.log(`📱 Device ${ip} already exists in list`);
          }
        }
        return null;
      }).catch((error) => {
        // Silently handle individual IP failures
        return null;
      });
      
      promises.push(promise);
    }
    
    const results = await Promise.all(promises);
    return results.filter((device): device is RVolutionDevice => device !== null);
  }, [devices, verifyRVolutionDevice]);

  // Enhanced network scanning with HTTP port 80 only
  const scanNetwork = useCallback(async () => {
    setIsScanning(true);
    setScanProgress(0);
    
    try {
      console.log('🚀 Starting enhanced R_VOLUTION device discovery...');
      console.log(`🎯 Target device name: ${TARGET_DEVICE_NAME}`);
      console.log(`🔌 Protocol: HTTP only on port ${HTTP_PORT}`);
      console.log(`⏱️  Timeout: ${SCAN_TIMEOUT}ms per request`);
      console.log(`🔄 Concurrent requests: ${CONCURRENT_REQUESTS}`);
      
      const networkBases = await getLocalNetworkInfo();
      const foundDevices: RVolutionDevice[] = [];
      let totalProgress = 0;
      const totalNetworks = networkBases.length;
      
      console.log(`🌐 Scanning ${totalNetworks} network ranges using HTTP protocol...`);
      
      // Scan each network base
      for (let networkIndex = 0; networkIndex < networkBases.length; networkIndex++) {
        const baseIP = networkBases[networkIndex];
        console.log(`📡 Scanning network ${baseIP}.x (${networkIndex + 1}/${totalNetworks}) on HTTP port ${HTTP_PORT}`);
        
        const batchSize = CONCURRENT_REQUESTS;
        const networkDevices: RVolutionDevice[] = [];
        
        for (let start = 1; start <= 254; start += batchSize) {
          const end = Math.min(start + batchSize - 1, 254);
          
          console.log(`🔎 Scanning ${baseIP}.${start}-${end} on HTTP port ${HTTP_PORT}`);
          
          try {
            const batchDevices = await scanIPBatch(baseIP, start, end);
            networkDevices.push(...batchDevices);
            
            if (batchDevices.length > 0) {
              console.log(`✅ Found ${batchDevices.length} R_VOLUTION devices in batch ${baseIP}.${start}-${end}`);
              batchDevices.forEach(device => {
                console.log(`   🎵 ${device.name} at ${device.ip}:${device.port} (HTTP)`);
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
        console.log(`🎉 Discovery completed! Found ${foundDevices.length} new R_VOLUTION devices:`);
        foundDevices.forEach((device, index) => {
          console.log(`   ${index + 1}. ${device.name} at ${device.ip}:${device.port} (HTTP)`);
        });
      } else {
        console.log(`🔍 Discovery completed. No new R_VOLUTION devices found.`);
        console.log(`💡 Troubleshooting suggestions:`);
        console.log(`   1. Verify R_VOLUTION devices are powered on`);
        console.log(`   2. Ensure devices are connected to Wi-Fi`);
        console.log(`   3. Check that devices are on the same network`);
        console.log(`   4. Verify devices use HTTP protocol on port 80`);
        console.log(`   5. Try manual addition with known IP address`);
        console.log(`   6. Check device documentation for HTTP settings`);
        console.log(`   7. Verify firewall settings allow HTTP traffic`);
        console.log(`   8. Ensure devices respond to HTTP requests on port 80`);
      }
      
    } catch (error) {
      console.log('❌ Network discovery failed:', error);
    } finally {
      setIsScanning(false);
      setScanProgress(0);
    }
  }, [devices, saveDevices, getLocalNetworkInfo, scanIPBatch]);

  // Enhanced manual device addition (HTTP port 80 only)
  const addDeviceManually = useCallback(async (ip: string, port: number = HTTP_PORT, customName?: string): Promise<RVolutionDevice> => {
    console.log('📱 === MANUAL DEVICE ADDITION STARTED ===');
    console.log(`   IP: ${ip}`);
    console.log(`   Port: ${HTTP_PORT} (HTTP protocol enforced)`);
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

      // Check if device already exists (always use HTTP port 80)
      const existingDevice = devices.find(d => d.ip === ip && d.port === HTTP_PORT);
      if (existingDevice) {
        console.log('❌ Device already exists:', existingDevice);
        throw new Error('Cet appareil est déjà dans la liste');
      }

      console.log('🔍 Testing device connectivity on HTTP port 80...');
      
      // Test basic HTTP connectivity
      const isReachable = await checkDeviceReachability(ip, 3);
      console.log(`🔗 Device reachability: ${isReachable ? 'YES' : 'NO'}`);
      
      // Try to verify as R_VOLUTION device
      console.log('🎵 Verifying as R_VOLUTION device...');
      const verificationResult = await verifyRVolutionDevice(ip);
      
      let deviceName = customName || `${TARGET_DEVICE_NAME} (${ip})`;
      let isVerified = verificationResult.isRVolution;
      
      if (isVerified) {
        deviceName = verificationResult.deviceName || deviceName;
        console.log(`✅ Device verified as R_VOLUTION: ${deviceName} on HTTP port ${HTTP_PORT}`);
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
        port: HTTP_PORT, // Always use HTTP port 80
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

  // Update device (name and/or IP) - always use HTTP port 80
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

        // Check if another device already uses this IP (always check HTTP port 80)
        const existingDevice = devices.find(d => d.id !== deviceId && d.ip === updates.ip && d.port === HTTP_PORT);
        if (existingDevice) {
          throw new Error('Un autre appareil utilise déjà cette adresse IP');
        }
      }

      // Create updated device (always use HTTP port 80)
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
      console.log('✅ Device updated successfully (HTTP port 80 enforced)');
      
      return updatedDevice;
    } catch (error) {
      console.log('❌ Device update failed:', error);
      throw error;
    }
  }, [devices, saveDevices]);

  // Update device status with enhanced checking - HTTP port 80 only
  const updateDeviceStatus = useCallback(async () => {
    if (devices.length === 0) {
      console.log('📊 No devices to update status for');
      return;
    }
    
    console.log(`📊 === DEVICE STATUS UPDATE STARTED (HTTP PORT ${HTTP_PORT}) ===`);
    console.log(`📊 Updating status for ${devices.length} devices...`);
    
    const updatedDevices = await Promise.all(
      devices.map(async (device) => {
        try {
          console.log(`🔄 Checking ${device.name} (${device.ip}:${HTTP_PORT}) - Manual: ${device.isManuallyAdded}`);
          
          let isOnline = false;
          let deviceName = device.name;
          
          if (device.isManuallyAdded) {
            // For manually added devices, use basic HTTP connectivity check
            console.log(`   📱 Manual device - using basic HTTP connectivity check`);
            isOnline = await checkDeviceReachability(device.ip, 1);
            console.log(`   ${isOnline ? '✅' : '❌'} Manual device ${device.name} is ${isOnline ? 'reachable' : 'offline'} on HTTP port ${HTTP_PORT}`);
          } else {
            // For auto-discovered devices, use full R_VOLUTION verification
            console.log(`   🤖 Auto-discovered device - using R_VOLUTION verification on HTTP`);
            const result = await verifyRVolutionDevice(device.ip);
            isOnline = result.isRVolution;
            
            if (isOnline) {
              deviceName = result.deviceName || device.name;
              console.log(`   ✅ Auto device ${device.name} is online and verified on HTTP port ${HTTP_PORT}`);
            } else {
              // If not verified as R_VOLUTION, check basic connectivity as fallback
              const isReachable = await checkDeviceReachability(device.ip);
              console.log(`   ${isReachable ? '🔗' : '❌'} Auto device ${device.name} is ${isReachable ? 'reachable but not verified' : 'offline'} on HTTP port ${HTTP_PORT}`);
              // For auto-discovered devices, we still require R_VOLUTION verification
              isOnline = false;
            }
          }
          
          const updatedDevice = {
            ...device,
            isOnline,
            lastSeen: isOnline ? new Date() : device.lastSeen,
            name: deviceName,
            port: HTTP_PORT, // Always enforce HTTP port 80
          };
          
          console.log(`   📊 ${device.name} status: ${isOnline ? 'ONLINE' : 'OFFLINE'} (HTTP port ${HTTP_PORT})`);
          return updatedDevice;
        } catch (error) {
          console.log(`❌ ${device.name} status check failed:`, error.message);
          return {
            ...device,
            isOnline: false,
            port: HTTP_PORT, // Always enforce HTTP port 80
          };
        }
      })
    );
    
    // Update state and save to storage
    setDevices(updatedDevices);
    await saveDevices(updatedDevices);
    
    const onlineCount = updatedDevices.filter(d => d.isOnline).length;
    console.log(`📊 Status update completed: ${onlineCount}/${updatedDevices.length} devices online on HTTP port ${HTTP_PORT}`);
    console.log(`📊 === DEVICE STATUS UPDATE COMPLETED ===`);
    
    return updatedDevices;
  }, [devices, saveDevices, verifyRVolutionDevice, checkDeviceReachability]);

  // Enhanced network diagnostic function - HTTP port 80 only
  const runNetworkDiagnostic = useCallback(async (targetIP?: string) => {
    console.log('🔧 === ENHANCED NETWORK DIAGNOSTIC STARTED (HTTP PORT 80) ===');
    
    try {
      const networkBases = await getLocalNetworkInfo();
      console.log('🌐 Network ranges to test:', networkBases);
      
      if (targetIP) {
        console.log(`🎯 Testing specific IP: ${targetIP} on HTTP port ${HTTP_PORT}`);
        
        const deviceInfo = await getDeviceInfo(targetIP);
        console.log('📋 Device info:', deviceInfo);
        return deviceInfo;
      }
      
      // Test a few common IPs in each range
      const testIPs = [];
      for (const base of networkBases.slice(0, 3)) { // Test first 3 ranges
        testIPs.push(`${base}.1`, `${base}.2`, `${base}.10`, `${base}.100`, `${base}.254`);
      }
      
      console.log('🧪 Testing sample IPs on HTTP port 80:', testIPs);
      
      const results = await Promise.all(
        testIPs.map(async (ip) => {
          console.log(`🔍 Testing ${ip} on HTTP port ${HTTP_PORT}...`);
          const info = await getDeviceInfo(ip);
          console.log(`📋 ${ip}:${HTTP_PORT}:`, info);
          return info;
        })
      );
      
      const reachableDevices = results.filter(r => r.reachable);
      const rvolutionDevices = results.filter(r => r.isRVolution);
      
      console.log(`📊 Diagnostic complete:`);
      console.log(`   ${reachableDevices.length}/${testIPs.length} test IPs reachable on HTTP port ${HTTP_PORT}`);
      console.log(`   ${rvolutionDevices.length} R_VOLUTION devices found`);
      
      if (rvolutionDevices.length > 0) {
        console.log('🎉 R_VOLUTION devices found:');
        rvolutionDevices.forEach(device => {
          console.log(`   🎵 ${device.deviceName || 'Unknown'} at ${device.ip}:${HTTP_PORT} (HTTP)`);
        });
      }
      
      return results;
      
    } catch (error) {
      console.log('❌ Network diagnostic failed:', error);
      throw error;
    } finally {
      console.log('🔧 === ENHANCED NETWORK DIAGNOSTIC FINISHED ===');
    }
  }, [getLocalNetworkInfo, getDeviceInfo]);

  // Test a specific IP address (HTTP port 80 only)
  const testSpecificIP = useCallback(async (ip: string) => {
    console.log(`🧪 === TESTING SPECIFIC IP: ${ip} ON HTTP PORT ${HTTP_PORT} ===`);
    
    try {
      const deviceInfo = await getDeviceInfo(ip);
      console.log('📋 Device info:', deviceInfo);
      return deviceInfo;
      
    } catch (error) {
      console.log('❌ IP test failed:', error);
      throw error;
    } finally {
      console.log(`🧪 === IP TEST FINISHED ===`);
    }
  }, [getDeviceInfo]);

  // Test device connectivity (HTTP port 80 only)
  const testDeviceConnectivity = useCallback(async (device: RVolutionDevice): Promise<boolean> => {
    console.log(`🧪 Testing HTTP connectivity for ${device.name} (${device.ip}:${HTTP_PORT})`);
    
    try {
      const isReachable = await checkDeviceReachability(device.ip, 1);
      console.log(`${isReachable ? '✅' : '❌'} ${device.name} HTTP connectivity test: ${isReachable ? 'PASS' : 'FAIL'}`);
      return isReachable;
    } catch (error) {
      console.log(`❌ HTTP connectivity test failed for ${device.name}:`, error);
      return false;
    }
  }, [checkDeviceReachability]);

  // Initialize by loading saved devices
  useEffect(() => {
    if (!devicesLoadedRef.current && !initializingRef.current) {
      console.log('🚀 Initializing device discovery hook (HTTP port 80 protocol)...');
      loadSavedDevices();
    }
  }, [loadSavedDevices]);

  return {
    devices,
    isScanning,
    scanProgress,
    networkInfo,
    scanNetwork,
    addDeviceManually,
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
