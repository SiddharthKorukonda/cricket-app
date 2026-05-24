# CRICSCORE

Cross-platform cricket scorekeeping app for iOS and Android, with player accounts, live scoring, wagon-wheel shot tracking, and ICC-compliant career statistics.

## Architecture

- **mobile/** — Expo SDK 54 (React Native) app with expo-router — compatible with Expo Go SDK 54
- **server/** — Express API + Prisma + SQLite
- **Auth** — bcrypt (cost factor 10) + JWT; "Remember me" stores token in SecureStore

## Quick start

### 1. API server

```bash
cd server
npm install
npm run db:push
npm run dev
```

API runs at `http://localhost:3001`.

### 2. Mobile app

```bash
cd mobile
npm install
npm start
```

Press `i` for iOS simulator or `a` for Android emulator. Use Expo Go on a physical device (same Wi‑Fi; update API URL if needed — see below).

### API URL on device

When using **Expo Go on a physical phone**, the app automatically uses your Mac's LAN IP (same as the Metro bundler). Make sure:

1. The **API server is running**: `cd server && npm run dev`
2. Phone and Mac are on the **same Wi‑Fi**
3. macOS **firewall** allows incoming connections on port 3001 (or disable firewall for testing)

To override manually, set in `mobile/app.json`:

```json
"extra": {
  "apiUrl": "http://192.168.x.x:3001/api"
}
```

## Features

1. **Login / Register** — Unique usernames, password rules (letter + number + symbol), remember me
2. **Home** — Live match, recent matches, quick actions, profile menu
3. **New match flow** — Details → Team setup → Toss → Playing XI → Opening pair → Scoring
4. **Unique match codes** — Permanent `CRIC-XXXXXX` identifiers
5. **Players** — Import by username (stats tracked) or guest players (team stats only)
6. **Live scoring** — Runs, extras, wickets; wagon wheel on 1–6; no DRS / dead ball / overthrow
7. **Match history** — Search by name, team, or match code
8. **Player stats** — Batting, bowling, fielding, keeping with ICC-style averages (innings-based)
9. **Settings** — Scoring, display, export, format defaults

## Stats (ICC-aligned)

- **Batting average** = Runs ÷ (Innings batted − Not outs)
- **Strike rate** = (Runs ÷ Balls faced) × 100
- **Bowling average** = Runs conceded ÷ Wickets
- Only innings where a player actually batted/bowled/kept/fielded count toward respective `Inn` totals

## Production notes

- Change `JWT_SECRET` and use PostgreSQL instead of SQLite for production
- Run `npm run db:push` after schema changes
