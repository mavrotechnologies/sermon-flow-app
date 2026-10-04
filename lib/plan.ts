/**
 * Plan limits and usage.
 *
 * TODO(billing): no payment provider is wired up, so every account is treated as
 * Free. Replace `getPlanForUser` with a real subscription lookup once billing
 * exists — the limits below mirror the pricing page.
 *
 * TODO(persistence): sessions aren't recorded anywhere yet (no database, no
 * localStorage — see `getMonthlyUsage`). Usage therefore reads as zero rather
 * than as a real measurement, and the UI says so explicitly instead of implying
 * the number is meaningful.
 */

export type PlanId = 'free' | 'church-pro';

export interface Plan {
  id: PlanId;
  name: string;
  /** Listening minutes included each month, or null for unlimited. */
  minutesPerMonth: number | null;
}

export const PLANS: Record<PlanId, Plan> = {
  free: { id: 'free', name: 'Free', minutesPerMonth: 5 * 60 },
  'church-pro': { id: 'church-pro', name: 'Church Pro', minutesPerMonth: null },
};

/** Every account is on Free until billing is wired up. */
export function getPlanForUser(): Plan {
  return PLANS.free;
}

export interface MonthlyUsage {
  sessions: number;
  minutesUsed: number;
}

/**
 * Whether usage figures reflect anything real. False until sessions are
 * persisted — the UI uses this to label the readout honestly.
 */
export const USAGE_TRACKING_ENABLED = false;

export function getMonthlyUsage(): MonthlyUsage {
  return { sessions: 0, minutesUsed: 0 };
}

/** "0h 0m", "45m", "2h 30m" */
export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainder = Math.round(minutes % 60);
  if (hours === 0) return `${remainder}m`;
  if (remainder === 0) return `${hours}h`;
  return `${hours}h ${remainder}m`;
}
