import { Router } from 'express';
import { prisma } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { generateMatchCode } from '../utils/auth.js';
import { getUserCareerStats, getUserRecentInnings, getUserMatchStats } from '../services/stats.js';

const router = Router();

const FORMAT_DEFAULTS: Record<string, { overs: number; balls?: number }> = {
  T20: { overs: 20 },
  ODI: { overs: 50 },
  Test: { overs: 90 },
  T10: { overs: 10 },
  '100': { overs: 16.4, balls: 100 },
  Custom: { overs: 20 },
};

async function uniqueCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateMatchCode();
    const exists = await prisma.match.findUnique({ where: { uniqueCode: code } });
    if (!exists) return code;
  }
  throw new Error('Could not generate unique match code');
}

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, venue, matchDate, format, oversPerSide, ballsPerSide, competitionType } = req.body;
    const code = await uniqueCode();
    const defaults = FORMAT_DEFAULTS[format] || FORMAT_DEFAULTS.T20;

    const match = await prisma.match.create({
      data: {
        uniqueCode: code,
        title: title || 'Untitled Match',
        venue: venue || '',
        matchDate: matchDate ? new Date(matchDate) : new Date(),
        format: format || 'T20',
        oversPerSide: oversPerSide ?? defaults.overs,
        ballsPerSide: ballsPerSide ?? defaults.balls ?? null,
        competitionType: competitionType || 'Friendly',
        scoredById: req.user!.userId,
        status: 'setup',
        teams: {
          create: [
            { teamIndex: 0, name: 'Team 1' },
            { teamIndex: 1, name: 'Team 2' },
          ],
        },
      },
      include: { teams: true },
    });
    res.status(201).json(match);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create match' });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  const { search, format, status } = req.query;
  const where: Record<string, unknown> = {};

  if (search && typeof search === 'string') {
    where.OR = [
      { title: { contains: search } },
      { uniqueCode: { contains: search.toUpperCase() } },
      { venue: { contains: search } },
    ];
  }
  if (format && format !== 'All') where.format = format;
  if (status) where.status = status;

  const matches = await prisma.match.findMany({
    where,
    orderBy: { matchDate: 'desc' },
    include: {
      teams: { include: { players: true } },
      innings: true,
    },
    take: 50,
  });
  res.json(matches);
});

router.get('/live', authMiddleware, async (_req, res) => {
  const match = await prisma.match.findFirst({
    where: { status: 'live' },
    orderBy: { updatedAt: 'desc' },
    include: {
      teams: { include: { players: true } },
      innings: { orderBy: { inningsNumber: 'asc' } },
    },
  });
  res.json(match);
});

router.get('/players/search', authMiddleware, async (req, res) => {
  const q = (req.query.q as string)?.trim();
  if (!q) return res.json([]);

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { username: { contains: q.toLowerCase() } },
        { firstName: { contains: q } },
        { lastName: { contains: q } },
      ],
    },
    select: { id: true, firstName: true, lastName: true, username: true },
    take: 20,
  });
  res.json(users);
});

router.get('/players/:userId/stats', authMiddleware, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.userId },
    select: { id: true, firstName: true, lastName: true, username: true },
  });
  if (!user) return res.status(404).json({ error: 'Player not found' });

  const career = await getUserCareerStats(req.params.userId);
  const last5 = await getUserRecentInnings(req.params.userId, 5);
  const last3 = last5.slice(0, 3);

  res.json({ user, career, last5, last3 });
});

router.get('/players/:userId/match/:matchId', authMiddleware, async (req, res) => {
  const stats = await getUserMatchStats(req.params.userId, req.params.matchId);
  if (!stats) return res.status(404).json({ error: 'No stats for this match' });
  res.json(stats);
});

router.get('/:id', authMiddleware, async (req, res) => {
  const match = await prisma.match.findFirst({
    where: { OR: [{ id: req.params.id }, { uniqueCode: req.params.id.toUpperCase() }] },
    include: {
      teams: {
        include: {
          players: {
            include: { user: { select: { id: true, firstName: true, lastName: true, username: true } } },
          },
        },
      },
      innings: {
        include: {
          balls: {
            orderBy: [{ overNumber: 'asc' }, { ballInOver: 'asc' }],
            include: { batsman: true, bowler: true },
          },
        },
      },
    },
  });
  if (!match) return res.status(404).json({ error: 'Match not found' });
  res.json(match);
});

