// ============================================================================
// GOLF WAGER CALCULATION ENGINE (MOTOR DE CÁLCULO DE APUESTAS DE GOLF)
// Real-time calculation engine for 1vs1 & Group Wager Modes
// ============================================================================

export const WAGER_MODES_CATALOG = [
  // --------------------------------------------------------------------------
  // BLOCK 1: MODOS MANO A MANO (1vs1 DUELOS DIRECTOS)
  // --------------------------------------------------------------------------
  {
    id: 'matchplay',
    name: 'Match Play 1vs1',
    category: '1vs1',
    icon: 'trophy-outline',
    badge: 'Duelo Directo',
    description: 'Conteo hoyo por hoyo (Up / Down / Halved) con cálculo de dormie y cierre de partido cuando la ventaja es irrecuperable.',
    defaultStake: 500,
    unitLabel: '$ MXN por partido',
    minPlayers: 2,
    maxPlayers: 2,
  },
  {
    id: 'strokeplay',
    name: 'Stroke Play (Medalla)',
    category: '1vs1',
    icon: 'analytics-outline',
    badge: 'Diferencial Golpes',
    description: 'Apuesta fija por cada golpe de diferencia total al finalizar los 18 hoyos (bruto o neto).',
    defaultStake: 20,
    unitLabel: '$ MXN por golpe de diff',
    minPlayers: 2,
    maxPlayers: 4,
  },
  {
    id: 'nassau',
    name: 'Nassau 1vs1 / 2vs2',
    category: '1vs1',
    icon: 'golf-outline',
    badge: '3 Apuestas + Presses',
    description: 'Tres apuestas independientes: Ida (1-9), Vuelta (10-18) y Total (1-18) con opción de Presses manuales y automáticos al quedar 2 abajo.',
    defaultStake: 200,
    unitLabel: '$ MXN por segmento',
    minPlayers: 2,
    maxPlayers: 4,
  },
  {
    id: 'skins',
    name: 'Skins (Pozo Acumulado)',
    category: '1vs1',
    icon: 'flame-outline',
    badge: 'Carryover Directo',
    description: 'El hoyo lo gana en exclusiva el score más bajo único. Si hay empate, la bolsa se acumula (carryover) para el siguiente hoyo.',
    defaultStake: 50,
    unitLabel: '$ MXN por Skin',
    minPlayers: 2,
    maxPlayers: 4,
  },
  {
    id: 'hammer',
    name: 'The Hammer (El Martillo)',
    category: '1vs1',
    icon: 'hammer-outline',
    badge: 'Doble o Nada',
    description: 'Apuesta base por hoyo que cualquiera de los dos jugadores puede doblar (Hammer) antes de un tiro crucial; el rival acepta o concede.',
    defaultStake: 50,
    unitLabel: '$ MXN base por hoyo',
    minPlayers: 2,
    maxPlayers: 2,
  },
  {
    id: 'bbb',
    name: 'Bingo Bango Bongo',
    category: '1vs1',
    icon: 'ribbon-outline',
    badge: '3 Pts por Hoyo',
    description: '1 pt por el 1° en green (Bingo), 1 pt por el más cercano a bandera en green (Bango) y 1 pt por el 1° en embocar (Bongo).',
    defaultStake: 10,
    unitLabel: '$ MXN por punto',
    minPlayers: 2,
    maxPlayers: 4,
  },

  // --------------------------------------------------------------------------
  // BLOCK 2: MODOS DE GRUPO Y EQUIPOS (3 A 4 JUGADORES)
  // --------------------------------------------------------------------------
  {
    id: 'lasvegas',
    name: 'Las Vegas (2vs2)',
    category: 'group',
    icon: 'dice-outline',
    badge: 'Cifras & Flip',
    description: 'Formación de cifras de dos dígitos por equipo. Regla del "Flip" inverso si un equipo hace bogey/peor y el rival hace par/birdie.',
    defaultStake: 10,
    unitLabel: '$ MXN por punto diff',
    minPlayers: 4,
    maxPlayers: 4,
  },
  {
    id: 'ninepoints',
    name: '9-Points (5-3-1)',
    category: 'group',
    icon: 'grid-outline',
    badge: '3 Jugadores',
    description: 'Reparto estricto de 9 puntos por hoyo (5 al 1°, 3 al 2°, 1 al 3°) con combinaciones de empates y cálculo contra el promedio.',
    defaultStake: 10,
    unitLabel: '$ MXN por punto',
    minPlayers: 3,
    maxPlayers: 3,
  },
  {
    id: 'splitsixes',
    name: 'Split Sixes (6-Point)',
    category: 'group',
    icon: 'layers-outline',
    badge: '3 Jugadores',
    description: 'Reparto estricto de 6 puntos por hoyo (4-2-0, 3-3-0, 4-1-1, 2-2-2 o 6-0-0 por birdie sweep).',
    defaultStake: 15,
    unitLabel: '$ MXN por punto',
    minPlayers: 3,
    maxPlayers: 3,
  },
  {
    id: 'wolf',
    name: 'Wolf (El Lobo)',
    category: 'group',
    icon: 'paw-outline',
    badge: 'Estratégico 4P',
    description: 'Rotación del Lobo por hoyo, selección de pareja tras los drives o "Lobo Solitario" con multiplicador x3 (o Lobo Ciego x4).',
    defaultStake: 50,
    unitLabel: '$ MXN base por hoyo',
    minPlayers: 4,
    maxPlayers: 4,
  },
];

