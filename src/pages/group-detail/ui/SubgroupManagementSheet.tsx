import { useCallback, useState } from "react";
import { Box, Button, Flex, Text } from "@radix-ui/themes";

import { useSubgroups } from "@/pages/group-detail/model/useSubgroups";
import { appColors } from "@/shared/config";
import { useSheetStack } from "@/shared/lib/sheet-stack";
import { AddSubgroupSheet } from "./AddSubgroupSheet";
import { DeleteSubgroupDialog } from "./DeleteSubgroupDialog";

const colors = {
  separator: appColors.separator,
  surfaceRaised: appColors.surfaceRaised,
  textPrimary: appColors.textPrimary,
  textSecondary: appColors.textSecondary,
} as const;

const containerStyle = {
  padding: "0 24px 24px",
} as const;

const headerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 16,
} as const;

const listStyle = {
  background: colors.surfaceRaised,
  border: `1px solid ${colors.separator}`,
  borderRadius: 22,
  overflow: "hidden",
  boxShadow: "0 18px 42px rgba(15, 23, 42, 0.06)",
} as const;

const rowBaseStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "14px 20px",
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

type SubgroupManagementSheetProps = {
  groupId: number;
  groupName: string;
};

export function SubgroupManagementSheet({ groupId, groupName }: SubgroupManagementSheetProps) {
  const { openSheet } = useSheetStack();
  const { subgroups, refetch } = useSubgroups(groupId);
  const [deletingSubgroupId, setDeletingSubgroupId] = useState<number | null>(null);

  const handleAddClick = useCallback(() => {
    openSheet({
      id: `add-subgroup-from-management-${groupId}-${Date.now()}`,
      content: (
        <AddSubgroupSheet
          groupId={groupId}
          onClose={() => {
            refetch();
          }}
          subgroups={subgroups}
        />
      ),
    });
  }, [groupId, openSheet, subgroups, refetch]);

  return (
    <Box style={containerStyle}>
      <Flex style={headerStyle} align="center" justify="between">
        <Box>
          <Text
            as="p"
            style={{ margin: 0, fontSize: 20, fontWeight: 700, color: colors.textPrimary }}
          >
            サブグループ管理
          </Text>
          <Text as="p" style={{ margin: 0, fontSize: 13, color: colors.textSecondary }}>
            {groupName}
          </Text>
        </Box>
        <Button variant="soft" size="2" radius="full" onClick={handleAddClick}>
          ＋ 追加
        </Button>
      </Flex>

      <Box style={listStyle}>
        {subgroups.length === 0 ? (
          <Text as="p" style={emptyStyle}>
            サブグループはまだありません
          </Text>
        ) : (
          subgroups.map((subgroup, index) => {
            const isLast = index === subgroups.length - 1;
            return (
              <Flex
                key={subgroup.id}
                style={isLast ? rowBaseStyle : { ...rowBaseStyle, ...rowBorderStyle }}
                align="center"
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
                  <Text as="p" style={descStyle}>
                    {subgroup.member_count} members
                  </Text>
                </Box>
                <Button
                  variant="soft"
                  color="red"
                  radius="full"
                  size="1"
                  onClick={() => setDeletingSubgroupId(subgroup.id)}
                >
                  削除
                </Button>
              </Flex>
            );
          })
        )}
      </Box>

      <DeleteSubgroupDialog
        open={deletingSubgroupId !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingSubgroupId(null);
        }}
        groupId={groupId}
        subgroupId={deletingSubgroupId}
        onSuccess={() => {
          refetch();
        }}
      />
    </Box>
  );
}
