
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, Modal, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { RVolutionDevice } from '../types/Device';
import Button from './Button';
import Icon from './Icon';
import { colors } from '../styles/commonStyles';

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

  useEffect(() => {
    if (device && visible) {
      setName(device.name);
      setIp(device.ip);
    }
  }, [device, visible]);

  const handleUpdateDevice = async () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom pour l\'appareil.');
      return;
    }

    if (!ip.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse IP.');
      return;
    }

    // Validate IP address format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip.trim())) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse IP valide (ex: 192.168.1.20).');
      return;
    }

    if (!device) return;

    setIsLoading(true);
    try {
      console.log('✏️ Updating device:', { id: device.id, name: name.trim(), ip: ip.trim() });
      await onUpdateDevice(device.id, { 
        name: name.trim(), 
        ip: ip.trim(),
        port: 80 // Always use HTTP port 80
      });
      handleClose();
    } catch (error) {
      console.log('EditDeviceModal: Error updating device:', error);
      Alert.alert(
        'Erreur de modification',
        error.message || 'Impossible de modifier l\'appareil.',
        [{ text: 'OK' }]
      );
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
      console.log(`Testing connection to ${ip.trim()}:80 (HTTP)`);
      
      // Simple HTTP connectivity test on port 80
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
          `✅ L'appareil à l'adresse ${ip.trim()}:80 répond via HTTP.\n\nStatus: ${response.status} ${response.statusText}`,
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
        `❌ Impossible de se connecter à ${ip.trim()}:80 via HTTP.\n\nErreur: ${error.message}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleClose = () => {
    setName('');
    setIp('');
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

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.section}>
            <Text style={styles.label}>Nom de l'appareil *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Mon lecteur R_volution"
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

          <View style={styles.protocolInfoSection}>
            <Icon name="information-circle" size={20} color={colors.primary} />
            <View style={styles.protocolInfoContent}>
              <Text style={styles.protocolInfoTitle}>Protocole utilisé :</Text>
              <Text style={styles.protocolInfoText}>HTTP sur port 80 (standard web) - utilisé automatiquement</Text>
            </View>
          </View>

          <View style={styles.testSection}>
            <Button
              text={isTestingConnection ? "Test en cours..." : "Tester la connexion HTTP"}
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
              <Text style={styles.infoTitle}>Informations :</Text>
              <Text style={styles.infoText}>• L'appareil doit être allumé et connecté au Wi-Fi</Text>
              <Text style={styles.infoText}>• Vous devez être sur le même réseau</Text>
              <Text style={styles.infoText}>• Le protocole HTTP sur port 80 est utilisé automatiquement</Text>
              <Text style={styles.infoText}>• Vérifiez que l'appareil accepte les connexions HTTP</Text>
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
            text={isLoading ? "Modification..." : "Enregistrer"}
            onPress={handleUpdateDevice}
            style={[styles.saveButton, { opacity: isLoading ? 0.6 : 1 }]}
          />
          {isLoading && (
            <ActivityIndicator size="small" color={colors.background} style={styles.saveLoader} />
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
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
  protocolInfoSection: {
    flexDirection: 'row',
    backgroundColor: colors.primary + '10',
    borderRadius: 8,
    padding: 16,
    marginTop: 24,
    gap: 12,
  },
  protocolInfoContent: {
    flex: 1,
  },
  protocolInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  protocolInfoText: {
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
  saveButton: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  saveLoader: {
    position: 'absolute',
    right: 32,
    top: 26,
  },
});

export default EditDeviceModal;
