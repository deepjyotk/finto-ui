import PortfolioPageClient from "@/features/portfolio/components/portfolio-page-client"
import Header from "@/components/layout/header"

export const metadata = {
  title: "Portfolio",
  description: "View your equity portfolio holdings across brokers.",
}

export default function PortfolioPage() {
  return (
    <>
      <Header />
      <PortfolioPageClient />
    </>
  )
}
