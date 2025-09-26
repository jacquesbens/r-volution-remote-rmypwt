
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { RVolutionDevice } from '../types/Device';
import { colors, commonStyles } from '../styles/commonStyles';
import Icon from './Icon';

interface DeviceCardProps {
  device: RVolutionDevice;
  onPress: () => void;
  onRemove: () => void;
  onTest?: (device: RVolutionDevice) => Promise<boolean>;
}

const DeviceCard: React.FC<DeviceCardProps> = ({ device, onPress, onRemove, onTest }) => {
  const [isTesting, setIsTesting] = useState(false);

  const handleTestConnection = async () => {
    if (!onTest || isTesting) return;
    
    setIsTesting(true);
    console.log(`🧪 Testing connection to ${device.name} (${device.ip}:${device.port})`);
    
    try {
      const isConnected = await onTest(device);
      
      Alert.alert(
        'Test de connexion',
        isConnected 
          ? `✅ Connexion réussie avec ${device.name}\n\nL'appareil répond correctement sur ${device.ip}:${device.port}`
          : `❌ Connexion échouée avec ${device.name}\n\nL'appareil ne répond pas sur ${device.ip}:${device.port}\n\nVérifiez que l'appareil est allumé et connecté au réseau.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.log('❌ Test connection error:', error);
      Alert.alert(
        'Erreur de test',
        `Une erreur s'est produite lors du test de connexion avec ${device.name}.\n\nErreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.cardContent}>
        <View style={styles.deviceInfo}>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: device.isOnline ? '#4CAF50' : '#F44336' }]} />
            <Text style={styles.deviceName}>{device.name}</Text>
          </View>
          <Text style={styles.deviceIP}>{device.ip}:{device.port}</Text>
          <Text style={styles.deviceStatus}>
            {device.isOnline ? 'En ligne' : 'Hors ligne'} • {device.isManuallyAdded ? 'Manuel' : 'Découvert'}
          </Text>
          {device.lastSeen && (
            <Text style={styles.lastSeen}>
              Dernière connexion: {new Date(device.lastSeen).toLocaleString('fr-FR')}
            </Text>
          )}
        </View>
        
        <View style={styles.actions}>
          {onTest && (
            <TouchableOpacity 
              style={[styles.testButton, { opacity: isTesting ? 0.5 : 1 }]} 
              onPress={handleTestConnection}
              disabled={isTesting}
            >
              <Icon name={isTesting ? "hourglass" : "wifi"} size={18} color={colors.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
            <Icon name="trash-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceInfo: {
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  deviceIP: {
    fontSize: 14,
    color: colors.grey,
    marginBottom: 2,
  },
  deviceStatus: {
    fontSize: 12,
    color: colors.grey,
  },
  lastSeen: {
    fontSize: 11,
    color: colors.grey,
    fontStyle: 'italic',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  testButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: colors.background,
  },
  removeButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: colors.background,
  },
});

export default DeviceCard;
