
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, Modal, TouchableOpacity } from 'react-native';
import { colors } from '../styles/commonStyles';
import Button from './Button';
import Icon from './Icon';

interface AddDeviceModalProps {
  visible: boolean;
  onClose: () => void;
  onAddDevice: (ip: string, port: number, name?: string) => Promise<void>;
}

const AddDeviceModal: React.FC<AddDeviceModalProps> = ({ visible, onClose, onAddDevice }) => {
  const [ip, setIp] = useState('');
  const [port, setPort] = useState('8080');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddDevice = async () => {
    if (!ip.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse IP');
      return;
    }

    // Basic IP validation
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip.trim())) {
      Alert.alert('Erreur', 'Format d\'adresse IP invalide');
      return;
    }

    const portNumber = parseInt(port, 10);
    if (isNaN(portNumber) || portNumber < 1 || portNumber > 65535) {
      Alert.alert('Erreur', 'Port invalide (1-65535)');
      return;
    }

    setIsLoading(true);
    try {
      await onAddDevice(ip.trim(), portNumber, name.trim() || undefined);
      setIp('');
      setPort('8080');
      setName('');
      onClose();
      Alert.alert('Succès', 'Appareil ajouté avec succès');
    } catch (error) {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Impossible d\'ajouter l\'appareil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIp('');
    setPort('8080');
    setName('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Ajouter un appareil</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Adresse IP *</Text>
              <TextInput
                style={styles.input}
                value={ip}
                onChangeText={setIp}
                placeholder="192.168.1.100"
                placeholderTextColor={colors.grey}
                keyboardType="numeric"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Port</Text>
              <TextInput
                style={styles.input}
                value={port}
                onChangeText={setPort}
                placeholder="8080"
                placeholderTextColor={colors.grey}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom personnalisé (optionnel)</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Mon lecteur R_VOLUTION"
                placeholderTextColor={colors.grey}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.buttons}>
            <Button
              text="Annuler"
              onPress={handleClose}
              style={[styles.button, styles.cancelButton]}
              textStyle={styles.cancelButtonText}
            />
            <Button
              text={isLoading ? "Ajout..." : "Ajouter"}
              onPress={handleAddDevice}
              style={[styles.button, styles.addButton, { opacity: isLoading ? 0.5 : 1 }]}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.3)',
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
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
    borderColor: colors.grey,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: colors.background,
  },
  cancelButtonText: {
    color: colors.grey,
  },
  addButton: {
    backgroundColor: colors.primary,
  },
});

export default AddDeviceModal;
