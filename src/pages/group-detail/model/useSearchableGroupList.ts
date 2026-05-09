import { useEffect, useRef, useState } from "react";
import { type Group } from "@/entities/group";

import { fetchGroups } from "@/pages/group-detail/api/fetch-groups";

const DEBOUNCE_MS = 300;

export type SearchableGroupList = {
  groups: Group[];
  total: number | null;
  isLoading: boolean;
  error: string | null;
};

export function useSearchableGroupList(searchQuery: string): SearchableGroupList {
  const [groups, setGroups] = useState<Group[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isActiveRef = useRef(true);

  useEffect(() => {
    isActiveRef.current = true;
    setIsLoading(true);
    setError(null);

    const timerId = setTimeout(() => {
      fetchGroups({ q: searchQuery || undefined })
        .then((data) => {
          if (!isActiveRef.current) return;
          setGroups(data.groups);
          setTotal(data.total);
        })
        .catch((err: unknown) => {
          if (!isActiveRef.current) return;
          const msg = err instanceof Error ? err.message : String(err);
          setError(`Error ${msg}`);
        })
        .finally(() => {
          if (!isActiveRef.current) return;
          setIsLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timerId);
      isActiveRef.current = false;
    };
  }, [searchQuery]);

  return { groups, total, isLoading, error };
}
