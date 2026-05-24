export const colors = {
  bg: '#0D0F0E',
  bgCard: '#1A1F1C',
  bgInput: '#252B28',
  header: '#1B3022',
  green: '#1D7948',
  greenLight: '#2ECC71',
  greenMuted: '#4A7C59',
  text: '#FFFFFF',
  textMuted: '#8A9A8E',
  textDim: '#5C6B60',
  border: '#2A3530',
  red: '#E74C3C',
  orange: '#E67E22',
  purple: '#9B59B6',
  blue: '#3498DB',
  gold: '#C4A35A',
};

export const FORMAT_DEFAULTS: Record<string, { overs: number; balls?: number; label: string }> = {
  T20: { overs: 20, label: 'T20' },
  ODI: { overs: 50, label: 'ODI' },
  Test: { overs: 90, label: 'Test' },
  T10: { overs: 10, label: 'T10' },
  '100': { overs: 16.4, balls: 100, label: '100' },
  Custom: { overs: 20, label: 'Custom' },
};

export const COMPETITION_TYPES = ['Friendly', 'International', 'League', 'Tournament'] as const;
export const SHOT_TYPES = ['Drive', 'Pull', 'Cut', 'Sweep', 'Glance', 'Loft', 'Defend'] as const;
export const SHOT_COLORS: Record<string, string> = {
  Drive: '#1D7948',
  Pull: '#E74C3C',
  Cut: '#3498DB',
  Sweep: '#E67E22',
  Glance: '#9B59B6',
  Loft: '#8B6914',
  Defend: '#8A9A8E',
};

export const TEAM_COLORS = ['#1D7948', '#2563EB', '#EA580C', '#9333EA', '#84CC16'];
