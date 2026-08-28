import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { FontAwesome5, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../theme/theme';
import { DOTS_DEFINITION, MOCK_DOTS_LOG, MOCK_PLAYERS, WAGER_MODES } from '../data/mockData';

export default function WagersScreen() {
  const [selectedMode, setSelectedMode] = useState('nassau');
  const [selectedPlayer, setSelectedPlayer] = useState('p1');
  const [dotsLog, setDotsLog] = useState(MOCK_DOTS_LOG);

  const currentModeInfo = WAGER_MODES.find((m) => m.id === selectedMode) || WAGER_MODES[0];

  // Quick tap handler to add a dot to selected player
  const handleAddDot = (dot) => {
    const playerObj = MOCK_PLAYERS.find((p) => p.id === selectedPlayer);
    const newEntry = {
      id: `dot_${Date.now()}`,
      hole: 12,
      player: playerObj.shortName,
      dot: dot.name,
      points: dot.value,
      icon: dot.icon,
    };
    setDotsLog([newEntry, ...dotsLog]);
  };

  // Calculate live dots balance per player
  const calculateDotsBalance = (playerShortName) => {
    return dotsLog
      .filter((d) => d.player === playerShortName)
      .reduce((sum, item) => sum + item.points, 0);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Apuestas & Dots</Text>
          <Text style={styles.headerSubtitle}>Modalidades de Juego & Panel de Puntos</Text>
        </View>

        {/* Wager Modes Selector Carousel */}
        <Text style={styles.sectionTitle}>Seleccionar Modalidad de Juego</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modesScroll}>
          {WAGER_MODES.map((mode) => {
            const isSelected = mode.id === selectedMode;
            return (
              <TouchableOpacity
                key={mode.id}
                style={[
                  styles.modeChip,
                  isSelected && styles.modeChipSelected,
                ]}
                onPress={() => setSelectedMode(mode.id)}
              >
                <Text style={[styles.modeChipName, isSelected && styles.modeChipNameSelected]}>
                  {mode.name}
                </Text>
                <View style={[styles.badgeTag, isSelected && { backgroundColor: COLORS.primaryDark }]}>
                  <Text style={styles.badgeTagText}>{mode.badge}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Selected Mode Detail Card */}
        <View style={styles.modeDetailCard}>
          <View style={styles.modeCardHeader}>
            <View style={styles.modeTitleRow}>
              <View style={styles.modeIconBg}>
                <FontAwesome5 name="golf-ball" size={18} color={COLORS.accentGold} />
              </View>
              <View>
                <Text style={styles.modeDetailName}>{currentModeInfo.name}</Text>
                <Text style={styles.modeDetailBadge}>{currentModeInfo.badge}</Text>
              </View>
            </View>
            <View style={styles.potTag}>
              <Text style={styles.potTagLabel}>POZO</Text>
              <Text style={styles.potTagValue}>{currentModeInfo.pot}</Text>
            </View>
          </View>

          <Text style={styles.modeDescription}>{currentModeInfo.description}</Text>

          <View style={styles.modeFooterRow}>
            <View style={styles.leaderBox}>
              <Text style={styles.leaderBoxLabel}>Líder Actual:</Text>
              <Text style={styles.leaderBoxValue}>{currentModeInfo.currentLeader}</Text>
            </View>
            <TouchableOpacity style={styles.pressBtn}>
              <Text style={styles.pressBtnText}>⚡ Auto-Press On</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dots & Trash Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Botonera Rápida: Dots & Trash</Text>
          <Text style={styles.sectionSubtitle}>Puntuaciones de hoyo</Text>
        </View>

        {/* Player Selector for Dots */}
        <Text style={styles.subLabel}>Selecciona el jugador a asignar punto/castigo:</Text>
        <View style={styles.playerSelectorRow}>
          {MOCK_PLAYERS.map((p) => {
            const isSel = p.id === selectedPlayer;
            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.playerTab, isSel && styles.playerTabSelected]}
                onPress={() => setSelectedPlayer(p.id)}
              >
                <Text style={styles.playerTabAvatar}>{p.avatar}</Text>
                <Text style={[styles.playerTabText, isSel && styles.playerTabTextSelected]}>
                  {p.shortName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Dots Quick Button Grid */}
        <View style={styles.dotsGrid}>
          {DOTS_DEFINITION.map((dot) => (
            <TouchableOpacity
              key={dot.id}
              style={[
                styles.dotButton,
                { borderColor: dot.color },
              ]}
              activeOpacity={0.8}
              onPress={() => handleAddDot(dot)}
            >
              <Text style={styles.dotIcon}>{dot.icon}</Text>
              <Text style={styles.dotName}>{dot.name}</Text>
              <Text style={[styles.dotValue, { color: dot.value > 0 ? COLORS.positiveMoney : COLORS.negativeMoney }]}>
                {dot.value > 0 ? `+$${dot.value}` : `-$${Math.abs(dot.value)}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Dots Ledger & Balance Summary */}
        <Text style={styles.sectionTitle}>Registro de Dots (Ronda Activa)</Text>
        
        {/* Player Dots Balance Cards */}
        <View style={styles.dotsBalanceRow}>
          {MOCK_PLAYERS.map((p) => {
            const bal = calculateDotsBalance(p.shortName);
            return (
              <View key={p.id} style={styles.dotsBalanceCard}>
                <Text style={styles.dotsAvatar}>{p.avatar}</Text>
                <Text style={styles.dotsPlayerName}>{p.shortName}</Text>
                <Text
                  style={[
                    styles.dotsBalanceText,
                    { color: bal >= 0 ? COLORS.positiveMoney : COLORS.negativeMoney },
                  ]}
                >
                  {bal >= 0 ? `+$${bal}` : `-$${Math.abs(bal)}`}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Live Dots Feed */}
        <View style={styles.feedCard}>
          <Text style={styles.feedHeader}>Eventos Recientes de Dots</Text>
          {dotsLog.slice(0, 6).map((item) => (
            <View key={item.id} style={styles.feedRow}>
              <View style={styles.feedLeft}>
                <Text style={styles.feedIcon}>{item.icon}</Text>
                <View>
                  <Text style={styles.feedText}>
                    <Text style={styles.feedPlayer}>{item.player}</Text> cobró <Text style={styles.feedDot}>{item.dot}</Text>
                  </Text>
                  <Text style={styles.feedHole}>Hoyo #{item.hole}</Text>
                </View>
              </View>
              <Text
                style={[
                  styles.feedPoints,
                  { color: item.points >= 0 ? COLORS.positiveMoney : COLORS.negativeMoney },
                ]}
              >
                {item.points >= 0 ? `+$${item.points}` : `-$${Math.abs(item.points)}`}
              </Text>
            </View>
          ))}
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
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  sectionSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  subLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: SPACING.xs,
  },
  modesScroll: {
    marginBottom: SPACING.sm,
  },
  modeChip: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  modeChipSelected: {
    borderColor: COLORS.accentGold,
    backgroundColor: COLORS.bgSubtle,
  },
  modeChipName: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  modeChipNameSelected: {
    color: COLORS.accentGold,
  },
  badgeTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    marginTop: 4,
  },
  badgeTagText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  modeDetailCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
  },
  modeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  modeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeIconBg: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  modeDetailName: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  modeDetailBadge: {
    color: COLORS.accentGold,
    fontSize: 11,
    fontWeight: '600',
  },
  potTag: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  potTagLabel: {
    color: COLORS.primaryLight,
    fontSize: 9,
    fontWeight: '800',
  },
  potTagValue: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  modeDescription: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginVertical: SPACING.xs,
  },
  modeFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  leaderBox: {
    flex: 1,
  },
  leaderBoxLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  leaderBoxValue: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  pressBtn: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  pressBtnText: {
    color: COLORS.accentPurple,
    fontSize: 11,
    fontWeight: '700',
  },
  playerSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  playerTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    paddingVertical: 8,
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  playerTabSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.bgSubtle,
  },
  playerTabAvatar: {
    fontSize: 14,
    marginRight: 4,
  },
  playerTabText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  playerTabTextSelected: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  dotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  dotButton: {
    width: '48%',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dotIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  dotName: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  dotValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  dotsBalanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  dotsBalanceCard: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.xs,
    marginHorizontal: 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dotsAvatar: {
    fontSize: 16,
  },
  dotsPlayerName: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  dotsBalanceText: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  feedCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  feedHeader: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  feedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  feedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  feedText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  feedPlayer: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  feedDot: {
    color: COLORS.accentGold,
    fontWeight: '700',
  },
  feedHole: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  feedPoints: {
    fontSize: 13,
    fontWeight: '800',
  },
});
