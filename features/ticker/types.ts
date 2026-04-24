export interface CompanyInfo {
  symbol: string
  symbol_ns: string
  company_name: string
  isin: string | null
  sector: string | null
  website: string | null
  current_price: number | null
  currency: string
  exchange: string
}

export interface KeyRatio {
  label: string
  value: string | null
  unit: string | null
}

export interface PriceBar {
  date: string
  open: number | null
  high: number | null
  low: number | null
  close: number | null
  volume: number | null
}

export interface FinancialRow {
  metric: string
  values: Record<string, number | null>
}

export interface FinancialStatement {
  statement_type: "annual" | "quarterly"
  periods: string[]
  rows: FinancialRow[]
}

export interface TickerInfo {
  // Price / trading
  currentPrice?: number | null
  regularMarketPrice?: number | null
  previousClose?: number | null
  open?: number | null
  volume?: number | null
  averageVolume?: number | null
  fiftyTwoWeekHigh?: number | null
  fiftyTwoWeekLow?: number | null
  fiftyDayAverage?: number | null
  twoHundredDayAverage?: number | null
  beta?: number | null
  // Valuation
  marketCap?: number | null
  enterpriseValue?: number | null
  trailingPE?: number | null
  forwardPE?: number | null
  priceToBook?: number | null
  enterpriseToRevenue?: number | null
  enterpriseToEbitda?: number | null
  trailingEps?: number | null
  forwardEps?: number | null
  bookValue?: number | null
  // Margins & growth (decimal fractions, multiply × 100 for %)
  grossMargins?: number | null
  operatingMargins?: number | null
  profitMargins?: number | null
  earningsGrowth?: number | null
  revenueGrowth?: number | null
  earningsQuarterlyGrowth?: number | null
  // Dividends
  dividendYield?: number | null   // stored as % already (e.g. 0.41 = 0.41%)
  dividendRate?: number | null
  payoutRatio?: number | null
  exDividendDate?: number | null  // Unix timestamp
  lastDividendDate?: number | null
  // Financials
  totalCash?: number | null
  totalCashPerShare?: number | null
  totalDebt?: number | null
  totalRevenue?: number | null
  revenuePerShare?: number | null
  sharesOutstanding?: number | null
  floatShares?: number | null
  debtToEquity?: number | null
  // Risk (1–10 scale)
  auditRisk?: number | null
  boardRisk?: number | null
  compensationRisk?: number | null
  overallRisk?: number | null
  // Company metadata
  longName?: string | null
  shortName?: string | null
  longBusinessSummary?: string | null
  sector?: string | null
  industry?: string | null
  country?: string | null
  city?: string | null
  website?: string | null
  fullTimeEmployees?: number | null
  currency?: string | null
  exchange?: string | null
  quoteType?: string | null
}

export interface TickerResponse {
  company: CompanyInfo
  key_ratios: KeyRatio[]
  price_history: PriceBar[]
  annual_pnl: FinancialStatement
  quarterly_pnl: FinancialStatement
  annual_balance_sheet?: FinancialStatement
  quarterly_balance_sheet?: FinancialStatement
  annual_cash_flow?: FinancialStatement
  quarterly_cash_flow?: FinancialStatement
  ticker_info?: TickerInfo | null
}

export type PricePeriod = "1mo" | "6mo" | "1y" | "3y" | "5y" | "max"
export type PriceInterval = "1d" | "1wk" | "1mo"
