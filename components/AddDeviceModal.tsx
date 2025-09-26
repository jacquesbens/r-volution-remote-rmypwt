
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
    console.log('=== ADD DEVICE MODAL - HANDLE ADD DEVICE ===');
    console.log('Form values:', { ip: ip.trim(), port, name: name.trim() });
    
    if (!ip.trim()) {
      console.log('Validation failed: No IP provided');
      Alert.alert('Erreur', 'Veuillez entrer une adresse IP');
      return;
    }

    // Basic IP validation
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip.trim())) {
      console.log('Validation failed: Invalid IP format');
      Alert.alert('Erreur', 'Format d\'adresse IP invalide (ex: 192.168.1.100)');
      return;
    }

    // Validate IP ranges (0-255 for each octet)
    const octets = ip.trim().split('.');
    const invalidOctet = octets.find(octet => {
      const num = parseInt(octet, 10);
      return isNaN(num) || num < 0 || num > 255;
    });
    
    if (invalidOctet) {
      console.log('Validation failed: Invalid IP range');
      Alert.alert('Erreur', 'Adresse IP invalide. Chaque partie doit être entre 0 et 255');
      return;
    }

    const portNumber = parseInt(port, 10);
    if (isNaN(portNumber) || portNumber < 1 || portNumber > 65535) {
      console.log('Validation failed: Invalid port');
      Alert.alert('Erreur', 'Port invalide (1-65535)');
      return;
    }

    console.log('Validation passed, starting device addition...');
    setIsLoading(true);
    
    try {
      console.log('Calling onAddDevice prop...');
      await onAddDevice(ip.trim(), portNumber, name.trim() || undefined);
      
      console.log('Device addition successful, clearing form...');
      setIp('');
      setPort('80');
      setName('');
      
      console.log('Form cleared, closing modal...');
      onClose();
      
    } catch (error) {
      console.log('=== ADD DEVICE MODAL - ERROR ===');
      console.log('Error in modal:', error);
      // Error is handled by the parent component
    } finally {
      console.log('Setting loading to false...');
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    console.log('Modal close requested, clearing form...');
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
              <Text style={styles.label}>Adresse IP de l'appareil *</Text>
              <TextInput
                style={styles.input}
                value={ip}
                onChangeText={(text) => {
                  console.log('IP input changed:', text);
                  setIp(text);
                }}
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
                onChangeText={(text) => {
                  console.log('Port input changed:', text);
                  setPort(text);
                }}
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
                onChangeText={(text) => {
                  console.log('Name input changed:', text);
                  setName(text);
                }}
                placeholder="Mon lecteur R_VOLUTION"
                placeholderTextColor={colors.grey}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.infoBox}>
              <Icon name="information-circle" size={16} color={colors.primary} />
              <Text style={styles.infoText}>
                L'appareil sera ajouté directement à la liste sans vérification préalable. 
                Vous pourrez tester la connexion après l'ajout.
              </Text>
            </View>

            <View style={styles.warningBox}>
              <Icon name="warning" size={16} color="#ff9500" />
              <Text style={styles.warningText}>
                Assurez-vous que l'appareil R_VOLUTION est allumé et connecté au même réseau Wi-Fi.
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
              text={isLoading ? "Ajout..." : "Ajouter"}
              onPress={() => {
                console.log('Add button pressed, isLoading:', isLoading);
                if (!isLoading) {
                  handleAddDevice();
                }
              }}
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
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  warningText: {
    fontSize: 12,
    color: '#856404',
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
