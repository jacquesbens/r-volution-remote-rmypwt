
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../styles/commonStyles';
import Icon from '../components/Icon';
import Button from '../components/Button';
import { useDeviceDiscovery } from '../hooks/useDeviceDiscovery';

const AddDeviceScreen: React.FC = () => {
  const router = useRouter();
  const { scanNetwork, addDeviceManually, isScanning, scanProgress } = useDeviceDiscovery();
  
  const [deviceName, setDeviceName] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleScanNetwork = async () => {
    console.log('🔍 Starting automatic network scan');
    try {
      await scanNetwork();
      Alert.alert(
        'Scan terminé',
        'Le scan du réseau est terminé. Vérifiez la liste des appareils découverts.',
        [
          { text: 'OK', onPress: () => router.back() }
        ]
      );
    } catch (error) {
      console.log('❌ Network scan failed:', error);
      Alert.alert(
        'Erreur de scan',
        'Impossible de scanner le réseau. Vérifiez votre connexion Wi-Fi.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleAddDevice = async () => {
    if (!deviceName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom pour l\'appareil.');
      return;
    }

    if (!ipAddress.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse IP.');
      return;
    }

    // Validate IP address format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ipAddress.trim())) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse IP valide (ex: 192.168.1.20).');
      return;
    }

    setIsAdding(true);
    try {
      console.log('➕ Adding device manually:', { name: deviceName, ip: ipAddress });
      await addDeviceManually(ipAddress.trim(), 80, deviceName.trim());
      
      Alert.alert(
        'Appareil ajouté',
        `${deviceName} a été ajouté avec succès.`,
        [
          { text: 'OK', onPress: () => router.back() }
        ]
      );
    } catch (error) {
      console.log('❌ Failed to add device:', error);
      Alert.alert(
        'Erreur d\'ajout',
        error.message || 'Impossible d\'ajouter l\'appareil.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsAdding(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={colors.text} />
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Ajouter un appareil</Text>
      </View>

      {/* Automatic Addition Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ajout automatique</Text>
        <Text style={styles.sectionDescription}>
          Scannez votre réseau pour trouver des appareils
        </Text>
        
        <Button
          text={isScanning ? `Scanner... ${scanProgress}%` : "Scanner"}
          onPress={handleScanNetwork}
          style={[styles.scanButton, { opacity: isScanning ? 0.7 : 1 }]}
        />
        
        {isScanning && (
          <View style={styles.scanningIndicator}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.scanningText}>Recherche en cours...</Text>
          </View>
        )}
      </View>

      {/* Manual Addition Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ajout manuel</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Nom</Text>
          <TextInput
            style={styles.input}
            value={deviceName}
            onChangeText={setDeviceName}
            placeholder="Mon lecteur"
            placeholderTextColor={colors.grey + '80'}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>IP / Hôte</Text>
          <TextInput
            style={styles.input}
            value={ipAddress}
            onChangeText={setIpAddress}
            placeholder="192.168.1.20"
            placeholderTextColor={colors.grey + '80'}
            keyboardType="numeric"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <Button
          text={isAdding ? "Ajout..." : "Ajouter"}
          onPress={handleAddDevice}
          style={[styles.addButton, { opacity: isAdding ? 0.7 : 1 }]}
        />
        
        {isAdding && (
          <View style={styles.addingIndicator}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.addingText}>Ajout en cours...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  titleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  section: {
    backgroundColor: colors.backgroundAlt,
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    color: colors.grey,
    marginBottom: 20,
    lineHeight: 22,
  },
  scanButton: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignSelf: 'flex-end',
  },
  scanningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  scanningText: {
    fontSize: 14,
    color: colors.grey,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: colors.grey,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.grey + '30',
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  addingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  addingText: {
    fontSize: 14,
    color: colors.grey,
  },
});

export default AddDeviceScreen;
