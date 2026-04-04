import type { A2UIClientEvent } from "@/features/chat/redux/chat.types"

export interface SendA2UIChatMessageOptions {
  content: string
  sessionId: string
  brokerId?: string
  modelId: string
  signal?: AbortSignal
  /** Called for each structured A2UI event received from the stream */
  onEvent?: (event: A2UIClientEvent) => void
  /** Called when the stream ends cleanly */
  onComplete?: () => void
  /** Called when the AbortSignal fires */
  onAbort?: () => void
  onError?: (error: Error) => void
}

/**
 * Send a chat message to the A2UI endpoint and consume the structured SSE
 * event stream.  Each `data:` frame contains one JSON-encoded A2UIClientEvent.
 */
export const sendA2UIChatMessage = async ({
  content,
  sessionId,
  brokerId = "",
  modelId,
  signal,
  onEvent,
  onComplete,
  onAbort,
  onError,
}: SendA2UIChatMessageOptions): Promise<void> => {
  try {
    const response = await fetch("/api/a2ui/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message_payload: { content },
        session_id: sessionId,
        broker_id: brokerId,
        model_payload: modelId,
      }),
      signal,
    })

    if (!response.ok) {
      throw new Error(`A2UI chat request failed: ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error("Response body is not readable")

    const decoder = new TextDecoder()
    let buffer = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      // SSE frames are separated by "\n\n"
      const frames = buffer.split("\n\n")
      // Keep the last (possibly incomplete) frame in the buffer
      buffer = frames.pop() ?? ""

      for (const frame of frames) {
        const line = frame.trim()
        if (!line.startsWith("data:")) continue

        const payload = line.slice("data:".length).trim()

        if (payload === "[DONE]") {
          onComplete?.()
          return
        }

        try {
          const event = JSON.parse(payload) as A2UIClientEvent
          onEvent?.(event)
        } catch {
          // Malformed frame — skip silently
        }
      }
    }

    onComplete?.()
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      onAbort?.()
      return
    }
    const err = error instanceof Error ? error : new Error("Unknown error occurred")
    onError?.(err)
    throw err
  }
}
