
import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useDeviceControl } from '../hooks/useDeviceControl';
import { useCustomIRCodes } from '../hooks/useCustomIRCodes';
import { RVolutionDevice } from '../types/Device';
import Icon from './Icon';
import IRCodeEditModal from './IRCodeEditModal';
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
    paddingBottom: 10,
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
  
  // Separator
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
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
    position: 'relative',
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

  // Custom code indicator
  customIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  
  // Power and main controls - MATCHED TO REPEAT BUTTON DIMENSIONS
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
    paddingVertical: 12,
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
    position: 'relative',
    minHeight: 50,
  },
  
  powerButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },

  offButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
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
    position: 'relative',
    minHeight: 50,
  },

  offButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },
  
  // Media controls - MATCHED TO REPEAT BUTTON DIMENSIONS
  mediaControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  
  channelButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
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
    position: 'relative',
    minHeight: 50,
  },
  
  channelButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },
  
  // FIXED: Play button now matches Stop button dimensions exactly - SAME AS CHANNEL BUTTONS
  playButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
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
    position: 'relative',
    minHeight: 50,
  },

  // Page buttons section - MATCHED TO REPEAT BUTTON DIMENSIONS
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
    paddingVertical: 12,
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
    position: 'relative',
    minHeight: 50,
  },

  pageButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },

  // FIXED: Stop button matches Play button dimensions exactly - SAME AS CHANNEL BUTTONS
  stopButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
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
    position: 'relative',
    minHeight: 50,
  },

  stopButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },

  // FIXED: Media control buttons (-60, -10, +10, +60) - Reference dimensions for color buttons
  mediaControlsExtended: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
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
    position: 'relative',
    minHeight: 44,
  },

  mediaControlButtonText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },

  // Subtitle and Audio buttons section - REFERENCE DIMENSIONS
  subtitleAudioSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 20,
  },

  subtitleAudioButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
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
    position: 'relative',
    minHeight: 50,
  },

  subtitleAudioButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },

  // FIXED: Info, 3D, Zoom buttons now match Repeat, Subtitle, Audio dimensions
  infoButtonsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 20,
  },

  infoButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
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
    position: 'relative',
    minHeight: 50,
  },

  infoButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },

  infoSpacer: {
    flex: 0.04,
  },
  
  // Navigation - RESTE CENTRÉ
  navigationSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  
  navigationContainer: {
    width: 300,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  
  navButton: {
    position: 'absolute',
    backgroundColor: colors.primary,
    borderRadius: 10,
    width: 80,
    height: 80,
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
    borderRadius: 35,
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    position: 'relative',
  },
  
  okText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },

  // Home, Menu, Back buttons section - REFERENCE DIMENSIONS for volume buttons
  navigationControlsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 20,
  },

  navigationControlButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
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
    position: 'relative',
    minHeight: 50,
  },

  navigationControlButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },
  
  // Number pad
  numberPad: {
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  
  numberButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    width: 80,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  
  numberText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },

  // Special buttons section
  specialButtonsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  
  specialButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
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
    position: 'relative',
    minHeight: 50,
  },
  
  specialButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },
  
  // FIXED: Color function buttons now match -60 -10 +10 +60 button dimensions
  colorButton: {
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
    flex: 0.24,
    minHeight: 44,
  },
  
  redButton: { backgroundColor: '#e53e3e' },
  greenButton: { backgroundColor: '#38a169' },
  yellowButton: { backgroundColor: '#d69e2e' },
  blueButton: { backgroundColor: '#3182ce' },
  
  colorButtonText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  
  // FIXED: Volume controls now match Home, Menu, Back button dimensions
  volumeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  
  volumeButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
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
    position: 'relative',
    minHeight: 50,
  },
  
  muteButton: {
    backgroundColor: '#f56565',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    flex: 0.32,
    position: 'relative',
    minHeight: 50,
  },
  
  volumeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },

  // Color buttons section
  colorButtonsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 10,
  },

  // Logo section
  logoSection: {
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 8,
  },

  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
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
  const { getIRCode, updateIRCode, hasCustomCode, removeCustomCode } = useCustomIRCodes(device.id);
  const [lastCommand, setLastCommand] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingButton, setEditingButton] = useState<{
    name: string;
    currentCode: string;
    defaultCode: string;
  } | null>(null);

  // Default IR codes
  const defaultIRCodes = {
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

  const handleCommand = async (commandName: string, buttonKey: string) => {
    try {
      const defaultCode = defaultIRCodes[buttonKey as keyof typeof defaultIRCodes];
      const irCode = getIRCode(buttonKey, defaultCode);
      
      setLastCommand(commandName);
      console.log(`🎮 Executing ${commandName} command on ${device.name} with code: ${irCode}`);
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

  const handleLongPress = (buttonName: string, buttonKey: string) => {
    const defaultCode = defaultIRCodes[buttonKey as keyof typeof defaultIRCodes];
    const currentCode = getIRCode(buttonKey, defaultCode);
    
    setEditingButton({
      name: buttonName,
      currentCode,
      defaultCode,
    });
    setEditModalVisible(true);
  };

  const handleSaveIRCode = async (newCode: string) => {
    if (editingButton) {
      await updateIRCode(editingButton.name, newCode);
      console.log(`💾 Updated IR code for ${editingButton.name}: ${newCode}`);
    }
  };

  const handleResetToDefault = async () => {
    if (editingButton) {
      await removeCustomCode(editingButton.name);
      console.log(`🔄 Reset IR code for ${editingButton.name} to default`);
    }
  };

  const handlePlayPause = () => {
    handleCommand('Play/Pause', 'PlayPause');
    setIsPlaying(!isPlaying);
  };

  const handleNumber = (num: number) => {
    const digitKey = `Digit${num}`;
    handleCommand(`Chiffre ${num}`, digitKey);
  };

  const CustomButton: React.FC<{
    onPress: () => void;
    onLongPress: () => void;
    children: React.ReactNode;
    style?: any;
    textStyle?: any;
    buttonKey: string;
  }> = ({ onPress, onLongPress, children, style, textStyle, buttonKey }) => {
    const [pressed, setPressed] = useState(false);
    const isCustom = hasCustomCode(buttonKey);
    
    return (
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        style={[
          styles.modernButton,
          pressed && styles.modernButtonPressed,
          style,
        ]}
        activeOpacity={0.8}
        delayLongPress={800}
      >
        {isCustom && <View style={styles.customIndicator} />}
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
        {/* Power Controls */}
        <View style={styles.powerSection}>
          <CustomButton
            onPress={() => handleCommand('Power On', 'PowerOn')}
            onLongPress={() => handleLongPress('Power On', 'PowerOn')}
            style={styles.powerButton}
            buttonKey="PowerOn"
          >
            <Icon name="power" size={16} color="#fff" />
            <Text style={styles.powerButtonText}>ON</Text>
          </CustomButton>
          
          <CustomButton
            onPress={() => handleCommand('Power Off', 'PowerOff')}
            onLongPress={() => handleLongPress('Power Off', 'PowerOff')}
            style={styles.offButton}
            buttonKey="PowerOff"
          >
            <Icon name="power" size={16} color="#fff" />
            <Text style={styles.offButtonText}>OFF</Text>
          </CustomButton>

          <CustomButton
            onPress={() => handleCommand('Dimmer', 'Dimmer')}
            onLongPress={() => handleLongPress('Dimmer', 'Dimmer')}
            style={styles.powerButton}
            buttonKey="Dimmer"
          >
            <Icon name="sunny" size={16} color="#fff" />
            <Text style={styles.powerButtonText}>Dimmer</Text>
          </CustomButton>
        </View>

        <View style={styles.separator} />

        {/* Media Controls */}
        <View style={styles.mediaControls}>
          <CustomButton
            onPress={() => handleCommand('Channel Down', 'PageDown')}
            onLongPress={() => handleLongPress('Channel Down', 'PageDown')}
            style={styles.channelButton}
            buttonKey="PageDown"
          >
            <Icon name="remove" size={16} color="#fff" />
            <Text style={styles.channelButtonText}>CH -</Text>
          </CustomButton>
          
          <CustomButton
            onPress={handlePlayPause}
            onLongPress={() => handleLongPress('Play/Pause', 'PlayPause')}
            style={styles.playButton}
            buttonKey="PlayPause"
          >
            <Icon name={isPlaying ? "pause" : "play"} size={24} color="#fff" />
          </CustomButton>
          
          <CustomButton
            onPress={() => handleCommand('Channel Up', 'PageUp')}
            onLongPress={() => handleLongPress('Channel Up', 'PageUp')}
            style={styles.channelButton}
            buttonKey="PageUp"
          >
            <Icon name="add" size={16} color="#fff" />
            <Text style={styles.channelButtonText}>CH +</Text>
          </CustomButton>
        </View>

        {/* Page Buttons Section */}
        <View style={styles.pageButtonsSection}>
          <CustomButton
            onPress={() => handleCommand('Page Down', 'PageDown')}
            onLongPress={() => handleLongPress('Page Down', 'PageDown')}
            style={styles.pageButton}
            buttonKey="PageDown"
          >
            <Icon name="arrow-down" size={16} color="#fff" />
            <Text style={styles.pageButtonText}>Page -</Text>
          </CustomButton>
          
          <CustomButton
            onPress={() => handleCommand('Stop', 'Stop')}
            onLongPress={() => handleLongPress('Stop', 'Stop')}
            style={styles.stopButton}
            buttonKey="Stop"
          >
            <Icon name="stop" size={16} color="#fff" />
            <Text style={styles.stopButtonText}>Stop</Text>
          </CustomButton>
          
          <CustomButton
            onPress={() => handleCommand('Page Up', 'PageUp')}
            onLongPress={() => handleLongPress('Page Up', 'PageUp')}
            style={styles.pageButton}
            buttonKey="PageUp"
          >
            <Icon name="arrow-up" size={16} color="#fff" />
            <Text style={styles.pageButtonText}>Page +</Text>
          </CustomButton>
        </View>

        {/* Media Control Buttons */}
        <View style={styles.mediaControlsExtended}>
          <CustomButton
            onPress={() => handleCommand('60s Rewind', 'Skip60Rewind')}
            onLongPress={() => handleLongPress('60s Rewind', 'Skip60Rewind')}
            style={styles.mediaControlButton}
            buttonKey="Skip60Rewind"
          >
            <Icon name="play-back" size={12} color="#fff" />
            <Text style={styles.mediaControlButtonText}>-60s</Text>
          </CustomButton>
          
          <CustomButton
            onPress={() => handleCommand('10s Rewind', 'Skip10Rewind')}
            onLongPress={() => handleLongPress('10s Rewind', 'Skip10Rewind')}
            style={styles.mediaControlButton}
            buttonKey="Skip10Rewind"
          >
            <Icon name="play-back" size={12} color="#fff" />
            <Text style={styles.mediaControlButtonText}>-10s</Text>
          </CustomButton>
          
          <CustomButton
            onPress={() => handleCommand('10s Forward', 'Skip10Forward')}
            onLongPress={() => handleLongPress('10s Forward', 'Skip10Forward')}
            style={styles.mediaControlButton}
            buttonKey="Skip10Forward"
          >
            <Icon name="play-forward" size={12} color="#fff" />
            <Text style={styles.mediaControlButtonText}>+10s</Text>
          </CustomButton>
          
          <CustomButton
            onPress={() => handleCommand('60s Forward', 'Skip60Forward')}
            onLongPress={() => handleLongPress('60s Forward', 'Skip60Forward')}
            style={styles.mediaControlButton}
            buttonKey="Skip60Forward"
          >
            <Icon name="play-forward" size={12} color="#fff" />
            <Text style={styles.mediaControlButtonText}>+60s</Text>
          </CustomButton>
        </View>

        {/* Repeat, Subtitle and Audio Buttons */}
        <View style={styles.subtitleAudioSection}>
          <CustomButton
            onPress={() => handleCommand('Repeat', 'Repeat')}
            onLongPress={() => handleLongPress('Repeat', 'Repeat')}
            style={styles.subtitleAudioButton}
            buttonKey="Repeat"
          >
            <Icon name="repeat" size={16} color="#fff" />
            <Text style={styles.subtitleAudioButtonText}>Repeat</Text>
          </CustomButton>
          
          <CustomButton
            onPress={() => handleCommand('Subtitle', 'Subtitle')}
            onLongPress={() => handleLongPress('Subtitle', 'Subtitle')}
            style={styles.subtitleAudioButton}
            buttonKey="Subtitle"
          >
            <Icon name="text" size={16} color="#fff" />
            <Text style={styles.subtitleAudioButtonText}>Subtitle</Text>
          </CustomButton>
          
          <CustomButton
            onPress={() => handleCommand('Audio', 'Audio')}
            onLongPress={() => handleLongPress('Audio', 'Audio')}
            style={styles.subtitleAudioButton}
            buttonKey="Audio"
          >
            <Icon name="musical-notes" size={16} color="#fff" />
            <Text style={styles.subtitleAudioButtonText}>Audio</Text>
          </CustomButton>
        </View>

        <View style={styles.separator} />

        {/* Info, 3D, Zoom buttons - NOW MATCHING REPEAT BUTTON DIMENSIONS */}
        <View style={styles.infoButtonsSection}>
          <CustomButton
            onPress={() => handleCommand('Info', 'Info')}
            onLongPress={() => handleLongPress('Info', 'Info')}
            style={styles.infoButton}
            buttonKey="Info"
          >
            <Icon name="information-circle" size={16} color="#fff" />
            <Text style={styles.infoButtonText}>Info</Text>
          </CustomButton>
          
          <CustomButton
            onPress={() => handleCommand('3D', '3D')}
            onLongPress={() => handleLongPress('3D', '3D')}
            style={styles.infoButton}
            buttonKey="3D"
          >
            <Icon name="cube" size={16} color="#fff" />
            <Text style={styles.infoButtonText}>3D</Text>
          </CustomButton>
          
          <CustomButton
            onPress={() => handleCommand('Zoom', 'Zoom')}
            onLongPress={() => handleLongPress('Zoom', 'Zoom')}
            style={styles.infoButton}
            buttonKey="Zoom"
          >
            <Icon name="search" size={16} color="#fff" />
            <Text style={styles.infoButtonText}>Zoom</Text>
          </CustomButton>
        </View>

        {/* Navigation - RESTE CENTRÉ */}
        <View style={styles.navigationSection}>
          <View style={styles.navigationContainer}>
            <CustomButton
              onPress={() => handleCommand('Cursor Up', 'CursorUp')}
              onLongPress={() => handleLongPress('Cursor Up', 'CursorUp')}
              style={[styles.navButton, styles.navButtonUp]}
              buttonKey="CursorUp"
            >
              <Icon name="chevron-up" size={28} color="#fff" />
            </CustomButton>
            
            <CustomButton
              onPress={() => handleCommand('Cursor Left', 'CursorLeft')}
              onLongPress={() => handleLongPress('Cursor Left', 'CursorLeft')}
              style={[styles.navButton, styles.navButtonLeft]}
              buttonKey="CursorLeft"
            >
              <Icon name="chevron-back" size={28} color="#fff" />
            </CustomButton>
            
            <CustomButton
              onPress={() => handleCommand('Cursor Enter', 'CursorEnter')}
              onLongPress={() => handleLongPress('OK', 'CursorEnter')}
              style={styles.okButton}
              buttonKey="CursorEnter"
            >
              <Text style={styles.okText}>OK</Text>
            </CustomButton>
            
            <CustomButton
              onPress={() => handleCommand('Cursor Right', 'CursorRight')}
              onLongPress={() => handleLongPress('Cursor Right', 'CursorRight')}
              style={[styles.navButton, styles.navButtonRight]}
              buttonKey="CursorRight"
            >
              <Icon name="chevron-forward" size={28} color="#fff" />
            </CustomButton>
            
            <CustomButton
              onPress={() => handleCommand('Cursor Down', 'CursorDown')}
              onLongPress={() => handleLongPress('Cursor Down', 'CursorDown')}
              style={[styles.navButton, styles.navButtonDown]}
              buttonKey="CursorDown"
            >
              <Icon name="chevron-down" size={28} color="#fff" />
            </CustomButton>
          </View>
        </View>

        {/* Home, Menu, Back buttons */}
        <View style={styles.navigationControlsSection}>
          <CustomButton
            onPress={() => handleCommand('Home', 'Home')}
            onLongPress={() => handleLongPress('Home', 'Home')}
            style={styles.navigationControlButton}
            buttonKey="Home"
          >
            <Icon name="home" size={16} color="#fff" />
            <Text style={styles.navigationControlButtonText}>Home</Text>
          </CustomButton>
          
          <CustomButton
            onPress={() => handleCommand('Menu', 'Menu')}
            onLongPress={() => handleLongPress('Menu', 'Menu')}
            style={styles.navigationControlButton}
            buttonKey="Menu"
          >
            <Icon name="menu" size={16} color="#fff" />
            <Text style={styles.navigationControlButtonText}>Menu</Text>
          </CustomButton>

          <CustomButton
            onPress={() => handleCommand('Return', 'Return')}
            onLongPress={() => handleLongPress('Back', 'Return')}
            style={styles.navigationControlButton}
            buttonKey="Return"
          >
            <Icon name="arrow-back" size={16} color="#fff" />
            <Text style={styles.navigationControlButtonText}>Back</Text>
          </CustomButton>
        </View>

        <View style={styles.separator} />

        {/* Number Pad */}
        <View style={styles.numberPad}>
          <View style={styles.numberRow}>
            {[1, 2, 3].map(num => (
              <CustomButton
                key={num}
                onPress={() => handleNumber(num)}
                onLongPress={() => handleLongPress(`Chiffre ${num}`, `Digit${num}`)}
                style={styles.numberButton}
                buttonKey={`Digit${num}`}
              >
                <Text style={styles.numberText}>{num}</Text>
              </CustomButton>
            ))}
          </View>
          <View style={styles.numberRow}>
            {[4, 5, 6].map(num => (
              <CustomButton
                key={num}
                onPress={() => handleNumber(num)}
                onLongPress={() => handleLongPress(`Chiffre ${num}`, `Digit${num}`)}
                style={styles.numberButton}
                buttonKey={`Digit${num}`}
              >
                <Text style={styles.numberText}>{num}</Text>
              </CustomButton>
            ))}
          </View>
          <View style={styles.numberRow}>
            {[7, 8, 9].map(num => (
              <CustomButton
                key={num}
                onPress={() => handleNumber(num)}
                onLongPress={() => handleLongPress(`Chiffre ${num}`, `Digit${num}`)}
                style={styles.numberButton}
                buttonKey={`Digit${num}`}
              >
                <Text style={styles.numberText}>{num}</Text>
              </CustomButton>
            ))}
          </View>
          <View style={styles.numberRow}>
            <CustomButton
              onPress={() => handleCommand('Delete', 'Delete')}
              onLongPress={() => handleLongPress('Delete', 'Delete')}
              style={styles.numberButton}
              buttonKey="Delete"
            >
              <Icon name="backspace" size={22} color="#fff" />
            </CustomButton>
            <CustomButton
              onPress={() => handleNumber(0)}
              onLongPress={() => handleLongPress('Chiffre 0', 'Digit0')}
              style={styles.numberButton}
              buttonKey="Digit0"
            >
              <Text style={styles.numberText}>0</Text>
            </CustomButton>
            <CustomButton
              onPress={() => handleCommand('Format Scroll', 'FormatScroll')}
              onLongPress={() => handleLongPress('Format Scroll', 'FormatScroll')}
              style={styles.numberButton}
              buttonKey="FormatScroll"
            >
              <Icon name="refresh" size={22} color="#fff" />
            </CustomButton>
          </View>
        </View>

        {/* Air Video and Explorer Buttons */}
        <View style={styles.specialButtonsSection}>
          <CustomButton
            onPress={() => handleCommand('Air Video', 'RVideo')}
            onLongPress={() => handleLongPress('Air Video', 'RVideo')}
            style={styles.specialButton}
            buttonKey="RVideo"
          >
            <Icon name="videocam" size={16} color="#fff" />
            <Text style={styles.specialButtonText}>Air Video</Text>
          </CustomButton>
          
          <CustomButton
            onPress={() => handleCommand('Explorer', 'Explorer')}
            onLongPress={() => handleLongPress('Explorer', 'Explorer')}
            style={styles.specialButton}
            buttonKey="Explorer"
          >
            <Icon name="folder" size={16} color="#fff" />
            <Text style={styles.specialButtonText}>Explorer</Text>
          </CustomButton>
        </View>

        <View style={styles.separator} />

        {/* Volume Controls - NOW MATCHING HOME, MENU, BACK BUTTON DIMENSIONS */}
        <View style={styles.volumeSection}>
          <CustomButton
            onPress={() => handleCommand('Volume Down', 'VolumeDown')}
            onLongPress={() => handleLongPress('Volume Down', 'VolumeDown')}
            style={styles.volumeButton}
            buttonKey="VolumeDown"
          >
            <Icon name="volume-low" size={16} color="#fff" />
            <Text style={styles.volumeText}>Vol -</Text>
          </CustomButton>
          
          <CustomButton
            onPress={() => handleCommand('Mute', 'Mute')}
            onLongPress={() => handleLongPress('Mute', 'Mute')}
            style={styles.muteButton}
            buttonKey="Mute"
          >
            <Icon name="volume-mute" size={16} color="#fff" />
            <Text style={styles.volumeText}>Mute</Text>
          </CustomButton>
          
          <CustomButton
            onPress={() => handleCommand('Volume Up', 'VolumeUp')}
            onLongPress={() => handleLongPress('Volume Up', 'VolumeUp')}
            style={styles.volumeButton}
            buttonKey="VolumeUp"
          >
            <Icon name="volume-high" size={16} color="#fff" />
            <Text style={styles.volumeText}>Vol +</Text>
          </CustomButton>
        </View>

        {/* Color Function Buttons - NOW MATCHING -60 -10 +10 +60 BUTTON DIMENSIONS */}
        <View style={styles.colorButtonsSection}>
          <CustomButton
            onPress={() => handleCommand('Function Red', 'FunctionRed')}
            onLongPress={() => handleLongPress('Function Red', 'FunctionRed')}
            style={[styles.colorButton, styles.redButton]}
            buttonKey="FunctionRed"
          >
            <Text style={styles.colorButtonText}>Rouge</Text>
          </CustomButton>
          
          <CustomButton
            onPress={() => handleCommand('Function Green', 'FunctionGreen')}
            onLongPress={() => handleLongPress('Function Green', 'FunctionGreen')}
            style={[styles.colorButton, styles.greenButton]}
            buttonKey="FunctionGreen"
          >
            <Text style={styles.colorButtonText}>Vert</Text>
          </CustomButton>
          
          <CustomButton
            onPress={() => handleCommand('Function Yellow', 'FunctionYellow')}
            onLongPress={() => handleLongPress('Function Yellow', 'FunctionYellow')}
            style={[styles.colorButton, styles.yellowButton]}
            buttonKey="FunctionYellow"
          >
            <Text style={styles.colorButtonText}>Jaune</Text>
          </CustomButton>
          
          <CustomButton
            onPress={() => handleCommand('Function Blue', 'FunctionBlue')}
            onLongPress={() => handleLongPress('Function Blue', 'FunctionBlue')}
            style={[styles.colorButton, styles.blueButton]}
            buttonKey="FunctionBlue"
          >
            <Text style={styles.colorButtonText}>Bleu</Text>
          </CustomButton>
        </View>

        {/* Logo Section */}
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

      {/* IR Code Edit Modal */}
      <IRCodeEditModal
        visible={editModalVisible}
        buttonName={editingButton?.name || ''}
        currentCode={editingButton?.currentCode || ''}
        onClose={() => {
          setEditModalVisible(false);
          setEditingButton(null);
        }}
        onSave={handleSaveIRCode}
        onResetToDefault={editingButton?.currentCode !== editingButton?.defaultCode ? handleResetToDefault : undefined}
        hasCustomCode={editingButton ? hasCustomCode(editingButton.name) : false}
      />
    </View>
  );
};

export default RemoteControl;
