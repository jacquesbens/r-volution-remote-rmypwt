
import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { RVolutionDevice } from '../types/Device';
import { colors } from '../styles/commonStyles';
import { useDeviceControl } from '../hooks/useDeviceControl';
import Button from './Button';
import Icon from './Icon';

interface RemoteControlProps {
  device: RVolutionDevice;
}

const RemoteControl: React.FC<RemoteControlProps> = ({ device }) => {
  const { isLoading, error, play, pause, stop, next, previous, setVolume, mute } = useDeviceControl();
  const [volume, setVolumeState] = useState(50);
  const [isMuted, setIsMuted] = useState(false);

  const handlePlay = async () => {
    try {
      await play(device);
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de lancer la lecture');
    }
  };

  const handlePause = async () => {
    try {
      await pause(device);
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de mettre en pause');
    }
  };

  const handleStop = async () => {
    try {
      await stop(device);
    } catch (err) {
      Alert.alert('Erreur', 'Impossible d\'arrêter la lecture');
    }
  };

  const handleNext = async () => {
    try {
      await next(device);
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de passer au suivant');
    }
  };

  const handlePrevious = async () => {
    try {
      await previous(device);
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de revenir au précédent');
    }
  };

  const handleVolumeUp = async () => {
    const newVolume = Math.min(100, volume + 10);
    setVolumeState(newVolume);
    try {
      await setVolume(device, newVolume);
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de modifier le volume');
    }
  };

  const handleVolumeDown = async () => {
    const newVolume = Math.max(0, volume - 10);
    setVolumeState(newVolume);
    try {
      await setVolume(device, newVolume);
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de modifier le volume');
    }
  };

  const handleMute = async () => {
    try {
      await mute(device);
      setIsMuted(!isMuted);
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de couper le son');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.deviceHeader}>
        <View style={[styles.statusDot, { backgroundColor: device.isOnline ? '#4CAF50' : '#F44336' }]} />
        <Text style={styles.deviceName}>{device.name}</Text>
      </View>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Transport Controls */}
      <View style={styles.transportControls}>
        <Button
          text=""
          onPress={handlePrevious}
          style={[styles.controlButton, { opacity: isLoading ? 0.5 : 1 }]}
        >
          <Icon name="play-skip-back" size={24} color={colors.text} />
        </Button>

        <Button
          text=""
          onPress={handlePlay}
          style={[styles.controlButton, styles.playButton, { opacity: isLoading ? 0.5 : 1 }]}
        >
          <Icon name="play" size={32} color={colors.text} />
        </Button>

        <Button
          text=""
          onPress={handlePause}
          style={[styles.controlButton, { opacity: isLoading ? 0.5 : 1 }]}
        >
          <Icon name="pause" size={24} color={colors.text} />
        </Button>

        <Button
          text=""
          onPress={handleNext}
          style={[styles.controlButton, { opacity: isLoading ? 0.5 : 1 }]}
        >
          <Icon name="play-skip-forward" size={24} color={colors.text} />
        </Button>
      </View>

      {/* Stop Button */}
      <View style={styles.stopContainer}>
        <Button
          text=""
          onPress={handleStop}
          style={[styles.controlButton, styles.stopButton, { opacity: isLoading ? 0.5 : 1 }]}
        >
          <Icon name="stop" size={24} color={colors.text} />
        </Button>
      </View>

      {/* Volume Controls */}
      <View style={styles.volumeControls}>
        <Text style={styles.volumeLabel}>Volume: {volume}%</Text>
        
        <View style={styles.volumeButtons}>
          <Button
            text=""
            onPress={handleVolumeDown}
            style={[styles.volumeButton, { opacity: isLoading ? 0.5 : 1 }]}
          >
            <Icon name="volume-low" size={20} color={colors.text} />
          </Button>

          <Button
            text=""
            onPress={handleMute}
            style={[styles.volumeButton, { opacity: isLoading ? 0.5 : 1, backgroundColor: isMuted ? colors.accent : colors.backgroundAlt }]}
          >
            <Icon name={isMuted ? "volume-mute" : "volume-high"} size={20} color={colors.text} />
          </Button>

          <Button
            text=""
            onPress={handleVolumeUp}
            style={[styles.volumeButton, { opacity: isLoading ? 0.5 : 1 }]}
          >
            <Icon name="volume-high" size={20} color={colors.text} />
          </Button>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    justifyContent: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  deviceName: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  errorContainer: {
    backgroundColor: '#F44336',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 14,
  },
  transportControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    gap: 15,
  },
  stopContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.2)',
    elevation: 4,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  volumeControls: {
    alignItems: 'center',
  },
  volumeLabel: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 15,
    fontWeight: '500',
  },
  volumeButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  volumeButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RemoteControl;
