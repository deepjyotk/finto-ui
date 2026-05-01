const liveSurfaceFieldValues = new Map<string, Record<string, string>>()

function decodeJsonPointerSegment(segment: string): string {
  return segment.replace(/~1/g, "/").replace(/~0/g, "~")
}

export function getFieldNameFromDataPath(path: string): string | null {
  const normalized = path.startsWith("/") ? path : `/${path}`
  const segments = normalized.split("/").filter(Boolean).map(decodeJsonPointerSegment)
  return segments[0] === "fields" && segments[1] ? segments[1] : null
}

export function rememberLiveFieldValue(surfaceId: string, path: string, value: string) {
  const fieldName = getFieldNameFromDataPath(path)
  if (!fieldName) return

  const surfaceValues = liveSurfaceFieldValues.get(surfaceId) ?? {}
  surfaceValues[fieldName] = value
  liveSurfaceFieldValues.set(surfaceId, surfaceValues)
}

export function getLiveA2UIFieldValues(surfaceId: string): Record<string, string> {
  return { ...(liveSurfaceFieldValues.get(surfaceId) ?? {}) }
}
