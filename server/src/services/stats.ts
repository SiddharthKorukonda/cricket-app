import { prisma } from '../db.js';

export interface BattingCareerStats {
  mat: number;
  inn: number;
  no: number;
  runs: number;
  hs: number;
  avg: number | null;
  bf: number;
  sr: number | null;
  hundreds: number;
  fifties: number;
  ducks: number;
  fours: number;
  sixes: number;
}

export interface BowlingCareerStats {
  mat: number;
  inn: number;
  overs: number;
  maidens: number;
  runs: number;
  wickets: number;
  bbi: string;
  avg: number | null;
  econ: number | null;
  sr: number | null;
  fourW: number;
  fiveW: number;
  wides: number;
  noBalls: number;
}

export interface KeepingCareerStats {
  mat: number;
  inn: number;
  ct: number;
  st: number;
  ctSt: number;
  byes: number;
  maxDismissals: number;
}

export interface FieldingCareerStats {
  mat: number;
  ct: number;
  ro: number;
  maxCtInn: number;
}

function battingAverage(runs: number, inn: number, no: number): number | null {
  const dismissals = inn - no;
  if (dismissals <= 0) return runs > 0 ? runs : null;
  return Math.round((runs / dismissals) * 100) / 100;
}

function strikeRate(runs: number, balls: number): number | null {
  if (balls <= 0) return null;
  return Math.round((runs / balls) * 10000) / 100;
}

function bowlingAverage(runs: number, wickets: number): number | null {
  if (wickets <= 0) return null;
  return Math.round((runs / wickets) * 100) / 100;
}

function economy(runs: number, overs: number): number | null {
  if (overs <= 0) return null;
  return Math.round((runs / overs) * 100) / 100;
}

function bowlingStrikeRate(balls: number, wickets: number): number | null {
  if (wickets <= 0) return null;
  return Math.round((balls / wickets) * 10) / 10;
}

function formatOvers(overs: number): string {
  const whole = Math.floor(overs);
  const balls = Math.round((overs - whole) * 10);
  if (balls >= 6) return `${whole + 1}.0`;
  return balls > 0 ? `${whole}.${balls}` : `${whole}`;
}

export async function getUserCareerStats(userId: string) {
  const matchPlayers = await prisma.matchPlayer.findMany({
    where: { userId, isGuest: false },
    include: {
      battingStats: true,
      bowlingStats: true,
      keepingStats: true,
      fieldingStats: true,
      matchTeam: { include: { match: true } },
    },
  });

  const matchIds = new Set<string>();
  const battingInnings: typeof matchPlayers[0]['battingStats'] = [];
  const bowlingInnings: typeof matchPlayers[0]['bowlingStats'] = [];
  const keepingInnings: typeof matchPlayers[0]['keepingStats'] = [];
  const fieldingInnings: typeof matchPlayers[0]['fieldingStats'] = [];

  for (const mp of matchPlayers) {
    if (mp.matchTeam.match.status === 'completed') {
      matchIds.add(mp.matchTeam.matchId);
    }
    battingInnings.push(...mp.battingStats.filter((s) => s.didBat));
    bowlingInnings.push(...mp.bowlingStats.filter((s) => s.didBowl));
    keepingInnings.push(...mp.keepingStats.filter((s) => s.didKeep));
    fieldingInnings.push(...mp.fieldingStats.filter((s) => s.didField));
  }

  const batRuns = battingInnings.reduce((s, i) => s + i.runs, 0);
  const batBalls = battingInnings.reduce((s, i) => s + i.ballsFaced, 0);
  const batNO = battingInnings.filter((i) => !i.isOut).length;
  const batInn = battingInnings.length;
  const batHS = battingInnings.reduce((m, i) => Math.max(m, i.runs), 0);

  const bowlRuns = bowlingInnings.reduce((s, i) => s + i.runs, 0);
  const bowlWkts = bowlingInnings.reduce((s, i) => s + i.wickets, 0);
  const bowlOvers = bowlingInnings.reduce((s, i) => s + i.overs, 0);
  const bowlBalls = Math.floor(bowlOvers) * 6 + Math.round((bowlOvers % 1) * 10);

  let bbi = '-';
  let bestW = 0;
  let bestR = 999;
  for (const inn of bowlingInnings) {
    if (inn.wickets > bestW || (inn.wickets === bestW && inn.runs < bestR)) {
      bestW = inn.wickets;
      bestR = inn.runs;
      bbi = `${inn.wickets}/${inn.runs}`;
    }
  }

  const batting: BattingCareerStats = {
    mat: matchIds.size,
    inn: batInn,
    no: batNO,
    runs: batRuns,
    hs: batHS,
    avg: battingAverage(batRuns, batInn, batNO),
    bf: batBalls,
    sr: strikeRate(batRuns, batBalls),
    hundreds: battingInnings.filter((i) => i.runs >= 100).length,
    fifties: battingInnings.filter((i) => i.runs >= 50 && i.runs < 100).length,
    ducks: battingInnings.filter((i) => i.isOut && i.runs === 0).length,
    fours: battingInnings.reduce((s, i) => s + i.fours, 0),
    sixes: battingInnings.reduce((s, i) => s + i.sixes, 0),
  };

  const bowling: BowlingCareerStats = {
    mat: new Set(bowlingInnings.map((i) => i.matchId)).size,
    inn: bowlingInnings.length,
    overs: bowlOvers,
    maidens: bowlingInnings.reduce((s, i) => s + i.maidens, 0),
    runs: bowlRuns,
    wickets: bowlWkts,
    bbi,
    avg: bowlingAverage(bowlRuns, bowlWkts),
    econ: economy(bowlRuns, bowlOvers),
    sr: bowlingStrikeRate(bowlBalls, bowlWkts),
    fourW: bowlingInnings.filter((i) => i.wickets === 4).length,
    fiveW: bowlingInnings.filter((i) => i.wickets >= 5).length,
    wides: bowlingInnings.reduce((s, i) => s + i.wides, 0),
    noBalls: bowlingInnings.reduce((s, i) => s + i.noBalls, 0),
  };

  const keepMatchIds = new Set(keepingInnings.map((i) => i.matchId));
  const keeping: KeepingCareerStats = {
    mat: keepMatchIds.size,
    inn: keepingInnings.length,
    ct: keepingInnings.reduce((s, i) => s + i.catches, 0),
    st: keepingInnings.reduce((s, i) => s + i.stumpings, 0),
    ctSt: keepingInnings.reduce((s, i) => s + i.catches + i.stumpings, 0),
    byes: keepingInnings.reduce((s, i) => s + i.byes, 0),
    maxDismissals: keepingInnings.reduce((m, i) => Math.max(m, i.catches + i.stumpings), 0),
  };

  const fieldMatchIds = new Set(fieldingInnings.map((i) => i.matchId));
  const fielding: FieldingCareerStats = {
    mat: fieldMatchIds.size,
    ct: fieldingInnings.reduce((s, i) => s + i.catches, 0),
    ro: fieldingInnings.reduce((s, i) => s + i.runOuts, 0),
    maxCtInn: fieldingInnings.reduce((m, i) => Math.max(m, i.catches), 0),
  };

  return { batting, bowling, keeping, fielding };
}

