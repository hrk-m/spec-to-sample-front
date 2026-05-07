import { useCallback, useMemo, useState } from "react";
import type { GroupMember } from "@/entities/group";
import { Box, Button, Flex, Heading, Skeleton, Text } from "@radix-ui/themes";
import { useNavigate } from "react-router";

import { useDebouncedMemberFilter } from "@/pages/group-detail/model/useDebouncedMemberFilter";
import { useGroupDetail } from "@/pages/group-detail/model/useGroupDetail";
import { useSubgroupFilter } from "@/pages/group-detail/model/useSubgroupFilter";
import { useSheetStack } from "@/shared/lib/sheet-stack";
import { AddMemberSheet } from "./AddMemberSheet";
import { DeleteGroupDialog } from "./DeleteGroupDialog";
import { EditGroupDialog } from "./EditGroupDialog";
import { styles } from "./GroupDetailPage.styles";
import { MemberList } from "./MemberList";
import { SubgroupFilterChips } from "./SubgroupFilterChips";
import { SubgroupManagementSheet } from "./SubgroupManagementSheet";

type GroupDetailContentProps = {
  groupId: number;
  onMemberClick?: (member: GroupMember) => void;
};

function GroupInfoSkeleton() {
  return (
    <Box style={styles.sectionCard}>
      <Text as="p" className="visually-hidden">
        loading group...
      </Text>
      <Box style={{ ...styles.skeletonBlock, ...styles.infoRowBorder }}>
        <Skeleton style={{ ...styles.skeletonLine, width: 60, height: 12 }} />
        <Skeleton style={{ ...styles.skeletonLine, width: 120, height: 16, marginTop: 4 }} />
      </Box>
      <Box style={styles.skeletonBlock}>
        <Skeleton style={{ ...styles.skeletonLine, width: 80, height: 12 }} />
        <Skeleton style={{ ...styles.skeletonLine, width: "80%", height: 16, marginTop: 4 }} />
      </Box>
    </Box>
  );
}

export function GroupDetailContent({ groupId, onMemberClick }: GroupDetailContentProps) {
  const [isSubgroupSheetOpen, setIsSubgroupSheetOpen] = useState(false);
  const [isAddMemberSheetOpen, setIsAddMemberSheetOpen] = useState(false);
  const { group, error, isLoading, refetch, subgroups } = useGroupDetail(groupId, {
    enabled: !isSubgroupSheetOpen && !isAddMemberSheetOpen,
  });
  const navigate = useNavigate();
  const { openSheet } = useSheetStack();
  const shouldShowSkeleton = isLoading && !group;
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const {
    selectedSubgroupIds,
    excludeGroupIds,
    excludeDirectMembers,
    setExcludeDirectMembers,
    toggleSubgroup,
  } = useSubgroupFilter(subgroups, groupId);

  const { debouncedExcludeGroupIds, apiTotal, setApiTotal, duplicateCount, setDuplicateCount } =
    useDebouncedMemberFilter(excludeGroupIds);

  const memberCount = useMemo(() => {
    const directCount = group?.member_count ?? 0;
    const subgroupCount = subgroups
      .filter((sg) => selectedSubgroupIds.has(sg.id))
      .reduce((sum, sg) => sum + sg.member_count, 0);
    return directCount + subgroupCount;
  }, [group, subgroups, selectedSubgroupIds]);

  const handleOpenAddMemberSheet = useCallback(() => {
    setIsAddMemberSheetOpen(true);
    openSheet({
      id: `add-member-${groupId}`,
      content: <AddMemberSheet groupId={groupId} />,
      onClose: () => {
        setIsAddMemberSheetOpen(false);
        refetch();
      },
    });
  }, [groupId, openSheet, refetch]);

  const handleOpenSubgroupManagementSheet = useCallback(() => {
    setIsSubgroupSheetOpen(true);
    openSheet({
      id: `subgroup-management-${groupId}`,
      content: <SubgroupManagementSheet groupId={groupId} groupName={group?.name ?? ""} />,
      onClose: () => setIsSubgroupSheetOpen(false),
    });
  }, [groupId, group?.name, openSheet]);

  return (
    <Box
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        minHeight: 0,
      }}
    >
      {shouldShowSkeleton && <GroupInfoSkeleton />}

      {error && !group && (
        <Text as="p" style={styles.errorText}>
          {error}
        </Text>
      )}

      {group && (
        <>
          {error && (
            <Text as="p" style={styles.errorText}>
              {error}
            </Text>
          )}

          <Box style={styles.groupHeaderCard}>
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Heading as="h1" style={styles.groupHeaderName}>
                {group.name}
              </Heading>
              {group.description && (
                <Text as="p" style={styles.groupHeaderDescription}>
                  {group.description}
                </Text>
              )}
            </Box>
            <Flex gap="2" style={{ flexShrink: 0 }}>
              <Button variant="soft" onClick={() => setEditDialogOpen(true)}>
                Edit
              </Button>
              <Button variant="soft" color="red" onClick={() => setDeleteDialogOpen(true)}>
                Delete
              </Button>
            </Flex>
          </Box>

          <Box style={styles.chipRow}>
            <SubgroupFilterChips
              subgroups={subgroups}
              selectedSubgroupIds={selectedSubgroupIds}
              onToggle={toggleSubgroup}
              onManageClick={handleOpenSubgroupManagementSheet}
            />
          </Box>

          <Box style={styles.memberSection}>
            <Flex style={styles.memberSectionHeader}>
              <Flex align="center" gap="2">
                <Text as="p" style={styles.memberSectionTitle}>
                  すべてのメンバー
                </Text>
                <Text as="p" style={styles.sectionMeta}>
                  {apiTotal ?? memberCount}件
                </Text>
                {duplicateCount > 0 && (
                  <Text as="p" style={styles.sectionMeta}>
                    重複 {duplicateCount}件
                  </Text>
                )}
              </Flex>
              <Button variant="soft" size="1" onClick={handleOpenAddMemberSheet}>
                メンバー追加
              </Button>
            </Flex>
            <MemberList
              groupId={groupId}
              excludeGroupIds={debouncedExcludeGroupIds}
              excludeDirectMembers={excludeDirectMembers}
              onExcludeDirectMembersChange={setExcludeDirectMembers}
              onMemberClick={onMemberClick}
              onRefetch={refetch}
              onTotalChange={setApiTotal}
              onDuplicateCountChange={setDuplicateCount}
              scrollContainerStyle={styles.memberScrollContainer}
              enabled={!isSubgroupSheetOpen && !isAddMemberSheetOpen}
            />
          </Box>

          <EditGroupDialog
            groupId={groupId}
            initialName={group.name}
            initialDescription={group.description}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onSuccess={refetch}
          />

          <DeleteGroupDialog
            groupId={groupId}
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onSuccess={() => void navigate("/")}
          />
        </>
      )}
    </Box>
  );
}
