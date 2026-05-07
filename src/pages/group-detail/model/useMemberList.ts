import { useCallback, useMemo, useState } from "react";
import { isDirectMember, type GroupMember } from "@/entities/group";

import { fetchGroupMembers } from "@/pages/group-detail/api/fetch-group-members";
import { INFINITE_LIST_FETCH_LIMIT, useInfiniteList } from "@/shared/lib/use-infinite-list";

export const FETCH_LIMIT = INFINITE_LIST_FETCH_LIMIT;

export function useMemberList(
  groupId: number,
  excludeGroupIds?: number[],
  options?: { enabled?: boolean },
) {
  const excludeIdsParam = useMemo(
    () =>
      excludeGroupIds && excludeGroupIds.length > 0
        ? excludeGroupIds.toSorted((a, b) => a - b).join(",")
        : "",
    [excludeGroupIds],
  );

  const cacheKey = `${groupId}:${excludeIdsParam}`;

  const buildParams = useCallback(
    (base: { limit: number; offset: number; q?: string }) => ({
      groupId,
      ...base,
      exclude_group_ids: excludeIdsParam || undefined,
    }),
    [groupId, excludeIdsParam],
  );

  const [duplicateCount, setDuplicateCount] = useState(0);

  const wrappedFetch = useCallback(
    (params: {
      groupId: number;
      limit: number;
      offset: number;
      q?: string;
      exclude_group_ids?: string;
    }) =>
      fetchGroupMembers(params).then((data) => {
        setDuplicateCount(data.duplicate_count);
        return { items: data.members, total: data.total };
      }),
    [],
  );

  const {
    items: members,
    total,
    isLoading,
    isFetchingMore,
    fetchMoreError,
    error,
    searchQuery,
    setSearchQuery,
    sentinelRef,
    refetch,
  } = useInfiniteList<GroupMember, { groupId: number; exclude_group_ids?: string }>({
    cacheKey,
    fetchFn: wrappedFetch,
    buildParams,
    enabled: options?.enabled,
  });

  const directMembers = useMemo(
    () => members.filter((m) => isDirectMember(m, groupId)),
    [members, groupId],
  );

  return {
    members,
    directMembers,
    directMemberCount: directMembers.length,
    total,
    duplicateCount,
    searchQuery,
    error,
    isLoading,
    isFetchingMore,
    fetchMoreError,
    sentinelRef,
    setSearchQuery,
    refetch,
  };
}
