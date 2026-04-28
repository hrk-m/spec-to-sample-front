import { useState } from "react";
import { Box, Button, Flex, Text } from "@radix-ui/themes";

import type { SubgroupSummary } from "@/pages/group-detail/model/group-detail";
import { DeleteSubgroupDialog } from "@/pages/group-detail/ui/DeleteSubgroupDialog";
import { appColors } from "@/shared/ui";

const colors = {
  separator: appColors.separator,
  surfaceRaised: appColors.surfaceRaised,
  textPrimary: appColors.textPrimary,
  textSecondary: appColors.textSecondary,
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

type SubgroupListProps = {
  groupId: number;
  subgroups: SubgroupSummary[];
  error: string | null;
  refetch: () => void;
};

export function SubgroupList({ groupId, subgroups, error, refetch }: SubgroupListProps) {
  const [deletingSubgroupId, setDeletingSubgroupId] = useState<number | null>(null);

  if (error) {
    return (
      <Text as="p" style={errorStyle}>
        {error}
      </Text>
    );
  }

  return (
    <>
      <Box style={{ ...cardStyle, marginTop: 12 }}>
        {subgroups.length === 0 ? (
          <Text as="p" style={emptyStyle}>
            サブグループはまだありません
          </Text>
        ) : (
          subgroups.map((subgroup, index) => (
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
              <Button
                variant="soft"
                color="red"
                radius="full"
                size="1"
                onClick={() => setDeletingSubgroupId(subgroup.id)}
              >
                Delete
              </Button>
            </Flex>
          ))
        )}
      </Box>
      <DeleteSubgroupDialog
        open={deletingSubgroupId !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingSubgroupId(null);
        }}
        groupId={groupId}
        subgroupId={deletingSubgroupId}
        onSuccess={refetch}
      />
    </>
  );
}
