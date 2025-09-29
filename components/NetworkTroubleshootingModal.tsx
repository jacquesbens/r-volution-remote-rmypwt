
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../styles/commonStyles';
import Icon from './Icon';
import Button from './Button';

interface NetworkTroubleshootingModalProps {
  visible: boolean;
  onClose: () => void;
  networkInfo?: {
    localIP?: string;
    networkRange?: string;
  };
  scanAttempts: number;
  onRetryScan: () => void;
}

const NetworkTroubleshootingModal: React.FC<NetworkTroubleshootingModalProps> = ({
  visible,
  onClose,
  networkInfo,
  scanAttempts,
  onRetryScan,
}) => {
  const [testIP, setTestIP] = useState('');
  const [isTestingIP, setIsTestingIP] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const handleTestSpecificIP = async () => {
    if (!testIP.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse IP à tester.');
      return;
    }

    // Validate IP format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(testIP.trim())) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse IP valide (ex: 192.168.1.20).');
      return;
    }

    setIsTestingIP(true);
    try {
      console.log(`Testing specific IP: ${testIP.trim()}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`http://${testIP.trim()}:80/cgi-bin/do?`, {
        method: 'HEAD',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok || response.status < 500) {
        Alert.alert(
          'Test de connexion',
          `✅ L'appareil à l'adresse ${testIP.trim()} répond !\n\nStatus: ${response.status}\n\nVous pouvez maintenant l'ajouter manuellement.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Test de connexion',
          `⚠️ L'appareil répond mais avec une erreur.\n\nStatus: ${response.status}\n\nEssayez quand même de l'ajouter manuellement.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.log('IP test failed:', error);
      Alert.alert(
        'Test de connexion',
        `❌ Impossible de se connecter à ${testIP.trim()}\n\nErreur: ${error.message}\n\nVérifiez que l'appareil est allumé et sur le même réseau.`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsTestingIP(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const troubleshootingSections = [
    {
      id: 'network',
      title: 'Problèmes de réseau',
      icon: 'wifi',
      color: colors.primary,
      content: [
        'Vérifiez que vous êtes connecté au même réseau Wi-Fi que vos appareils R_volution',
        'Redémarrez votre routeur Wi-Fi si nécessaire',
        'Assurez-vous que le réseau n\'est pas configuré en mode "isolation des clients"',
        'Sur les réseaux d\'entreprise, contactez votre administrateur réseau',
        'Essayez de vous connecter à un réseau domestique si possible',
      ]
    },
    {
      id: 'device',
      title: 'Problèmes d\'appareil',
      icon: 'hardware-chip',
      color: colors.warning,
      content: [
        'Vérifiez que vos appareils R_volution sont allumés',
        'Assurez-vous qu\'ils sont connectés au Wi-Fi (voyant réseau allumé)',
        'Redémarrez vos appareils R_volution',
        'Vérifiez les paramètres réseau dans le menu de l\'appareil',
        'Consultez le manuel de votre appareil pour l\'adresse IP',
      ]
    },
    {
      id: 'firewall',
      title: 'Pare-feu et sécurité',
      icon: 'shield-checkmark',
      color: colors.error,
      content: [
        'Désactivez temporairement le pare-feu de votre ordinateur/téléphone',
        'Vérifiez les paramètres de sécurité de votre routeur',
        'Autorisez l\'application dans les paramètres de sécurité',
        'Sur les réseaux d\'entreprise, des ports peuvent être bloqués',
        'Essayez depuis un autre appareil pour confirmer le problème',
      ]
    },
    {
      id: 'manual',
      title: 'Solutions manuelles',
      icon: 'construct',
      color: colors.success,
      content: [
        'Trouvez l\'adresse IP dans les paramètres de votre appareil R_volution',
        'Utilisez l\'interface web de votre routeur pour voir les appareils connectés',
        'Essayez des adresses IP communes : 192.168.1.x, 192.168.0.x',
        'Utilisez une application de scan réseau sur votre téléphone',
        'Contactez le support technique de R_volution si nécessaire',
      ]
    }
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Dépannage réseau</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Status Summary */}
          <View style={styles.statusSection}>
            <View style={styles.statusHeader}>
              <Icon name="information-circle" size={24} color={colors.primary} />
              <Text style={styles.statusTitle}>État actuel</Text>
            </View>
            
            <View style={styles.statusGrid}>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Scans effectués</Text>
                <Text style={styles.statusValue}>{scanAttempts}</Text>
              </View>
              
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Réseau détecté</Text>
                <Text style={styles.statusValue}>
                  {networkInfo?.localIP || 'Inconnu'}
                </Text>
              </View>
            </View>

            {networkInfo?.networkRange && (
              <Text style={styles.networkRangeInfo}>
                Plages scannées : {networkInfo.networkRange}
              </Text>
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsSection}>
            <Text style={styles.sectionTitle}>Actions rapides</Text>
            
            <View style={styles.quickActionButtons}>
              <Button
                text="Nouveau scan"
                onPress={onRetryScan}
                style={styles.quickActionButton}
              />
            </View>

            <View style={styles.testIPSection}>
              <Text style={styles.testIPLabel}>Tester une IP spécifique :</Text>
              <View style={styles.testIPContainer}>
                <TextInput
                  style={styles.testIPInput}
                  value={testIP}
                  onChangeText={setTestIP}
                  placeholder="192.168.1.20"
                  placeholderTextColor={colors.grey}
                  keyboardType="numbers-and-punctuation"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={[styles.testIPButton, { opacity: isTestingIP ? 0.6 : 1 }]}
                  onPress={handleTestSpecificIP}
                  disabled={isTestingIP}
                >
                  {isTestingIP ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Icon name="search" size={16} color={colors.white} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Troubleshooting Sections */}
          <View style={styles.troubleshootingSection}>
            <Text style={styles.sectionTitle}>Guide de dépannage</Text>
            
            {troubleshootingSections.map((section) => (
              <View key={section.id} style={styles.troubleshootingItem}>
                <TouchableOpacity
                  style={styles.troubleshootingHeader}
                  onPress={() => toggleSection(section.id)}
                >
                  <View style={styles.troubleshootingHeaderLeft}>
                    <Icon name={section.icon} size={20} color={section.color} />
                    <Text style={styles.troubleshootingTitle}>{section.title}</Text>
                  </View>
                  <Icon 
                    name={expandedSection === section.id ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={colors.grey} 
                  />
                </TouchableOpacity>
                
                {expandedSection === section.id && (
                  <View style={styles.troubleshootingContent}>
                    {section.content.map((item, index) => (
                      <View key={index} style={styles.troubleshootingContentItem}>
                        <Text style={styles.troubleshootingBullet}>•</Text>
                        <Text style={styles.troubleshootingText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Common IP Ranges */}
          <View style={styles.ipRangesSection}>
            <Text style={styles.sectionTitle}>Adresses IP communes</Text>
            <Text style={styles.ipRangesDescription}>
              Essayez ces adresses IP communes si vous connaissez le dernier chiffre :
            </Text>
            
            <View style={styles.ipRangesList}>
              {['192.168.1.', '192.168.0.', '192.168.2.', '10.0.0.', '10.0.1.'].map((range) => (
                <View key={range} style={styles.ipRangeItem}>
                  <Text style={styles.ipRangeText}>{range}[1-254]</Text>
                  <Text style={styles.ipRangeExample}>Ex: {range}20</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Contact Support */}
          <View style={styles.supportSection}>
            <View style={styles.supportHeader}>
              <Icon name="help-circle" size={24} color={colors.primary} />
              <Text style={styles.supportTitle}>Besoin d'aide ?</Text>
            </View>
            <Text style={styles.supportText}>
              Si ces solutions ne fonctionnent pas, consultez la documentation de votre appareil R_volution 
              ou contactez le support technique.
            </Text>
          </View>
        </ScrollView>
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
  statusSection: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  statusGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  statusItem: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    color: colors.grey,
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  networkRangeInfo: {
    fontSize: 12,
    color: colors.grey,
    marginTop: 12,
    fontStyle: 'italic',
  },
  quickActionsSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  quickActionButtons: {
    marginBottom: 16,
  },
  quickActionButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  testIPSection: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 8,
    padding: 16,
  },
  testIPLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  testIPContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  testIPInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.grey + '30',
  },
  testIPButton: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  troubleshootingSection: {
    marginTop: 24,
  },
  troubleshootingItem: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  troubleshootingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  troubleshootingHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  troubleshootingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  troubleshootingContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: colors.grey + '20',
  },
  troubleshootingContentItem: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 8,
  },
  troubleshootingBullet: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 1,
  },
  troubleshootingText: {
    flex: 1,
    fontSize: 14,
    color: colors.grey,
    lineHeight: 20,
  },
  ipRangesSection: {
    marginTop: 24,
  },
  ipRangesDescription: {
    fontSize: 14,
    color: colors.grey,
    marginBottom: 16,
    lineHeight: 20,
  },
  ipRangesList: {
    gap: 8,
  },
  ipRangeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  ipRangeText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  ipRangeExample: {
    fontSize: 12,
    color: colors.grey,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  supportSection: {
    backgroundColor: colors.primary + '10',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    marginBottom: 24,
  },
  supportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  supportText: {
    fontSize: 14,
    color: colors.grey,
    lineHeight: 20,
  },
});

export default NetworkTroubleshootingModal;
