import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../theme/theme';
import { MOCK_HISTORY_ROUNDS } from '../data/mockData';

export default function HistoryScreen() {
  const [selectedRound, setSelectedRound] = useState(null);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Historial de Rondas</Text>
          <Text style={styles.headerSubtitle}>Registro de Partidas & Balances Financieros</Text>
        </View>

        {/* List of Past Rounds */}
        {MOCK_HISTORY_ROUNDS.map((round) => (
          <TouchableOpacity
            key={round.id}
            style={styles.roundCard}
            activeOpacity={0.8}
            onPress={() => setSelectedRound(round)}
          >
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.courseName}>{round.courseName}</Text>
                <Text style={styles.dateText}>{round.date} • Par {round.par}</Text>
              </View>
              <View style={styles.winnerChip}>
                <Text style={styles.winnerAvatar}>{round.winnerAvatar}</Text>
                <Text style={styles.winnerChipText}>{round.winnerName.split(' ')[0]}</Text>
              </View>
            </View>

            <Text style={styles.weatherText}>{round.weather}</Text>

            <View style={styles.divider} />

            {/* Players Payout Table Preview */}
            <View style={styles.balancesContainer}>
              {round.balances.map((b, i) => (
                <View key={i} style={styles.balanceItem}>
                  <Text style={styles.playerName}>{b.name}</Text>
                  <Text
                    style={[
                      styles.balanceValue,
                      { color: b.balance >= 0 ? COLORS.positiveMoney : COLORS.negativeMoney },
                    ]}
                  >
                    {b.balance >= 0 ? `+$${b.balance}` : `-$${Math.abs(b.balance)}`}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.potText}>Pozo Acumulado: ${round.totalPot.toLocaleString()} MXN</Text>
              <View style={styles.detailBtn}>
                <Text style={styles.detailBtnText}>Ver Detalle Completo</Text>
                <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Visual Round Detail Modal */}
      {selectedRound && (
        <Modal
          visible={!!selectedRound}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setSelectedRound(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>{selectedRound.courseName}</Text>
                  <Text style={styles.modalSubtitle}>{selectedRound.date}</Text>
                </View>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setSelectedRound(null)}
                >
                  <Ionicons name="close" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Winner Card Highlight */}
                <View style={styles.trophyCard}>
                  <Text style={styles.trophyIcon}>🏆</Text>
                  <Text style={styles.trophyTitle}>Ganador de la Ronda</Text>
                  <Text style={styles.trophyWinnerName}>{selectedRound.winnerName}</Text>
                  <Text style={styles.trophySubtitle}>{selectedRound.summaryText}</Text>
                </View>

                {/* Detailed Balances Breakdown */}
                <Text style={styles.modalSectionTitle}>Liquidación Financiera Final</Text>
                <View style={styles.payoutCard}>
                  {selectedRound.balances.map((b, i) => (
                    <View key={i} style={styles.payoutRow}>
                      <View style={styles.payoutLeft}>
                        <FontAwesome5
                          name={b.isWinner ? 'crown' : 'user'}
                          size={14}
                          color={b.isWinner ? COLORS.accentGold : COLORS.textMuted}
                        />
                        <Text style={[styles.payoutName, b.isWinner && { fontWeight: '800' }]}>
                          {b.name}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.payoutAmount,
                          { color: b.balance >= 0 ? COLORS.positiveMoney : COLORS.negativeMoney },
                        ]}
                      >
                        {b.balance >= 0 ? `+$${b.balance} MXN` : `-$${Math.abs(b.balance)} MXN`}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Round Info Stats */}
                <Text style={styles.modalSectionTitle}>Resumen del Juego</Text>
                <View style={styles.infoGrid}>
                  <View style={styles.infoBox}>
                    <Text style={styles.infoBoxLabel}>Pozo Total</Text>
                    <Text style={styles.infoBoxValue}>${selectedRound.totalPot} MXN</Text>
                  </View>
                  <View style={styles.infoBox}>
                    <Text style={styles.infoBoxLabel}>Clima</Text>
                    <Text style={styles.infoBoxValue}>{selectedRound.weather}</Text>
                  </View>
                  <View style={styles.infoBox}>
                    <Text style={styles.infoBoxLabel}>Modalidades</Text>
                    <Text style={styles.infoBoxValue}>Nassau + Skins + Dots</Text>
                  </View>
                  <View style={styles.infoBox}>
                    <Text style={styles.infoBoxLabel}>Hoyos Jugados</Text>
                    <Text style={styles.infoBoxValue}>{selectedRound.totalHoles} Hoyos</Text>
                  </View>
                </View>
              </ScrollView>

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setSelectedRound(null)}
              >
                <Text style={styles.modalCloseBtnText}>Cerrar Detalle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  header: {
    marginBottom: SPACING.md,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  roundCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  courseName: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  dateText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  winnerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.accentGold,
  },
  winnerAvatar: {
    fontSize: 14,
    marginRight: 4,
  },
  winnerChipText: {
    color: COLORS.accentGold,
    fontSize: 12,
    fontWeight: '800',
  },
  weatherText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 6,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  balancesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  balanceItem: {
    width: '48%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  playerName: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  balanceValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
  },
  potText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
    marginRight: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.md,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  closeBtn: {
    padding: 4,
  },
  trophyCard: {
    backgroundColor: COLORS.bgSubtle,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.accentGold,
  },
  trophyIcon: {
    fontSize: 36,
  },
  trophyTitle: {
    color: COLORS.accentGold,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 4,
  },
  trophyWinnerName: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
  },
  trophySubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
  },
  modalSectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  payoutCard: {
    backgroundColor: COLORS.bgSubtle,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  payoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  payoutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  payoutName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    marginLeft: 8,
  },
  payoutAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  infoBox: {
    width: '48%',
    backgroundColor: COLORS.bgSubtle,
    borderRadius: RADIUS.sm,
    padding: SPACING.xs,
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoBoxLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  infoBoxValue: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  modalCloseBtn: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  modalCloseBtnText: {
    color: COLORS.textPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
});
