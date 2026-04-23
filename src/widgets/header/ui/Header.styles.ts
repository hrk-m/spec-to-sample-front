import { appColors } from "@/shared/ui";

const colors = {
  background: appColors.headerBackground,
  border: appColors.separator,
  shadow: "0 16px 32px rgba(15, 23, 42, 0.06)",
  title: appColors.textPrimary,
  avatarText: appColors.textSecondary,
} as const;

export const styles = {
  header: {
    background: colors.background,
    borderBottom: `1px solid ${colors.border}`,
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 150,
    paddingTop: "env(safe-area-inset-top)",
    backdropFilter: "blur(28px) saturate(140%)",
    WebkitBackdropFilter: "blur(28px) saturate(140%)",
    boxShadow: colors.shadow,
  },
  inner: {
    height: 52,
    padding: "0 24px",
    display: "grid",
    gridTemplateColumns: "40px 1fr 40px",
    alignItems: "center",
    gap: 12,
  },
  leading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  menuButton: {
    color: colors.title,
  },
  menuIcon: {
    width: 16,
    height: 16,
    display: "block",
    transform: "translateY(0.5px)",
  },
  title: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 15,
    fontWeight: 600,
    letterSpacing: -0.2,
    lineHeight: 1.1,
    color: colors.title,
  },
  trailing: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  accountButton: {
    color: colors.avatarText,
  },
  accountIcon: {
    width: 24,
    height: 24,
    display: "block",
  },
  dropdownContent: {
    minWidth: 220,
  },
  dropdownItem: {
    padding: "8px 12px",
    display: "flex",
    flexDirection: "column" as const,
    gap: 2,
  },
  dropdownUuid: {
    fontSize: 11,
    color: colors.title,
    letterSpacing: 0,
    wordBreak: "break-all" as const,
    margin: 0,
  },
  dropdownName: {
    fontSize: 13,
    fontWeight: 600,
    color: colors.title,
    margin: 0,
  },
} as const;
