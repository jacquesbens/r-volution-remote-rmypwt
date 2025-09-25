
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RVolutionDevice } from '../types/Device';
import { colors, commonStyles } from '../styles/commonStyles';
import Icon from './Icon';

interface DeviceCardProps {
  device: RVolutionDevice;
  onPress: () => void;
  onRemove: () => void;
}

const DeviceCard: React.FC<DeviceCardProps> = ({ device, onPress, onRemove }) => {
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
        </View>
        
        <View style={styles.actions}>
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
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  removeButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: colors.background,
  },
});

export default DeviceCard;
