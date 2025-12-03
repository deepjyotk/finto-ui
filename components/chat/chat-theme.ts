"use client";

import { themePresets } from "@crayonai/react-ui";
import type { ThemeProps } from "@crayonai/react-ui/ThemeProvider";

const brandColors = {
  accent: "var(--color-secondary)",
  accentHover: "var(--color-secondary-hover)",
  accentPressed: "var(--color-secondary-pressed)",
  accentDisabled: "var(--color-secondary-disabled)",
  onAccent: "var(--color-secondary-foreground)",
};

const applyBranding = (theme: ThemeProps["theme"]) => ({
  ...theme,
  brandElFills: brandColors.accent,
  brandElHoverFills: brandColors.accentHover,
  interactiveAccent: brandColors.accent,
  interactiveAccentHover: brandColors.accentHover,
  interactiveAccentPressed: brandColors.accentPressed,
  interactiveAccentDisabled: brandColors.accentDisabled,
  chatUserResponseBg: brandColors.accent,
  chatUserResponseText: brandColors.onAccent,
});

export const buildChatTheme = (): ThemeProps => {
  const preset = themePresets.candy;

  return {
    ...preset,
    mode: "dark",
    theme: applyBranding(preset.theme),
    darkTheme: applyBranding(preset.darkTheme),
  };
};
