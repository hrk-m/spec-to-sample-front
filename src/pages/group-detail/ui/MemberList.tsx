import type React from "react";
import { useEffect, useRef, useState } from "react";
import { isDirectMember, type GroupMember } from "@/entities/group";
import {
  AlertDialog,
  Box,
  Button,
  Checkbox,
  Flex,
  Skeleton,
  Spinner,
  Text,
  TextField,
} from "@radix-ui/themes";
import { FaMagnifyingGlass } from "react-icons/fa6";

import { buildSourceLabel } from "@/pages/group-detail/model/source-label";
import { useDeleteGroupMembers } from "@/pages/group-detail/model/useDeleteGroupMembers";
import { useMemberList } from "@/pages/group-detail/model/useMemberList";
import { styles } from "./MemberList.styles";

const SKELETON_ROWS = 5;

function MemberRow({
  member,
  isDirect,
  sourceLabel,
  isLast,
  isSelected,
  showCheckbox,
  onToggle,
  onClick,
}: {
  member: GroupMember;
  isDirect: boolean;
  sourceLabel: string;
  isLast: boolean;
  isSelected: boolean;
  showCheckbox: boolean;
  onToggle: (id: number) => void;
  onClick?: () => void;
}) {
  return (
    <tr data-testid="member-row" style={isLast ? styles.tableRowLast : styles.tableRow}>
      {showCheckbox && (
        <td style={styles.tableCellCheckbox}>
          {isDirect ? (
            <Flex align="center">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggle(member.id)}
                aria-label={`Select ${member.last_name} ${member.first_name}`}
                data-testid="member-checkbox"
              />
            </Flex>
          ) : null}
        </td>
      )}
      <td style={styles.tableCellId}>{member.uuid}</td>
      <td
        style={{
          ...styles.tableCellName,
          cursor: isDirect && onClick ? "pointer" : undefined,
        }}
        onClick={isDirect && onClick ? onClick : undefined}
        role={isDirect && onClick ? "button" : undefined}
        tabIndex={isDirect && onClick ? 0 : undefined}
        onKeyDown={
          isDirect && onClick
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onClick();
                }
              }
            : undefined
        }
      >
        {member.last_name} {member.first_name}
      </td>
      <td style={styles.tableCellSource}>{sourceLabel}</td>
    </tr>
  );
}

function SkeletonMemberRow({ isLast, showCheckbox }: { isLast: boolean; showCheckbox: boolean }) {
  return (
    <tr style={isLast ? styles.tableRowLast : styles.skeletonRow}>
      {showCheckbox && (
        <td style={styles.tableCellCheckbox}>
          <Box
            style={{
              width: 16,
              height: 16,
              background: "rgba(118, 118, 128, 0.16)",
              borderRadius: 4,
            }}
          />
        </td>
      )}
      <td style={styles.skeletonCell}>
        <Skeleton style={styles.skeletonLine} />
      </td>
      <td style={styles.skeletonCell}>
        <Skeleton style={styles.skeletonLine} />
      </td>
      <td style={styles.skeletonCell}>
        <Skeleton style={styles.skeletonLine} />
      </td>
    </tr>
  );
}

type MemberListProps = {
  groupId: number;
  onMemberClick?: (member: GroupMember) => void;
  onRefetch?: () => void;
  onTotalChange?: (total: number) => void;
  onDuplicateCountChange?: (count: number) => void;
  excludeDirectMembers?: boolean;
  onExcludeDirectMembersChange?: (value: boolean) => void;
  excludeGroupIds?: number[];
  scrollContainerStyle?: React.CSSProperties;
  enabled?: boolean;
};

