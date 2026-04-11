/**
 * Central feature flags.
 * All flags read from NEXT_PUBLIC_ env vars so they work in both
 * server components and client components (inlined at build-time by Next.js).
 *
 * CURSOR_STYLE_UI_ENABLED
 *   true  → Cursor/IDE-style UI: resizable DataPreviewPanel + ChatPanel with
 *            multi-session tabs + overlay drawer sidebar (current design).
 *   false → Classic/old UI: persistent left sidebar + full-width single chat
 *            view with no DataPreviewPanel and no tab bar.
 *
 * THESYS_ENABLED
 *   true  → Use the TheSys C1Component for assistant messages (default).
 *   false → Use the A2UI streaming event pipeline; renders a step timeline
 *            + tool accordion + final answer in place of C1Component.
 *
 * HIDE_BASIC_AUTH
 *   true  → Hide username/password login and registration forms in the UI only.
 *            Google sign-in is unchanged. Backend auth endpoints are not disabled.
 *   false → Show email/username + password fields (default).
 *
 * Set in .env / .env.local:
 *   NEXT_PUBLIC_CURSOR_STYLE_UI_ENABLED=true   # or false
 *   NEXT_PUBLIC_THESYS_ENABLED=true            # or false
 *   NEXT_PUBLIC_HIDE_BASIC_AUTH=true           # or false
 */
export const FEATURE_FLAGS = {
  CURSOR_STYLE_UI_ENABLED:
    (process.env.NEXT_PUBLIC_CURSOR_STYLE_UI_ENABLED ?? "false").toLowerCase() !== "false",

  THESYS_ENABLED:
    (process.env.NEXT_PUBLIC_THESYS_ENABLED ?? "true").toLowerCase() !== "false",

  HIDE_BASIC_AUTH:
    (process.env.NEXT_PUBLIC_HIDE_BASIC_AUTH ?? "false").toLowerCase() === "true",
} as const

export type FeatureFlags = typeof FEATURE_FLAGS
