import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Button, Checkbox, Flex, Skeleton, Spinner, Text, TextField } from "@radix-ui/themes";
import { FaMagnifyingGlass } from "react-icons/fa6";

import { useAddGroupMembers } from "@/pages/group-detail/model/useAddGroupMembers";
import { useNonMemberList } from "@/pages/group-detail/model/useNonMemberList";
import { useSheetStack } from "@/shared/lib/sheet-stack";
import { styles } from "./AddMemberSheet.styles";

const SKELETON_ROWS = 5;

const containerStyle = {
  padding: "0 24px 24px",
} as const;

const footerStyle = {
  marginTop: 20,
  display: "flex",
  justifyContent: "flex-end",
} as const;

const loadingTextStyle = {
  margin: 0,
  fontSize: 14,
  color: "#8e8e93",
  textAlign: "center" as const,
  padding: "28px 24px",
} as const;

const headerCheckboxInputStyle = {
  display: "block" as const,
  width: 16,
  height: 16,
  margin: 0,
  cursor: "pointer",
  accentColor: "#1c1c1e",
  flexShrink: 0,
} as const;

type AddMemberSheetProps = {
  groupId: number;
  onSuccess?: () => void;
};

export function AddMemberSheet({ groupId, onSuccess }: AddMemberSheetProps) {
  const { closeSheet } = useSheetStack();
  const {
    users,
    isLoading,
    isFetchingMore,
    fetchMoreError,
    error: fetchError,
    searchQuery,
    setSearchQuery,
    sentinelRef,
  } = useNonMemberList(groupId);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const { isLoading: isSubmitting, error: submitError, submit } = useAddGroupMembers(groupId);

  const headerCheckboxRef = useRef<HTMLInputElement>(null);
  const isAllSelected = users.length > 0 && selectedIds.size === users.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < users.length;

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = isSomeSelected;
    }
  }, [isSomeSelected, isAllSelected]);

  const handleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(users.map((u) => u.id)));
    }
  }, [isAllSelected, users]);

  const handleToggle = useCallback((userId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (selectedIds.size === 0) return;

    const ok = await submit(Array.from(selectedIds));
    if (ok) {
      onSuccess?.();
      closeSheet();
    }
  }, [selectedIds, submit, onSuccess, closeSheet]);

  return (
    <Box style={containerStyle}>
      <Box style={styles.searchSection}>
        <TextField.Root
          size="3"
          radius="large"
          variant="surface"
          style={styles.searchField}
          placeholder="Search non-members"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        >
          <TextField.Slot>
            <FaMagnifyingGlass aria-hidden="true" style={styles.searchFieldIcon} />
          </TextField.Slot>
        </TextField.Root>
      </Box>

      <Box style={footerStyle}>
        <Button
          variant="soft"
          size="2"
          radius="full"
          disabled={selectedIds.size === 0 || isSubmitting}
          onClick={() => void handleSubmit()}
        >
          一括追加
        </Button>
      </Box>

      {fetchError && (
        <Text as="p" style={styles.errorText}>
          {fetchError}
        </Text>
      )}

      {submitError && (
        <Text as="p" style={styles.errorText}>
          {submitError}
        </Text>
      )}

      {isLoading && users.length === 0 && (
        <>
          <Text as="p" className="visually-hidden" style={loadingTextStyle}>
            loading non-members...
          </Text>
          <table style={styles.tableRoot}>
            <thead style={styles.tableHeader}>
              <tr>
                <th aria-label="選択" style={styles.tableHeaderCellCheckbox} />
                <th style={styles.tableHeaderCellUuid}>uuid</th>
                <th style={styles.tableHeaderCell}>姓名</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: SKELETON_ROWS }, (_, i) => (
                <tr key={i} style={i < SKELETON_ROWS - 1 ? styles.skeletonRow : undefined}>
                  <td style={styles.skeletonCell}>
                    <Flex align="center">
                      <Skeleton style={{ width: 16, height: 16, borderRadius: 4 }} />
                    </Flex>
                  </td>
                  <td style={styles.skeletonCell}>
                    <Skeleton style={styles.skeletonLine} />
                  </td>
                  <td style={styles.skeletonCell}>
                    <Skeleton style={styles.skeletonLine} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {!fetchError && (
        <table style={styles.tableRoot}>
          <thead style={styles.tableHeader}>
            <tr>
              <th aria-label="選択" style={styles.tableHeaderCellCheckbox}>
                <Flex align="center">
                  <input
                    ref={headerCheckboxRef}
                    type="checkbox"
                    data-testid="header-checkbox"
                    checked={isAllSelected}
                    disabled={users.length === 0}
                    onChange={handleSelectAll}
                    aria-label="全選択"
                    style={headerCheckboxInputStyle}
                  />
                </Flex>
              </th>
              <th style={styles.tableHeaderCell}>uuid</th>
              <th style={styles.tableHeaderCell}>姓名</th>
            </tr>
          </thead>
          <tbody>
            {!isLoading && users.length === 0 ? (
              <tr>
                <td colSpan={3} style={styles.emptyText}>
                  追加できるユーザーがいません。
                </td>
              </tr>
            ) : (
              users.map((user, index) => (
                <tr
                  key={user.id}
                  style={index < users.length - 1 ? styles.tableRow : styles.tableRowLast}
                  onClick={() => handleToggle(user.id)}
                >
                  <td style={styles.tableCellCheckbox}>
                    <Flex align="center">
                      <Checkbox
                        checked={selectedIds.has(user.id)}
                        onClick={(e) => e.stopPropagation()}
                        onCheckedChange={() => handleToggle(user.id)}
                      />
                    </Flex>
                  </td>
                  <td style={styles.tableCellUuid}>{user.uuid}</td>
                  <td style={styles.tableCellName}>
                    {user.last_name} {user.first_name}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {fetchMoreError && (
        <Text as="p" style={styles.errorText}>
          {fetchMoreError}
        </Text>
      )}

      {isFetchingMore && (
        <Flex justify="center" style={{ marginTop: 12 }}>
          <Spinner aria-label="Loading more non-members" />
        </Flex>
      )}

      <div
        ref={sentinelRef}
        style={{ height: 1 }}
        aria-hidden="true"
        data-testid="non-member-sentinel"
      />
    </Box>
  );
}
