
import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CommandHistoryEntry {
  id: string;
  deviceId: string;
  deviceName: string;
  commandName: string;
  buttonKey: string;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
}

const HISTORY_STORAGE_KEY = 'rvolution_command_history';
const MAX_HISTORY_ENTRIES = 100;

export const useCommandHistory = () => {
  const [commandHistory, setCommandHistory] = useState<CommandHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load command history from storage
  const loadCommandHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('📜 Loading command history from storage...');
      
      let savedHistory = null;
      try {
        savedHistory = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
      } catch (webError) {
        if (typeof window !== 'undefined' && window.localStorage) {
          savedHistory = window.localStorage.getItem(HISTORY_STORAGE_KEY);
        }
      }

      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        const historyWithDates = parsedHistory.map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp),
        }));
        
        setCommandHistory(historyWithDates);
        console.log(`📜 Loaded ${historyWithDates.length} command history entries`);
      }
    } catch (error) {
      console.log('❌ Error loading command history:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save command history to storage
  const saveCommandHistory = useCallback(async (history: CommandHistoryEntry[]) => {
    try {
      const dataToSave = JSON.stringify(history);
      
      try {
        await AsyncStorage.setItem(HISTORY_STORAGE_KEY, dataToSave);
      } catch (webError) {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(HISTORY_STORAGE_KEY, dataToSave);
        }
      }
      
      console.log('💾 Command history saved successfully');
    } catch (error) {
      console.log('❌ Error saving command history:', error);
    }
  }, []);

  // Add a new command to history
  const addCommandToHistory = useCallback(async (
    deviceId: string,
    deviceName: string,
    commandName: string,
    buttonKey: string,
    success: boolean,
    errorMessage?: string
  ) => {
    const newEntry: CommandHistoryEntry = {
      id: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      deviceId,
      deviceName,
      commandName,
      buttonKey,
      timestamp: new Date(),
      success,
      errorMessage,
    };

    console.log(`📜 Adding command to history: ${commandName} (${success ? 'SUCCESS' : 'FAILED'})`);

    const updatedHistory = [newEntry, ...commandHistory].slice(0, MAX_HISTORY_ENTRIES);
    setCommandHistory(updatedHistory);
    await saveCommandHistory(updatedHistory);
  }, [commandHistory, saveCommandHistory]);

  // Clear command history
  const clearCommandHistory = useCallback(async () => {
    console.log('🧹 Clearing command history...');
    setCommandHistory([]);
    await saveCommandHistory([]);
  }, [saveCommandHistory]);

  // Get recent commands for a specific device
  const getRecentCommandsForDevice = useCallback((deviceId: string, limit: number = 10) => {
    return commandHistory
      .filter(entry => entry.deviceId === deviceId)
      .slice(0, limit);
  }, [commandHistory]);

  // Get command statistics
  const getCommandStats = useCallback(() => {
    const totalCommands = commandHistory.length;
    const successfulCommands = commandHistory.filter(entry => entry.success).length;
    const failedCommands = totalCommands - successfulCommands;
    const successRate = totalCommands > 0 ? (successfulCommands / totalCommands) * 100 : 0;

    const commandCounts = commandHistory.reduce((acc, entry) => {
      acc[entry.commandName] = (acc[entry.commandName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostUsedCommand = Object.entries(commandCounts)
      .sort(([, a], [, b]) => b - a)[0];

    return {
      totalCommands,
      successfulCommands,
      failedCommands,
      successRate: Math.round(successRate),
      mostUsedCommand: mostUsedCommand ? {
        name: mostUsedCommand[0],
        count: mostUsedCommand[1],
      } : null,
    };
  }, [commandHistory]);

  return {
    commandHistory,
    isLoading,
    loadCommandHistory,
    addCommandToHistory,
    clearCommandHistory,
    getRecentCommandsForDevice,
    getCommandStats,
  };
};