// Helper to calculate net score for a player on a hole
export const getPlayerNetScore = (scores, holeNum, playerId, holes, playerStrokesInfo) => {
  const gross = scores[holeNum]?.[playerId];
  if (!gross || gross <= 0) return null;

  const holeObj = holes.find((h) => h.hole === holeNum);
  if (!holeObj) return gross;

  const pInfo = playerStrokesInfo?.[playerId];
  if (!pInfo || pInfo.advantageStrokes <= 0) return gross;

  const totalAdv = pInfo.advantageStrokes;
  const baseStrokes = Math.floor(totalAdv / 18);
  const extraStrokes = totalAdv % 18;

  let strokes = baseStrokes;
  if (holeObj.hcp <= extraStrokes) {
    strokes += 1;
  }
  return Math.max(1, gross - strokes);
};

// ----------------------------------------------------------------------------
// 1. MATCH PLAY 1vs1 ENGINE
// ----------------------------------------------------------------------------
export const calculateMatchPlay = (players, holes, scores, stake = 500, playerStrokesInfo = {}) => {
  if (players.length < 2) return { status: 'Requiere 2 jugadores', p1Lead: 0, closed: false, balances: {} };

  const p1 = players[0];
  const p2 = players[1];

  let p1Lead = 0; // Positive = P1 UP, Negative = P2 UP
  let holesPlayed = 0;
  let closedHole = null;
  let winReason = '';
  const holeDetails = [];

  for (const h of holes) {
    const s1 = getPlayerNetScore(scores, h.hole, p1.id, holes, playerStrokesInfo);
    const s2 = getPlayerNetScore(scores, h.hole, p2.id, holes, playerStrokesInfo);

    if (s1 === null || s2 === null) break; // Stop at first unplayed hole

    holesPlayed++;
    let result = 'HALVED';
    if (s1 < s2) {
      p1Lead++;
      result = `${p1.shortName} WIN`;
    } else if (s2 < s1) {
      p1Lead--;
      result = `${p2.shortName} WIN`;
    }

    const holesRemaining = 18 - holesPlayed;
    const absLead = Math.abs(p1Lead);

    let currentStatus = 'AS';
    if (p1Lead > 0) currentStatus = `${p1.shortName} +${p1Lead}`;
    if (p1Lead < 0) currentStatus = `${p2.shortName} +${absLead}`;

    holeDetails.push({
      hole: h.hole,
      s1,
      s2,
      result,
      statusAfter: currentStatus,
    });

    // Check match closure condition (lead > holes remaining)
    if (absLead > holesRemaining && !closedHole) {
      closedHole = h.hole;
      const winnerName = p1Lead > 0 ? p1.shortName : p2.shortName;
      winReason = `${winnerName} ganó ${absLead} & ${holesRemaining}`;
      break;
    }
  }

  const holesRemaining = 18 - holesPlayed;
  const absLead = Math.abs(p1Lead);

  let statusText = 'AS (Empatados)';
  let isDormie = false;
  let isClosed = !!closedHole || (holesPlayed === 18 && absLead > 0);

  if (p1Lead > 0) {
    statusText = `${p1.shortName} +${p1Lead} UP`;
  } else if (p1Lead < 0) {
    statusText = `${p2.shortName} +${absLead} UP`;
  }

  if (!isClosed && holesPlayed > 0 && absLead > 0 && absLead === holesRemaining) {
    isDormie = true;
    const leader = p1Lead > 0 ? p1.shortName : p2.shortName;
    statusText = `${leader} +${absLead} UP (Dormie ${holesRemaining})`;
  }

  if (isClosed) {
    if (closedHole) {
      const leader = p1Lead > 0 ? p1.shortName : p2.shortName;
      statusText = `🏆 ${leader} ganó (${absLead} & ${18 - closedHole})`;
    } else if (absLead > 0) {
      const leader = p1Lead > 0 ? p1.shortName : p2.shortName;
      statusText = `🏆 ${leader} ganó (+${absLead} UP en Hoyo 18)`;
    } else {
      statusText = '🤝 Empate Final (All Square)';
    }
  }

  // Financial payout
  const balances = { [p1.id]: 0, [p2.id]: 0 };
  if (isClosed && absLead > 0) {
    if (p1Lead > 0) {
      balances[p1.id] = stake;
      balances[p2.id] = -stake;
    } else {
      balances[p2.id] = stake;
      balances[p1.id] = -stake;
    }
  }

  return {
    mode: 'matchplay',
    statusText,
    p1Lead,
    holesPlayed,
    isDormie,
    isClosed,
    closedHole,
    winReason,
    holeDetails,
    balances,
    stake,
  };
};

