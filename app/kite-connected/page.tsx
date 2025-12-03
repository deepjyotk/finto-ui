import KiteConnectedClient from "@/components/kite/kite-connected-client"

export const dynamic = "force-dynamic"

type SearchParams = { [key: string]: string | string[] | undefined }

export default function KiteConnectedPage({ searchParams }: { searchParams: SearchParams }) {
  const statusParam = searchParams?.status
  const status = Array.isArray(statusParam) ? statusParam[0] : statusParam

  return <KiteConnectedClient status={status || "pending"} />
}
