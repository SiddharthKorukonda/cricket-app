import { Router } from 'express';
import { prisma } from '../db.js';
import {
  hashPassword,
  validatePassword,
  validateUsername,
  verifyPassword,
} from '../utils/auth.js';
import { authMiddleware, signToken } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, username, password, confirmPassword } = req.body;

    if (!firstName?.trim() || !lastName?.trim()) {
      return res.status(400).json({ error: 'First and last name are required' });
    }

    const usernameError = validateUsername(username?.trim() || '');
    if (usernameError) return res.status(400).json({ error: usernameError, field: 'username' });

    const passwordError = validatePassword(password || '');
    if (passwordError) return res.status(400).json({ error: passwordError, field: 'password' });

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match', field: 'confirmPassword' });
    }

    const existing = await prisma.user.findUnique({ where: { username: username.trim().toLowerCase() } });
    if (existing) {
      return res.status(409).json({ error: 'Username is already taken', field: 'username' });
    }

    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim().toLowerCase(),
        password: hashed,
        settings: { create: {} },
      },
      select: { id: true, firstName: true, lastName: true, username: true },
    });

    const token = signToken({ userId: user.id, username: user.username });
    res.status(201).json({ user, token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password, rememberMe } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { username: username.trim().toLowerCase() },
    });

    if (!user || !(await verifyPassword(password, user.password))) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = signToken({ userId: user.id, username: user.username }, !!rememberMe);
    res.json({
      user: { id: user.id, firstName: user.firstName, lastName: user.lastName, username: user.username },
      token,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, firstName: true, lastName: true, username: true, createdAt: true },
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

router.get('/lookup/:username', authMiddleware, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { username: req.params.username.toLowerCase() },
    select: { id: true, firstName: true, lastName: true, username: true },
  });
  if (!user) return res.status(404).json({ error: 'Player not found' });
  res.json(user);
});

export default router;
