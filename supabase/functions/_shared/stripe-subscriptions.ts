export const LIVE_SUBSCRIPTION_STATUSES = ['active', 'trialing', 'past_due'];

export type StripeSubscriptionDiscovery = {
  subscription: any | null;
  subscriberRows: any[];
  customerIds: string[];
  source: 'subscription_id' | 'customer_id' | 'email' | null;
};

export function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export function getCustomerId(subscription: any): string | null {
  const customer = subscription?.customer;
  if (typeof customer === 'string') return customer;
  return asString(customer?.id);
}

export function isLiveSubscription(subscription: any): boolean {
  return LIVE_SUBSCRIPTION_STATUSES.includes(String(subscription?.status || ''));
}

export function getPeriodEndSeconds(subscription: any): number | null {
  const topLevel = Number(subscription?.current_period_end || 0);
  if (topLevel > 0) return topLevel;

  const itemEnds = Array.isArray(subscription?.items?.data)
    ? subscription.items.data
        .map((item: any) => Number(item?.current_period_end || 0))
        .filter((value: number) => value > 0)
    : [];

  if (itemEnds.length === 0) return null;
  return Math.max(...itemEnds);
}

export function getPeriodEndIso(subscription: any): string | null {
  const seconds = getPeriodEndSeconds(subscription);
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}

export function getPlanName(subscription: any, fallback = 'Basic'): string {
  const firstItem = subscription?.items?.data?.[0];
  const price = firstItem?.price;
  const product = price?.product;
  const productName = typeof product === 'object' ? asString(product?.name) : null;
  const nickname = asString(price?.nickname);
  const amount = Number(price?.unit_amount || 0);

  const named = productName || nickname;
  if (named) {
    const lower = named.toLowerCase();
    if (lower.includes('enterprise')) return 'Enterprise';
    if (lower.includes('professional')) return 'Professional';
    if (lower.includes('basic')) return 'Basic';
    if (lower.includes('trial')) return 'Trial';
  }

  if (amount >= 19900) return 'Enterprise';
  if (amount >= 7900) return 'Professional';
  if (amount > 0) return 'Basic';
  return fallback;
}

async function retrieveSubscription(stripe: any, subscriptionId: string): Promise<any | null> {
  try {
    return await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price.product'],
    });
  } catch (_error) {
    return null;
  }
}

async function listSubscriptionsForCustomer(stripe: any, customerId: string): Promise<any[]> {
  try {
    const result = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 100,
      expand: ['data.items.data.price.product'],
    });
    return result.data || [];
  } catch (_error) {
    return [];
  }
}

async function listCustomersByEmail(stripe: any, emails: string[]): Promise<any[]> {
  const uniqueEmails = Array.from(new Set(emails.filter(Boolean)));
  const results = await Promise.all(
    uniqueEmails.map((email) => stripe.customers.list({ email, limit: 100 }).catch(() => ({ data: [] })))
  );
  return results.flatMap((result: any) => result.data || []);
}

function newestSubscription(subscriptions: any[]): any | null {
  if (subscriptions.length === 0) return null;
  return [...subscriptions].sort(
    (a, b) => (getPeriodEndSeconds(b) || 0) - (getPeriodEndSeconds(a) || 0)
  )[0];
}

export async function discoverLiveSubscription(args: {
  stripe: any;
  supabase: any;
  organizationId: string;
  emails?: string[];
}): Promise<StripeSubscriptionDiscovery> {
  const { stripe, supabase, organizationId, emails = [] } = args;

  const { data: subscriberRows } = await supabase
    .from('subscribers')
    .select('id, user_id, email, stripe_customer_id, stripe_subscription_id, subscribed, subscription_tier, subscription_end, suspended')
    .eq('organization_id', organizationId);

  const rows = subscriberRows || [];
  const savedSubscriptionIds = Array.from(
    new Set(rows.map((row: any) => asString(row.stripe_subscription_id)).filter(Boolean))
  ) as string[];

  for (const subscriptionId of savedSubscriptionIds) {
    const subscription = await retrieveSubscription(stripe, subscriptionId);
    if (subscription && isLiveSubscription(subscription)) {
      return {
        subscription,
        subscriberRows: rows,
        customerIds: Array.from(new Set([getCustomerId(subscription)].filter(Boolean))) as string[],
        source: 'subscription_id',
      };
    }
  }

  const savedCustomerIds = Array.from(
    new Set(rows.map((row: any) => asString(row.stripe_customer_id)).filter(Boolean))
  ) as string[];

  const customerSubscriptions = (
    await Promise.all(savedCustomerIds.map((customerId) => listSubscriptionsForCustomer(stripe, customerId)))
  ).flat();
  const liveFromSavedCustomers = newestSubscription(customerSubscriptions.filter(isLiveSubscription));
  if (liveFromSavedCustomers) {
    return {
      subscription: liveFromSavedCustomers,
      subscriberRows: rows,
      customerIds: savedCustomerIds,
      source: 'customer_id',
    };
  }

  const emailCustomers = await listCustomersByEmail(stripe, emails);
  const emailCustomerIds = Array.from(new Set(emailCustomers.map((customer: any) => customer.id).filter(Boolean)));
  const emailSubscriptions = (
    await Promise.all(emailCustomerIds.map((customerId: string) => listSubscriptionsForCustomer(stripe, customerId)))
  ).flat();
  const liveFromEmail = newestSubscription(emailSubscriptions.filter(isLiveSubscription));

  return {
    subscription: liveFromEmail,
    subscriberRows: rows,
    customerIds: Array.from(new Set([...savedCustomerIds, ...emailCustomerIds])),
    source: liveFromEmail ? 'email' : null,
  };
}