// ----------------------------------------------------------------------------
// 2. STROKE PLAY (MEDALLA) ENGINE
// ----------------------------------------------------------------------------
export const calculateStrokePlay = (players, holes, scores, stakePerStroke = 20, playerStrokesInfo = {}) => {
  const totals = {};
  players.forEach((p) => {
    totals[p.id] = 0;
  });

  let holesCounted = 0;

  for (const h of holes) {
    const holeScores = players.map((p) => getPlayerNetScore(scores, h.hole, p.id, holes, playerStrokesInfo));
    if (holeScores.some((s) => s === null)) break;

    holesCounted++;
    players.forEach((p, idx) => {
      totals[p.id] += holeScores[idx];
    });
  }

  const balances = {};
  players.forEach((p) => {
    balances[p.id] = 0;
  });

  if (holesCounted > 0 && players.length >= 2) {
    if (players.length === 2) {
      const diff = totals[players[0].id] - totals[players[1].id];
      // If diff < 0, P1 has fewer strokes (wins)
      const payout = Math.abs(diff) * stakePerStroke;
      if (diff < 0) {
        balances[players[0].id] = payout;
        balances[players[1].id] = -payout;
      } else if (diff > 0) {
        balances[players[1].id] = payout;
        balances[players[0].id] = -payout;
      }
    } else {
      // Group: pairwise difference against average or relative to each other
      const avg = Object.values(totals).reduce((a, b) => a + b, 0) / players.length;
      players.forEach((p) => {
        const diffFromAvg = Math.round((avg - totals[p.id]) * stakePerStroke);
        balances[p.id] = diffFromAvg;
      });
    }
  }

  return {
    mode: 'strokeplay',
    totals,
    holesCounted,
    balances,
    stakePerStroke,
  };
};

// ----------------------------------------------------------------------------
// 3. NASSAU ENGINE (FRONT 9, BACK 9, OVERALL 18 + PRESSES)
// ----------------------------------------------------------------------------
export const calculateNassau = (players, holes, scores, config = {}, playerStrokesInfo = {}) => {
  const stake = config.stake || 200;
  const autoPress = config.autoPress !== false;

  if (players.length < 2) return { statusText: 'Requiere 2 jugadores', balances: {} };

  const p1 = players[0];
  const p2 = players[1];

  // Evaluate segment Match Play status
  const evaluateSegment = (startHole, endHole) => {
    let lead = 0;
    let played = 0;
    const segmentHoles = holes.filter((h) => h.hole >= startHole && h.hole <= endHole);

    for (const h of segmentHoles) {
      const s1 = getPlayerNetScore(scores, h.hole, p1.id, holes, playerStrokesInfo);
      const s2 = getPlayerNetScore(scores, h.hole, p2.id, holes, playerStrokesInfo);
      if (s1 === null || s2 === null) break;
      played++;
      if (s1 < s2) lead++;
      else if (s2 < s1) lead--;
    }
    return { lead, played, totalHoles: segmentHoles.length };
  };

  const front = evaluateSegment(1, 9);
  const back = evaluateSegment(10, 18);
  const overall = evaluateSegment(1, 18);

  // Calculate Presses (auto trigger when 2 DOWN)
  const presses = [];
  const checkAutoPresses = (startHole, endHole, segmentName) => {
    let lead = 0;
    const segHoles = holes.filter((h) => h.hole >= startHole && h.hole <= endHole);

    for (const h of segHoles) {
      const s1 = getPlayerNetScore(scores, h.hole, p1.id, holes, playerStrokesInfo);
      const s2 = getPlayerNetScore(scores, h.hole, p2.id, holes, playerStrokesInfo);
      if (s1 === null || s2 === null) break;

      if (s1 < s2) lead++;
      else if (s2 < s1) lead--;

      // If lead reaches +2 or -2, auto press starts on NEXT hole
      if (autoPress && Math.abs(lead) >= 2 && h.hole < endHole) {
        const pressStart = h.hole + 1;
        const exists = presses.some((pr) => pr.startHole === pressStart && pr.segment === segmentName);
        if (!exists) {
          presses.push({
            id: `press_${segmentName}_${pressStart}`,
            segment: segmentName,
            startHole: pressStart,
            endHole,
            triggeredAtHole: h.hole,
            byPlayer: lead < 0 ? p1.shortName : p2.shortName,
          });
        }
      }
    }
  };

  checkAutoPresses(1, 9, 'Front');
  checkAutoPresses(10, 18, 'Back');
  checkAutoPresses(1, 18, 'Overall');

  // Score each active press
  let pressP1Total = 0;
  let pressP2Total = 0;

  presses.forEach((pr) => {
    const res = evaluateSegment(pr.startHole, pr.endHole);
    if (res.played === res.totalHoles && res.lead !== 0) {
      if (res.lead > 0) pressP1Total += stake;
      else pressP2Total += stake;
    }
  });

  // Calculate payouts for 3 main segments
  const balances = { [p1.id]: 0, [p2.id]: 0 };

  const scoreSegmentPayout = (seg) => {
    if (seg.played === seg.totalHoles && seg.lead !== 0) {
      if (seg.lead > 0) {
        balances[p1.id] += stake;
        balances[p2.id] -= stake;
      } else {
        balances[p2.id] += stake;
        balances[p1.id] -= stake;
      }
    }
  };

  scoreSegmentPayout(front);
  scoreSegmentPayout(back);
  scoreSegmentPayout(overall);

  // Add press payouts
  balances[p1.id] += pressP1Total - pressP2Total;
  balances[p2.id] += pressP2Total - pressP1Total;

  return {
    mode: 'nassau',
    front,
    back,
    overall,
    presses,
    balances,
    stake,
  };
};

