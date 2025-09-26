
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, Modal, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import Button from './Button';
import { colors } from '../styles/commonStyles';
import Icon from './Icon';
import { RVolutionDevice } from '../types/Device';

interface EditDeviceModalProps {
  visible: boolean;
  device: RVolutionDevice | null;
  onClose: () => void;
  onUpdateDevice: (deviceId: string, updates: { name?: string; ip?: string; port?: number }) => Promise<void>;
}

const EditDeviceModal: React.FC<EditDeviceModalProps> = ({ visible, device, onClose, onUpdateDevice }) => {
  const [name, setName] = useState('');
  const [ip, setIp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // Initialize form with device data when modal opens
  useEffect(() => {
    if (device && visible) {
      setName(device.name);
      setIp(device.ip);
    }
  }, [device, visible]);

  const handleUpdateDevice = async () => {
    if (!device) return;

    if (!name.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom pour l\'appareil.');
      return;
    }

    if (!ip.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse IP.');
      return;
    }

    setIsLoading(true);
    try {
      const updates: { name?: string; ip?: string; port?: number } = {};
      
      if (name.trim() !== device.name) {
        updates.name = name.trim();
      }
      
      if (ip.trim() !== device.ip) {
        updates.ip = ip.trim();
      }
      
      // Always use port 80
      if (device.port !== 80) {
        updates.port = 80;
      }

      if (Object.keys(updates).length === 0) {
        Alert.alert('Information', 'Aucune modification détectée.');
        handleClose();
        return;
      }

      await onUpdateDevice(device.id, updates);
      handleClose();
    } catch (error) {
      console.log('EditDeviceModal: Error updating device:', error);
      Alert.alert('Erreur', error.message || 'Impossible de modifier l\'appareil.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!ip.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse IP pour tester.');
      return;
    }

    setIsTestingConnection(true);
    try {
      console.log(`Testing connection to ${ip.trim()}:80`);
      
      // Simple connectivity test using port 80
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(`http://${ip.trim()}:80/`, {
        method: 'HEAD',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok || response.status < 500) {
        Alert.alert(
          'Test de connexion',
          `✅ L'appareil à l'adresse ${ip.trim()}:80 répond.\n\nStatus: ${response.status} ${response.statusText}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Test de connexion',
          `⚠️ L'appareil répond mais avec une erreur.\n\nStatus: ${response.status} ${response.statusText}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.log('Connection test failed:', error);
      Alert.alert(
        'Test de connexion',
        `❌ Impossible de se connecter à ${ip.trim()}:80.\n\nErreur: ${error.message}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleClose = () => {
    setIsLoading(false);
    setIsTestingConnection(false);
    onClose();
  };

  if (!device) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Icon name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Modifier l'appareil</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.label}>Nom de l'appareil *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Mon lecteur R_VOLUTION"
              placeholderTextColor={colors.grey}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Adresse IP *</Text>
            <TextInput
              style={styles.input}
              value={ip}
              onChangeText={setIp}
              placeholder="192.168.1.100"
              placeholderTextColor={colors.grey}
              keyboardType="numbers-and-punctuation"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.portInfoSection}>
            <Icon name="information-circle" size={20} color={colors.primary} />
            <View style={styles.portInfoContent}>
              <Text style={styles.portInfoTitle}>Port utilisé :</Text>
              <Text style={styles.portInfoText}>Port 80 (HTTP standard) - utilisé automatiquement</Text>
            </View>
          </View>

          <View style={styles.testSection}>
            <Button
              text={isTestingConnection ? "Test en cours..." : "Tester la connexion"}
              onPress={handleTestConnection}
              style={[styles.testButton, { opacity: isTestingConnection ? 0.6 : 1 }]}
            />
            {isTestingConnection && (
              <ActivityIndicator size="small" color={colors.primary} style={styles.testLoader} />
            )}
          </View>

          <View style={styles.infoSection}>
            <Icon name="information-circle" size={20} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Conseils :</Text>
              <Text style={styles.infoText}>• Assurez-vous que l'appareil est allumé et connecté au Wi-Fi</Text>
              <Text style={styles.infoText}>• Vérifiez que vous êtes sur le même réseau</Text>
              <Text style={styles.infoText}>• L'appareil utilise automatiquement le port 80 (HTTP standard)</Text>
              <Text style={styles.infoText}>• Consultez la documentation de votre appareil R_VOLUTION</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            text="Annuler"
            onPress={handleClose}
            style={styles.cancelButton}
            textStyle={styles.cancelButtonText}
          />
          <Button
            text={isLoading ? "Modification..." : "Modifier"}
            onPress={handleUpdateDevice}
            style={[styles.updateButton, { opacity: isLoading ? 0.6 : 1 }]}
          />
          {isLoading && (
            <ActivityIndicator size="small" color={colors.background} style={styles.updateLoader} />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey + '20',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.grey + '30',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  portInfoSection: {
    flexDirection: 'row',
    backgroundColor: colors.primary + '10',
    borderRadius: 8,
    padding: 16,
    marginTop: 24,
    gap: 12,
  },
  portInfoContent: {
    flex: 1,
  },
  portInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  portInfoText: {
    fontSize: 13,
    color: colors.grey,
    lineHeight: 18,
  },
  testSection: {
    marginTop: 24,
    position: 'relative',
  },
  testButton: {
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  testLoader: {
    position: 'absolute',
    right: 16,
    top: 14,
  },
  infoSection: {
    flexDirection: 'row',
    backgroundColor: colors.primary + '10',
    borderRadius: 8,
    padding: 16,
    marginTop: 24,
    marginBottom: 24,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: colors.grey,
    lineHeight: 18,
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: colors.grey + '20',
    gap: 12,
    position: 'relative',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.grey + '30',
  },
  cancelButtonText: {
    color: colors.text,
  },
  updateButton: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  updateLoader: {
    position: 'absolute',
    right: 32,
    top: 26,
  },
});

export default EditDeviceModal;
