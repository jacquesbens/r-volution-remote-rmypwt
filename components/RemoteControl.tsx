
import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useDeviceControl } from '../hooks/useDeviceControl';
import { RVolutionDevice } from '../types/Device';
import Icon from './Icon';
import { colors } from '../styles/commonStyles';

interface RemoteControlProps {
  device: RVolutionDevice;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  
  // Section headers
  sectionHeader: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 20,
    textAlign: 'center',
  },
  
  // Separator - reduced by half
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10, // Reduced from 20 to 10 (half)
    marginHorizontal: 20,
  },
  
  // Modern button styles
  modernButton: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  
  modernButtonPressed: {
    backgroundColor: colors.primary,
    transform: [{ scale: 0.95 }],
  },
  
  modernButtonText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  
  modernButtonTextPressed: {
    color: '#fff',
  },
  
  // Power and main controls - updated to align On left and Dimmer right like CH buttons
  powerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  
  powerButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 80,
  },
  
  powerButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },

  offButton: {
    backgroundColor: colors.primary,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },

  offButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  
  // Media controls - NEW LAYOUT: CH- | Play | CH+
  mediaControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  
  // Channel buttons (CH- and CH+) - same design as Explorer button
  channelButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 80,
  },
  
  channelButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },
  
  playButton: {
    backgroundColor: colors.primary,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Page buttons section - positioned below CH buttons with Stop button on same line as Page-
  pageButtonsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 20,
  },

  pageButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 80,
  },

  pageButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },

  stopButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 80,
  },

  stopButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },

  // New media control buttons section - reordered: -60, -10, +10, +60
  mediaControlsExtended: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 20,
  },

  mediaControlButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 0.24,
  },

  mediaControlButtonText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },

  // NEW: Subtitle and Audio buttons section - positioned below media controls extended
  // Updated to include Repeat button on the left of Subtitle
  subtitleAudioSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 20,
  },

  subtitleAudioButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 0.32,
  },

  subtitleAudioButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },

  // Info, 3D, Zoom buttons section - positioned above directional pad
  infoButtonsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },

  infoButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 0.3,
  },

  infoButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },
  
  // Navigation - INCREASED SIZE
  navigationSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  
  navigationContainer: {
    width: 240,  // Increased from 180
    height: 240, // Increased from 180
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  
  // Updated navigation buttons to use Explorer button design
  navButton: {
    position: 'absolute',
    backgroundColor: colors.primary,  // Changed from colors.surface to colors.primary
    borderRadius: 10,                 // Changed from 20 to 10 to match Explorer button
    width: 64,                        // Increased from 48
    height: 64,                       // Increased from 48
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  
  navButtonUp: { top: 0 },
  navButtonDown: { bottom: 0 },
  navButtonLeft: { left: 0 },
  navButtonRight: { right: 0 },
  
  okButton: {
    backgroundColor: colors.primary,
    borderRadius: 28,  // Increased from 20
    width: 96,         // Increased from 72
    height: 96,        // Increased from 72
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  
  okText: {
    color: '#fff',
    fontSize: 20,      // Increased from 16
    fontWeight: '700',
  },

  // Home, Menu, Back buttons section - positioned below navigation with same design as special buttons
  navigationControlsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },

  navigationControlButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 0.3,
  },

  navigationControlButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },
  
  // Number pad - Updated to use same design as Explorer button
  numberPad: {
    marginBottom: 20,
  },
  
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  
  numberButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    width: 64,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  
  numberText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },

  // Air Video and Explorer buttons section - NOW POSITIONED BELOW NUMERIC KEYPAD
  specialButtonsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  
  specialButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,        // Reduced from 12
    paddingVertical: 10,     // Reduced from 16
    paddingHorizontal: 14,   // Reduced from 20
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 0.48,
  },
  
  specialButtonText: {
    color: '#fff',
    fontSize: 11,            // Reduced from 12
    fontWeight: '600',
    marginTop: 3,            // Reduced from 4
  },
  
  // Color function buttons
  colorButton: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  
  redButton: { backgroundColor: '#e53e3e' },
  greenButton: { backgroundColor: '#38a169' },
  yellowButton: { backgroundColor: '#d69e2e' },
  blueButton: { backgroundColor: '#3182ce' },
  
  colorButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  
  // Volume controls - moved above special buttons and updated to use Explorer button design
  volumeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  
  volumeButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 80,
  },
  
  muteButton: {
    backgroundColor: '#f56565',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  
  volumeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },

  // Color buttons section - positioned below special buttons
  colorButtonsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },

  // Logo section - positioned below color buttons
  logoSection: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },

  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },

  // Bottom buttons section - Removed since Repeat is now with Subtitle/Audio
  bottomButtonsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: 10,
  },

  bottomButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 0.48,
  },

  bottomButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },
  
  // Loading overlay
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 14,
    fontWeight: '500',
  },
});

