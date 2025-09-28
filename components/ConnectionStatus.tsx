
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { colors } from '../styles/commonStyles';
import { RVolutionDevice } from '../types/Device';
import { useDeviceDiscovery } from '../hooks/useDeviceDiscovery';
import StatusIndicator from './StatusIndicator';
import Icon from './Icon';

interface ConnectionStatusProps {
  device: RVolutionDevice;
  onRetry?: () => void;
  showDetails?: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  device,
  onRetry,
  showDetails = true,
}) => {
  const { testDeviceConnectivity } = useDeviceDiscovery();
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [lastTestTime, setLastTestTime] = useState<Date | null>(null);
  const slideAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate in when component mounts
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  const handleTestConnection = async () => {
    if (isTestingConnection) return;
    
    setIsTestingConnection(true);
    try {
      console.log(`🧪 Testing connection for ${device.name}`);
      const isReachable = await testDeviceConnectivity(device);
      setLastTestTime(new Date());
      
      if (onRetry) {
        onRetry();
      }
      
      console.log(`${isReachable ? '✅' : '❌'} Connection test result: ${isReachable}`);
    } catch (error) {
      console.log('❌ Connection test failed:', error);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const getConnectionStatus = () => {
    if (isTestingConnection) return 'connecting';
    return device.isOnline ? 'online' : 'offline';
  };

  const formatLastSeen = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'À l\'instant';
    if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString();
  };

  const isValidLastSeen = (lastSeen: Date) => {
    return lastSeen && lastSeen.getTime() > 0;
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: slideAnim,
          transform: [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.statusRow}>
        <StatusIndicator
          status={getConnectionStatus()}
          text={isTestingConnection ? 'Test en cours...' : undefined}
          size="medium"
        />
        
        <TouchableOpacity
          style={[styles.testButton, { opacity: isTestingConnection ? 0.6 : 1 }]}
          onPress={handleTestConnection}
          disabled={isTestingConnection}
        >
          <Icon 
            name={isTestingConnection ? "sync" : "refresh"} 
            size={16} 
            color={colors.primary} 
          />
          <Text style={styles.testButtonText}>
            {isTestingConnection ? 'Test...' : 'Tester'}
          </Text>
        </TouchableOpacity>
      </View>

      {showDetails && (
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Icon name="globe" size={14} color={colors.grey} />
            <Text style={styles.detailText}>
              {device.ip}:{device.port}
            </Text>
          </View>
          
          {isValidLastSeen(device.lastSeen) && (
            <View style={styles.detailRow}>
              <Icon name="time" size={14} color={colors.grey} />
              <Text style={styles.detailText}>
                {formatLastSeen(device.lastSeen)}
              </Text>
            </View>
          )}
          
          {lastTestTime && (
            <View style={styles.detailRow}>
              <Icon name="checkmark" size={14} color={colors.success} />
              <Text style={styles.detailText}>
                Testé {formatLastSeen(lastTestTime)}
              </Text>
            </View>
          )}
          
          {device.isManuallyAdded && (
            <View style={styles.detailRow}>
              <Icon name="person" size={14} color={colors.warning} />
              <Text style={styles.detailText}>Ajouté manuellement</Text>
            </View>
          )}
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  testButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  detailsContainer: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: colors.grey,
  },
});

export default ConnectionStatus;
