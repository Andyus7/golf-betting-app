// Active Round Store for managing live match state, course config, active players, scores, and real-time Dots & Wager Games calculation.
import { HOLES_DATA, MOCK_PLAYERS } from './mockData';

export const DOTS_CATALOG = [
  {
    id: 'greenie',
    name: 'Greenie',
    category: 'Bonus',
    icon: '🟢',
    color: '#10B981',
    desc: 'En green de 1er golpe en Par 3',
    par3Only: true,
  },
  {
    id: 'sandy',
    name: 'Sandy',
    category: 'Bonus',
    icon: '🏖️',
    color: '#F59E0B',
    desc: 'Par o mejor saliendo de trampa de arena',
  },
  {
    id: 'barkie',
    name: 'Barkie',
    category: 'Bonus',
    icon: '🪵',
    color: '#D97706',
    desc: 'Par o mejor tras pegar a un árbol',
  },
  {
    id: 'polie',
    name: 'Polie',
    category: 'Bonus',
    icon: '⛳',
    color: '#8B5CF6',
    desc: 'Putt embocado más largo que la bandera',
  },
  {
    id: 'birdie',
    name: 'Birdie / Eagle',
    category: 'Bonus',
    icon: '🦅',
    color: '#EAB308',
    desc: 'Hacer 1 o 2 golpes bajo el par del hoyo',
  },
  {
    id: 'snake',
    name: 'Snake (Serpiente)',
    category: 'Castigo',
    icon: '🐍',
    color: '#EF4444',
    desc: '3-putts (Carryover acumulado al último infractor)',
    isSnake: true,
  },
  {
    id: 'camel',
    name: 'Camel (Camello)',
    category: 'Castigo',
    icon: '🐪',
    color: '#EA580C',
    desc: 'Caer a la trampa de arena (bunker)',
  },
  {
    id: 'water',
    name: 'Water (Agua)',
    category: 'Castigo',
    icon: '💧',
    color: '#0EA5E9',
    desc: 'Bola al obstáculo de agua',
  },
];

// Initial state of active round
let activeRoundState = {
  courseName: 'Club de Golf Los Encinos',
  slopeRating: 130,
  courseRating: 71.5,
  format: '1vs1', // '1vs1' | 'group'
  handicapMode: 'differential', // 'differential' | 'full'
  currentHole: 1,
  players: [
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
  ],
  holes: HOLES_DATA.map((h) => ({ hole: h.hole, par: h.par, hcp: h.hcp })),
  // Live scores state synced with ScorecardScreen: { [holeNumber]: { [playerId]: score } }
  scores: (() => {
    const initial = {};
    HOLES_DATA.forEach((h) => {
      initial[h.hole] = { ...h.scores };
    });
    return initial;
  })(),
  // Configuration of active parallel wager modes
  activeWagerModes: {
    nassau: { active: true, stake: 200, autoPress: true },
    skins: { active: true, stake: 50 },
    matchplay: { active: false, stake: 500 },
    strokeplay: { active: false, stake: 20 },
    hammer: { active: false, stake: 50 },
    bbb: { active: false, stake: 10 },
    lasvegas: { active: false, stake: 10 },
    ninepoints: { active: false, stake: 10 },
    splitsixes: { active: false, stake: 15 },
    wolf: { active: false, stake: 50 },
  },
  // Special wager mode action logs
  hammerLog: [], // [{ hole, hammerBy, multiplier, forfeited }]
  bbbLog: [],    // [{ hole, bingoPlayerId, bangoPlayerId, bongoPlayerId }]
  wolfLog: [],   // [{ hole, wolfPlayerId, partnerPlayerId, isLoneWolf }]
  dotsConfig: {
    baseValue: 50,
    customValues: {
      greenie: 50,
      sandy: 50,
      barkie: 50,
      polie: 50,
      birdie: 100,
      snake: 50,
      camel: 50,
      water: 50,
    },
  },
  dotsLog: [], // Registered Dot events
};

const listeners = new Set();

const notifyListeners = () => {
  listeners.forEach((listener) => listener(activeRoundState));
};

export const getActiveRoundState = () => activeRoundState;

export const subscribeActiveRound = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const setCurrentHole = (holeNumber) => {
  activeRoundState = {
    ...activeRoundState,
    currentHole: Math.max(1, Math.min(18, holeNumber)),
  };
  notifyListeners();
};

