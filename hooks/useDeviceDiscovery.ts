
import { useState, useEffect, useCallback } from 'react';
import { RVolutionDevice, NetworkScanResult } from '../types/Device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEY = 'rvolution_devices';
const SCAN_TIMEOUT = 3000; // Increased timeout for better reliability
const TARGET_DEVICE_NAME = 'R_VOLUTION';
const CONCURRENT_REQUESTS = 15; // Reduced for better stability

export const useDeviceDiscovery = () => {
  const [devices, setDevices] = useState<RVolutionDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [networkInfo, setNetworkInfo] = useState<{
    localIP?: string;
    networkRange?: string;
  }>({});

  // Get device's local IP to determine network range
  const getLocalNetworkInfo = useCallback(async () => {
    try {
      console.log('🌐 Detecting local network information...');
      
      // Try to get local IP using a simple method
      const response = await fetch('https://api.ipify.org?format=json', {
        method: 'GET',
        timeout: 5000,
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('🌐 External IP detected:', data.ip);
      }
      
      // For local network detection, we'll use common ranges
      // In a real app, you might use react-native-network-info
      const commonRanges = [
        '192.168.1',
        '192.168.0', 
        '192.168.2',
        '10.0.0',
        '172.16.0',
        '192.168.100',
        '192.168.10',
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
    try {
      const savedDevices = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedDevices) {
        const parsedDevices = JSON.parse(savedDevices);
        setDevices(parsedDevices);
        console.log('📱 Loaded saved devices:', parsedDevices.length);
      }
    } catch (error) {
      console.log('❌ Error loading saved devices:', error);
    }
  }, []);

  // Save devices to storage
  const saveDevices = useCallback(async (devicesToSave: RVolutionDevice[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(devicesToSave));
      console.log('💾 Devices saved to storage');
    } catch (error) {
      console.log('❌ Error saving devices:', error);
    }
  }, []);

  // Enhanced device verification with multiple strategies
  const verifyRVolutionDevice = async (ip: string, port: number = 80): Promise<{
    isRVolution: boolean;
    deviceName?: string;
    responseData?: any;
    endpoint?: string;
  }> => {
    console.log(`🔍 Verifying R_VOLUTION device at ${ip}:${port}`);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), SCAN_TIMEOUT);

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
          console.log(`   Testing ${ip}:${port}${endpoint}`);
          
          const response = await fetch(`http://${ip}:${port}${endpoint}`, {
            method: 'GET',
            signal: controller.signal,
            headers: {
              'Accept': 'application/json, text/plain, text/html, */*',
              'User-Agent': 'R_VOLUTION-Remote/1.0',
              'Cache-Control': 'no-cache',
            },
          });

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
            ];
            
            const isRVolution = detectionPatterns.some(pattern => 
              responseText.toLowerCase().includes(pattern.toLowerCase())
            ) || (responseData && (
              responseData.name?.toLowerCase().includes('volution') ||
              responseData.deviceName?.toLowerCase().includes('volution') ||
              responseData.model?.toLowerCase().includes('volution') ||
              responseData.hostname?.toLowerCase().includes('volution') ||
              responseData.manufacturer?.toLowerCase().includes('volution') ||
              responseData.product?.toLowerCase().includes('volution')
            ));

            if (isRVolution) {
              clearTimeout(timeoutId);
              const deviceName = responseData?.name || 
                               responseData?.deviceName || 
                               responseData?.hostname || 
                               responseData?.model ||
                               `${TARGET_DEVICE_NAME} (${ip})`;
              
              console.log(`✅ R_VOLUTION device confirmed at ${ip}:${port}${endpoint}`);
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

      clearTimeout(timeoutId);
      console.log(`❌ No R_VOLUTION device found at ${ip}:${port}`);
      return { isRVolution: false };
      
    } catch (error) {
      console.log(`❌ Verification failed for ${ip}:${port}:`, error.message);
      return { isRVolution: false };
    }
  };

  // Check basic connectivity to an IP/port
  const checkDeviceReachability = async (ip: string, port: number = 80): Promise<boolean> => {
    try {
      console.log(`🔗 Testing connectivity to ${ip}:${port}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`http://${ip}:${port}/`, {
        method: 'HEAD', // Use HEAD for faster response
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const isReachable = response.status < 500; // Accept any response that's not a server error
      console.log(`${isReachable ? '✅' : '❌'} ${ip}:${port} is ${isReachable ? 'reachable' : 'unreachable'} (status: ${response.status})`);
      return isReachable;
      
    } catch (error) {
      console.log(`❌ ${ip}:${port} is unreachable:`, error.message);
      return false;
    }
  };

  // Get device info (for diagnostics)
  const getDeviceInfo = async (ip: string, port: number = 80): Promise<any> => {
    try {
      const result = await verifyRVolutionDevice(ip, port);
      return {
        ip,
        port,
        isRVolution: result.isRVolution,
        deviceName: result.deviceName,
        responseData: result.responseData,
        endpoint: result.endpoint,
        reachable: await checkDeviceReachability(ip, port),
      };
    } catch (error) {
      return {
        ip,
        port,
        isRVolution: false,
        reachable: false,
        error: error.message,
      };
    }
  };

  // Scan a batch of IPs concurrently with improved error handling
  const scanIPBatch = async (baseIP: string, startRange: number, endRange: number): Promise<RVolutionDevice[]> => {
    const promises: Promise<RVolutionDevice | null>[] = [];
    
    for (let i = startRange; i <= endRange; i++) {
      const ip = `${baseIP}.${i}`;
      
      const promise = verifyRVolutionDevice(ip, 80).then(async (result) => {
        if (result.isRVolution) {
          // Check if device already exists
          const existingDevice = devices.find(d => d.ip === ip);
          if (!existingDevice) {
            console.log(`🎉 New R_VOLUTION device discovered: ${result.deviceName} at ${ip}`);
            return {
              id: `auto_${ip}_${Date.now()}`,
              name: result.deviceName || `${TARGET_DEVICE_NAME} (${ip})`,
              ip: ip,
              port: 80,
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
  };

  // Enhanced network scanning with better progress tracking
  const scanNetwork = useCallback(async () => {
    setIsScanning(true);
    setScanProgress(0);
    
    try {
      console.log('🚀 Starting enhanced R_VOLUTION device discovery...');
      console.log(`🎯 Target device name: ${TARGET_DEVICE_NAME}`);
      console.log(`🔌 Target port: 80`);
      
      const networkBases = await getLocalNetworkInfo();
      const foundDevices: RVolutionDevice[] = [];
      let totalProgress = 0;
      const totalNetworks = networkBases.length;
      
      console.log(`🌐 Scanning ${totalNetworks} network ranges...`);
      
      // Scan each network base
      for (let networkIndex = 0; networkIndex < networkBases.length; networkIndex++) {
        const baseIP = networkBases[networkIndex];
        console.log(`📡 Scanning network ${baseIP}.x (${networkIndex + 1}/${totalNetworks})`);
        
        const batchSize = 20; // Optimal batch size
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
                console.log(`   🎵 ${device.name} at ${device.ip}:${device.port}`);
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
          console.log(`   ${index + 1}. ${device.name} at ${device.ip}:${device.port}`);
        });
      } else {
        console.log(`🔍 Discovery completed. No new R_VOLUTION devices found.`);
        console.log(`💡 Troubleshooting suggestions:`);
        console.log(`   1. Verify R_VOLUTION devices are powered on`);
        console.log(`   2. Ensure devices are connected to Wi-Fi`);
        console.log(`   3. Check that devices are on the same network`);
        console.log(`   4. Confirm devices are using port 80`);
        console.log(`   5. Try manual addition with known IP address`);
        console.log(`   6. Check device documentation for network settings`);
      }
      
    } catch (error) {
      console.log('❌ Network discovery failed:', error);
    } finally {
      setIsScanning(false);
      setScanProgress(0);
    }
  }, [devices, saveDevices, getLocalNetworkInfo]);

  // Enhanced manual device addition
  const addDeviceManually = useCallback(async (ip: string, port: number = 80, customName?: string) => {
    console.log('📱 === MANUAL DEVICE ADDITION STARTED ===');
    console.log(`   IP: ${ip}`);
    console.log(`   Port: ${port}`);
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
      const existingDevice = devices.find(d => d.ip === ip && d.port === port);
      if (existingDevice) {
        console.log('❌ Device already exists:', existingDevice);
        throw new Error('Cet appareil est déjà dans la liste');
      }

      console.log('🔍 Testing device connectivity...');
      
      // Test basic connectivity first
      const isReachable = await checkDeviceReachability(ip, port);
      console.log(`🔗 Device reachability: ${isReachable ? 'YES' : 'NO'}`);
      
      // Try to verify as R_VOLUTION device
      console.log('🎵 Verifying as R_VOLUTION device...');
      const verificationResult = await verifyRVolutionDevice(ip, port);
      
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
        id: `manual_${ip}_${port}_${Date.now()}`,
        name: deviceName,
        ip: ip,
        port: port,
        isOnline: isReachable,
        lastSeen: isReachable ? new Date() : new Date(0),
        isManuallyAdded: true,
      };
      
      console.log('📝 Creating device:', {
        name: newDevice.name,
        ip: newDevice.ip,
        port: newDevice.port,
        verified: isVerified,
        reachable: isReachable,
      });
      
      const updatedDevices = [...devices, newDevice];
      setDevices(updatedDevices);
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

  // Update device status with enhanced checking
  const updateDeviceStatus = useCallback(async () => {
    if (devices.length === 0) {
      console.log('📊 No devices to update status for');
      return;
    }
    
    console.log(`📊 Updating status for ${devices.length} devices...`);
    
    const updatedDevices = await Promise.all(
      devices.map(async (device) => {
        try {
          console.log(`🔄 Checking ${device.name} (${device.ip}:${device.port})`);
          
          const result = await verifyRVolutionDevice(device.ip, device.port);
          const isOnline = result.isRVolution;
          
          if (isOnline) {
            console.log(`✅ ${device.name} is online and verified`);
          } else {
            // If not verified as R_VOLUTION, check basic connectivity
            const isReachable = await checkDeviceReachability(device.ip, device.port);
            console.log(`${isReachable ? '🔗' : '❌'} ${device.name} is ${isReachable ? 'reachable but not verified' : 'offline'}`);
          }
          
          return {
            ...device,
            isOnline,
            lastSeen: isOnline ? new Date() : device.lastSeen,
            name: result.deviceName || device.name,
          };
        } catch (error) {
          console.log(`❌ ${device.name} status check failed:`, error.message);
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
    console.log(`📊 Status update completed: ${onlineCount}/${updatedDevices.length} devices online`);
  }, [devices, saveDevices, verifyRVolutionDevice, checkDeviceReachability]);

  // Network diagnostic function
  const runNetworkDiagnostic = useCallback(async (targetIP?: string) => {
    console.log('🔧 === NETWORK DIAGNOSTIC STARTED ===');
    
    try {
      const networkBases = await getLocalNetworkInfo();
      console.log('🌐 Network ranges to test:', networkBases);
      
      if (targetIP) {
        console.log(`🎯 Testing specific IP: ${targetIP}`);
        const deviceInfo = await getDeviceInfo(targetIP, 80);
        console.log('📋 Device info:', deviceInfo);
        return deviceInfo;
      }
      
      // Test a few common IPs in each range
      const testIPs = [];
      for (const base of networkBases.slice(0, 2)) { // Test first 2 ranges
        testIPs.push(`${base}.1`, `${base}.2`, `${base}.10`, `${base}.100`);
      }
      
      console.log('🧪 Testing sample IPs:', testIPs);
      
      const results = await Promise.all(
        testIPs.map(async (ip) => {
          const info = await getDeviceInfo(ip, 80);
          console.log(`📋 ${ip}:`, info);
          return info;
        })
      );
      
      const reachableDevices = results.filter(r => r.reachable);
      console.log(`📊 Diagnostic complete: ${reachableDevices.length}/${testIPs.length} test IPs reachable`);
      
      return results;
      
    } catch (error) {
      console.log('❌ Network diagnostic failed:', error);
      throw error;
    } finally {
      console.log('🔧 === NETWORK DIAGNOSTIC FINISHED ===');
    }
  }, [getLocalNetworkInfo, getDeviceInfo]);

  useEffect(() => {
    loadSavedDevices();
  }, [loadSavedDevices]);

  return {
    devices,
    isScanning,
    scanProgress,
    networkInfo,
    scanNetwork,
    addDeviceManually,
    removeDevice,
    updateDeviceStatus,
    verifyRVolutionDevice,
    checkDeviceReachability,
    getDeviceInfo,
    runNetworkDiagnostic,
  };
};
