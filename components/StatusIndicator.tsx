
import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors } from '../styles/commonStyles';
import Icon from './Icon';

interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'connecting' | 'error';
  text?: string;
  showIcon?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  text,
  showIcon = true,
  size = 'medium',
}) => {
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (status === 'connecting') {
      const pulse = () => {
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.6,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start(() => pulse());
      };
      pulse();
    } else {
      pulseAnim.setValue(1);
    }
  }, [status, pulseAnim]);

  const getStatusConfig = () => {
    switch (status) {
      case 'online':
        return {
          color: colors.success,
          icon: 'checkmark-circle',
          defaultText: 'En ligne',
        };
      case 'offline':
        return {
          color: colors.accent,
          icon: 'close-circle',
          defaultText: 'Hors ligne',
        };
      case 'connecting':
        return {
          color: colors.warning,
          icon: 'sync',
          defaultText: 'Connexion...',
        };
      case 'error':
        return {
          color: colors.error,
          icon: 'alert-circle',
          defaultText: 'Erreur',
        };
      default:
        return {
          color: colors.grey,
          icon: 'help-circle',
          defaultText: 'Inconnu',
        };
    }
  };

  const config = getStatusConfig();
  const sizeConfig = {
    small: { iconSize: 12, fontSize: 12, padding: 4, gap: 4 },
    medium: { iconSize: 16, fontSize: 14, padding: 8, gap: 6 },
    large: { iconSize: 20, fontSize: 16, padding: 12, gap: 8 },
  };

  const currentSize = sizeConfig[size];

  return (
    <View style={[styles.container, { padding: currentSize.padding, gap: currentSize.gap }]}>
      {showIcon && (
        <Animated.View
          style={[
            styles.iconContainer,
            {
              opacity: status === 'connecting' ? pulseAnim : 1,
            },
          ]}
        >
          <Icon 
            name={config.icon} 
            size={currentSize.iconSize} 
            color={config.color} 
          />
        </Animated.View>
      )}
      <Text style={[styles.text, { 
        color: config.color, 
        fontSize: currentSize.fontSize 
      }]}>
        {text || config.defaultText}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: '500',
  },
});

export default StatusIndicator;
