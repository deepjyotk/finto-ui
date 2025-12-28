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

export type CreditBalanceColor = 'green' | 'yellow' | 'red';

export interface CreditPackage {
  id: string;
  credits: number;
  price: number;
  estimated_queries: number;
  label?: string;
  popular?: boolean;
}
