
import { useState, useCallback } from 'react';
import { RVolutionDevice, DeviceCommand } from '../types/Device';

export const useDeviceControl = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendCommand = useCallback(async (device: RVolutionDevice, command: DeviceCommand) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://${device.ip}:${device.port}/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(command),
      });
      
      if (!response.ok) {
        throw new Error(`Command failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Command sent successfully:', command, result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.log('Error sending command:', errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Media control commands
  const play = useCallback((device: RVolutionDevice) => {
    return sendCommand(device, { action: 'play' });
  }, [sendCommand]);

  const pause = useCallback((device: RVolutionDevice) => {
    return sendCommand(device, { action: 'pause' });
  }, [sendCommand]);

  const stop = useCallback((device: RVolutionDevice) => {
    return sendCommand(device, { action: 'stop' });
  }, [sendCommand]);

  const next = useCallback((device: RVolutionDevice) => {
    return sendCommand(device, { action: 'next' });
  }, [sendCommand]);

  const previous = useCallback((device: RVolutionDevice) => {
    return sendCommand(device, { action: 'previous' });
  }, [sendCommand]);

  const setVolume = useCallback((device: RVolutionDevice, volume: number) => {
    return sendCommand(device, { action: 'volume', value: Math.max(0, Math.min(100, volume)) });
  }, [sendCommand]);

  const mute = useCallback((device: RVolutionDevice) => {
    return sendCommand(device, { action: 'mute' });
  }, [sendCommand]);

  const seek = useCallback((device: RVolutionDevice, position: number) => {
    return sendCommand(device, { action: 'seek', value: position });
  }, [sendCommand]);

  return {
    isLoading,
    error,
    sendCommand,
    play,
    pause,
    stop,
    next,
    previous,
    setVolume,
    mute,
    seek,
  };
};
