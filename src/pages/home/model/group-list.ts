import { useCallback, useEffect, useRef, useState } from "react";
import { type Group } from "@/entities/group";

import { fetchGroups } from "@/pages/home/api/fetch-groups";

export const FETCH_LIMIT = 100;

export function useGroupList() {
  const [cachedGroups, setCachedGroups] = useState<Group[]>([]);
  const cachedGroupsRef = useRef(cachedGroups);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [fetchMoreError, setFetchMoreError] = useState<string | null>(null);
  const [fetchedOffset, setFetchedOffset] = useState(0);
  const [lastBatchSize, setLastBatchSize] = useState(FETCH_LIMIT);
  const [refetchKey, setRefetchKey] = useState(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    cachedGroupsRef.current = cachedGroups;
  }, [cachedGroups]);

  const doFetch = useCallback((offset: number, query: string, append: boolean) => {
    setIsLoading(true);
    setError(null);

    fetchGroups({ limit: FETCH_LIMIT, offset, q: query || undefined })
      .then((data) => {
        const nextGroups = append
          ? [
              ...cachedGroupsRef.current,
              ...data.groups.filter(
                (group) =>
                  !cachedGroupsRef.current.some((cachedGroup) => cachedGroup.id === group.id),
              ),
            ]
          : data.groups;

        setCachedGroups(nextGroups);
        setTotal(data.total);
        setFetchedOffset(offset + FETCH_LIMIT);
        setLastBatchSize(data.groups.length);
      })
      .catch((err: unknown) => {
        setError(String(err));
        setLastBatchSize(0);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const doFetchMore = useCallback((offset: number, query: string) => {
    setIsFetchingMore(true);
    setFetchMoreError(null);

    fetchGroups({ limit: FETCH_LIMIT, offset, q: query || undefined })
      .then((data) => {
        const nextGroups = [
          ...cachedGroupsRef.current,
          ...data.groups.filter(
            (group) => !cachedGroupsRef.current.some((cachedGroup) => cachedGroup.id === group.id),
          ),
        ];
        setCachedGroups(nextGroups);
        setTotal(data.total);
        setFetchedOffset(offset + FETCH_LIMIT);
        setLastBatchSize(data.groups.length);
      })
      .catch((err: unknown) => {
        setFetchMoreError(String(err));
        setLastBatchSize(0);
      })
      .finally(() => {
        setIsFetchingMore(false);
      });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setCachedGroups([]);
    setTotal(0);
    setFetchedOffset(0);
    setLastBatchSize(FETCH_LIMIT);
    setFetchMoreError(null);
    doFetch(0, debouncedQuery, false);
  }, [debouncedQuery, refetchKey, doFetch]);

  // IntersectionObserver for sentinel element
  const isFetchingMoreRef = useRef(isFetchingMore);
  const isLoadingRef = useRef(isLoading);
  const lastBatchSizeRef = useRef(lastBatchSize);
  const fetchedOffsetRef = useRef(fetchedOffset);
  const debouncedQueryRef = useRef(debouncedQuery);

  useEffect(() => {
    isFetchingMoreRef.current = isFetchingMore;
  }, [isFetchingMore]);
  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);
  useEffect(() => {
    lastBatchSizeRef.current = lastBatchSize;
  }, [lastBatchSize]);
  useEffect(() => {
    fetchedOffsetRef.current = fetchedOffset;
  }, [fetchedOffset]);
  useEffect(() => {
    debouncedQueryRef.current = debouncedQuery;
  }, [debouncedQuery]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (isLoadingRef.current || isFetchingMoreRef.current) return;

        if (lastBatchSizeRef.current === FETCH_LIMIT) {
          doFetchMore(fetchedOffsetRef.current, debouncedQueryRef.current);
        }
      },
      { threshold: 0.1 },
    );

    const sentinel = sentinelRef.current;
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => observer.disconnect();
  }, [doFetchMore]);

  const effectiveTotal = debouncedQuery ? cachedGroups.length : total;

  const hasCachedGroups = cachedGroups.length > 0;
  const shouldShowLoading = isLoading && !hasCachedGroups;

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const refetch = useCallback(() => {
    setRefetchKey((prev) => prev + 1);
  }, []);

  return {
    groups: cachedGroups,
    total: effectiveTotal,
    searchQuery,
    error,
    isLoading: shouldShowLoading,
    isFetchingMore,
    fetchMoreError,
    sentinelRef,
    setSearchQuery: handleSearch,
    refetch,
    groupCountLabel: shouldShowLoading
      ? "Loading groups..."
      : effectiveTotal > 0
        ? `${String(effectiveTotal)} groups`
        : "No groups found",
  };
}
