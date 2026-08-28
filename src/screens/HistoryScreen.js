import React, { useState, useEffect } from 'react';
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
import { getHistoryRounds, subscribeHistory } from '../data/roundStore';

export default function HistoryScreen({ navigation }) {
  const [rounds, setRounds] = useState(getHistoryRounds());
  const [selectedRound, setSelectedRound] = useState(null);
  const [modalScoreType, setModalScoreType] = useState('net'); // 'gross' | 'net' in historical scorecard modal

  // Subscribe to changes in roundStore
  useEffect(() => {
    const unsubscribe = subscribeHistory((updatedRounds) => {
      setRounds(updatedRounds);
    });
    return () => unsubscribe();
  }, []);

  // Helper for score badge styling in historical scorecard modal
  const getScoreStyle = (score, par) => {
    if (!score || score <= 0) {
      return { bg: 'transparent', border: COLORS.border, text: COLORS.textMuted };
    }
    const diff = score - par;
    if (diff <= -2) return { bg: COLORS.eagleGold, text: '#000' };
    if (diff === -1) return { bg: COLORS.birdieGreen, text: '#FFF' };
    if (diff === 0) return { bg: 'transparent', border: COLORS.border, text: COLORS.textPrimary };
    if (diff === 1) return { bg: COLORS.bogeyOrange, text: '#000' };
    return { bg: COLORS.doubleRed, text: '#FFF' };
  };

  // Helper to get strokes received on a hole
  const getStrokesOnHole = (round, playerId, holeIndexHcp) => {
    if (round.handicapMode === 'full') {
      const p = round.players?.find((pl) => pl.id === playerId);
      const totalStrokes = Math.round(p?.handicapIndex || 0);
      const base = Math.floor(totalStrokes / 18);
      const extra = totalStrokes % 18;
      return base + (holeIndexHcp <= extra ? 1 : 0);
    }
    // Differential mode
    const minHcp = Math.min(...(round.players?.map((p) => p.handicapIndex || 0) || [0]));
    const p = round.players?.find((pl) => pl.id === playerId);
    const totalStrokes = Math.max(0, Math.round((p?.handicapIndex || 0) - minHcp));
    const base = Math.floor(totalStrokes / 18);
    const extra = totalStrokes % 18;
    return base + (holeIndexHcp <= extra ? 1 : 0);
  };

  // Calculate Ida, Vuelta, Total for historical modal table
  const getSubtotal = (round, playerId, range, type) => {
    if (!round || !round.holes) return 0;
    const holeList =
      range === 'out'
        ? round.holes.slice(0, 9)
        : range === 'in'
        ? round.holes.slice(9, 18)
        : round.holes;

    return holeList.reduce((sum, h) => {
      const g = h.scores?.[playerId] || 0;
      if (!g) return sum;
      if (type === 'gross') return sum + g;
      const strokes = getStrokesOnHole(round, playerId, h.hcp);
      const net = Math.max(1, g - strokes);
      return sum + net;
    }, 0);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Historial de Rondas</Text>
          <Text style={styles.headerSubtitle}>Registro de Partidas & Balances Financieros</Text>
        </View>

        {/* Empty State */}
        {rounds.length === 0 && (
          <View style={styles.emptyCard}>
            <Ionicons name="journal-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>Sin Rondas Finalizadas</Text>
            <Text style={styles.emptySub}>
              Aún no has liquidado ninguna partida. Ve a la sección de Tarjeta para registrar y liquidar una ronda.
            </Text>
            {navigation && (
              <TouchableOpacity
                style={styles.emptyCTA}
                onPress={() => navigation.navigate('Tarjeta')}
              >
                <Text style={styles.emptyCTAText}>Ir a Tarjeta de Golpes</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textPrimary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* List of Liquidated Rounds */}
        {rounds.map((round) => (
          <TouchableOpacity
            key={round.id}
            style={styles.roundCard}
            activeOpacity={0.85}
            onPress={() => setSelectedRound(round)}
          >
            <View style={styles.cardHeader}>
              <View style={{ flex: 1, marginRight: SPACING.xs }}>
                <Text style={styles.courseName}>{round.courseName}</Text>
                <Text style={styles.dateText}>
                  {round.date} • Par {round.parTotal}
                </Text>
                <View style={styles.formatBadgePill}>
                  <Text style={styles.formatBadgeText}>
                    {round.formatLabel || (round.format === '1vs1' ? '🥊 Duelo 1vs1' : '👥 Grupo')}
                  </Text>
                </View>
              </View>
              <View style={styles.winnerChip}>
                <Text style={styles.winnerAvatar}>{round.winnerAvatar || '🏆'}</Text>
                <Text style={styles.winnerChipText}>
                  {(round.winnerName || 'Ganador').split(' ')[0]}
                </Text>
              </View>
            </View>

            <Text style={styles.summaryTextQuote}>{round.summaryText}</Text>

            <View style={styles.divider} />

            {/* Players Payout Table Preview */}
            <View style={styles.balancesContainer}>
              {round.balances.map((b, i) => (
                <View key={i} style={styles.balanceItem}>
                  <Text style={styles.playerName}>
                    {b.isWinner ? '👑 ' : ''}
                    {b.name}
                  </Text>
                  <Text
                    style={[
                      styles.balanceValue,
                      { color: b.balance >= 0 ? COLORS.positiveMoney : COLORS.negativeMoney },
                    ]}
                  >
                    {b.balance >= 0 ? `+$${b.balance}` : `-$${Math.abs(b.balance)}`}{' '}
                    MXN
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.potText}>
                Pozo Liquidado: ${round.totalPot.toLocaleString()} MXN
              </Text>
              <View style={styles.detailBtn}>
                <Text style={styles.detailBtnText}>Desglose Hoyo por Hoyo</Text>
                <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Visual Round Detail Modal with Full Scorecard */}
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
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>{selectedRound.courseName}</Text>
                  <Text style={styles.modalSubtitle}>
                    {selectedRound.date} • {selectedRound.formatLabel}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setSelectedRound(null)}
                >
                  <Ionicons name="close" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Winner Trophy Card */}
                <View style={styles.trophyCard}>
                  <Text style={styles.trophyIcon}>🏆</Text>
                  <Text style={styles.trophyTitle}>Ganador de la Ronda</Text>
                  <Text style={styles.trophyWinnerName}>{selectedRound.winnerName}</Text>
                  <Text style={styles.trophySubtitle}>{selectedRound.summaryText}</Text>
                </View>

                {/* Financial Payout Settlement Table */}
                <Text style={styles.modalSectionTitle}>1. Liquidación Financiera Final</Text>
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
                        <Text style={styles.scoreSummarySub}>
                          (Bruto: {b.grossTotal} {b.grossDiff} | Neto: {b.netTotal} {b.netDiff})
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

                {/* Resumen de Apuestas Ganadas/Perdidas */}
                {selectedRound.wagersSummary && selectedRound.wagersSummary.length > 0 && (
                  <>
                    <Text style={styles.modalSectionTitle}>2. Resumen de Apuestas en Juego</Text>
                    <View style={styles.wagersSummaryCard}>
                      {selectedRound.wagersSummary.map((w, idx) => (
                        <View key={idx} style={styles.wagerSummaryRow}>
                          <Text style={styles.wagerNameText}>{w.wager}</Text>
                          <View style={styles.wagerWinnerBox}>
                            <Text style={styles.wagerWinnerText}>Gana: {w.winner}</Text>
                            <Text style={styles.wagerAmountText}>({w.amount})</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </>
                )}

                {/* DESGLOSE HOYO POR HOYO COMPLETO */}
                <View style={styles.scorecardSectionHeader}>
                  <Text style={styles.modalSectionTitle}>3. Tarjeta Completa Hoyo por Hoyo</Text>

                  {/* Gross vs Net Switch inside Modal */}
                  <View style={styles.modalTypeSwitch}>
                    <TouchableOpacity
                      style={[
                        styles.modalTypeBtn,
                        modalScoreType === 'gross' && styles.modalTypeBtnActive,
                      ]}
                      onPress={() => setModalScoreType('gross')}
                    >
                      <Text
                        style={[
                          styles.modalTypeBtnText,
                          modalScoreType === 'gross' && styles.modalTypeBtnTextActive,
                        ]}
                      >
                        Bruto
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.modalTypeBtn,
                        modalScoreType === 'net' && styles.modalTypeBtnActive,
                      ]}
                      onPress={() => setModalScoreType('net')}
                    >
                      <Text
                        style={[
                          styles.modalTypeBtnText,
                          modalScoreType === 'net' && styles.modalTypeBtnTextActive,
                        ]}
                      >
                        Neto
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Historical Full Scorecard Table */}
                <View style={styles.historicalTableCard}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                    <View>
                      {/* Header Row */}
                      <View style={styles.tableHeaderRow}>
                        <Text style={[styles.thCell, styles.cellHole]}>Hoyo</Text>
                        <Text style={[styles.thCell, styles.cellPar]}>Par</Text>
                        <Text style={[styles.thCell, styles.cellHcp]}>HCP</Text>
                        {selectedRound.players?.map((p) => (
                          <Text key={p.id} style={[styles.thCell, styles.cellPlayer]}>
                            {p.shortName || p.name}
                          </Text>
                        ))}
                      </View>

                      {/* Holes 1 to 18 Rows */}
                      {selectedRound.holes?.map((h, idx) => (
                        <View
                          key={h.hole}
                          style={[
                            styles.tableBodyRow,
                            idx % 2 === 1 && styles.tableRowAlt,
                          ]}
                        >
                          <Text style={[styles.tdCell, styles.cellHole, styles.holeNumText]}>
                            {h.hole}
                          </Text>
                          <Text style={[styles.tdCell, styles.cellPar, styles.parText]}>
                            {h.par}
                          </Text>
                          <Text style={[styles.tdCell, styles.cellHcp, styles.hcpText]}>
                            {h.hcp}
                          </Text>

                          {selectedRound.players?.map((p) => {
                            const grossVal = h.scores?.[p.id] || 0;
                            const strokesReceived = getStrokesOnHole(selectedRound, p.id, h.hcp);
                            const netVal = grossVal > 0 ? Math.max(1, grossVal - strokesReceived) : 0;
                            const displayScore = modalScoreType === 'gross' ? grossVal : netVal;
                            const styleMeta = getScoreStyle(displayScore, h.par);

                            return (
                              <View key={p.id} style={[styles.tdCell, styles.cellPlayer]}>
                                <View
                                  style={[
                                    styles.scoreBadge,
                                    styleMeta.bg !== 'transparent' && {
                                      backgroundColor: styleMeta.bg,
                                    },
                                    styleMeta.border && {
                                      borderWidth: 1,
                                      borderColor: styleMeta.border,
                                    },
                                  ]}
                                >
                                  <Text
                                    style={[styles.scoreBadgeText, { color: styleMeta.text }]}
                                  >
                                    {displayScore > 0 ? displayScore : '-'}
                                  </Text>
                                  {strokesReceived > 0 && modalScoreType === 'net' && (
                                    <View style={styles.advantageDotIndicator} />
                                  )}
                                </View>
                              </View>
                            );
                          })}
                        </View>
                      ))}

                      {/* Totals Row: IDA (1-9) */}
                      <View style={styles.tableTotalRow}>
                        <Text style={[styles.tdCell, styles.cellHole, styles.totalLabel]}>
                          IDA
                        </Text>
                        <Text style={[styles.tdCell, styles.cellPar, styles.totalLabel]}>
                          {selectedRound.holes?.slice(0, 9).reduce((acc, i) => acc + i.par, 0)}
                        </Text>
                        <Text style={[styles.tdCell, styles.cellHcp, styles.totalLabel]}>-</Text>
                        {selectedRound.players?.map((p) => (
                          <Text key={p.id} style={[styles.tdCell, styles.cellPlayer, styles.totalValue]}>
                            {getSubtotal(selectedRound, p.id, 'out', modalScoreType)}
                          </Text>
                        ))}
                      </View>

                      {/* Totals Row: VTA (10-18) */}
                      <View style={styles.tableTotalRow}>
                        <Text style={[styles.tdCell, styles.cellHole, styles.totalLabel]}>
                          VTA
                        </Text>
                        <Text style={[styles.tdCell, styles.cellPar, styles.totalLabel]}>
                          {selectedRound.holes?.slice(9, 18).reduce((acc, i) => acc + i.par, 0)}
                        </Text>
                        <Text style={[styles.tdCell, styles.cellHcp, styles.totalLabel]}>-</Text>
                        {selectedRound.players?.map((p) => (
                          <Text key={p.id} style={[styles.tdCell, styles.cellPlayer, styles.totalValue]}>
                            {getSubtotal(selectedRound, p.id, 'in', modalScoreType)}
                          </Text>
                        ))}
                      </View>

                      {/* Totals Row: FULL 18 */}
                      <View style={[styles.tableTotalRow, styles.finalTotalRow]}>
                        <Text style={[styles.tdCell, styles.cellHole, styles.finalTotalLabel]}>
                          TOTAL
                        </Text>
                        <Text style={[styles.tdCell, styles.cellPar, styles.finalTotalLabel]}>
                          {selectedRound.parTotal || 72}
                        </Text>
                        <Text style={[styles.tdCell, styles.cellHcp, styles.finalTotalLabel]}>-</Text>
                        {selectedRound.players?.map((p) => (
                          <Text key={p.id} style={[styles.tdCell, styles.cellPlayer, styles.finalTotalValue]}>
                            {getSubtotal(selectedRound, p.id, 'all', modalScoreType)}
                          </Text>
                        ))}
                      </View>
                    </View>
                  </ScrollView>
                </View>
              </ScrollView>

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setSelectedRound(null)}
              >
                <Text style={styles.modalCloseBtnText}>Cerrar Tarjeta & Detalle</Text>
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
  emptyCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.md,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginTop: SPACING.sm,
  },
  emptySub: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: SPACING.xs,
    lineHeight: 18,
  },
  emptyCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    marginTop: SPACING.md,
  },
  emptyCTAText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    marginRight: 6,
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
  formatBadgePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  formatBadgeText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
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
  summaryTextQuote: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 8,
    fontStyle: 'italic',
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
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.md,
    maxHeight: '92%',
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
    fontSize: 15,
    fontWeight: '700',
  },
  payoutCard: {
    backgroundColor: COLORS.bgSubtle,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.xs,
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
    flexWrap: 'wrap',
    flex: 1,
  },
  payoutName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    marginLeft: 8,
  },
  scoreSummarySub: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginLeft: 6,
  },
  payoutAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  wagersSummaryCard: {
    backgroundColor: COLORS.bgSubtle,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  wagerSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  wagerNameText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  wagerWinnerBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wagerWinnerText: {
    color: COLORS.accentGold,
    fontSize: 12,
    fontWeight: '700',
  },
  wagerAmountText: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginLeft: 4,
  },
  scorecardSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  modalTypeSwitch: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgSubtle,
    borderRadius: RADIUS.full,
    padding: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalTypeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  modalTypeBtnActive: {
    backgroundColor: COLORS.primary,
  },
  modalTypeBtnText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  modalTypeBtnTextActive: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  historicalTableCard: {
    backgroundColor: COLORS.bgSubtle,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgDark,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border,
  },
  thCell: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  tableBodyRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  tableRowAlt: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  tdCell: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellHole: {
    width: 44,
    textAlign: 'center',
  },
  cellPar: {
    width: 40,
    textAlign: 'center',
  },
  cellHcp: {
    width: 44,
    textAlign: 'center',
  },
  cellPlayer: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  holeNumText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  parText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  hcpText: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  scoreBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  scoreBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  advantageDotIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.accentGold,
  },
  tableTotalRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  finalTotalRow: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderBottomWidth: 0,
  },
  totalLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '800',
  },
  totalValue: {
    color: COLORS.accentGold,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  finalTotalLabel: {
    color: COLORS.primaryLight,
    fontSize: 12,
    fontWeight: '900',
  },
  finalTotalValue: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
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
