import type { Metadata } from "next"
import TickerClient from "@/features/ticker/components/ticker-client"
import { FASTAPI_BASE_URL } from "@/lib/utils"
import type { TickerResponse } from "@/features/ticker/types"

interface Props {
  params: Promise<{ symbol: string }>
  searchParams: Promise<{ period?: string; interval?: string }>
}

async function fetchTickerSSR(symbol: string): Promise<TickerResponse | null> {
  try {
    const params = new URLSearchParams({
      price_period: "1y",
      price_interval: "1d",
      annual_periods: "10",
      quarterly_periods: "12",
    })
    const res = await fetch(
      `${FASTAPI_BASE_URL}/api/v1/ticker/${encodeURIComponent(symbol)}?${params}`,
      { next: { revalidate: 300 } },
    )
    if (!res.ok) return null
    return res.json() as Promise<TickerResponse>
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { symbol } = await params
  const data = await fetchTickerSSR(symbol)
  if (!data) {
    return { title: `${symbol} — Arthik` }
  }
  const { company, key_ratios } = data
  const pe = key_ratios.find((r) => r.label.toLowerCase().includes("p/e"))
  const sector = company.sector ?? ""
  const price = company.current_price != null ? `₹${company.current_price.toLocaleString("en-IN")}` : ""
  const desc = [
    `${company.company_name} share price ${price}.`,
    sector && `Sector: ${sector}.`,
    pe?.value && `P/E: ${pe.value}.`,
    "Stock analysis, financials and key ratios on Arthik.",
  ]
    .filter(Boolean)
    .join(" ")

  return {
    title: `${company.company_name} Share Price | ${symbol} Stock Analysis`,
    description: desc,
    openGraph: {
      title: `${company.company_name} (${symbol}) | Arthik`,
      description: desc,
    },
    twitter: {
      card: "summary",
      title: `${company.company_name} (${symbol}) | Arthik`,
      description: desc,
    },
  }
}

export default async function TickerPage({ params, searchParams }: Props) {
  const { symbol } = await params
  const { period, interval } = await searchParams
  const upperSymbol = symbol.toUpperCase()
  const ssrData = await fetchTickerSSR(upperSymbol)

  return (
    <TickerClient
      symbol={upperSymbol}
      initialData={ssrData}
      initialPeriod={(period as "1mo" | "6mo" | "1y" | "3y" | "5y" | "max") ?? "1y"}
      initialInterval={(interval as "1d" | "1wk" | "1mo") ?? "1d"}
    />
  )
}
