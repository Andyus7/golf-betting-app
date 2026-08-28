import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { FontAwesome5, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../theme/theme';
import {
  DOTS_CATALOG,
  getActiveRoundState,
  subscribeActiveRound,
  addDotEntry,
  removeDotEntry,
  clearDotsLog,
  setBaseDotValue,
  toggleWagerMode,
  setWagerModeStake,
  recordHammerAction,
  recordBBBAction,
  recordWolfAction,
  calculateDotsSettlement,
} from '../data/activeRoundStore';
import {
  WAGER_MODES_CATALOG,
  calculateMatchPlay,
  calculateStrokePlay,
  calculateNassau,
  calculateSkins,
  calculateHammer,
  calculateBingoBangoBongo,
  calculateLasVegas,
  calculateNinePoints,
  calculateWolf,
  calculateMasterSettlement,
} from '../data/wagerEngine';

export default function WagersScreen() {
  // Store reactive state
  const [roundState, setRoundState] = useState(getActiveRoundState());
  const [activeTab, setActiveTab] = useState('modes'); // 'modes' | 'dots' | 'settlement'
  const [modeFilter, setModeFilter] = useState('all'); // 'all' | '1vs1' | 'group'

  // Selected player & hole for quick actions
  const [selectedPlayerId, setSelectedPlayerId] = useState(
    roundState.players[0]?.id || 'p1'
  );
  const [selectedHole, setSelectedHole] = useState(roundState.currentHole || 1);

  // Modals
  const [dotsConfigModalOpen, setDotsConfigModalOpen] = useState(false);
  const [tempDotBaseValue, setTempDotBaseValue] = useState(
    String(roundState.dotsConfig.baseValue)
  );

  const [stakeModalOpen, setStakeModalOpen] = useState(false);
  const [selectedModeForStake, setSelectedModeForStake] = useState(null);
  const [tempStakeValue, setTempStakeValue] = useState('');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState(null);

  // Subscribe to store
  useEffect(() => {
    const unsubscribe = subscribeActiveRound((newState) => {
      setRoundState(newState);
      if (!newState.players.some((p) => p.id === selectedPlayerId)) {
        if (newState.players.length > 0) {
          setSelectedPlayerId(newState.players[0].id);
        }
      }
    });
    return () => unsubscribe();
  }, [selectedPlayerId]);

  useEffect(() => {
    if (roundState.currentHole && selectedHole !== roundState.currentHole) {
      setSelectedHole(roundState.currentHole);
    }
  }, [roundState.currentHole]);

  // Calculations
  const dotsSettlement = useMemo(() => {
    return calculateDotsSettlement();
  }, [roundState]);

  const masterSettlement = useMemo(() => {
    return calculateMasterSettlement(roundState, dotsSettlement);
  }, [roundState, dotsSettlement]);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const activePlayerObj =
    roundState.players.find((p) => p.id === selectedPlayerId) ||
    roundState.players[0];

  const currentHoleObj =
    roundState.holes.find((h) => h.hole === selectedHole) || {
      hole: selectedHole,
      par: 4,
    };

  const isPar3 = currentHoleObj.par === 3;

  // Mode status calculation helpers
  const getModeLiveSummary = (modeId) => {
    const { players, holes, scores, activeWagerModes, hammerLog, bbbLog, wolfLog } = roundState;
    const modeConfig = activeWagerModes[modeId];
    if (!modeConfig || !modeConfig.active) return { active: false, label: 'Inactivo' };

    switch (modeId) {
      case 'matchplay': {
        const res = calculateMatchPlay(players, holes, scores, modeConfig.stake);
        return { active: true, label: res.statusText, detail: `${res.holesPlayed} hoyos jugados` };
      }
      case 'strokeplay': {
        const res = calculateStrokePlay(players, holes, scores, modeConfig.stake);
        return { active: true, label: `$${modeConfig.stake} MXN/golpe`, detail: `${res.holesCounted} hoyos contabilizados` };
      }
      case 'nassau': {
        const res = calculateNassau(players, holes, scores, modeConfig);
        const fText = res.front.played > 0 ? (res.front.lead >= 0 ? `Ida: +${res.front.lead}` : `Ida: -${Math.abs(res.front.lead)}`) : 'Ida: E';
        const bText = res.back.played > 0 ? (res.back.lead >= 0 ? `Vuelta: +${res.back.lead}` : `Vuelta: -${Math.abs(res.back.lead)}`) : 'Vuelta: E';
        return { active: true, label: `${fText} • ${bText}`, detail: `${res.presses.length} Presses activos` };
      }
      case 'skins': {
        const res = calculateSkins(players, holes, scores, modeConfig.stake);
        return { active: true, label: `Skin: $${modeConfig.stake} MXN`, detail: `Pozo Acumulado: ${res.carryover} Skin(s)` };
      }
      case 'hammer': {
        const res = calculateHammer(players, holes, scores, hammerLog, modeConfig.stake);
        return { active: true, label: `Base: $${modeConfig.stake} MXN`, detail: `${res.holeDetails.filter(h => h.hammered).length} Martillos lanzados` };
      }
      case 'bbb': {
        const res = calculateBingoBangoBongo(players, holes, bbbLog, modeConfig.stake);
        return { active: true, label: `$${modeConfig.stake} MXN/punto`, detail: `${bbbLog.length} hoyos con puntos` };
      }
      case 'lasvegas': {
        const res = calculateLasVegas(players, holes, scores, null, modeConfig.stake);
        const ptStr = res.t1PointsTotal >= 0 ? `+${res.t1PointsTotal}` : `${res.t1PointsTotal}`;
        return { active: true, label: `Equipo 1 ${ptStr} pts`, detail: `Regla Flip Activa ($${modeConfig.stake}/pt)` };
      }
      case 'ninepoints':
      case 'splitsixes': {
        const res = calculateNinePoints(players, holes, scores, modeId, modeConfig.stake);
        return { active: true, label: `$${modeConfig.stake} MXN/punto`, detail: 'Reparto estricto por hoyo' };
      }
      case 'wolf': {
        const res = calculateWolf(players, holes, scores, wolfLog, modeConfig.stake);
        const currentWolfIdx = (selectedHole - 1) % (players.length || 4);
        const currentWolf = players[currentWolfIdx];
        return { active: true, label: `Lobo Hoyo ${selectedHole}: ${currentWolf?.shortName || 'P1'}`, detail: `Base: $${modeConfig.stake} MXN` };
      }
      default:
        return { active: true, label: 'Activo' };
    }
  };

  // Quick Dot Add
  const handleAddDotPress = (dot) => {
    if (dot.par3Only && !isPar3) {
      Alert.alert(
        '🟢 Greenie en Hoyo Par 4/5',
        `El Hoyo #${selectedHole} es Par ${currentHoleObj.par}. El Greenie es exclusivo para hoyos Par 3.\n\n¿Deseas registrarlo de todas formas?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Registrar',
            onPress: () => processDotAddition(dot),
          },
        ]
      );
      return;
    }
    processDotAddition(dot);
  };

  const processDotAddition = (dot) => {
    const entry = addDotEntry(selectedPlayerId, dot.id, selectedHole);
    if (entry) {
      const dotVal =
        roundState.dotsConfig.customValues[dot.id] ||
        roundState.dotsConfig.baseValue;
      const sign = dot.category === 'Bonus' ? '+' : '-';
      triggerToast(
        `${dot.icon} ${dot.name} (${sign}$${dotVal} MXN) ➔ ${activePlayerObj.shortName} (Hoyo #${selectedHole})`
      );
    }
  };

  const handleOpenStakeModal = (mode) => {
    const currentStake = roundState.activeWagerModes[mode.id]?.stake || mode.defaultStake;
    setSelectedModeForStake(mode);
    setTempStakeValue(String(currentStake));
    setStakeModalOpen(true);
  };

  const handleSaveStakeModal = () => {
    if (selectedModeForStake) {
      setWagerModeStake(selectedModeForStake.id, tempStakeValue);
      setStakeModalOpen(false);
      triggerToast(`💰 Apuesta de ${selectedModeForStake.name} actualizada a $${tempStakeValue} MXN`);
    }
  };

  const filteredModesCatalog = useMemo(() => {
    if (modeFilter === '1vs1') return WAGER_MODES_CATALOG.filter((m) => m.category === '1vs1');
    if (modeFilter === 'group') return WAGER_MODES_CATALOG.filter((m) => m.category === 'group');
    return WAGER_MODES_CATALOG;
  }, [modeFilter]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Toast Banner */}
      {toastMessage && (
        <View style={styles.toastContainer}>
          <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Navigation Header Tabs */}
      <View style={styles.navTopHeader}>
        <Text style={styles.mainScreenTitle}>Motor de Apuestas & Modos</Text>
        <View style={styles.tabNavContainer}>
          <TouchableOpacity
            style={[styles.tabNavBtn, activeTab === 'modes' && styles.tabNavBtnActive]}
            onPress={() => setActiveTab('modes')}
          >
            <Ionicons name="trophy-outline" size={15} color={activeTab === 'modes' ? COLORS.primary : COLORS.textMuted} />
            <Text style={[styles.tabNavBtnText, activeTab === 'modes' && styles.tabNavBtnTextActive]}>
              Modos de Juego
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabNavBtn, activeTab === 'dots' && styles.tabNavBtnActive]}
            onPress={() => setActiveTab('dots')}
          >
            <Ionicons name="grid-outline" size={15} color={activeTab === 'dots' ? COLORS.primary : COLORS.textMuted} />
            <Text style={[styles.tabNavBtnText, activeTab === 'dots' && styles.tabNavBtnTextActive]}>
              Dots & Trash
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabNavBtn, activeTab === 'settlement' && styles.tabNavBtnActive]}
            onPress={() => setActiveTab('settlement')}
          >
            <Ionicons name="cash-outline" size={15} color={activeTab === 'settlement' ? COLORS.primary : COLORS.textMuted} />
            <Text style={[styles.tabNavBtnText, activeTab === 'settlement' && styles.tabNavBtnTextActive]}>
              Liquidación
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ========================================================================= */}
        {/* TAB 1: MODOS DE JUEGO & ACTIVACIÓN PARALELA                                */}
        {/* ========================================================================= */}
        {activeTab === 'modes' && (
          <>
            {/* Header Description */}
            <View style={styles.modesIntroCard}>
              <View style={styles.modesIntroRow}>
                <Ionicons name="sparkles" size={20} color={COLORS.accentGold} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.modesIntroTitle}>Motor Multi-Modo en Paralelo</Text>
                  <Text style={styles.modesIntroDesc}>
                    Activa uno o varios modos simultáneamente. Cada modo calcula automáticamente en tiempo real sobre los scores ingresados en la tarjeta.
                  </Text>
                </View>
              </View>

              {/* Mode Filter Pills */}
              <View style={styles.filterPillRow}>
                <TouchableOpacity
                  style={[styles.filterPill, modeFilter === 'all' && styles.filterPillActive]}
                  onPress={() => setModeFilter('all')}
                >
                  <Text style={[styles.filterPillText, modeFilter === 'all' && styles.filterPillTextActive]}>
                    Todos ({WAGER_MODES_CATALOG.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.filterPill, modeFilter === '1vs1' && styles.filterPillActive]}
                  onPress={() => setModeFilter('1vs1')}
                >
                  <Text style={[styles.filterPillText, modeFilter === '1vs1' && styles.filterPillTextActive]}>
                    🥊 Mano a Mano (1vs1)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.filterPill, modeFilter === 'group' && styles.filterPillActive]}
                  onPress={() => setModeFilter('group')}
                >
                  <Text style={[styles.filterPillText, modeFilter === 'group' && styles.filterPillTextActive]}>
                    👥 Grupo (2vs2 / 4P)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Catalog of Wager Modes */}
            <View style={styles.catalogList}>
              {filteredModesCatalog.map((mode) => {
                const isActivated = roundState.activeWagerModes[mode.id]?.active || false;
                const summary = getModeLiveSummary(mode.id);
                const currentStake = roundState.activeWagerModes[mode.id]?.stake || mode.defaultStake;

                return (
                  <View
                    key={mode.id}
                    style={[
                      styles.modeCardItem,
                      isActivated && styles.modeCardItemActive,
                    ]}
                  >
                    <View style={styles.modeCardTop}>
                      <View style={styles.modeCardTitleRow}>
                        <View
                          style={[
                            styles.modeIconCircle,
                            isActivated && { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
                          ]}
                        >
                          <Ionicons
                            name={mode.icon}
                            size={18}
                            color={isActivated ? COLORS.primary : COLORS.textMuted}
                          />
                        </View>
                        <View>
                          <Text style={styles.modeCardName}>{mode.name}</Text>
                          <Text style={styles.modeCardBadge}>{mode.badge}</Text>
                        </View>
                      </View>

                      {/* Activation Toggle Switch */}
                      <TouchableOpacity
                        style={[
                          styles.toggleSwitchBtn,
                          isActivated ? styles.toggleSwitchActive : styles.toggleSwitchInactive,
                        ]}
                        onPress={() => {
                          toggleWagerMode(mode.id);
                          triggerToast(
                            !isActivated
                              ? `⚡ Modo ${mode.name} ACTIVADO`
                              : `⚪ Modo ${mode.name} desactivado`
                          );
                        }}
                      >
                        <Text style={styles.toggleSwitchText}>
                          {isActivated ? 'ACTIVO ⚡' : 'DESACTIVADO'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.modeCardDesc}>{mode.description}</Text>

                    {/* Mode Status Footer */}
                    <View style={styles.modeCardFooter}>
                      <View style={styles.liveStatusBox}>
                        <Text style={styles.liveStatusLabel}>Estado en Vivo:</Text>
                        <Text
                          style={[
                            styles.liveStatusValue,
                            isActivated ? { color: COLORS.accentGold } : { color: COLORS.textMuted },
                          ]}
                        >
                          {summary.label}
                        </Text>
                        {summary.detail && (
                          <Text style={styles.liveStatusSub}>{summary.detail}</Text>
                        )}
                      </View>

                      {/* Stake Adjust Button */}
                      <TouchableOpacity
                        style={styles.stakeConfigBtn}
                        onPress={() => handleOpenStakeModal(mode)}
                      >
                        <Text style={styles.stakeConfigBtnText}>
                          ${currentStake} MXN
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: BOTONERA RÁPIDA DOTS & TRASH                                      */}
        {/* ========================================================================= */}
        {activeTab === 'dots' && (
          <>
            <View style={styles.dotsHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Botonera Rápida: Dots & Trash</Text>
                <Text style={styles.sectionSubtitle}>
                  Asignación vinculada a la tarjeta activa
                </Text>
              </View>
              <TouchableOpacity
                style={styles.configBtn}
                onPress={() => {
                  setTempDotBaseValue(String(roundState.dotsConfig.baseValue));
                  setDotsConfigModalOpen(true);
                }}
              >
                <Ionicons name="settings-outline" size={14} color={COLORS.accentGold} />
                <Text style={styles.configBtnText}>
                  ${roundState.dotsConfig.baseValue} MXN/dot
                </Text>
              </TouchableOpacity>
            </View>

            {/* Hole Selector Strip */}
            <Text style={styles.subLabel}>1. Selecciona el Hoyo:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.holeSelectorScroll}>
              {roundState.holes.map((h) => {
                const isSel = h.hole === selectedHole;
                const hIsPar3 = h.par === 3;
                return (
                  <TouchableOpacity
                    key={h.hole}
                    style={[
                      styles.holePill,
                      isSel && styles.holePillSelected,
                      hIsPar3 && !isSel && styles.holePillPar3,
                    ]}
                    onPress={() => setSelectedHole(h.hole)}
                  >
                    <Text style={[styles.holePillNum, isSel && styles.holePillNumSelected]}>
                      H#{h.hole}
                    </Text>
                    <View style={[styles.parTag, hIsPar3 && { backgroundColor: 'rgba(16, 185, 129, 0.3)' }]}>
                      <Text style={[styles.parTagText, hIsPar3 && { color: COLORS.primaryLight, fontWeight: '800' }]}>
                        P{h.par}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Player Selector Bar */}
            <Text style={styles.subLabel}>2. Selecciona el Jugador:</Text>
            <View style={styles.playerSelectorRow}>
              {roundState.players.map((p) => {
                const isSel = p.id === selectedPlayerId;
                const pBal =
                  dotsSettlement.playerBalances.find((item) => item.id === p.id)?.netBalance || 0;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.playerTab, isSel && styles.playerTabSelected]}
                    onPress={() => setSelectedPlayerId(p.id)}
                  >
                    <Text style={styles.playerTabAvatar}>{p.avatar}</Text>
                    <View>
                      <Text style={[styles.playerTabText, isSel && styles.playerTabTextSelected]}>
                        {p.shortName}
                      </Text>
                      <Text
                        style={[
                          styles.playerTabBal,
                          { color: pBal >= 0 ? COLORS.positiveMoney : COLORS.negativeMoney },
                        ]}
                      >
                        {pBal >= 0 ? `+$${pBal}` : `-$${Math.abs(pBal)}`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Context Banner */}
            <View style={styles.activeContextBanner}>
              <Text style={styles.activeContextText}>
                Asignando a <Text style={styles.activeContextHighlight}>{activePlayerObj?.shortName}</Text> en <Text style={styles.activeContextHighlight}>Hoyo #{selectedHole} (Par {currentHoleObj.par})</Text>
              </Text>
            </View>

            {/* Premios Grid */}
            <View style={styles.gridSectionHeader}>
              <Text style={styles.gridCategoryTitle}>🌟 PREMIOS (BONUSES)</Text>
            </View>
            <View style={styles.dotsGrid}>
              {DOTS_CATALOG.filter((d) => d.category === 'Bonus').map((dot) => {
                const customVal = roundState.dotsConfig.customValues[dot.id] || roundState.dotsConfig.baseValue;
                const isDisabledPar3 = dot.par3Only && !isPar3;

                return (
                  <TouchableOpacity
                    key={dot.id}
                    style={[
                      styles.dotButton,
                      styles.bonusDotButton,
                      isDisabledPar3 && styles.dotButtonDisabled,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => handleAddDotPress(dot)}
                  >
                    <View style={styles.dotBtnTopRow}>
                      <Text style={styles.dotIcon}>{dot.icon}</Text>
                      <View style={styles.bonusTag}>
                        <Text style={styles.bonusTagText}>+${customVal}</Text>
                      </View>
                    </View>
                    <Text style={styles.dotName}>{dot.name}</Text>
                    <Text style={styles.dotDesc} numberOfLines={1}>{dot.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Castigos Grid */}
            <View style={styles.gridSectionHeader}>
              <Text style={[styles.gridCategoryTitle, { color: COLORS.negativeMoney }]}>
                ⚠️ CASTIGOS (TRASH & SNAKE)
              </Text>
            </View>
            <View style={styles.dotsGrid}>
              {DOTS_CATALOG.filter((d) => d.category === 'Castigo').map((dot) => {
                const customVal = roundState.dotsConfig.customValues[dot.id] || roundState.dotsConfig.baseValue;

                return (
                  <TouchableOpacity
                    key={dot.id}
                    style={[styles.dotButton, styles.penaltyDotButton]}
                    activeOpacity={0.7}
                    onPress={() => handleAddDotPress(dot)}
                  >
                    <View style={styles.dotBtnTopRow}>
                      <Text style={styles.dotIcon}>{dot.icon}</Text>
                      <View style={styles.penaltyTag}>
                        <Text style={styles.penaltyTagText}>
                          {dot.isSnake ? `-$${customVal} c/u` : `-$${customVal}`}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.dotName}>{dot.name}</Text>
                    <Text style={styles.dotDesc} numberOfLines={1}>{dot.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Snake Carryover Card */}
            <View style={styles.snakeCard}>
              <View style={styles.snakeHeaderRow}>
                <View style={styles.snakeTitleRow}>
                  <Text style={styles.snakeIcon}>🐍</Text>
                  <View>
                    <Text style={styles.snakeTitle}>Estado de Serpiente (Snake Carryover)</Text>
                    <Text style={styles.snakeSub}>Acumulativo de 3-Putts</Text>
                  </View>
                </View>
                <View style={styles.snakeCountBadge}>
                  <Text style={styles.snakeCountText}>
                    {dotsSettlement.snakeInfo.count} {dotsSettlement.snakeInfo.count === 1 ? 'Snake' : 'Snakes'}
                  </Text>
                </View>
              </View>

              {dotsSettlement.snakeInfo.count > 0 ? (
                <View style={styles.snakeHolderBox}>
                  <Text style={styles.snakeHolderLabel}>Infractor Actual (Portador):</Text>
                  <View style={styles.snakeHolderRow}>
                    <Text style={styles.snakeHolderAvatar}>{dotsSettlement.snakeInfo.holder?.avatar}</Text>
                    <Text style={styles.snakeHolderName}>{dotsSettlement.snakeInfo.holder?.name}</Text>
                    <View style={styles.snakeDebtTag}>
                      <Text style={styles.snakeDebtText}>
                        Debe ${dotsSettlement.snakeInfo.totalPerOtherPlayer} MXN a c/jugador
                      </Text>
                    </View>
                  </View>
                </View>
              ) : (
                <Text style={styles.snakeEmptyText}>
                  Sin serpientes registradas aún en esta ronda.
                </Text>
              )}
            </View>

            {/* Dots Event Log */}
            <View style={styles.feedHeaderRow}>
              <Text style={styles.sectionTitle}>Historial de Dots</Text>
              {roundState.dotsLog.length > 0 && (
                <TouchableOpacity onPress={() => clearDotsLog()}>
                  <Text style={styles.clearAllText}>Borrar Historial</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.feedCard}>
              {roundState.dotsLog.length > 0 ? (
                roundState.dotsLog.map((item) => (
                  <View key={item.id} style={styles.feedRow}>
                    <View style={styles.feedLeft}>
                      <Text style={styles.feedIcon}>{item.icon}</Text>
                      <View>
                        <Text style={styles.feedText}>
                          <Text style={styles.feedPlayer}>{item.playerShortName}</Text>{' '}
                          registró <Text style={styles.feedDot}>{item.dotName}</Text>
                        </Text>
                        <Text style={styles.feedHole}>Hoyo #{item.hole} • {item.timestamp}</Text>
                      </View>
                    </View>

                    <TouchableOpacity style={styles.undoBtn} onPress={() => removeDotEntry(item.id)}>
                      <Ionicons name="trash-outline" size={14} color={COLORS.negativeMoney} />
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <Text style={styles.feedEmptyText}>Sin eventos de Dots aún.</Text>
              )}
            </View>
          </>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: LIQUIDACIÓN FINANCIERA EN TIEMPO REAL                                */}
        {/* ========================================================================= */}
        {activeTab === 'settlement' && (
          <>
            <View style={styles.settlementHeaderCard}>
              <Ionicons name="cash-outline" size={24} color={COLORS.primary} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.settlementTitle}>Matriz de Cobros & Pagos Consolidada</Text>
                <Text style={styles.settlementSub}>
                  Suma acumulada en vivo de todos los Modos de Juego activos + Dots.
                </Text>
              </View>
            </View>

            {/* Individual Net Total Balances */}
            <Text style={styles.sectionTitle}>Balance Neto Total por Jugador</Text>
            <View style={styles.masterBalancesList}>
              {masterSettlement.masterPlayerBalances.map((p) => {
                const isPos = p.netBalance >= 0;
                return (
                  <View key={p.id} style={styles.masterBalanceCard}>
                    <View style={styles.masterBalanceMain}>
                      <Text style={styles.masterAvatar}>{p.avatar}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.masterName}>{p.name}</Text>
                        <View style={styles.breakdownBadgesRow}>
                          {Object.entries(p.breakdown).map(([modeKey, val]) => {
                            if (val === 0) return null;
                            return (
                              <View key={modeKey} style={styles.modeBreakdownTag}>
                                <Text style={styles.modeBreakdownText}>
                                  {modeKey.toUpperCase()}: {val >= 0 ? `+$${val}` : `-$${Math.abs(val)}`}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                      <Text
                        style={[
                          styles.masterNetValue,
                          { color: isPos ? COLORS.positiveMoney : COLORS.negativeMoney },
                        ]}
                      >
                        {isPos ? `+$${p.netBalance}` : `-$${Math.abs(p.netBalance)}`} MXN
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Final Pairwise Transfers */}
            <View style={styles.pairwiseCard}>
              <Text style={styles.pairwiseTitle}>
                📜 Transferencias Finales ("Quién le debe a quién")
              </Text>

              {masterSettlement.pairwiseSettlements.length > 0 ? (
                masterSettlement.pairwiseSettlements.map((item, idx) => (
                  <View key={idx} style={styles.pairwiseRow}>
                    <View style={styles.pairwiseParty}>
                      <Text style={styles.pairwiseAvatar}>{item.debtorAvatar}</Text>
                      <Text style={styles.pairwiseName}>{item.debtorName}</Text>
                    </View>

                    <View style={styles.pairwiseArrowCol}>
                      <Text style={styles.pairwiseAmount}>${item.amount} MXN</Text>
                      <Text style={styles.pairwiseArrowText}>────────►</Text>
                    </View>

                    <View style={styles.pairwiseParty}>
                      <Text style={styles.pairwiseAvatar}>{item.creditorAvatar}</Text>
                      <Text style={styles.pairwiseName}>{item.creditorName}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.pairwiseEmpty}>
                  Sin deudas acumuladas. ¡Todos los balances están en $0 MXN!
                </Text>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Stake Value Modal */}
      <Modal visible={stakeModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Ajustar Apuesta: {selectedModeForStake?.name}</Text>
            <Text style={styles.modalSubtitle}>{selectedModeForStake?.unitLabel}</Text>

            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={tempStakeValue}
              onChangeText={setTempStakeValue}
              placeholder="Ej. 100"
              placeholderTextColor={COLORS.textMuted}
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setStakeModalOpen(false)}>
                <Text style={styles.modalCancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveStakeModal}>
                <Text style={styles.modalSaveBtnText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Dots Base Value Modal */}
      <Modal visible={dotsConfigModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Configurar Valor Monetario por Dot</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={tempDotBaseValue}
              onChangeText={setTempDotBaseValue}
              placeholder="50"
              placeholderTextColor={COLORS.textMuted}
            />
            <View style={styles.modalActionsRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setDotsConfigModalOpen(false)}>
                <Text style={styles.modalCancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={() => {
                  setBaseDotValue(tempDotBaseValue);
                  setDotsConfigModalOpen(false);
                  triggerToast(`💰 Valor base de Dot actualizado a $${tempDotBaseValue} MXN`);
                }}
              >
                <Text style={styles.modalSaveBtnText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  toastContainer: {
    position: 'absolute',
    top: 10, left: 16, right: 16, zIndex: 999,
    backgroundColor: COLORS.bgSubtle, borderRadius: RADIUS.md,
    paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1,
    borderColor: COLORS.primary, flexDirection: 'row', alignItems: 'center',
    ...SHADOWS.large,
  },
  toastText: { color: COLORS.textPrimary, fontSize: 12, fontWeight: '700', marginLeft: 8, flex: 1 },
  navTopHeader: { paddingHorizontal: SPACING.md, paddingTop: SPACING.sm, paddingBottom: SPACING.xs },
  mainScreenTitle: { color: COLORS.textPrimary, fontSize: 22, fontWeight: '800', marginBottom: 8 },
  tabNavContainer: { flexDirection: 'row', backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, padding: 3, borderWidth: 1, borderColor: COLORS.border },
  tabNavBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: RADIUS.sm },
  tabNavBtnActive: { backgroundColor: COLORS.bgSubtle, borderWidth: 1, borderColor: COLORS.primary },
  tabNavBtnText: { color: COLORS.textMuted, fontSize: 11, fontWeight: '600', marginLeft: 4 },
  tabNavBtnTextActive: { color: COLORS.textPrimary, fontWeight: '800' },
  scrollContent: { padding: SPACING.md, paddingBottom: SPACING.xl },
  modesIntroCard: { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.medium },
  modesIntroRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xs },
  modesIntroTitle: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '700' },
  modesIntroDesc: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 16 },
  filterPillRow: { flexDirection: 'row', marginTop: SPACING.xs },
  filterPill: { backgroundColor: COLORS.bgDark, paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.sm, marginRight: 6, borderWidth: 1, borderColor: COLORS.border },
  filterPillActive: { borderColor: COLORS.accentGold, backgroundColor: 'rgba(245, 158, 11, 0.15)' },
  filterPillText: { color: COLORS.textMuted, fontSize: 10, fontWeight: '600' },
  filterPillTextActive: { color: COLORS.accentGold, fontWeight: '800' },
  catalogList: { marginBottom: SPACING.md },
  modeCardItem: { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  modeCardItemActive: { borderColor: COLORS.primary, backgroundColor: 'rgba(16, 185, 129, 0.04)' },
  modeCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  modeCardTitleRow: { flexDirection: 'row', alignItems: 'center' },
  modeIconCircle: { width: 32, height: 32, borderRadius: RADIUS.sm, backgroundColor: 'rgba(255, 255, 255, 0.05)', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  modeCardName: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '700' },
  modeCardBadge: { color: COLORS.accentGold, fontSize: 10, fontWeight: '600' },
  toggleSwitchBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.sm, borderWidth: 1 },
  toggleSwitchActive: { backgroundColor: 'rgba(16, 185, 129, 0.2)', borderColor: COLORS.primary },
  toggleSwitchInactive: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: COLORS.border },
  toggleSwitchText: { fontSize: 10, fontWeight: '800', color: COLORS.textPrimary },
  modeCardDesc: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 16, marginBottom: SPACING.xs },
  modeCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.05)' },
  liveStatusBox: { flex: 1 },
  liveStatusLabel: { color: COLORS.textMuted, fontSize: 10 },
  liveStatusValue: { fontSize: 12, fontWeight: '700' },
  liveStatusSub: { color: COLORS.textMuted, fontSize: 9 },
  stakeConfigBtn: { backgroundColor: 'rgba(245, 158, 11, 0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)' },
  stakeConfigBtnText: { color: COLORS.accentGold, fontSize: 11, fontWeight: '800' },
  dotsHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
  configBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245, 158, 11, 0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)' },
  configBtnText: { color: COLORS.accentGold, fontSize: 12, fontWeight: '700', marginLeft: 4 },
  sectionTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700', marginTop: SPACING.xs, marginBottom: SPACING.xs },
  sectionSubtitle: { color: COLORS.textMuted, fontSize: 12 },
  subLabel: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600', marginTop: 4, marginBottom: 4 },
  holeSelectorScroll: { marginBottom: SPACING.sm },
  holePill: { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, paddingHorizontal: 10, paddingVertical: 6, marginRight: 6, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', minWidth: 44 },
  holePillSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.bgSubtle },
  holePillPar3: { borderColor: 'rgba(16, 185, 129, 0.4)' },
  holePillNum: { color: COLORS.textMuted, fontSize: 11, fontWeight: '600' },
  holePillNumSelected: { color: COLORS.primary, fontWeight: '800' },
  parTag: { backgroundColor: 'rgba(255, 255, 255, 0.06)', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, marginTop: 2 },
  parTagText: { color: COLORS.textMuted, fontSize: 9 },
  playerSelectorRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xs },
  playerTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, paddingVertical: 8, marginHorizontal: 3, borderWidth: 1, borderColor: COLORS.border },
  playerTabSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.bgSubtle },
  playerTabAvatar: { fontSize: 16, marginRight: 6 },
  playerTabText: { color: COLORS.textMuted, fontSize: 12, fontWeight: '600' },
  playerTabTextSelected: { color: COLORS.textPrimary, fontWeight: '700' },
  playerTabBal: { fontSize: 10, fontWeight: '800' },
  activeContextBanner: { backgroundColor: 'rgba(255, 255, 255, 0.04)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.sm, marginBottom: SPACING.md, alignItems: 'center' },
  activeContextText: { color: COLORS.textSecondary, fontSize: 12 },
  activeContextHighlight: { color: COLORS.textPrimary, fontWeight: '700' },
  gridSectionHeader: { marginBottom: 6, marginTop: 4 },
  gridCategoryTitle: { color: COLORS.positiveMoney, fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  dotsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: SPACING.md },
  dotButton: { width: '48%', backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, padding: SPACING.sm, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  bonusDotButton: { borderLeftWidth: 4, borderLeftColor: COLORS.primary },
  penaltyDotButton: { borderLeftWidth: 4, borderLeftColor: COLORS.negativeMoney },
  dotButtonDisabled: { opacity: 0.5 },
  dotBtnTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  dotIcon: { fontSize: 18 },
  bonusTag: { backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.sm },
  bonusTagText: { color: COLORS.positiveMoney, fontSize: 11, fontWeight: '800' },
  penaltyTag: { backgroundColor: 'rgba(239, 68, 68, 0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.sm },
  penaltyTagText: { color: COLORS.negativeMoney, fontSize: 11, fontWeight: '800' },
  dotName: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '700' },
  dotDesc: { color: COLORS.textMuted, fontSize: 10, marginTop: 2 },
  snakeCard: { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.4)' },
  snakeHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  snakeTitleRow: { flexDirection: 'row', alignItems: 'center' },
  snakeIcon: { fontSize: 24, marginRight: 8 },
  snakeTitle: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '700' },
  snakeSub: { color: COLORS.negativeMoney, fontSize: 11 },
  snakeCountBadge: { backgroundColor: 'rgba(239, 68, 68, 0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.sm },
  snakeCountText: { color: COLORS.negativeMoney, fontSize: 12, fontWeight: '800' },
  snakeHolderBox: { marginTop: SPACING.xs, paddingTop: SPACING.xs, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.06)' },
  snakeHolderLabel: { color: COLORS.textMuted, fontSize: 11 },
  snakeHolderRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  snakeHolderAvatar: { fontSize: 16, marginRight: 6 },
  snakeHolderName: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '700', marginRight: 8 },
  snakeDebtTag: { backgroundColor: 'rgba(245, 158, 11, 0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.sm },
  snakeDebtText: { color: COLORS.accentGold, fontSize: 11, fontWeight: '700' },
  snakeEmptyText: { color: COLORS.textMuted, fontSize: 11, marginTop: SPACING.xs },
  feedHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  clearAllText: { color: COLORS.negativeMoney, fontSize: 11, fontWeight: '700' },
  feedCard: { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  feedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.04)' },
  feedLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  feedIcon: { fontSize: 18, marginRight: 8 },
  feedText: { color: COLORS.textSecondary, fontSize: 12 },
  feedPlayer: { color: COLORS.textPrimary, fontWeight: '700' },
  feedDot: { color: COLORS.accentGold, fontWeight: '700' },
  feedHole: { color: COLORS.textMuted, fontSize: 10 },
  undoBtn: { padding: 4 },
  feedEmptyText: { color: COLORS.textMuted, fontSize: 12, textAlign: 'center' },
  settlementHeaderCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.medium },
  settlementTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '800' },
  settlementSub: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  masterBalancesList: { marginBottom: SPACING.md },
  masterBalanceCard: { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.xs, borderWidth: 1, borderColor: COLORS.border },
  masterBalanceMain: { flexDirection: 'row', alignItems: 'center' },
  masterAvatar: { fontSize: 20, marginRight: 10 },
  masterName: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '700' },
  breakdownBadgesRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  modeBreakdownTag: { backgroundColor: 'rgba(255, 255, 255, 0.06)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.sm, marginRight: 4, marginBottom: 2 },
  modeBreakdownText: { color: COLORS.textMuted, fontSize: 9, fontWeight: '700' },
  masterNetValue: { fontSize: 15, fontWeight: '800' },
  pairwiseCard: { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  pairwiseTitle: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '700', marginBottom: SPACING.xs },
  pairwiseRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: RADIUS.sm, padding: SPACING.xs, marginVertical: 4 },
  pairwiseParty: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  pairwiseAvatar: { fontSize: 14, marginRight: 4 },
  pairwiseName: { color: COLORS.textPrimary, fontSize: 12, fontWeight: '600' },
  pairwiseArrowCol: { alignItems: 'center', paddingHorizontal: 8 },
  pairwiseAmount: { color: COLORS.accentGold, fontSize: 12, fontWeight: '800' },
  pairwiseArrowText: { color: COLORS.textMuted, fontSize: 10 },
  pairwiseEmpty: { color: COLORS.textMuted, fontSize: 12, textAlign: 'center', marginVertical: SPACING.xs },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.75)', justifyContent: 'center', alignItems: 'center', padding: SPACING.md },
  modalCard: { width: '100%', backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.large },
  modalTitle: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '800', marginBottom: 4 },
  modalSubtitle: { color: COLORS.textSecondary, fontSize: 12, marginBottom: SPACING.md },
  modalInput: { backgroundColor: COLORS.bgDark, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, color: COLORS.textPrimary, fontSize: 16, fontWeight: '700', paddingHorizontal: 12, paddingVertical: 10, marginBottom: SPACING.md },
  modalActionsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  modalCancelBtn: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: RADIUS.md, paddingVertical: 12, alignItems: 'center', marginRight: 6 },
  modalCancelBtnText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600' },
  modalSaveBtn: { flex: 1, backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 12, alignItems: 'center', marginLeft: 6 },
  modalSaveBtnText: { color: '#000', fontSize: 14, fontWeight: '800' },
});
