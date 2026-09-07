import { Organization } from '@/components/admin/types';

/**
 * Trial length used by the app. Must stay in sync with TRIAL_DAYS in
 * supabase/functions/check-subscription/index.ts.
 */
export const TRIAL_DAYS = 14;

/** Accounts that always get full access (mirrors check-subscription). */
export const INTERNAL_EMAILS = [
  'gearheadgarage.pk@gmail.com',
  'daniyal.reviewer@gmail.com',
];

export type OrgStatus =
  | 'internal'
  | 'paid'
  | 'suspended'
  | 'canceling'
  | 'subscription_ended'
  | 'trial_active'
  | 'trial_expired';

const toDate = (value?: string | null) =>
  value ? new Date(value) : null;

const isFuture = (value?: string | null) => {
  const d = toDate(value);
  return !!d && !isNaN(d.getTime()) && d.getTime() > Date.now();
};

/** Date the trial ends: stored value, else creation date + 14 days. */
export function getTrialEnd(org: Organization): Date | null {
  const stored = toDate(org.trial_ends_at);
  if (stored && !isNaN(stored.getTime())) return stored;
  const created = toDate(org.created_at);
  if (!created || isNaN(created.getTime())) return null;
  return new Date(created.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
}

/**
 * Decides an organization's state the same way the app does: internal accounts
 * first, then a live paid subscription, and only then the trial window. A
 * paying organization is never treated as an expired trial.
 */
export function getOrgStatus(org: Organization): OrgStatus {
  if (org.email && INTERNAL_EMAILS.includes(org.email.toLowerCase())) {
    return 'internal';
  }

  if (org.suspended === true || org.subscription_status === 'suspended') {
    return 'suspended';
  }

  const level = (org.subscription_level || '').toLowerCase();
  const isPaidLevel = !!level && level !== 'trial' && level !== 'free';

  // A paid plan the shop asked to stop: still live until the period end.
  if (isPaidLevel && org.subscription_status === 'canceling') {
    return 'canceling';
  }

  // A paid plan that has lapsed is not an expired trial.
  if (isPaidLevel && org.subscription_status === 'ended') {
    return 'subscription_ended';
  }

  // A paid plan counts while its renewal / period end is still ahead (or the
  // renewal date is unknown but the stored status says active).
  if (isPaidLevel) {
    const paidUntil = org.next_billing_date || org.trial_ends_at;
    if (isFuture(paidUntil) || (!paidUntil && org.subscription_status === 'active')) {
      return 'paid';
    }
  }

  const trialEnd = getTrialEnd(org);
  if (trialEnd && trialEnd.getTime() > Date.now()) return 'trial_active';
  return 'trial_expired';
}

export const isPaidOrg = (org: Organization) => getOrgStatus(org) === 'paid';
export const isTrialActive = (org: Organization) =>
  getOrgStatus(org) === 'trial_active';
export const isCanceling = (org: Organization) =>
  getOrgStatus(org) === 'canceling';
export const isSubscriptionEnded = (org: Organization) =>
  getOrgStatus(org) === 'subscription_ended';
export const isTrialExpired = (org: Organization) =>
  getOrgStatus(org) === 'trial_expired';

/** Whole days between now and a date (negative when in the past). */
export function daysFromNow(date: Date) {
  return Math.round((date.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

/** Short human label, e.g. "Trial — 5 days left" or "Trial expired 12 days ago". */
export function getStatusLabel(org: Organization): string {
  const status = getOrgStatus(org);
  const trialEnd = getTrialEnd(org);

  switch (status) {
    case 'internal':
      return 'Internal — full access';
    case 'suspended':
      return 'Suspended';
    case 'canceling': {
      const until = org.next_billing_date || org.trial_ends_at;
      return until
        ? `Cancelling — access until ${new Date(until).toLocaleDateString()}`
        : 'Cancelling at period end';
    }
    case 'subscription_ended':
      return `${org.subscription_level || 'Subscription'} — subscription ended`;
    case 'paid': {
      const renew = org.next_billing_date || org.trial_ends_at;
      const level = org.subscription_level || 'Paid';
      return renew
        ? `${level} — renews ${new Date(renew).toLocaleDateString()}`
        : `${level} — active`;
    }
    case 'trial_active': {
      if (!trialEnd) return 'Trial';
      const days = daysFromNow(trialEnd);
      return days <= 0 ? 'Trial — ends today' : `Trial — ${days} day${days === 1 ? '' : 's'} left`;
    }
    default: {
      if (!trialEnd) return 'Trial expired';
      const days = Math.abs(daysFromNow(trialEnd));
      return days === 0
        ? 'Trial expired today'
        : `Trial expired ${days} day${days === 1 ? '' : 's'} ago`;
    }
  }
}
