
import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useDeviceControl } from '../hooks/useDeviceControl';
import { RVolutionDevice } from '../types/Device';
import Button from './Button';
import Icon from './Icon';
import { colors } from '../styles/commonStyles';

interface RemoteControlProps {
  device: RVolutionDevice;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 30,
  },
  deviceInfo: {
    backgroundColor: colors.surface,
    padding: 15,
    borderRadius: 12,
    marginBottom: 30,
    alignItems: 'center',
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 5,
  },
  deviceIP: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  statusText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  onlineText: {
    color: colors.success,
  },
  offlineText: {
    color: colors.error,
  },
  controlSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 15,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  controlButton: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 5,
  },
  navigationGrid: {
    alignItems: 'center',
    marginVertical: 20,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  navButton: {
    backgroundColor: colors.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 5,
  },
  centerButton: {
    backgroundColor: colors.accent,
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  volumeControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: 20,
  },
  volumeButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  loadingText: {
    color: colors.background,
    marginTop: 10,
    fontSize: 14,
  },
});

const RemoteControl: React.FC<RemoteControlProps> = ({ device }) => {
  const {
    isLoading,
    error,
    play,
    pause,
    stop,
    next,
    previous,
    volumeUp,
    volumeDown,
    mute,
    power,
    home,
    back,
    menu,
    ok,
    up,
    down,
    left,
    right,
  } = useDeviceControl();

  const [lastCommand, setLastCommand] = useState<string>('');

  const handleCommand = async (commandName: string, commandFunction: () => Promise<any>) => {
    try {
      setLastCommand(commandName);
      console.log(`🎮 Executing ${commandName} command on ${device.name}`);
      await commandFunction();
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

  const handlePlay = () => handleCommand('Play', () => play(device));
  const handlePause = () => handleCommand('Pause', () => pause(device));
  const handleStop = () => handleCommand('Stop', () => stop(device));
  const handleNext = () => handleCommand('Next', () => next(device));
  const handlePrevious = () => handleCommand('Previous', () => previous(device));
  const handleVolumeUp = () => handleCommand('Volume Up', () => volumeUp(device));
  const handleVolumeDown = () => handleCommand('Volume Down', () => volumeDown(device));
  const handleMute = () => handleCommand('Mute', () => mute(device));
  const handlePower = () => handleCommand('Power', () => power(device));
  const handleHome = () => handleCommand('Home', () => home(device));
  const handleBack = () => handleCommand('Back', () => back(device));
  const handleMenu = () => handleCommand('Menu', () => menu(device));
  const handleOk = () => handleCommand('OK', () => ok(device));
  const handleUp = () => handleCommand('Up', () => up(device));
  const handleDown = () => handleCommand('Down', () => down(device));
  const handleLeft = () => handleCommand('Left', () => left(device));
  const handleRight = () => handleCommand('Right', () => right(device));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Télécommande R_volution</Text>
      
      {/* Device Info */}
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{device.name}</Text>
        <Text style={styles.deviceIP}>{device.ip}:80</Text>
        <View style={styles.statusIndicator}>
          <Icon 
            name={device.isOnline ? "checkmark-circle" : "close-circle"} 
            size={16} 
            color={device.isOnline ? colors.success : colors.error} 
          />
          <Text style={[styles.statusText, device.isOnline ? styles.onlineText : styles.offlineText]}>
            {device.isOnline ? 'En ligne' : 'Hors ligne'}
          </Text>
        </View>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <Icon name="refresh" size={24} color={colors.background} />
            <Text style={styles.loadingText}>Envoi de {lastCommand}...</Text>
          </View>
        )}
      </View>

      {/* Power Control */}
      <View style={styles.controlSection}>
        <Text style={styles.sectionTitle}>Alimentation</Text>
        <View style={styles.buttonRow}>
          <Button 
            text="" 
            onPress={handlePower}
            style={styles.controlButton}
          >
            <Icon name="power" size={24} color={colors.background} />
            <Text style={styles.controlButtonText}>Power</Text>
          </Button>
        </View>
      </View>

      {/* Media Controls */}
      <View style={styles.controlSection}>
        <Text style={styles.sectionTitle}>Contrôles Média</Text>
        <View style={styles.buttonRow}>
          <Button 
            text="" 
            onPress={handlePrevious}
            style={styles.controlButton}
          >
            <Icon name="play-skip-back" size={24} color={colors.background} />
            <Text style={styles.controlButtonText}>Précédent</Text>
          </Button>
          <Button 
            text="" 
            onPress={handlePlay}
            style={styles.controlButton}
          >
            <Icon name="play" size={24} color={colors.background} />
            <Text style={styles.controlButtonText}>Play</Text>
          </Button>
          <Button 
            text="" 
            onPress={handlePause}
            style={styles.controlButton}
          >
            <Icon name="pause" size={24} color={colors.background} />
            <Text style={styles.controlButtonText}>Pause</Text>
          </Button>
          <Button 
            text="" 
            onPress={handleNext}
            style={styles.controlButton}
          >
            <Icon name="play-skip-forward" size={24} color={colors.background} />
            <Text style={styles.controlButtonText}>Suivant</Text>
          </Button>
        </View>
        <View style={styles.buttonRow}>
          <Button 
            text="" 
            onPress={handleStop}
            style={styles.controlButton}
          >
            <Icon name="stop" size={24} color={colors.background} />
            <Text style={styles.controlButtonText}>Stop</Text>
          </Button>
        </View>
      </View>

      {/* Navigation Controls */}
      <View style={styles.controlSection}>
        <Text style={styles.sectionTitle}>Navigation</Text>
        <View style={styles.navigationGrid}>
          <View style={styles.navRow}>
            <Button 
              text="" 
              onPress={handleUp}
              style={styles.navButton}
            >
              <Icon name="chevron-up" size={24} color={colors.background} />
            </Button>
          </View>
          <View style={styles.navRow}>
            <Button 
              text="" 
              onPress={handleLeft}
              style={styles.navButton}
            >
              <Icon name="chevron-back" size={24} color={colors.background} />
            </Button>
            <Button 
              text="" 
              onPress={handleOk}
              style={[styles.navButton, styles.centerButton]}
            >
              <Icon name="checkmark" size={28} color={colors.background} />
            </Button>
            <Button 
              text="" 
              onPress={handleRight}
              style={styles.navButton}
            >
              <Icon name="chevron-forward" size={24} color={colors.background} />
            </Button>
          </View>
          <View style={styles.navRow}>
            <Button 
              text="" 
              onPress={handleDown}
              style={styles.navButton}
            >
              <Icon name="chevron-down" size={24} color={colors.background} />
            </Button>
          </View>
        </View>
        <View style={styles.buttonRow}>
          <Button 
            text="" 
            onPress={handleBack}
            style={styles.controlButton}
          >
            <Icon name="arrow-back" size={24} color={colors.background} />
            <Text style={styles.controlButtonText}>Retour</Text>
          </Button>
          <Button 
            text="" 
            onPress={handleHome}
            style={styles.controlButton}
          >
            <Icon name="home" size={24} color={colors.background} />
            <Text style={styles.controlButtonText}>Accueil</Text>
          </Button>
          <Button 
            text="" 
            onPress={handleMenu}
            style={styles.controlButton}
          >
            <Icon name="menu" size={24} color={colors.background} />
            <Text style={styles.controlButtonText}>Menu</Text>
          </Button>
        </View>
      </View>

      {/* Volume Controls */}
      <View style={styles.controlSection}>
        <Text style={styles.sectionTitle}>Volume</Text>
        <View style={styles.volumeControls}>
          <Button 
            text="" 
            onPress={handleVolumeDown}
            style={styles.volumeButton}
          >
            <Icon name="volume-low" size={24} color={colors.background} />
            <Text style={styles.controlButtonText}>Vol -</Text>
          </Button>
          <Button 
            text="" 
            onPress={handleMute}
            style={styles.volumeButton}
          >
            <Icon name="volume-mute" size={24} color={colors.background} />
            <Text style={styles.controlButtonText}>Muet</Text>
          </Button>
          <Button 
            text="" 
            onPress={handleVolumeUp}
            style={styles.volumeButton}
          >
            <Icon name="volume-high" size={24} color={colors.background} />
            <Text style={styles.controlButtonText}>Vol +</Text>
          </Button>
        </View>
      </View>
    </View>
  );
};

export default RemoteControl;