// ----------------------------------------------------------------------------
// 4. SKINS ENGINE (1vs1 & GRUPAL)
// ----------------------------------------------------------------------------
export const calculateSkins = (players, holes, scores, skinStake = 50, playerStrokesInfo = {}) => {
  const numPlayers = players.length;
  const skinsWon = {};
  const balances = {};

  players.forEach((p) => {
    skinsWon[p.id] = 0;
    balances[p.id] = 0;
  });

  let carryover = 0;
  const holeResults = [];

  for (const h of holes) {
    const holeScores = players.map((p) => ({
      player: p,
      score: getPlayerNetScore(scores, h.hole, p.id, holes, playerStrokesInfo),
    }));

    if (holeScores.some((item) => item.score === null)) break; // Unplayed hole

    // Find lowest score
    const minScore = Math.min(...holeScores.map((item) => item.score));
    const winners = holeScores.filter((item) => item.score === minScore);

    if (winners.length === 1) {
      // Outright winner gets skin(s)
      const winnerPlayer = winners[0].player;
      const skinsInPot = 1 + carryover;
      skinsWon[winnerPlayer.id] += skinsInPot;

      // Payout logic
      if (numPlayers === 2) {
        const potValue = skinsInPot * skinStake;
        balances[winnerPlayer.id] += potValue;
        const loser = players.find((p) => p.id !== winnerPlayer.id);
        balances[loser.id] -= potValue;
      } else {
        // Group: Winner takes skinStake * skinsInPot from EACH other player
        const winAmountPerPlayer = skinsInPot * skinStake;
        balances[winnerPlayer.id] += (numPlayers - 1) * winAmountPerPlayer;
        players.forEach((p) => {
          if (p.id !== winnerPlayer.id) {
            balances[p.id] -= winAmountPerPlayer;
          }
        });
      }

      holeResults.push({
        hole: h.hole,
        winner: winnerPlayer.shortName,
        skinsInPot,
        minScore,
        status: `Gana ${winnerPlayer.shortName} (${skinsInPot} Skin${skinsInPot > 1 ? 's' : ''})`,
      });

      carryover = 0; // Reset carryover
    } else {
      // Tie -> Carryover
      carryover++;
      holeResults.push({
        hole: h.hole,
        winner: null,
        skinsInPot: carryover,
        minScore,
        status: `Empate (${winners.map((w) => w.player.shortName).join(', ')}) -> Acumula ${carryover}`,
      });
    }
  }

  return {
    mode: 'skins',
    skinsWon,
    carryover,
    holeResults,
    balances,
    skinStake,
  };
};

