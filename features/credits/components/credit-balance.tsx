'use client';

import { useState, useEffect } from 'react';
import { Coins, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  fetchCreditBalance,
  getCreditBalanceColor,
  formatCredits,
  formatUSD,
  type CreditBalance as CreditBalanceType,
} from '@/features/credits/apis/credits-api';
import { useRouter } from 'next/navigation';

export function CreditBalance() {
  const [balance, setBalance] = useState<CreditBalanceType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadBalance();

    const onCreditsUpdated = () => loadBalance();
    window.addEventListener('credits-updated', onCreditsUpdated);

    return () => window.removeEventListener('credits-updated', onCreditsUpdated);
  }, []);

  const loadBalance = async () => {
    try {
      const data = await fetchCreditBalance();
      setBalance(data);
    } catch (error) {
      console.error('Failed to fetch credit balance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopUp = () => {
    window.dispatchEvent(new CustomEvent('open-add-credits-modal'));
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Credit Balance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!balance) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            Unable to load credit balance
          </p>
        </CardContent>
      </Card>
    );
  }

  const color = getCreditBalanceColor(balance.balance);
  const progressValue = Math.min((balance.balance / 5000) * 100, 100);

  const colorClasses = {
    green: {
      text: 'text-green-600',
      bg: 'bg-green-100',
      progress: 'bg-green-500',
    },
    yellow: {
      text: 'text-yellow-600',
      bg: 'bg-yellow-100',
      progress: 'bg-yellow-500',
    },
    red: {
      text: 'text-red-600',
      bg: 'bg-red-100',
      progress: 'bg-red-500',
    },
  };

  return (
    <Card className="relative overflow-hidden">
      <div
        className={cn(
          'absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 -mr-16 -mt-16',
          colorClasses[color].bg
        )}
      />
      
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Coins className={cn('h-5 w-5', colorClasses[color].text)} />
          Credit Balance
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">
              {formatCredits(balance.balance)}
            </span>
            <span className="text-lg text-muted-foreground">credits</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {formatUSD(balance.balance_usd)} USD
            </span>
            {color === 'green' && (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <TrendingUp className="h-3 w-3" />
                Healthy
              </span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                'h-full transition-all duration-300',
                colorClasses[color].progress
              )}
              style={{ width: `${progressValue}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {color === 'red' && 'Low balance'}
              {color === 'yellow' && 'Moderate balance'}
              {color === 'green' && 'Good balance'}
            </span>
            <span>5,000 credits</span>
          </div>
        </div>

        <Button
          onClick={handleTopUp}
          className="w-full"
          variant={color === 'red' ? 'default' : 'outline'}
        >
          <Coins className="h-4 w-4 mr-2" />
          Top Up Credits
        </Button>

        {color === 'red' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-800">
              <strong>Low balance!</strong> Add credits to continue analyzing your
              portfolio.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
