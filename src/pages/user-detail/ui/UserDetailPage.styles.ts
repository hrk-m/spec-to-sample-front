import { appColors } from "@/shared/ui";

const colors = {
  separator: appColors.separator,
  surfaceRaised: appColors.surfaceRaised,
  textPrimary: appColors.textPrimary,
  textSecondary: appColors.textSecondary,
  textTertiary: appColors.textTertiary,
  errorBackground: appColors.errorBackground,
  errorBorder: appColors.errorBorder,
  error: appColors.error,
} as const;

export const styles = {
  backButton: {
    fontSize: 16,
    fontWeight: 500,
    color: colors.textSecondary,
    cursor: "pointer",
    background: "none",
    border: "none",
    padding: "4px 0",
    display: "inline-flex",
    alignItems: "center",
    height: 32,
    gap: 4,
  },
  sectionCard: {
    marginTop: 26,
    background: colors.surfaceRaised,
    border: `1px solid ${colors.separator}`,
    borderRadius: 22,
    overflow: "hidden",
    boxShadow: "0 18px 42px rgba(15, 23, 42, 0.06)",
  },
  infoRow: {
    padding: "14px 20px",
    borderBottom: `1px solid ${colors.separator}`,
  },
  infoRowLast: {
    padding: "14px 20px",
  },
  infoLabel: {
    margin: 0,
    fontSize: 13,
    color: colors.textTertiary,
    fontWeight: 400,
  },
  infoValue: {
    margin: "2px 0 0 0",
    fontSize: 15,
    fontWeight: 500,
    color: colors.textPrimary,
  },
  infoValueMono: {
    margin: "2px 0 0 0",
    fontSize: 13,
    fontWeight: 400,
    color: colors.textSecondary,
    fontFamily: "monospace",
  },
  errorCard: {
    marginTop: 24,
    padding: "18px 20px",
    borderRadius: 18,
    background: colors.errorBackground,
    border: `1px solid ${colors.errorBorder}`,
    color: colors.error,
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: 700,
    margin: 0,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 1.45,
    margin: "6px 0 0 0",
  },
  notFoundText: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.5,
    color: colors.textSecondary,
    textAlign: "center" as const,
    padding: "28px 24px",
  },
  skeletonBlock: {
    padding: "18px 20px",
  },
  skeletonLine: {
    background: "rgba(118, 118, 128, 0.16)",
    borderRadius: 999,
    height: 12,
  },
} as const;