// ----------------------------------------------------------------------------
// 5. THE HAMMER (EL MARTILLO 1vs1) ENGINE
// ----------------------------------------------------------------------------
export const calculateHammer = (players, holes, scores, hammerLog = [], baseStake = 50, playerStrokesInfo = {}) => {
  if (players.length < 2) return { statusText: 'Requiere 2 jugadores', balances: {} };

  const p1 = players[0];
  const p2 = players[1];
  const balances = { [p1.id]: 0, [p2.id]: 0 };

  const holeDetails = [];

  for (const h of holes) {
    const s1 = getPlayerNetScore(scores, h.hole, p1.id, holes, playerStrokesInfo);
    const s2 = getPlayerNetScore(scores, h.hole, p2.id, holes, playerStrokesInfo);
    if (s1 === null || s2 === null) break;

    // Check if hammer action exists for this hole
    const hammerEntry = hammerLog.find((item) => item.hole === h.hole);
    let holeStake = baseStake;
    let winner = null;

    if (hammerEntry) {
      holeStake = baseStake * (hammerEntry.multiplier || 2);
      if (hammerEntry.forfeited) {
        // Opponent conceded
        winner = hammerEntry.hammerBy === p1.id ? p1 : p2;
      }
    }

    if (!winner) {
      if (s1 < s2) winner = p1;
      else if (s2 < s1) winner = p2;
    }

    if (winner) {
      const loser = winner.id === p1.id ? p2 : p1;
      balances[winner.id] += holeStake;
      balances[loser.id] -= holeStake;
    }

    holeDetails.push({
      hole: h.hole,
      stake: holeStake,
      winner: winner ? winner.shortName : 'Empate',
      hammered: !!hammerEntry,
    });
  }

  return {
    mode: 'hammer',
    holeDetails,
    balances,
    baseStake,
  };
};

// ----------------------------------------------------------------------------
// 6. BINGO BANGO BONGO ENGINE
// ----------------------------------------------------------------------------
export const calculateBingoBangoBongo = (players, holes, bbbLog = [], pointStake = 10) => {
  const points = {};
  const balances = {};

  players.forEach((p) => {
    points[p.id] = 0;
    balances[p.id] = 0;
  });

  bbbLog.forEach((entry) => {
    if (entry.bingoPlayerId) points[entry.bingoPlayerId] = (points[entry.bingoPlayerId] || 0) + 1;
    if (entry.bangoPlayerId) points[entry.bangoPlayerId] = (points[entry.bangoPlayerId] || 0) + 1;
    if (entry.bongoPlayerId) points[entry.bongoPlayerId] = (points[entry.bangoPlayerId] || 0) + 1;
  });

  if (players.length >= 2) {
    const avg = Object.values(points).reduce((a, b) => a + b, 0) / players.length;
    players.forEach((p) => {
      balances[p.id] = Math.round((points[p.id] - avg) * pointStake);
    });
  }

  return {
    mode: 'bbb',
    points,
    balances,
    pointStake,
  };
};

// ----------------------------------------------------------------------------
// 7. LAS VEGAS ENGINE (4 JUGADORES / 2vs2 CON REGLA DEL FLIP)
// ----------------------------------------------------------------------------
export const calculateLasVegas = (players, holes, scores, teamsConfig = null, pointValue = 10, playerStrokesInfo = {}) => {
  if (players.length < 4) return { statusText: 'Requiere 4 jugadores (2vs2)', balances: {} };

  // Default teams: Team 1 (P1, P2), Team 2 (P3, P4)
  const team1 = teamsConfig?.team1 || [players[0], players[1]];
  const team2 = teamsConfig?.team2 || [players[2], players[3]];

  const balances = {};
  players.forEach((p) => {
    balances[p.id] = 0;
  });

  let t1PointsTotal = 0;
  let t2PointsTotal = 0;
  const holeDetails = [];

  for (const h of holes) {
    const t1s1 = getPlayerNetScore(scores, h.hole, team1[0].id, holes, playerStrokesInfo);
    const t1s2 = getPlayerNetScore(scores, h.hole, team1[1].id, holes, playerStrokesInfo);
    const t2s1 = getPlayerNetScore(scores, h.hole, team2[0].id, holes, playerStrokesInfo);
    const t2s2 = getPlayerNetScore(scores, h.hole, team2[1].id, holes, playerStrokesInfo);

    if (t1s1 === null || t1s2 === null || t2s1 === null || t2s2 === null) break;

    // Helper to form two-digit score with Flip rule
    const getTeamDigits = (s1, s2, oppMinScore, par) => {
      const sorted = [s1, s2].sort((a, b) => a - b);
      const low = sorted[0];
      const high = sorted[1];

      // Flip Rule: If team has a bogey/worse and opp has birdie/eagle, flip (higher digit first)
      const oppHasBirdie = oppMinScore < par;
      const teamHasBogey = high > par;

      if (teamHasBogey && oppHasBirdie) {
        return high * 10 + low; // Flipped! e.g. 54
      }
      return low * 10 + high; // Standard, e.g. 45
    };

    const t1Min = Math.min(t1s1, t1s2);
    const t2Min = Math.min(t2s1, t2s2);

    const t1ScoreDigits = getTeamDigits(t1s1, t1s2, t2Min, h.par);
    const t2ScoreDigits = getTeamDigits(t2s1, t2s2, t1Min, h.par);

    // Difference in points for this hole
    // Note: In Las Vegas, LOWER two-digit score wins (e.g. 45 beats 54 by 9 points)
    const diff = t2ScoreDigits - t1ScoreDigits; // Positive = Team 1 wins points

    t1PointsTotal += diff;

    holeDetails.push({
      hole: h.hole,
      t1ScoreDigits,
      t2ScoreDigits,
      diff,
    });
  }

  const totalPayout = t1PointsTotal * pointValue;

  // Split payout between team members
  team1.forEach((p) => {
    balances[p.id] = Math.round(totalPayout / 2);
  });
  team2.forEach((p) => {
    balances[p.id] = Math.round(-totalPayout / 2);
  });

  return {
    mode: 'lasvegas',
    team1,
    team2,
    t1PointsTotal,
    holeDetails,
    balances,
    pointValue,
  };
};

