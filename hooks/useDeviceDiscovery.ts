
import { useState, useEffect, useCallback } from 'react';
import { RVolutionDevice, NetworkScanResult } from '../types/Device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEY = 'rvolution_devices';
const SCAN_TIMEOUT = 8000; // Increased timeout for better reliability
const TARGET_DEVICE_NAME = 'R_VOLUTION';
const CONCURRENT_REQUESTS = 10; // Reduced for better stability

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
    try {
      const savedDevices = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedDevices) {
        const parsedDevices = JSON.parse(savedDevices);
        
        // Convert lastSeen strings back to Date objects
        const devicesWithDates = parsedDevices.map((device: any) => ({
          ...device,
          lastSeen: device.lastSeen ? new Date(device.lastSeen) : new Date(0),
        }));
        
        setDevices(devicesWithDates);
        console.log('📱 Loaded saved devices:', devicesWithDates.length);
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

  // Test multiple ports for R_VOLUTION devices
  const testMultiplePorts = useCallback(async (ip: string): Promise<{port: number, response: any} | null> => {
    const commonPorts = [80, 8080, 8000, 3000, 5000, 9000];
    
    for (const port of commonPorts) {
      try {
        console.log(`   Testing port ${port} on ${ip}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`http://${ip}:${port}/`, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Accept': 'application/json, text/plain, text/html, */*',
            'User-Agent': 'R_VOLUTION-Remote/1.0',
            'Cache-Control': 'no-cache',
          },
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          console.log(`   ✅ Port ${port} responded with status ${response.status}`);
          return { port, response };
        }
        
      } catch (error) {
        // Continue to next port
        console.log(`   ❌ Port ${port} failed: ${error.message}`);
      }
    }
    
    return null;
  }, []);

  // Enhanced device verification with multiple strategies
  const verifyRVolutionDevice = useCallback(async (ip: string, port: number = 80): Promise<{
    isRVolution: boolean;
    deviceName?: string;
    responseData?: any;
    endpoint?: string;
    actualPort?: number;
  }> => {
    console.log(`🔍 Verifying R_VOLUTION device at ${ip}:${port}`);
    
    try {
      // First, try the specified port
      let testPort = port;
      let workingResponse = null;
      
      // If port 80 fails, try other common ports
      if (port === 80) {
        const portTest = await testMultiplePorts(ip);
        if (portTest) {
          testPort = portTest.port;
          workingResponse = portTest.response;
          console.log(`   Found working port: ${testPort}`);
        }
      }
      
      if (!workingResponse) {
        // Try the original port with longer timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), SCAN_TIMEOUT);

        try {
          workingResponse = await fetch(`http://${ip}:${testPort}/`, {
            method: 'GET',
            signal: controller.signal,
            headers: {
              'Accept': 'application/json, text/plain, text/html, */*',
              'User-Agent': 'R_VOLUTION-Remote/1.0',
              'Cache-Control': 'no-cache',
            },
          });
          clearTimeout(timeoutId);
        } catch (fetchError) {
          clearTimeout(timeoutId);
          console.log(`❌ No response from ${ip}:${testPort}`);
          return { isRVolution: false };
        }
      }

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
          console.log(`   Testing ${ip}:${testPort}${endpoint}`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), SCAN_TIMEOUT);
          
          const response = await fetch(`http://${ip}:${testPort}${endpoint}`, {
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
              
              console.log(`✅ R_VOLUTION device confirmed at ${ip}:${testPort}${endpoint}`);
              console.log(`   Device name: ${deviceName}`);
              
              return { 
                isRVolution: true, 
                deviceName,
                responseData,
                endpoint,
                actualPort: testPort
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

      console.log(`❌ No R_VOLUTION device found at ${ip}:${testPort}`);
      return { isRVolution: false, actualPort: testPort };
      
    } catch (error) {
      console.log(`❌ Verification failed for ${ip}:${port}:`, error.message);
      return { isRVolution: false };
    }
  }, [testMultiplePorts]);

  // Check basic connectivity to an IP/port with retry logic
  const checkDeviceReachability = useCallback(async (ip: string, port: number = 80, retries: number = 2): Promise<boolean> => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        console.log(`🔗 Testing connectivity to ${ip}:${port} (attempt ${attempt + 1}/${retries + 1})`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        
        const response = await fetch(`http://${ip}:${port}/`, {
          method: 'HEAD', // Use HEAD for faster response
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        const isReachable = response.status < 500; // Accept any response that's not a server error
        console.log(`${isReachable ? '✅' : '❌'} ${ip}:${port} is ${isReachable ? 'reachable' : 'unreachable'} (status: ${response.status})`);
        return isReachable;
        
      } catch (error) {
        console.log(`❌ ${ip}:${port} attempt ${attempt + 1} failed:`, error.message);
        if (attempt < retries) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    console.log(`❌ ${ip}:${port} is unreachable after ${retries + 1} attempts`);
    return false;
  }, []);

  // Get device info (for diagnostics)
  const getDeviceInfo = useCallback(async (ip: string, port: number = 80): Promise<any> => {
    try {
      const result = await verifyRVolutionDevice(ip, port);
      const reachable = await checkDeviceReachability(ip, result.actualPort || port);
      
      return {
        ip,
        port: result.actualPort || port,
        isRVolution: result.isRVolution,
        deviceName: result.deviceName,
        responseData: result.responseData,
        endpoint: result.endpoint,
        reachable,
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
  }, [verifyRVolutionDevice, checkDeviceReachability]);

  // Scan a batch of IPs concurrently with improved error handling
  const scanIPBatch = useCallback(async (baseIP: string, startRange: number, endRange: number): Promise<RVolutionDevice[]> => {
    const promises: Promise<RVolutionDevice | null>[] = [];
    
    for (let i = startRange; i <= endRange; i++) {
      const ip = `${baseIP}.${i}`;
      
      const promise = verifyRVolutionDevice(ip, 80).then(async (result) => {
        if (result.isRVolution) {
          // Check if device already exists
          const existingDevice = devices.find(d => d.ip === ip);
          if (!existingDevice) {
            console.log(`🎉 New R_VOLUTION device discovered: ${result.deviceName} at ${ip}:${result.actualPort || 80}`);
            return {
              id: `auto_${ip}_${Date.now()}`,
              name: result.deviceName || `${TARGET_DEVICE_NAME} (${ip})`,
              ip: ip,
              port: result.actualPort || 80,
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

  // Enhanced network scanning with better progress tracking
  const scanNetwork = useCallback(async () => {
    setIsScanning(true);
    setScanProgress(0);
    
    try {
      console.log('🚀 Starting enhanced R_VOLUTION device discovery...');
      console.log(`🎯 Target device name: ${TARGET_DEVICE_NAME}`);
      console.log(`🔌 Target ports: 80, 8080, 8000, 3000, 5000, 9000`);
      console.log(`⏱️  Timeout: ${SCAN_TIMEOUT}ms per request`);
      
      const networkBases = await getLocalNetworkInfo();
      const foundDevices: RVolutionDevice[] = [];
      let totalProgress = 0;
      const totalNetworks = networkBases.length;
      
      console.log(`🌐 Scanning ${totalNetworks} network ranges...`);
      
      // Scan each network base
      for (let networkIndex = 0; networkIndex < networkBases.length; networkIndex++) {
        const baseIP = networkBases[networkIndex];
        console.log(`📡 Scanning network ${baseIP}.x (${networkIndex + 1}/${totalNetworks})`);
        
        const batchSize = CONCURRENT_REQUESTS; // Use configured batch size
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
        console.log(`   4. Try different ports (8080, 8000, 3000, etc.)`);
        console.log(`   5. Try manual addition with known IP address`);
        console.log(`   6. Check device documentation for network settings`);
        console.log(`   7. Verify firewall settings on the device`);
        console.log(`   8. Check if the device uses HTTPS instead of HTTP`);
      }
      
    } catch (error) {
      console.log('❌ Network discovery failed:', error);
    } finally {
      setIsScanning(false);
      setScanProgress(0);
    }
  }, [devices, saveDevices, getLocalNetworkInfo, scanIPBatch]);

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
      
      // Test basic connectivity first with retry
      const isReachable = await checkDeviceReachability(ip, port, 3);
      console.log(`🔗 Device reachability: ${isReachable ? 'YES' : 'NO'}`);
      
      // Try to verify as R_VOLUTION device
      console.log('🎵 Verifying as R_VOLUTION device...');
      const verificationResult = await verifyRVolutionDevice(ip, port);
      
      let deviceName = customName || `${TARGET_DEVICE_NAME} (${ip})`;
      let isVerified = verificationResult.isRVolution;
      let actualPort = verificationResult.actualPort || port;
      
      if (isVerified) {
        deviceName = verificationResult.deviceName || deviceName;
        console.log(`✅ Device verified as R_VOLUTION: ${deviceName} on port ${actualPort}`);
      } else if (isReachable) {
        console.log(`⚠️  Device is reachable but not verified as R_VOLUTION`);
        console.log(`   Adding anyway as manual device`);
      } else {
        console.log(`❌ Device is not reachable`);
        console.log(`   Adding anyway as manual device (may be offline)`);
      }
      
      const newDevice: RVolutionDevice = {
        id: `manual_${ip}_${actualPort}_${Date.now()}`,
        name: deviceName,
        ip: ip,
        port: actualPort,
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
            port: result.actualPort || device.port, // Update port if different one was found
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

  // Enhanced network diagnostic function
  const runNetworkDiagnostic = useCallback(async (targetIP?: string) => {
    console.log('🔧 === ENHANCED NETWORK DIAGNOSTIC STARTED ===');
    
    try {
      const networkBases = await getLocalNetworkInfo();
      console.log('🌐 Network ranges to test:', networkBases);
      
      if (targetIP) {
        console.log(`🎯 Testing specific IP: ${targetIP}`);
        
        // Test multiple ports on the target IP
        console.log('🔌 Testing multiple ports...');
        const portTest = await testMultiplePorts(targetIP);
        
        if (portTest) {
          console.log(`✅ Found working port ${portTest.port} on ${targetIP}`);
          const deviceInfo = await getDeviceInfo(targetIP, portTest.port);
          console.log('📋 Device info:', deviceInfo);
          return deviceInfo;
        } else {
          console.log(`❌ No working ports found on ${targetIP}`);
          return {
            ip: targetIP,
            reachable: false,
            error: 'No working ports found'
          };
        }
      }
      
      // Test a few common IPs in each range
      const testIPs = [];
      for (const base of networkBases.slice(0, 3)) { // Test first 3 ranges
        testIPs.push(`${base}.1`, `${base}.2`, `${base}.10`, `${base}.100`, `${base}.254`);
      }
      
      console.log('🧪 Testing sample IPs:', testIPs);
      
      const results = await Promise.all(
        testIPs.map(async (ip) => {
          console.log(`🔍 Testing ${ip}...`);
          
          // First try port discovery
          const portTest = await testMultiplePorts(ip);
          if (portTest) {
            const info = await getDeviceInfo(ip, portTest.port);
            console.log(`📋 ${ip}:${portTest.port}:`, info);
            return info;
          } else {
            // Try default port 80
            const info = await getDeviceInfo(ip, 80);
            console.log(`📋 ${ip}:80:`, info);
            return info;
          }
        })
      );
      
      const reachableDevices = results.filter(r => r.reachable);
      const rvolutionDevices = results.filter(r => r.isRVolution);
      
      console.log(`📊 Diagnostic complete:`);
      console.log(`   ${reachableDevices.length}/${testIPs.length} test IPs reachable`);
      console.log(`   ${rvolutionDevices.length} R_VOLUTION devices found`);
      
      if (rvolutionDevices.length > 0) {
        console.log('🎉 R_VOLUTION devices found:');
        rvolutionDevices.forEach(device => {
          console.log(`   🎵 ${device.deviceName || 'Unknown'} at ${device.ip}:${device.port}`);
        });
      }
      
      return results;
      
    } catch (error) {
      console.log('❌ Network diagnostic failed:', error);
      throw error;
    } finally {
      console.log('🔧 === ENHANCED NETWORK DIAGNOSTIC FINISHED ===');
    }
  }, [getLocalNetworkInfo, getDeviceInfo, testMultiplePorts]);

  // Test a specific IP address (for manual testing)
  const testSpecificIP = useCallback(async (ip: string, port?: number) => {
    console.log(`🧪 === TESTING SPECIFIC IP: ${ip} ===`);
    
    try {
      // Test multiple ports if no specific port provided
      if (!port) {
        console.log('🔌 Testing multiple ports...');
        const portTest = await testMultiplePorts(ip);
        
        if (portTest) {
          console.log(`✅ Found working port ${portTest.port}`);
          const deviceInfo = await getDeviceInfo(ip, portTest.port);
          console.log('📋 Device info:', deviceInfo);
          return deviceInfo;
        } else {
          console.log('❌ No working ports found');
          return {
            ip,
            reachable: false,
            error: 'No working ports found'
          };
        }
      } else {
        // Test specific port
        console.log(`🔌 Testing port ${port}...`);
        const deviceInfo = await getDeviceInfo(ip, port);
        console.log('📋 Device info:', deviceInfo);
        return deviceInfo;
      }
      
    } catch (error) {
      console.log('❌ IP test failed:', error);
      throw error;
    } finally {
      console.log(`🧪 === IP TEST FINISHED ===`);
    }
  }, [getDeviceInfo, testMultiplePorts]);

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
    testSpecificIP,
  };
};
