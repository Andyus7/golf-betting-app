import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../theme/theme';
import { MOCK_PLAYERS, HOLES_DATA, MOCK_ACTIVE_ROUND } from '../data/mockData';
import { addHistoryRound } from '../data/roundStore';

export default function ScorecardScreen({ navigation }) {
  // Navigation tab between live scorecard and round configuration
  const [activeTab, setActiveTab] = useState('scorecard'); // 'scorecard' | 'config'

  // ----------------------------------------------------
  // ROUND & COURSE CONFIGURATION STATE
  // ----------------------------------------------------
  const [format, setFormat] = useState('1vs1'); // '1vs1' | 'group'
  const [handicapMode, setHandicapMode] = useState('differential'); // 'differential' | 'full'

  const [courseConfig, setCourseConfig] = useState({
    name: MOCK_ACTIVE_ROUND.courseName,
    slope: MOCK_ACTIVE_ROUND.slopeRating,
    rating: MOCK_ACTIVE_ROUND.courseRating,
    holes: HOLES_DATA.map((h) => ({ hole: h.hole, par: h.par, hcp: h.hcp })),
  });

  const [players, setPlayers] = useState([
    {
      id: 'p1',
      name: 'Alex "El Draw"',
      shortName: 'Alex',
      avatar: '⛳',
      handicapIndex: 10.2,
      badgeColor: '#10B981',
    },
    {
      id: 'p2',
      name: 'Carlos "Bombardero"',
      shortName: 'Carlos',
      avatar: '🏌️‍♂️',
      handicapIndex: 5.4,
      badgeColor: '#3B82F6',
    },
  ]);

  // Scores state: { [holeNumber]: { [playerId]: grossScore } }
  const [scores, setScores] = useState(() => {
    const initial = {};
    HOLES_DATA.forEach((h) => {
      initial[h.hole] = { ...h.scores };
    });
    return initial;
  });

  // ----------------------------------------------------
  // SCORECARD VIEW & SCORING STATE
  // ----------------------------------------------------
  const [currentHole, setCurrentHole] = useState(1); // 1..18 for agile scoring
  const [viewMode, setViewMode] = useState('all'); // 'all', 'out', 'in'
  const [scoreType, setScoreType] = useState('gross'); // 'gross', 'net'
  const [configHoleTab, setConfigHoleTab] = useState('out'); // 'out' (1-9) | 'in' (10-18) in config screen

  // ----------------------------------------------------
  // HANDICAP & ADVANTAGE STROKES CALCULATIONS
  // ----------------------------------------------------
  // Calculate handicap strokes per player based on selected mode (differential vs full)
  const playerStrokesInfo = useMemo(() => {
    if (players.length === 0) return {};

    const minHcp = Math.min(...players.map((p) => p.handicapIndex || 0));

    const info = {};
    players.forEach((p) => {
      let advantageStrokes = 0;
      if (handicapMode === 'differential') {
        // In 1v1 or differential group mode, lowest HCP receives 0 strokes,
        // and others receive the rounded difference relative to lowest.
        advantageStrokes = Math.max(0, Math.round((p.handicapIndex || 0) - minHcp));
      } else {
        // Full handicap mode
        advantageStrokes = Math.max(0, Math.round(p.handicapIndex || 0));
      }
      info[p.id] = {
        rawHcp: p.handicapIndex || 0,
        advantageStrokes,
        isBasePlayer: advantageStrokes === 0,
      };
    });
    return info;
  }, [players, handicapMode]);

  // Get strokes received by player on a specific hole (based on hole's Stroke Index)
  const getStrokesReceivedOnHole = (playerId, holeIndexHcp) => {
    const pInfo = playerStrokesInfo[playerId];
    if (!pInfo) return 0;
    const totalStrokes = pInfo.advantageStrokes;
    if (totalStrokes <= 0) return 0;

    const baseStrokes = Math.floor(totalStrokes / 18);
    const extraStrokes = totalStrokes % 18;

    let strokes = baseStrokes;
    if (holeIndexHcp <= extraStrokes) {
      strokes += 1;
    }
    return strokes;
  };

  // Helper function to calculate net score based on gross score & strokes received
  const getNetScore = (gross, holeIndexHcp, playerId) => {
    if (!gross || gross <= 0) return 0;
    const strokesReceived = getStrokesReceivedOnHole(playerId, holeIndexHcp);
    return Math.max(1, gross - strokesReceived);
  };

  // Score badge styling helper
  const getScoreStyle = (score, par) => {
    if (!score || score <= 0) {
      return { bg: 'transparent', border: COLORS.border, text: COLORS.textMuted, label: '-' };
    }
    const diff = score - par;
    if (diff <= -2) return { bg: COLORS.eagleGold, text: '#000', label: 'Eagle+' };
    if (diff === -1) return { bg: COLORS.birdieGreen, text: '#FFF', label: 'Birdie' };
    if (diff === 0) return { bg: 'transparent', border: COLORS.border, text: COLORS.textPrimary, label: 'Par' };
    if (diff === 1) return { bg: COLORS.bogeyOrange, text: '#000', label: 'Bogey' };
    return { bg: COLORS.doubleRed, text: '#FFF', label: 'Double+' };
  };

  // Calculate totals for a player across a range of holes
  const calculateTotals = (playerId, range = 'all') => {
    const holesList =
      range === 'out'
        ? courseConfig.holes.slice(0, 9)
        : range === 'in'
        ? courseConfig.holes.slice(9, 18)
        : courseConfig.holes;

    let grossTotal = 0;
    let netTotal = 0;
    let parTotal = 0;
    let parPlayed = 0;
    let holesPlayed = 0;

    holesList.forEach((h) => {
      parTotal += h.par;
      const g = scores[h.hole]?.[playerId];
      if (g && g > 0) {
        grossTotal += g;
        netTotal += getNetScore(g, h.hcp, playerId);
        parPlayed += h.par;
        holesPlayed += 1;
      }
    });

    return { grossTotal, netTotal, parTotal, parPlayed, holesPlayed };
  };

  // Total par for full course
  const totalPar = useMemo(() => {
    return courseConfig.holes.reduce((sum, h) => sum + h.par, 0);
  }, [courseConfig.holes]);

  // Displayed holes according to tab filter
  const holesToDisplay = useMemo(() => {
    if (viewMode === 'out') return courseConfig.holes.slice(0, 9);
    if (viewMode === 'in') return courseConfig.holes.slice(9, 18);
    return courseConfig.holes;
  }, [courseConfig.holes, viewMode]);

  // ----------------------------------------------------
  // SCORE UPDATING FUNCTIONS
  // ----------------------------------------------------
  const handleScoreChange = (playerId, holeNum, delta) => {
    setScores((prev) => {
      const currentHoleScores = prev[holeNum] || {};
      const currentScore = currentHoleScores[playerId] || courseConfig.holes.find((h) => h.hole === holeNum)?.par || 4;
      const newScore = Math.max(1, Math.min(15, currentScore + delta));
      return {
        ...prev,
        [holeNum]: {
          ...currentHoleScores,
          [playerId]: newScore,
        },
      };
    });
  };

  const handleDirectScoreSet = (playerId, holeNum, val) => {
    setScores((prev) => ({
      ...prev,
      [holeNum]: {
        ...(prev[holeNum] || {}),
        [playerId]: val,
      },
    }));
  };

  const handleClearScores = () => {
    Alert.alert('Limpiar Golpes', '¿Deseas reiniciar todos los golpes de la ronda a cero?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Limpiar',
        style: 'destructive',
        onPress: () => {
          const emptyScores = {};
          courseConfig.holes.forEach((h) => {
            emptyScores[h.hole] = {};
          });
          setScores(emptyScores);
        },
      },
    ]);
  };

  const handleLoadDemoScores = () => {
    const demo = {};
    HOLES_DATA.forEach((h) => {
      demo[h.hole] = {};
      players.forEach((p, idx) => {
        // Assign realistic variations based on player handicap
        const basePar = h.par;
        const offset = idx === 0 ? (h.hole % 3 === 0 ? -1 : 0) : idx === 1 ? (h.hole % 2 === 0 ? 1 : 0) : 1;
        demo[h.hole][p.id] = Math.max(1, basePar + offset);
      });
    });
    setScores(demo);
  };

  const handleFinalizeAndLiquidateRound = () => {
    // Calculate player stats
    const playerResults = players.map((p) => {
      const totals = calculateTotals(p.id, 'all');
      const targetPar = totals.parPlayed > 0 ? totals.parPlayed : totalPar;
      const grossDiffNum = totals.grossTotal - targetPar;
      const netDiffNum = totals.netTotal - targetPar;
      return {
        ...p,
        grossTotal: totals.grossTotal,
        netTotal: totals.netTotal,
        grossDiff: grossDiffNum === 0 ? 'E' : grossDiffNum > 0 ? `+${grossDiffNum}` : `${grossDiffNum}`,
        netDiff: netDiffNum === 0 ? 'E' : netDiffNum > 0 ? `+${netDiffNum}` : `${netDiffNum}`,
      };
    });

    const hasScores = playerResults.some((p) => p.grossTotal > 0);
    if (!hasScores) {
      Alert.alert(
        'Sin Golpes Registrados',
        'Ingresa los golpes de los jugadores o presiona "Cargar Score de Ejemplo" antes de finalizar la ronda.'
      );
      return;
    }

    const sortedByNet = [...playerResults].sort((a, b) => a.netTotal - b.netTotal);
    const winner = sortedByNet[0];

    // Compute bets breakdown
    let totalPot = 0;
    const balancesMap = {};
    const wagersSummary = [];

    if (format === '1vs1' && playerResults.length >= 2) {
      const p1 = playerResults[0];
      const p2 = playerResults[1];

      const p1Out = calculateTotals(p1.id, 'out').netTotal;
      const p2Out = calculateTotals(p2.id, 'out').netTotal;
      const p1In = calculateTotals(p1.id, 'in').netTotal;
      const p2In = calculateTotals(p2.id, 'in').netTotal;

      let p1Bal = 0;
      let p2Bal = 0;

      // Nassau Ida ($300 MXN)
      if (p1Out < p2Out) {
        p1Bal += 300; p2Bal -= 300;
        wagersSummary.push({ wager: 'Nassau - Ida (1-9)', winner: p1.shortName, amount: '$300 MXN' });
      } else if (p2Out < p1Out) {
        p2Bal += 300; p1Bal -= 300;
        wagersSummary.push({ wager: 'Nassau - Ida (1-9)', winner: p2.shortName, amount: '$300 MXN' });
      } else {
        wagersSummary.push({ wager: 'Nassau - Ida (1-9)', winner: 'Empate', amount: '$0 MXN' });
      }

      // Nassau Vuelta ($300 MXN)
      if (p1In < p2In) {
        p1Bal += 300; p2Bal -= 300;
        wagersSummary.push({ wager: 'Nassau - Vuelta (10-18)', winner: p1.shortName, amount: '$300 MXN' });
      } else if (p2In < p1In) {
        p2Bal += 300; p1Bal -= 300;
        wagersSummary.push({ wager: 'Nassau - Vuelta (10-18)', winner: p2.shortName, amount: '$300 MXN' });
      } else {
        wagersSummary.push({ wager: 'Nassau - Vuelta (10-18)', winner: 'Empate', amount: '$0 MXN' });
      }

      // Nassau Total ($400 MXN)
      if (p1.netTotal < p2.netTotal) {
        p1Bal += 400; p2Bal -= 400;
        wagersSummary.push({ wager: 'Nassau - Total 18 Hoyos', winner: `${p1.shortName} (${p1.netTotal} neto)`, amount: '$400 MXN' });
      } else if (p2.netTotal < p1.netTotal) {
        p2Bal += 400; p1Bal -= 400;
        wagersSummary.push({ wager: 'Nassau - Total 18 Hoyos', winner: `${p2.shortName} (${p2.netTotal} neto)`, amount: '$400 MXN' });
      } else {
        wagersSummary.push({ wager: 'Nassau - Total 18 Hoyos', winner: 'Empate', amount: '$0 MXN' });
      }

      // Differential Medal
      const diffStrokes = Math.abs(p1.netTotal - p2.netTotal);
      const diffPayout = diffStrokes * 100;
      if (p1.netTotal < p2.netTotal) {
        p1Bal += diffPayout; p2Bal -= diffPayout;
        wagersSummary.push({ wager: `Diferencial Medal (${diffStrokes} golpes)`, winner: p1.shortName, amount: `$${diffPayout} MXN` });
      } else if (p2.netTotal < p1.netTotal) {
        p2Bal += diffPayout; p1Bal -= diffPayout;
        wagersSummary.push({ wager: `Diferencial Medal (${diffStrokes} golpes)`, winner: p2.shortName, amount: `$${diffPayout} MXN` });
      }

      balancesMap[p1.id] = p1Bal;
      balancesMap[p2.id] = p2Bal;
      totalPot = Math.abs(p1Bal) + Math.abs(p2Bal);
    } else {
      // Group (2-4 players)
      const avgNet = playerResults.reduce((acc, curr) => acc + curr.netTotal, 0) / playerResults.length;
      playerResults.forEach((p) => {
        const diffFromAvg = Math.round((avgNet - p.netTotal) * 200);
        balancesMap[p.id] = diffFromAvg;
        totalPot += Math.abs(diffFromAvg);
      });
      wagersSummary.push({
        wager: 'Modalidad Grupal (Medal Play)',
        winner: winner.shortName,
        amount: `$${Math.abs(balancesMap[winner.id] || 0)} MXN`,
      });
    }

    const now = new Date();
    const dateStr = `${now.getDate()} de Agosto, ${now.getFullYear()} • ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newRound = {
      id: `round_${Date.now()}`,
      date: dateStr,
      courseName: courseConfig.name,
      parTotal: totalPar,
      slopeRating: courseConfig.slope,
      courseRating: courseConfig.rating,
      format,
      formatLabel: format === '1vs1' ? 'Duelo 1vs1 (Match Play)' : `Grupo (${players.length} Jugadores)`,
      handicapMode,
      totalHoles: 18,
      winnerName: winner.name,
      winnerAvatar: winner.avatar,
      totalPot,
      weather: '☀️ Soleado 23°C',
      summaryText: `Ronda finalizada. ${winner.shortName} ganó con score neto de ${winner.netTotal} (${winner.netDiff}).`,
      balances: playerResults.map((p) => ({
        name: p.shortName,
        balance: balancesMap[p.id] || 0,
        isWinner: p.id === winner.id,
        grossTotal: p.grossTotal,
        netTotal: p.netTotal,
        grossDiff: p.grossDiff,
        netDiff: p.netDiff,
      })),
      wagersSummary,
      players: playerResults.map((p) => ({
        ...p,
        balance: balancesMap[p.id] || 0,
        isWinner: p.id === winner.id,
      })),
      holes: courseConfig.holes.map((h) => ({
        hole: h.hole,
        par: h.par,
        hcp: h.hcp,
        scores: { ...(scores[h.hole] || {}) },
      })),
    };

    addHistoryRound(newRound);

    Alert.alert(
      '🏆 Ronda Liquidada',
      `¡La partida ha sido finalizada con éxito! ${winner.shortName} es el ganador. Se ha guardado en el Historial.`,
      [
        { text: 'Permanecer aquí', style: 'cancel' },
        {
          text: 'Ver en Historial 📜',
          onPress: () => {
            if (navigation) {
              navigation.navigate('Historial');
            }
          },
        },
      ]
    );
  };

  // ----------------------------------------------------
  // CONFIGURATION EDITING FUNCTIONS
  // ----------------------------------------------------
  const handleFormatSelect = (newFormat) => {
    setFormat(newFormat);
    if (newFormat === '1vs1') {
      if (players.length > 2) {
        setPlayers(players.slice(0, 2));
      }
    } else {
      if (players.length < 2) {
        setPlayers([...players, MOCK_PLAYERS[1] || { id: 'p2', name: 'Carlos', shortName: 'Carlos', avatar: '🏌️‍♂️', handicapIndex: 5.4, badgeColor: '#3B82F6' }]);
      }
    }
  };

  const handleAddPlayer = () => {
    if (players.length >= 4) {
      Alert.alert('Límite alcanzado', 'El formato admite máximo 4 jugadores.');
      return;
    }
    const unusedMock = MOCK_PLAYERS.find((mp) => !players.some((p) => p.id === mp.id));
    const newId = `p_${Date.now()}`;
    if (unusedMock) {
      setPlayers([...players, { ...unusedMock, id: newId }]);
    } else {
      setPlayers([
        ...players,
        {
          id: newId,
          name: `Jugador ${players.length + 1}`,
          shortName: `Jugador ${players.length + 1}`,
          avatar: '🏌️‍♂️',
          handicapIndex: 12.0,
          badgeColor: '#F59E0B',
        },
      ]);
    }
  };

  const handleRemovePlayer = (id) => {
    if (players.length <= 2) {
      Alert.alert('Mínimo de Jugadores', 'Se requieren al menos 2 jugadores.');
      return;
    }
    setPlayers(players.filter((p) => p.id !== id));
  };

  const handleUpdatePlayer = (id, field, value) => {
    setPlayers(
      players.map((p) => {
        if (p.id === id) {
          if (field === 'handicapIndex') {
            const num = parseFloat(value) || 0;
            return { ...p, handicapIndex: Math.max(0, Math.min(54, num)) };
          }
          return { ...p, [field]: value };
        }
        return p;
      })
    );
  };

  const handleUpdateHole = (holeNum, field, val) => {
    setCourseConfig((prev) => ({
      ...prev,
      holes: prev.holes.map((h) => {
        if (h.hole === holeNum) {
          if (field === 'par') return { ...h, par: val };
          if (field === 'hcp') return { ...h, hcp: Math.max(1, Math.min(18, val)) };
        }
        return h;
      }),
    }));
  };

  const handleApplyPresetPar = (presetType) => {
    let pars = [];
    if (presetType === 72) {
      pars = [4, 5, 3, 4, 4, 5, 4, 3, 4, 4, 5, 3, 4, 4, 3, 5, 4, 4];
    } else if (presetType === 71) {
      pars = [4, 4, 3, 4, 4, 5, 4, 3, 4, 4, 5, 3, 4, 4, 3, 4, 4, 5];
    } else if (presetType === 70) {
      pars = [4, 4, 3, 4, 4, 4, 4, 3, 4, 4, 5, 3, 4, 4, 3, 4, 4, 4];
    }
    setCourseConfig((prev) => ({
      ...prev,
      holes: prev.holes.map((h, i) => ({ ...h, par: pars[i] || 4 })),
    }));
  };

  const currentHoleData = useMemo(() => {
    return courseConfig.holes.find((h) => h.hole === currentHole) || courseConfig.holes[0];
  }, [courseConfig.holes, currentHole]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Screen Mode Switcher Header */}
      <View style={styles.topHeaderNav}>
        <View style={styles.navHeaderTitleRow}>
          <Text style={styles.screenMainTitle}>Tarjeta & Ronda</Text>
          <View style={styles.topTabContainer}>
            <TouchableOpacity
              style={[styles.topTabBtn, activeTab === 'scorecard' && styles.topTabBtnActive]}
              onPress={() => setActiveTab('scorecard')}
            >
              <Ionicons
                name="clipboard-outline"
                size={16}
                color={activeTab === 'scorecard' ? COLORS.primary : COLORS.textMuted}
              />
              <Text
                style={[
                  styles.topTabBtnText,
                  activeTab === 'scorecard' && styles.topTabBtnTextActive,
                ]}
              >
                Tarjeta
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.topTabBtn, activeTab === 'config' && styles.topTabBtnActive]}
              onPress={() => setActiveTab('config')}
            >
              <Ionicons
                name="options-outline"
                size={16}
                color={activeTab === 'config' ? COLORS.primary : COLORS.textMuted}
              />
              <Text
                style={[
                  styles.topTabBtnText,
                  activeTab === 'config' && styles.topTabBtnTextActive,
                ]}
              >
                Configurar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ========================================================================= */}
        {/* TAB 1: LIVE SCORECARD VIEW                                               */}
        {/* ========================================================================= */}
        {activeTab === 'scorecard' && (
          <>
            {/* Course Summary & Action Bar */}
            <View style={styles.courseInfoCard}>
              <View style={styles.courseHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.courseNameText}>{courseConfig.name}</Text>
                  <Text style={styles.courseFormatTag}>
                    {format === '1vs1' ? '🥊 Duelo 1vs1' : `👥 Grupo (${players.length} jugadores)`} •{' '}
                    {handicapMode === 'differential' ? 'Ventaja por Diferencial' : 'Handicap Completo'}
                  </Text>
                </View>
                <TouchableOpacity style={styles.editConfigBtn} onPress={() => setActiveTab('config')}>
                  <Ionicons name="create-outline" size={16} color={COLORS.primary} />
                  <Text style={styles.editConfigBtnText}>Editar Campo</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.courseMetricsRow}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>PAR TOTAL</Text>
                  <Text style={styles.metricValue}>{totalPar}</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>SLOPE</Text>
                  <Text style={styles.metricValue}>{courseConfig.slope}</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>RATING</Text>
                  <Text style={styles.metricValue}>{courseConfig.rating}</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>HOYO ACTUAL</Text>
                  <Text style={[styles.metricValue, { color: COLORS.primary }]}>Hoyo {currentHole}</Text>
                </View>
              </View>
            </View>

            {/* Differential Advantage Banner */}
            <View style={styles.advantageBanner}>
              <View style={styles.advantageBannerHeader}>
                <Ionicons name="information-circle" size={18} color={COLORS.accentGold} />
                <Text style={styles.advantageTitle}>Golpes de Ventaja (Handicap Advantage)</Text>
              </View>
              <Text style={styles.advantageDesc}>
                {handicapMode === 'differential'
                  ? format === '1vs1'
                    ? `Diferencial exacto 1vs1: El jugador con menor handicap juega a 0 y da la diferencia exacta de golpes según el Stroke Index (SI 1 a 18).`
                    : `Diferencial de grupo: Golpes calculados respecto al handicap más bajo del grupo.`
                  : `Handicap completo: Cada jugador recibe sus golpes totales correspondientes.`}
              </Text>
              <View style={styles.playerAdvantageList}>
                {players.map((p) => {
                  const info = playerStrokesInfo[p.id] || { advantageStrokes: 0, isBasePlayer: true };
                  return (
                    <View key={p.id} style={styles.advantageBadgeItem}>
                      <Text style={styles.advantagePlayerAvatar}>{p.avatar}</Text>
                      <Text style={styles.advantagePlayerName}>{p.shortName}</Text>
                      <Text style={styles.advantagePlayerHcp}>({p.handicapIndex} HCP)</Text>
                      <View
                        style={[
                          styles.advantageStrokesPill,
                          info.isBasePlayer ? styles.basePill : styles.strokePill,
                        ]}
                      >
                        <Text style={styles.advantageStrokesText}>
                          {info.isBasePlayer ? '0 (Base)' : `+${info.advantageStrokes} golpes`}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Agile Hole-by-Hole Input Widget */}
            <View style={styles.quickScoringCard}>
              <View style={styles.quickScoringHeader}>
                <TouchableOpacity
                  style={styles.holeNavBtn}
                  onPress={() => setCurrentHole((prev) => Math.max(1, prev - 1))}
                  disabled={currentHole === 1}
                >
                  <Ionicons
                    name="chevron-back"
                    size={20}
                    color={currentHole === 1 ? COLORS.textMuted : COLORS.textPrimary}
                  />
                  <Text
                    style={[
                      styles.holeNavText,
                      currentHole === 1 && { color: COLORS.textMuted },
                    ]}
                  >
                    Anterior
                  </Text>
                </TouchableOpacity>

                <View style={styles.currentHoleBadge}>
                  <Text style={styles.currentHoleTitle}>Hoyo {currentHoleData.hole}</Text>
                  <Text style={styles.currentHoleSub}>
                    PAR {currentHoleData.par} • HCP (SI) {currentHoleData.hcp}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.holeNavBtn}
                  onPress={() => setCurrentHole((prev) => Math.min(18, prev + 1))}
                  disabled={currentHole === 18}
                >
                  <Text
                    style={[
                      styles.holeNavText,
                      currentHole === 18 && { color: COLORS.textMuted },
                    ]}
                  >
                    Siguiente
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={currentHole === 18 ? COLORS.textMuted : COLORS.textPrimary}
                  />
                </TouchableOpacity>
              </View>

              {/* Hole Horizontal Selector Strip */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.holeStripScroll}
              >
                {courseConfig.holes.map((h) => {
                  const isSelected = h.hole === currentHole;
                  const allEntered = players.every(
                    (p) => scores[h.hole]?.[p.id] && scores[h.hole][p.id] > 0
                  );
                  return (
                    <TouchableOpacity
                      key={h.hole}
                      style={[
                        styles.holeStripPill,
                        isSelected && styles.holeStripPillActive,
                        allEntered && !isSelected && styles.holeStripPillComplete,
                      ]}
                      onPress={() => setCurrentHole(h.hole)}
                    >
                      <Text
                        style={[
                          styles.holeStripNum,
                          isSelected && styles.holeStripNumActive,
                        ]}
                      >
                        {h.hole}
                      </Text>
                      <Text style={styles.holeStripPar}>P{h.par}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Player Score Input Rows */}
              <View style={styles.playerInputList}>
                {players.map((p) => {
                  const grossVal = scores[currentHoleData.hole]?.[p.id] || 0;
                  const strokesOnThisHole = getStrokesReceivedOnHole(
                    p.id,
                    currentHoleData.hcp
                  );
                  const netVal = getNetScore(
                    grossVal || currentHoleData.par,
                    currentHoleData.hcp,
                    p.id
                  );
                  const styleMeta = getScoreStyle(
                    scoreType === 'gross' ? grossVal : netVal,
                    currentHoleData.par
                  );

                  return (
                    <View key={p.id} style={styles.playerInputRow}>
                      <View style={styles.playerInputMeta}>
                        <View style={styles.playerInputNameRow}>
                          <Text style={styles.playerInputAvatar}>{p.avatar}</Text>
                          <View>
                            <Text style={styles.playerInputName}>{p.shortName}</Text>
                            {strokesOnThisHole > 0 ? (
                              <View style={styles.strokeAdvantageTag}>
                                <Ionicons name="star" size={10} color={COLORS.accentGold} />
                                <Text style={styles.strokeAdvantageTagText}>
                                  Recibe +{strokesOnThisHole} {strokesOnThisHole === 1 ? 'golpe' : 'golpes'}
                                </Text>
                              </View>
                            ) : (
                              <Text style={styles.noAdvantageText}>Sin ventaja</Text>
                            )}
                          </View>
                        </View>
                      </View>

                      {/* Quick Stepper Input Controls */}
                      <View style={styles.scoreInputControls}>
                        <TouchableOpacity
                          style={styles.stepBtn}
                          onPress={() =>
                            handleScoreChange(p.id, currentHoleData.hole, -1)
                          }
                        >
                          <Ionicons name="remove" size={18} color={COLORS.textPrimary} />
                        </TouchableOpacity>

                        <View style={styles.scoreDisplayBox}>
                          <Text style={styles.grossScoreBig}>
                            {grossVal > 0 ? grossVal : '-'}
                          </Text>
                          {grossVal > 0 && (
                            <Text style={styles.netScoreSub}>
                              Neto: {netVal}
                            </Text>
                          )}
                        </View>

                        <TouchableOpacity
                          style={styles.stepBtn}
                          onPress={() =>
                            handleScoreChange(p.id, currentHoleData.hole, 1)
                          }
                        >
                          <Ionicons name="add" size={18} color={COLORS.textPrimary} />
                        </TouchableOpacity>
                      </View>

                      {/* Quick Par/Birdie Preset Buttons */}
                      <View style={styles.presetButtonsCol}>
                        <TouchableOpacity
                          style={[
                            styles.presetBtn,
                            grossVal === currentHoleData.par - 1 && styles.presetBtnActive,
                          ]}
                          onPress={() =>
                            handleDirectScoreSet(
                              p.id,
                              currentHoleData.hole,
                              currentHoleData.par - 1
                            )
                          }
                        >
                          <Text style={styles.presetBtnText}>
                            {currentHoleData.par - 1}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.presetBtn,
                            grossVal === currentHoleData.par && styles.presetBtnActive,
                          ]}
                          onPress={() =>
                            handleDirectScoreSet(
                              p.id,
                              currentHoleData.hole,
                              currentHoleData.par
                            )
                          }
                        >
                          <Text style={styles.presetBtnText}>
                            {currentHoleData.par}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.presetBtn,
                            grossVal === currentHoleData.par + 1 && styles.presetBtnActive,
                          ]}
                          onPress={() =>
                            handleDirectScoreSet(
                              p.id,
                              currentHoleData.hole,
                              currentHoleData.par + 1
                            )
                          }
                        >
                          <Text style={styles.presetBtnText}>
                            {currentHoleData.par + 1}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Scorecard Filters & Score Type Switch */}
            <View style={styles.filtersContainer}>
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[styles.tabButton, viewMode === 'all' && styles.tabButtonActive]}
                  onPress={() => setViewMode('all')}
                >
                  <Text style={[styles.tabText, viewMode === 'all' && styles.tabTextActive]}>
                    18 Hoyos
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabButton, viewMode === 'out' && styles.tabButtonActive]}
                  onPress={() => setViewMode('out')}
                >
                  <Text style={[styles.tabText, viewMode === 'out' && styles.tabTextActive]}>
                    Ida (1-9)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabButton, viewMode === 'in' && styles.tabButtonActive]}
                  onPress={() => setViewMode('in')}
                >
                  <Text style={[styles.tabText, viewMode === 'in' && styles.tabTextActive]}>
                    Vuelta (10-18)
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.scoreTypeSwitch}>
                <TouchableOpacity
                  style={[
                    styles.scoreTypeBtn,
                    scoreType === 'gross' && styles.scoreTypeBtnActive,
                  ]}
                  onPress={() => setScoreType('gross')}
                >
                  <Text
                    style={[
                      styles.scoreTypeBtnText,
                      scoreType === 'gross' && styles.scoreTypeBtnTextActive,
                    ]}
                  >
                    Bruto (Gross)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.scoreTypeBtn,
                    scoreType === 'net' && styles.scoreTypeBtnActive,
                  ]}
                  onPress={() => setScoreType('net')}
                >
                  <Text
                    style={[
                      styles.scoreTypeBtnText,
                      scoreType === 'net' && styles.scoreTypeBtnTextActive,
                    ]}
                  >
                    Neto (Net)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Real-Time Player Summary Cards */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.playersSummaryScroll}
            >
              {players.map((p) => {
                const totals = calculateTotals(p.id, 'all');
                const targetPar = totals.parPlayed > 0 ? totals.parPlayed : totalPar;
                const grossDiff = totals.grossTotal - targetPar;
                const netDiff = totals.netTotal - targetPar;

                return (
                  <View
                    key={p.id}
                    style={[styles.playerSummaryCard, { borderTopColor: p.badgeColor }]}
                  >
                    <Text style={styles.summaryAvatar}>{p.avatar}</Text>
                    <Text style={styles.summaryName}>{p.shortName}</Text>
                    <Text style={styles.summaryHcp}>HCP: {p.handicapIndex}</Text>

                    <View style={styles.summaryScoreBox}>
                      <Text style={styles.summaryGrossText}>
                        Bruto: {totals.grossTotal || '--'}{' '}
                        {totals.grossTotal > 0
                          ? `(${grossDiff >= 0 ? `+${grossDiff}` : grossDiff})`
                          : ''}
                      </Text>
                      <Text style={styles.summaryNetText}>
                        Neto: {totals.netTotal || '--'}{' '}
                        {totals.netTotal > 0
                          ? `(${netDiff >= 0 ? `+${netDiff}` : netDiff})`
                          : ''}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            {/* Interactive Scorecard Table */}
            <View style={styles.tableContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                <View>
                  {/* Table Header Row */}
                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.thCell, styles.cellHole]}>Hoyo</Text>
                    <Text style={[styles.thCell, styles.cellPar]}>Par</Text>
                    <Text style={[styles.thCell, styles.cellHcp]}>HCP</Text>
                    {players.map((p) => (
                      <Text key={p.id} style={[styles.thCell, styles.cellPlayer]}>
                        {p.shortName}
                      </Text>
                    ))}
                  </View>

                  {/* Hole Rows */}
                  {holesToDisplay.map((h, idx) => (
                    <TouchableOpacity
                      key={h.hole}
                      activeOpacity={0.7}
                      onPress={() => setCurrentHole(h.hole)}
                      style={[
                        styles.tableBodyRow,
                        idx % 2 === 1 && styles.tableRowAlt,
                        h.hole === currentHole && styles.currentHoleHighlight,
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

                      {players.map((p) => {
                        const grossScore = scores[h.hole]?.[p.id] || 0;
                        const netScore = getNetScore(grossScore, h.hcp, p.id);
                        const displayScore = scoreType === 'gross' ? grossScore : netScore;
                        const styleMeta = getScoreStyle(displayScore, h.par);
                        const strokesReceived = getStrokesReceivedOnHole(p.id, h.hcp);

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
                              {strokesReceived > 0 && (
                                <View style={styles.advantageDotIndicator} />
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </TouchableOpacity>
                  ))}

                  {/* Totals Row: IDA (1-9) */}
                  {(viewMode === 'all' || viewMode === 'out') && (
                    <View style={styles.tableTotalRow}>
                      <Text style={[styles.tdCell, styles.cellHole, styles.totalLabel]}>
                        IDA
                      </Text>
                      <Text style={[styles.tdCell, styles.cellPar, styles.totalLabel]}>
                        {
                          courseConfig.holes
                            .slice(0, 9)
                            .reduce((acc, item) => acc + item.par, 0)
                        }
                      </Text>
                      <Text style={[styles.tdCell, styles.cellHcp, styles.totalLabel]}>
                        -
                      </Text>
                      {players.map((p) => {
                        const t = calculateTotals(p.id, 'out');
                        return (
                          <Text
                            key={p.id}
                            style={[styles.tdCell, styles.cellPlayer, styles.totalValue]}
                          >
                            {scoreType === 'gross' ? t.grossTotal || '--' : t.netTotal || '--'}
                          </Text>
                        );
                      })}
                    </View>
                  )}

                  {/* Totals Row: VUELTA (10-18) */}
                  {(viewMode === 'all' || viewMode === 'in') && (
                    <View style={styles.tableTotalRow}>
                      <Text style={[styles.tdCell, styles.cellHole, styles.totalLabel]}>
                        VTA
                      </Text>
                      <Text style={[styles.tdCell, styles.cellPar, styles.totalLabel]}>
                        {
                          courseConfig.holes
                            .slice(9, 18)
                            .reduce((acc, item) => acc + item.par, 0)
                        }
                      </Text>
                      <Text style={[styles.tdCell, styles.cellHcp, styles.totalLabel]}>
                        -
                      </Text>
                      {players.map((p) => {
                        const t = calculateTotals(p.id, 'in');
                        return (
                          <Text
                            key={p.id}
                            style={[styles.tdCell, styles.cellPlayer, styles.totalValue]}
                          >
                            {scoreType === 'gross' ? t.grossTotal || '--' : t.netTotal || '--'}
                          </Text>
                        );
                      })}
                    </View>
                  )}

                  {/* Totals Row: FULL 18 */}
                  {viewMode === 'all' && (
                    <View style={[styles.tableTotalRow, styles.finalTotalRow]}>
                      <Text
                        style={[styles.tdCell, styles.cellHole, styles.finalTotalLabel]}
                      >
                        TOTAL
                      </Text>
                      <Text
                        style={[styles.tdCell, styles.cellPar, styles.finalTotalLabel]}
                      >
                        {totalPar}
                      </Text>
                      <Text
                        style={[styles.tdCell, styles.cellHcp, styles.finalTotalLabel]}
                      >
                        -
                      </Text>
                      {players.map((p) => {
                        const t = calculateTotals(p.id, 'all');
                        return (
                          <Text
                            key={p.id}
                            style={[
                              styles.tdCell,
                              styles.cellPlayer,
                              styles.finalTotalValue,
                            ]}
                          >
                            {scoreType === 'gross' ? t.grossTotal || '--' : t.netTotal || '--'}
                          </Text>
                        );
                      })}
                    </View>
                  )}
                </View>
              </ScrollView>
            </View>

            {/* Utility Actions (Demo Fill / Clear) */}
            <View style={styles.utilityActionsRow}>
              <TouchableOpacity
                style={styles.utilityBtn}
                onPress={handleLoadDemoScores}
              >
                <Ionicons name="sparkles-outline" size={16} color={COLORS.accentGold} />
                <Text style={styles.utilityBtnText}>Cargar Score de Ejemplo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.utilityBtn, styles.utilityBtnDanger]}
                onPress={handleClearScores}
              >
                <Ionicons name="trash-outline" size={16} color={COLORS.negativeMoney} />
                <Text style={[styles.utilityBtnText, { color: COLORS.negativeMoney }]}>
                  Limpiar Golpes
                </Text>
              </TouchableOpacity>
            </View>

            {/* Score Symbology Legend */}
            <View style={styles.legendContainer}>
              <Text style={styles.legendTitle}>Simbología & Leyenda:</Text>
              <View style={styles.legendGrid}>
                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.scoreBadge,
                      { backgroundColor: COLORS.eagleGold, width: 22, height: 22 },
                    ]}
                  >
                    <Text style={{ color: '#000', fontSize: 10, fontWeight: '700' }}>
                      -2
                    </Text>
                  </View>
                  <Text style={styles.legendText}>Eagle/Mejor</Text>
                </View>

                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.scoreBadge,
                      { backgroundColor: COLORS.birdieGreen, width: 22, height: 22 },
                    ]}
                  >
                    <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '700' }}>
                      -1
                    </Text>
                  </View>
                  <Text style={styles.legendText}>Birdie</Text>
                </View>

                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.scoreBadge,
                      {
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        width: 22,
                        height: 22,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: COLORS.textPrimary,
                        fontSize: 10,
                        fontWeight: '700',
                      }}
                    >
                      E
                    </Text>
                  </View>
                  <Text style={styles.legendText}>Par</Text>
                </View>

                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.scoreBadge,
                      { backgroundColor: COLORS.bogeyOrange, width: 22, height: 22 },
                    ]}
                  >
                    <Text style={{ color: '#000', fontSize: 10, fontWeight: '700' }}>
                      +1
                    </Text>
                  </View>
                  <Text style={styles.legendText}>Bogey</Text>
                </View>

                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.scoreBadge,
                      { backgroundColor: COLORS.doubleRed, width: 22, height: 22 },
                    ]}
                  >
                    <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '700' }}>
                      +2
                    </Text>
                  </View>
                  <Text style={styles.legendText}>Double+</Text>
                </View>

                <View style={styles.legendItem}>
                  <View style={styles.legendDotBox}>
                    <View style={styles.advantageDotIndicator} />
                  </View>
                  <Text style={styles.legendText}>Golpe de Ventaja</Text>
                </View>
              </View>
            </View>

            {/* Finalize and Liquidate Round CTA */}
            <TouchableOpacity
              style={styles.finalizeRoundBtn}
              activeOpacity={0.85}
              onPress={handleFinalizeAndLiquidateRound}
            >
              <View style={styles.finalizeBtnContent}>
                <View style={styles.finalizeTrophyCircle}>
                  <Ionicons name="trophy" size={22} color={COLORS.accentGold} />
                </View>
                <View style={styles.finalizeTextCol}>
                  <Text style={styles.finalizeBtnTitle}>Finalizar y Liquidar Ronda</Text>
                  <Text style={styles.finalizeBtnSub}>
                    Liquida apuestas, calcula saldos finales y guarda en Historial
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.accentGold} />
              </View>
            </TouchableOpacity>
          </>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: ROUND & COURSE CONFIGURATION FORM                                 */}
        {/* ========================================================================= */}
        {activeTab === 'config' && (
          <View style={styles.configFormContainer}>
            {/* Section 1: Formato de Partida */}
            <View style={styles.configCard}>
              <Text style={styles.configSectionTitle}>1. Formato de Partida</Text>
              <Text style={styles.configSectionSubtitle}>
                Selecciona la modalidad de juego y el cálculo de ventaja por handicap.
              </Text>

              <View style={styles.formatSelectRow}>
                <TouchableOpacity
                  style={[
                    styles.formatCardBtn,
                    format === '1vs1' && styles.formatCardBtnActive,
                  ]}
                  onPress={() => handleFormatSelect('1vs1')}
                >
                  <Ionicons
                    name="people"
                    size={24}
                    color={format === '1vs1' ? COLORS.primary : COLORS.textMuted}
                  />
                  <Text
                    style={[
                      styles.formatCardTitle,
                      format === '1vs1' && styles.formatCardTitleActive,
                    ]}
                  >
                    Duelo 1vs1
                  </Text>
                  <Text style={styles.formatCardDesc}>2 Jugadores (Diferencial directo)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.formatCardBtn,
                    format === 'group' && styles.formatCardBtnActive,
                  ]}
                  onPress={() => handleFormatSelect('group')}
                >
                  <Ionicons
                    name="grid-outline"
                    size={24}
                    color={format === 'group' ? COLORS.primary : COLORS.textMuted}
                  />
                  <Text
                    style={[
                      styles.formatCardTitle,
                      format === 'group' && styles.formatCardTitleActive,
                    ]}
                  >
                    Grupo (2 a 4)
                  </Text>
                  <Text style={styles.formatCardDesc}>Foursome o Fivesome</Text>
                </TouchableOpacity>
              </View>

              {/* Handicap Mode Switcher */}
              <Text style={[styles.inputFieldLabel, { marginTop: SPACING.md }]}>
                Cálculo de Ventaja por Handicap:
              </Text>
              <View style={styles.handicapModeContainer}>
                <TouchableOpacity
                  style={[
                    styles.handicapModeBtn,
                    handicapMode === 'differential' && styles.handicapModeBtnActive,
                  ]}
                  onPress={() => setHandicapMode('differential')}
                >
                  <Text
                    style={[
                      styles.handicapModeText,
                      handicapMode === 'differential' && styles.handicapModeTextActive,
                    ]}
                  >
                    Diferencial Directo (Recomendado)
                  </Text>
                  <Text style={styles.handicapModeSubText}>
                    El menor HCP juega a 0 y da la diferencia exacta al resto
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.handicapModeBtn,
                    handicapMode === 'full' && styles.handicapModeBtnActive,
                  ]}
                  onPress={() => setHandicapMode('full')}
                >
                  <Text
                    style={[
                      styles.handicapModeText,
                      handicapMode === 'full' && styles.handicapModeTextActive,
                    ]}
                  >
                    Handicap Completo
                  </Text>
                  <Text style={styles.handicapModeSubText}>
                    Cada jugador recibe su total de golpes completo
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Section 2: Registro de Jugadores */}
            <View style={styles.configCard}>
              <View style={styles.configHeaderRow}>
                <Text style={styles.configSectionTitle}>
                  2. Registro de Jugadores ({players.length})
                </Text>
                {format === 'group' && players.length < 4 && (
                  <TouchableOpacity style={styles.addPlayerBtn} onPress={handleAddPlayer}>
                    <Ionicons name="add-circle" size={18} color={COLORS.primary} />
                    <Text style={styles.addPlayerBtnText}>Agregar Jugador</Text>
                  </TouchableOpacity>
                )}
              </View>

              {players.map((p, index) => (
                <View key={p.id} style={styles.playerEditCard}>
                  <View style={styles.playerEditHeader}>
                    <Text style={styles.playerEditTitle}>Jugador {index + 1}</Text>
                    {players.length > 2 && (
                      <TouchableOpacity onPress={() => handleRemovePlayer(p.id)}>
                        <Ionicons name="trash-outline" size={18} color={COLORS.negativeMoney} />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.playerEditFieldsRow}>
                    <View style={{ flex: 2, marginRight: SPACING.sm }}>
                      <Text style={styles.inputFieldLabel}>Nombre / Apodo</Text>
                      <TextInput
                        style={styles.textInputStyle}
                        value={p.shortName}
                        onChangeText={(val) => handleUpdatePlayer(p.id, 'shortName', val)}
                        placeholder="Ej. Alex"
                        placeholderTextColor={COLORS.textMuted}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputFieldLabel}>Handicap Index</Text>
                      <TextInput
                        style={styles.textInputStyle}
                        value={String(p.handicapIndex)}
                        keyboardType="decimal-pad"
                        onChangeText={(val) => handleUpdatePlayer(p.id, 'handicapIndex', val)}
                        placeholder="10.2"
                        placeholderTextColor={COLORS.textMuted}
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Section 3: Configuración del Campo & 18 Hoyos */}
            <View style={styles.configCard}>
              <Text style={styles.configSectionTitle}>3. Configuración del Campo</Text>
              <Text style={styles.configSectionSubtitle}>
                Define el nombre del campo, Slope, Rating y los 18 hoyos (Par y Stroke Index).
              </Text>

              <View style={styles.inputFieldGroup}>
                <Text style={styles.inputFieldLabel}>Nombre del Campo de Golf</Text>
                <TextInput
                  style={styles.textInputStyle}
                  value={courseConfig.name}
                  onChangeText={(val) =>
                    setCourseConfig((prev) => ({ ...prev, name: val }))
                  }
                  placeholder="Nombre del campo"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              <View style={styles.slopeRatingRow}>
                <View style={{ flex: 1, marginRight: SPACING.sm }}>
                  <Text style={styles.inputFieldLabel}>Slope Rating</Text>
                  <TextInput
                    style={styles.textInputStyle}
                    value={String(courseConfig.slope)}
                    keyboardType="number-pad"
                    onChangeText={(val) =>
                      setCourseConfig((prev) => ({
                        ...prev,
                        slope: parseInt(val, 10) || 113,
                      }))
                    }
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.inputFieldLabel}>Course Rating</Text>
                  <TextInput
                    style={styles.textInputStyle}
                    value={String(courseConfig.rating)}
                    keyboardType="decimal-pad"
                    onChangeText={(val) =>
                      setCourseConfig((prev) => ({
                        ...prev,
                        rating: parseFloat(val) || 72.0,
                      }))
                    }
                  />
                </View>
              </View>

              {/* Quick Par Presets */}
              <Text style={[styles.inputFieldLabel, { marginTop: SPACING.sm }]}>
                Preconfiguración de Par Total:
              </Text>
              <View style={styles.presetsRow}>
                <TouchableOpacity
                  style={styles.presetChip}
                  onPress={() => handleApplyPresetPar(72)}
                >
                  <Text style={styles.presetChipText}>Par 72 Estándar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.presetChip}
                  onPress={() => handleApplyPresetPar(71)}
                >
                  <Text style={styles.presetChipText}>Par 71</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.presetChip}
                  onPress={() => handleApplyPresetPar(70)}
                >
                  <Text style={styles.presetChipText}>Par 70</Text>
                </TouchableOpacity>
              </View>

              {/* 18 Holes Table Editor Header */}
              <View style={styles.holeEditorHeader}>
                <Text style={styles.inputFieldLabel}>Edición de Hoyos (Par & Stroke Index)</Text>
                <View style={styles.holeTabToggle}>
                  <TouchableOpacity
                    style={[
                      styles.holeTabBtn,
                      configHoleTab === 'out' && styles.holeTabBtnActive,
                    ]}
                    onPress={() => setConfigHoleTab('out')}
                  >
                    <Text
                      style={[
                        styles.holeTabBtnText,
                        configHoleTab === 'out' && styles.holeTabBtnTextActive,
                      ]}
                    >
                      Hoyos 1-9
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.holeTabBtn,
                      configHoleTab === 'in' && styles.holeTabBtnActive,
                    ]}
                    onPress={() => setConfigHoleTab('in')}
                  >
                    <Text
                      style={[
                        styles.holeTabBtnText,
                        configHoleTab === 'in' && styles.holeTabBtnTextActive,
                      ]}
                    >
                      Hoyos 10-18
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Hole List Inputs */}
              {(configHoleTab === 'out'
                ? courseConfig.holes.slice(0, 9)
                : courseConfig.holes.slice(9, 18)
              ).map((h) => (
                <View key={h.hole} style={styles.holeEditRow}>
                  <Text style={styles.holeEditNum}>Hoyo {h.hole}</Text>

                  {/* Par Selector Buttons */}
                  <View style={styles.parSelectorRow}>
                    <Text style={styles.holeEditSubLabel}>Par:</Text>
                    {[3, 4, 5].map((pVal) => (
                      <TouchableOpacity
                        key={pVal}
                        style={[
                          styles.parValBtn,
                          h.par === pVal && styles.parValBtnActive,
                        ]}
                        onPress={() => handleUpdateHole(h.hole, 'par', pVal)}
                      >
                        <Text
                          style={[
                            styles.parValBtnText,
                            h.par === pVal && styles.parValBtnTextActive,
                          ]}
                        >
                          {pVal}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Stroke Index (HCP) Input */}
                  <View style={styles.hcpInputBox}>
                    <Text style={styles.holeEditSubLabel}>SI (HCP):</Text>
                    <TextInput
                      style={styles.hcpTextInput}
                      value={String(h.hcp)}
                      keyboardType="number-pad"
                      onChangeText={(val) =>
                        handleUpdateHole(h.hole, 'hcp', parseInt(val, 10) || 1)
                      }
                    />
                  </View>
                </View>
              ))}
            </View>

            {/* Save & Start Round CTA Button */}
            <TouchableOpacity
              style={styles.saveConfigCTA}
              onPress={() => {
                setActiveTab('scorecard');
                Alert.alert(
                  'Configuración Guardada',
                  'La tarjeta de la ronda se ha actualizado correctamente.'
                );
              }}
            >
              <Text style={styles.saveConfigCTAText}>Guardar y Ver Tarjeta de Golpes</Text>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  topHeaderNav: {
    backgroundColor: COLORS.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  navHeaderTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  screenMainTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  topTabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgSubtle,
    borderRadius: RADIUS.md,
    padding: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  topTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  topTabBtnActive: {
    backgroundColor: COLORS.primaryDark,
  },
  topTabBtnText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  topTabBtnTextActive: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  courseInfoCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  courseHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  courseNameText: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  courseFormatTag: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  editConfigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  editConfigBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  courseMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: SPACING.xs,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  metricValue: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.border,
  },
  advantageBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    marginBottom: SPACING.md,
  },
  advantageBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  advantageTitle: {
    color: COLORS.accentGold,
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 6,
  },
  advantageDesc: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: SPACING.xs,
  },
  playerAdvantageList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  advantageBadgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    marginRight: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  advantagePlayerAvatar: {
    fontSize: 14,
    marginRight: 4,
  },
  advantagePlayerName: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    marginRight: 4,
  },
  advantagePlayerHcp: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginRight: 6,
  },
  advantageStrokesPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  basePill: {
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
  },
  strokePill: {
    backgroundColor: COLORS.primaryDark,
  },
  advantageStrokesText: {
    color: COLORS.textPrimary,
    fontSize: 10,
    fontWeight: '800',
  },
  quickScoringCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    ...SHADOWS.medium,
  },
  quickScoringHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  holeNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
  },
  holeNavText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  currentHoleBadge: {
    alignItems: 'center',
  },
  currentHoleTitle: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: '900',
  },
  currentHoleSub: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  holeStripScroll: {
    marginBottom: SPACING.md,
  },
  holeStripPill: {
    width: 38,
    height: 44,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  holeStripPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryLight,
  },
  holeStripPillComplete: {
    borderColor: COLORS.primaryDark,
  },
  holeStripNum: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  holeStripNumActive: {
    color: '#FFF',
  },
  holeStripPar: {
    color: COLORS.textMuted,
    fontSize: 9,
  },
  playerInputList: {
    gap: SPACING.sm,
  },
  playerInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgSubtle,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  playerInputMeta: {
    flex: 1.2,
  },
  playerInputNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerInputAvatar: {
    fontSize: 20,
    marginRight: 6,
  },
  playerInputName: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  strokeAdvantageTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  strokeAdvantageTagText: {
    color: COLORS.accentGold,
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 3,
  },
  noAdvantageText: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  scoreInputControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  scoreDisplayBox: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  grossScoreBig: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '900',
  },
  netScoreSub: {
    color: COLORS.primaryLight,
    fontSize: 10,
    fontWeight: '700',
  },
  presetButtonsCol: {
    flexDirection: 'row',
    gap: 4,
    marginLeft: SPACING.xs,
  },
  presetBtn: {
    width: 26,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  presetBtnActive: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primary,
  },
  presetBtnText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  filtersContainer: {
    marginBottom: SPACING.md,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgSubtle,
    borderRadius: RADIUS.md,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.xs,
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
  scoreTypeSwitch: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.full,
    padding: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignSelf: 'center',
  },
  scoreTypeBtn: {
    paddingHorizontal: 16,
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
  playersSummaryScroll: {
    marginBottom: SPACING.md,
  },
  playerSummaryCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginRight: SPACING.sm,
    borderTopWidth: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 115,
    alignItems: 'center',
  },
  summaryAvatar: {
    fontSize: 20,
  },
  summaryName: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  summaryHcp: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  summaryScoreBox: {
    marginTop: 4,
    alignItems: 'center',
  },
  summaryGrossText: {
    color: COLORS.accentGold,
    fontSize: 11,
    fontWeight: '700',
  },
  summaryNetText: {
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
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
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
    position: 'relative',
  },
  scoreBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  advantageDotIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accentGold,
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
  utilityActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  utilityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  utilityBtnDanger: {
    borderColor: 'rgba(248, 113, 113, 0.3)',
  },
  utilityBtnText: {
    color: COLORS.accentGold,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
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
  legendDotBox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.bgSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendText: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginLeft: 6,
  },
  // Config Form Styles
  configFormContainer: {
    gap: SPACING.md,
  },
  configCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  configSectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 2,
  },
  configSectionSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: SPACING.md,
  },
  formatSelectRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  formatCardBtn: {
    flex: 1,
    backgroundColor: COLORS.bgSubtle,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formatCardBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  formatCardTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 6,
  },
  formatCardTitleActive: {
    color: COLORS.primary,
  },
  formatCardDesc: {
    color: COLORS.textMuted,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
  handicapModeContainer: {
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  handicapModeBtn: {
    backgroundColor: COLORS.bgSubtle,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  handicapModeBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  handicapModeText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  handicapModeTextActive: {
    color: COLORS.primary,
  },
  handicapModeSubText: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  configHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  addPlayerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addPlayerBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  playerEditCard: {
    backgroundColor: COLORS.bgSubtle,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  playerEditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  playerEditTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  playerEditFieldsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputFieldGroup: {
    marginBottom: SPACING.sm,
  },
  inputFieldLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  textInputStyle: {
    backgroundColor: COLORS.bgDark,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: COLORS.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  slopeRatingRow: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  presetChip: {
    backgroundColor: COLORS.bgSubtle,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  presetChipText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  holeEditorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  holeTabToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgDark,
    borderRadius: RADIUS.sm,
    padding: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  holeTabBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  holeTabBtnActive: {
    backgroundColor: COLORS.primaryDark,
  },
  holeTabBtnText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  holeTabBtnTextActive: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  holeEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgSubtle,
    padding: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  holeEditNum: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    width: 60,
  },
  parSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  holeEditSubLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginRight: 4,
  },
  parValBtn: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgDark,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  parValBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryLight,
  },
  parValBtnText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  parValBtnTextActive: {
    color: COLORS.textPrimary,
  },
  hcpInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hcpTextInput: {
    backgroundColor: COLORS.bgDark,
    borderRadius: RADIUS.sm,
    width: 36,
    height: 28,
    textAlign: 'center',
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  saveConfigCTA: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    marginTop: SPACING.sm,
    ...SHADOWS.medium,
  },
  saveConfigCTAText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginRight: 8,
  },
  finalizeRoundBtn: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.accentGold,
    ...SHADOWS.medium,
  },
  finalizeBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  finalizeTrophyCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.accentGold,
  },
  finalizeTextCol: {
    flex: 1,
  },
  finalizeBtnTitle: {
    color: COLORS.accentGold,
    fontSize: 16,
    fontWeight: '800',
  },
  finalizeBtnSub: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
});

