
import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
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
  
  // Power and main controls
  powerSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  
  powerButton: {
    backgroundColor: '#e53e3e',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    minWidth: 80,
  },
  
  powerButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  
  // Media controls
  mediaControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  
  mediaButton: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  
  playButton: {
    backgroundColor: colors.primary,
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  
  // Number pad
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
    backgroundColor: colors.surface,
    borderRadius: 12,
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
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
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
  
  navButton: {
    position: 'absolute',
    backgroundColor: colors.surface,
    borderRadius: 20,  // Increased from 16
    width: 64,         // Increased from 48
    height: 64,        // Increased from 48
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
  
  // Function buttons grid
  functionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  
  functionButton: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '23%',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: colors.border,
  },
  
  functionButtonText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
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
  
  // Volume controls
  volumeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  
  volumeButton: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
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
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  
  // R_Video and Explorer buttons section
  specialButtonsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  
  specialButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
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
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },

  // Color buttons section - positioned below special buttons
  colorButtonsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 15,
    marginBottom: 20,
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
        {/* Power Controls */}
        <Text style={styles.sectionHeader}>Alimentation</Text>
        <View style={styles.powerSection}>
          <ModernButton
            onPress={() => handleCommand('Power On', irCodes.PowerOn)}
            style={[styles.powerButton, { backgroundColor: '#38a169' }]}
          >
            <Icon name="power" size={20} color="#fff" />
            <Text style={styles.powerButtonText}>ON</Text>
          </ModernButton>
          
          <ModernButton
            onPress={() => handleCommand('Power Toggle', irCodes.PowerToggle)}
            style={styles.powerButton}
          >
            <Icon name="power" size={20} color="#fff" />
            <Text style={styles.powerButtonText}>TOGGLE</Text>
          </ModernButton>
          
          <ModernButton
            onPress={() => handleCommand('Power Off', irCodes.PowerOff)}
            style={styles.powerButton}
          >
            <Icon name="power" size={20} color="#fff" />
            <Text style={styles.powerButtonText}>OFF</Text>
          </ModernButton>
        </View>

        {/* Media Controls */}
        <Text style={styles.sectionHeader}>Contrôles Média</Text>
        <View style={styles.mediaControls}>
          <ModernButton
            onPress={() => handleCommand('Return', irCodes.Return)}
            style={styles.mediaButton}
          >
            <Icon name="play-skip-back" size={20} color={colors.text} />
          </ModernButton>
          
          <ModernButton
            onPress={handlePlayPause}
            style={[styles.mediaButton, styles.playButton]}
          >
            <Icon name={isPlaying ? "pause" : "play"} size={24} color="#fff" />
          </ModernButton>
          
          <ModernButton
            onPress={() => handleCommand('Repeat', irCodes.Repeat)}
            style={styles.mediaButton}
          >
            <Icon name="play-skip-forward" size={20} color={colors.text} />
          </ModernButton>
        </View>

        {/* Number Pad */}
        <Text style={styles.sectionHeader}>Pavé Numérique</Text>
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
              <Icon name="backspace" size={18} color={colors.text} />
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
              <Icon name="refresh" size={18} color={colors.text} />
            </ModernButton>
          </View>
        </View>

        {/* Navigation */}
        <Text style={styles.sectionHeader}>Navigation</Text>
        <View style={styles.navigationSection}>
          <View style={styles.navigationContainer}>
            <ModernButton
              onPress={() => handleCommand('Cursor Up', irCodes.CursorUp)}
              style={[styles.navButton, styles.navButtonUp]}
            >
              <Icon name="chevron-up" size={24} color={colors.text} />
            </ModernButton>
            
            <ModernButton
              onPress={() => handleCommand('Cursor Left', irCodes.CursorLeft)}
              style={[styles.navButton, styles.navButtonLeft]}
            >
              <Icon name="chevron-back" size={24} color={colors.text} />
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
              <Icon name="chevron-forward" size={24} color={colors.text} />
            </ModernButton>
            
            <ModernButton
              onPress={() => handleCommand('Cursor Down', irCodes.CursorDown)}
              style={[styles.navButton, styles.navButtonDown]}
            >
              <Icon name="chevron-down" size={24} color={colors.text} />
            </ModernButton>
          </View>
        </View>

        {/* Function Buttons */}
        <Text style={styles.sectionHeader}>Fonctions</Text>
        <View style={styles.functionGrid}>
          <ModernButton
            onPress={() => handleCommand('Home', irCodes.Home)}
            style={styles.functionButton}
          >
            <Icon name="home" size={16} color={colors.text} />
            <Text style={styles.functionButtonText}>Home</Text>
          </ModernButton>
          
          <ModernButton
            onPress={() => handleCommand('Menu', irCodes.Menu)}
            style={styles.functionButton}
          >
            <Icon name="menu" size={16} color={colors.text} />
            <Text style={styles.functionButtonText}>Menu</Text>
          </ModernButton>
          
          <ModernButton
            onPress={() => handleCommand('Info', irCodes.Info)}
            style={styles.functionButton}
          >
            <Icon name="information-circle" size={16} color={colors.text} />
            <Text style={styles.functionButtonText}>Info</Text>
          </ModernButton>
          
          <ModernButton
            onPress={() => handleCommand('3D', irCodes['3D'])}
            style={styles.functionButton}
          >
            <Icon name="cube" size={16} color={colors.text} />
            <Text style={styles.functionButtonText}>3D</Text>
          </ModernButton>
          
          <ModernButton
            onPress={() => handleCommand('Audio', irCodes.Audio)}
            style={styles.functionButton}
          >
            <Icon name="musical-notes" size={16} color={colors.text} />
            <Text style={styles.functionButtonText}>Audio</Text>
          </ModernButton>
          
          <ModernButton
            onPress={() => handleCommand('Subtitle', irCodes.Subtitle)}
            style={styles.functionButton}
          >
            <Icon name="text" size={16} color={colors.text} />
            <Text style={styles.functionButtonText}>Subtitle</Text>
          </ModernButton>
          
          <ModernButton
            onPress={() => handleCommand('Zoom', irCodes.Zoom)}
            style={styles.functionButton}
          >
            <Icon name="search" size={16} color={colors.text} />
            <Text style={styles.functionButtonText}>Zoom</Text>
          </ModernButton>
          
          <ModernButton
            onPress={() => handleCommand('Mouse', irCodes.Mouse)}
            style={styles.functionButton}
          >
            <Icon name="hand-left" size={16} color={colors.text} />
            <Text style={styles.functionButtonText}>Mouse</Text>
          </ModernButton>
          
          <ModernButton
            onPress={() => handleCommand('Dimmer', irCodes.Dimmer)}
            style={styles.functionButton}
          >
            <Icon name="sunny" size={16} color={colors.text} />
            <Text style={styles.functionButtonText}>Dimmer</Text>
          </ModernButton>
          
          <ModernButton
            onPress={() => handleCommand('Page Up', irCodes.PageUp)}
            style={styles.functionButton}
          >
            <Icon name="arrow-up" size={16} color={colors.text} />
            <Text style={styles.functionButtonText}>Page ↑</Text>
          </ModernButton>
          
          <ModernButton
            onPress={() => handleCommand('Page Down', irCodes.PageDown)}
            style={styles.functionButton}
          >
            <Icon name="arrow-down" size={16} color={colors.text} />
            <Text style={styles.functionButtonText}>Page ↓</Text>
          </ModernButton>
        </View>

        {/* R_Video and Explorer Buttons */}
        <Text style={styles.sectionHeader}>Fonctions Spéciales</Text>
        <View style={styles.specialButtonsSection}>
          <ModernButton
            onPress={() => handleCommand('R_Video', irCodes.RVideo)}
            style={styles.specialButton}
          >
            <Icon name="videocam" size={18} color="#fff" />
            <Text style={styles.specialButtonText}>R_Video</Text>
          </ModernButton>
          
          <ModernButton
            onPress={() => handleCommand('Explorer', irCodes.Explorer)}
            style={styles.specialButton}
          >
            <Icon name="folder" size={18} color="#fff" />
            <Text style={styles.specialButtonText}>Explorer</Text>
          </ModernButton>
        </View>

        {/* Color Function Buttons - Now positioned below R_Video and Explorer */}
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

        {/* Volume Controls */}
        <Text style={styles.sectionHeader}>Volume</Text>
        <View style={styles.volumeSection}>
          <ModernButton
            onPress={() => handleCommand('Volume Down', irCodes.VolumeDown)}
            style={styles.volumeButton}
          >
            <Icon name="volume-low" size={18} color={colors.text} />
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
            <Icon name="volume-high" size={18} color={colors.text} />
            <Text style={styles.volumeText}>Vol +</Text>
          </ModernButton>
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
