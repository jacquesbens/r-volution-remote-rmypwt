
import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
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
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  closeButton: {
    padding: 8,
  },
  deviceInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  deviceName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  deviceIP: {
    color: '#888',
    fontSize: 14,
    marginTop: 2,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statusText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '500',
  },
  onlineText: {
    color: '#4CAF50',
  },
  offlineText: {
    color: '#f44336',
  },
  // Top control row (rewind, play/pause, forward, stop, record)
  topControlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  topControlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2a2a3e',
    borderWidth: 2,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Second row (TV, VOD, Guide, Info)
  secondRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  secondRowButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#2a2a3e',
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  secondRowText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  // Number pad
  numberPad: {
    marginBottom: 20,
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 30,
  },
  numberButton: {
    width: 60,
    height: 50,
    backgroundColor: '#2a2a3e',
    borderWidth: 2,
    borderColor: '#444',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  specialButton: {
    backgroundColor: '#d32f2f',
  },
  // Navigation section
  navigationSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  navigationCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: '#555',
    backgroundColor: '#2a2a3e',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  navButton: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonUp: {
    top: 10,
  },
  navButtonDown: {
    bottom: 10,
  },
  navButtonLeft: {
    left: 10,
  },
  navButtonRight: {
    right: 10,
  },
  okButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#555',
    alignItems: 'center',
    justifyContent: 'center',
  },
  okText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Bottom controls
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  bottomButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#2a2a3e',
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 80,
  },
  bottomButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  // Volume controls
  volumeControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  volumeButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#2a2a3e',
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 70,
  },
  volumeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  muteButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#2a2a3e',
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 8,
    alignItems: 'center',
  },
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
    fastForward,
    fastReverse,
    skip60Forward,
    skip60Rewind,
    skip10Forward,
    skip10Rewind,
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
    number,
    tv,
    vod,
    guide,
    info,
  } = useDeviceControl();

  const [lastCommand, setLastCommand] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);

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

  const handlePlayPause = () => {
    if (isPlaying) {
      handleCommand('Pause', () => pause(device));
      setIsPlaying(false);
    } else {
      handleCommand('Play', () => play(device));
      setIsPlaying(true);
    }
  };

  const handleNumber = (num: number) => {
    handleCommand(`Number ${num}`, () => number(device, num));
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Icon name="power" size={20} color="#fff" />
            <Text style={styles.headerTitle}>Télécommande</Text>
          </View>
          <Button text="" onPress={() => {}} style={styles.closeButton}>
            <Icon name="close" size={24} color="#fff" />
          </Button>
        </View>

        {/* Device Info */}
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName}>{device.name}</Text>
          <Text style={styles.deviceIP}>{device.ip}:80</Text>
          <View style={styles.statusIndicator}>
            <Icon 
              name={device.isOnline ? "checkmark-circle" : "close-circle"} 
              size={12} 
              color={device.isOnline ? '#4CAF50' : '#f44336'} 
            />
            <Text style={[styles.statusText, device.isOnline ? styles.onlineText : styles.offlineText]}>
              {device.isOnline ? 'En ligne' : 'Hors ligne'}
            </Text>
          </View>
        </View>

        {/* Top Control Row */}
        <View style={styles.topControlRow}>
          <Button 
            text="" 
            onPress={() => handleCommand('Fast Reverse', () => fastReverse(device))}
            style={styles.topControlButton}
          >
            <Icon name="play-skip-back" size={20} color="#fff" />
          </Button>
          <Button 
            text="" 
            onPress={handlePlayPause}
            style={styles.topControlButton}
          >
            <Icon name={isPlaying ? "pause" : "play"} size={20} color="#fff" />
          </Button>
          <Button 
            text="" 
            onPress={() => handleCommand('Fast Forward', () => fastForward(device))}
            style={styles.topControlButton}
          >
            <Icon name="play-skip-forward" size={20} color="#fff" />
          </Button>
          <Button 
            text="" 
            onPress={() => handleCommand('Stop', () => stop(device))}
            style={styles.topControlButton}
          >
            <Icon name="stop" size={20} color="#fff" />
          </Button>
          <Button 
            text="" 
            onPress={() => handleCommand('Record', () => {})}
            style={[styles.topControlButton, { backgroundColor: '#d32f2f' }]}
          >
            <Icon name="radio-button-on" size={20} color="#fff" />
          </Button>
        </View>

        {/* Second Row - TV/VOD/Guide/Info */}
        <View style={styles.secondRow}>
          <Button 
            text="" 
            onPress={() => handleCommand('TV', () => tv(device))}
            style={styles.secondRowButton}
          >
            <Text style={styles.secondRowText}>TV</Text>
          </Button>
          <Button 
            text="" 
            onPress={() => handleCommand('VOD', () => vod(device))}
            style={styles.secondRowButton}
          >
            <Text style={styles.secondRowText}>VOD</Text>
          </Button>
          <Button 
            text="" 
            onPress={() => handleCommand('Guide', () => guide(device))}
            style={styles.secondRowButton}
          >
            <Text style={styles.secondRowText}>Guide</Text>
          </Button>
          <Button 
            text="" 
            onPress={() => handleCommand('Info', () => info(device))}
            style={styles.secondRowButton}
          >
            <Text style={styles.secondRowText}>Info</Text>
          </Button>
        </View>

        {/* Number Pad */}
        <View style={styles.numberPad}>
          <View style={styles.numberRow}>
            <Button 
              text="" 
              onPress={() => handleNumber(1)}
              style={styles.numberButton}
            >
              <Text style={styles.numberText}>1</Text>
            </Button>
            <Button 
              text="" 
              onPress={() => handleNumber(2)}
              style={styles.numberButton}
            >
              <Text style={styles.numberText}>2</Text>
            </Button>
            <Button 
              text="" 
              onPress={() => handleNumber(3)}
              style={styles.numberButton}
            >
              <Text style={styles.numberText}>3</Text>
            </Button>
          </View>
          <View style={styles.numberRow}>
            <Button 
              text="" 
              onPress={() => handleNumber(4)}
              style={styles.numberButton}
            >
              <Text style={styles.numberText}>4</Text>
            </Button>
            <Button 
              text="" 
              onPress={() => handleNumber(5)}
              style={styles.numberButton}
            >
              <Text style={styles.numberText}>5</Text>
            </Button>
            <Button 
              text="" 
              onPress={() => handleNumber(6)}
              style={styles.numberButton}
            >
              <Text style={styles.numberText}>6</Text>
            </Button>
          </View>
          <View style={styles.numberRow}>
            <Button 
              text="" 
              onPress={() => handleNumber(7)}
              style={styles.numberButton}
            >
              <Text style={styles.numberText}>7</Text>
            </Button>
            <Button 
              text="" 
              onPress={() => handleNumber(8)}
              style={styles.numberButton}
            >
              <Text style={styles.numberText}>8</Text>
            </Button>
            <Button 
              text="" 
              onPress={() => handleNumber(9)}
              style={styles.numberButton}
            >
              <Text style={styles.numberText}>9</Text>
            </Button>
          </View>
          <View style={styles.numberRow}>
            <Button 
              text="" 
              onPress={() => handleCommand('Previous', () => previous(device))}
              style={[styles.numberButton, styles.specialButton]}
            >
              <Icon name="chevron-back" size={20} color="#fff" />
            </Button>
            <Button 
              text="" 
              onPress={() => handleNumber(0)}
              style={styles.numberButton}
            >
              <Text style={styles.numberText}>0</Text>
            </Button>
            <Button 
              text="" 
              onPress={() => handleCommand('Next', () => next(device))}
              style={styles.numberButton}
            >
              <Text style={[styles.numberText, { fontSize: 10 }]}>be tv</Text>
            </Button>
          </View>
        </View>

        {/* Navigation Circle */}
        <View style={styles.navigationSection}>
          <View style={styles.navigationCircle}>
            <Button 
              text="" 
              onPress={() => handleCommand('Up', () => up(device))}
              style={[styles.navButton, styles.navButtonUp]}
            >
              <Icon name="chevron-up" size={20} color="#fff" />
            </Button>
            <Button 
              text="" 
              onPress={() => handleCommand('Left', () => left(device))}
              style={[styles.navButton, styles.navButtonLeft]}
            >
              <Icon name="chevron-back" size={20} color="#fff" />
            </Button>
            <Button 
              text="" 
              onPress={() => handleCommand('OK', () => ok(device))}
              style={styles.okButton}
            >
              <Text style={styles.okText}>OK</Text>
            </Button>
            <Button 
              text="" 
              onPress={() => handleCommand('Right', () => right(device))}
              style={[styles.navButton, styles.navButtonRight]}
            >
              <Icon name="chevron-forward" size={20} color="#fff" />
            </Button>
            <Button 
              text="" 
              onPress={() => handleCommand('Down', () => down(device))}
              style={[styles.navButton, styles.navButtonDown]}
            >
              <Icon name="chevron-down" size={20} color="#fff" />
            </Button>
          </View>
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <Button 
            text="" 
            onPress={() => handleCommand('Back', () => back(device))}
            style={styles.bottomButton}
          >
            <Text style={styles.bottomButtonText}>Back</Text>
          </Button>
          <Button 
            text="" 
            onPress={() => handleCommand('Home', () => home(device))}
            style={styles.bottomButton}
          >
            <Text style={styles.bottomButtonText}>Home</Text>
          </Button>
        </View>

        {/* Volume Controls */}
        <View style={styles.volumeControls}>
          <Button 
            text="" 
            onPress={() => handleCommand('Volume Down', () => volumeDown(device))}
            style={styles.volumeButton}
          >
            <Text style={styles.volumeText}>Vol -</Text>
          </Button>
          <Button 
            text="" 
            onPress={() => handleCommand('Mute', () => mute(device))}
            style={styles.muteButton}
          >
            <Icon name="volume-mute" size={20} color="#fff" />
          </Button>
          <Button 
            text="" 
            onPress={() => handleCommand('Volume Up', () => volumeUp(device))}
            style={styles.volumeButton}
          >
            <Text style={styles.volumeText}>Vol +</Text>
          </Button>
        </View>

        {/* Skip Controls - Additional buttons from the document */}
        <View style={[styles.bottomControls, { marginTop: 20 }]}>
          <Button 
            text="" 
            onPress={() => handleCommand('10s Rewind', () => skip10Rewind(device))}
            style={[styles.bottomButton, { backgroundColor: '#444' }]}
          >
            <Text style={[styles.bottomButtonText, { fontSize: 10 }]}>-10s</Text>
          </Button>
          <Button 
            text="" 
            onPress={() => handleCommand('60s Rewind', () => skip60Rewind(device))}
            style={[styles.bottomButton, { backgroundColor: '#444' }]}
          >
            <Text style={[styles.bottomButtonText, { fontSize: 10 }]}>-60s</Text>
          </Button>
          <Button 
            text="" 
            onPress={() => handleCommand('10s Forward', () => skip10Forward(device))}
            style={[styles.bottomButton, { backgroundColor: '#444' }]}
          >
            <Text style={[styles.bottomButtonText, { fontSize: 10 }]}>+10s</Text>
          </Button>
          <Button 
            text="" 
            onPress={() => handleCommand('60s Forward', () => skip60Forward(device))}
            style={[styles.bottomButton, { backgroundColor: '#444' }]}
          >
            <Text style={[styles.bottomButtonText, { fontSize: 10 }]}>+60s</Text>
          </Button>
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
