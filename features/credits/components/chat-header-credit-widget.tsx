'use client';

import { useState, useEffect } from 'react';
import { Coins, ChevronDown, TrendingDown, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  fetchCreditBalance,
  getCreditBalanceColor,
  formatCredits,
  formatUSD,
  type CreditBalance,
} from '@/features/credits/apis/credits-api';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

export function ChatHeaderCreditWidget() {
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [lastQueryCost, setLastQueryCost] = useState<number>(8);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    loadBalance();

    const onCreditsUpdated = () => {
      triggerBalanceAnimation();
      loadBalance();
    };
    window.addEventListener('credits-updated', onCreditsUpdated);

    return () => window.removeEventListener('credits-updated', onCreditsUpdated);
  }, []);

  const loadBalance = async () => {
    try {
      if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_FASTAPI_URL) {
        console.log('💳 Credits API: Using mock data (NEXT_PUBLIC_FASTAPI_URL not set)');
        setBalance({
          user_id: 'dev-user',
          balance: 4250,
          balance_usd: 4.25,
        });
        setError(null);
        setIsLoading(false);
        return;
      }

      const data = await fetchCreditBalance();
      if (!data) {
        setBalance(null);
        setError('Please log in to view credits');
        return;
      }
      setBalance(data);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch credit balance:', error);
      setError('Failed to load credits');
      if (process.env.NODE_ENV === 'development') {
        console.log('💳 Credits API: Using fallback mock data');
        setBalance({
          user_id: 'dev-user',
          balance: 4250,
          balance_usd: 4.25,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const triggerBalanceAnimation = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);
  };

  const handleAddCredits = () => {
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent('open-add-credits-modal'));
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-32" />
      </div>
    );
  }

  if (!balance && process.env.NODE_ENV === 'development') {
    return (
      <Button
        variant="outline"
        className="h-9 px-3 gap-2 border-yellow-200 bg-yellow-50 text-yellow-700"
        title={error || 'Credits API not configured'}
      >
        <Coins className="h-4 w-4" />
        <span className="text-xs">API Error</span>
      </Button>
    );
  }

  if (!balance) {
    return null;
  }

  const color = getCreditBalanceColor(balance.balance);
  const colorClasses = {
    green: 'bg-green-50 text-green-700 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  };

  const iconColorClasses = {
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'h-9 px-3 gap-2 transition-all duration-300 border',
            colorClasses[color],
            isAnimating && 'scale-95'
          )}
        >
          <Coins className={cn('h-4 w-4', iconColorClasses[color])} />
          <div className="flex items-baseline gap-1">
            <span
              className={cn(
                'font-semibold transition-all duration-300',
                isAnimating && 'animate-pulse'
              )}
            >
              {formatCredits(balance.balance)}
            </span>
            <span className="text-xs opacity-70 hidden sm:inline">credits</span>
          </div>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm text-muted-foreground">
                Credit Balance
              </h4>
              <Link
                href="/dashboard/credits"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                Dashboard
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
            
            <div className="space-y-1">
              <div className="text-2xl font-bold">
                {formatCredits(balance.balance)}
              </div>
              <div className="text-sm text-muted-foreground">
                {formatUSD(balance.balance_usd)} USD
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <div
                className={cn(
                  'h-2 w-2 rounded-full',
                  color === 'green' && 'bg-green-500',
                  color === 'yellow' && 'bg-yellow-500',
                  color === 'red' && 'bg-red-500'
                )}
              />
              <span className="text-muted-foreground">
                {color === 'green' && 'Healthy balance'}
                {color === 'yellow' && 'Moderate balance'}
                {color === 'red' && 'Low balance - consider topping up'}
              </span>
            </div>
          </div>

          {lastQueryCost > 0 && (
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 text-xs">
                <span className="text-muted-foreground">Last query: </span>
                <span className="font-medium">-{lastQueryCost} credits</span>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t">
            <Button
              onClick={handleAddCredits}
              className="flex-1"
              size="sm"
            >
              Add Credits
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Link href="/dashboard/credits">
                View Transactions
              </Link>
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
