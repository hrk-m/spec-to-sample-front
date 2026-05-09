import { useCallback, useEffect, useRef, useState } from "react";
import type { GroupDetail, SubgroupSummary } from "@/entities/group";

import { fetchGroup } from "@/pages/group-detail/api/fetch-group";

export function useGroupDetail(groupId: number, options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [refetchKey, setRefetchKey] = useState(0);

  const previousGroupIdRef = useRef(groupId);

  const refetch = useCallback(() => {
    setRefetchKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let isActive = true;

    if (previousGroupIdRef.current !== groupId) {
      setGroup(null);
      previousGroupIdRef.current = groupId;
    }
    setError(null);
    setIsLoading(true);

    fetchGroup(groupId)
      .then((data) => {
        if (!isActive) return;
        setGroup(data);
      })
      .catch((err: unknown) => {
        if (!isActive) return;
        setError(String(err));
      })
      .finally(() => {
        if (!isActive) return;
        setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [groupId, refetchKey, enabled]);

  const subgroups: SubgroupSummary[] = group?.subgroups ?? [];

  return { group, error, isLoading, refetch, subgroups };
}
