import { Router } from 'express';
import { prisma } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
  let settings = await prisma.userSettings.findUnique({ where: { userId: req.user!.userId } });
  if (!settings) {
    settings = await prisma.userSettings.create({ data: { userId: req.user!.userId } });
  }
  res.json(settings);
});

router.patch('/', authMiddleware, async (req, res) => {
  const data = req.body;
  const settings = await prisma.userSettings.upsert({
    where: { userId: req.user!.userId },
    create: { userId: req.user!.userId, ...data },
    update: data,
  });
  res.json(settings);
});

export default router;