export async function getUserRecentInnings(userId: string, limit = 5) {
  const stats = await prisma.battingInningsStats.findMany({
    where: { matchPlayer: { userId }, didBat: true },
    orderBy: { matchPlayer: { matchTeam: { match: { matchDate: 'desc' } } } },
    take: limit,
    include: {
      matchPlayer: {
        include: { matchTeam: { include: { match: true } } },
      },
    },
  });
  return stats.map((s) => ({
    runs: s.runs,
    balls: s.ballsFaced,
    matchTitle: s.matchPlayer.matchTeam.match.title,
    date: s.matchPlayer.matchTeam.match.matchDate,
    isOut: s.isOut,
  }));
}

export async function getUserMatchStats(userId: string, matchId: string) {
  const mp = await prisma.matchPlayer.findFirst({
    where: { userId, matchTeam: { matchId } },
    include: {
      battingStats: { where: { matchId } },
      bowlingStats: { where: { matchId } },
      matchTeam: { include: { match: true } },
    },
  });
  if (!mp) return null;

  const bat = mp.battingStats[0];
  const balls = await prisma.ball.findMany({
    where: { batsmanId: mp.id, innings: { matchId } },
    orderBy: [{ overNumber: 'asc' }, { ballInOver: 'asc' }],
  });

  const fours = bat?.fours ?? 0;
  const sixes = bat?.sixes ?? 0;
  const dots = balls.filter((b) => b.isLegalDelivery && b.runsOffBat === 0 && !b.extrasType).length;
  const singles = balls.filter((b) => b.runsOffBat === 1).length;

  const zones: Record<string, number> = {};
  for (const b of balls) {
    if (b.shotZone) zones[b.shotZone] = (zones[b.shotZone] || 0) + 1;
  }

  return {
    runs: bat?.runs ?? 0,
    ballsFaced: bat?.ballsFaced ?? 0,
    sr: strikeRate(bat?.runs ?? 0, bat?.ballsFaced ?? 0),
    fours,
    sixes,
    dots,
    singles,
    zones,
    ballByBall: balls.map((b) => ({
      runs: b.runsOffBat + b.extrasRuns,
      isDot: b.isLegalDelivery && b.runsOffBat === 0 && !b.extrasType,
      isBoundary: b.runsOffBat === 4 || b.runsOffBat === 6,
    })),
  };
}

export { formatOvers, strikeRate };
