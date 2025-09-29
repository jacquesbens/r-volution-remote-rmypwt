
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { colors } from '../styles/commonStyles';
import { useCommandHistory } from '../hooks/useCommandHistory';
import SimpleIcon from './SimpleIcon';
import LoadingSpinner from './LoadingSpinner';

interface CommandHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  deviceId?: string;
}

const CommandHistoryModal: React.FC<CommandHistoryModalProps> = ({
  visible,
  onClose,
  deviceId,
}) => {
  const {
    commandHistory,
    isLoading,
    loadCommandHistory,
    clearCommandHistory,
    getRecentCommandsForDevice,
    getCommandStats,
  } = useCommandHistory();

  useEffect(() => {
    if (visible) {
      loadCommandHistory();
    }
  }, [visible, loadCommandHistory]);

  const handleClearHistory = () => {
    Alert.alert(
      'Effacer l\'historique',
      'Êtes-vous sûr de vouloir effacer tout l\'historique des commandes ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Effacer',
          style: 'destructive',
          onPress: async () => {
            await clearCommandHistory();
            Alert.alert('Historique effacé', 'L\'historique des commandes a été effacé.');
          },
        },
      ]
    );
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffMinutes < 1) return 'À l\'instant';
    if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const displayHistory = deviceId 
    ? getRecentCommandsForDevice(deviceId, 50)
    : commandHistory.slice(0, 50);

  const stats = getCommandStats();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {deviceId ? 'Historique de l\'appareil' : 'Historique des commandes'}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <SimpleIcon name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <LoadingSpinner size={32} />
            <Text style={styles.loadingText}>Chargement de l'historique...</Text>
          </View>
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Statistics */}
            <View style={styles.statsContainer}>
              <Text style={styles.sectionTitle}>Statistiques</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.totalCommands}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.success }]}>
                    {stats.successfulCommands}
                  </Text>
                  <Text style={styles.statLabel}>Réussies</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.accent }]}>
                    {stats.failedCommands}
                  </Text>
                  <Text style={styles.statLabel}>Échouées</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.primary }]}>
                    {stats.successRate}%
                  </Text>
                  <Text style={styles.statLabel}>Taux de réussite</Text>
                </View>
              </View>
              
              {stats.mostUsedCommand && (
                <View style={styles.mostUsedContainer}>
                  <Text style={styles.mostUsedLabel}>Commande la plus utilisée :</Text>
                  <Text style={styles.mostUsedValue}>
                    {stats.mostUsedCommand.name} ({stats.mostUsedCommand.count} fois)
                  </Text>
                </View>
              )}
            </View>

            {/* History List */}
            <View style={styles.historyContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Historique ({displayHistory.length})
                </Text>
                {commandHistory.length > 0 && (
                  <TouchableOpacity
                    onPress={handleClearHistory}
                    style={styles.clearButton}
                  >
                    <SimpleIcon name="trash" size={16} color={colors.accent} />
                    <Text style={styles.clearButtonText}>Effacer</Text>
                  </TouchableOpacity>
                )}
              </View>

              {displayHistory.length === 0 ? (
                <View style={styles.emptyState}>
                  <SimpleIcon name="time" size={48} color={colors.grey} />
                  <Text style={styles.emptyStateTitle}>Aucun historique</Text>
                  <Text style={styles.emptyStateText}>
                    Les commandes exécutées apparaîtront ici
                  </Text>
                </View>
              ) : (
                <View style={styles.historyList}>
                  {displayHistory.map((entry) => (
                    <View key={entry.id} style={styles.historyItem}>
                      <View style={styles.historyItemHeader}>
                        <View style={styles.historyItemInfo}>
                          <SimpleIcon
                            name={entry.success ? 'checkmark-circle' : 'close-circle'}
                            size={16}
                            color={entry.success ? colors.success : colors.accent}
                          />
                          <Text style={styles.commandName}>{entry.commandName}</Text>
                        </View>
                        <Text style={styles.timestamp}>
                          {formatTimestamp(entry.timestamp)}
                        </Text>
                      </View>
                      
                      <View style={styles.historyItemDetails}>
                        <Text style={styles.deviceName}>{entry.deviceName}</Text>
                        {entry.errorMessage && (
                          <Text style={styles.errorMessage}>{entry.errorMessage}</Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        )}
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
    borderBottomColor: colors.backgroundAlt,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.backgroundAlt,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: colors.grey,
  },
  statsContainer: {
    backgroundColor: colors.backgroundAlt,
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.grey,
    marginTop: 4,
  },
  mostUsedContainer: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
  },
  mostUsedLabel: {
    fontSize: 14,
    color: colors.grey,
    marginBottom: 4,
  },
  mostUsedValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  historyContainer: {
    margin: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  clearButtonText: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.grey,
    textAlign: 'center',
  },
  historyList: {
    gap: 8,
  },
  historyItem: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 8,
    padding: 12,
  },
  historyItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  historyItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  commandName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  timestamp: {
    fontSize: 12,
    color: colors.grey,
  },
  historyItemDetails: {
    marginLeft: 24,
  },
  deviceName: {
    fontSize: 14,
    color: colors.grey,
    marginBottom: 2,
  },
  errorMessage: {
    fontSize: 12,
    color: colors.accent,
    fontStyle: 'italic',
  },
});

export default CommandHistoryModal;
