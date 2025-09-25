
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RVolutionDevice } from '../../types/Device';
import { colors, commonStyles } from '../../styles/commonStyles';
import { useDeviceDiscovery } from '../../hooks/useDeviceDiscovery';
import RemoteControl from '../../components/RemoteControl';
import Icon from '../../components/Icon';

export default function DeviceControlScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { devices, updateDeviceStatus } = useDeviceDiscovery();
  const [device, setDevice] = useState<RVolutionDevice | null>(null);

  useEffect(() => {
    const foundDevice = devices.find(d => d.id === id);
    if (foundDevice) {
      setDevice(foundDevice);
    } else {
      Alert.alert('Erreur', 'Appareil non trouvé', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
  }, [id, devices, router]);

  useEffect(() => {
    // Update device status every 30 seconds
    const interval = setInterval(() => {
      updateDeviceStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, [updateDeviceStatus]);

  if (!device) {
    return (
      <SafeAreaView style={commonStyles.container}>
        <View style={commonStyles.content}>
          <Text style={commonStyles.text}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Télécommande</Text>
        <View style={styles.placeholder} />
      </View>

      {!device.isOnline && (
        <View style={styles.offlineWarning}>
          <Icon name="warning" size={20} color="#FF9800" />
          <Text style={styles.offlineText}>Appareil hors ligne</Text>
        </View>
      )}

      <RemoteControl device={device} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.backgroundAlt,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.backgroundAlt,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  offlineWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9800',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
  },
  offlineText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 8,
  },
});
