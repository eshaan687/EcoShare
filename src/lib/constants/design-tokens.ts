export const ECOSHARE_COLORS = {
  primary: "#22C55E",
  primaryDark: "#15803D",
  secondary: "#A7F3D0",
  background: "#F8FAFC",
  surface: "#FFFFFF",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  border: "#E2E8F0",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
} as const;

export const ECOSHARE_RADII = {
  control: "8px",
  button: "12px",
  pill: "9999px",
  card: "16px",
  feature: "20px",
  dialog: "20px",
} as const;

export const ECOSHARE_FEED_TABS = [
  { id: "for-you", label: "For You" },
  { id: "following", label: "Following" },
  { id: "verified-impact", label: "Verified Impact" },
] as const;

export type EcoShareFeedTabId = (typeof ECOSHARE_FEED_TABS)[number]["id"];
