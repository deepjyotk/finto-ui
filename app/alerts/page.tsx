import { DemoUsStockAlerts } from "@/features/demo-us-stocks/components/demo-us-stock-alerts"

export default function AlertsPage() {
  return (
    <div className="container mx-auto max-w-6xl p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
          <p className="text-muted-foreground">
            Price-movement alerts evaluated by the streaming pipeline
          </p>
        </div>

        <DemoUsStockAlerts />
      </div>
    </div>
  )
}
