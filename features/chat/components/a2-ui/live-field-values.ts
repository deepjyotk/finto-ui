const liveSurfaceFieldValues = new Map<string, Record<string, string>>()
const liveSurfaceDirtyFields = new Map<string, Set<string>>()
const liveSurfaceValidationErrors = new Map<string, Record<string, string[]>>()
const validationErrorListeners = new Set<() => void>()

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

  const dirtyFields = liveSurfaceDirtyFields.get(surfaceId) ?? new Set<string>()
  dirtyFields.add(fieldName)
  liveSurfaceDirtyFields.set(surfaceId, dirtyFields)

  if (value.trim()) {
    clearLiveA2UIFieldValidationError(surfaceId, fieldName)
  }
}

export function getLiveA2UIFieldValues(surfaceId: string): Record<string, string> {
  return { ...(liveSurfaceFieldValues.get(surfaceId) ?? {}) }
}

export function getLiveA2UIDirtyFieldNames(surfaceId: string): string[] {
  return Array.from(liveSurfaceDirtyFields.get(surfaceId) ?? [])
}

export function clearLiveA2UISurfaceValues(surfaceId: string) {
  liveSurfaceFieldValues.delete(surfaceId)
  liveSurfaceDirtyFields.delete(surfaceId)
  liveSurfaceValidationErrors.delete(surfaceId)
  notifyValidationErrorListeners()
}

export function getFieldDirtyPath(fieldName: string): string {
  return `/fieldMeta/${fieldName.replace(/~/g, "~0").replace(/\//g, "~1")}/dirty`
}

export function getLiveA2UIFieldValidationErrors(
  surfaceId: string,
  fieldName: string
): string[] {
  return liveSurfaceValidationErrors.get(surfaceId)?.[fieldName] ?? []
}

export function setLiveA2UIValidationErrors(
  surfaceId: string,
  errors: Record<string, string[]>
) {
  liveSurfaceValidationErrors.set(surfaceId, errors)
  notifyValidationErrorListeners()
}

export function clearLiveA2UIFieldValidationError(surfaceId: string, fieldName: string) {
  const surfaceErrors = liveSurfaceValidationErrors.get(surfaceId)
  if (!surfaceErrors?.[fieldName]?.length) return

  const nextErrors = { ...surfaceErrors }
  delete nextErrors[fieldName]

  if (Object.keys(nextErrors).length) {
    liveSurfaceValidationErrors.set(surfaceId, nextErrors)
  } else {
    liveSurfaceValidationErrors.delete(surfaceId)
  }

  notifyValidationErrorListeners()
}

export function subscribeLiveA2UIValidationErrors(listener: () => void) {
  validationErrorListeners.add(listener)
  return () => {
    validationErrorListeners.delete(listener)
  }
}

function notifyValidationErrorListeners() {
  for (const listener of validationErrorListeners) {
    listener()
  }
}
