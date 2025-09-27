
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CUSTOM_IR_CODES_KEY = 'custom_ir_codes';

export interface CustomIRCode {
  buttonKey: string; // Changé de buttonName à buttonKey pour plus de cohérence
  irCode: string;
  deviceId?: string;
}

export interface CustomIRCodesStorage {
  [buttonKey: string]: string; // Utilise buttonKey comme clé
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
        console.log(`📱 Loaded custom IR codes for device ${deviceId}:`, parsedCodes);
      } else {
        console.log(`📱 No custom IR codes found for device ${deviceId}`);
        setCustomCodes({});
      }
    } catch (error) {
      console.log('❌ Error loading custom IR codes:', error);
      setCustomCodes({});
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
      console.log(`💾 Saved custom IR codes for device ${deviceId}:`, codes);
      
      // Force a small delay to ensure storage is written
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.log('❌ Error saving custom IR codes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [deviceId]);

  // Update a specific IR code
  const updateIRCode = useCallback(async (buttonKey: string, irCode: string) => {
    console.log(`🔧 Updating IR code for button ${buttonKey}: ${irCode}`);
    const updatedCodes = {
      ...customCodes,
      [buttonKey]: irCode,
    };
    await saveCustomCodes(updatedCodes);
  }, [customCodes, saveCustomCodes]);

  // Get IR code for a button (custom or default)
  const getIRCode = useCallback((buttonKey: string, defaultCode: string): string => {
    const customCode = customCodes[buttonKey];
    const resultCode = customCode || defaultCode;
    console.log(`🎮 Getting IR code for ${buttonKey}: ${resultCode} ${customCode ? '(custom)' : '(default)'}`);
    return resultCode;
  }, [customCodes]);

  // Remove custom IR code (revert to default)
  const removeCustomCode = useCallback(async (buttonKey: string) => {
    console.log(`🗑️ Removing custom IR code for button ${buttonKey}`);
    const updatedCodes = { ...customCodes };
    delete updatedCodes[buttonKey];
    await saveCustomCodes(updatedCodes);
  }, [customCodes, saveCustomCodes]);

  // Check if a button has a custom code
  const hasCustomCode = useCallback((buttonKey: string): boolean => {
    const hasCustom = buttonKey in customCodes;
    console.log(`🔍 Button ${buttonKey} has custom code: ${hasCustom}`);
    return hasCustom;
  }, [customCodes]);

  // Clear all custom codes (for debugging)
  const clearAllCustomCodes = useCallback(async () => {
    console.log('🧹 Clearing all custom IR codes');
    await saveCustomCodes({});
  }, [saveCustomCodes]);

  // Get all custom codes (for debugging)
  const getAllCustomCodes = useCallback(() => {
    return customCodes;
  }, [customCodes]);

  // Load codes on mount and when deviceId changes
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
    clearAllCustomCodes,
    getAllCustomCodes,
  };
};