// ----------------------------------------------------------------------------
// 8. NINE-POINTS & SPLIT SIXES ENGINE (3 JUGADORES)
// ----------------------------------------------------------------------------
export const calculateNinePoints = (players, holes, scores, modeType = 'ninepoints', pointValue = 10, playerStrokesInfo = {}) => {
  if (players.length < 3) return { statusText: 'Requiere al menos 3 jugadores', balances: {} };

  const pList = players.slice(0, 3);
  const points = {};
  const balances = {};

  pList.forEach((p) => {
    points[p.id] = 0;
    balances[p.id] = 0;
  });

  for (const h of holes) {
    const hScores = pList.map((p) => ({
      player: p,
      score: getPlayerNetScore(scores, h.hole, p.id, holes, playerStrokesInfo),
    }));

    if (hScores.some((item) => item.score === null)) break;

    // Sort by score ascending
    const sorted = [...hScores].sort((a, b) => a.score - b.score);
    const s0 = sorted[0].score;
    const s1 = sorted[1].score;
    const s2 = sorted[2].score;

    if (modeType === 'ninepoints') {
      // 9 Points Matrix (5-3-1)
      if (s0 < s1 && s1 < s2) {
        // Clear 1st, 2nd, 3rd (5-3-1)
        points[sorted[0].player.id] += 5;
        points[sorted[1].player.id] += 3;
        points[sorted[2].player.id] += 1;
      } else if (s0 === s1 && s1 < s2) {
        // Tie for 1st (4-4-1)
        points[sorted[0].player.id] += 4;
        points[sorted[1].player.id] += 4;
        points[sorted[2].player.id] += 1;
      } else if (s0 < s1 && s1 === s2) {
        // Tie for 2nd (5-2-2)
        points[sorted[0].player.id] += 5;
        points[sorted[1].player.id] += 2;
        points[sorted[2].player.id] += 2;
      } else {
        // 3-way tie (3-3-3)
        points[sorted[0].player.id] += 3;
        points[sorted[1].player.id] += 3;
        points[sorted[2].player.id] += 3;
      }
    } else {
      // Split Sixes Matrix (4-2-0)
      if (s0 < s1 && s1 < s2) {
        // Check for Birdie sweep (win by 2+ strokes)
        if (s1 - s0 >= 2) {
          points[sorted[0].player.id] += 6; // 6-0-0
        } else {
          points[sorted[0].player.id] += 4; // 4-2-0
          points[sorted[1].player.id] += 2;
        }
      } else if (s0 === s1 && s1 < s2) {
        // Tie for 1st (3-3-0)
        points[sorted[0].player.id] += 3;
        points[sorted[1].player.id] += 3;
      } else if (s0 < s1 && s1 === s2) {
        // Tie for 2nd (4-1-1)
        points[sorted[0].player.id] += 4;
        points[sorted[1].player.id] += 1;
        points[sorted[2].player.id] += 1;
      } else {
        // 3-way tie (2-2-2)
        points[sorted[0].player.id] += 2;
        points[sorted[1].player.id] += 2;
        points[sorted[2].player.id] += 2;
      }
    }
  }

  const avg = Object.values(points).reduce((a, b) => a + b, 0) / pList.length;
  pList.forEach((p) => {
    balances[p.id] = Math.round((points[p.id] - avg) * pointValue);
  });

  return {
    mode: modeType,
    points,
    balances,
    pointValue,
  };
};

