
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import Icon from './Icon';
import Button from './Button';

interface NetworkHelpModalProps {
  visible: boolean;
  onClose: () => void;
  onAddManualDevice?: (ip: string, name: string) => void;
}

// Safe color constants
const COLORS = {
  primary: '#162456',
  background: '#101824',
  backgroundAlt: '#162133',
  text: '#e3e3e3',
  grey: '#90CAF9',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#FF5252',
};

// Helper functions with safe implementations
const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'high': return COLORS.error;
    case 'medium': return COLORS.warning;
    case 'low': return COLORS.success;
    default: return COLORS.grey;
  }
};

const getPriorityText = (priority: string): string => {
  switch (priority) {
    case 'high': return 'Priorité élevée';
    case 'medium': return 'Priorité moyenne';
    case 'low': return 'Priorité faible';
    default: return '';
  }
};

const NetworkHelpModal: React.FC<NetworkHelpModalProps> = ({
  visible,
  onClose,
  onAddManualDevice,
}) => {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [manualIP, setManualIP] = useState('');
  const [manualName, setManualName] = useState('');

  // Network scenarios with safe static data
  const networkScenarios = [
    {
      id: 'different_network',
      title: 'Je suis sur un réseau différent',
      icon: 'wifi-outline' as const,
      color: COLORS.warning,
      description: 'Vous n\'êtes pas sur le même réseau Wi-Fi que vos appareils R_volution',
      solutions: [
        'Connectez-vous au même réseau Wi-Fi que vos appareils R_volution',
        'Vérifiez le nom du réseau Wi-Fi dans les paramètres de votre appareil',
        'Si vous utilisez un réseau invité, passez au réseau principal',
        'Redémarrez votre connexion Wi-Fi',
        'Utilisez l\'ajout manuel avec l\'adresse IP de l\'appareil',
      ],
      priority: 'high' as const
    },
    {
      id: 'enterprise_network',
      title: 'Réseau d\'entreprise ou public',
      icon: 'business' as const,
      color: COLORS.error,
      description: 'Les réseaux d\'entreprise bloquent souvent la découverte d\'appareils',
      solutions: [
        'Contactez votre administrateur réseau pour autoriser la découverte',
        'Demandez l\'ouverture du port 80 pour HTTP',
        'Utilisez exclusivement l\'ajout manuel',
        'Connectez-vous à un réseau domestique si possible',
        'Créez un hotspot mobile temporaire',
      ],
      priority: 'high' as const
    },
    {
      id: 'firewall_blocking',
      title: 'Pare-feu ou sécurité',
      icon: 'shield-checkmark' as const,
      color: COLORS.primary,
      description: 'Un pare-feu bloque la communication avec vos appareils',
      solutions: [
        'Désactivez temporairement le pare-feu de votre appareil',
        'Autorisez l\'application dans les paramètres de sécurité',
        'Vérifiez les paramètres de sécurité de votre routeur',
        'Désactivez le mode "isolation des clients" sur votre routeur',
        'Redémarrez votre routeur',
      ],
      priority: 'medium' as const
    },
    {
      id: 'device_offline',
      title: 'Appareil éteint ou déconnecté',
      icon: 'power' as const,
      color: COLORS.grey,
      description: 'Vos appareils R_volution ne sont pas accessibles',
      solutions: [
        'Vérifiez que vos appareils R_volution sont allumés',
        'Contrôlez que le voyant réseau est allumé sur l\'appareil',
        'Redémarrez vos appareils R_volution',
        'Vérifiez la connexion Wi-Fi dans le menu de l\'appareil',
        'Reconnectez l\'appareil au Wi-Fi si nécessaire',
      ],
      priority: 'medium' as const
    },
    {
      id: 'ip_changed',
      title: 'Adresse IP changée',
      icon: 'refresh' as const,
      color: COLORS.success,
      description: 'L\'adresse IP de votre appareil a changé',
      solutions: [
        'Consultez l\'interface de votre routeur pour voir les appareils connectés',
        'Vérifiez l\'adresse IP dans les paramètres de l\'appareil R_volution',
        'Configurez une IP fixe sur votre appareil si possible',
        'Utilisez l\'ajout manuel avec la nouvelle adresse IP',
        'Supprimez l\'ancien appareil et ajoutez-le avec la nouvelle IP',
      ],
      priority: 'low' as const
    }
  ];

  const handleScenarioSelect = (scenarioId: string) => {
    console.log('Scenario selected:', scenarioId);
    setSelectedScenario(selectedScenario === scenarioId ? null : scenarioId);
  };

  const handleManualAdd = () => {
    console.log('Manual add attempt:', { ip: manualIP, name: manualName });
    
    if (!manualIP.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse IP.');
      return;
    }

    if (!manualName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom pour l\'appareil.');
      return;
    }

    // Validate IP format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(manualIP.trim())) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse IP valide (ex: 192.168.1.20).');
      return;
    }

    if (onAddManualDevice) {
      onAddManualDevice(manualIP.trim(), manualName.trim());
      setManualIP('');
      setManualName('');
      onClose();
    }
  };

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
            <Icon name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Aide réseau</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Quick Manual Add Section */}
          <View style={styles.quickAddSection}>
            <View style={styles.quickAddHeader}>
              <Icon name="add-circle" size={24} color={COLORS.primary} />
              <Text style={styles.quickAddTitle}>Ajout rapide</Text>
            </View>
            <Text style={styles.quickAddDescription}>
              Si vous connaissez l'adresse IP de votre appareil, ajoutez-le directement :
            </Text>
            
            <View style={styles.quickAddForm}>
              <TextInput
                style={styles.quickAddInput}
                value={manualName}
                onChangeText={setManualName}
                placeholder="Nom de l'appareil"
                placeholderTextColor={COLORS.grey}
              />
              
              <TextInput
                style={styles.quickAddInput}
                value={manualIP}
                onChangeText={setManualIP}
                placeholder="192.168.1.20"
                placeholderTextColor={COLORS.grey}
                keyboardType="numbers-and-punctuation"
                autoCapitalize="none"
                autoCorrect={false}
              />
              
              <Button
                text="Ajouter l'appareil"
                onPress={handleManualAdd}
                style={styles.quickAddButton}
              />
            </View>
          </View>

          {/* Scenarios Section */}
          <View style={styles.scenariosSection}>
            <Text style={styles.sectionTitle}>Diagnostiquer votre problème</Text>
            <Text style={styles.sectionDescription}>
              Sélectionnez la situation qui correspond le mieux à votre problème :
            </Text>
            
            {networkScenarios.map((scenario) => (
              <View key={scenario.id} style={styles.scenarioItem}>
                <TouchableOpacity
                  style={styles.scenarioHeader}
                  onPress={() => handleScenarioSelect(scenario.id)}
                >
                  <View style={styles.scenarioHeaderLeft}>
                    <Icon name={scenario.icon} size={24} color={scenario.color} />
                    <View style={styles.scenarioHeaderText}>
                      <Text style={styles.scenarioTitle}>{scenario.title}</Text>
                      <Text style={[styles.scenarioPriority, { color: getPriorityColor(scenario.priority) }]}>
                        {getPriorityText(scenario.priority)}
                      </Text>
                    </View>
                  </View>
                  <Icon 
                    name={selectedScenario === scenario.id ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={COLORS.grey} 
                  />
                </TouchableOpacity>
                
                {selectedScenario === scenario.id && (
                  <View style={styles.scenarioContent}>
                    <Text style={styles.scenarioDescription}>
                      {scenario.description}
                    </Text>
                    
                    <Text style={styles.solutionsTitle}>Solutions recommandées :</Text>
                    {scenario.solutions.map((solution, index) => (
                      <View key={index} style={styles.solutionItem}>
                        <Text style={styles.solutionNumber}>{index + 1}.</Text>
                        <Text style={styles.solutionText}>{solution}</Text>
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
            <Text style={styles.sectionDescription}>
              Si vous cherchez l'adresse IP de votre appareil, essayez ces plages communes :
            </Text>
            
            <View style={styles.ipRangesList}>
              {[
                { range: '192.168.1.x', description: 'Réseau domestique le plus courant' },
                { range: '192.168.0.x', description: 'Deuxième réseau domestique le plus courant' },
                { range: '192.168.43.x', description: 'Hotspot Android' },
                { range: '172.20.10.x', description: 'Hotspot iOS' },
                { range: '10.0.0.x', description: 'Réseau d\'entreprise' },
              ].map((item, index) => (
                <View key={index} style={styles.ipRangeItem}>
                  <Text style={styles.ipRangeText}>{item.range}</Text>
                  <Text style={styles.ipRangeDescription}>{item.description}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Contact Support */}
          <View style={styles.supportSection}>
            <View style={styles.supportHeader}>
              <Icon name="help-circle" size={24} color={COLORS.primary} />
              <Text style={styles.supportTitle}>Besoin d'aide supplémentaire ?</Text>
            </View>
            <Text style={styles.supportText}>
              Si ces solutions ne résolvent pas votre problème, consultez la documentation 
              de votre appareil R_volution ou contactez le support technique.
            </Text>
            <Text style={styles.supportTip}>
              💡 Astuce : Notez l'adresse IP de votre appareil pour éviter ce problème à l'avenir.
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
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grey + '20',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  quickAddSection: {
    backgroundColor: COLORS.primary + '10',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  quickAddHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  quickAddTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  quickAddDescription: {
    fontSize: 14,
    color: COLORS.grey,
    marginBottom: 16,
    lineHeight: 20,
  },
  quickAddForm: {
    gap: 12,
  },
  quickAddInput: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.grey + '30',
  },
  quickAddButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  scenariosSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: COLORS.grey,
    marginBottom: 16,
    lineHeight: 20,
  },
  scenarioItem: {
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  scenarioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  scenarioHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  scenarioHeaderText: {
    flex: 1,
  },
  scenarioTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 2,
  },
  scenarioPriority: {
    fontSize: 12,
    fontWeight: '500',
  },
  scenarioContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.grey + '20',
  },
  scenarioDescription: {
    fontSize: 14,
    color: COLORS.grey,
    marginBottom: 16,
    lineHeight: 20,
  },
  solutionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  solutionItem: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 8,
  },
  solutionNumber: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    minWidth: 20,
  },
  solutionText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.grey,
    lineHeight: 20,
  },
  ipRangesSection: {
    marginTop: 24,
  },
  ipRangesList: {
    gap: 8,
  },
  ipRangeItem: {
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  ipRangeText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  ipRangeDescription: {
    fontSize: 12,
    color: COLORS.grey,
  },
  supportSection: {
    backgroundColor: COLORS.backgroundAlt,
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
    color: COLORS.text,
  },
  supportText: {
    fontSize: 14,
    color: COLORS.grey,
    lineHeight: 20,
    marginBottom: 12,
  },
  supportTip: {
    fontSize: 13,
    color: COLORS.primary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
});

export default NetworkHelpModal;
