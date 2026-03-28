/** Backend origin; keep this module dependency-free for Edge (e.g. middleware). */
export const FASTAPI_BASE_URL =
  process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8000";
