
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface IconProps {
  name: any;
  size?: number;
  style?: object;
  color?: string;
}

const Icon: React.FC<IconProps> = ({ name, size = 40, style, color = "black" }) => {
  return (
    <View style={[styles.iconContainer, style]}>
      <Ionicons name={name} size={size} color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Icon;