// ----------------------------------------------------------------------------
// 9. WOLF (LOBO - 4 JUGADORES) ENGINE
// ----------------------------------------------------------------------------
export const calculateWolf = (players, holes, scores, wolfLog = [], stake = 50, playerStrokesInfo = {}) => {
  if (players.length < 4) return { statusText: 'Requiere 4 jugadores', balances: {} };

  const balances = {};
  players.forEach((p) => {
    balances[p.id] = 0;
  });

  const holeResults = [];

  for (const h of holes) {
    const holeScores = players.map((p) => ({
      player: p,
      score: getPlayerNetScore(scores, h.hole, p.id, holes, playerStrokesInfo),
    }));

    if (holeScores.some((item) => item.score === null)) break;

    // Wolf rotates: Hole 1 = P1, Hole 2 = P2, Hole 3 = P3, Hole 4 = P4, etc.
    const wolfIdx = (h.hole - 1) % 4;
    const wolfPlayer = players[wolfIdx];

    // Check wolf log entry for partner choice or lone wolf
    const logEntry = wolfLog.find((item) => item.hole === h.hole);
    const isLoneWolf = logEntry?.isLoneWolf || false;
    const partnerId = logEntry?.partnerPlayerId;
    const partner = partnerId ? players.find((p) => p.id === partnerId) : null;

    if (isLoneWolf) {
      // 1 vs 3 Lone Wolf
      const wolfScore = holeScores.find((item) => item.player.id === wolfPlayer.id).score;
      const huntersScores = holeScores.filter((item) => item.player.id !== wolfPlayer.id).map((item) => item.score);
      const minHuntersScore = Math.min(...huntersScores);

      if (wolfScore < minHuntersScore) {
        // Lone Wolf wins! Receives 3x stake (1x from each hunter)
        balances[wolfPlayer.id] += 3 * stake;
        players.forEach((p) => {
          if (p.id !== wolfPlayer.id) balances[p.id] -= stake;
        });
        holeResults.push({ hole: h.hole, wolf: wolfPlayer.shortName, result: 'Gana Lobo Solitario (+3x)' });
      } else {
        // Hunters win! Wolf pays 1x stake to each hunter
        balances[wolfPlayer.id] -= 3 * stake;
        players.forEach((p) => {
          if (p.id !== wolfPlayer.id) balances[p.id] += stake;
        });
        holeResults.push({ hole: h.hole, wolf: wolfPlayer.shortName, result: 'Ganan Cazadores (-3x Lobo)' });
      }
    } else if (partner) {
      // 2 vs 2 Best Ball
      const teamWolf = [wolfPlayer, partner];
      const teamHunters = players.filter((p) => p.id !== wolfPlayer.id && p.id !== partner.id);

      const sWolfTeam = Math.min(
        holeScores.find((item) => item.player.id === wolfPlayer.id).score,
        holeScores.find((item) => item.player.id === partner.id).score
      );
      const sHuntersTeam = Math.min(
        holeScores.find((item) => item.player.id === teamHunters[0].id).score,
        holeScores.find((item) => item.player.id === teamHunters[1].id).score
      );

      if (sWolfTeam < sHuntersTeam) {
        // Wolf team wins
        teamWolf.forEach((p) => (balances[p.id] += stake));
        teamHunters.forEach((p) => (balances[p.id] -= stake));
        holeResults.push({ hole: h.hole, wolf: wolfPlayer.shortName, result: `Gana Lobo & ${partner.shortName}` });
      } else if (sHuntersTeam < sWolfTeam) {
        // Hunters win
        teamWolf.forEach((p) => (balances[p.id] -= stake));
        teamHunters.forEach((p) => (balances[p.id] += stake));
        holeResults.push({ hole: h.hole, wolf: wolfPlayer.shortName, result: 'Ganan Cazadores' });
      } else {
        holeResults.push({ hole: h.hole, wolf: wolfPlayer.shortName, result: 'Empate' });
      }
    } else {
      holeResults.push({ hole: h.hole, wolf: wolfPlayer.shortName, result: 'Sin pareja seleccionada' });
    }
  }

  return {
    mode: 'wolf',
    holeResults,
    balances,
    stake,
  };
};

