
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CUSTOM_IR_CODES_KEY = 'custom_ir_codes';

export interface CustomIRCode {
  buttonName: string;
  irCode: string;
  deviceId?: string; // Optional: per-device customization
}

export interface CustomIRCodesStorage {
  [buttonName: string]: string;
}

export const useCustomIRCodes = (deviceId?: string) => {
  const [customCodes, setCustomCodes] = useState<CustomIRCodesStorage>({});
  const [isLoading, setIsLoading] = useState(false);

  // Load custom IR codes from storage
  const loadCustomCodes = useCallback(async () => {
    try {
      setIsLoading(true);
      const storageKey = deviceId ? `${CUSTOM_IR_CODES_KEY}_${deviceId}` : CUSTOM_IR_CODES_KEY;
      const storedCodes = await AsyncStorage.getItem(storageKey);
      
      if (storedCodes) {
        const parsedCodes = JSON.parse(storedCodes);
        setCustomCodes(parsedCodes);
        console.log('📱 Loaded custom IR codes:', parsedCodes);
      }
    } catch (error) {
      console.log('❌ Error loading custom IR codes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [deviceId]);

  // Save custom IR codes to storage
  const saveCustomCodes = useCallback(async (codes: CustomIRCodesStorage) => {
    try {
      setIsLoading(true);
      const storageKey = deviceId ? `${CUSTOM_IR_CODES_KEY}_${deviceId}` : CUSTOM_IR_CODES_KEY;
      await AsyncStorage.setItem(storageKey, JSON.stringify(codes));
      setCustomCodes(codes);
      console.log('💾 Saved custom IR codes:', codes);
    } catch (error) {
      console.log('❌ Error saving custom IR codes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [deviceId]);

  // Update a specific IR code
  const updateIRCode = useCallback(async (buttonName: string, irCode: string) => {
    const updatedCodes = {
      ...customCodes,
      [buttonName]: irCode,
    };
    await saveCustomCodes(updatedCodes);
  }, [customCodes, saveCustomCodes]);

  // Get IR code for a button (custom or default)
  const getIRCode = useCallback((buttonName: string, defaultCode: string): string => {
    return customCodes[buttonName] || defaultCode;
  }, [customCodes]);

  // Remove custom IR code (revert to default)
  const removeCustomCode = useCallback(async (buttonName: string) => {
    const updatedCodes = { ...customCodes };
    delete updatedCodes[buttonName];
    await saveCustomCodes(updatedCodes);
  }, [customCodes, saveCustomCodes]);

  // Check if a button has a custom code
  const hasCustomCode = useCallback((buttonName: string): boolean => {
    return buttonName in customCodes;
  }, [customCodes]);

  // Load codes on mount
  useEffect(() => {
    loadCustomCodes();
  }, [loadCustomCodes]);

  return {
    customCodes,
    isLoading,
    updateIRCode,
    getIRCode,
    removeCustomCode,
    hasCustomCode,
    loadCustomCodes,
  };
};
