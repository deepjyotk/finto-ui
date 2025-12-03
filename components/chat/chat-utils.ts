const EMOJI_REGEX =
  /\p{Extended_Pictographic}|\p{Emoji_Presentation}|\p{Emoji_Component}|\p{Emoji_Modifier_Base}|\p{Emoji_Modifier}/gu;

export const stripEmojis = (input: string) => input.replace(EMOJI_REGEX, "");

export const sanitizeResponseStream = (
  response: Response,
  sanitizer: (text: string) => string = stripEmojis
) => {
  const reader = response.body?.getReader();
  if (!reader) return response;

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        const finalText = decoder.decode();
        if (finalText) {
          controller.enqueue(encoder.encode(sanitizer(finalText)));
        }
        controller.close();
        return;
      }

      const chunk = decoder.decode(value, { stream: true });
      const sanitized = sanitizer(chunk);
      controller.enqueue(encoder.encode(sanitized));
    },
    cancel() {
      reader.cancel().catch(() => {});
    },
  });

  return new Response(stream, {
    headers: new Headers(response.headers),
    status: response.status,
    statusText: response.statusText,
  });
};
