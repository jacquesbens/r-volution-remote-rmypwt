
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, Modal, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import Button from './Button';
import { colors } from '../styles/commonStyles';
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
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const handleAddDevice = async () => {
    if (!ip.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse IP.');
      return;
    }

    const portNumber = parseInt(port, 10);
    if (isNaN(portNumber) || portNumber < 1 || portNumber > 65535) {
      Alert.alert('Erreur', 'Le port doit être un nombre entre 1 et 65535.');
      return;
    }

    setIsLoading(true);
    try {
      await onAddDevice(ip.trim(), portNumber, name.trim() || undefined);
      handleClose();
    } catch (error) {
      console.log('AddDeviceModal: Error adding device:', error);
      // Error is already handled by parent component
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!ip.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse IP pour tester.');
      return;
    }

    const portNumber = parseInt(port, 10);
    if (isNaN(portNumber) || portNumber < 1 || portNumber > 65535) {
      Alert.alert('Erreur', 'Le port doit être un nombre entre 1 et 65535.');
      return;
    }

    setIsTestingConnection(true);
    try {
      console.log(`Testing connection to ${ip.trim()}:${portNumber}`);
      
      // Simple connectivity test
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(`http://${ip.trim()}:${portNumber}/`, {
        method: 'HEAD',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok || response.status < 500) {
        Alert.alert(
          'Test de connexion',
          `✅ L'appareil à l'adresse ${ip.trim()}:${portNumber} répond.\n\nStatus: ${response.status} ${response.statusText}`,
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
        `❌ Impossible de se connecter à ${ip.trim()}:${portNumber}.\n\nErreur: ${error.message}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleClose = () => {
    setIp('');
    setPort('80');
    setName('');
    setIsLoading(false);
    setIsTestingConnection(false);
    onClose();
  };

  const getCommonIPs = () => {
    return [
      '192.168.1.100',
      '192.168.1.10',
      '192.168.0.100',
      '192.168.0.10',
      '192.168.2.100',
      '10.0.0.100',
    ];
  };

  const getCommonPorts = () => {
    return [
      { port: '80', label: '80 (HTTP standard)' },
      { port: '8080', label: '8080 (HTTP alternatif)' },
      { port: '8000', label: '8000 (Développement)' },
      { port: '3000', label: '3000 (Node.js)' },
      { port: '5000', label: '5000 (Flask/Python)' },
      { port: '9000', label: '9000 (Divers)' },
    ];
  };

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
          <Text style={styles.title}>Ajouter un appareil</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
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
            
            <Text style={styles.sectionTitle}>IPs communes :</Text>
            <View style={styles.commonOptions}>
              {getCommonIPs().map((commonIP) => (
                <TouchableOpacity
                  key={commonIP}
                  style={styles.commonOption}
                  onPress={() => setIp(commonIP)}
                >
                  <Text style={styles.commonOptionText}>{commonIP}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Port</Text>
            <TextInput
              style={styles.input}
              value={port}
              onChangeText={setPort}
              placeholder="80"
              placeholderTextColor={colors.grey}
              keyboardType="numeric"
            />
            
            <Text style={styles.sectionTitle}>Ports communes :</Text>
            <View style={styles.portOptions}>
              {getCommonPorts().map((portOption) => (
                <TouchableOpacity
                  key={portOption.port}
                  style={[
                    styles.portOption,
                    port === portOption.port && styles.portOptionSelected
                  ]}
                  onPress={() => setPort(portOption.port)}
                >
                  <Text style={[
                    styles.portOptionText,
                    port === portOption.port && styles.portOptionTextSelected
                  ]}>
                    {portOption.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
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
              <Text style={styles.infoText}>• Testez différents ports si le port 80 ne fonctionne pas</Text>
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
            text={isLoading ? "Ajout..." : "Ajouter"}
            onPress={handleAddDevice}
            style={[styles.addButton, { opacity: isLoading ? 0.6 : 1 }]}
          />
          {isLoading && (
            <ActivityIndicator size="small" color={colors.background} style={styles.addLoader} />
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.grey,
    marginTop: 16,
    marginBottom: 8,
  },
  commonOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  commonOption: {
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.grey + '30',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  commonOptionText: {
    fontSize: 14,
    color: colors.text,
  },
  portOptions: {
    gap: 8,
  },
  portOption: {
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.grey + '30',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  portOptionSelected: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  portOptionText: {
    fontSize: 14,
    color: colors.text,
  },
  portOptionTextSelected: {
    color: colors.primary,
    fontWeight: '500',
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
  addButton: {
    flex: 1,
  },
  addLoader: {
    position: 'absolute',
    right: 32,
    top: 26,
  },
});

export default AddDeviceModal;
