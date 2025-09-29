
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SimpleIconProps {
  name: string;
  size?: number;
  color?: string;
  style?: object;
}

const SimpleIcon: React.FC<SimpleIconProps> = ({ name, size = 24, color = '#000', style }) => {
  // Simple icon mapping using Unicode symbols and text
  const getIconSymbol = (iconName: string): string => {
    const iconMap: { [key: string]: string } = {
      'close': '✕',
      'add-circle': '⊕',
      'wifi-outline': '📶',
      'business': '🏢',
      'shield-checkmark': '🛡️',
      'power': '⚡',
      'refresh': '🔄',
      'chevron-up': '▲',
      'chevron-down': '▼',
      'help-circle': '❓',
      'wifi': '📶',
      'information-circle': 'ℹ️',
      'warning': '⚠️',
      'analytics': '📊',
      'settings': '⚙️',
      'add': '+',
      'help': '?',
      'checkmark-circle': '✅',
      'close-circle': '❌',
      'create-outline': '✏️',
      'trash': '🗑️',
      'search': '🔍',
      'hardware-chip': '🔧',
      'construct': '🔨',
      'target': '🎯',
      'play-circle': '▶️',
      'arrow-back': '←',
      'alert-circle': '⚠️',
      'list': '📋',
      'sunny': '☀️',
      'play-skip-back': '⏮️',
      'play-skip-forward': '⏭️',
      'play-back': '⏪',
      'play-forward': '⏩',
      'stop': '⏹️',
      'repeat': '🔁',
      'text': '📝',
      'musical-notes': '🎵',
      'cube': '🧊',
      'chevron-back': '◀',
      'chevron-forward': '▶',
      'home': '🏠',
      'menu': '☰',
      'backspace': '⌫',
      'arrow-down': '↓',
      'arrow-up': '↑',
      'videocam': '📹',
      'folder': '📁',
      'volume-low': '🔉',
      'volume-mute': '🔇',
      'volume-high': '🔊',
      'sync': '🔄',
      'globe': '🌐',
      'time': '⏰',
      'checkmark': '✓',
      'person': '👤',
      'error': '❌',
    };
    
    return iconMap[iconName] || '●';
  };

  return (
    <View style={[styles.iconContainer, style]}>
      <Text style={[styles.iconText, { fontSize: size, color }]}>
        {getIconSymbol(name)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default SimpleIcon;
