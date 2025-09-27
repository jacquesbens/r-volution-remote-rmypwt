
import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useDeviceControl } from '../hooks/useDeviceControl';
import { useCustomIRCodes } from '../hooks/useCustomIRCodes';
import { RVolutionDevice } from '../types/Device';
import Icon from './Icon';
import IRCodeEditModal from './IRCodeEditModal';
import { colors } from '../styles/commonStyles';
import Constants from 'expo-constants';

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
  
  // STANDARD BUTTON DIMENSIONS - TOUS LES BOUTONS PRINCIPAUX UTILISENT CES DIMENSIONS (HAUTEUR DE RÉFÉRENCE: 50px)
  standardButton: {
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
    maxHeight: 50,
  },

  standardButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },

  // SMALL BUTTON DIMENSIONS - MAINTENANT AVEC LA MÊME HAUTEUR QUE LE BOUTON ON (50px)
  smallButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
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
    minHeight: 50,
    maxHeight: 50,
  },

  smallButtonText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  
  // Power and main controls - ESPACEMENT DE RÉFÉRENCE: 20px
  powerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 20, // ESPACEMENT DE RÉFÉRENCE
  },
  
  // Media controls - TOUS UTILISENT standardButton - ESPACEMENT IDENTIQUE: 20px
  mediaControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20, // ESPACEMENT IDENTIQUE À LA RÉFÉRENCE
    paddingHorizontal: 8,
  },

  // Media control buttons - TOUS UTILISENT smallButton AVEC HAUTEUR 50px - ESPACEMENT IDENTIQUE: 20px
  mediaControlsExtended: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 20, // ESPACEMENT IDENTIQUE À LA RÉFÉRENCE
  },

  // Subtitle and Audio buttons section - TOUS UTILISENT standardButton - ESPACEMENT IDENTIQUE: 20px
  subtitleAudioSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 20, // ESPACEMENT IDENTIQUE À LA RÉFÉRENCE
  },

  // Info buttons section - TOUS UTILISENT standardButton - ESPACEMENT IDENTIQUE: 20px
  infoButtonsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 20, // ESPACEMENT IDENTIQUE À LA RÉFÉRENCE
  },

  // NOUVELLE SECTION: Quatre boutons sur une ligne (Page-, Air Video, Explorer, Page+) - ESPACEMENT IDENTIQUE: 20px
  fourButtonsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 20, // ESPACEMENT IDENTIQUE À LA RÉFÉRENCE
  },

  fourButtonsButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
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
    minHeight: 50,
    maxHeight: 50,
  },

  fourButtonsButtonText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  
  // Navigation - RESTE CENTRÉ - ESPACEMENT IDENTIQUE: 20px
  navigationSection: {
    alignItems: 'center',
    marginBottom: 20, // ESPACEMENT IDENTIQUE À LA RÉFÉRENCE
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

  // Navigation controls section - TOUS UTILISENT standardButton - ESPACEMENT IDENTIQUE: 20px
  navigationControlsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 20, // ESPACEMENT IDENTIQUE À LA RÉFÉRENCE
  },
  
  // Number pad - ESPACEMENT IDENTIQUE AUX AUTRES SECTIONS: 20px
  numberPad: {
    paddingHorizontal: 8,
    marginBottom: 20, // ESPACEMENT IDENTIQUE À LA RÉFÉRENCE (comme les autres sections)
  },
  
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 0, // Supprimé le padding pour un alignement parfait
  },

  // Style spécial pour la dernière ligne du pavé numérique (sans marge en bas)
  numberRowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 0, // PAS DE MARGE EN BAS POUR LA DERNIÈRE LIGNE
    paddingHorizontal: 0,
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
  
  // Color function buttons - TOUS UTILISENT smallButton AVEC HAUTEUR 50px avec couleurs spéciales
  redButton: { backgroundColor: '#e53e3e' },
  greenButton: { backgroundColor: '#38a169' },
  yellowButton: { backgroundColor: '#d69e2e' },
  blueButton: { backgroundColor: '#3182ce' },
  
  // Volume controls - TOUS UTILISENT standardButton - ESPACEMENT IDENTIQUE: 20px
  volumeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 20, // ESPACEMENT IDENTIQUE À LA RÉFÉRENCE
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
    maxHeight: 50,
  },

  // Color buttons section - ESPACEMENT IDENTIQUE: 20px
  colorButtonsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 20, // ESPACEMENT IDENTIQUE À LA RÉFÉRENCE
  },

  // Logo section - ESPACEMENT IDENTIQUE: 20px
  logoSection: {
    alignItems: 'center',
    marginBottom: 20, // ESPACEMENT IDENTIQUE À LA RÉFÉRENCE
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

  // Style pour l'icône combinée Play/Pause
  playPauseIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  playPauseIcon: {
    marginHorizontal: 1,
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

  // Check if running on emulator - Constants.isDevice is false on emulator/simulator
  const isEmulator = !Constants.isDevice;

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
    'FastRewind': 'EF104040',
    'FastForward': 'EE114040',
    'ChannelDown': 'B9204040',
    'ChannelUp': 'BF404040',
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
    // Only allow IR code editing on emulator
    if (!isEmulator) {
      console.log('🚫 IR code editing is only available on emulator');
      Alert.alert(
        'Fonction non disponible',
        'La modification des codes IR n\'est disponible que sur l\'émulateur pour des raisons de sécurité.',
        [{ text: 'OK' }]
      );
      return;
    }

    const defaultCode = defaultIRCodes[buttonKey as keyof typeof defaultIRCodes];
    const currentCode = getIRCode(buttonKey, defaultCode);
    
    console.log(`🔧 Opening IR code editor for ${buttonName} (${buttonKey})`);
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

  // Composant pour l'icône combinée Play/Pause
  const PlayPauseIcon = () => (
    <View style={styles.playPauseIconContainer}>
      <Icon name="play" size={12} color="#fff" style={styles.playPauseIcon} />
      <Text style={{ color: '#fff', fontSize: 8, marginHorizontal: 2 }}>|</Text>
      <Icon name="pause" size={12} color="#fff" style={styles.playPauseIcon} />
    </View>
  );

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
        onLongPress={isEmulator ? onLongPress : undefined} // Only enable long press on emulator
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
        {isCustom && isEmulator && <View style={styles.customIndicator} />}
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
        {/* Power Controls - UTILISE standardButton - ESPACEMENT DE RÉFÉRENCE: 20px */}
        <View style={styles.powerSection}>
          <CustomButton
            onPress={() => handleCommand('Power On', 'PowerOn')}
            onLongPress={() => handleLongPress('Power On', 'PowerOn')}
            style={styles.standardButton}
            textStyle={styles.standardButtonText}
            buttonKey="PowerOn"
          >
            <Icon name="power" size={16} color="#fff" />
            <Text style={styles.standardButtonText}>ON</Text>
          </CustomButton>
          
          <CustomButton
            onPress={() => handleCommand('Power Off', 'PowerOff')}
            onLongPress={() => handleLongPress('Power Off', 'PowerOff')}
            style={styles.standardButton}
            textStyle={styles.standardButtonText}
            buttonKey="PowerOff"
          >
            <Icon name="power" size={16} color="#fff" />
            <Text style={styles.standardButtonText}>OFF</Text>
          </CustomButton>

          <CustomButton
            onPress={() => handleCommand('Dimmer', 'Dimmer')}
            onLongPress={() => handleLongPress('Dimmer', 'Dimmer')}
            style={styles.standardButton}
            textStyle={styles.standardButtonText}
            buttonKey="Dimmer"
          >
            <Icon name="sunny" size={16} color="#fff" />
            <Text style={styles.standardButtonText}>Dimmer</Text>
          </CustomButton>
        </View>

        <View style={styles.separator} />

        {/* Media Controls - CH- et CH+ avec icônes de chapitre - ESPACEMENT IDENTIQUE: 20px */}
        <View style={styles.mediaControls}>
          <CustomButton
            onPress={() => handleCommand('Chapter Previous', 'ChannelDown')}
            onLongPress={() => handleLongPress('Chapter Previous', 'ChannelDown')}
            style={styles.standardButton}
            textStyle={styles.standardButtonText}
            buttonKey="ChannelDown"
          >
            <Icon name="play-skip-back" size={20} color="#fff" />
          </CustomButton>
          
          <CustomButton
            onPress={handlePlayPause}
            onLongPress={() => handleLongPress('Play/Pause', 'PlayPause')}
            style={styles.standardButton}
            textStyle={styles.standardButtonText}
            buttonKey="PlayPause"
          >
            <PlayPauseIcon />
          </CustomButton>
          
          <CustomButton
            onPress={() => handleCommand('Chapter Next', 'ChannelUp')}
            onLongPress={() => handleLongPress('Chapter Next', 'ChannelUp')}
            style={styles.standardButton}
            textStyle={styles.standardButtonText}
            buttonKey="ChannelUp"
          >
            <Icon name="play-skip-forward" size={20} color="#fff" />
          </CustomButton>
        </View>

        {/* Stop Button avec boutons retour rapide et avance rapide - ESPACEMENT IDENTIQUE: 20px */}
        <View style={styles.mediaControls}>
          <CustomButton
            onPress={() => handleCommand('Fast Rewind', 'FastRewind')}
            onLongPress={() => handleLongPress('Fast Rewind', 'FastRewind')}
            style={styles.standardButton}
            textStyle={styles.standardButtonText}
            buttonKey="FastRewind"
          >
            <Icon name="play-back" size={20} color="#fff" />
          </CustomButton>
          
          <CustomButton
            onPress={() => handleCommand('Stop', 'Stop')}
            onLongPress={() => handleLongPress('Stop', 'Stop')}
            style={styles.standardButton}
            textStyle={styles.standardButtonText}
            buttonKey="Stop"
          >
            <Icon name="stop" size={20} color="#fff" />
          </CustomButton>
          
          <CustomButton
            onPress={() => handleCommand('Fast Forward', 'FastForward')}
            onLongPress={() => handleLongPress('Fast Forward', 'FastForward')}
            style={styles.standardButton}
            textStyle={styles.standardButtonText}
            buttonKey="FastForward"
          >
            <Icon name="play-forward" size={20} color="#fff" />
          </CustomButton>
        </View>

        {/* Media Control Buttons - TOUS UTILISENT smallButton AVEC HAUTEUR 50px - ESPACEMENT IDENTIQUE: 20px */}
        <View style={styles.mediaControlsExtended}>
          <CustomButton
            onPress={() => handleCommand('60s Rewind', 'Skip60Rewind')}
            onLongPress={() => handleLongPress('60s Rewind', 'Skip60Rewind')}
            style={styles.smallButton}
            textStyle={styles.smallButtonText}
            buttonKey="Skip60Rewind"
          >
            <Icon name="play-back" size={12} color="#fff" />
            <Text style={styles.smallButtonText}>-60s</Text>
          </CustomButton>
          
          <CustomButton
            onPress={() => handleCommand('10s Rewind', 'Skip10Rewind')}
            onLongPress={() => handleLongPress('10s Rewind', 'Skip10Rewind')}
            style={styles.smallButton}
            textStyle={styles.smallButtonText}
            buttonKey="Skip10Rewind"
          >
            <Icon name="play-back" size={12} color="#fff" />
            <Text style={styles.smallButtonText}>-10s</Text>
          </CustomButton>
          
          <CustomButton
            onPress={() => handleCommand('10s Forward', 'Skip10Forward')}
            onLongPress={() => handleLongPress('10s Forward', 'Skip10Forward')}
            style={styles.smallButton}
            textStyle={styles.smallButtonText}
            buttonKey="Skip10Forward"
          >
            <Icon name="play-forward" size={12} color="#fff" />
            <Text style={styles.smallButtonText}>+10s</Text>
          </CustomButton>
          
          <CustomButton
            onPress={() => handleCommand('60s Forward', 'Skip60Forward')}
            onLongPress={() => handleLongPress('60s Forward', 'Skip60Forward')}
            style={styles.smallButton}
            textStyle={styles.smallButtonText}
            buttonKey="Skip60Forward"
          >
            <Icon name="play-forward" size={12} color="#fff" />
            <Text style={styles.smallButtonText}>+60s</Text>
          </CustomButton>
        </View>

        {/* Repeat, Subtitle and Audio Buttons - UTILISE standardButton - ESPACEMENT IDENTIQUE: 20px */}
        <View style={styles.subtitleAudioSection}>
          <CustomButton
            onPress={() => handleCommand('Repeat', 'Repeat')}
            onLongPress={() => handleLongPress('Repeat', 'Repeat')}
            style={styles.standardButton}
            textStyle={styles.standardButtonText}
            buttonKey="Repeat"
          >
            <Icon name="repeat" size={16} color="#fff" />
            <Text style={styles.standardButtonText}>Repeat</Text>
          </CustomButton>
          
          <CustomButton
            onPress={() => handleCommand('Subtitle', 'Subtitle')}
            onLongPress={() => handleLongPress('Subtitle', 'Subtitle')}
            style={styles.standardButton}
            textStyle={styles.standardButtonText}
            buttonKey="Subtitle"
          >
            <Icon name="text" size={16} color="#fff" />
            <Text style={styles.standardButtonText}>Subtitle</Text>
          </CustomButton>
          
          <CustomButton
            onPress={() => handleCommand('Audio', 'Audio')}
            onLongPress={() => handleLongPress('Audio', 'Audio')}
            style={styles.standardButton}
            textStyle={styles.standardButtonText}
            buttonKey="Audio"
          >
            <Icon name="musical-notes" size={16} color="#fff" />
            <Text style={styles.standardButtonText}>Audio</Text>
          </CustomButton>
        </View>

        <View style={styles.separator} />

        {/* Info, 3D, Zoom buttons - UTILISE standardButton - ESPACEMENT IDENTIQUE: 20px */}
        <View style={styles.infoButtonsSection}>
          <CustomButton
            onPress={() => handleCommand('Info', 'Info')}
            onLongPress={() => handleLongPress('Info', 'Info')}
            style={styles.standardButton}
            textStyle={styles.standardButtonText}
            buttonKey="Info"
          >
            <Icon name="information-circle" size={16} color="#fff" />
            <Text style={styles.standardButtonText}>Info</Text>
          </CustomButton>
          
          <CustomButton
            onPress={() => handleCommand('3D', '3D')}
            onLongPress={() => handleLongPress('3D', '3D')}
            style={styles.standardButton}
            textStyle={styles.standardButtonText}
            buttonKey="3D"
          >
            <Icon name="cube" size={16} color="#fff" />
            <Text style={styles.standardButtonText}>3D</Text>
          </CustomButton>
          
          <CustomButton
            onPress={() => handleCommand('Zoom', 'Zoom')}
            onLongPress={() => handleLongPress('Zoom', 'Zoom')}
            style={styles.standardButton}
            textStyle={styles.standardButtonText}
            buttonKey="Zoom"
          >
            <Icon name="search" size={16} color="#fff" />
            <Text style={styles.standardButtonText}>Zoom</Text>
          </CustomButton>
        </View>

        {/* Navigation - RESTE CENTRÉ - ESPACEMENT IDENTIQUE: 20px */}
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

        {/* Home, Menu, Back buttons - ALIGNEMENT PARFAIT - ESPACEMENT IDENTIQUE: 20px */}
        <View style={styles.navigationControlsSection}>
          <CustomButton
            onPress={() => handleCommand('Home', 'Home')}
            onLongPress={() => handleLongPress('Home', 'Home')}
            style={styles.standardButton}
            textStyle={styles.standardButtonText}
            buttonKey="Home"
          >
            <Icon name="home" size={16} color="#fff" />
            <Text style={styles.standardButtonText}>Home</Text>
          </CustomButton>
          
          <CustomButton
            onPress={() => handleCommand('Menu', 'Menu')}
            onLongPress={() => handleLongPress('Menu', 'Menu')}
            style={styles.standardButton}
            textStyle={styles.standardButtonText}
            buttonKey="Menu"
          >
            <Icon name="menu" size={16} color="#fff" />
            <Text style={styles.standardButtonText}>Menu</Text>
          </CustomButton>

          <CustomButton
            onPress={() => handleCommand('Return', 'Return')}
            onLongPress={() => handleLongPress('Back', 'Return')}
            style={styles.standardButton}
            textStyle={styles.standardButtonText}
            buttonKey="Return"
          >
            <Icon name="arrow-back" size={16} color="#fff" />
            <Text style={styles.standardButtonText}>Back</Text>
          </CustomButton>
        </View>

        <View style={styles.separator} />

        {/* Number Pad - ESPACEMENT IDENTIQUE AUX AUTRES SECTIONS: 20px */}
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
          {/* Dernière ligne du pavé numérique - SANS MARGE EN BAS */}
          <View style={styles.numberRowLast}>
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

        <View style={styles.separator} />

        {/* NOUVELLE SECTION: Quatre boutons sur une ligne (Page-, Air Video, Explorer, Page+) - MAINTENANT AU-DESSUS DES BOUTONS DE VOLUME - ESPACEMENT IDENTIQUE: 20px */}
        <View style={styles.fourButtonsSection}>
          <CustomButton
            onPress={() => handleCommand('Page Down', 'PageDown')}
            onLongPress={() => handleLongPress('Page Down', 'PageDown')}
            style={styles.fourButtonsButton}
            textStyle={styles.fourButtonsButtonText}
            buttonKey="PageDown"
          >
            <Icon name="arrow-down" size={14} color="#fff" />
            <Text style={styles.fourButtonsButtonText}>Page -</Text>
          </CustomButton>
          
          <CustomButton
            onPress={() => handleCommand('Air Video', 'RVideo')}
            onLongPress={() => handleLongPress('Air Video', 'RVideo')}
            style={styles.fourButtonsButton}
            textStyle={styles.fourButtonsButtonText}
            buttonKey="RVideo"
          >
            <Icon name="videocam" size={14} color="#fff" />
            <Text style={styles.fourButtonsButtonText}>Air Video</Text>
          </CustomButton>
          
          <CustomButton
            onPress={() => handleCommand('Explorer', 'Explorer')}
            onLongPress={() => handleLongPress('Explorer', 'Explorer')}
            style={styles.fourButtonsButton}
            textStyle={styles.fourButtonsButtonText}
            buttonKey="Explorer"
          >
            <Icon name="folder" size={14} color="#fff" />
            <Text style={styles.fourButtonsButtonText}>Explorer</Text>
          </CustomButton>
          
          <CustomButton
            onPress={() => handleCommand('Page Up', 'PageUp')}
            onLongPress={() => handleLongPress('Page Up', 'PageUp')}
            style={styles.fourButtonsButton}
            textStyle={styles.fourButtonsButtonText}
            buttonKey="PageUp"
          >
            <Icon name="arrow-up" size={14} color="#fff" />
            <Text style={styles.fourButtonsButtonText}>Page +</Text>
          </CustomButton>
        </View>

        {/* Volume Controls - UTILISE standardButton - ESPACEMENT IDENTIQUE: 20px */}
        <View style={styles.volumeSection}>
          <CustomButton
            onPress={() => handleCommand('Volume Down', 'VolumeDown')}
            onLongPress={() => handleLongPress('Volume Down', 'VolumeDown')}
            style={styles.standardButton}
            textStyle={styles.standardButtonText}
            buttonKey="VolumeDown"
          >
            <Icon name="volume-low" size={16} color="#fff" />
            <Text style={styles.standardButtonText}>Vol -</Text>
          </CustomButton>
          
          <CustomButton
            onPress={() => handleCommand('Mute', 'Mute')}
            onLongPress={() => handleLongPress('Mute', 'Mute')}
            style={styles.muteButton}
            textStyle={styles.standardButtonText}
            buttonKey="Mute"
          >
            <Icon name="volume-mute" size={16} color="#fff" />
            <Text style={styles.standardButtonText}>Mute</Text>
          </CustomButton>
          
          <CustomButton
            onPress={() => handleCommand('Volume Up', 'VolumeUp')}
            onLongPress={() => handleLongPress('Volume Up', 'VolumeUp')}
            style={styles.standardButton}
            textStyle={styles.standardButtonText}
            buttonKey="VolumeUp"
          >
            <Icon name="volume-high" size={16} color="#fff" />
            <Text style={styles.standardButtonText}>Vol +</Text>
          </CustomButton>
        </View>

        {/* Color Function Buttons - UTILISE smallButton AVEC HAUTEUR 50px avec couleurs - ESPACEMENT IDENTIQUE: 20px */}
        <View style={styles.colorButtonsSection}>
          <CustomButton
            onPress={() => handleCommand('Function Red', 'FunctionRed')}
            onLongPress={() => handleLongPress('Function Red', 'FunctionRed')}
            style={[styles.smallButton, styles.redButton]}
            textStyle={styles.smallButtonText}
            buttonKey="FunctionRed"
          >
            <Text style={styles.smallButtonText}>Rouge</Text>
          </CustomButton>
          
          <CustomButton
            onPress={() => handleCommand('Function Green', 'FunctionGreen')}
            onLongPress={() => handleLongPress('Function Green', 'FunctionGreen')}
            style={[styles.smallButton, styles.greenButton]}
            textStyle={styles.smallButtonText}
            buttonKey="FunctionGreen"
          >
            <Text style={styles.smallButtonText}>Vert</Text>
          </CustomButton>
          
          <CustomButton
            onPress={() => handleCommand('Function Yellow', 'FunctionYellow')}
            onLongPress={() => handleLongPress('Function Yellow', 'FunctionYellow')}
            style={[styles.smallButton, styles.yellowButton]}
            textStyle={styles.smallButtonText}
            buttonKey="FunctionYellow"
          >
            <Text style={styles.smallButtonText}>Jaune</Text>
          </CustomButton>
          
          <CustomButton
            onPress={() => handleCommand('Function Blue', 'FunctionBlue')}
            onLongPress={() => handleLongPress('Function Blue', 'FunctionBlue')}
            style={[styles.smallButton, styles.blueButton]}
            textStyle={styles.smallButtonText}
            buttonKey="FunctionBlue"
          >
            <Text style={styles.smallButtonText}>Bleu</Text>
          </CustomButton>
        </View>

        {/* Logo Section - ESPACEMENT IDENTIQUE: 20px */}
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

      {/* IR Code Edit Modal - Only show on emulator */}
      {isEmulator && (
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
      )}
    </View>
  );
};

export default RemoteControl;
