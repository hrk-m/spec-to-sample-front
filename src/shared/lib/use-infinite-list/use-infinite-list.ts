import { useCallback, useEffect, useRef, useState } from "react";

export const INFINITE_LIST_FETCH_LIMIT = 100;

type FetchResult<T> = {
  items: T[];
  total: number;
};

type UseInfiniteListOptions<T extends { id: PropertyKey }, P> = {
  cacheKey: string | number;
  fetchFn: (params: P & { limit: number; offset: number; q?: string }) => Promise<FetchResult<T>>;
  buildParams: (base: { limit: number; offset: number; q?: string }) => P & {
    limit: number;
    offset: number;
    q?: string;
  };
  debounceMs?: number;
  enabled?: boolean;
};

export type UseInfiniteListResult<T extends { id: PropertyKey }> = {
  items: T[];
  total: number;
  isLoading: boolean;
  isFetchingMore: boolean;
  error: string | null;
  fetchMoreError: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  refetch: () => void;
};

export function useInfiniteList<T extends { id: PropertyKey }, P>({
  cacheKey,
  fetchFn,
  buildParams,
  debounceMs = 300,
  enabled = true,
}: UseInfiniteListOptions<T, P>): UseInfiniteListResult<T> {
  const [cachedItems, setCachedItems] = useState<T[]>([]);
  const cachedItemsRef = useRef(cachedItems);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [fetchMoreError, setFetchMoreError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [fetchedOffset, setFetchedOffset] = useState(0);
  const [lastBatchSize, setLastBatchSize] = useState(INFINITE_LIST_FETCH_LIMIT);
  const [refetchKey, setRefetchKey] = useState(0);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    cachedItemsRef.current = cachedItems;
  }, [cachedItems]);

  const doFetch = useCallback(
    (offset: number, query: string, append: boolean) => {
      setIsLoading(true);
      setError(null);

      const params = buildParams({
        limit: INFINITE_LIST_FETCH_LIMIT,
        offset,
        q: query || undefined,
      });

      fetchFn(params)
        .then((data) => {
          const nextItems = append
            ? [
                ...cachedItemsRef.current,
                ...data.items.filter(
                  (item) => !cachedItemsRef.current.some((cached) => cached.id === item.id),
                ),
              ]
            : data.items;

          setCachedItems(nextItems);
          setTotal(data.total);
          setFetchedOffset(offset + INFINITE_LIST_FETCH_LIMIT);
          setLastBatchSize(data.items.length);
        })
        .catch((err: unknown) => {
          setError(String(err));
          setLastBatchSize(0);
        })
        .finally(() => {
          setIsLoading(false);
        });
    },
    [cacheKey, fetchFn, buildParams],
  );

  const doFetchMore = useCallback(
    (offset: number, query: string) => {
      setIsFetchingMore(true);
      setFetchMoreError(null);

      const params = buildParams({
        limit: INFINITE_LIST_FETCH_LIMIT,
        offset,
        q: query || undefined,
      });

      fetchFn(params)
        .then((data) => {
          const nextItems = [
            ...cachedItemsRef.current,
            ...data.items.filter(
              (item) => !cachedItemsRef.current.some((cached) => cached.id === item.id),
            ),
          ];
          setCachedItems(nextItems);
          setTotal(data.total);
          setFetchedOffset(offset + INFINITE_LIST_FETCH_LIMIT);
          setLastBatchSize(data.items.length);
        })
        .catch((err: unknown) => {
          setFetchMoreError(String(err));
          setLastBatchSize(0);
        })
        .finally(() => {
          setIsFetchingMore(false);
        });
    },
    [fetchFn, buildParams],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [searchQuery, debounceMs]);

  useEffect(() => {
    if (!enabled) return;
    setCachedItems([]);
    setTotal(0);
    setFetchedOffset(0);
    setLastBatchSize(INFINITE_LIST_FETCH_LIMIT);
    setFetchMoreError(null);
    doFetch(0, debouncedQuery, false);
  }, [cacheKey, debouncedQuery, refetchKey, enabled, doFetch]);

  // Refs to avoid stale closures in IntersectionObserver callback
  const isFetchingMoreRef = useRef(isFetchingMore);
  const isLoadingRef = useRef(isLoading);
  const lastBatchSizeRef = useRef(lastBatchSize);
  const fetchedOffsetRef = useRef(fetchedOffset);
  const debouncedQueryRef = useRef(debouncedQuery);
  const enabledRef = useRef(enabled);

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
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (!enabledRef.current) return;
        if (isLoadingRef.current || isFetchingMoreRef.current) return;

        if (lastBatchSizeRef.current === INFINITE_LIST_FETCH_LIMIT) {
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

  const effectiveTotal = debouncedQuery ? cachedItems.length : total;

  const handleSetSearchQuery = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const refetch = useCallback(() => {
    setRefetchKey((prev) => prev + 1);
  }, []);

  return {
    items: cachedItems,
    total: effectiveTotal,
    isLoading,
    isFetchingMore,
    fetchMoreError,
    error,
    searchQuery,
    setSearchQuery: handleSetSearchQuery,
    sentinelRef,
    refetch,
  };
}