export function MemberList({
  groupId,
  onMemberClick,
  onRefetch,
  onTotalChange,
  onDuplicateCountChange,
  excludeDirectMembers = false,
  onExcludeDirectMembersChange,
  excludeGroupIds,
  scrollContainerStyle,
  enabled,
}: MemberListProps) {
  const {
    members,
    directMembers,
    directMemberCount,
    total,
    duplicateCount,
    searchQuery,
    error,
    isLoading,
    isFetchingMore,
    fetchMoreError,
    sentinelRef,
    setSearchQuery,
  } = useMemberList(groupId, excludeGroupIds, { enabled });

  useEffect(() => {
    onTotalChange?.(total);
  }, [total, onTotalChange]);

  useEffect(() => {
    onDuplicateCountChange?.(duplicateCount);
  }, [duplicateCount, onDuplicateCountChange]);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const {
    isLoading: isDeleting,
    error: deleteError,
    submit: submitDelete,
  } = useDeleteGroupMembers(groupId);

  const isInitialLoading = isLoading && members.length === 0;
  const showCheckbox = onRefetch !== undefined;

  const headerCheckboxRef = useRef<HTMLInputElement>(null);
  const isAllSelected = directMemberCount > 0 && selectedIds.size === directMemberCount;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < directMemberCount;

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = isSomeSelected;
    }
  }, [isSomeSelected, isAllSelected]);

  function handleSelectAll() {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(directMembers.map((m) => m.id)));
    }
  }

  function handleToggle(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleDeleteClick() {
    setDeleteDialogOpen(true);
  }

  function handleCancelDelete() {
    setDeleteDialogOpen(false);
  }

  async function handleConfirmDelete() {
    const ok = await submitDelete([...selectedIds]);
    if (ok) {
      setSelectedIds(new Set());
      setDeleteDialogOpen(false);
      onRefetch?.();
    }
  }

  const colSpan = showCheckbox ? 4 : 3;

  return (
    <Box
      style={{
        padding: "0 20px",
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <Box style={styles.searchSection}>
        <TextField.Root
          size="3"
          radius="large"
          variant="surface"
          style={styles.searchField}
          placeholder="Search members"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        >
          <TextField.Slot>
            <FaMagnifyingGlass aria-hidden="true" style={styles.searchFieldIcon} />
          </TextField.Slot>
        </TextField.Root>
      </Box>

      {(showCheckbox || onExcludeDirectMembersChange !== undefined) && (
        <Flex justify="between" align="center" style={{ marginTop: 12, marginBottom: 12 }}>
          {onExcludeDirectMembersChange !== undefined ? (
            <Flex align="center" gap="2">
              <Checkbox
                checked={excludeDirectMembers}
                onCheckedChange={(checked) => onExcludeDirectMembersChange(Boolean(checked))}
                id="exclude-direct-members"
                aria-label="自グループを除外"
              />
              <label htmlFor="exclude-direct-members" style={{ fontSize: 13, cursor: "pointer" }}>
                自グループを除外
              </label>
            </Flex>
          ) : (
            <span />
          )}
          {showCheckbox && (
            <Button
              type="button"
              size="2"
              radius="full"
              variant="soft"
              color="red"
              disabled={selectedIds.size === 0}
              onClick={handleDeleteClick}
            >
              削除
            </Button>
          )}
        </Flex>
      )}

      <Box style={scrollContainerStyle}>
        {error && (
          <Text as="p" style={styles.errorText}>
            {error}
          </Text>
        )}

        {!error && (
          <Box style={styles.tableWrapper}>
            <table style={styles.tableRoot}>
              <thead style={styles.tableHeader}>
                <tr>
                  {showCheckbox && (
                    <th style={styles.tableHeaderCellCheckbox} aria-label="選択">
                      <Flex align="center">
                        <input
                          ref={headerCheckboxRef}
                          type="checkbox"
                          data-testid="header-checkbox"
                          checked={isAllSelected}
                          disabled={directMemberCount === 0}
                          onChange={handleSelectAll}
                          aria-label="全選択"
                          style={styles.headerCheckboxInput}
                        />
                      </Flex>
                    </th>
                  )}
                  <th style={styles.tableHeaderCellUuid}>uuid</th>
                  <th style={styles.tableHeaderCell}>姓名</th>
                  <th style={styles.tableHeaderCellSource}>所属元</th>
                </tr>
              </thead>
              <tbody>
                {isInitialLoading && (
                  <>
                    <tr>
                      <td colSpan={colSpan} style={{ padding: "12px 16px" }}>
                        <Text as="span" className="visually-hidden">
                          loading members...
                        </Text>
                      </td>
                    </tr>
                    {Array.from({ length: SKELETON_ROWS }, (_, i) => (
                      <SkeletonMemberRow
                        key={i}
                        isLast={i === SKELETON_ROWS - 1}
                        showCheckbox={showCheckbox}
                      />
                    ))}
                  </>
                )}

                {!isInitialLoading &&
                  members.map((member, index) => (
                    <MemberRow
                      key={member.id}
                      member={member}
                      isDirect={isDirectMember(member, groupId)}
                      sourceLabel={buildSourceLabel(member, groupId)}
                      isLast={index === members.length - 1}
                      isSelected={selectedIds.has(member.id)}
                      showCheckbox={showCheckbox}
                      onToggle={handleToggle}
                      onClick={onMemberClick ? () => onMemberClick(member) : undefined}
                    />
                  ))}
              </tbody>
            </table>
          </Box>
        )}

        {!isInitialLoading && !error && members.length === 0 && (
          <Text as="p" style={styles.emptyText}>
            No members found.
          </Text>
        )}

        {fetchMoreError && (
          <Text as="p" style={styles.errorText}>
            {fetchMoreError}
          </Text>
        )}

        {isFetchingMore && (
          <Flex justify="center" style={{ marginTop: 12 }}>
            <Spinner aria-label="Loading more members" />
          </Flex>
        )}

        <div
          ref={sentinelRef}
          style={{ height: 1 }}
          aria-hidden="true"
          data-testid="member-sentinel"
        />
      </Box>

      <AlertDialog.Root open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialog.Content maxWidth="480px">
          <AlertDialog.Title>メンバー削除</AlertDialog.Title>
          <AlertDialog.Description>
            選択した {selectedIds.size} 名をグループから削除しますか？
          </AlertDialog.Description>

          {deleteError && (
            <Text size="2" color="red" mt="2" as="p">
              {deleteError}
            </Text>
          )}

          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray" radius="full" onClick={handleCancelDelete}>
                キャンセル
              </Button>
            </AlertDialog.Cancel>
            <Button
              color="red"
              radius="full"
              disabled={isDeleting}
              onClick={() => void handleConfirmDelete()}
            >
              削除する
            </Button>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </Box>
  );
}
