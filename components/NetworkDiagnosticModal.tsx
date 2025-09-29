
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../styles/commonStyles';
import SimpleIcon from './SimpleIcon';
import Button from './Button';

interface NetworkDiagnosticModalProps {
  visible: boolean;
  onClose: () => void;
  targetIP?: string;
}

interface DiagnosticResult {
  test: string;
  status: 'running' | 'success' | 'warning' | 'error';
  message: string;
  details?: string;
}

const NetworkDiagnosticModal: React.FC<NetworkDiagnosticModalProps> = ({
  visible,
  onClose,
  targetIP,
}) => {
  const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');

  const runDiagnostics = async () => {
    setIsRunning(true);
    setDiagnosticResults([]);
    
    const tests = [
      {
        name: 'Connectivité réseau',
        test: async () => {
          setCurrentTest('Test de connectivité réseau...');
          try {
            // Test basic network connectivity
            const response = await fetch('https://www.google.com', {
              method: 'HEAD',
              signal: AbortSignal.timeout(5000),
            });
            return {
              status: 'success' as const,
              message: 'Connexion Internet OK',
              details: `Status: ${response.status}`,
            };
          } catch (error) {
            return {
              status: 'warning' as const,
              message: 'Connexion Internet limitée',
              details: 'Peut affecter la découverte automatique',
            };
          }
        },
      },
      {
        name: 'Test de port HTTP',
        test: async () => {
          setCurrentTest('Test du port HTTP 80...');
          if (!targetIP) {
            return {
              status: 'warning' as const,
              message: 'Aucune IP cible spécifiée',
              details: 'Spécifiez une IP pour tester la connectivité',
            };
          }
          
          try {
            const response = await fetch(`http://${targetIP}:80/`, {
              method: 'HEAD',
              signal: AbortSignal.timeout(5000),
            });
            return {
              status: 'success' as const,
              message: `Port 80 accessible sur ${targetIP}`,
              details: `Status: ${response.status}`,
            };
          } catch (error) {
            return {
              status: 'error' as const,
              message: `Port 80 inaccessible sur ${targetIP}`,
              details: error.message,
            };
          }
        },
      },
      {
        name: 'Test CGI endpoint',
        test: async () => {
          setCurrentTest('Test de l\'endpoint CGI...');
          if (!targetIP) {
            return {
              status: 'warning' as const,
              message: 'Aucune IP cible spécifiée',
              details: 'Spécifiez une IP pour tester l\'endpoint',
            };
          }
          
          try {
            const response = await fetch(`http://${targetIP}:80/cgi-bin/do?`, {
              method: 'HEAD',
              signal: AbortSignal.timeout(5000),
            });
            return {
              status: 'success' as const,
              message: 'Endpoint CGI accessible',
              details: `L'appareil répond sur l'endpoint R_volution`,
            };
          } catch (error) {
            return {
              status: 'error' as const,
              message: 'Endpoint CGI inaccessible',
              details: 'L\'appareil ne semble pas être un R_volution',
            };
          }
        },
      },
      {
        name: 'Test de latence réseau',
        test: async () => {
          setCurrentTest('Mesure de la latence réseau...');
          if (!targetIP) {
            return {
              status: 'warning' as const,
              message: 'Aucune IP cible spécifiée',
              details: 'Spécifiez une IP pour mesurer la latence',
            };
          }
          
          try {
            const startTime = Date.now();
            await fetch(`http://${targetIP}:80/`, {
              method: 'HEAD',
              signal: AbortSignal.timeout(5000),
            });
            const latency = Date.now() - startTime;
            
            let status: 'success' | 'warning' | 'error' = 'success';
            let message = `Latence: ${latency}ms`;
            
            if (latency > 1000) {
              status = 'warning';
              message += ' (Lente)';
            } else if (latency > 2000) {
              status = 'error';
              message += ' (Très lente)';
            } else {
              message += ' (Bonne)';
            }
            
            return {
              status,
              message,
              details: `Temps de réponse réseau mesuré`,
            };
          } catch (error) {
            return {
              status: 'error' as const,
              message: 'Impossible de mesurer la latence',
              details: error.message,
            };
          }
        },
      },
    ];

    for (const testItem of tests) {
      const result = await testItem.test();
      setDiagnosticResults(prev => [...prev, {
        test: testItem.name,
        ...result,
      }]);
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsRunning(false);
    setCurrentTest('');
  };

  useEffect(() => {
    if (visible) {
      runDiagnostics();
    }
  }, [visible, targetIP]);

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'running':
        return <ActivityIndicator size="small" color={colors.primary} />;
      case 'success':
        return <SimpleIcon name="checkmark-circle" size={20} color={colors.success} />;
      case 'warning':
        return <SimpleIcon name="warning" size={20} color={colors.warning} />;
      case 'error':
        return <SimpleIcon name="close-circle" size={20} color={colors.error} />;
      default:
        return <SimpleIcon name="help-circle" size={20} color={colors.grey} />;
    }
  };

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'error':
        return colors.error;
      default:
        return colors.grey;
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
            <SimpleIcon name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Diagnostic réseau</Text>
          <TouchableOpacity onPress={runDiagnostics} style={styles.retryButton}>
            <SimpleIcon name="refresh" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {targetIP && (
            <View style={styles.targetSection}>
              <SimpleIcon name="target" size={20} color={colors.primary} />
              <Text style={styles.targetText}>Cible : {targetIP}</Text>
            </View>
          )}

          {isRunning && currentTest && (
            <View style={styles.currentTestSection}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.currentTestText}>{currentTest}</Text>
            </View>
          )}

          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>Résultats des tests</Text>
            
            {diagnosticResults.length === 0 && !isRunning && (
              <View style={styles.emptyState}>
                <SimpleIcon name="play-circle" size={48} color={colors.grey} />
                <Text style={styles.emptyStateText}>Appuyez sur le bouton de rafraîchissement pour lancer le diagnostic</Text>
              </View>
            )}

            {diagnosticResults.map((result, index) => (
              <View key={index} style={styles.resultItem}>
                <View style={styles.resultHeader}>
                  {getStatusIcon(result.status)}
                  <Text style={styles.resultTest}>{result.test}</Text>
                </View>
                
                <Text style={[styles.resultMessage, { color: getStatusColor(result.status) }]}>
                  {result.message}
                </Text>
                
                {result.details && (
                  <Text style={styles.resultDetails}>{result.details}</Text>
                )}
              </View>
            ))}
          </View>

          {!isRunning && diagnosticResults.length > 0 && (
            <View style={styles.summarySection}>
              <Text style={styles.sectionTitle}>Résumé</Text>
              
              <View style={styles.summaryStats}>
                <View style={styles.summaryStatItem}>
                  <Text style={styles.summaryStatValue}>
                    {diagnosticResults.filter(r => r.status === 'success').length}
                  </Text>
                  <Text style={styles.summaryStatLabel}>Réussis</Text>
                </View>
                
                <View style={styles.summaryStatItem}>
                  <Text style={[styles.summaryStatValue, { color: colors.warning }]}>
                    {diagnosticResults.filter(r => r.status === 'warning').length}
                  </Text>
                  <Text style={styles.summaryStatLabel}>Avertissements</Text>
                </View>
                
                <View style={styles.summaryStatItem}>
                  <Text style={[styles.summaryStatValue, { color: colors.error }]}>
                    {diagnosticResults.filter(r => r.status === 'error').length}
                  </Text>
                  <Text style={styles.summaryStatLabel}>Échecs</Text>
                </View>
              </View>

              <View style={styles.recommendationsSection}>
                <Text style={styles.recommendationsTitle}>Recommandations :</Text>
                
                {diagnosticResults.some(r => r.status === 'error') && (
                  <Text style={styles.recommendationText}>
                    • Des erreurs ont été détectées. Vérifiez la connectivité réseau et les paramètres de l'appareil.
                  </Text>
                )}
                
                {diagnosticResults.some(r => r.status === 'warning') && (
                  <Text style={styles.recommendationText}>
                    • Des avertissements ont été détectés. La fonctionnalité peut être limitée.
                  </Text>
                )}
                
                {diagnosticResults.every(r => r.status === 'success') && (
                  <Text style={[styles.recommendationText, { color: colors.success }]}>
                    • Tous les tests sont réussis ! L'appareil devrait fonctionner correctement.
                  </Text>
                )}
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            text="Fermer"
            onPress={onClose}
            style={styles.closeButtonFooter}
          />
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
  retryButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  targetSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 8,
    padding: 12,
    marginTop: 20,
    gap: 8,
  },
  targetText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    fontFamily: 'monospace',
  },
  currentTestSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '10',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    gap: 8,
  },
  currentTestText: {
    fontSize: 14,
    color: colors.text,
    fontStyle: 'italic',
  },
  resultsSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.grey,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  resultItem: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  resultTest: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  resultMessage: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  resultDetails: {
    fontSize: 12,
    color: colors.grey,
    fontStyle: 'italic',
  },
  summarySection: {
    marginTop: 24,
    marginBottom: 24,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  summaryStatItem: {
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.success,
  },
  summaryStatLabel: {
    fontSize: 12,
    color: colors.grey,
    marginTop: 4,
  },
  recommendationsSection: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 8,
    padding: 16,
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 13,
    color: colors.grey,
    lineHeight: 18,
    marginBottom: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.grey + '20',
  },
  closeButtonFooter: {
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
});

export default NetworkDiagnosticModal;
