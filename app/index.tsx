
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
      console.log('Starting network scan from UI...');
      await scanNetwork();
      console.log('Network scan completed from UI');
    } catch (error) {
      console.log('Network scan error from UI:', error);
      Alert.alert('Erreur', 'Erreur lors de la recherche d\'appareils R_VOLUTION');
    }
  };

  const handleAddDevice = async (ip: string, port: number, name?: string) => {
    console.log('=== HANDLE ADD DEVICE CALLED ===');
    console.log('Parameters:', { ip, port, name });
    
    try {
      console.log('Calling addDeviceManually...');
      const result = await addDeviceManually(ip, port, name);
      console.log('addDeviceManually result:', result);
      
      console.log('Device addition successful, closing modal...');
      setIsAddModalVisible(false);
      
      console.log('Showing success alert...');
      Alert.alert(
        'Appareil ajouté', 
        `L'appareil "${result.name}" a été ajouté avec succès.\n\nAdresse: ${ip}:${port}\n\nVous pouvez maintenant le sélectionner dans la liste pour le contrôler.`,
        [{ 
          text: 'OK', 
          onPress: () => {
            console.log('Success alert dismissed');
            // Force a refresh of the device list
            updateDeviceStatus();
          }
        }]
      );
    } catch (error) {
      console.log('=== HANDLE ADD DEVICE ERROR ===');
      console.log('Error type:', typeof error);
      console.log('Error message:', error instanceof Error ? error.message : String(error));
      console.log('Full error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue lors de l\'ajout de l\'appareil';
      
      Alert.alert(
        'Erreur d\'ajout', 
        errorMessage,
        [{ 
          text: 'Réessayer', 
          onPress: () => console.log('Error alert dismissed - user can retry')
        }]
      );
    }
  };

  const handleRemoveDevice = (deviceId: string, deviceName: string) => {
    console.log('Removing device:', { deviceId, deviceName });
    Alert.alert(
      'Supprimer l\'appareil',
      `Êtes-vous sûr de vouloir supprimer "${deviceName}" de la liste ?`,
      [
        { text: 'Annuler', style: 'cancel', onPress: () => console.log('Remove cancelled') },
        { text: 'Supprimer', style: 'destructive', onPress: () => {
          console.log('Confirming device removal...');
          removeDevice(deviceId);
        }},
      ]
    );
  };

  const handleDevicePress = (deviceId: string) => {
    console.log('Navigating to device:', deviceId);
    router.push(`/device/${deviceId}`);
  };

  const handleRefresh = async () => {
    console.log('Refreshing device status...');
    setIsRefreshing(true);
    try {
      await updateDeviceStatus();
      console.log('Device status refresh completed');
    } catch (error) {
      console.log('Error refreshing devices:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    console.log('MainScreen mounted, current devices:', devices.length);
    // Initial device status update
    if (devices.length > 0) {
      updateDeviceStatus();
    }
  }, []);

  // Log device changes
  useEffect(() => {
    console.log('Device list updated, current count:', devices.length);
    devices.forEach((device, index) => {
      console.log(`Device ${index + 1}:`, {
        id: device.id,
        name: device.name,
        ip: device.ip,
        port: device.port,
        isOnline: device.isOnline,
        isManuallyAdded: device.isManuallyAdded
      });
    });
  }, [devices]);

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
            onPress={() => {
              console.log('Opening add device modal...');
              setIsAddModalVisible(true);
            }}
            style={styles.addButton}
          />
        </View>

        {/* Device List */}
        <View style={styles.deviceSection}>
          <Text style={styles.sectionTitle}>
            Appareils R_VOLUTION ({devices.length})
          </Text>

          {devices.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="search" size={48} color={colors.grey} style={styles.emptyIcon} />
              <Text style={styles.emptyTitle}>Aucun appareil R_VOLUTION trouvé</Text>
              <Text style={styles.emptyText}>
                Lancez une recherche automatique pour découvrir les appareils R_VOLUTION sur le réseau ou ajoutez-en un manuellement avec son adresse IP
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
          <Text style={styles.instructionsTitle}>Instructions d'utilisation</Text>
          
          <View style={styles.instructionItem}>
            <Icon name="wifi" size={16} color={colors.primary} />
            <Text style={styles.instructionsText}>
              <Text style={styles.bold}>Recherche automatique:</Text> Scanne le réseau local pour trouver les appareils avec le nom réseau "R_VOLUTION"
            </Text>
          </View>
          
          <View style={styles.instructionItem}>
            <Icon name="add-circle" size={16} color={colors.primary} />
            <Text style={styles.instructionsText}>
              <Text style={styles.bold}>Ajout manuel:</Text> Ajoutez directement un appareil en saisissant son adresse IP (ex: 192.168.1.100)
            </Text>
          </View>
          
          <View style={styles.instructionItem}>
            <Icon name="checkmark-circle" size={16} color={colors.primary} />
            <Text style={styles.instructionsText}>
              <Text style={styles.bold}>Réseau:</Text> Assurez-vous que les appareils R_VOLUTION sont connectés au même réseau Wi-Fi
            </Text>
          </View>
          
          <View style={styles.instructionItem}>
            <Icon name="settings" size={16} color={colors.primary} />
            <Text style={styles.instructionsText}>
              <Text style={styles.bold}>Port:</Text> Le port 80 est utilisé par défaut pour la découverte et le contrôle des appareils
            </Text>
          </View>

          <View style={styles.tipBox}>
            <Icon name="bulb" size={16} color="#ff9500" />
            <Text style={styles.tipText}>
              <Text style={styles.bold}>Astuce:</Text> L'ajout manuel fonctionne même si l'appareil ne répond pas immédiatement. 
              Vous pourrez tester la connexion après l'ajout.
            </Text>
          </View>
        </View>
      </ScrollView>

      <AddDeviceModal
        visible={isAddModalVisible}
        onClose={() => {
          console.log('Closing add device modal...');
          setIsAddModalVisible(false);
        }}
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
    marginBottom: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: colors.grey,
    lineHeight: 20,
    flex: 1,
  },
  bold: {
    fontWeight: '600',
    color: colors.text,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  tipText: {
    fontSize: 12,
    color: '#856404',
    lineHeight: 16,
    flex: 1,
  },
});
