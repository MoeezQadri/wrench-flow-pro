import { Link, useSearchParams } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { XCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { trackPaymentCanceled } from '@/lib/analytics';

export default function PaymentCanceled() {
  const [searchParams] = useSearchParams();
  const plan = searchParams.get('plan') || undefined;
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    trackPaymentCanceled({ planName: plan });
  }, [plan]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <div className="mx-auto mb-2">
            <XCircle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle>Checkout canceled</CardTitle>
          <CardDescription>
            Your payment was not completed and you have not been charged. You
            can pick a plan again whenever you're ready.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link to="/settings?tab=subscription">Back to plans</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/">Go to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
