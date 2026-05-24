import { Router } from 'express';
import { prisma } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

interface LiveState {
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  currentOver: number;
  currentBall: number;
  lastWicket: string | null;
}

const liveStates = new Map<string, LiveState>();

function getPartnershipRuns(balls: Array<{ runsOffBat: number; extrasRuns: number; isWicket: boolean; batsmanId: string }>, strikerId: string, nonStrikerId: string) {
  let runs = 0;
  let ballsCount = 0;
  for (let i = balls.length - 1; i >= 0; i--) {
    if (balls[i].isWicket) break;
    runs += balls[i].runsOffBat + balls[i].extrasRuns;
    if (balls[i].isWicket === false) ballsCount++;
  }
  return { runs, balls: ballsCount };
}

function oversToBalls(overs: number): number {
  return Math.floor(overs) * 6 + Math.round((overs % 1) * 10);
}

function ballsToOvers(balls: number): number {
  const whole = Math.floor(balls / 6);
  const rem = balls % 6;
  return whole + rem / 10;
}

router.get('/:matchId/state', authMiddleware, async (req, res) => {
  const match = await prisma.match.findUnique({
    where: { id: req.params.matchId },
    include: {
      teams: { include: { players: { include: { user: true } } } },
      innings: {
        orderBy: { inningsNumber: 'desc' },
        take: 1,
        include: {
          balls: {
            orderBy: [{ overNumber: 'asc' }, { ballInOver: 'asc' }],
            include: { batsman: true, bowler: true, dismissed: true },
          },
        },
      },
    },
  });
  if (!match) return res.status(404).json({ error: 'Match not found' });

  const innings = match.innings[0];
  const liveState = liveStates.get(req.params.matchId);

  let strikerId = liveState?.strikerId;
  let nonStrikerId = liveState?.nonStrikerId;
  let bowlerId = liveState?.bowlerId;

  if (innings && innings.balls.length > 0 && !liveState) {
    const lastBall = innings.balls[innings.balls.length - 1];
    strikerId = lastBall.batsmanId;
    bowlerId = lastBall.bowlerId;
  }

  const battingTeam = match.teams.find((t) => t.teamIndex === innings?.battingTeamIndex);
  const bowlingTeam = match.teams.find((t) => t.teamIndex !== innings?.battingTeamIndex);

  res.json({
    match,
    innings,
    liveState: liveState || { strikerId, nonStrikerId, bowlerId, currentOver: 0, currentBall: 0, lastWicket: null },
    battingTeam,
    bowlingTeam,
  });
});

router.post('/:matchId/init', authMiddleware, async (req, res) => {
  const { strikerId, nonStrikerId, bowlerId } = req.body;
  liveStates.set(req.params.matchId, {
    strikerId,
    nonStrikerId,
    bowlerId,
    currentOver: 0,
    currentBall: 0,
    lastWicket: null,
  });
  res.json({ success: true });
});

