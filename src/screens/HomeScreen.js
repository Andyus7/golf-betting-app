import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../theme/theme';
import { MOCK_ACTIVE_ROUND, MOCK_PLAYERS, MOCK_HISTORY_ROUNDS } from '../data/mockData';

export default function HomeScreen({ navigation }) {
  const activeRound = MOCK_ACTIVE_ROUND;
  const recentRound = MOCK_HISTORY_ROUNDS[0];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgDark} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Bar */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>¡Hola, Golfista! ⛳</Text>
            <Text style={styles.appTitle}>GolfWager Pro</Text>
          </View>
          <TouchableOpacity style={styles.avatarButton}>
            <Text style={styles.avatarText}>AG</Text>
          </TouchableOpacity>
        </View>

        {/* Active Round Card Banner */}
        <TouchableOpacity
          style={styles.activeRoundCard}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('Tarjeta')}
        >
          <View style={styles.activeHeader}>
            <View style={styles.liveBadge}>
              <View style={styles.livePulse} />
              <Text style={styles.liveBadgeText}>RONDA EN VIVO</Text>
            </View>
            <Text style={styles.activeHoleText}>Hoyo {activeRound.currentHole} / 18</Text>
          </View>

          <Text style={styles.courseName}>{activeRound.courseName}</Text>
          <Text style={styles.roundMeta}>
            Par {activeRound.parTotal} • Slope {activeRound.slopeRating} • {activeRound.date}
          </Text>

          <View style={styles.divider} />

          <View style={styles.activeStatsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Líder Actual</Text>
              <Text style={styles.statValue}>{activeRound.leaderName}</Text>
            </View>
            <View style={styles.statBoxRight}>
              <Text style={styles.statLabel}>Pozo en Juego</Text>
              <Text style={styles.potValue}>${activeRound.totalPot.toLocaleString()} MXN</Text>
            </View>
          </View>

          <View style={styles.cardFooterBtn}>
            <Text style={styles.cardFooterText}>Abrir Tarjeta de Golpes</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
          </View>
        </TouchableOpacity>

        {/* Quick Access Shortcuts Grid */}
        <Text style={styles.sectionTitle}>Acceso Rápido</Text>
        <View style={styles.gridContainer}>
          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={() => navigation.navigate('Tarjeta')}
          >
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Ionicons name="clipboard" size={26} color={COLORS.primary} />
            </View>
            <Text style={styles.shortcutTitle}>Scorecard</Text>
            <Text style={styles.shortcutDesc}>18 Hoyos Gross/Net</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={() => navigation.navigate('Apuestas')}
          >
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <FontAwesome5 name="coins" size={22} color={COLORS.accentGold} />
            </View>
            <Text style={styles.shortcutTitle}>Apuestas & Dots</Text>
            <Text style={styles.shortcutDesc}>Nassau, Skins, Trash</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={() => navigation.navigate('Historial')}
          >
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
              <MaterialCommunityIcons name="history" size={26} color={COLORS.accentBlue} />
            </View>
            <Text style={styles.shortcutTitle}>Historial</Text>
            <Text style={styles.shortcutDesc}>Rondas anteriores</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={() => navigation.navigate('Jugadores')}
          >
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
              <FontAwesome5 name="users" size={22} color={COLORS.accentPurple} />
            </View>
            <Text style={styles.shortcutTitle}>Handicaps</Text>
            <Text style={styles.shortcutDesc}>Calculadora & Lista</Text>
          </TouchableOpacity>
        </View>

        {/* Weekly Wager Balance Summary */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Balance Semanal del Grupo</Text>
          <Text style={styles.sectionSubtitle}>Últimos 30 días</Text>
        </View>

        <View style={styles.balanceCard}>
          {MOCK_PLAYERS.map((player) => (
            <View key={player.id} style={styles.playerBalanceRow}>
              <View style={styles.playerInfoLeft}>
                <Text style={styles.playerAvatar}>{player.avatar}</Text>
                <View>
                  <Text style={styles.playerName}>{player.shortName}</Text>
                  <Text style={styles.playerHcpTag}>HCP {player.handicapIndex}</Text>
                </View>
              </View>
              <Text
                style={[
                  styles.balanceAmount,
                  { color: player.historicalBalance >= 0 ? COLORS.positiveMoney : COLORS.negativeMoney },
                ]}
              >
                {player.historicalBalance >= 0 ? `+$${player.historicalBalance}` : `-$${Math.abs(player.historicalBalance)}`}{' '}
                MXN
              </Text>
            </View>
          ))}
        </View>

        {/* Last Game Highlights Card */}
        <Text style={styles.sectionTitle}>Última Ronda Finalizada</Text>
        <TouchableOpacity
          style={styles.historyCard}
          onPress={() => navigation.navigate('Historial')}
        >
          <View style={styles.historyCardHeader}>
            <View>
              <Text style={styles.historyCourse}>{recentRound.courseName}</Text>
              <Text style={styles.historyDate}>{recentRound.date}</Text>
            </View>
            <View style={styles.winnerBadge}>
              <Text style={styles.winnerBadgeText}>🏆 {recentRound.winnerName.split(' ')[0]}</Text>
            </View>
          </View>
          <Text style={styles.historySummary}>{recentRound.summaryText}</Text>
        </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    marginTop: SPACING.xs,
  },
  greeting: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  appTitle: {
    color: COLORS.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  avatarText: {
    color: COLORS.textPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
  activeRoundCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
    ...SHADOWS.large,
  },
  activeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  livePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginRight: 6,
  },
  liveBadgeText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  activeHoleText: {
    color: COLORS.accentGold,
    fontWeight: '700',
    fontSize: 13,
  },
  courseName: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },
  roundMeta: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  activeStatsRow: {
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
    fontSize: 12,
  },
  statValue: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  potValue: {
    color: COLORS.accentGold,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  cardFooterBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.xs,
  },
  cardFooterText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
    marginRight: 4,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: SPACING.md,
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
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  shortcutCard: {
    width: '48%',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  shortcutTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  shortcutDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  balanceCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  playerBalanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  playerInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerAvatar: {
    fontSize: 22,
    marginRight: 10,
  },
  playerName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  playerHcpTag: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  balanceAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  historyCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  historyCourse: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  historyDate: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  winnerBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  winnerBadgeText: {
    color: COLORS.accentGold,
    fontWeight: '700',
    fontSize: 12,
  },
  historySummary: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 8,
    lineHeight: 18,
  },
});
