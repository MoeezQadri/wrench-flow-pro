import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  XCircle,
  Star,
  RefreshCw,
  Zap,
  Users,
  Crown,
  Building2,
} from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly?: number;
}

interface PricingPlansProps {
  plans: SubscriptionPlan[];
  subscribed: boolean;
  subscriptionTier?: string | null;
  checkoutLoading: string | null;
  onSubscribe: (planId: string, billing: 'monthly' | 'yearly') => void;
  highlightedPlan?: string;
}

type TierKey = 'Free' | 'Basic' | 'Professional' | 'Enterprise';

interface TierConfig {
  key: TierKey;
  matchName: string; // name in DB
  icon: React.ReactNode;
  priceMonthly: number;
  priceYearly: number;
  users: string;
  tagline: string;
  included: string[];
  excluded?: string[];
  cta: string;
  popular?: boolean;
  note?: string;
  isTrial?: boolean;
}

const TIERS: TierConfig[] = [
  {
    key: 'Free',
    matchName: 'trial',
    icon: <Zap className="h-5 w-5" />,
    priceMonthly: 0,
    priceYearly: 0,
    users: '1 user',
    tagline: '14-day full access, every feature unlocked',
    included: ['Every feature unlocked for 14 days'],
    cta: 'Start Free Trial',
    isTrial: true,
  },
  {
    key: 'Basic',
    matchName: 'basic',
    icon: <Users className="h-5 w-5" />,
    priceMonthly: 29,
    priceYearly: 290,
    users: 'Up to 3 users',
    tagline: 'Core operations for a small shop',
    included: [
      'Invoicing & estimates',
      'Job board',
      'Technician performance tracking',
      'Inventory',
      'Income / expense reporting',
      'Manual invoice & estimate download & sharing',
    ],
    excluded: [
      'Automated reminders',
      'SMS / email delivery',
      'Review requests',
    ],
    cta: 'Get Started',
  },
  {
    key: 'Professional',
    matchName: 'professional',
    icon: <Crown className="h-5 w-5" />,
    priceMonthly: 79,
    priceYearly: 790,
    users: 'Up to 10 users',
    tagline: 'Everything in Basic, plus automation',
    included: [
      'Everything in Basic',
      'Automated time & mileage-based reminders',
      'Automated SMS & email delivery',
      'Post-service review & feedback requests (Google / Yelp)',
    ],
    cta: 'Get Started',
    popular: true,
  },
  {
    key: 'Enterprise',
    matchName: 'enterprise',
    icon: <Building2 className="h-5 w-5" />,
    priceMonthly: 199,
    priceYearly: 1990,
    users: 'Up to 50 users',
    tagline: 'The full growth toolkit',
    included: [
      'Everything in Professional',
      'Customer reactivation campaigns',
      'Lapsed-customer outreach',
      'Website booking form',
      'Custom branding',
    ],
    cta: 'Get Started',
    note:
      'Priced for the full growth toolkit — a small team wanting complete automation belongs here too, not just large operations.',
  },
];

const PricingPlans: React.FC<PricingPlansProps> = ({
  plans,
  subscribed,
  subscriptionTier,
  checkoutLoading,
  onSubscribe,
  highlightedPlan,
}) => {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

  const findPlanId = (matchName: string): string | undefined => {
    const p = plans.find(
      (pl) => pl.name?.toLowerCase() === matchName.toLowerCase()
    );
    return p?.id;
  };

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">
            {subscribed ? 'Upgrade or Change Plan' : 'Choose Your Plan'}
          </h3>
          <p className="text-sm text-muted-foreground">
            Simple pricing that scales with your shop.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="inline-flex items-center rounded-lg border bg-muted p-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setBilling('monthly')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              billing === 'monthly'
                ? 'bg-background shadow-sm font-medium'
                : 'text-muted-foreground'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBilling('yearly')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-2 ${
              billing === 'yearly'
                ? 'bg-background shadow-sm font-medium'
                : 'text-muted-foreground'
            }`}
          >
            Annual
            <span className="text-xs text-green-600 font-medium">17% off</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {TIERS.map((tier) => {
          const isCurrentPlan =
            subscriptionTier?.toLowerCase() === tier.matchName.toLowerCase();
          const planId = findPlanId(tier.matchName);
          const price =
            billing === 'monthly' ? tier.priceMonthly : tier.priceYearly;
          const priceSuffix = billing === 'monthly' ? '/mo' : '/yr';
          const loading = planId ? checkoutLoading === planId : false;

          return (
            <Card
              key={tier.key}
              className={`relative flex flex-col ${
                isCurrentPlan ? 'ring-2 ring-primary' : ''
              } ${tier.popular ? 'border-primary shadow-md' : ''}`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    <Star className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              {isCurrentPlan && (
                <div className="absolute -top-3 right-4">
                  <Badge variant="secondary">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Current
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  {tier.icon}
                  <CardTitle className="text-lg">{tier.key}</CardTitle>
                </div>
                <div className="mt-2">
                  <span className="text-3xl font-bold">${price}</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {priceSuffix}
                  </span>
                </div>
                <CardDescription className="text-xs mt-1">
                  {tier.users} · {tier.tagline}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0 flex-1 flex flex-col">
                <ul className="space-y-2 mb-4">
                  {tier.included.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                  {tier.excluded?.map((f, i) => (
                    <li
                      key={`x-${i}`}
                      className="flex items-start gap-2 text-xs text-muted-foreground"
                    >
                      <XCircle className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <span className="line-through">{f}</span>
                    </li>
                  ))}
                </ul>

                {tier.note && (
                  <p className="text-xs text-muted-foreground italic mb-4">
                    {tier.note}
                  </p>
                )}

                <div className="mt-auto">
                  <Button
                    onClick={() => planId && onSubscribe(planId, billing)}
                    disabled={loading || isCurrentPlan || !planId || tier.isTrial}
                    className="w-full text-sm"
                    variant={
                      isCurrentPlan
                        ? 'outline'
                        : tier.popular
                          ? 'default'
                          : 'default'
                    }
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : isCurrentPlan ? (
                      'Current Plan'
                    ) : (
                      tier.cta
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center mt-6 max-w-3xl mx-auto">
        No contracts. Cancel anytime. Automation setup on Professional and
        Enterprise is configured by our team after signup — reach out and we'll
        have it running quickly.
      </p>
    </div>
  );
};

export default PricingPlans;