router.post('/:matchId/ball', authMiddleware, async (req, res) => {
  const matchId = req.params.matchId;
  const {
    type,
    runs,
    extrasType,
    extrasRuns,
    wicketType,
    dismissedId,
    shotType,
    shotDistance,
    shotZone,
    shotAngle,
    shotX,
    shotY,
    autoRotateStrike,
  } = req.body;

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      innings: {
        where: { isComplete: false },
        orderBy: { inningsNumber: 'desc' },
        take: 1,
        include: { balls: true },
      },
    },
  });
  if (!match) return res.status(404).json({ error: 'Match not found' });

  let innings = match.innings[0];
  if (!innings) {
    const battingTeamIndex =
      match.tossElected === 'bat'
        ? match.tossWinnerTeam!
        : match.tossWinnerTeam === 0
          ? 1
          : 0;
    innings = await prisma.innings.create({
      data: { matchId, inningsNumber: 1, battingTeamIndex },
      include: { balls: true },
    });
  }

  const state = liveStates.get(matchId);
  if (!state) return res.status(400).json({ error: 'Match not initialized' });

  const legalDelivery = !extrasType || extrasType === 'bye' || extrasType === 'legbye';
  const totalRuns = (runs || 0) + (extrasRuns || 0);
  const isWicket = type === 'wicket';

  let overNumber = state.currentOver;
  let ballInOver = state.currentBall;

  if (legalDelivery) {
    ballInOver++;
    if (ballInOver > 6) {
      overNumber++;
      ballInOver = 1;
    }
  }

  const ball = await prisma.ball.create({
    data: {
      inningsId: innings.id,
      overNumber,
      ballInOver: legalDelivery ? ballInOver : state.currentBall || 1,
      batsmanId: state.strikerId,
      bowlerId: state.bowlerId,
      dismissedId: isWicket ? dismissedId : null,
      runsOffBat: runs || 0,
      extrasType: extrasType || null,
      extrasRuns: extrasRuns || 0,
      isWicket,
      wicketType: wicketType || null,
      isLegalDelivery: legalDelivery,
      shotType,
      shotDistance,
      shotZone,
      shotAngle,
      shotX,
      shotY,
    },
  });

  const newTotalRuns = innings.totalRuns + totalRuns;
  const newWickets = innings.totalWickets + (isWicket ? 1 : 0);
  let newOvers = innings.totalOvers;
  if (legalDelivery) {
    const totalBalls = oversToBalls(innings.totalOvers) + 1;
    newOvers = ballsToOvers(totalBalls);
  }

  const extrasUpdate: Record<string, number> = {};
  if (extrasType === 'wide') extrasUpdate.extrasWide = innings.extrasWide + (extrasRuns || 1);
  if (extrasType === 'noball') extrasUpdate.extrasNoBall = innings.extrasNoBall + 1;
  if (extrasType === 'legbye') extrasUpdate.extrasLegBye = innings.extrasLegBye + (extrasRuns || 0);
  if (extrasType === 'bye') extrasUpdate.extrasBye = innings.extrasBye + (extrasRuns || 0);
  if (extrasType === 'penalty') extrasUpdate.extrasPenalty = innings.extrasPenalty + (extrasRuns || 5);

  await prisma.innings.update({
    where: { id: innings.id },
    data: {
      totalRuns: newTotalRuns,
      totalWickets: newWickets,
      totalOvers: newOvers,
      ...extrasUpdate,
    },
  });

  await updatePlayerStats(matchId, innings.id, innings.inningsNumber, state, ball, isWicket, dismissedId);

  let newStriker = state.strikerId;
  let newNonStriker = state.nonStrikerId;

  if (isWicket && dismissedId) {
    state.lastWicket = dismissedId;
    if (dismissedId === state.strikerId) {
      newStriker = state.nonStrikerId;
      newNonStriker = '';
    } else {
      newNonStriker = '';
    }
  } else if (autoRotateStrike !== false) {
    const rotateRuns = totalRuns;
    if (rotateRuns % 2 === 1) {
      [newStriker, newNonStriker] = [state.nonStrikerId, state.strikerId];
    }
  }

  if (legalDelivery && ballInOver >= 6) {
    [newStriker, newNonStriker] = [newNonStriker, newStriker];
    ballInOver = 0;
  }

  state.strikerId = newStriker;
  state.nonStrikerId = newNonStriker;
  state.currentOver = overNumber;
  state.currentBall = ballInOver;
  liveStates.set(matchId, state);

  const maxOvers = match.oversPerSide;
  const maxBalls = match.ballsPerSide;
  const totalBallsBowled = oversToBalls(newOvers);
  const inningsComplete =
    newWickets >= 10 ||
    (maxBalls && totalBallsBowled >= maxBalls) ||
    (!maxBalls && newOvers >= maxOvers);

  if (inningsComplete) {
    await prisma.innings.update({ where: { id: innings.id }, data: { isComplete: true } });
    const allInnings = await prisma.innings.count({ where: { matchId } });
    if (allInnings >= 2 || match.format === 'T20' || match.format === 'ODI') {
      await finalizeMatch(matchId);
    } else {
      const bowlingTeamIndex = innings.battingTeamIndex === 0 ? 1 : 0;
      await prisma.innings.create({
        data: { matchId, inningsNumber: 2, battingTeamIndex: bowlingTeamIndex },
      });
      liveStates.delete(matchId);
    }
  }

  const updated = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      innings: {
        orderBy: { inningsNumber: 'desc' },
        take: 1,
        include: {
          balls: {
            orderBy: [{ overNumber: 'asc' }, { ballInOver: 'asc' }],
            include: { batsman: true, bowler: true },
          },
        },
      },
      teams: { include: { players: { include: { user: true } } } },
    },
  });

  res.json({ ball, state, match: updated, inningsComplete });
});

router.post('/:matchId/undo', authMiddleware, async (req, res) => {
  const matchId = req.params.matchId;
  const innings = await prisma.innings.findFirst({
    where: { matchId, isComplete: false },
    orderBy: { inningsNumber: 'desc' },
    include: { balls: { orderBy: [{ overNumber: 'desc' }, { ballInOver: 'desc' }] } },
  });
  if (!innings?.balls.length) return res.status(400).json({ error: 'Nothing to undo' });

  const lastBall = innings.balls[0];
  await prisma.ball.delete({ where: { id: lastBall.id } });

  const totalRuns = lastBall.runsOffBat + lastBall.extrasRuns;
  let newOvers = innings.totalOvers;
  if (lastBall.isLegalDelivery) {
    const totalBalls = Math.max(0, oversToBalls(innings.totalOvers) - 1);
    newOvers = ballsToOvers(totalBalls);
  }

  await prisma.innings.update({
    where: { id: innings.id },
    data: {
      totalRuns: Math.max(0, innings.totalRuns - totalRuns),
      totalWickets: Math.max(0, innings.totalWickets - (lastBall.isWicket ? 1 : 0)),
      totalOvers: newOvers,
    },
  });

  res.json({ success: true });
});

