'use client';

import { useState, useEffect } from 'react';
import { Coins, Check, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { addCredits, formatCredits, formatUSD, type CreditPackage } from '@/features/credits/apis/credits-api';
import { useToast } from '@/hooks/use-toast';

const PRESET_PACKAGES: CreditPackage[] = [
  {
    id: 'starter',
    credits: 5000,
    price: 5,
    estimated_queries: 625,
    label: 'Starter',
  },
  {
    id: 'popular',
    credits: 20000,
    price: 20,
    estimated_queries: 2500,
    label: 'Popular',
    popular: true,
  },
  {
    id: 'pro',
    credits: 50000,
    price: 50,
    estimated_queries: 6250,
    label: 'Pro - Best Value',
  },
];

interface AddCreditsModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddCreditsModal({ open: controlledOpen, onOpenChange }: AddCreditsModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string>('popular');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

  useEffect(() => {
    const handleOpenModal = () => {
      setIsOpen(true);
    };

    window.addEventListener('open-add-credits-modal', handleOpenModal);
    return () => window.removeEventListener('open-add-credits-modal', handleOpenModal);
  }, [setIsOpen]);

  const handleSelectPackage = (packageId: string) => {
    setSelectedPackage(packageId);
    setIsCustom(false);
    setCustomAmount('');
  };

  const handleCustomSelect = () => {
    setIsCustom(true);
    setSelectedPackage('');
  };

  const getSelectedAmount = (): number | null => {
    if (isCustom) {
      const amount = parseInt(customAmount);
      return isNaN(amount) || amount < 100 ? null : amount;
    }
    const pkg = PRESET_PACKAGES.find((p) => p.id === selectedPackage);
    return pkg?.credits || null;
  };

  const handleAddCredits = async () => {
    const amount = getSelectedAmount();
    if (!amount) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter at least 100 credits',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      const response = await addCredits(amount);
      
      toast({
        title: 'Credits added successfully! 🎉',
        description: `${formatCredits(amount)} credits added. New balance: ${formatCredits(
          response.balance
        )} credits`,
      });

      setSelectedPackage('popular');
      setCustomAmount('');
      setIsCustom(false);
      setIsOpen(false);

      window.dispatchEvent(new CustomEvent('credits-updated'));
    } catch (error) {
      toast({
        title: 'Failed to add credits',
        description: 'Please try again or contact support',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Coins className="h-6 w-6 text-primary" />
            Add Credits
          </DialogTitle>
          <DialogDescription>
            Choose a package or enter a custom amount. Each credit = $0.001 USD
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PRESET_PACKAGES.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => handleSelectPackage(pkg.id)}
                className={cn(
                  'relative p-4 rounded-lg border-2 transition-all text-left hover:shadow-lg',
                  selectedPackage === pkg.id && !isCustom
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border hover:border-primary/50'
                )}
              >
                {pkg.popular && (
                  <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Popular
                  </Badge>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">{pkg.label}</h3>
                    {selectedPackage === pkg.id && !isCustom && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </div>

                  <div>
                    <div className="text-2xl font-bold">
                      {formatCredits(pkg.credits)}
                    </div>
                    <div className="text-sm text-muted-foreground">credits</div>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="text-xl font-bold text-primary">
                      {formatUSD(pkg.price)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      ~{pkg.estimated_queries.toLocaleString()} portfolio queries
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div
            className={cn(
              'p-4 rounded-lg border-2 transition-all',
              isCustom
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-border'
            )}
          >
            <div className="flex items-start gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="custom-amount" className="text-base font-semibold">
                    Custom Amount
                  </Label>
                  {isCustom && <Check className="h-5 w-5 text-primary" />}
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      id="custom-amount"
                      type="number"
                      placeholder="Enter credits (min 100)"
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                        handleCustomSelect();
                      }}
                      onFocus={handleCustomSelect}
                      min={100}
                      step={100}
                    />
                  </div>
                  <div className="flex items-center px-3 bg-muted rounded-md text-sm text-muted-foreground">
                    {customAmount
                      ? formatUSD(parseInt(customAmount) * 0.001)
                      : '$0.00'}
                  </div>
                </div>

                {customAmount && parseInt(customAmount) >= 100 && (
                  <div className="text-xs text-muted-foreground">
                    ~{Math.floor(parseInt(customAmount) / 8).toLocaleString()} estimated
                    queries
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isProcessing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddCredits}
              disabled={!getSelectedAmount() || isProcessing}
              className="flex-1"
            >
              {isProcessing ? (
                <>Processing...</>
              ) : (
                <>
                  <Coins className="h-4 w-4 mr-2" />
                  Add {getSelectedAmount() ? formatCredits(getSelectedAmount()!) : ''}{' '}
                  Credits
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Credits are non-refundable and never expire. Estimates based on GPT-4o-mini.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
