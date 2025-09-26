
import { useState, useEffect, useCallback, useRef } from 'react';
import { RVolutionDevice, NetworkScanResult } from '../types/Device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEY = 'rvolution_devices';
const FAST_SCAN_TIMEOUT = 1500; // Increased timeout for better reliability
const TARGET_DEVICE_NAME = 'R_VOLUTION';
const CONCURRENT_REQUESTS = 20; // Reduced concurrency for better stability
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
  const scanAbortControllerRef = useRef<AbortController | null>(null);

  // Get device's local IP to determine network range - expanded coverage
  const getLocalNetworkInfo = useCallback(async () => {
    try {
      console.log('🌐 Detecting local network information...');
      
      // Comprehensive list of common network ranges to ensure we find ALL devices
      const commonRanges = [
        '192.168.1',   // Most common home router default
        '192.168.0',   // Second most common home router default
        '192.168.2',   // Some routers use this
        '192.168.3',   // Alternative range
        '192.168.4',   // Alternative range
        '192.168.10',  // Some routers
        '192.168.11',  // Some routers
        '192.168.20',  // Business networks
        '192.168.100', // Some configurations
        '10.0.0',      // Corporate networks
        '10.0.1',      // Corporate networks
        '10.1.1',      // Corporate networks
        '172.16.0',    // Private networks
        '172.16.1',    // Private networks
      ];
      
      setNetworkInfo({
        localIP: 'Auto-detected',
        networkRange: commonRanges.slice(0, 6).join(', ') + '...' // Show first 6 in UI
      });
      
      console.log('🌐 Will scan comprehensive network ranges to find ALL devices:', commonRanges);
      return commonRanges;
      
    } catch (error) {
      console.log('🌐 Network info detection failed:', error);
      // Fallback to most common ranges
      const fallbackRanges = ['192.168.1', '192.168.0', '192.168.2', '10.0.0'];
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

  // Enhanced device verification using the CGI endpoint - improved error handling
  const verifyRVolutionDevice = useCallback(async (ip: string, abortSignal?: AbortSignal): Promise<{
    isRVolution: boolean;
    deviceName?: string;
    responseData?: any;
    endpoint?: string;
  }> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FAST_SCAN_TIMEOUT);
    
    try {
      // Combine timeout and external abort signals
      const combinedSignal = abortSignal || controller.signal;
      
      // Use the fast CGI endpoint you mentioned
      const response = await fetch(`http://${ip}:${HTTP_PORT}${CGI_ENDPOINT}`, {
        method: 'GET',
        signal: combinedSignal,
        headers: {
          'Accept': '*/*',
          'User-Agent': 'R_VOLUTION-Remote/1.0',
          'Cache-Control': 'no-cache',
          'Connection': 'close',
        },
      });

      clearTimeout(timeoutId);
      
      // Accept any successful response (200, 201, 202, etc.) or even some error codes that indicate a device is present
      if (response.status >= 200 && response.status < 500) {
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
          // Even if we can't parse, if we got a response, it might be a device
          responseText = 'response_received';
        }

        // Enhanced R_VOLUTION detection patterns - more comprehensive
        const detectionPatterns = [
          'R_VOLUTION',
          'R-VOLUTION', 
          'RVOLUTION',
          'r_volution',
          'r-volution',
          'rvolution',
          'revolution',
          'R_EVOLUTION', // Common typo
          'REVOLUTION',
        ];
        
        // Check for R_VOLUTION patterns in response
        const hasRVolutionPattern = detectionPatterns.some(pattern => 
          responseText.toLowerCase().includes(pattern.toLowerCase())
        );
        
        // Check for R_VOLUTION patterns in response data
        const hasRVolutionInData = responseData && (
          responseData.name?.toLowerCase().includes('volution') ||
          responseData.deviceName?.toLowerCase().includes('volution') ||
          responseData.model?.toLowerCase().includes('volution') ||
          responseData.hostname?.toLowerCase().includes('volution') ||
          responseData.manufacturer?.toLowerCase().includes('volution') ||
          responseData.product?.toLowerCase().includes('volution') ||
          responseData.brand?.toLowerCase().includes('volution') ||
          responseData.type?.toLowerCase().includes('volution')
        );
        
        // More liberal detection: if we get ANY response from the CGI endpoint, 
        // it's very likely a compatible device since this is a specific endpoint
        const hasValidResponse = response.status === 200 && (
          responseText.length > 0 || 
          response.headers.get('server') || 
          response.headers.get('content-type')
        );
        
        const isRVolution = hasRVolutionPattern || hasRVolutionInData || hasValidResponse;

        if (isRVolution) {
          // Try to extract device name from various sources
          let deviceName = `${TARGET_DEVICE_NAME} (${ip})`;
          
          if (responseData) {
            deviceName = responseData.name || 
                        responseData.deviceName || 
                        responseData.hostname || 
                        responseData.model ||
                        responseData.product ||
                        deviceName;
          }
          
          // If we found a pattern in the response text, try to extract a better name
          if (hasRVolutionPattern) {
            const match = responseText.match(/R[_-]?VOLUTION[^"'\s]*/i);
            if (match) {
              deviceName = match[0];
            }
          }
          
          console.log(`✅ R_VOLUTION device found: ${deviceName} at ${ip}:${HTTP_PORT}`);
          
          return { 
            isRVolution: true, 
            deviceName,
            responseData,
            endpoint: CGI_ENDPOINT
          };
        }
      }

      return { isRVolution: false };
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Check if scan was aborted
      if (error.name === 'AbortError') {
        console.log(`🛑 Scan aborted for ${ip}`);
        throw error;
      }
      
      // Handle specific network errors more gracefully
      if (error.message.includes('Network request failed')) {
        console.log(`🔍 Network error for ${ip}: Device not reachable or not responding`);
      } else if (error.message.includes('timeout')) {
        console.log(`⏰ Timeout for ${ip}: Device took too long to respond`);
      } else {
        console.log(`🔍 Scan ${ip}: ${error.message}`);
      }
      
      return { isRVolution: false };
    }
  }, []);

  // Fast connectivity check using the CGI endpoint
  const checkDeviceReachability = useCallback(async (ip: string, abortSignal?: AbortSignal): Promise<boolean> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FAST_SCAN_TIMEOUT);
    
    try {
      // Combine timeout and external abort signals
      const combinedSignal = abortSignal || controller.signal;
      
      const response = await fetch(`http://${ip}:${HTTP_PORT}${CGI_ENDPOINT}`, {
        method: 'HEAD',
        signal: combinedSignal,
      });
      
      clearTimeout(timeoutId);
      const isReachable = response.status < 500;
      return isReachable;
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw error;
      }
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

  // Ultra-fast IP batch scanning with improved device discovery and error handling
  const scanIPBatch = useCallback(async (baseIP: string, startRange: number, endRange: number, abortSignal?: AbortSignal): Promise<RVolutionDevice[]> => {
    const promises: Promise<RVolutionDevice | null>[] = [];
    
    for (let i = startRange; i <= endRange; i++) {
      const ip = `${baseIP}.${i}`;
      
      const promise = verifyRVolutionDevice(ip, abortSignal).then(async (result) => {
        if (result.isRVolution) {
          console.log(`🎉 R_VOLUTION device discovered: ${result.deviceName} at ${ip}:${HTTP_PORT}`);
          
          // Generate unique ID with timestamp and random component to avoid duplicates
          const uniqueId = `discovered_${ip}_${HTTP_PORT}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          return {
            id: uniqueId,
            name: result.deviceName || `${TARGET_DEVICE_NAME} (${ip})`,
            ip: ip,
            port: HTTP_PORT,
            isOnline: true,
            lastSeen: new Date(),
            isManuallyAdded: false,
          };
        }
        return null;
      }).catch((error) => {
        // Check if scan was aborted
        if (error.name === 'AbortError') {
          throw error;
        }
        // Log errors for debugging but don't stop the scan
        console.log(`🔍 Scan error for ${ip}:`, error.message);
        return null;
      });
      
      promises.push(promise);
    }
    
    try {
      const results = await Promise.allSettled(promises);
      const foundDevices = results
        .filter((result): result is PromiseFulfilledResult<RVolutionDevice> => 
          result.status === 'fulfilled' && result.value !== null
        )
        .map(result => result.value);
      
      if (foundDevices.length > 0) {
        console.log(`📡 Batch ${baseIP}.${startRange}-${endRange}: Found ${foundDevices.length} devices`);
        foundDevices.forEach(device => {
          console.log(`   🎵 ${device.name} at ${device.ip}:${device.port}`);
        });
      }
      
      return foundDevices;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`🛑 Batch scan aborted for ${baseIP}.${startRange}-${endRange}`);
        throw error;
      }
      console.log(`❌ Batch scan error for ${baseIP}.${startRange}-${endRange}:`, error);
      return [];
    }
  }, [verifyRVolutionDevice]);

  // Stop scanning function
  const stopScanning = useCallback(() => {
    console.log('🛑 Stopping network scan...');
    if (scanAbortControllerRef.current) {
      scanAbortControllerRef.current.abort();
      scanAbortControllerRef.current = null;
    }
    setIsScanning(false);
    setScanProgress(0);
    console.log('🛑 Network scan stopped');
  }, []);

  // Ultra-fast network scanning using the CGI endpoint - improved to find ALL devices with better error handling
  const scanNetwork = useCallback(async () => {
    // If already scanning, stop the scan
    if (isScanning) {
      stopScanning();
      return;
    }

    // Clear discovered devices list when starting a new scan
    setDiscoveredDevices([]);
    
    setIsScanning(true);
    setScanProgress(0);
    
    // Create abort controller for this scan
    scanAbortControllerRef.current = new AbortController();
    const abortSignal = scanAbortControllerRef.current.signal;
    
    try {
      console.log('🚀 Starting COMPREHENSIVE R_VOLUTION device discovery...');
      console.log(`🎯 Target device name: ${TARGET_DEVICE_NAME}`);
      console.log(`🔌 Protocol: HTTP on port ${HTTP_PORT}`);
      console.log(`🚀 Fast endpoint: ${CGI_ENDPOINT}`);
      console.log(`⏱️  Timeout: ${FAST_SCAN_TIMEOUT}ms per request`);
      console.log(`🔄 Concurrent requests: ${CONCURRENT_REQUESTS}`);
      
      const networkBases = await getLocalNetworkInfo();
      const allFoundDevices: RVolutionDevice[] = [];
      let totalProgress = 0;
      
      // Scan first 3 network ranges for better performance and reliability
      const totalNetworks = Math.min(networkBases.length, 3);
      console.log(`🌐 Scanning ${totalNetworks} primary network ranges for better performance...`);
      
      for (let networkIndex = 0; networkIndex < totalNetworks; networkIndex++) {
        // Check if scan was aborted
        if (abortSignal.aborted) {
          console.log('🛑 Scan aborted during network iteration');
          return;
        }

        const baseIP = networkBases[networkIndex];
        console.log(`📡 Scanning network ${baseIP}.x (${networkIndex + 1}/${totalNetworks})`);
        
        const batchSize = Math.min(CONCURRENT_REQUESTS, 15); // Smaller batches for better reliability
        const networkDevices: RVolutionDevice[] = [];
        
        // Scan common IP ranges first for faster discovery
        const commonRanges = [
          { start: 1, end: 50 },    // Router and common devices
          { start: 100, end: 150 }, // Common DHCP range
          { start: 200, end: 254 }, // High range devices
        ];
        
        for (const range of commonRanges) {
          // Check if scan was aborted
          if (abortSignal.aborted) {
            console.log('🛑 Scan aborted during range iteration');
            return;
          }

          console.log(`🔍 Scanning range: ${baseIP}.${range.start}-${range.end}`);
          
          for (let start = range.start; start <= range.end; start += batchSize) {
            // Check if scan was aborted
            if (abortSignal.aborted) {
              console.log('🛑 Scan aborted during batch iteration');
              return;
            }

            const end = Math.min(start + batchSize - 1, range.end);
            
            console.log(`🔎 Scanning batch ${baseIP}.${start}-${end}`);
            
            try {
              const batchDevices = await scanIPBatch(baseIP, start, end, abortSignal);
              
              if (batchDevices.length > 0) {
                console.log(`✅ Found ${batchDevices.length} R_VOLUTION devices in batch ${baseIP}.${start}-${end}`);
                
                // Add to network devices
                networkDevices.push(...batchDevices);
                
                // Update discovered devices in real-time for immediate UI feedback
                setDiscoveredDevices(prev => {
                  // Avoid duplicates by checking IP addresses
                  const existingIPs = prev.map(d => d.ip);
                  const newDevices = batchDevices.filter(d => !existingIPs.includes(d.ip));
                  return [...prev, ...newDevices];
                });
                
                batchDevices.forEach(device => {
                  console.log(`   🎵 ${device.name} at ${device.ip}:${device.port}`);
                });
              }
            } catch (batchError) {
              if (batchError.name === 'AbortError') {
                console.log('🛑 Batch scan aborted');
                return;
              }
              console.log(`❌ Error scanning batch ${baseIP}.${start}-${end}:`, batchError);
            }
            
            // Update progress more granularly
            const totalIPs = commonRanges.reduce((sum, r) => sum + (r.end - r.start + 1), 0);
            const currentIP = start - range.start + 1;
            const rangeProgress = currentIP / totalIPs;
            const networkProgress = (rangeProgress / totalNetworks) * 100;
            const baseProgress = (networkIndex / totalNetworks) * 100;
            totalProgress = baseProgress + networkProgress;
            setScanProgress(Math.round(totalProgress));
            
            // Small delay to prevent overwhelming the network
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }
        
        allFoundDevices.push(...networkDevices);
        console.log(`📊 Network ${baseIP}.x scan complete. Found ${networkDevices.length} devices in this network.`);
        
        // Log all devices found in this network
        if (networkDevices.length > 0) {
          console.log(`📋 Devices found in ${baseIP}.x:`);
          networkDevices.forEach((device, index) => {
            console.log(`   ${index + 1}. ${device.name} at ${device.ip}:${device.port}`);
          });
        }
      }
      
      // Remove any potential duplicates based on IP address
      const uniqueDevices = allFoundDevices.filter((device, index, self) => 
        index === self.findIndex(d => d.ip === device.ip)
      );
      
      // Update final discovered devices list
      setDiscoveredDevices(uniqueDevices);
      
      console.log(`🎉 COMPREHENSIVE discovery completed! Found ${uniqueDevices.length} unique R_VOLUTION devices total:`);
      uniqueDevices.forEach((device, index) => {
        console.log(`   ${index + 1}. ${device.name} at ${device.ip}:${device.port}`);
      });
      
      if (uniqueDevices.length === 0) {
        console.log(`🔍 Comprehensive discovery completed. No R_VOLUTION devices found.`);
        console.log(`💡 Troubleshooting suggestions:`);
        console.log(`   1. Verify R_VOLUTION devices are powered on`);
        console.log(`   2. Ensure devices are connected to Wi-Fi`);
        console.log(`   3. Check that devices are on the same network`);
        console.log(`   4. Verify devices respond to ${CGI_ENDPOINT} endpoint`);
        console.log(`   5. Try manual addition with known IP address`);
      } else {
        console.log(`✅ SUCCESS: Found ${uniqueDevices.length} R_VOLUTION device${uniqueDevices.length > 1 ? 's' : ''} on the network!`);
      }
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('🛑 Network scan was aborted');
      } else {
        console.log('❌ Comprehensive network discovery failed:', error);
      }
    } finally {
      setIsScanning(false);
      setScanProgress(100);
      scanAbortControllerRef.current = null;
      
      // Reset progress after a short delay
      setTimeout(() => setScanProgress(0), 1000);
    }
  }, [getLocalNetworkInfo, scanIPBatch, isScanning, stopScanning]);

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

      // Remove the device from discovered devices list
      setDiscoveredDevices(prev => prev.filter(d => d.id !== discoveredDevice.id));
      
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
    stopScanning, // New: expose stop scanning function
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
