import { useCallback } from "react";
import type { GroupMember } from "@/entities/group";

import { fetchNonMembers } from "@/pages/group-detail/api/fetch-non-members";
import { INFINITE_LIST_FETCH_LIMIT, useInfiniteList } from "@/shared/lib/use-infinite-list";

export const FETCH_LIMIT = INFINITE_LIST_FETCH_LIMIT;

export function useNonMemberList(groupId: number, options?: { enabled?: boolean }) {
  const buildParams = useCallback(
    (base: { limit: number; offset: number; q?: string }) => ({
      groupId,
      ...base,
    }),
    [groupId],
  );

  const wrappedFetch = useCallback(
    (params: { groupId: number; limit: number; offset: number; q?: string }) =>
      fetchNonMembers(params).then((data) => ({ items: data.users, total: data.total })),
    [],
  );

  const {
    items: users,
    total,
    isLoading,
    isFetchingMore,
    fetchMoreError,
    error,
    searchQuery,
    setSearchQuery,
    sentinelRef,
    refetch,
  } = useInfiniteList<GroupMember, { groupId: number }>({
    cacheKey: groupId,
    fetchFn: wrappedFetch,
    buildParams,
    enabled: options?.enabled,
  });

  return {
    users,
    total,
    isLoading,
    isFetchingMore,
    fetchMoreError,
    error,
    searchQuery,
    sentinelRef,
    setSearchQuery,
    refetch,
  };
}
