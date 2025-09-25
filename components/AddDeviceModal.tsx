
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
  const [port, setPort] = useState('80');
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
      Alert.alert('Erreur', 'Format d\'adresse IP invalide (ex: 192.168.1.100)');
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
      setPort('80');
      setName('');
      onClose();
      Alert.alert('Succès', 'Appareil R_VOLUTION ajouté avec succès');
    } catch (error) {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Impossible d\'ajouter l\'appareil R_VOLUTION');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIp('');
    setPort('80');
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
            <Text style={styles.title}>Ajouter appareil R_VOLUTION</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <Text style={styles.description}>
              Ajoutez manuellement un appareil R_VOLUTION en saisissant son adresse IP sur le réseau local.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Adresse IP de l'appareil R_VOLUTION *</Text>
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
              <Text style={styles.label}>Port (défaut: 80)</Text>
              <TextInput
                style={styles.input}
                value={port}
                onChangeText={setPort}
                placeholder="80"
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

            <View style={styles.infoBox}>
              <Icon name="information-circle" size={16} color={colors.primary} />
              <Text style={styles.infoText}>
                L'appareil doit être connecté au même réseau Wi-Fi et avoir le nom réseau "R_VOLUTION"
              </Text>
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
              text={isLoading ? "Connexion..." : "Ajouter"}
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
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  form: {
    marginBottom: 24,
  },
  description: {
    fontSize: 14,
    color: colors.grey,
    lineHeight: 20,
    marginBottom: 20,
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  infoText: {
    fontSize: 12,
    color: colors.grey,
    lineHeight: 16,
    flex: 1,
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
