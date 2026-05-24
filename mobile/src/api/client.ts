import { Platform } from 'react-native';
import Constants from 'expo-constants';

function getApiBase(): string {
  const configured = Constants.expoConfig?.extra?.apiUrl as string | undefined;
  if (configured) return configured;

  // In Expo Go on a physical device, localhost is the phone — use Metro's host (your Mac's LAN IP).
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:3001/api`;
  }

  const localhost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  return `http://${localhost}:3001/api`;
}

export const API_BASE = getApiBase();

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    throw new Error(
      `Network request failed. Is the API running? (${API_BASE})`
    );
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
};

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
}

export interface Match {
  id: string;
  uniqueCode: string;
  title: string;
  venue?: string;
  matchDate: string;
  format: string;
  oversPerSide: number;
  ballsPerSide?: number;
  competitionType: string;
  status: string;
  tossWinnerTeam?: number;
  tossElected?: string;
  tossCaptain?: string;
  coinResult?: string;
  openingEnd?: string;
  resultSummary?: string;
  winnerTeamIndex?: number;
  teams?: MatchTeam[];
  innings?: Innings[];
}

export interface MatchTeam {
  id: string;
  teamIndex: number;
  name: string;
  color: string;
  players: MatchPlayer[];
}

export interface MatchPlayer {
  id: string;
  userId?: string;
  guestName?: string;
  isGuest: boolean;
  battingHand: string;
  role: string;
  isCaptain: boolean;
  isWicketKeeper: boolean;
  inPlayingXI: boolean;
  battingOrder?: number;
  user?: User;
}

export interface Innings {
  id: string;
  inningsNumber: number;
  battingTeamIndex: number;
  totalRuns: number;
  totalWickets: number;
  totalOvers: number;
  extrasWide: number;
  extrasNoBall: number;
  extrasLegBye: number;
  extrasBye: number;
  extrasPenalty: number;
  isComplete: boolean;
  balls?: Ball[];
}

export interface Ball {
  id: string;
  overNumber: number;
  ballInOver: number;
  batsmanId: string;
  bowlerId: string;
  runsOffBat: number;
  extrasType?: string;
  extrasRuns: number;
  isWicket: boolean;
  isLegalDelivery: boolean;
  shotType?: string;
  shotZone?: string;
  shotDistance?: number;
  shotAngle?: number;
  batsman?: MatchPlayer;
  bowler?: MatchPlayer;
}

export interface UserSettings {
  autoRotateStrike: boolean;
  maidenOverAlert: boolean;
  confirmBeforeWicket: boolean;
  showWagonWheel: boolean;
  showRrrLive: boolean;
  autoExportPdf: boolean;
  defaultFormat: string;
}
