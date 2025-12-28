'use client';

import { useState, useEffect } from 'react';
import {
  Coins,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Calendar,
  Download,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  fetchCreditBalance,
  fetchTransactions,
  fetchUsageSummary,
  getCreditBalanceColor,
  formatCredits,
  formatUSD,
} from '@/lib/api/credits';
import {
  CreditBalance as CreditBalanceType,
  Transaction,
  UsageSummary,
} from '@/types/credits';
import { AddCreditsModal } from './add-credits-modal';
import Link from 'next/link';

export function CreditDashboard() {
  const [balance, setBalance] = useState<CreditBalanceType | null>(null);
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddCreditsOpen, setIsAddCreditsOpen] = useState(false);
  
  // Transaction filters
  const [transactionType, setTransactionType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const itemsPerPage = 50;

  useEffect(() => {
    loadDashboardData();
  }, [currentPage, transactionType]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [balanceData, summaryData, transactionsData] = await Promise.all([
        fetchCreditBalance(),
        fetchUsageSummary(),
        fetchTransactions({
          limit: itemsPerPage,
          offset: (currentPage - 1) * itemsPerPage,
          transaction_type:
            transactionType !== 'all'
              ? (transactionType as any)
              : undefined,
        }),
      ]);

      setBalance(balanceData);
      setSummary(summaryData);
      setTransactions(transactionsData.transactions);
      setTotalTransactions(transactionsData.total_count);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Date',
      'Type',
      'Amount',
      'Model',
      'Tokens In',
      'Tokens Out',
      'Cost USD',
      'Balance After',
      'Description',
    ];

    const rows = transactions.map((t) => [
      new Date(t.created_at).toLocaleString(),
      t.transaction_type,
      t.amount,
      t.model_used || '-',
      t.tokens_input || '-',
      t.tokens_output || '-',
      t.cost_usd || '-',
      t.balance_after,
      t.description,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `credit-transactions-${new Date().toISOString()}.csv`;
    a.click();
  };

  const filteredTransactions = transactions.filter((t) =>
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(totalTransactions / itemsPerPage);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const color = balance ? getCreditBalanceColor(balance.balance) : 'green';
  // Calculate average per query from total spent and request count
  const averagePerQuery = summary && summary.request_count > 0
    ? summary.total_credits_spent / summary.request_count
    : 0;
  
  // Estimate queries remaining based on current balance and average
  const estimatedQueriesRemaining = summary && averagePerQuery > 0
    ? Math.floor(summary.current_balance / averagePerQuery)
    : 0;
  
  // Find most used model from recent requests
  const mostUsedModel = summary?.recent_requests.length
    ? summary.recent_requests.reduce((acc, req) => {
        acc[req.model] = (acc[req.model] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    : {};
  const primaryModel = Object.keys(mostUsedModel).length
    ? Object.entries(mostUsedModel).sort((a, b) => b[1] - a[1])[0][0]
    : 'N/A';

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span>Credit Management</span>
          </div>
          <h1 className="text-3xl font-bold">Credit Management</h1>
        </div>
        <Button onClick={() => setIsAddCreditsOpen(true)} size="lg">
          <Coins className="h-5 w-5 mr-2" />
          Add Credits
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Current Balance Card */}
        <Card className="relative overflow-hidden">
          <div
            className={cn(
              'absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 -mr-16 -mt-16',
              color === 'green' && 'bg-green-500',
              color === 'yellow' && 'bg-yellow-500',
              color === 'red' && 'bg-red-500'
            )}
          />
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Current Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-4xl font-bold">
                {balance ? formatCredits(balance.balance) : '0'}
              </div>
              <div className="text-sm text-muted-foreground">
                {balance ? formatUSD(balance.balance_usd) : '$0.00'} USD
              </div>
              <div className="flex items-center gap-2 mt-4">
                <div
                  className={cn(
                    'h-3 flex-1 rounded-full',
                    color === 'green' && 'bg-green-500',
                    color === 'yellow' && 'bg-yellow-500',
                    color === 'red' && 'bg-red-500'
                  )}
                  style={{
                    width: `${Math.min(
                      (balance?.balance || 0) / 50,
                      100
                    )}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {color === 'green' && 'Healthy balance'}
                {color === 'yellow' && 'Moderate - consider topping up'}
                {color === 'red' && 'Low - top up recommended'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Total Spent Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-4xl font-bold">
                {summary ? formatCredits(summary.total_credits_spent) : '0'}
              </div>
              <div className="text-sm text-muted-foreground">
                {summary
                  ? formatUSD(summary.total_usd_spent)
                  : '$0.00'}{' '}
                USD
              </div>
              <div className="flex items-center gap-2 mt-4">
                <span className="text-sm font-medium text-muted-foreground">
                  {summary?.request_count || 0} total requests
                </span>
              </div>
              {summary && summary.recent_requests.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Latest: {summary.recent_requests[0].model}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Usage Insights Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Usage Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-2xl font-bold">
                  {averagePerQuery > 0 ? averagePerQuery.toFixed(1) : '0'}
                </div>
                <div className="text-sm text-muted-foreground">
                  Avg credits per query
                </div>
              </div>
              <div className="pt-4 border-t space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Estimated queries left
                  </span>
                  <span className="font-semibold">
                    {estimatedQueriesRemaining > 0
                      ? estimatedQueriesRemaining.toLocaleString()
                      : '0'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Primary model</span>
                  <Badge variant="secondary">
                    {primaryModel}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Credits Section */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Top-Up</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={() => setIsAddCreditsOpen(true)}
              className="p-4 rounded-lg border-2 border-border hover:border-primary transition-all text-left hover:shadow-md"
            >
              <div className="space-y-2">
                <div className="text-xl font-bold">5,000</div>
                <div className="text-sm text-muted-foreground">credits</div>
                <div className="text-lg font-bold text-primary">$5.00</div>
                <div className="text-xs text-muted-foreground">
                  ~625 queries
                </div>
              </div>
            </button>

            <button
              onClick={() => setIsAddCreditsOpen(true)}
              className="relative p-4 rounded-lg border-2 border-primary bg-primary/5 transition-all text-left hover:shadow-lg"
            >
              <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500">
                Popular
              </Badge>
              <div className="space-y-2">
                <div className="text-xl font-bold">20,000</div>
                <div className="text-sm text-muted-foreground">credits</div>
                <div className="text-lg font-bold text-primary">$20.00</div>
                <div className="text-xs text-muted-foreground">
                  ~2,500 queries
                </div>
              </div>
            </button>

            <button
              onClick={() => setIsAddCreditsOpen(true)}
              className="p-4 rounded-lg border-2 border-border hover:border-primary transition-all text-left hover:shadow-md"
            >
              <Badge className="mb-2" variant="secondary">
                Best Value
              </Badge>
              <div className="space-y-2">
                <div className="text-xl font-bold">50,000</div>
                <div className="text-sm text-muted-foreground">credits</div>
                <div className="text-lg font-bold text-primary">$50.00</div>
                <div className="text-xs text-muted-foreground">
                  ~6,250 queries
                </div>
              </div>
            </button>

            <button
              onClick={() => setIsAddCreditsOpen(true)}
              className="p-4 rounded-lg border-2 border-dashed border-border hover:border-primary transition-all text-left hover:shadow-md flex items-center justify-center"
            >
              <div className="text-center">
                <div className="text-lg font-semibold mb-1">Custom Amount</div>
                <div className="text-sm text-muted-foreground">
                  Choose your own
                </div>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transaction History</CardTitle>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={transactionType} onValueChange={setTransactionType}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="addition">Additions</SelectItem>
                <SelectItem value="deduction">Deductions</SelectItem>
                <SelectItem value="initial">Initial</SelectItem>
                <SelectItem value="refund">Refunds</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead className="text-right">Tokens</TableHead>
                  <TableHead className="text-right">Cost USD</TableHead>
                  <TableHead className="text-right">Balance After</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <p className="text-muted-foreground">
                        No transactions found
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        {new Date(transaction.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            transaction.transaction_type === 'addition'
                              ? 'default'
                              : transaction.transaction_type === 'deduction'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {transaction.transaction_type}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={cn(
                          'text-right font-semibold',
                          transaction.amount > 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        )}
                      >
                        {transaction.amount > 0 ? '+' : ''}
                        {formatCredits(transaction.amount)}
                      </TableCell>
                      <TableCell>
                        {transaction.model_used ? (
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {transaction.model_used}
                          </code>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {transaction.tokens_input && transaction.tokens_output
                          ? `${transaction.tokens_input.toLocaleString()}/${transaction.tokens_output.toLocaleString()}`
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {transaction.cost_usd
                          ? formatUSD(transaction.cost_usd)
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCredits(transaction.balance_after)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {transaction.description}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, totalTransactions)} of{' '}
                {totalTransactions} transactions
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Credits Modal */}
      <AddCreditsModal
        open={isAddCreditsOpen}
        onOpenChange={setIsAddCreditsOpen}
      />
    </div>
  );
}
