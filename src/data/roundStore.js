// Store for completed and liquidated golf rounds
import { HOLES_DATA, MOCK_PLAYERS } from './mockData';

let historyRounds = [
  {
    id: 'h_initial_1',
    date: '27 de Agosto, 2026',
    courseName: 'Club de Golf Los Encinos',
    parTotal: 72,
    slopeRating: 130,
    courseRating: 71.5,
    format: '1vs1',
    formatLabel: 'Duelo 1vs1 (Match Play)',
    handicapMode: 'differential',
    totalHoles: 18,
    winnerName: 'Alex "El Draw"',
    winnerAvatar: '⛳',
    totalPot: 2400,
    weather: '☀️ Soleado 23°C',
    summaryText: 'Alex dominó el duelo neto (-3 neto vs E de Carlos) ganando la vuelta de regreso y la tarjeta total.',
    balances: [
      { name: 'Alex', balance: 1200, isWinner: true, grossTotal: 79, netTotal: 69, grossDiff: '+7', netDiff: '-3' },
      { name: 'Carlos', balance: -1200, isWinner: false, grossTotal: 77, netTotal: 72, grossDiff: '+5', netDiff: 'E' },
    ],
    wagersSummary: [
      { wager: 'Nassau - Ida (1-9)', winner: 'Empate', amount: '$0 MXN' },
      { wager: 'Nassau - Vuelta (10-18)', winner: 'Alex (+2 UP)', amount: '$600 MXN' },
      { wager: 'Nassau - Total (18 Hoyos)', winner: 'Alex (69 Neto)', amount: '$600 MXN' },
    ],
    players: [
      { id: 'p1', name: 'Alex "El Draw"', shortName: 'Alex', avatar: '⛳', handicapIndex: 10.2, badgeColor: '#10B981' },
      { id: 'p2', name: 'Carlos "Bombardero"', shortName: 'Carlos', avatar: '🏌️‍♂️', handicapIndex: 5.4, badgeColor: '#3B82F6' },
    ],
    holes: HOLES_DATA.map((h) => ({
      hole: h.hole,
      par: h.par,
      hcp: h.hcp,
      scores: { p1: h.scores.p1, p2: h.scores.p2 },
    })),
  },
];

const listeners = new Set();

export const getHistoryRounds = () => historyRounds;

export const addHistoryRound = (round) => {
  historyRounds = [round, ...historyRounds];
  listeners.forEach((listener) => listener(historyRounds));
};

export const subscribeHistory = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