export const setPlayers = (players) => {
  activeRoundState = {
    ...activeRoundState,
    players: [...players],
  };
  notifyListeners();
};

export const setFormat = (format) => {
  activeRoundState = {
    ...activeRoundState,
    format,
  };
  notifyListeners();
};

export const setCourseConfig = (config) => {
  activeRoundState = {
    ...activeRoundState,
    ...config,
  };
  notifyListeners();
};

export const setScoresStore = (scores) => {
  activeRoundState = {
    ...activeRoundState,
    scores: { ...scores },
  };
  notifyListeners();
};

export const toggleWagerMode = (modeId) => {
  const currentModeState = activeRoundState.activeWagerModes[modeId] || { active: false, stake: 50 };
  activeRoundState = {
    ...activeRoundState,
    activeWagerModes: {
      ...activeRoundState.activeWagerModes,
      [modeId]: {
        ...currentModeState,
        active: !currentModeState.active,
      },
    },
  };
  notifyListeners();
};

export const setWagerModeStake = (modeId, stake) => {
  const numVal = Math.max(1, parseInt(stake, 10) || 1);
  const currentModeState = activeRoundState.activeWagerModes[modeId] || { active: true, stake: 50 };
  activeRoundState = {
    ...activeRoundState,
    activeWagerModes: {
      ...activeRoundState.activeWagerModes,
      [modeId]: {
        ...currentModeState,
        stake: numVal,
      },
    },
  };
  notifyListeners();
};

export const recordHammerAction = (hole, hammerBy, action = 'hammer') => {
  const existing = activeRoundState.hammerLog.filter((h) => h.hole !== hole);
  let newEntry = { hole, hammerBy, multiplier: 2, forfeited: false };

  if (action === 'forfeit') {
    newEntry.forfeited = true;
  }

  activeRoundState = {
    ...activeRoundState,
    hammerLog: [...existing, newEntry],
  };
  notifyListeners();
};

export const recordBBBAction = (hole, bingoPlayerId, bangoPlayerId, bongoPlayerId) => {
  const existing = activeRoundState.bbbLog.filter((h) => h.hole !== hole);
  activeRoundState = {
    ...activeRoundState,
    bbbLog: [...existing, { hole, bingoPlayerId, bangoPlayerId, bongoPlayerId }],
  };
  notifyListeners();
};

export const recordWolfAction = (hole, wolfPlayerId, partnerPlayerId, isLoneWolf = false) => {
  const existing = activeRoundState.wolfLog.filter((h) => h.hole !== hole);
  activeRoundState = {
    ...activeRoundState,
    wolfLog: [...existing, { hole, wolfPlayerId, partnerPlayerId, isLoneWolf }],
  };
  notifyListeners();
};

export const setBaseDotValue = (val) => {
  const numVal = Math.max(1, parseInt(val, 10) || 1);
  const updatedCustom = {};
  Object.keys(activeRoundState.dotsConfig.customValues).forEach((key) => {
    updatedCustom[key] = numVal;
  });

  activeRoundState = {
    ...activeRoundState,
    dotsConfig: {
      ...activeRoundState.dotsConfig,
      baseValue: numVal,
      customValues: updatedCustom,
    },
  };
  notifyListeners();
};

export const setCustomDotValue = (dotId, val) => {
  const numVal = Math.max(1, parseInt(val, 10) || 1);
  activeRoundState = {
    ...activeRoundState,
    dotsConfig: {
      ...activeRoundState.dotsConfig,
      customValues: {
        ...activeRoundState.dotsConfig.customValues,
        [dotId]: numVal,
      },
    },
  };
  notifyListeners();
};

