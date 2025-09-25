
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { commonStyles, colors } from '../styles/commonStyles';
import { useDeviceDiscovery } from '../hooks/useDeviceDiscovery';
import DeviceCard from '../components/DeviceCard';
import Button from '../components/Button';
import AddDeviceModal from '../components/AddDeviceModal';
import Icon from '../components/Icon';

export default function MainScreen() {
  const router = useRouter();
  const {
    devices,
    isScanning,
    scanProgress,
    scanNetwork,
    addDeviceManually,
    removeDevice,
    updateDeviceStatus,
  } = useDeviceDiscovery();

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleScanNetwork = async () => {
    try {
      await scanNetwork();
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la recherche d\'appareils R_VOLUTION');
    }
  };

  const handleAddDevice = async (ip: string, port: number, name?: string) => {
    try {
      await addDeviceManually(ip, port, name);
      setIsAddModalVisible(false);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ajouter l\'appareil. Vérifiez l\'adresse IP et que l\'appareil R_VOLUTION est accessible.');
    }
  };

  const handleRemoveDevice = (deviceId: string, deviceName: string) => {
    Alert.alert(
      'Supprimer l\'appareil',
      `Êtes-vous sûr de vouloir supprimer "${deviceName}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => removeDevice(deviceId) },
      ]
    );
  };

  const handleDevicePress = (deviceId: string) => {
    router.push(`/device/${deviceId}`);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await updateDeviceStatus();
    } catch (error) {
      console.log('Error refreshing devices:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // Initial device status update
    updateDeviceStatus();
  }, []);

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={styles.header}>
        <Text style={commonStyles.title}>R_VOLUTION Remote</Text>
        <Text style={styles.subtitle}>Télécommande IP pour lecteurs multimédia R_VOLUTION</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Scan Controls */}
        <View style={styles.scanSection}>
          <Button
            text={isScanning ? `Recherche R_VOLUTION... ${Math.round(scanProgress)}%` : "Rechercher appareils R_VOLUTION"}
            onPress={handleScanNetwork}
            style={[styles.scanButton, { opacity: isScanning ? 0.7 : 1 }]}
          />
          
          <Button
            text="Ajouter R_VOLUTION manuellement"
            onPress={() => setIsAddModalVisible(true)}
            style={styles.addButton}
          />
        </View>

        {/* Device List */}
        <View style={styles.deviceSection}>
          <Text style={styles.sectionTitle}>
            Appareils R_VOLUTION découverts ({devices.length})
          </Text>

          {devices.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="search" size={48} color={colors.grey} style={styles.emptyIcon} />
              <Text style={styles.emptyTitle}>Aucun appareil R_VOLUTION trouvé</Text>
              <Text style={styles.emptyText}>
                Lancez une recherche automatique pour découvrir les appareils R_VOLUTION sur le réseau ou ajoutez-en un manuellement
              </Text>
            </View>
          ) : (
            devices.map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                onPress={() => handleDevicePress(device.id)}
                onRemove={() => handleRemoveDevice(device.id, device.name)}
              />
            ))
          )}
        </View>

        {/* Instructions */}
        <View style={styles.instructionsSection}>
          <Text style={styles.instructionsTitle}>Instructions</Text>
          <Text style={styles.instructionsText}>
            • La recherche automatique scanne le réseau local pour trouver les appareils avec le nom réseau "R_VOLUTION"
          </Text>
          <Text style={styles.instructionsText}>
            • Vous pouvez ajouter manuellement un appareil R_VOLUTION en saisissant son adresse IP
          </Text>
          <Text style={styles.instructionsText}>
            • Assurez-vous que les appareils R_VOLUTION sont connectés au même réseau Wi-Fi
          </Text>
          <Text style={styles.instructionsText}>
            • Le port 80 est utilisé par défaut pour la découverte et le contrôle des appareils
          </Text>
        </View>
      </ScrollView>

      <AddDeviceModal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        onAddDevice={handleAddDevice}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.backgroundAlt,
  },
  subtitle: {
    fontSize: 14,
    color: colors.grey,
    textAlign: 'center',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  scanSection: {
    padding: 16,
    gap: 12,
  },
  scanButton: {
    backgroundColor: colors.primary,
  },
  addButton: {
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.grey,
  },
  deviceSection: {
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.grey,
    textAlign: 'center',
    lineHeight: 20,
  },
  instructionsSection: {
    padding: 16,
    marginTop: 20,
    backgroundColor: colors.backgroundAlt,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: colors.grey,
    lineHeight: 20,
    marginBottom: 8,
  },
});
