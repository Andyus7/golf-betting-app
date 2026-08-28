import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../theme/theme';
import { HOLES_DATA, MOCK_ACTIVE_ROUND, MOCK_PLAYERS } from '../data/mockData';

export default function ScorecardScreen() {
  const [viewMode, setViewMode] = useState('all'); // 'out', 'in', 'all'
  const [scoreType, setScoreType] = useState('gross'); // 'gross', 'net'

  const holesToDisplay =
    viewMode === 'out'
      ? HOLES_DATA.slice(0, 9)
      : viewMode === 'in'
      ? HOLES_DATA.slice(9, 18)
      : HOLES_DATA;

  // Helper function to calculate net score based on stroke index & course handicap
  const getNetScore = (gross, holeHcp, playerCourseHcp) => {
    let strokesReceived = Math.floor(playerCourseHcp / 18);
    const remainder = playerCourseHcp % 18;
    if (holeHcp <= remainder) {
      strokesReceived += 1;
    }
    return Math.max(1, gross - strokesReceived);
  };

  // Helper for score badge color
  const getScoreStyle = (score, par) => {
    const diff = score - par;
    if (diff <= -2) return { bg: COLORS.eagleGold, text: '#000', label: 'Eagle+' };
    if (diff === -1) return { bg: COLORS.birdieGreen, text: '#FFF', label: 'Birdie' };
    if (diff === 0) return { bg: 'transparent', border: COLORS.border, text: COLORS.textPrimary, label: 'Par' };
    if (diff === 1) return { bg: COLORS.bogeyOrange, text: '#000', label: 'Bogey' };
    return { bg: COLORS.doubleRed, text: '#FFF', label: 'Double+' };
  };

  // Calculate totals
  const calculateTotals = (playerId, range) => {
    const targetHoles =
      range === 'out'
        ? HOLES_DATA.slice(0, 9)
        : range === 'in'
        ? HOLES_DATA.slice(9, 18)
        : HOLES_DATA;

    const player = MOCK_PLAYERS.find((p) => p.id === playerId);
    let grossTotal = 0;
    let netTotal = 0;
    let parTotal = 0;

    targetHoles.forEach((h) => {
      const g = h.scores[playerId];
      const n = getNetScore(g, h.hcp, player.courseHandicap);
      grossTotal += g;
      netTotal += n;
      parTotal += h.par;
    });

    return { grossTotal, netTotal, parTotal };
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tarjeta de Golf</Text>
          <Text style={styles.headerSubtitle}>{MOCK_ACTIVE_ROUND.courseName}</Text>
        </View>

        {/* Course Info Badge */}
        <View style={styles.courseInfoCard}>
          <View style={styles.courseInfoCol}>
            <Text style={styles.infoLabel}>PAR TOTAL</Text>
            <Text style={styles.infoValue}>{MOCK_ACTIVE_ROUND.parTotal}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.courseInfoCol}>
            <Text style={styles.infoLabel}>SLOPE</Text>
            <Text style={styles.infoValue}>{MOCK_ACTIVE_ROUND.slopeRating}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.courseInfoCol}>
            <Text style={styles.infoLabel}>RATING</Text>
            <Text style={styles.infoValue}>{MOCK_ACTIVE_ROUND.courseRating}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.courseInfoCol}>
            <Text style={styles.infoLabel}>ESTADO</Text>
            <Text style={[styles.infoValue, { color: COLORS.primary }]}>Hoyo 12</Text>
          </View>
        </View>

        {/* View Mode Filters */}
        <View style={styles.toggleRow}>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, viewMode === 'all' && styles.tabButtonActive]}
              onPress={() => setViewMode('all')}
            >
              <Text style={[styles.tabText, viewMode === 'all' && styles.tabTextActive]}>18 Hoyos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, viewMode === 'out' && styles.tabButtonActive]}
              onPress={() => setViewMode('out')}
            >
              <Text style={[styles.tabText, viewMode === 'out' && styles.tabTextActive]}>Ida (1-9)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, viewMode === 'in' && styles.tabButtonActive]}
              onPress={() => setViewMode('in')}
            >
              <Text style={[styles.tabText, viewMode === 'in' && styles.tabTextActive]}>Vuelta (10-18)</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Score Type Switch (Gross vs Net) */}
        <View style={styles.scoreTypeRow}>
          <Text style={styles.scoreTypeLabel}>Mostrar Puntuación:</Text>
          <View style={styles.scoreTypeToggle}>
            <TouchableOpacity
              style={[styles.scoreTypeBtn, scoreType === 'gross' && styles.scoreTypeBtnActive]}
              onPress={() => setScoreType('gross')}
            >
              <Text style={[styles.scoreTypeBtnText, scoreType === 'gross' && styles.scoreTypeBtnTextActive]}>
                Brutos (Gross)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.scoreTypeBtn, scoreType === 'net' && styles.scoreTypeBtnActive]}
              onPress={() => setScoreType('net')}
            >
              <Text style={[styles.scoreTypeBtnText, scoreType === 'net' && styles.scoreTypeBtnTextActive]}>
                Netos (Net)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Player Summary Header Badges */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.playersScroll}>
          {MOCK_PLAYERS.map((p) => {
            const totals = calculateTotals(p.id, 'all');
            const grossDiff = totals.grossTotal - totals.parTotal;
            const netDiff = totals.netTotal - totals.parTotal;

            return (
              <View key={p.id} style={[styles.playerHeaderCard, { borderTopColor: p.badgeColor }]}>
                <Text style={styles.playerHeaderAvatar}>{p.avatar}</Text>
                <Text style={styles.playerHeaderName}>{p.shortName}</Text>
                <Text style={styles.playerHeaderHcp}>HCP: {p.courseHandicap}</Text>
                <View style={styles.playerHeaderScores}>
                  <Text style={styles.grossText}>Bruto: {totals.grossTotal} ({grossDiff >= 0 ? `+${grossDiff}` : grossDiff})</Text>
                  <Text style={styles.netText}>Neto: {totals.netTotal} ({netDiff >= 0 ? `+${netDiff}` : netDiff})</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Scorecard Table */}
        <View style={styles.tableContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View>
              {/* Table Header Row */}
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.thCell, styles.cellHole]}>Hoyo</Text>
                <Text style={[styles.thCell, styles.cellPar]}>Par</Text>
                <Text style={[styles.thCell, styles.cellHcp]}>HCP</Text>
                {MOCK_PLAYERS.map((p) => (
                  <Text key={p.id} style={[styles.thCell, styles.cellPlayer]}>
                    {p.shortName}
                  </Text>
                ))}
              </View>

              {/* Table Hole Rows */}
              {holesToDisplay.map((h, idx) => (
                <View
                  key={h.hole}
                  style={[
                    styles.tableBodyRow,
                    idx % 2 === 1 && styles.tableRowAlt,
                    h.hole === MOCK_ACTIVE_ROUND.currentHole && styles.currentHoleHighlight,
                  ]}
                >
                  <Text style={[styles.tdCell, styles.cellHole, styles.holeNumText]}>
                    {h.hole}
                  </Text>
                  <Text style={[styles.tdCell, styles.cellPar, styles.parText]}>{h.par}</Text>
                  <Text style={[styles.tdCell, styles.cellHcp, styles.hcpText]}>{h.hcp}</Text>

                  {MOCK_PLAYERS.map((p) => {
                    const grossScore = h.scores[p.id];
                    const netScore = getNetScore(grossScore, h.hcp, p.courseHandicap);
                    const displayScore = scoreType === 'gross' ? grossScore : netScore;
                    const styleMeta = getScoreStyle(displayScore, h.par);

                    return (
                      <View key={p.id} style={[styles.tdCell, styles.cellPlayer]}>
                        <View
                          style={[
                            styles.scoreBadge,
                            styleMeta.bg !== 'transparent' && { backgroundColor: styleMeta.bg },
                            styleMeta.border && { borderWidth: 1, borderColor: styleMeta.border },
                          ]}
                        >
                          <Text style={[styles.scoreBadgeText, { color: styleMeta.text }]}>
                            {displayScore}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ))}

              {/* Totals Row: Out (1-9) */}
              {(viewMode === 'all' || viewMode === 'out') && (
                <View style={styles.tableTotalRow}>
                  <Text style={[styles.tdCell, styles.cellHole, styles.totalLabel]}>IDA</Text>
                  <Text style={[styles.tdCell, styles.cellPar, styles.totalLabel]}>
                    {calculateTotals('p1', 'out').parTotal}
                  </Text>
                  <Text style={[styles.tdCell, styles.cellHcp, styles.totalLabel]}>-</Text>
                  {MOCK_PLAYERS.map((p) => {
                    const t = calculateTotals(p.id, 'out');
                    return (
                      <Text key={p.id} style={[styles.tdCell, styles.cellPlayer, styles.totalValue]}>
                        {scoreType === 'gross' ? t.grossTotal : t.netTotal}
                      </Text>
                    );
                  })}
                </View>
              )}

              {/* Totals Row: In (10-18) */}
              {(viewMode === 'all' || viewMode === 'in') && (
                <View style={styles.tableTotalRow}>
                  <Text style={[styles.tdCell, styles.cellHole, styles.totalLabel]}>VTA</Text>
                  <Text style={[styles.tdCell, styles.cellPar, styles.totalLabel]}>
                    {calculateTotals('p1', 'in').parTotal}
                  </Text>
                  <Text style={[styles.tdCell, styles.cellHcp, styles.totalLabel]}>-</Text>
                  {MOCK_PLAYERS.map((p) => {
                    const t = calculateTotals(p.id, 'in');
                    return (
                      <Text key={p.id} style={[styles.tdCell, styles.cellPlayer, styles.totalValue]}>
                        {scoreType === 'gross' ? t.grossTotal : t.netTotal}
                      </Text>
                    );
                  })}
                </View>
              )}

              {/* Totals Row: Full 18 */}
              {viewMode === 'all' && (
                <View style={[styles.tableTotalRow, styles.finalTotalRow]}>
                  <Text style={[styles.tdCell, styles.cellHole, styles.finalTotalLabel]}>TOTAL</Text>
                  <Text style={[styles.tdCell, styles.cellPar, styles.finalTotalLabel]}>72</Text>
                  <Text style={[styles.tdCell, styles.cellHcp, styles.finalTotalLabel]}>-</Text>
                  {MOCK_PLAYERS.map((p) => {
                    const t = calculateTotals(p.id, 'all');
                    return (
                      <Text key={p.id} style={[styles.tdCell, styles.cellPlayer, styles.finalTotalValue]}>
                        {scoreType === 'gross' ? t.grossTotal : t.netTotal}
                      </Text>
                    );
                  })}
                </View>
              )}
            </View>
          </ScrollView>
        </View>

        {/* Score Legend */}
        <View style={styles.legendContainer}>
          <Text style={styles.legendTitle}>Simbología de Golpes:</Text>
          <View style={styles.legendGrid}>
            <View style={styles.legendItem}>
              <View style={[styles.scoreBadge, { backgroundColor: COLORS.eagleGold, width: 22, height: 22 }]}>
                <Text style={{ color: '#000', fontSize: 10, fontWeight: '700' }}>-2</Text>
              </View>
              <Text style={styles.legendText}>Eagle/Mejor</Text>
            </View>

            <View style={styles.legendItem}>
              <View style={[styles.scoreBadge, { backgroundColor: COLORS.birdieGreen, width: 22, height: 22 }]}>
                <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '700' }}>-1</Text>
              </View>
              <Text style={styles.legendText}>Birdie</Text>
            </View>

            <View style={styles.legendItem}>
              <View style={[styles.scoreBadge, { borderWidth: 1, borderColor: COLORS.border, width: 22, height: 22 }]}>
                <Text style={{ color: COLORS.textPrimary, fontSize: 10, fontWeight: '700' }}>E</Text>
              </View>
              <Text style={styles.legendText}>Par</Text>
            </View>

            <View style={styles.legendItem}>
              <View style={[styles.scoreBadge, { backgroundColor: COLORS.bogeyOrange, width: 22, height: 22 }]}>
                <Text style={{ color: '#000', fontSize: 10, fontWeight: '700' }}>+1</Text>
              </View>
              <Text style={styles.legendText}>Bogey</Text>
            </View>

            <View style={styles.legendItem}>
              <View style={[styles.scoreBadge, { backgroundColor: COLORS.doubleRed, width: 22, height: 22 }]}>
                <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '700' }}>+2</Text>
              </View>
              <Text style={styles.legendText}>Double+</Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
  courseInfoCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  courseInfoCol: {
    alignItems: 'center',
  },
  infoLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  infoValue: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  infoDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
  },
  toggleRow: {
    marginBottom: SPACING.md,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgSubtle,
    borderRadius: RADIUS.md,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: RADIUS.sm,
  },
  tabButtonActive: {
    backgroundColor: COLORS.primaryDark,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  scoreTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  scoreTypeLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  scoreTypeToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.full,
    padding: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  scoreTypeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  scoreTypeBtnActive: {
    backgroundColor: COLORS.primary,
  },
  scoreTypeBtnText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  scoreTypeBtnTextActive: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  playersScroll: {
    marginBottom: SPACING.md,
  },
  playerHeaderCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginRight: SPACING.sm,
    borderTopWidth: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 110,
    alignItems: 'center',
  },
  playerHeaderAvatar: {
    fontSize: 20,
  },
  playerHeaderName: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  playerHeaderHcp: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  playerHeaderScores: {
    marginTop: 4,
    alignItems: 'center',
  },
  grossText: {
    color: COLORS.accentGold,
    fontSize: 11,
    fontWeight: '700',
  },
  netText: {
    color: COLORS.primaryLight,
    fontSize: 11,
    fontWeight: '700',
  },
  tableContainer: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgSubtle,
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
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  tableRowAlt: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  currentHoleHighlight: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
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
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  tableTotalRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: 10,
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
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  finalTotalLabel: {
    color: COLORS.primaryLight,
    fontSize: 13,
    fontWeight: '900',
  },
  finalTotalValue: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  legendContainer: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  legendTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginVertical: 4,
  },
  legendText: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginLeft: 6,
  },
});