export const addDotEntry = (playerId, dotId, holeNumber) => {
  const player = activeRoundState.players.find((p) => p.id === playerId);
  const dotDef = DOTS_CATALOG.find((d) => d.id === dotId);

  if (!player || !dotDef) return null;

  const newEntry = {
    id: `dot_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    hole: holeNumber || activeRoundState.currentHole,
    playerId: player.id,
    playerShortName: player.shortName,
    playerAvatar: player.avatar,
    dotId: dotDef.id,
    dotName: dotDef.name,
    category: dotDef.category,
    icon: dotDef.icon,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  activeRoundState = {
    ...activeRoundState,
    dotsLog: [newEntry, ...activeRoundState.dotsLog],
  };
  notifyListeners();
  return newEntry;
};

export const removeDotEntry = (entryId) => {
  activeRoundState = {
    ...activeRoundState,
    dotsLog: activeRoundState.dotsLog.filter((item) => item.id !== entryId),
  };
  notifyListeners();
};

export const clearDotsLog = () => {
  activeRoundState = {
    ...activeRoundState,
    dotsLog: [],
  };
  notifyListeners();
};

// ----------------------------------------------------------------------
// FINANCIAL SETTLEMENT CALCULATOR (DOTS)
// ----------------------------------------------------------------------
export const calculateDotsSettlement = () => {
  const { players, dotsLog, dotsConfig } = activeRoundState;
  const numPlayers = players.length;

  if (numPlayers === 0) {
    return {
      playerBalances: [],
      pairwiseSettlements: [],
      snakeInfo: { holder: null, count: 0, carryoverTotal: 0 },
    };
  }

  // 1. Identify Snake carryover state
  const snakeEntries = dotsLog.filter((item) => item.dotId === 'snake');
  const chronologicalSnakes = [...snakeEntries].reverse();
  const snakeCount = chronologicalSnakes.length;
  const lastSnakeEntry = chronologicalSnakes.length > 0 ? chronologicalSnakes[chronologicalSnakes.length - 1] : null;

  const snakeValue = dotsConfig.customValues.snake || dotsConfig.baseValue || 50;
  const snakeHolderPlayer = lastSnakeEntry
    ? players.find((p) => p.id === lastSnakeEntry.playerId)
    : null;

  const snakeInfo = {
    count: snakeCount,
    holder: snakeHolderPlayer,
    unitValue: snakeValue,
    totalPerOtherPlayer: snakeCount * snakeValue,
  };

  // 2. Initialize player stat maps
  const balances = {};
  const bonusCounts = {};
  const penaltyCounts = {};

  players.forEach((p) => {
    balances[p.id] = 0;
    bonusCounts[p.id] = 0;
    penaltyCounts[p.id] = 0;
  });

  // 3. Process Standard (Non-Snake) Dots
  dotsLog.forEach((entry) => {
    if (entry.dotId === 'snake') {
      penaltyCounts[entry.playerId] = (penaltyCounts[entry.playerId] || 0) + 1;
      return;
    }

    const dotVal = dotsConfig.customValues[entry.dotId] || dotsConfig.baseValue || 50;

    if (entry.category === 'Bonus') {
      bonusCounts[entry.playerId] = (bonusCounts[entry.playerId] || 0) + 1;
      balances[entry.playerId] += (numPlayers - 1) * dotVal;
      players.forEach((p) => {
        if (p.id !== entry.playerId) {
          balances[p.id] -= dotVal;
        }
      });
    } else {
      penaltyCounts[entry.playerId] = (penaltyCounts[entry.playerId] || 0) + 1;
      balances[entry.playerId] -= (numPlayers - 1) * dotVal;
      players.forEach((p) => {
        if (p.id !== entry.playerId) {
          balances[p.id] += dotVal;
        }
      });
    }
  });

  // 4. Apply Snake Carryover Settlement
  if (snakeCount > 0 && snakeHolderPlayer) {
    const totalSnakeOwedToEach = snakeCount * snakeValue;
    balances[snakeHolderPlayer.id] -= (numPlayers - 1) * totalSnakeOwedToEach;
    players.forEach((p) => {
      if (p.id !== snakeHolderPlayer.id) {
        balances[p.id] += totalSnakeOwedToEach;
      }
    });
  }

  // 5. Build player results list
  const playerBalances = players.map((p) => ({
    ...p,
    netBalance: balances[p.id] || 0,
    bonusCount: bonusCounts[p.id] || 0,
    penaltyCount: penaltyCounts[p.id] || 0,
    isSnakeHolder: snakeHolderPlayer ? snakeHolderPlayer.id === p.id : false,
  }));

  // 6. Pairwise Payments
  const pairwiseSettlements = [];
  const debtors = playerBalances
    .filter((p) => p.netBalance < 0)
    .map((p) => ({ ...p, remaining: Math.abs(p.netBalance) }));
  const creditors = playerBalances
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
    playerBalances,
    pairwiseSettlements,
    snakeInfo,
  };
};
