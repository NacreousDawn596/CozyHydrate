const light = {
  primary: "#7DD3FC",
  secondary: "#A5B4FC",
  accent: "#C084FC",
  background: "#F8FAFC",
  cardBackground: "#FFFFFF",
  textPrimary: "#1E293B",
  textSecondary: "#64748B",
  textTertiary: "#94A3B8",
  success: "#86EFAC",
  warning: "#FDE047",
  error: "#FCA5A5",
};

const dark = {
  primary: "#7DD3FC",
  secondary: "#A5B4FC",
  accent: "#C084FC",
  background: "#1E293B",
  cardBackground: "#293548",
  textPrimary: "#F8FAFC",
  textSecondary: "#94A3B8",
  textTertiary: "#64748B",
  success: "#86EFAC",
  warning: "#FDE047",
  error: "#FCA5A5",
};

const cozy = {
  primary: "#C084FC",
  secondary: "#A5B4FC",
  accent: "#7DD3FC",
  background: "#FEF3C7",
  cardBackground: "#FBCFE8",
  textPrimary: "#1E293B",
  textSecondary: "#64748B",
  textTertiary: "#94A3B8",
  success: "#86EFAC",
  warning: "#FDE047",
  error: "#FCA5A5",
};

const ocean = {
  primary: "#67E8F9",
  secondary: "#A5B4FC",
  accent: "#38BDF8",
  background: "#ECFEFF",
  cardBackground: "#CFFAFE",
  textPrimary: "#0E7490",
  textSecondary: "#64748B",
  textTertiary: "#94A3B8",
  success: "#86EFAC",
  warning: "#FDE047",
  error: "#FCA5A5",
};

const forest = {
  primary: "#86EFAC",
  secondary: "#A5B4FC",
  accent: "#4ADE80",
  background: "#F0FDF4",
  cardBackground: "#DCFCE7",
  textPrimary: "#166534",
  textSecondary: "#64748B",
  textTertiary: "#94A3B8",
  success: "#86EFAC",
  warning: "#FDE047",
  error: "#FCA5A5",
};

export const themes = {
  light,
  dark,
  cozy,
  ocean,
  forest,
};

export type ThemeName = keyof typeof themes;
export type Theme = typeof light;

export default light;
