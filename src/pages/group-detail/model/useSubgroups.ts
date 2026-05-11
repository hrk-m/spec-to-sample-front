import { useCallback, useEffect, useState } from "react";
import type { SubgroupSummary } from "@/entities/group";

import { fetchSubgroups } from "@/pages/group-detail/api/fetch-subgroups";

export function useSubgroups(groupId: number): {
  subgroups: SubgroupSummary[];
  refetch: () => void;
} {
  const [subgroups, setSubgroups] = useState<SubgroupSummary[]>([]);
  const [refetchKey, setRefetchKey] = useState(0);

  const refetch = useCallback(() => {
    setRefetchKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isActive = true;

    fetchSubgroups(groupId)
      .then((data) => {
        if (!isActive) return;
        setSubgroups(data);
      })
      .catch((err: unknown) => {
        if (!isActive) return;
        // eslint-disable-next-line no-console
        console.error(err);
      });

    return () => {
      isActive = false;
    };
  }, [groupId, refetchKey]);

  return { subgroups, refetch };
}