router.patch('/:id/details', authMiddleware, async (req, res) => {
  const { title, venue, matchDate, format, oversPerSide, ballsPerSide, competitionType } = req.body;
  const match = await prisma.match.update({
    where: { id: req.params.id },
    data: {
      ...(title !== undefined && { title }),
      ...(venue !== undefined && { venue }),
      ...(matchDate !== undefined && { matchDate: new Date(matchDate) }),
      ...(format !== undefined && { format }),
      ...(oversPerSide !== undefined && { oversPerSide }),
      ...(ballsPerSide !== undefined && { ballsPerSide }),
      ...(competitionType !== undefined && { competitionType }),
    },
    include: { teams: true },
  });
  res.json(match);
});

router.patch('/:id/teams', authMiddleware, async (req, res) => {
  const { teams } = req.body as {
    teams: Array<{
      teamIndex: number;
      name: string;
      color?: string;
      players: Array<{
        userId?: string;
        guestName?: string;
        isGuest?: boolean;
        battingHand?: string;
        role?: string;
      }>;
    }>;
  };

  const match = await prisma.match.findUnique({
    where: { id: req.params.id },
    include: { teams: { include: { players: true } } },
  });
  if (!match) return res.status(404).json({ error: 'Match not found' });

  for (const teamData of teams) {
    const team = match.teams.find((t) => t.teamIndex === teamData.teamIndex);
    if (!team) continue;

    await prisma.matchPlayer.deleteMany({ where: { matchTeamId: team.id } });
    await prisma.matchTeam.update({
      where: { id: team.id },
      data: {
        name: teamData.name,
        ...(teamData.color && { color: teamData.color }),
        players: {
          create: teamData.players.map((p) => ({
            userId: p.isGuest ? null : p.userId,
            guestName: p.isGuest ? p.guestName : null,
            isGuest: !!p.isGuest,
            battingHand: p.battingHand || 'R',
            role: p.role || 'Bat',
          })),
        },
      },
    });
  }

  const updated = await prisma.match.findUnique({
    where: { id: req.params.id },
    include: {
      teams: {
        include: {
          players: { include: { user: { select: { id: true, username: true, firstName: true, lastName: true } } } },
        },
      },
    },
  });
  res.json(updated);
});

router.patch('/:id/toss', authMiddleware, async (req, res) => {
  const { tossWinnerTeam, tossElected, tossCaptain, coinResult } = req.body;
  const match = await prisma.match.update({
    where: { id: req.params.id },
    data: { tossWinnerTeam, tossElected, tossCaptain, coinResult },
  });
  res.json(match);
});

router.patch('/:id/playing-xi', authMiddleware, async (req, res) => {
  const { teamIndex, playerIds, captainId, wicketKeeperId, battingOrders } = req.body;

  const team = await prisma.matchTeam.findFirst({
    where: { matchId: req.params.id, teamIndex },
    include: { players: true },
  });
  if (!team) return res.status(404).json({ error: 'Team not found' });

  for (const p of team.players) {
    const inXI = playerIds.includes(p.id);
    const order = battingOrders?.[p.id];
    await prisma.matchPlayer.update({
      where: { id: p.id },
      data: {
        inPlayingXI: inXI,
        isCaptain: p.id === captainId,
        isWicketKeeper: p.id === wicketKeeperId,
        battingOrder: order ?? null,
      },
    });
  }

  res.json({ success: true });
});

router.patch('/:id/opening', authMiddleware, async (req, res) => {
  const { strikerId, nonStrikerId, openingBowlerId, openingEnd } = req.body;
  const matchId = req.params.id;

  await prisma.match.update({
    where: { id: matchId },
    data: { openingEnd, status: 'live' },
  });

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { teams: true },
  });
  if (!match) return res.status(404).json({ error: 'Match not found' });

  const battingTeamIndex =
    match.tossElected === 'bat'
      ? match.tossWinnerTeam!
      : match.tossWinnerTeam === 0
        ? 1
        : 0;

  await prisma.innings.create({
    data: {
      matchId,
      inningsNumber: 1,
      battingTeamIndex,
      balls: {
        create: [],
      },
    },
  });

  res.json({
    matchId,
    inningsNumber: 1,
    battingTeamIndex,
    strikerId,
    nonStrikerId,
    openingBowlerId,
    openingEnd,
  });
});

export default router;
