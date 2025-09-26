
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, RefreshControl, TouchableOpacity, Platform } from 'react-native';
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
      console.log('🚀 Starting network scan from UI...');
      await scanNetwork();
      console.log('✅ Network scan completed from UI');
      
      // Show result to user
      const deviceCount = devices.length;
      if (deviceCount > 0) {
        Alert.alert(
          'Recherche terminée', 
          `${deviceCount} appareil(s) R_VOLUTION trouvé(s) sur le réseau.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Aucun appareil trouvé', 
          'Aucun appareil R_VOLUTION n\'a été détecté sur le réseau.\n\n' +
          'Vérifiez que :\n' +
          '• Les appareils R_VOLUTION sont allumés\n' +
          '• Ils sont connectés au même réseau Wi-Fi\n' +
          '• Le port 80 est accessible\n\n' +
          'Vous pouvez aussi essayer l\'ajout manuel.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.log('❌ Network scan error from UI:', error);
      Alert.alert(
        'Erreur de recherche', 
        'Une erreur s\'est produite lors de la recherche d\'appareils R_VOLUTION.\n\n' +
        'Vérifiez votre connexion réseau et réessayez.',
        [{ text: 'Réessayer', onPress: handleScanNetwork }, { text: 'Annuler' }]
      );
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

  const handleTestDevice = async (device: RVolutionDevice): Promise<boolean> => {
    console.log(`🧪 Testing device: ${device.name} at ${device.ip}:${device.port}`);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      // Try multiple endpoints
      const endpoints = ['/info', '/status', '/device', '/api/info', '/'];
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`http://${device.ip}:${device.port}${endpoint}`, {
            method: 'GET',
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json, text/plain, */*',
            },
          });

          clearTimeout(timeoutId);
          
          if (response.ok) {
            console.log(`✅ Device test successful via ${endpoint} (status: ${response.status})`);
            return true;
          }
        } catch (endpointError) {
          console.log(`❌ Endpoint ${endpoint} failed:`, endpointError);
        }
      }

      clearTimeout(timeoutId);
      console.log(`❌ Device test failed - no endpoints responded`);
      return false;
    } catch (error) {
      console.log(`❌ Device test error:`, error);
      return false;
    }
  };

  const handleRunDiagnostic = async () => {
    console.log('🔧 Running network diagnostic...');
    
    Alert.alert(
      'Diagnostic réseau',
      'Le diagnostic va tester la connectivité réseau et rechercher des problèmes courants.\n\nCela peut prendre quelques secondes.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Lancer', onPress: runNetworkDiagnostic }
      ]
    );
  };

  const runNetworkDiagnostic = async () => {
    console.log('🔧 Starting network diagnostic...');
    
    const diagnosticResults: string[] = [];
    
    try {
      // Test 1: Check if we can make HTTP requests
      console.log('🔧 Test 1: HTTP request capability');
      try {
        const testResponse = await fetch('https://httpbin.org/get', { 
          method: 'GET',
          signal: AbortSignal.timeout(3000)
        });
        if (testResponse.ok) {
          diagnosticResults.push('✅ Requêtes HTTP fonctionnelles');
          console.log('✅ HTTP requests working');
        } else {
          diagnosticResults.push('⚠️ Requêtes HTTP partiellement fonctionnelles');
          console.log('⚠️ HTTP requests partially working');
        }
      } catch (httpError) {
        diagnosticResults.push('❌ Problème avec les requêtes HTTP');
        console.log('❌ HTTP request failed:', httpError);
      }

      // Test 2: Test common local network addresses
      console.log('🔧 Test 2: Local network connectivity');
      const commonIPs = ['192.168.1.1', '192.168.0.1', '10.0.0.1'];
      let routerFound = false;
      
      for (const ip of commonIPs) {
        try {
          const response = await fetch(`http://${ip}`, {
            method: 'HEAD',
            signal: AbortSignal.timeout(2000)
          });
          if (response.status < 500) {
            diagnosticResults.push(`✅ Routeur détecté à ${ip}`);
            console.log(`✅ Router found at ${ip}`);
            routerFound = true;
            break;
          }
        } catch (routerError) {
          console.log(`❌ No router at ${ip}:`, routerError);
        }
      }
      
      if (!routerFound) {
        diagnosticResults.push('⚠️ Aucun routeur détecté aux adresses communes');
      }

      // Test 3: Check if port 80 is accessible
      console.log('🔧 Test 3: Port 80 accessibility');
      try {
        const portTestResponse = await fetch('http://httpbin.org:80/get', {
          method: 'HEAD',
          signal: AbortSignal.timeout(3000)
        });
        if (portTestResponse.ok) {
          diagnosticResults.push('✅ Port 80 accessible');
          console.log('✅ Port 80 accessible');
        } else {
          diagnosticResults.push('⚠️ Port 80 partiellement accessible');
          console.log('⚠️ Port 80 partially accessible');
        }
      } catch (portError) {
        diagnosticResults.push('❌ Problème d\'accès au port 80');
        console.log('❌ Port 80 access failed:', portError);
      }

      // Test 4: Platform-specific information
      console.log('🔧 Test 4: Platform information');
      diagnosticResults.push(`ℹ️ Plateforme: ${Platform.OS}`);
      
      // Show results
      const resultMessage = diagnosticResults.join('\n\n');
      console.log('🔧 Diagnostic completed:', diagnosticResults);
      
      Alert.alert(
        'Résultats du diagnostic',
        resultMessage + '\n\n' +
        'Recommandations:\n' +
        '• Vérifiez que les appareils R_VOLUTION sont sur le même réseau Wi-Fi\n' +
        '• Assurez-vous que le port 80 n\'est pas bloqué par un pare-feu\n' +
        '• Essayez l\'ajout manuel si la découverte automatique échoue',
        [{ text: 'OK' }]
      );
      
    } catch (diagnosticError) {
      console.log('❌ Diagnostic error:', diagnosticError);
      Alert.alert(
        'Erreur de diagnostic',
        'Une erreur s\'est produite pendant le diagnostic réseau.',
        [{ text: 'OK' }]
      );
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
            text={isScanning ? `Recherche en cours... ${Math.round(scanProgress)}%` : "🔍 Rechercher appareils R_VOLUTION"}
            onPress={handleScanNetwork}
            style={[styles.scanButton, { opacity: isScanning ? 0.7 : 1 }]}
          />
          
          {isScanning && (
            <View style={styles.scanProgress}>
              <View style={[styles.progressBar, { width: `${scanProgress}%` }]} />
            </View>
          )}
          
          <Button
            text="➕ Ajouter R_VOLUTION manuellement"
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
                onTest={handleTestDevice}
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
              <Text style={styles.bold}>Recherche automatique:</Text> Scanne plusieurs plages réseau (192.168.1.x, 192.168.0.x, etc.) pour trouver les appareils R_VOLUTION
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
              <Text style={styles.bold}>Astuce:</Text> La recherche automatique scanne maintenant plusieurs plages réseau en parallèle pour une découverte plus rapide et efficace.
            </Text>
          </View>

          <View style={styles.debugBox}>
            <Icon name="bug" size={16} color="#6c757d" />
            <Text style={styles.debugText}>
              <Text style={styles.bold}>Débogage:</Text> Les logs détaillés de la découverte sont visibles dans la console du développeur.
            </Text>
          </View>

          <TouchableOpacity style={styles.diagnosticButton} onPress={handleRunDiagnostic}>
            <Icon name="medical" size={16} color={colors.primary} />
            <Text style={styles.diagnosticButtonText}>Exécuter diagnostic réseau</Text>
          </TouchableOpacity>
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
  scanProgress: {
    height: 4,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
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
  debugBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#6c757d',
    lineHeight: 16,
    flex: 1,
  },
  diagnosticButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 8,
  },
  diagnosticButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
});
