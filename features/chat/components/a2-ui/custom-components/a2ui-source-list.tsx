interface NewsSourceItem {
  source?: string
  title?: string
  url?: string
  href?: string
  link?: string
  label?: string
}

interface SourceListProps {
  sources: unknown[]
  title?: string
}

function normalizeSourceItem(item: unknown): NewsSourceItem | null {
  if (typeof item === "string") return { title: item }
  if (!item || typeof item !== "object") return null

  const raw = item as Record<string, unknown>
  const source =
    typeof raw.source === "string"
      ? raw.source
      : typeof raw.publisher === "string"
        ? raw.publisher
        : undefined
  const title =
    typeof raw.title === "string"
      ? raw.title
      : typeof raw.label === "string"
        ? raw.label
        : undefined
  const url =
    typeof raw.url === "string"
      ? raw.url
      : typeof raw.href === "string"
        ? raw.href
        : typeof raw.link === "string"
          ? raw.link
          : undefined

  if (!source && !title && !url) return null
  return { source, title, url }
}

function getSafeHttpUrl(value: string | undefined): string | null {
  if (!value) return null
  try {
    const parsed = new URL(value)
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : null
  } catch {
    return null
  }
}

export function A2UISourceList({ sources, title = "Sources" }: SourceListProps) {
  const items = sources.map(normalizeSourceItem).filter((item): item is NewsSourceItem => Boolean(item))
  if (!items.length) return null

  return (
    <div className="mt-1 space-y-2 border-t border-white/10 pt-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{title}</p>
      <div className="flex flex-col gap-2">
        {items.map((item, index) => {
          const url = getSafeHttpUrl(item.url ?? item.href ?? item.link)
          const source = item.source || "Source"
          const text = item.title || item.label || url || source
          const content = (
            <>
              <span className="shrink-0 rounded-md border border-cyan-400/20 bg-cyan-400/10 px-1.5 py-0.5 text-[11px] font-medium text-cyan-200">
                {source}
              </span>
              <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-gray-300">
                {text}
              </span>
            </>
          )

          return url ? (
            <a
              key={`${url}-${index}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-w-0 items-center gap-2 rounded-md border border-white/10 bg-white/[0.025] px-2.5 py-2 text-xs transition-colors hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-100"
            >
              {content}
            </a>
          ) : (
            <div
              key={`${source}-${text}-${index}`}
              className="flex min-w-0 items-center gap-2 rounded-md border border-white/10 bg-white/[0.025] px-2.5 py-2 text-xs"
            >
              {content}
            </div>
          )
        })}
      </div>
    </div>
  )
}
