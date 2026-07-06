import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { FixtureStatus, PredictionType } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUsdc(amount: number | string): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `$${n.toFixed(2)}`;
}

export function formatPoints(pts: number): string {
  return `${pts} pts`;
}

export function formatDeadline(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatKickoff(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function timeUntilDeadline(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return 'Passed';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h left`;
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${mins}m left`;
}

export function isDeadlinePassed(iso: string): boolean {
  return new Date(iso).getTime() < Date.now();
}

export function shortenAddress(addr: string, chars = 4): string {
  return `${addr.slice(0, chars)}...${addr.slice(-chars)}`;
}

export function fixtureStatusLabel(status: FixtureStatus): string {
  const labels: Record<FixtureStatus, string> = {
    NS: 'Not Started',
    H1: '1st Half',
    HT: 'Half Time',
    H2: '2nd Half',
    FT: 'Full Time',
    ET: 'Extra Time',
    FET: 'After ET',
    PEN: 'Penalties',
    FPEN: 'After Pens',
    PST: 'Postponed',
    CANC: 'Cancelled',
    INT: 'Interrupted',
  };
  return labels[status] ?? status;
}

export function isFixtureLive(status: FixtureStatus): boolean {
  return ['H1', 'HT', 'H2', 'ET', 'PEN'].includes(status);
}

export function isFixtureFinished(status: FixtureStatus): boolean {
  return ['FT', 'FET', 'FPEN'].includes(status);
}

export function predictionTypeLabel(type: PredictionType): string {
  const labels: Record<PredictionType, string> = {
    match_result: 'Result',
    correct_score: 'Score',
    both_teams_score: 'BTTS',
    over_under_2_5: 'O/U 2.5',
  };
  return labels[type] ?? type;
}

export function predictionValueLabel(type: PredictionType, value: string): string {
  if (type === 'match_result') {
    return value === 'home' ? 'Home Win' : value === 'away' ? 'Away Win' : 'Draw';
  }
  if (type === 'both_teams_score') return value === 'yes' ? 'Yes' : 'No';
  if (type === 'over_under_2_5') return value === 'over' ? 'Over 2.5' : 'Under 2.5';
  return value; // correct_score returns as-is (e.g. "2-1")
}
