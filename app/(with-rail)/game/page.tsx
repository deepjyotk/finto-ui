import GamePageClient from "@/features/game/components/game-page-client"

export const metadata = {
  title: "Daily Stock Game",
  description: "Pick 5 stocks before market open and compete to beat the Nifty 50.",
}

export default function GamePage() {
  return <GamePageClient />
}
