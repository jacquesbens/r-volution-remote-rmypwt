
import React from 'react';
import { Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../styles/commonStyles';

interface ButtonProps {
  text: string;
  onPress: () => void;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle;
  children?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ text, onPress, style, textStyle, children }) => {
  return (
    <TouchableOpacity style={[styles.button, style]} onPress={onPress}>
      {children}
      {text && <Text style={[styles.text, textStyle]}>{text}</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  text: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Button;
