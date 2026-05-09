import { useCallback, useEffect, useMemo, useState } from "react";
import type { SubgroupSummary } from "@/entities/group";

export type SubgroupFilter = {
  selectedSubgroupIds: Set<number>;
  excludeGroupIds: number[];
  excludeDirectMembers: boolean;
  setExcludeDirectMembers: (value: boolean) => void;
  toggleSubgroup: (id: number) => void;
};

export function useSubgroupFilter(subgroups: SubgroupSummary[], groupId: number): SubgroupFilter {
  const [selectedSubgroupIds, setSelectedSubgroupIds] = useState<Set<number>>(
    () => new Set(subgroups.map((sg) => sg.id)),
  );
  const [excludeDirectMembers, setExcludeDirectMembers] = useState(false);

  const subgroupIdsKey = useMemo(
    () =>
      subgroups
        .map((sg) => sg.id)
        .toSorted((a, b) => a - b)
        .join(","),
    [subgroups],
  );

  // subgroups の ID セットが実質的に変化（追加・削除）したときのみ全リセットする
  useEffect(() => {
    setSelectedSubgroupIds(new Set(subgroups.map((sg) => sg.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subgroupIdsKey]);

  const allSubgroupIds = useMemo(() => new Set(subgroups.map((sg) => sg.id)), [subgroups]);

  const effectiveSelectedIds = useMemo(() => {
    const next = new Set<number>();
    for (const id of selectedSubgroupIds) {
      if (allSubgroupIds.has(id)) {
        next.add(id);
      }
    }
    return next;
  }, [selectedSubgroupIds, allSubgroupIds]);

  const excludeGroupIds = useMemo(() => {
    const excluded: number[] = [];
    for (const id of allSubgroupIds) {
      if (!effectiveSelectedIds.has(id)) {
        excluded.push(id);
      }
    }
    if (excludeDirectMembers) {
      excluded.push(groupId);
    }
    return excluded;
  }, [allSubgroupIds, effectiveSelectedIds, excludeDirectMembers, groupId]);

  const toggleSubgroup = useCallback((id: number) => {
    setSelectedSubgroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  return {
    selectedSubgroupIds: effectiveSelectedIds,
    excludeGroupIds,
    excludeDirectMembers,
    setExcludeDirectMembers,
    toggleSubgroup,
  };
}
