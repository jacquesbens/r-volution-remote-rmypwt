
import React, { useState, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, Modal, TouchableOpacity, ActivityIndicator, ScrollView, KeyboardAvoidingView } from 'react-native';
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
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  
  // Refs for input fields to control focus
  const ipInputRef = useRef<TextInput>(null);
  const nameInputRef = useRef<TextInput>(null);

  const handleAddDevice = async () => {
    if (!ip.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse IP.');
      return;
    }

    setIsLoading(true);
    try {
      // Always use HTTP port 80
      await onAddDevice(ip.trim(), 80, name.trim() || undefined);
      handleClose();
    } catch (error) {
      console.log('AddDeviceModal: Error adding device:', error);
      
      // Remove focus from inputs on error to prevent keyboard from staying open
      ipInputRef.current?.blur();
      nameInputRef.current?.blur();
      
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

    setIsTestingConnection(true);
    try {
      console.log(`Testing HTTP connection to ${ip.trim()}:80`);
      
      // Simple HTTP connectivity test using port 80
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(`http://${ip.trim()}:80/`, {
        method: 'HEAD',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok || response.status < 500) {
        Alert.alert(
          'Test de connexion HTTP',
          `✅ L'appareil à l'adresse ${ip.trim()}:80 répond via HTTP.\n\nStatus: ${response.status} ${response.statusText}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Test de connexion HTTP',
          `⚠️ L'appareil répond mais avec une erreur.\n\nStatus: ${response.status} ${response.statusText}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.log('HTTP connection test failed:', error);
      Alert.alert(
        'Test de connexion HTTP',
        `❌ Impossible de se connecter à ${ip.trim()}:80 via HTTP.\n\nErreur: ${error.message}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleClose = () => {
    // Remove focus from inputs before closing
    ipInputRef.current?.blur();
    nameInputRef.current?.blur();
    
    setIp('');
    setName('');
    setIsLoading(false);
    setIsTestingConnection(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Icon name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Ajouter un appareil</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.section}>
            <Text style={styles.label}>Adresse IP *</Text>
            <TextInput
              ref={ipInputRef}
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

          <View style={styles.section}>
            <Text style={styles.label}>Nom personnalisé (optionnel)</Text>
            <TextInput
              ref={nameInputRef}
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Mon lecteur R_volution"
              placeholderTextColor={colors.grey}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.protocolInfoSection}>
            <Icon name="information-circle" size={20} color={colors.primary} />
            <View style={styles.protocolInfoContent}>
              <Text style={styles.protocolInfoTitle}>Protocole utilisé :</Text>
              <Text style={styles.protocolInfoText}>HTTP sur port 80 (protocole web standard) - utilisé automatiquement</Text>
              <Text style={styles.protocolInfoSubtext}>Optimisé pour la découverte automatique des appareils R_volution</Text>
            </View>
          </View>

          <View style={styles.testSection}>
            <Button
              text={isTestingConnection ? "Test HTTP en cours..." : "Tester la connexion HTTP"}
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
              <Text style={styles.infoTitle}>Conseils pour HTTP :</Text>
              <Text style={styles.infoText}>• Assurez-vous que l'appareil est allumé et connecté au Wi-Fi</Text>
              <Text style={styles.infoText}>• Vérifiez que vous êtes sur le même réseau</Text>
              <Text style={styles.infoText}>• L'appareil utilise automatiquement le protocole HTTP sur port 80</Text>
              <Text style={styles.infoText}>• Vérifiez que l'appareil accepte les connexions HTTP</Text>
              <Text style={styles.infoText}>• Consultez la documentation de votre appareil R_volution</Text>
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
      </KeyboardAvoidingView>
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
    marginBottom: 4,
  },
  protocolInfoSubtext: {
    fontSize: 12,
    color: colors.grey + '80',
    lineHeight: 16,
    fontStyle: 'italic',
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
    backgroundColor: colors.primary,
  },
  addLoader: {
    position: 'absolute',
    right: 32,
    top: 26,
  },
});

export default AddDeviceModal;
