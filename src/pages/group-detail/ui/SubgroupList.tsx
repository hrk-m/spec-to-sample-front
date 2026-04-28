import { Box, Flex, Text } from "@radix-ui/themes";
import { RiCloseLine } from "react-icons/ri";

import type { SubgroupSummary } from "@/pages/group-detail/model/group-detail";
import { appColors } from "@/shared/ui";

const colors = {
  separator: appColors.separator,
  surfaceRaised: appColors.surfaceRaised,
  textPrimary: appColors.textPrimary,
  textSecondary: appColors.textSecondary,
  textTertiary: appColors.textTertiary,
  error: appColors.error,
  errorBackground: appColors.errorBackground,
  errorBorder: appColors.errorBorder,
} as const;

const cardStyle = {
  background: colors.surfaceRaised,
  border: `1px solid ${colors.separator}`,
  borderRadius: 22,
  overflow: "hidden",
  boxShadow: "0 18px 42px rgba(15, 23, 42, 0.06)",
} as const;

const rowStyle = {
  padding: "14px 20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
} as const;

const rowBorderStyle = {
  borderBottom: `1px solid ${colors.separator}`,
} as const;

const nameStyle = {
  margin: 0,
  fontSize: 15,
  fontWeight: 500,
  color: colors.textPrimary,
} as const;

const descStyle = {
  margin: "2px 0 0",
  fontSize: 13,
  color: colors.textSecondary,
} as const;

const emptyStyle = {
  margin: 0,
  fontSize: 14,
  color: colors.textSecondary,
  textAlign: "center" as const,
  padding: "28px 24px",
} as const;

const errorStyle = {
  margin: "12px 0 0",
  fontSize: 14,
  lineHeight: 1.5,
  color: colors.error,
  padding: "12px 16px",
  background: colors.errorBackground,
  borderRadius: 12,
  border: `1px solid ${colors.errorBorder}`,
} as const;

const deleteButtonStyle = {
  background: "none",
  border: "none",
  padding: 4,
  cursor: "pointer",
  color: colors.textTertiary,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 6,
  flexShrink: 0,
  lineHeight: 1,
} as const;

type SubgroupListProps = {
  subgroups: SubgroupSummary[];
  error: string | null;
  onDelete: (subgroupId: number) => void;
};

export function SubgroupList({ subgroups, error, onDelete }: SubgroupListProps) {
  if (error) {
    return (
      <Text as="p" style={errorStyle}>
        {error}
      </Text>
    );
  }

  if (subgroups.length === 0) {
    return (
      <Box style={{ ...cardStyle, marginTop: 12 }}>
        <Text as="p" style={emptyStyle}>
          サブグループはまだありません
        </Text>
      </Box>
    );
  }

  return (
    <Box style={{ ...cardStyle, marginTop: 12 }}>
      {subgroups.map((subgroup, index) => (
        <Flex
          key={subgroup.id}
          style={{
            ...rowStyle,
            ...(index < subgroups.length - 1 ? rowBorderStyle : {}),
          }}
        >
          <Box style={{ minWidth: 0, flex: 1 }}>
            <Text as="p" style={nameStyle}>
              {subgroup.name}
            </Text>
            {subgroup.description && (
              <Text as="p" style={descStyle}>
                {subgroup.description}
              </Text>
            )}
          </Box>
          <button
            type="button"
            aria-label={`削除: ${subgroup.name}`}
            style={deleteButtonStyle}
            onClick={() => onDelete(subgroup.id)}
          >
            <RiCloseLine size={18} />
          </button>
        </Flex>
      ))}
    </Box>
  );
}
