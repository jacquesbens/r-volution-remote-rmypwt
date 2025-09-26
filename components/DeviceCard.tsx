
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
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
  const [lastTestResult, setLastTestResult] = useState<{
    success: boolean;
    timestamp: Date;
  } | null>(null);

  const handleTestConnection = async () => {
    if (!onTest || isTesting) return;
    
    console.log(`🧪 Testing device: ${device.name} (${device.ip}:${device.port})`);
    setIsTesting(true);
    
    try {
      const success = await onTest(device);
      setLastTestResult({
        success,
        timestamp: new Date(),
      });
      console.log(`${success ? '✅' : '❌'} Test result for ${device.name}: ${success}`);
    } catch (error) {
      console.log(`❌ Test failed for ${device.name}:`, error);
      setLastTestResult({
        success: false,
        timestamp: new Date(),
      });
    } finally {
      setIsTesting(false);
    }
  };

  const formatLastSeen = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString();
  };

  const getStatusColor = () => {
    if (device.isOnline) return '#4CAF50';
    if (lastTestResult?.success) return '#FF9500';
    return '#F44336';
  };

  const getStatusText = () => {
    if (device.isOnline) return 'En ligne';
    if (lastTestResult?.success) return 'Testé OK';
    return 'Hors ligne';
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardContent}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.header}>
          <View style={styles.deviceInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.deviceName} numberOfLines={1}>
                {device.name}
              </Text>
              {device.isManuallyAdded && (
                <View style={styles.manualBadge}>
                  <Text style={styles.manualBadgeText}>Manuel</Text>
                </View>
              )}
            </View>
            
            <Text style={styles.deviceAddress}>
              {device.ip}:{device.port}
            </Text>
          </View>

          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
        </View>

        <View style={styles.details}>
          <View style={styles.statusRow}>
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
            
            {device.lastSeen && device.lastSeen.getTime() > 0 && (
              <Text style={styles.lastSeenText}>
                {formatLastSeen(device.lastSeen)}
              </Text>
            )}
          </View>

          {lastTestResult && (
            <View style={styles.testResult}>
              <Icon 
                name={lastTestResult.success ? 'checkmark-circle' : 'close-circle'} 
                size={12} 
                color={lastTestResult.success ? '#4CAF50' : '#F44336'} 
              />
              <Text style={styles.testResultText}>
                Dernier test: {lastTestResult.success ? 'Réussi' : 'Échoué'} 
                {' '}({formatLastSeen(lastTestResult.timestamp)})
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleTestConnection}
          disabled={isTesting}
        >
          {isTesting ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Icon name="wifi" size={16} color={colors.primary} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            Alert.alert(
              'Informations de l\'appareil',
              `Nom: ${device.name}\n` +
              `Adresse: ${device.ip}:${device.port}\n` +
              `Statut: ${getStatusText()}\n` +
              `Type: ${device.isManuallyAdded ? 'Ajout manuel' : 'Découverte automatique'}\n` +
              `Dernière connexion: ${device.lastSeen && device.lastSeen.getTime() > 0 ? formatLastSeen(device.lastSeen) : 'Jamais'}`,
              [{ text: 'OK' }]
            );
          }}
        >
          <Icon name="information-circle" size={16} color={colors.grey} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.removeButton]}
          onPress={() => {
            Alert.alert(
              'Supprimer l\'appareil',
              `Êtes-vous sûr de vouloir supprimer "${device.name}" ?`,
              [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Supprimer', style: 'destructive', onPress: onRemove },
              ]
            );
          }}
        >
          <Icon name="trash" size={16} color="#F44336" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.grey + '20',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  cardContent: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  deviceInfo: {
    flex: 1,
    marginRight: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  manualBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  manualBadgeText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '500',
  },
  deviceAddress: {
    fontSize: 14,
    color: colors.grey,
    fontFamily: 'monospace',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  details: {
    gap: 6,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  lastSeenText: {
    fontSize: 12,
    color: colors.grey,
  },
  testResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  testResultText: {
    fontSize: 12,
    color: colors.grey,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.grey + '20',
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: colors.background,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButton: {
    backgroundColor: '#F44336' + '10',
  },
});

export default DeviceCard;