router.post('/:matchId/end-over', authMiddleware, async (req, res) => {
  const { newBowlerId } = req.body;
  const state = liveStates.get(req.params.matchId);
  if (!state) return res.status(400).json({ error: 'No live state' });

  [state.strikerId, state.nonStrikerId] = [state.nonStrikerId, state.strikerId];
  state.currentBall = 0;
  if (newBowlerId) state.bowlerId = newBowlerId;
  liveStates.set(req.params.matchId, state);
  res.json({ state });
});

async function updatePlayerStats(
  matchId: string,
  inningsId: string,
  inningsNumber: number,
  state: LiveState,
  ball: { runsOffBat: number; extrasRuns: number; isWicket: boolean; extrasType: string | null; isLegalDelivery: boolean },
  isWicket: boolean,
  dismissedId?: string
) {
  const upsertBatting = async (playerId: string, runs: number, legal: boolean) => {
    const existing = await prisma.battingInningsStats.findFirst({
      where: { matchPlayerId: playerId, matchId, inningsNumber },
    });
    const fours = runs === 4 ? 1 : 0;
    const sixes = runs === 6 ? 1 : 0;
    if (existing) {
      await prisma.battingInningsStats.update({
        where: { id: existing.id },
        data: {
          runs: existing.runs + runs,
          ballsFaced: existing.ballsFaced + (legal ? 1 : 0),
          fours: existing.fours + fours,
          sixes: existing.sixes + sixes,
          isOut: isWicket && dismissedId === playerId ? true : existing.isOut,
          dismissalType: isWicket && dismissedId === playerId ? 'out' : existing.dismissalType,
        },
      });
    } else {
      await prisma.battingInningsStats.create({
        data: {
          matchPlayerId: playerId,
          matchId,
          inningsNumber,
          runs,
          ballsFaced: legal ? 1 : 0,
          fours,
          sixes,
          isOut: isWicket && dismissedId === playerId,
          didBat: true,
        },
      });
    }
  };

  const upsertBowling = async (playerId: string, runs: number, legal: boolean, wicket: boolean) => {
    const existing = await prisma.bowlingInningsStats.findFirst({
      where: { matchPlayerId: playerId, matchId, inningsNumber },
    });
    const overInc = legal ? 1 / 6 : 0;
    if (existing) {
      await prisma.bowlingInningsStats.update({
        where: { id: existing.id },
        data: {
          runs: existing.runs + runs + ball.extrasRuns,
          overs: existing.overs + overInc,
          wickets: existing.wickets + (wicket ? 1 : 0),
          wides: existing.wides + (ball.extrasType === 'wide' ? 1 : 0),
          noBalls: existing.noBalls + (ball.extrasType === 'noball' ? 1 : 0),
          didBowl: true,
        },
      });
    } else {
      await prisma.bowlingInningsStats.create({
        data: {
          matchPlayerId: playerId,
          matchId,
          inningsNumber,
          runs: runs + ball.extrasRuns,
          overs: overInc,
          wickets: wicket ? 1 : 0,
          wides: ball.extrasType === 'wide' ? 1 : 0,
          noBalls: ball.extrasType === 'noball' ? 1 : 0,
          didBowl: true,
        },
      });
    }
  };

  await upsertBatting(state.strikerId, ball.runsOffBat, ball.isLegalDelivery);
  await upsertBowling(state.bowlerId, ball.runsOffBat, ball.isLegalDelivery, isWicket);
}

async function finalizeMatch(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { innings: { orderBy: { inningsNumber: 'asc' } }, teams: true },
  });
  if (!match || match.innings.length < 1) return;

  const inn1 = match.innings[0];
  const inn2 = match.innings[1];
  let resultSummary = '';
  let winnerTeamIndex: number | null = null;

  if (inn2) {
    if (inn2.totalRuns > inn1.totalRuns) {
      winnerTeamIndex = inn2.battingTeamIndex;
      const wkts = 10 - inn2.totalWickets;
      resultSummary = `${match.teams.find((t) => t.teamIndex === winnerTeamIndex)?.name} won by ${wkts} wickets`;
    } else if (inn1.totalRuns > inn2.totalRuns) {
      winnerTeamIndex = inn1.battingTeamIndex;
      resultSummary = `${match.teams.find((t) => t.teamIndex === winnerTeamIndex)?.name} won by ${inn1.totalRuns - inn2.totalRuns} runs`;
    } else {
      resultSummary = 'Match tied';
    }
  } else {
    resultSummary = 'Innings complete';
  }

  await prisma.match.update({
    where: { id: matchId },
    data: { status: 'completed', resultSummary, winnerTeamIndex },
  });
  liveStates.delete(matchId);
}

export default router;