// ----------------------------------------------------------------------------
// 10. MASTER FINANCIAL SETTLEMENT CALCULATOR
// Combines Dots + All Activated Wager Modes into total balances & pairwise debts!
// ----------------------------------------------------------------------------
export const calculateMasterSettlement = (roundState, dotsSettlement) => {
  const { players, holes, scores, activeWagerModes, playerStrokesInfo } = roundState;

  const totalBalances = {};
  const modeBreakdown = {};

  players.forEach((p) => {
    totalBalances[p.id] = 0;
    modeBreakdown[p.id] = {};
  });

  // 1. Add Dots & Trash settlement
  if (dotsSettlement?.playerBalances) {
    dotsSettlement.playerBalances.forEach((p) => {
      totalBalances[p.id] = (totalBalances[p.id] || 0) + (p.netBalance || 0);
      modeBreakdown[p.id]['dots'] = p.netBalance || 0;
    });
  }

  // 2. Add each active wager mode
  const activeModes = activeWagerModes || {};

  // Match Play 1v1
  if (activeModes.matchplay?.active) {
    const res = calculateMatchPlay(players, holes, scores, activeModes.matchplay.stake || 500, playerStrokesInfo);
    players.forEach((p) => {
      const bal = res.balances?.[p.id] || 0;
      totalBalances[p.id] += bal;
      modeBreakdown[p.id]['matchplay'] = bal;
    });
  }

  // Stroke Play
  if (activeModes.strokeplay?.active) {
    const res = calculateStrokePlay(players, holes, scores, activeModes.strokeplay.stake || 20, playerStrokesInfo);
    players.forEach((p) => {
      const bal = res.balances?.[p.id] || 0;
      totalBalances[p.id] += bal;
      modeBreakdown[p.id]['strokeplay'] = bal;
    });
  }

  // Nassau
  if (activeModes.nassau?.active) {
    const res = calculateNassau(players, holes, scores, activeModes.nassau, playerStrokesInfo);
    players.forEach((p) => {
      const bal = res.balances?.[p.id] || 0;
      totalBalances[p.id] += bal;
      modeBreakdown[p.id]['nassau'] = bal;
    });
  }

  // Skins
  if (activeModes.skins?.active) {
    const res = calculateSkins(players, holes, scores, activeModes.skins.stake || 50, playerStrokesInfo);
    players.forEach((p) => {
      const bal = res.balances?.[p.id] || 0;
      totalBalances[p.id] += bal;
      modeBreakdown[p.id]['skins'] = bal;
    });
  }

  // The Hammer
  if (activeModes.hammer?.active) {
    const res = calculateHammer(players, holes, scores, roundState.hammerLog || [], activeModes.hammer.stake || 50, playerStrokesInfo);
    players.forEach((p) => {
      const bal = res.balances?.[p.id] || 0;
      totalBalances[p.id] += bal;
      modeBreakdown[p.id]['hammer'] = bal;
    });
  }

  // Bingo Bango Bongo
  if (activeModes.bbb?.active) {
    const res = calculateBingoBangoBongo(players, holes, roundState.bbbLog || [], activeModes.bbb.stake || 10);
    players.forEach((p) => {
      const bal = res.balances?.[p.id] || 0;
      totalBalances[p.id] += bal;
      modeBreakdown[p.id]['bbb'] = bal;
    });
  }

  // Las Vegas
  if (activeModes.lasvegas?.active) {
    const res = calculateLasVegas(players, holes, scores, roundState.teamsConfig, activeModes.lasvegas.stake || 10, playerStrokesInfo);
    players.forEach((p) => {
      const bal = res.balances?.[p.id] || 0;
      totalBalances[p.id] += bal;
      modeBreakdown[p.id]['lasvegas'] = bal;
    });
  }

  // 9-Points / Split Sixes
  if (activeModes.ninepoints?.active || activeModes.splitsixes?.active) {
    const modeKey = activeModes.splitsixes?.active ? 'splitsixes' : 'ninepoints';
    const stakeVal = activeModes[modeKey]?.stake || 10;
    const res = calculateNinePoints(players, holes, scores, modeKey, stakeVal, playerStrokesInfo);
    players.forEach((p) => {
      const bal = res.balances?.[p.id] || 0;
      totalBalances[p.id] += bal;
      modeBreakdown[p.id][modeKey] = bal;
    });
  }

  // Wolf
  if (activeModes.wolf?.active) {
    const res = calculateWolf(players, holes, scores, roundState.wolfLog || [], activeModes.wolf.stake || 50, playerStrokesInfo);
    players.forEach((p) => {
      const bal = res.balances?.[p.id] || 0;
      totalBalances[p.id] += bal;
      modeBreakdown[p.id]['wolf'] = bal;
    });
  }

  // 3. Build overall player results
  const masterPlayerBalances = players.map((p) => ({
    ...p,
    netBalance: totalBalances[p.id] || 0,
    breakdown: modeBreakdown[p.id] || {},
  }));

  // 4. Calculate pairwise transfers ("Quién le debe a quién")
  const pairwiseSettlements = [];
  const debtors = masterPlayerBalances
    .filter((p) => p.netBalance < 0)
    .map((p) => ({ ...p, remaining: Math.abs(p.netBalance) }));
  const creditors = masterPlayerBalances
    .filter((p) => p.netBalance > 0)
    .map((p) => ({ ...p, remaining: p.netBalance }));

  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const amount = Math.min(debtor.remaining, creditor.remaining);
    if (amount > 0) {
      pairwiseSettlements.push({
        debtorId: debtor.id,
        debtorName: debtor.shortName,
        debtorAvatar: debtor.avatar,
        creditorId: creditor.id,
        creditorName: creditor.shortName,
        creditorAvatar: creditor.avatar,
        amount,
      });
    }

    debtor.remaining -= amount;
    creditor.remaining -= amount;

    if (debtor.remaining === 0) dIdx++;
    if (creditor.remaining === 0) cIdx++;
  }

  return {
    masterPlayerBalances,
    pairwiseSettlements,
  };
};
