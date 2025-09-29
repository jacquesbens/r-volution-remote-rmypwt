
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { colors } from '../styles/commonStyles';
import Icon from './Icon';
import Button from './Button';

interface IRCodeEditModalProps {
  visible: boolean;
  buttonName: string;
  currentCode: string;
  onClose: () => void;
  onSave: (newCode: string) => void;
  onResetToDefault?: () => void;
  hasCustomCode?: boolean;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    marginLeft: 12,
  },
  closeButton: {
    padding: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    fontFamily: 'monospace',
  },
  inputFocused: {
    borderColor: colors.primary,
  },
  hint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 20,
    lineHeight: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dangerButton: {
    backgroundColor: '#f56565',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: '#fff',
  },
  secondaryButtonText: {
    color: colors.text,
  },
  customIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 8,
    backgroundColor: colors.primary + '20',
    borderRadius: 6,
  },
  customIndicatorText: {
    fontSize: 12,
    color: colors.primary,
    marginLeft: 6,
    fontWeight: '600',
  },
});

const IRCodeEditModal: React.FC<IRCodeEditModalProps> = ({
  visible,
  buttonName,
  currentCode,
  onClose,
  onSave,
  onResetToDefault,
  hasCustomCode = false,
}) => {
  const [code, setCode] = useState(currentCode);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setCode(currentCode);
  }, [currentCode, visible]);

  const handleSave = () => {
    const trimmedCode = code.trim().toUpperCase();
    
    if (!trimmedCode) {
      Alert.alert('Erreur', 'Veuillez entrer un code IR valide.');
      return;
    }

    // Basic validation for IR code format (8 characters hexadecimal)
    if (!/^[0-9A-F]{8}$/.test(trimmedCode)) {
      Alert.alert(
        'Format invalide',
        'Le code IR doit être composé de 8 caractères hexadécimaux (0-9, A-F).\n\nExemple: ED124040'
      );
      return;
    }

    onSave(trimmedCode);
    onClose();
  };

  const handleReset = () => {
    if (onResetToDefault) {
      Alert.alert(
        'Réinitialiser le code',
        'Voulez-vous vraiment réinitialiser ce bouton à son code IR par défaut ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Réinitialiser',
            style: 'destructive',
            onPress: () => {
              onResetToDefault();
              onClose();
            },
          },
        ]
      );
    }
  };

  const formatCode = (text: string) => {
    // Remove non-hex characters and limit to 8 characters
    const cleaned = text.replace(/[^0-9A-Fa-f]/g, '').toUpperCase().slice(0, 8);
    return cleaned;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior="padding"
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={onClose}
        >
          <TouchableOpacity
            style={styles.modal}
            activeOpacity={1}
            onPress={() => {}}
          >
            <View style={styles.header}>
              <Icon name="settings" size={20} color={colors.primary} />
              <Text style={styles.title}>Modifier le code IR</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
              >
                <Icon name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {hasCustomCode && (
              <View style={styles.customIndicator}>
                <Icon name="checkmark-circle" size={16} color={colors.primary} />
                <Text style={styles.customIndicatorText}>
                  Code personnalisé actif
                </Text>
              </View>
            )}

            <Text style={styles.label}>Bouton: {buttonName}</Text>
            
            <Text style={styles.label}>Code IR (hexadécimal):</Text>
            <TextInput
              style={[styles.input, isFocused && styles.inputFocused]}
              value={code}
              onChangeText={(text) => setCode(formatCode(text))}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="ED124040"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={8}
            />
            
            <Text style={styles.hint}>
              Le code IR doit être composé de 8 caractères hexadécimaux (0-9, A-F).
              {'\n'}Exemple: ED124040, F2004040, etc.
            </Text>

            <View style={styles.buttonContainer}>
              {hasCustomCode && onResetToDefault && (
                <TouchableOpacity
                  style={[styles.button, styles.dangerButton]}
                  onPress={handleReset}
                >
                  <Text style={[styles.buttonText, styles.primaryButtonText]}>
                    Défaut
                  </Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={onClose}
              >
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                  Annuler
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handleSave}
              >
                <Text style={[styles.buttonText, styles.primaryButtonText]}>
                  Sauvegarder
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default IRCodeEditModal;
