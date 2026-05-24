const ZONES: Array<{ name: string; minAngle: number; maxAngle: number }> = [
  { name: 'Fine leg', minAngle: 135, maxAngle: 180 },
  { name: 'Backward sq leg', minAngle: 110, maxAngle: 135 },
  { name: 'Square leg', minAngle: 85, maxAngle: 110 },
  { name: 'Mid-wicket', minAngle: 55, maxAngle: 85 },
  { name: 'Mid-on', minAngle: 25, maxAngle: 55 },
  { name: 'Straight', minAngle: -25, maxAngle: 25 },
  { name: 'Mid-off', minAngle: -55, maxAngle: -25 },
  { name: 'Cover', minAngle: -85, maxAngle: -55 },
  { name: 'Point', minAngle: -110, maxAngle: -85 },
  { name: '3rd man', minAngle: -180, maxAngle: -110 },
];

export function getZoneFromAngle(angleDeg: number): string {
  let a = angleDeg;
  while (a > 180) a -= 360;
  while (a < -180) a += 360;
  for (const z of ZONES) {
    if (a >= z.minAngle && a < z.maxAngle) return z.name;
  }
  return 'Straight';
}

export function getDistanceFromTap(x: number, y: number, centerX: number, centerY: number, maxRadius: number): number {
  const dx = x - centerX;
  const dy = centerY - y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const ratio = Math.min(dist / maxRadius, 1);
  return Math.round(ratio * 80);
}

export function getAngleFromTap(x: number, y: number, centerX: number, centerY: number): number {
  const dx = x - centerX;
  const dy = centerY - y;
  const rad = Math.atan2(dy, dx);
  return Math.round((rad * 180) / Math.PI);
}

export function formatAngleLabel(angle: number): string {
  const side = angle >= 0 ? 'leg' : 'off';
  return `${Math.abs(angle)}° ${side}`;
}

export function playerDisplayName(p: { guestName?: string; user?: { firstName: string; lastName: string } }): string {
  if (p.guestName) return p.guestName;
  if (p.user) return `${p.user.firstName.charAt(0)} ${p.user.lastName}`.trim();
  return 'Unknown';
}

export function playerInitials(p: { guestName?: string; user?: { firstName: string; lastName: string } }): string {
  if (p.guestName) {
    const parts = p.guestName.split(' ');
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : p.guestName.slice(0, 2).toUpperCase();
  }
  if (p.user) return `${p.user.firstName[0]}${p.user.lastName[0]}`.toUpperCase();
  return '??';
}

export function formatOvers(overs: number): string {
  const whole = Math.floor(overs);
  const balls = Math.round((overs - whole) * 10);
  return balls > 0 ? `${whole}.${balls}` : `${whole}.0`;
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function validatePasswordClient(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[a-zA-Z]/.test(password)) return 'Password must contain at least one letter';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
  if (!/[^a-zA-Z0-9]/.test(password)) return 'Password must contain at least one symbol';
  return null;
}

export function validateUsernameClient(username: string): string | null {
  if (username.length < 3) return 'Username must be at least 3 characters';
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Letters, numbers, and underscores only';
  return null;
}
