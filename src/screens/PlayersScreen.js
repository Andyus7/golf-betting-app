import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../theme/theme';
import { MOCK_PLAYERS } from '../data/mockData';

export default function PlayersScreen() {
  const [slope, setSlope] = useState(130);
  const [courseRating, setCourseRating] = useState(71.5);
  const [par, setPar] = useState(72);
  const [selectedTee, setSelectedTee] = useState('Azul');

  // Calculate Course Handicap based on USGA formula
  const calculateCourseHandicap = (handicapIndex) => {
    const raw = handicapIndex * (slope / 113) + (courseRating - par);
    return Math.round(raw);
  };

  const handleTeeSelect = (teeName, slopeVal, ratingVal) => {
    setSelectedTee(teeName);
    setSlope(slopeVal);
    setCourseRating(ratingVal);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Jugadores & Handicap</Text>
          <Text style={styles.headerSubtitle}>Índice Oficial, Course Handicap & Histórico</Text>
        </View>

        {/* Interactive Course Handicap Calculator Helper */}
        <View style={styles.calcCard}>
          <View style={styles.calcCardHeader}>
            <View style={styles.calcTitleRow}>
              <FontAwesome5 name="calculator" size={16} color={COLORS.accentGold} />
              <Text style={styles.calcTitle}>Calculadora de Course Handicap</Text>
            </View>
            <Text style={styles.calcFormula}>HI × (Slope / 113) + (Rating - Par)</Text>
          </View>

          <Text style={styles.calcSubtext}>Selecciona Marcas de Salida (Tees) del Campo:</Text>

          <View style={styles.teesRow}>
            <TouchableOpacity
              style={[styles.teeChip, selectedTee === 'Negras' && styles.teeChipSelected]}
              onPress={() => handleTeeSelect('Negras', 138, 73.2)}
            >
              <View style={[styles.teeDot, { backgroundColor: '#000' }]} />
              <Text style={styles.teeText}>Negras (Slope 138)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.teeChip, selectedTee === 'Azul' && styles.teeChipSelected]}
              onPress={() => handleTeeSelect('Azul', 130, 71.5)}
            >
              <View style={[styles.teeDot, { backgroundColor: COLORS.accentBlue }]} />
              <Text style={styles.teeText}>Azul (Slope 130)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.teeChip, selectedTee === 'Blancas' && styles.teeChipSelected]}
              onPress={() => handleTeeSelect('Blancas', 122, 69.8)}
            >
              <View style={[styles.teeDot, { backgroundColor: '#FFF' }]} />
              <Text style={styles.teeText}>Blancas (Slope 122)</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.calcValuesRow}>
            <View style={styles.calcValueItem}>
              <Text style={styles.calcValueLabel}>Slope Rating</Text>
              <Text style={styles.calcValueNum}>{slope}</Text>
            </View>
            <View style={styles.calcValueItem}>
              <Text style={styles.calcValueLabel}>Course Rating</Text>
              <Text style={styles.calcValueNum}>{courseRating}</Text>
            </View>
            <View style={styles.calcValueItem}>
              <Text style={styles.calcValueLabel}>Par Campo</Text>
              <Text style={styles.calcValueNum}>{par}</Text>
            </View>
          </View>
        </View>

        {/* Players List */}
        <Text style={styles.sectionTitle}>Lista de Jugadores del Grupo</Text>

        {MOCK_PLAYERS.map((player) => {
          const courseHcpCalculated = calculateCourseHandicap(player.handicapIndex);

          return (
            <View key={player.id} style={styles.playerCard}>
              <View style={styles.playerCardHeader}>
                <View style={styles.playerAvatarContainer}>
                  <Text style={styles.playerAvatar}>{player.avatar}</Text>
                </View>

                <View style={styles.playerMainInfo}>
                  <Text style={styles.playerName}>{player.name}</Text>
                  <Text style={styles.playerBestRound}>Mejor Ronda Registrada: {player.bestRound} golpes</Text>
                </View>

                <View style={styles.hcpBadge}>
                  <Text style={styles.hcpBadgeLabel}>HCP INDEX</Text>
                  <Text style={styles.hcpBadgeValue}>{player.handicapIndex}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Handicap & Financial Breakdown Grid */}
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Course HCP ({selectedTee})</Text>
                  <Text style={styles.statValueHighlight}>{courseHcpCalculated} Golpes</Text>
                </View>

                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Partidas Jugadas</Text>
                  <Text style={styles.statValue}>{player.roundsPlayed} Rondas</Text>
                </View>

                <View style={styles.statBoxRight}>
                  <Text style={styles.statLabel}>Balance Histórico</Text>
                  <Text
                    style={[
                      styles.balanceValue,
                      { color: player.historicalBalance >= 0 ? COLORS.positiveMoney : COLORS.negativeMoney },
                    ]}
                  >
                    {player.historicalBalance >= 0
                      ? `+$${player.historicalBalance}`
                      : `-$${Math.abs(player.historicalBalance)}`}{' '}
                    MXN
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
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
  calcCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
  },
  calcCardHeader: {
    marginBottom: SPACING.xs,
  },
  calcTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calcTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  calcFormula: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  calcSubtext: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  teesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  teeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgSubtle,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  teeChipSelected: {
    borderColor: COLORS.accentGold,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  teeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  teeText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  calcValuesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.bgSubtle,
    borderRadius: RADIUS.md,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  calcValueItem: {
    alignItems: 'center',
  },
  calcValueLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  calcValueNum: {
    color: COLORS.accentGold,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: SPACING.md,
  },
  playerCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  playerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerAvatarContainer: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  playerAvatar: {
    fontSize: 24,
  },
  playerMainInfo: {
    flex: 1,
  },
  playerName: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  playerBestRound: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  hcpBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  hcpBadgeLabel: {
    color: COLORS.primaryLight,
    fontSize: 9,
    fontWeight: '800',
  },
  hcpBadgeValue: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    flex: 1,
  },
  statBoxRight: {
    alignItems: 'flex-end',
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  statValue: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  statValueHighlight: {
    color: COLORS.accentGold,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  balanceValue: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
});
