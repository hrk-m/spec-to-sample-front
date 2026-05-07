import type { SubgroupSummary } from "@/entities/group";
import { Box, Button, Flex } from "@radix-ui/themes";

import { appColors } from "@/shared/config";

const colors = {
  accent: appColors.accent,
  accentSoft: appColors.accentSoft,
  separator: appColors.separator,
  textSecondary: appColors.textSecondary,
  textPrimary: appColors.textPrimary,
  searchBackground: appColors.searchBackground,
} as const;

const chipRowStyle = {
  display: "flex",
  flexDirection: "row" as const,
  alignItems: "center",
  gap: 8,
  overflowX: "auto" as const,
  flexWrap: "nowrap" as const,
  paddingBottom: 2,
  scrollbarWidth: "none" as const,
} as const;

const chipOnStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "6px 14px",
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  border: `1.5px solid ${colors.accent}`,
  background: colors.accentSoft,
  color: colors.accent,
  whiteSpace: "nowrap" as const,
  flexShrink: 0,
  transition: "background 0.15s ease, border-color 0.15s ease",
} as const;

const chipOffStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "6px 14px",
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  border: `1.5px solid ${colors.separator}`,
  background: colors.searchBackground,
  color: colors.textSecondary,
  whiteSpace: "nowrap" as const,
  flexShrink: 0,
  transition: "background 0.15s ease, border-color 0.15s ease",
} as const;

const countStyle = {
  fontSize: 11,
  fontWeight: 400,
  opacity: 0.75,
} as const;

const manageButtonWrapperStyle = {
  flexShrink: 0,
  marginLeft: "auto",
  paddingLeft: 8,
} as const;

type SubgroupFilterChipsProps = {
  subgroups: SubgroupSummary[];
  selectedSubgroupIds: Set<number>;
  onToggle: (id: number, checked: boolean) => void;
  onManageClick: () => void;
};

export function SubgroupFilterChips({
  subgroups,
  selectedSubgroupIds,
  onToggle,
  onManageClick,
}: SubgroupFilterChipsProps) {
  if (subgroups.length === 0) {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button variant="soft" size="1" onClick={onManageClick}>
          サブグループ管理
        </Button>
      </div>
    );
  }

  return (
    <Flex data-testid="chip-row" style={chipRowStyle} align="center">
      {subgroups.map((subgroup) => {
        const isOn = selectedSubgroupIds.has(subgroup.id);
        return (
          <button
            key={subgroup.id}
            type="button"
            style={isOn ? chipOnStyle : chipOffStyle}
            onClick={() => onToggle(subgroup.id, !isOn)}
            aria-pressed={isOn}
            aria-label={subgroup.name}
          >
            <span>{subgroup.name}</span>
            <span style={countStyle}>{subgroup.member_count}</span>
          </button>
        );
      })}
      <Box style={manageButtonWrapperStyle}>
        <Button variant="soft" size="1" onClick={onManageClick}>
          サブグループ管理
        </Button>
      </Box>
    </Flex>
  );
}
