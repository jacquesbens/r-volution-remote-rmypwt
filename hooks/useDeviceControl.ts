
import { useState, useCallback } from 'react';
import { RVolutionDevice, DeviceCommand } from '../types/Device';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CGI_ENDPOINT = '/cgi-bin/do?';
const COMMAND_TIMEOUT = 3000;

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

  // All IR Commands from the R_volution document
  const send3D = useCallback((device: RVolutionDevice) => {
    return sendIRCommand(device, 'ED124040');
  }, [sendIRCommand]);

  const sendAudio = useCallback((device: RVolutionDevice) => {
    return sendIRCommand(device, 'E6194040');
  }, [sendIRCommand]);

  const sendCursorDown = useCallback((device: RVolutionDevice) => {
    return sendIRCommand(device, 'F6094040');
  }, [sendIRCommand]);

  const sendCursorEnter = useCallback((device: RVolutionDevice) => {
    return sendIRCommand(device, 'F2004040');
  }, [sendIRCommand]);

  const sendCursorLeft = useCallback((device: RVolutionDevice) => {
    return sendIRCommand(device, 'F5084040');
  }, [sendIRCommand]);

  const sendCursorRight = useCallback((device: RVolutionDevice) => {
    return sendIRCommand(device, 'F4084040');
  }, [sendIRCommand]);

  const sendCursorUp = useCallback((device: RVolutionDevice) => {
    return sendIRCommand(device, 'F7084040');
  }, [sendIRCommand]);

  const sendDelete = useCallback((device: RVolutionDevice) => {
    return sendIRCommand(device, 'F3064040');
  }, [sendIRCommand]);

  // Digit commands
  const sendDigit = useCallback((device: RVolutionDevice, digit: number) => {
    const digitCodes = {
      0: 'FF004040',
      1: 'FE014040',
      2: 'FD024040',
      3: 'FC034040',
      4: 'FB044040',
      5: 'FA054040',
      6: 'F9064040',
      7: 'F8074040',
      8: 'F7084040',
      9: 'F6094040',
    };
    const code = digitCodes[digit as keyof typeof digitCodes];
    if (code) {
      return sendIRCommand(device, code);
    }
    throw new Error(`Invalid digit: ${digit}`);
  }, [sendIRCommand]);

  const sendDimmer = useCallback((device: RVolutionDevice) => {
    return sendIRCommand(device, 'AA554040');
  }, [sendIRCommand]);

  const sendExplorer = useCallback((device: RVolutionDevice) => {
    return sendIRCommand(device, 'A1144040');
  }, [sendIRCommand]);

  const sendFormatScroll = useCallback((device: RVolutionDevice) => {
    return sendIRCommand(device, 'A0154040');
  }, [sendIRCommand]);

  // Function color buttons
  const sendFunctionGreen = useCallback((device: RVolutionDevice) => {
    return sendIRCommand(device, 'F50A4040');
  }, [sendIRCommand]);

  const sendFunctionYellow = useCallback((device: RVolutionDevice) => {
    return sendIRCommand(device, 'F41B4040');
  }, [sendIRCommand]);

  const sendFunctionRed = useCallback((device: RVolutionDevice) => {
    return sendIRCommand(device, 'A68E4040');
  }, [sendIRCommand]);

  const sendFunctionBlue = useCallback((device: RVolutionDevice) => {
    return sendIRCommand(device, 'A5544040');
  }, [sendIRCommand]);

  const sendHome = useCallback((device: RVolutionDevice) => {
    return sendIRCommand(device, 'E5144040');
  }, [sendIRCommand]);

  const sendInfo = useCallback((device: RVolutionDevice) => {
    return sendIRCommand(device, 'BA454040');
  }, [sendIRCommand]);

  const sendMenu = useCallback((device: RVolutionDevice) => {
    return sendIRCommand(device, 'BA454040');
  }, [sendIRCommand]);

  const sendMouse = useCallback((device: RVolutionDevice) => {
    return sendIRCommand(device, 'B8474040');
  }, [sendIRCommand]);

  const sendMute = useCallback((device: RVolutionDevice) => {
    return sendIRCommand(device, 'BC434040');
  }, [sendIRCommand]);

  const sendPageDown = useCallback((device: RVolutionDevice) => {
    return sendIRCommand(device, 'B9204040');
  }, [sendIRCommand]);

  const sendPageUp = useCallback((device: RVolutionDevice) => {
    return sendIRCommand(device, 'BF404040');
  }, [sendIRCommand]);

  const sendPlayPause = useCallback((device: RVolutionDevice) => {
    return sendIRCommand(device, 'A5554040');
  }, [sendIRCommand]);

  const sendPowerToggle = useCallback((device: RVolutionDevice) => {
    return sendIRCommand(device, 'B2404040');
  }, [sendIRCommand]);

  const sendPowerOff = useCallback((device: RVolutionDevice) => {
    return sendIRCommand(device, 'A4554040');
  }, [sendIRCommand]);

  const sendPowerOn = useCallback((device: RVolutionDevice) => {
    return sendIRCommand(device, 'A5554040');
  }, [sendIRCommand]);

  const sendRepeat = useCallback((device: RVolutionDevice) => {
    return sendIRCommand(device, 'B0424040');
  }, [sendIRCommand]);

  const sendReturn = useCallback((device: RVolutionDevice) => {
    return sendIRCommand(device, 'B9464040');
  }, [sendIRCommand]);

  const sendRVideo = useCallback((device: RVolutionDevice) => {
    return sendIRCommand(device, 'EC134040');
  }, [sendIRCommand]);

  const sendSubtitle = useCallback((device: RVolutionDevice) => {
    return sendIRCommand(device, 'E41B4040');
  }, [sendIRCommand]);

  const sendVolumeDown = useCallback((device: RVolutionDevice) => {
    return sendIRCommand(device, 'E8174040');
  }, [sendIRCommand]);

  const sendVolumeUp = useCallback((device: RVolutionDevice) => {
    return sendIRCommand(device, 'E7184040');
  }, [sendIRCommand]);

  const sendZoom = useCallback((device: RVolutionDevice) => {
    return sendIRCommand(device, 'E2104040');
  }, [sendIRCommand]);

  // Legacy compatibility functions
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
    return sendVolumeUp(device);
  }, [sendVolumeUp]);

  const volumeDown = useCallback((device: RVolutionDevice) => {
    return sendVolumeDown(device);
  }, [sendVolumeDown]);

  const setVolume = useCallback((device: RVolutionDevice, volume: number) => {
    const clampedVolume = Math.max(0, Math.min(100, volume));
    return sendCommand(device, { action: 'volume', value: clampedVolume });
  }, [sendCommand]);

  const mute = useCallback((device: RVolutionDevice) => {
    return sendMute(device);
  }, [sendMute]);

  const seek = useCallback((device: RVolutionDevice, position: number) => {
    return sendCommand(device, { action: 'seek', value: position });
  }, [sendCommand]);

  // Additional R_volution specific commands
  const power = useCallback((device: RVolutionDevice) => {
    return sendPowerToggle(device);
  }, [sendPowerToggle]);

  const home = useCallback((device: RVolutionDevice) => {
    return sendHome(device);
  }, [sendHome]);

  const back = useCallback((device: RVolutionDevice) => {
    return sendReturn(device);
  }, [sendReturn]);

  const menu = useCallback((device: RVolutionDevice) => {
    return sendMenu(device);
  }, [sendMenu]);

  const ok = useCallback((device: RVolutionDevice) => {
    return sendCursorEnter(device);
  }, [sendCursorEnter]);

  const up = useCallback((device: RVolutionDevice) => {
    return sendCursorUp(device);
  }, [sendCursorUp]);

  const down = useCallback((device: RVolutionDevice) => {
    return sendCursorDown(device);
  }, [sendCursorDown]);

  const left = useCallback((device: RVolutionDevice) => {
    return sendCursorLeft(device);
  }, [sendCursorLeft]);

  const right = useCallback((device: RVolutionDevice) => {
    return sendCursorRight(device);
  }, [sendCursorRight]);

  // Number pad commands
  const number = useCallback((device: RVolutionDevice, num: number) => {
    return sendDigit(device, num);
  }, [sendDigit]);

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
    return sendInfo(device);
  }, [sendInfo]);

  return {
    isLoading,
    error,
    sendCommand,
    sendIRCommand,
    
    // All new IR commands from the document
    send3D,
    sendAudio,
    sendCursorDown,
    sendCursorEnter,
    sendCursorLeft,
    sendCursorRight,
    sendCursorUp,
    sendDelete,
    sendDigit,
    sendDimmer,
    sendExplorer,
    sendFormatScroll,
    sendFunctionGreen,
    sendFunctionYellow,
    sendFunctionRed,
    sendFunctionBlue,
    sendHome,
    sendInfo,
    sendMenu,
    sendMouse,
    sendMute,
    sendPageDown,
    sendPageUp,
    sendPlayPause,
    sendPowerToggle,
    sendPowerOff,
    sendPowerOn,
    sendRepeat,
    sendReturn,
    sendRVideo,
    sendSubtitle,
    sendVolumeDown,
    sendVolumeUp,
    sendZoom,
    
    // Legacy compatibility
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
