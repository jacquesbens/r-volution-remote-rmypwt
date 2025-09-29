
import { useState, useEffect, useCallback, useRef } from 'react';
import { RVolutionDevice, NetworkScanResult } from '../types/Device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEY = 'rvolution_devices';
const FAST_SCAN_TIMEOUT = 1200; // Slightly longer timeout for different networks
const TARGET_DEVICE_NAME = 'R_volution';
const CONCURRENT_REQUESTS = 30; // Reduced for better reliability across networks
const HTTP_PORT = 80;
const CGI_ENDPOINT = '/cgi-bin/do?';

export const useDeviceDiscovery = () => {
  const [devices, setDevices] = useState<RVolutionDevice[]>([]);
  const [discoveredDevices, setDiscoveredDevices] = useState<RVolutionDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [networkInfo, setNetworkInfo] = useState<{
    localIP?: string;
    networkRange?: string;
    detectedRanges?: string[];
    lastScanTime?: Date;
    scanHistory?: Array<{
      timestamp: Date;
      foundDevices: number;
      networkRanges: string[];
    }>;
  }>({});
  
  const devicesLoadedRef = useRef(false);
  const initializingRef = useRef(false);

  // Enhanced network detection for different network environments
  const getLocalNetworkInfo = useCallback(async () => {
    try {
      console.log('🌐 Enhanced network detection for cross-network discovery...');
      
      // Comprehensive list of network ranges including enterprise and mobile hotspot ranges
      const comprehensiveRanges = [
        // Home networks
        '192.168.1',   // Most common home router default
        '192.168.0',   // Second most common home router default
        '192.168.2',   // Alternative home range
        '192.168.3',   // Alternative home range
        '192.168.4',   // Alternative home range
        '192.168.10',  // Some routers
        '192.168.11',  // Some routers
        '192.168.20',  // Business networks
        '192.168.100', // Some configurations
        
        // Corporate/Enterprise networks
        '10.0.0',      // Corporate networks
        '10.0.1',      // Corporate networks
        '10.1.1',      // Corporate networks
        '10.1.0',      // Corporate networks
        '10.10.0',     // Corporate networks
        '10.10.1',     // Corporate networks
        
        // Private networks (RFC 1918)
        '172.16.0',    // Private networks
        '172.16.1',    // Private networks
        '172.17.0',    // Docker networks
        '172.18.0',    // Docker networks
        
        // Mobile hotspot common ranges
        '192.168.43',  // Android hotspot default
        '192.168.137', // Windows hotspot default
        '172.20.10',   // iOS hotspot default
        
        // Additional enterprise ranges
        '10.0.10',
        '10.0.20',
        '10.1.10',
        '192.168.50',
        '192.168.88',  // MikroTik default
        '192.168.254', // Some routers
      ];
      
      // Try to detect current network by testing connectivity to common gateway IPs
      let detectedRanges: string[] = [];
      const gatewayTests = [
        '192.168.1.1',
        '192.168.0.1',
        '192.168.2.1',
        '10.0.0.1',
        '10.1.1.1',
        '172.16.0.1',
        '192.168.43.1',
        '192.168.137.1',
        '172.20.10.1',
      ];
      
      console.log('🔍 Testing gateway connectivity to detect current network...');
      const gatewayResults = await Promise.allSettled(
        gatewayTests.map(async (gateway) => {
          try {
            const response = await fetch(`http://${gateway}`, {
              method: 'HEAD',
              signal: AbortSignal.timeout(2000),
            });
            const range = gateway.substring(0, gateway.lastIndexOf('.'));
            console.log(`✅ Gateway ${gateway} responded - detected range: ${range}`);
            return range;
          } catch {
            return null;
          }
        })
      );
      
      // Extract successful gateway detections
      detectedRanges = gatewayResults
        .filter((result): result is PromiseFulfilledResult<string> => 
          result.status === 'fulfilled' && result.value !== null
        )
        .map(result => result.value);
      
      // If we detected current network ranges, prioritize them
      let prioritizedRanges: string[];
      if (detectedRanges.length > 0) {
        console.log(`🎯 Detected current network ranges: ${detectedRanges.join(', ')}`);
        // Put detected ranges first, then add other common ranges
        const remainingRanges = comprehensiveRanges.filter(range => !detectedRanges.includes(range));
        prioritizedRanges = [...detectedRanges, ...remainingRanges.slice(0, 15)]; // Limit total ranges
      } else {
        console.log('🌐 No specific network detected, using comprehensive range list');
        prioritizedRanges = comprehensiveRanges.slice(0, 20); // Limit for performance
      }
      
      setNetworkInfo({
        localIP: detectedRanges.length > 0 ? 'Detected' : 'Auto-scan',
        networkRange: prioritizedRanges.slice(0, 6).join(', ') + '...',
        detectedRanges,
        lastScanTime: new Date(),
      });
      
      console.log('🌐 Will scan prioritized network ranges:', prioritizedRanges);
      return prioritizedRanges;
      
    } catch (error) {
      console.log('🌐 Enhanced network detection failed:', error);
      // Fallback to most common ranges
      const fallbackRanges = [
        '192.168.1', '192.168.0', '192.168.2', '10.0.0', '10.0.1', 
        '172.16.0', '192.168.43', '192.168.137', '172.20.10'
      ];
      setNetworkInfo({
        localIP: 'Fallback',
        networkRange: fallbackRanges.slice(0, 4).join(', ') + '...',
        detectedRanges: [],
        lastScanTime: new Date(),
      });
      return fallbackRanges;
    }
  }, []);

  // Load saved devices with better web compatibility
  const loadSavedDevices = useCallback(async () => {
    if (devicesLoadedRef.current || initializingRef.current) {
      console.log('📱 Devices already loaded or loading, skipping...');
      return devices;
    }

    initializingRef.current = true;
    
    try {
      console.log(`📱 Loading saved devices from storage (Platform: ${Platform.OS})...`);
      
      let savedDevices = null;
      if (Platform.OS === 'web') {
        try {
          savedDevices = await AsyncStorage.getItem(STORAGE_KEY);
          console.log('📱 Web storage access successful');
        } catch (webError) {
          console.log('⚠️ Web storage access failed, using fallback:', webError);
          if (typeof window !== 'undefined' && window.localStorage) {
            try {
              savedDevices = window.localStorage.getItem(STORAGE_KEY);
              console.log('📱 Fallback to localStorage successful');
            } catch (localStorageError) {
              console.log('❌ localStorage fallback failed:', localStorageError);
            }
          }
        }
      } else {
        savedDevices = await AsyncStorage.getItem(STORAGE_KEY);
      }
      
      if (savedDevices) {
        const parsedDevices = JSON.parse(savedDevices);
        
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

  // Save devices with better web compatibility and verification
  const saveDevices = useCallback(async (devicesToSave: RVolutionDevice[], retryCount = 0) => {
    const maxRetries = 3;
    
    try {
      console.log(`💾 Saving devices to storage (Platform: ${Platform.OS}):`, devicesToSave.length);
      
      const validDevices = devicesToSave.filter(device => 
        device && 
        device.id && 
        device.name && 
        device.ip && 
        typeof device.port === 'number'
      );
      
      if (validDevices.length !== devicesToSave.length) {
        console.log(`⚠️ Filtered out ${devicesToSave.length - validDevices.length} invalid devices`);
      }
      
      const dataToSave = JSON.stringify(validDevices);
      
      if (Platform.OS === 'web') {
        try {
          await AsyncStorage.setItem(STORAGE_KEY, dataToSave);
          console.log('💾 Web AsyncStorage save successful');
        } catch (webError) {
          console.log('⚠️ Web AsyncStorage save failed, using fallback:', webError);
          if (typeof window !== 'undefined' && window.localStorage) {
            try {
              window.localStorage.setItem(STORAGE_KEY, dataToSave);
              console.log('💾 Fallback to localStorage successful');
            } catch (localStorageError) {
              console.log('❌ localStorage fallback failed:', localStorageError);
              throw localStorageError;
            }
          } else {
            throw new Error('No storage mechanism available');
          }
        }
      } else {
        await AsyncStorage.setItem(STORAGE_KEY, dataToSave);
      }
      
      console.log('💾 Devices saved to storage successfully');
      
      // Verification with retry logic
      await new Promise(resolve => setTimeout(resolve, 100));
      
      let verification = null;
      if (Platform.OS === 'web') {
        try {
          verification = await AsyncStorage.getItem(STORAGE_KEY);
        } catch (verifyError) {
          if (typeof window !== 'undefined' && window.localStorage) {
            verification = window.localStorage.getItem(STORAGE_KEY);
          }
        }
      } else {
        verification = await AsyncStorage.getItem(STORAGE_KEY);
      }
      
      if (!verification) {
        throw new Error('Storage verification failed - data not persisted');
      }
      
      const verifiedDevices = JSON.parse(verification);
      if (verifiedDevices.length !== validDevices.length) {
        throw new Error(`Storage verification failed - expected ${validDevices.length} devices, found ${verifiedDevices.length}`);
      }
      
      console.log('✅ Storage verification successful - devices properly persisted');
      
    } catch (error) {
      console.log(`❌ Error saving devices (attempt ${retryCount + 1}/${maxRetries}):`, error);
      
      if (retryCount < maxRetries - 1) {
        console.log(`🔄 Retrying save in ${(retryCount + 1) * 1000}ms...`);
        await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 1000));
        return saveDevices(devicesToSave, retryCount + 1);
      }
      
      throw error;
    }
  }, []);

  // Enhanced R_volution device verification with better cross-network detection
  const verifyRVolutionDevice = useCallback(async (ip: string): Promise<{
    isRVolution: boolean;
    deviceName?: string;
    responseData?: any;
    endpoint?: string;
    networkLatency?: number;
  }> => {
    try {
      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FAST_SCAN_TIMEOUT);
      
      const response = await fetch(`http://${ip}:${HTTP_PORT}${CGI_ENDPOINT}`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': '*/*',
          'User-Agent': 'R_VOLUTION-Remote/1.0',
          'Cache-Control': 'no-cache',
          'Connection': 'close',
        },
      });

      clearTimeout(timeoutId);
      const networkLatency = Date.now() - startTime;
      
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
          responseText = 'response_received';
        }

        // Enhanced detection patterns for R_volution devices
        const detectionPatterns = [
          'R_volution', 'R_VOLUTION', 'R-VOLUTION', 'RVOLUTION',
          'r_volution', 'r-volution', 'rvolution', 'revolution',
          'R_EVOLUTION', 'REVOLUTION', 'R-EVOLUTION',
          // Additional patterns that might be found in responses
          'volution', 'VOLUTION', 'media', 'player', 'streamer'
        ];
        
        const hasRVolutionPattern = detectionPatterns.some(pattern => 
          responseText.toLowerCase().includes(pattern.toLowerCase())
        );
        
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
        
        // More liberal detection for cross-network scenarios
        const hasValidResponse = response.status === 200 && (
          responseText.length > 0 || 
          response.headers.get('server') || 
          response.headers.get('content-type')
        );
        
        const isRVolution = hasRVolutionPattern || hasRVolutionInData || hasValidResponse;

        if (isRVolution) {
          let deviceName = `${TARGET_DEVICE_NAME} (${ip})`;
          
          if (responseData) {
            deviceName = responseData.name || 
                        responseData.deviceName || 
                        responseData.hostname || 
                        responseData.model ||
                        responseData.product ||
                        deviceName;
          }
          
          if (hasRVolutionPattern) {
            const match = responseText.match(/R[_-]?volution[^"'\s]*/i);
            if (match) {
              deviceName = match[0];
            }
          }
          
          console.log(`✅ R_volution device found: ${deviceName} at ${ip}:${HTTP_PORT} (${networkLatency}ms)`);
          
          return { 
            isRVolution: true, 
            deviceName,
            responseData,
            endpoint: CGI_ENDPOINT,
            networkLatency
          };
        }
      }

      return { isRVolution: false, networkLatency };
      
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.log(`🔍 Scan ${ip}: ${error.message}`);
      }
      return { isRVolution: false };
    }
  }, []);

  // Enhanced connectivity check with network diagnostics
  const checkDeviceReachability = useCallback(async (ip: string): Promise<{
    isReachable: boolean;
    latency?: number;
    error?: string;
  }> => {
    try {
      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FAST_SCAN_TIMEOUT);
      
      const response = await fetch(`http://${ip}:${HTTP_PORT}${CGI_ENDPOINT}`, {
        method: 'HEAD',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;
      const isReachable = response.status < 500;
      
      return { isReachable, latency };
      
    } catch (error) {
      return { 
        isReachable: false, 
        error: error.message 
      };
    }
  }, []);

  // Network diagnostic function for troubleshooting
  const runNetworkDiagnostic = useCallback(async (targetIP?: string) => {
    console.log('🔧 === NETWORK DIAGNOSTIC STARTED ===');
    
    try {
      const networkBases = await getLocalNetworkInfo();
      console.log('🌐 Network ranges to test:', networkBases);
      
      if (targetIP) {
        console.log(`🎯 Testing specific IP: ${targetIP}${CGI_ENDPOINT}`);
        
        const reachabilityResult = await checkDeviceReachability(targetIP);
        const verificationResult = await verifyRVolutionDevice(targetIP);
        
        const diagnosticResult = {
          ip: targetIP,
          port: HTTP_PORT,
          isReachable: reachabilityResult.isReachable,
          latency: reachabilityResult.latency,
          isRVolution: verificationResult.isRVolution,
          deviceName: verificationResult.deviceName,
          error: reachabilityResult.error,
          networkLatency: verificationResult.networkLatency,
        };
        
        console.log('📋 Diagnostic result:', diagnosticResult);
        return diagnosticResult;
      }
      
      // Test sample IPs from detected ranges for general diagnostic
      const testIPs = [];
      const primaryRange = networkBases[0];
      testIPs.push(`${primaryRange}.1`, `${primaryRange}.2`, `${primaryRange}.10`, `${primaryRange}.100`);
      
      console.log('🧪 Testing sample IPs for network diagnostic:', testIPs);
      
      const results = await Promise.all(
        testIPs.map(async (ip) => {
          console.log(`🔍 Testing ${ip}${CGI_ENDPOINT}...`);
          const reachabilityResult = await checkDeviceReachability(ip);
          const verificationResult = await verifyRVolutionDevice(ip);
          
          return {
            ip,
            port: HTTP_PORT,
            isReachable: reachabilityResult.isReachable,
            latency: reachabilityResult.latency,
            isRVolution: verificationResult.isRVolution,
            deviceName: verificationResult.deviceName,
            error: reachabilityResult.error,
          };
        })
      );
      
      const reachableDevices = results.filter(r => r.isReachable);
      const rvolutionDevices = results.filter(r => r.isRVolution);
      
      console.log(`📊 Network diagnostic complete:`);
      console.log(`   ${reachableDevices.length}/${testIPs.length} test IPs reachable`);
      console.log(`   ${rvolutionDevices.length} R_VOLUTION devices found`);
      
      return results;
      
    } catch (error) {
      console.log('❌ Network diagnostic failed:', error);
      throw error;
    } finally {
      console.log('🔧 === NETWORK DIAGNOSTIC FINISHED ===');
    }
  }, [getLocalNetworkInfo, checkDeviceReachability, verifyRVolutionDevice]);

  // Enhanced IP batch scanning with better error handling for different networks
  const scanIPBatch = useCallback(async (baseIP: string, startRange: number, endRange: number): Promise<RVolutionDevice[]> => {
    const promises: Promise<RVolutionDevice | null>[] = [];
    
    for (let i = startRange; i <= endRange; i++) {
      const ip = `${baseIP}.${i}`;
      
      const promise = verifyRVolutionDevice(ip).then(async (result) => {
        if (result.isRVolution) {
          console.log(`🎉 R_volution device discovered: ${result.deviceName} at ${ip}:${HTTP_PORT} (${result.networkLatency}ms)`);
          
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
        console.log(`🔍 Scan error for ${ip}:`, error.message);
        return null;
      });
      
      promises.push(promise);
    }
    
    const results = await Promise.all(promises);
    const foundDevices = results.filter((device): device is RVolutionDevice => device !== null);
    
    if (foundDevices.length > 0) {
      console.log(`📡 Batch ${baseIP}.${startRange}-${endRange}: Found ${foundDevices.length} devices`);
      foundDevices.forEach(device => {
        console.log(`   🎵 ${device.name} at ${device.ip}:${device.port}`);
      });
    }
    
    return foundDevices;
  }, [verifyRVolutionDevice]);

  // Enhanced network scanning optimized for cross-network discovery
  const scanNetwork = useCallback(async () => {
    setIsScanning(true);
    setScanProgress(0);
    
    console.log('🧹 Clearing previously discovered devices before starting new scan');
    setDiscoveredDevices([]);
    
    try {
      console.log('🚀 Starting ENHANCED cross-network R_volution device discovery...');
      console.log(`🎯 Target device name: ${TARGET_DEVICE_NAME}`);
      console.log(`🔌 Protocol: HTTP on port ${HTTP_PORT}`);
      console.log(`🚀 Endpoint: ${CGI_ENDPOINT}`);
      console.log(`⏱️  Timeout: ${FAST_SCAN_TIMEOUT}ms per request`);
      console.log(`🔄 Concurrent requests: ${CONCURRENT_REQUESTS}`);
      
      const networkBases = await getLocalNetworkInfo();
      const allFoundDevices: RVolutionDevice[] = [];
      let totalProgress = 0;
      
      const totalNetworks = Math.min(networkBases.length, 12); // Limit for performance
      console.log(`🌐 Enhanced scanning ${totalNetworks} prioritized network ranges...`);
      
      for (let networkIndex = 0; networkIndex < totalNetworks; networkIndex++) {
        const baseIP = networkBases[networkIndex];
        console.log(`📡 Scanning network ${baseIP}.x (${networkIndex + 1}/${totalNetworks})`);
        
        const batchSize = Math.min(CONCURRENT_REQUESTS, 20);
        const networkDevices: RVolutionDevice[] = [];
        
        // For cross-network scenarios, focus on common device IP ranges
        const commonRanges = [
          { start: 1, end: 10 },    // Router and infrastructure
          { start: 20, end: 50 },   // Common device range
          { start: 100, end: 150 }, // Common device range
          { start: 200, end: 254 }, // High range devices
        ];
        
        for (const range of commonRanges) {
          console.log(`🔍 Scanning range ${baseIP}.${range.start}-${range.end}`);
          
          for (let start = range.start; start <= range.end; start += batchSize) {
            const end = Math.min(start + batchSize - 1, range.end);
            
            try {
              const batchDevices = await scanIPBatch(baseIP, start, end);
              
              if (batchDevices.length > 0) {
                console.log(`✅ Found ${batchDevices.length} R_volution devices in batch ${baseIP}.${start}-${end}`);
                
                networkDevices.push(...batchDevices);
                
                setDiscoveredDevices(prev => {
                  const existingIPs = prev.map(d => d.ip);
                  const newDevices = batchDevices.filter(d => !existingIPs.includes(d.ip));
                  return [...prev, ...newDevices];
                });
                
                batchDevices.forEach(device => {
                  console.log(`   🎵 ${device.name} at ${device.ip}:${device.port}`);
                });
              }
            } catch (batchError) {
              console.log(`❌ Error scanning batch ${baseIP}.${start}-${end}:`, batchError);
            }
            
            // Update progress
            const rangeProgress = ((end - range.start + 1) / (range.end - range.start + 1));
            const networkProgress = (rangeProgress / (totalNetworks * commonRanges.length)) * 100;
            const baseProgress = ((networkIndex * commonRanges.length + commonRanges.indexOf(range)) / (totalNetworks * commonRanges.length)) * 100;
            totalProgress = baseProgress + networkProgress;
            setScanProgress(Math.round(totalProgress));
            
            // Small delay to prevent network overload
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }
        
        allFoundDevices.push(...networkDevices);
        console.log(`📊 Network ${baseIP}.x scan complete. Found ${networkDevices.length} devices.`);
      }
      
      // Remove duplicates and update final list
      const uniqueDevices = allFoundDevices.filter((device, index, self) => 
        index === self.findIndex(d => d.ip === device.ip)
      );
      
      setDiscoveredDevices(uniqueDevices);
      
      // Update scan history
      setNetworkInfo(prev => ({
        ...prev,
        scanHistory: [
          ...(prev.scanHistory || []).slice(-4), // Keep last 5 scans
          {
            timestamp: new Date(),
            foundDevices: uniqueDevices.length,
            networkRanges: networkBases.slice(0, totalNetworks),
          }
        ]
      }));
      
      console.log(`🎉 ENHANCED cross-network discovery completed! Found ${uniqueDevices.length} unique R_volution devices:`);
      uniqueDevices.forEach((device, index) => {
        console.log(`   ${index + 1}. ${device.name} at ${device.ip}:${device.port}`);
      });
      
      if (uniqueDevices.length === 0) {
        console.log(`🔍 Cross-network discovery completed. No R_volution devices found.`);
        console.log(`💡 Troubleshooting suggestions for cross-network scenarios:`);
        console.log(`   1. Verify R_volution devices are powered on and connected to Wi-Fi`);
        console.log(`   2. Check if you're on the same network as your devices`);
        console.log(`   3. Try connecting to the same Wi-Fi network as your devices`);
        console.log(`   4. Check for network isolation or firewall restrictions`);
        console.log(`   5. Use manual addition with the device's IP address`);
        console.log(`   6. Check if your network blocks device discovery`);
      }
      
    } catch (error) {
      console.log('❌ Enhanced cross-network discovery failed:', error);
    } finally {
      setIsScanning(false);
      setScanProgress(100);
      
      setTimeout(() => setScanProgress(0), 1000);
    }
  }, [getLocalNetworkInfo, scanIPBatch]);

  // Add discovered device to saved devices
  const addDiscoveredDevice = useCallback(async (discoveredDevice: RVolutionDevice) => {
    try {
      console.log('➕ Adding discovered device to saved devices:', discoveredDevice.name);
      
      const existingDevice = devices.find(d => d.ip === discoveredDevice.ip && d.port === discoveredDevice.port);
      if (existingDevice) {
        console.log('❌ Device already exists in saved devices:', existingDevice);
        throw new Error('Cet appareil est déjà dans la liste');
      }

      const newDevice: RVolutionDevice = {
        ...discoveredDevice,
        id: `added_${discoveredDevice.ip}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        isManuallyAdded: false,
      };
      
      console.log('📝 Creating new device with ID:', newDevice.id);
      
      const updatedDevices = [...devices, newDevice];
      setDevices(updatedDevices);
      
      await saveDevices(updatedDevices);
      
      console.log('🧹 Removing device from discovered list after adding to saved devices');
      setDiscoveredDevices(prev => prev.filter(device => device.ip !== discoveredDevice.ip));
      
      console.log('🔄 Force reloading devices from storage to ensure synchronization...');
      devicesLoadedRef.current = false;
      await new Promise(resolve => setTimeout(resolve, 200));
      await loadSavedDevices();
      
      console.log('✅ Discovered device added to saved devices successfully!');
      return newDevice;
      
    } catch (error) {
      console.log('❌ Failed to add discovered device:', error);
      throw error;
    }
  }, [devices, saveDevices, loadSavedDevices]);

  // Enhanced manual device addition with better validation
  const addDeviceManually = useCallback(async (ip: string, port: number = HTTP_PORT, customName?: string): Promise<RVolutionDevice> => {
    console.log('📱 === ENHANCED MANUAL DEVICE ADDITION STARTED ===');
    console.log(`   IP: ${ip}`);
    console.log(`   Port: ${HTTP_PORT} (HTTP protocol enforced)`);
    console.log(`   Endpoint: ${CGI_ENDPOINT}`);
    console.log(`   Custom Name: ${customName || 'None'}`);
    console.log(`   Platform: ${Platform.OS}`);
    
    try {
      // Enhanced IP validation
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!ipRegex.test(ip)) {
        throw new Error('Format d\'adresse IP invalide. Utilisez le format: 192.168.1.100');
      }

      const octets = ip.split('.');
      const invalidOctet = octets.find(octet => {
        const num = parseInt(octet, 10);
        return isNaN(num) || num < 0 || num > 255;
      });
      
      if (invalidOctet) {
        throw new Error('Adresse IP invalide. Chaque partie doit être entre 0 et 255');
      }

      // Check for duplicates
      const existingDevice = devices.find(d => d.ip === ip && d.port === HTTP_PORT);
      if (existingDevice) {
        console.log('❌ Device already exists:', existingDevice);
        throw new Error('Cet appareil est déjà dans la liste');
      }

      console.log('🚀 Testing device connectivity and verification...');
      
      // Enhanced connectivity and verification test
      const reachabilityResult = await checkDeviceReachability(ip);
      console.log(`🔗 Device reachability:`, reachabilityResult);
      
      const verificationResult = await verifyRVolutionDevice(ip);
      console.log(`🎵 R_volution verification:`, verificationResult);
      
      let deviceName = customName || `${TARGET_DEVICE_NAME} (${ip})`;
      let isVerified = verificationResult.isRVolution;
      let isReachable = reachabilityResult.isReachable;
      
      if (isVerified) {
        deviceName = verificationResult.deviceName || deviceName;
        console.log(`✅ Device verified as R_volution: ${deviceName}`);
      } else if (isReachable) {
        console.log(`⚠️  Device is reachable but not verified as R_volution`);
        console.log(`   Adding anyway as manual device`);
      } else {
        console.log(`❌ Device is not reachable`);
        console.log(`   Adding anyway as manual device (may be offline or on different network)`);
      }
      
      const newDevice: RVolutionDevice = {
        id: `manual_${ip}_${HTTP_PORT}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: deviceName,
        ip: ip,
        port: HTTP_PORT,
        isOnline: isReachable,
        lastSeen: isReachable ? new Date() : new Date(0),
        isManuallyAdded: true,
      };
      
      console.log('📝 Creating device with enhanced info:', {
        id: newDevice.id,
        name: newDevice.name,
        ip: newDevice.ip,
        port: newDevice.port,
        protocol: 'HTTP',
        endpoint: CGI_ENDPOINT,
        verified: isVerified,
        reachable: isReachable,
        latency: reachabilityResult.latency || verificationResult.networkLatency,
      });
      
      const updatedDevices = [...devices, newDevice];
      console.log('📱 Updating devices state. Total devices:', updatedDevices.length);
      setDevices(updatedDevices);
      
      console.log('💾 Saving devices to storage...');
      await saveDevices(updatedDevices);
      
      console.log('🔄 Force reloading devices from storage to ensure synchronization...');
      devicesLoadedRef.current = false;
      await new Promise(resolve => setTimeout(resolve, 200));
      await loadSavedDevices();
      
      console.log('✅ Enhanced manual device addition completed successfully!');
      console.log('📱 === ENHANCED MANUAL DEVICE ADDITION FINISHED ===');
      
      return newDevice;
      
    } catch (error) {
      console.log('❌ Enhanced manual device addition failed:', error);
      console.log('📱 === ENHANCED MANUAL DEVICE ADDITION FAILED ===');
      throw error;
    }
  }, [devices, saveDevices, checkDeviceReachability, verifyRVolutionDevice, loadSavedDevices]);

  // Remove device with enhanced error handling
  const removeDevice = useCallback(async (deviceId: string, retryCount = 0) => {
    const maxRetries = 3;
    
    try {
      console.log(`🗑️  Removing device: ${deviceId} (Platform: ${Platform.OS}, attempt: ${retryCount + 1})`);
      
      const deviceToRemove = devices.find(d => d.id === deviceId);
      if (!deviceToRemove) {
        console.log('❌ Device not found in current list:', deviceId);
        throw new Error('Appareil non trouvé dans la liste');
      }
      
      console.log(`🗑️  Removing device: ${deviceToRemove.name} (${deviceToRemove.ip})`);
      
      const updatedDevices = devices.filter(d => d.id !== deviceId);
      setDevices(updatedDevices);
      
      try {
        await saveDevices(updatedDevices);
        console.log('✅ Device removed and saved successfully');
      } catch (saveError) {
        console.log('❌ Save failed after device removal:', saveError);
        
        if (Platform.OS === 'web') {
          console.log('⚠️ Web save failed, but keeping UI state updated');
        } else {
          setDevices(devices);
          throw saveError;
        }
      }
      
      console.log('🔄 Force reloading devices from storage to ensure synchronization...');
      devicesLoadedRef.current = false;
      await new Promise(resolve => setTimeout(resolve, 200));
      await loadSavedDevices();
      
    } catch (error) {
      console.log(`❌ Error removing device (attempt ${retryCount + 1}/${maxRetries}):`, error);
      
      if (retryCount < maxRetries - 1) {
        console.log(`🔄 Retrying device removal in ${(retryCount + 1) * 1000}ms...`);
        await loadSavedDevices();
        await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 1000));
        return removeDevice(deviceId, retryCount + 1);
      }
      
      if (Platform.OS === 'web') {
        console.log('⚠️ All retry attempts failed on web, but keeping UI updated');
        return;
      }
      
      console.log('❌ All retry attempts failed, restoring previous state');
      await loadSavedDevices();
      throw error;
    }
  }, [devices, saveDevices, loadSavedDevices]);

  // Update device with enhanced validation
  const updateDevice = useCallback(async (deviceId: string, updates: { name?: string; ip?: string; port?: number }) => {
    console.log('✏️ Updating device:', deviceId, 'with updates:', updates);
    
    try {
      const deviceToUpdate = devices.find(d => d.id === deviceId);
      if (!deviceToUpdate) {
        throw new Error('Device not found');
      }

      if (updates.ip && updates.ip !== deviceToUpdate.ip) {
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipRegex.test(updates.ip)) {
          throw new Error('Format d\'adresse IP invalide. Utilisez le format: 192.168.1.100');
        }

        const octets = updates.ip.split('.');
        const invalidOctet = octets.find(octet => {
          const num = parseInt(octet, 10);
          return isNaN(num) || num < 0 || num > 255;
        });
        
        if (invalidOctet) {
          throw new Error('Adresse IP invalide. Chaque partie doit être entre 0 et 255');
        }

        const existingDevice = devices.find(d => d.id !== deviceId && d.ip === updates.ip && d.port === HTTP_PORT);
        if (existingDevice) {
          throw new Error('Un autre appareil utilise déjà cette adresse IP');
        }
      }

      const updatedDevice = {
        ...deviceToUpdate,
        ...(updates.name && { name: updates.name.trim() }),
        ...(updates.ip && { ip: updates.ip.trim() }),
        port: HTTP_PORT,
        ...(updates.ip && updates.ip !== deviceToUpdate.ip && { isOnline: false, lastSeen: new Date(0) }),
      };

      const updatedDevices = devices.map(device => 
        device.id === deviceId ? updatedDevice : device
      );

      setDevices(updatedDevices);
      await saveDevices(updatedDevices);
      
      console.log('🔄 Force reloading devices from storage to ensure synchronization...');
      devicesLoadedRef.current = false;
      await new Promise(resolve => setTimeout(resolve, 200));
      await loadSavedDevices();
      
      console.log('✅ Device updated successfully');
      return updatedDevice;
      
    } catch (error) {
      console.log('❌ Device update failed:', error);
      throw error;
    }
  }, [devices, saveDevices, loadSavedDevices]);

  // Enhanced device status update with network diagnostics
  const updateDeviceStatus = useCallback(async () => {
    if (devices.length === 0) {
      console.log('📊 No devices to update status for');
      return;
    }
    
    console.log(`📊 === ENHANCED DEVICE STATUS UPDATE STARTED ===`);
    console.log(`📊 Updating status for ${devices.length} devices using ${CGI_ENDPOINT}...`);
    
    const updatedDevices = await Promise.all(
      devices.map(async (device) => {
        try {
          console.log(`🔄 Enhanced checking ${device.name} (${device.ip}:${HTTP_PORT}${CGI_ENDPOINT})`);
          
          let isOnline = false;
          let deviceName = device.name;
          let latency: number | undefined;
          
          if (device.isManuallyAdded) {
            const reachabilityResult = await checkDeviceReachability(device.ip);
            isOnline = reachabilityResult.isReachable;
            latency = reachabilityResult.latency;
            console.log(`   ${isOnline ? '✅' : '❌'} Manual device ${device.name} is ${isOnline ? 'reachable' : 'offline'} ${latency ? `(${latency}ms)` : ''}`);
          } else {
            const result = await verifyRVolutionDevice(device.ip);
            isOnline = result.isRVolution;
            latency = result.networkLatency;
            
            if (isOnline) {
              deviceName = result.deviceName || device.name;
              console.log(`   ✅ Auto device ${device.name} is online and verified ${latency ? `(${latency}ms)` : ''}`);
            } else {
              const reachabilityResult = await checkDeviceReachability(device.ip);
              console.log(`   ${reachabilityResult.isReachable ? '🔗' : '❌'} Auto device ${device.name} is ${reachabilityResult.isReachable ? 'reachable but not verified' : 'offline'}`);
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
          
          console.log(`   📊 ${device.name} status: ${isOnline ? 'ONLINE' : 'OFFLINE'} ${latency ? `(${latency}ms)` : ''}`);
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
    
    setDevices(updatedDevices);
    await saveDevices(updatedDevices);
    
    const onlineCount = updatedDevices.filter(d => d.isOnline).length;
    console.log(`📊 Enhanced status update completed: ${onlineCount}/${updatedDevices.length} devices online`);
    console.log(`📊 === ENHANCED DEVICE STATUS UPDATE COMPLETED ===`);
    
    return updatedDevices;
  }, [devices, saveDevices, verifyRVolutionDevice, checkDeviceReachability]);

  // Test device connectivity with enhanced diagnostics
  const testDeviceConnectivity = useCallback(async (device: RVolutionDevice): Promise<{
    isReachable: boolean;
    latency?: number;
    isVerified?: boolean;
    error?: string;
  }> => {
    console.log(`🧪 Enhanced testing connectivity for ${device.name} (${device.ip}:${HTTP_PORT}${CGI_ENDPOINT})`);
    
    try {
      const reachabilityResult = await checkDeviceReachability(device.ip);
      const verificationResult = await verifyRVolutionDevice(device.ip);
      
      const result = {
        isReachable: reachabilityResult.isReachable,
        latency: reachabilityResult.latency || verificationResult.networkLatency,
        isVerified: verificationResult.isRVolution,
        error: reachabilityResult.error,
      };
      
      console.log(`${result.isReachable ? '✅' : '❌'} ${device.name} enhanced connectivity test:`, result);
      return result;
      
    } catch (error) {
      console.log(`❌ Enhanced connectivity test failed for ${device.name}:`, error);
      return {
        isReachable: false,
        error: error.message,
      };
    }
  }, [checkDeviceReachability, verifyRVolutionDevice]);

  // Alias for compatibility
  const deleteDevice = useCallback(async (deviceId: string) => {
    console.log(`🗑️  deleteDevice called for: ${deviceId} (Platform: ${Platform.OS})`);
    return removeDevice(deviceId);
  }, [removeDevice]);

  // Initialize by loading saved devices
  useEffect(() => {
    if (!devicesLoadedRef.current && !initializingRef.current) {
      console.log('🚀 Initializing ENHANCED cross-network device discovery hook...');
      console.log(`🚀 Using enhanced CGI endpoint: ${CGI_ENDPOINT}`);
      console.log(`⏱️  Enhanced timeout: ${FAST_SCAN_TIMEOUT}ms`);
      console.log(`🔄 Optimized concurrency: ${CONCURRENT_REQUESTS} requests`);
      console.log(`🌐 Platform: ${Platform.OS}`);
      loadSavedDevices();
    }
  }, [loadSavedDevices]);

  return {
    devices,
    discoveredDevices,
    isScanning,
    scanProgress,
    networkInfo,
    scanNetwork,
    addDeviceManually,
    addDiscoveredDevice,
    removeDevice,
    deleteDevice,
    updateDevice,
    updateDeviceStatus,
    testDeviceConnectivity,
    verifyRVolutionDevice,
    checkDeviceReachability,
    runNetworkDiagnostic,
  };
};
