export interface CreditBalance {
  user_id: string;
  balance: number;
  balance_usd: number;
}

export interface Transaction {
  id: string;
  user_id: string;
  transaction_type: 'addition' | 'deduction' | 'initial' | 'refund';
  amount: number;
  balance_after: number;
  created_at: string;
  description: string;
  model_used?: string;
  tokens_input?: number;
  tokens_output?: number;
  cost_usd?: number;
  request_id?: string;
}

export interface TransactionResponse {
  transactions: Transaction[];
  total_count: number;
  limit: number;
  offset: number;
}

export interface UsageSummary {
  current_balance: number;
  current_balance_usd: number;
  total_credits_spent: number;
  total_usd_spent: number;
  request_count: number;
  recent_requests: {
    id: string;
    timestamp: string;
    credits_used: number;
    model: string;
    status: string;
  }[];
}

export interface AddCreditsRequest {
  amount: number;
}

export interface AddCreditsResponse {
  user_id: string;
  balance: number;
  balance_usd: number;
}

export interface CreditPackage {
  id: string;
  credits: number;
  price: number;
  estimated_queries: number;
  label?: string;
  popular?: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || process.env.NEXT_PUBLIC_API_BASE_URL || '';

export async function fetchCreditBalance(): Promise<CreditBalance> {
  const response = await fetch(`${API_BASE_URL}/api/v1/billing/credits/balance`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch credit balance');
  }

  return response.json();
}

export async function fetchTransactions(params?: {
  limit?: number;
  offset?: number;
  transaction_type?: 'addition' | 'deduction' | 'initial' | 'refund';
  start_date?: string;
  end_date?: string;
  model?: string;
}): Promise<TransactionResponse> {
  const queryParams = new URLSearchParams();

  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());
  if (params?.transaction_type) queryParams.append('transaction_type', params.transaction_type);
  if (params?.start_date) queryParams.append('start_date', params.start_date);
  if (params?.end_date) queryParams.append('end_date', params.end_date);
  if (params?.model) queryParams.append('model', params.model);

  const response = await fetch(
    `${API_BASE_URL}/api/v1/billing/transactions?${queryParams.toString()}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch transactions');
  }

  return response.json();
}

export async function fetchUsageSummary(): Promise<UsageSummary> {
  const response = await fetch(`${API_BASE_URL}/api/v1/billing/usage/summary`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch usage summary');
  }

  return response.json();
}

export async function addCredits(amount: number): Promise<AddCreditsResponse> {
  const requestBody: AddCreditsRequest = { amount };

  const response = await fetch(`${API_BASE_URL}/api/v1/billing/credits/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error('Failed to add credits');
  }

  return response.json();
}

export function getCreditBalanceColor(balance: number): 'green' | 'yellow' | 'red' {
  if (balance > 2500) return 'green';
  if (balance >= 1000) return 'yellow';
  return 'red';
}

export function formatCredits(credits: number): string {
  return credits.toLocaleString('en-US');
}

export function formatUSD(amount: number): string {
  return `$${amount.toFixed(2)}`;
}
