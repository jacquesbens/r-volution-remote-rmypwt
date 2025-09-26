
import { useState, useCallback } from 'react';
import { RVolutionDevice, DeviceCommand } from '../types/Device';

const CGI_ENDPOINT = '/cgi-bin/do?'; // Fast CGI endpoint
const COMMAND_TIMEOUT = 3000; // Fast timeout for commands

export const useDeviceControl = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendIRCommand = useCallback(async (device: RVolutionDevice, irCode: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`🎮 Sending IR command to ${device.name} (${device.ip}:${device.port}):`, irCode);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), COMMAND_TIMEOUT);
      
      // Build IR command URL as specified in the document
      const commandUrl = `http://${device.ip}:${device.port}${CGI_ENDPOINT}cmd=ir_code&ir_code=${irCode}`;
      
      console.log(`🚀 IR command URL: ${commandUrl}`);
      
      const response = await fetch(commandUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': '*/*',
          'User-Agent': 'R_volution-Remote/1.0',
          'Cache-Control': 'no-cache',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Command failed: ${response.status} ${response.statusText}`);
      }
      
      let result: any = { success: true };
      try {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          result = await response.json();
        } else {
          const textResult = await response.text();
          result = { success: true, response: textResult };
        }
      } catch (parseError) {
        // If we can't parse the response, but got a 200, consider it successful
        result = { success: true, response: 'command_sent' };
      }
      
      console.log('✅ IR Command sent successfully:', irCode, result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.log('❌ Error sending IR command:', errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendCommand = useCallback(async (device: RVolutionDevice, command: DeviceCommand) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`🎮 Sending command to ${device.name} (${device.ip}:${device.port}${CGI_ENDPOINT}):`, command);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), COMMAND_TIMEOUT);
      
      // Build command URL using CGI parameters
      let commandUrl = `http://${device.ip}:${device.port}${CGI_ENDPOINT}`;
      
      // Convert command to CGI parameters
      const params = new URLSearchParams();
      params.append('cmd', command.action);
      if (command.value !== undefined) {
        params.append('value', command.value.toString());
      }
      
      commandUrl += params.toString();
      
      console.log(`🚀 Fast command URL: ${commandUrl}`);
      
      const response = await fetch(commandUrl, {
        method: 'GET', // CGI typically uses GET
        signal: controller.signal,
        headers: {
          'Accept': '*/*',
          'User-Agent': 'R_volution-Remote/1.0',
          'Cache-Control': 'no-cache',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Command failed: ${response.status} ${response.statusText}`);
      }
      
      let result: any = { success: true };
      try {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          result = await response.json();
        } else {
          const textResult = await response.text();
          result = { success: true, response: textResult };
        }
      } catch (parseError) {
        // If we can't parse the response, but got a 200, consider it successful
        result = { success: true, response: 'command_sent' };
      }
      
      console.log('✅ Command sent successfully:', command, result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.log('❌ Error sending command:', errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // IR Commands based on the document provided
  const next = useCallback((device: RVolutionDevice) => {
    return sendIRCommand(device, 'E11E4040');
  }, [sendIRCommand]);

  const previous = useCallback((device: RVolutionDevice) => {
    return sendIRCommand(device, 'E01F4040');
  }, [sendIRCommand]);

  const fastForward = useCallback((device: RVolutionDevice) => {
    return sendIRCommand(device, 'E41B8F00');
  }, [sendIRCommand]);

  const fastReverse = useCallback((device: RVolutionDevice) => {
    return sendIRCommand(device, 'E31C8F00');
  }, [sendIRCommand]);

  // Additional Skip & Toggle Commands
  const stop = useCallback((device: RVolutionDevice) => {
    return sendIRCommand(device, 'BD424040');
  }, [sendIRCommand]);

  const skip60Forward = useCallback((device: RVolutionDevice) => {
    return sendIRCommand(device, 'EE114040');
  }, [sendIRCommand]);

  const skip60Rewind = useCallback((device: RVolutionDevice) => {
    return sendIRCommand(device, 'EF104040');
  }, [sendIRCommand]);

  const skip10Forward = useCallback((device: RVolutionDevice) => {
    return sendIRCommand(device, 'BF404040');
  }, [sendIRCommand]);

  const skip10Rewind = useCallback((device: RVolutionDevice) => {
    return sendIRCommand(device, 'DF204040');
  }, [sendIRCommand]);

  // Media control commands using R_volution specific command names
  const play = useCallback((device: RVolutionDevice) => {
    return sendCommand(device, { action: 'play' });
  }, [sendCommand]);

  const pause = useCallback((device: RVolutionDevice) => {
    return sendCommand(device, { action: 'pause' });
  }, [sendCommand]);

  const volumeUp = useCallback((device: RVolutionDevice) => {
    return sendCommand(device, { action: 'vol_up' });
  }, [sendCommand]);

  const volumeDown = useCallback((device: RVolutionDevice) => {
    return sendCommand(device, { action: 'vol_down' });
  }, [sendCommand]);

  const setVolume = useCallback((device: RVolutionDevice, volume: number) => {
    const clampedVolume = Math.max(0, Math.min(100, volume));
    return sendCommand(device, { action: 'volume', value: clampedVolume });
  }, [sendCommand]);

  const mute = useCallback((device: RVolutionDevice) => {
    return sendCommand(device, { action: 'mute' });
  }, [sendCommand]);

  const seek = useCallback((device: RVolutionDevice, position: number) => {
    return sendCommand(device, { action: 'seek', value: position });
  }, [sendCommand]);

  // Additional R_volution specific commands
  const power = useCallback((device: RVolutionDevice) => {
    return sendCommand(device, { action: 'power' });
  }, [sendCommand]);

  const home = useCallback((device: RVolutionDevice) => {
    return sendCommand(device, { action: 'home' });
  }, [sendCommand]);

  const back = useCallback((device: RVolutionDevice) => {
    return sendCommand(device, { action: 'back' });
  }, [sendCommand]);

  const menu = useCallback((device: RVolutionDevice) => {
    return sendCommand(device, { action: 'menu' });
  }, [sendCommand]);

  const ok = useCallback((device: RVolutionDevice) => {
    return sendCommand(device, { action: 'ok' });
  }, [sendCommand]);

  const up = useCallback((device: RVolutionDevice) => {
    return sendCommand(device, { action: 'up' });
  }, [sendCommand]);

  const down = useCallback((device: RVolutionDevice) => {
    return sendCommand(device, { action: 'down' });
  }, [sendCommand]);

  const left = useCallback((device: RVolutionDevice) => {
    return sendCommand(device, { action: 'left' });
  }, [sendCommand]);

  const right = useCallback((device: RVolutionDevice) => {
    return sendCommand(device, { action: 'right' });
  }, [sendCommand]);

  // Number pad commands
  const number = useCallback((device: RVolutionDevice, num: number) => {
    return sendCommand(device, { action: 'number', value: num });
  }, [sendCommand]);

  // TV/VOD/Guide/Info commands
  const tv = useCallback((device: RVolutionDevice) => {
    return sendCommand(device, { action: 'tv' });
  }, [sendCommand]);

  const vod = useCallback((device: RVolutionDevice) => {
    return sendCommand(device, { action: 'vod' });
  }, [sendCommand]);

  const guide = useCallback((device: RVolutionDevice) => {
    return sendCommand(device, { action: 'guide' });
  }, [sendCommand]);

  const info = useCallback((device: RVolutionDevice) => {
    return sendCommand(device, { action: 'info' });
  }, [sendCommand]);

  return {
    isLoading,
    error,
    sendCommand,
    sendIRCommand,
    play,
    pause,
    stop,
    next,
    previous,
    fastForward,
    fastReverse,
    skip60Forward,
    skip60Rewind,
    skip10Forward,
    skip10Rewind,
    volumeUp,
    volumeDown,
    setVolume,
    mute,
    seek,
    power,
    home,
    back,
    menu,
    ok,
    up,
    down,
    left,
    right,
    number,
    tv,
    vod,
    guide,
    info,
  };
};
