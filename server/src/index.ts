import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import matchRoutes from './routes/matches.js';
import scoringRoutes from './routes/scoring.js';
import settingsRoutes from './routes/settings.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/scoring', scoringRoutes);
app.use('/api/settings', settingsRoutes);

app.listen(PORT, () => {
  console.log(`CRICSCORE API running on http://localhost:${PORT}`);
});