const RemoteControl: React.FC<RemoteControlProps> = ({ device }) => {
  const { isLoading, sendIRCommand } = useDeviceControl();
  const [lastCommand, setLastCommand] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);

  // All IR codes from the document
  const irCodes = {
    // Basic functions
    '3D': 'ED124040',
    'Audio': 'E6194040',
    'CursorDown': 'F6094040',
    'CursorEnter': 'F2004040',
    'CursorLeft': 'F5084040',
    'CursorRight': 'F4084040',
    'CursorUp': 'F7084040',
    'Delete': 'F3064040',
    
    // Digits
    'Digit0': 'FF004040',
    'Digit1': 'FE014040',
    'Digit2': 'FD024040',
    'Digit3': 'FC034040',
    'Digit4': 'FB044040',
    'Digit5': 'FA054040',
    'Digit6': 'F9064040',
    'Digit7': 'F8074040',
    'Digit8': 'F7084040',
    'Digit9': 'F6094040',
    
    // Functions
    'Dimmer': 'AA554040',
    'Explorer': 'A1144040',
    'FormatScroll': 'A0154040',
    'FunctionGreen': 'F50A4040',
    'FunctionYellow': 'F41B4040',
    'FunctionRed': 'A68E4040',
    'FunctionBlue': 'A5544040',
    'Home': 'E5144040',
    'Info': 'BA454040',
    'Menu': 'BA454040',
    'Mouse': 'B8474040',
    'Mute': 'BC434040',
    'PageDown': 'B9204040',
    'PageUp': 'BF404040',
    'PlayPause': 'A5554040',
    'PowerToggle': 'B2404040',
    'PowerOff': 'A4554040',
    'PowerOn': 'A5554040',
    'Repeat': 'B0424040',
    'Return': 'B9464040',
    'RVideo': 'EC134040',
    'Subtitle': 'E41B4040',
    'VolumeDown': 'E8174040',
    'VolumeUp': 'E7184040',
    'Zoom': 'E2104040',
    
    // New requested buttons
    'Stop': 'BD424040',
    'Skip60Forward': 'EE114040',
    'Skip60Rewind': 'EF104040',
    'Skip10Forward': 'BF404040',
    'Skip10Rewind': 'DF204040',
  };

  const handleCommand = async (commandName: string, irCode: string) => {
    try {
      setLastCommand(commandName);
      console.log(`🎮 Executing ${commandName} command on ${device.name}`);
      await sendIRCommand(device, irCode);
      console.log(`✅ ${commandName} command executed successfully`);
    } catch (error) {
      console.log(`❌ ${commandName} command failed:`, error);
      Alert.alert(
        'Erreur de commande',
        `Impossible d'exécuter la commande ${commandName}. Vérifiez que l'appareil est en ligne.`,
        [{ text: 'OK' }]
      );
    }
  };

  const handlePlayPause = () => {
    handleCommand('Play/Pause', irCodes.PlayPause);
    setIsPlaying(!isPlaying);
  };

  const handleNumber = (num: number) => {
    const digitKey = `Digit${num}` as keyof typeof irCodes;
    handleCommand(`Chiffre ${num}`, irCodes[digitKey]);
  };

  const ModernButton: React.FC<{
    onPress: () => void;
    children: React.ReactNode;
    style?: any;
    textStyle?: any;
  }> = ({ onPress, children, style, textStyle }) => {
    const [pressed, setPressed] = useState(false);
    
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        style={[
          styles.modernButton,
          pressed && styles.modernButtonPressed,
          style,
        ]}
        activeOpacity={0.8}
      >
        {typeof children === 'string' ? (
          <Text style={[
            styles.modernButtonText,
            pressed && styles.modernButtonTextPressed,
            textStyle,
          ]}>
            {children}
          </Text>
        ) : (
          children
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Power Controls - Updated to align On left and Dimmer right like CH buttons */}
        <View style={styles.powerSection}>
          <ModernButton
            onPress={() => handleCommand('Power On', irCodes.PowerOn)}
            style={styles.powerButton}
          >
            <Icon name="power" size={16} color="#fff" />
            <Text style={styles.powerButtonText}>ON</Text>
          </ModernButton>
          
          <ModernButton
            onPress={() => handleCommand('Power Off', irCodes.PowerOff)}
            style={styles.offButton}
          >
            <Icon name="power" size={16} color="#fff" />
            <Text style={styles.offButtonText}>OFF</Text>
          </ModernButton>

          <ModernButton
            onPress={() => handleCommand('Dimmer', irCodes.Dimmer)}
            style={styles.powerButton}
          >
            <Icon name="sunny" size={16} color="#fff" />
            <Text style={styles.powerButtonText}>Dimmer</Text>
          </ModernButton>
        </View>

        {/* Separator between power section and next section - REDUCED BY HALF */}
        <View style={styles.separator} />

        {/* Media Controls - NEW LAYOUT: CH- | Play | CH+ */}
        <View style={styles.mediaControls}>
          <ModernButton
            onPress={() => handleCommand('Channel Down', irCodes.PageDown)}
            style={styles.channelButton}
          >
            <Icon name="remove" size={16} color="#fff" />
            <Text style={styles.channelButtonText}>CH -</Text>
          </ModernButton>
          
          <ModernButton
            onPress={handlePlayPause}
            style={styles.playButton}
          >
            <Icon name={isPlaying ? "pause" : "play"} size={24} color="#fff" />
          </ModernButton>
          
          <ModernButton
            onPress={() => handleCommand('Channel Up', irCodes.PageUp)}
            style={styles.channelButton}
          >
            <Icon name="add" size={16} color="#fff" />
            <Text style={styles.channelButtonText}>CH +</Text>
          </ModernButton>
        </View>

        {/* Page Buttons Section - positioned below CH buttons with Stop button on same line as Page- */}
        <View style={styles.pageButtonsSection}>
          <ModernButton
            onPress={() => handleCommand('Page Down', irCodes.PageDown)}
            style={styles.pageButton}
          >
            <Icon name="arrow-down" size={16} color="#fff" />
            <Text style={styles.pageButtonText}>Page -</Text>
          </ModernButton>
          
          <ModernButton
            onPress={() => handleCommand('Stop', irCodes.Stop)}
            style={styles.stopButton}
          >
            <Icon name="stop" size={16} color="#fff" />
            <Text style={styles.stopButtonText}>Stop</Text>
          </ModernButton>
          
          <ModernButton
            onPress={() => handleCommand('Page Up', irCodes.PageUp)}
            style={styles.pageButton}
          >
            <Icon name="arrow-up" size={16} color="#fff" />
            <Text style={styles.pageButtonText}>Page +</Text>
          </ModernButton>
        </View>

        {/* New Media Control Buttons - Reordered: -60, -10, +10, +60 */}
        <View style={styles.mediaControlsExtended}>
          <ModernButton
            onPress={() => handleCommand('60s Rewind', irCodes.Skip60Rewind)}
            style={styles.mediaControlButton}
          >
            <Icon name="play-back" size={12} color="#fff" />
            <Text style={styles.mediaControlButtonText}>-60s</Text>
          </ModernButton>
          
          <ModernButton
            onPress={() => handleCommand('10s Rewind', irCodes.Skip10Rewind)}
            style={styles.mediaControlButton}
          >
            <Icon name="play-back" size={12} color="#fff" />
            <Text style={styles.mediaControlButtonText}>-10s</Text>
          </ModernButton>
          
          <ModernButton
            onPress={() => handleCommand('10s Forward', irCodes.Skip10Forward)}
            style={styles.mediaControlButton}
          >
            <Icon name="play-forward" size={12} color="#fff" />
            <Text style={styles.mediaControlButtonText}>+10s</Text>
          </ModernButton>
          
          <ModernButton
            onPress={() => handleCommand('60s Forward', irCodes.Skip60Forward)}
            style={styles.mediaControlButton}
          >
            <Icon name="play-forward" size={12} color="#fff" />
            <Text style={styles.mediaControlButtonText}>+60s</Text>
          </ModernButton>
        </View>

        {/* NEW: Repeat, Subtitle and Audio Buttons Section - Repeat moved to left of Subtitle */}
        <View style={styles.subtitleAudioSection}>
          <ModernButton
            onPress={() => handleCommand('Repeat', irCodes.Repeat)}
            style={styles.subtitleAudioButton}
          >
            <Icon name="repeat" size={16} color="#fff" />
            <Text style={styles.subtitleAudioButtonText}>Repeat</Text>
          </ModernButton>
          
          <ModernButton
            onPress={() => handleCommand('Subtitle', irCodes.Subtitle)}
            style={styles.subtitleAudioButton}
          >
            <Icon name="text" size={16} color="#fff" />
            <Text style={styles.subtitleAudioButtonText}>Subtitle</Text>
          </ModernButton>
          
          <ModernButton
            onPress={() => handleCommand('Audio', irCodes.Audio)}
            style={styles.subtitleAudioButton}
          >
            <Icon name="musical-notes" size={16} color="#fff" />
            <Text style={styles.subtitleAudioButtonText}>Audio</Text>
          </ModernButton>
        </View>

        {/* Separator after repeat, subtitle and audio buttons - IDENTICAL TO REDUCED SEPARATOR */}
        <View style={styles.separator} />

        {/* Info, 3D, Zoom buttons - positioned above directional pad */}
        <View style={styles.infoButtonsSection}>
          <ModernButton
            onPress={() => handleCommand('Info', irCodes.Info)}
            style={styles.infoButton}
          >
            <Icon name="information-circle" size={16} color="#fff" />
            <Text style={styles.infoButtonText}>Info</Text>
          </ModernButton>
          
          <ModernButton
            onPress={() => handleCommand('3D', irCodes['3D'])}
            style={styles.infoButton}
          >
            <Icon name="cube" size={16} color="#fff" />
            <Text style={styles.infoButtonText}>3D</Text>
          </ModernButton>
          
          <ModernButton
            onPress={() => handleCommand('Zoom', irCodes.Zoom)}
            style={styles.infoButton}
          >
            <Icon name="search" size={16} color="#fff" />
            <Text style={styles.infoButtonText}>Zoom</Text>
          </ModernButton>
        </View>

        {/* Navigation */}
        <View style={styles.navigationSection}>
          <View style={styles.navigationContainer}>
            <ModernButton
              onPress={() => handleCommand('Cursor Up', irCodes.CursorUp)}
              style={[styles.navButton, styles.navButtonUp]}
            >
              <Icon name="chevron-up" size={24} color="#fff" />
            </ModernButton>
            
            <ModernButton
              onPress={() => handleCommand('Cursor Left', irCodes.CursorLeft)}
              style={[styles.navButton, styles.navButtonLeft]}
            >
              <Icon name="chevron-back" size={24} color="#fff" />
            </ModernButton>
            
            <ModernButton
              onPress={() => handleCommand('Cursor Enter', irCodes.CursorEnter)}
              style={styles.okButton}
            >
              <Text style={styles.okText}>OK</Text>
            </ModernButton>
            
            <ModernButton
              onPress={() => handleCommand('Cursor Right', irCodes.CursorRight)}
              style={[styles.navButton, styles.navButtonRight]}
            >
              <Icon name="chevron-forward" size={24} color="#fff" />
            </ModernButton>
            
            <ModernButton
              onPress={() => handleCommand('Cursor Down', irCodes.CursorDown)}
              style={[styles.navButton, styles.navButtonDown]}
            >
              <Icon name="chevron-down" size={24} color="#fff" />
            </ModernButton>
          </View>
        </View>

        {/* Home, Menu, Back buttons - positioned below navigation with Back moved to the right of Menu */}
        <View style={styles.navigationControlsSection}>
          <ModernButton
            onPress={() => handleCommand('Home', irCodes.Home)}
            style={styles.navigationControlButton}
          >
            <Icon name="home" size={16} color="#fff" />
            <Text style={styles.navigationControlButtonText}>Home</Text>
          </ModernButton>
          
          <ModernButton
            onPress={() => handleCommand('Menu', irCodes.Menu)}
            style={styles.navigationControlButton}
          >
            <Icon name="menu" size={16} color="#fff" />
            <Text style={styles.navigationControlButtonText}>Menu</Text>
          </ModernButton>

          <ModernButton
            onPress={() => handleCommand('Return', irCodes.Return)}
            style={styles.navigationControlButton}
          >
            <Icon name="arrow-back" size={16} color="#fff" />
            <Text style={styles.navigationControlButtonText}>Back</Text>
          </ModernButton>
        </View>

        {/* Separator before numeric keypad - IDENTICAL TO REDUCED SEPARATOR */}
        <View style={styles.separator} />

        {/* Number Pad - NOW POSITIONED BELOW HOME, MENU, BACK BUTTONS */}
        <View style={styles.numberPad}>
          <View style={styles.numberRow}>
            {[1, 2, 3].map(num => (
              <ModernButton
                key={num}
                onPress={() => handleNumber(num)}
                style={styles.numberButton}
              >
                <Text style={styles.numberText}>{num}</Text>
              </ModernButton>
            ))}
          </View>
          <View style={styles.numberRow}>
            {[4, 5, 6].map(num => (
              <ModernButton
                key={num}
                onPress={() => handleNumber(num)}
                style={styles.numberButton}
              >
                <Text style={styles.numberText}>{num}</Text>
              </ModernButton>
            ))}
          </View>
          <View style={styles.numberRow}>
            {[7, 8, 9].map(num => (
              <ModernButton
                key={num}
                onPress={() => handleNumber(num)}
                style={styles.numberButton}
              >
                <Text style={styles.numberText}>{num}</Text>
              </ModernButton>
            ))}
          </View>
          <View style={styles.numberRow}>
            <ModernButton
              onPress={() => handleCommand('Delete', irCodes.Delete)}
              style={styles.numberButton}
            >
              <Icon name="backspace" size={18} color="#fff" />
            </ModernButton>
            <ModernButton
              onPress={() => handleNumber(0)}
              style={styles.numberButton}
            >
              <Text style={styles.numberText}>0</Text>
            </ModernButton>
            <ModernButton
              onPress={() => handleCommand('Format Scroll', irCodes.FormatScroll)}
              style={styles.numberButton}
            >
              <Icon name="refresh" size={18} color="#fff" />
            </ModernButton>
          </View>
        </View>

        {/* Air Video and Explorer Buttons - NOW POSITIONED BELOW NUMERIC KEYPAD */}
        <View style={styles.specialButtonsSection}>
          <ModernButton
            onPress={() => handleCommand('Air Video', irCodes.RVideo)}
            style={styles.specialButton}
          >
            <Icon name="videocam" size={16} color="#fff" />
            <Text style={styles.specialButtonText}>Air Video</Text>
          </ModernButton>
          
          <ModernButton
            onPress={() => handleCommand('Explorer', irCodes.Explorer)}
            style={styles.specialButton}
          >
            <Icon name="folder" size={16} color="#fff" />
            <Text style={styles.specialButtonText}>Explorer</Text>
          </ModernButton>
        </View>

        {/* Separator after Air Video and Explorer buttons */}
        <View style={styles.separator} />

        {/* Volume Controls - Now positioned above color buttons with Explorer button design */}
        <View style={styles.volumeSection}>
          <ModernButton
            onPress={() => handleCommand('Volume Down', irCodes.VolumeDown)}
            style={styles.volumeButton}
          >
            <Icon name="volume-low" size={16} color="#fff" />
            <Text style={styles.volumeText}>Vol -</Text>
          </ModernButton>
          
          <ModernButton
            onPress={() => handleCommand('Mute', irCodes.Mute)}
            style={styles.muteButton}
          >
            <Icon name="volume-mute" size={20} color="#fff" />
          </ModernButton>
          
          <ModernButton
            onPress={() => handleCommand('Volume Up', irCodes.VolumeUp)}
            style={styles.volumeButton}
          >
            <Icon name="volume-high" size={16} color="#fff" />
            <Text style={styles.volumeText}>Vol +</Text>
          </ModernButton>
        </View>

        {/* Color Function Buttons - Positioned below Volume */}
        <View style={styles.colorButtonsSection}>
          <ModernButton
            onPress={() => handleCommand('Function Red', irCodes.FunctionRed)}
            style={[styles.colorButton, styles.redButton]}
          >
            <Text style={styles.colorButtonText}>Rouge</Text>
          </ModernButton>
          
          <ModernButton
            onPress={() => handleCommand('Function Green', irCodes.FunctionGreen)}
            style={[styles.colorButton, styles.greenButton]}
          >
            <Text style={styles.colorButtonText}>Vert</Text>
          </ModernButton>
          
          <ModernButton
            onPress={() => handleCommand('Function Yellow', irCodes.FunctionYellow)}
            style={[styles.colorButton, styles.yellowButton]}
          >
            <Text style={styles.colorButtonText}>Jaune</Text>
          </ModernButton>
          
          <ModernButton
            onPress={() => handleCommand('Function Blue', irCodes.FunctionBlue)}
            style={[styles.colorButton, styles.blueButton]}
          >
            <Text style={styles.colorButtonText}>Bleu</Text>
          </ModernButton>
        </View>

        {/* Logo Section - Positioned below color buttons */}
        <View style={styles.logoSection}>
          <Image 
            source={require('../assets/images/490033b5-b48d-4f21-bd74-a10b28ac45b8.png')}
            style={styles.logo}
          />
        </View>

        {/* Loading Overlay */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <Icon name="refresh" size={24} color="#fff" />
            <Text style={styles.loadingText}>Envoi de {lastCommand}...</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default RemoteControl;
