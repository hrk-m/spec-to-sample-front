import { useEffect, useRef, useState } from "react";

const DEBOUNCE_MS = 300;

export type DebouncedMemberFilter = {
  debouncedExcludeGroupIds: number[];
  apiTotal: number | null;
  setApiTotal: (value: number | null) => void;
  duplicateCount: number;
  setDuplicateCount: (value: number) => void;
};

/**
 * フィルター変化を 300ms デバウンスしつつ、変化を検知した瞬間に
 * apiTotal / duplicateCount を即時リセットして古い値の表示を避ける。
 */
export function useDebouncedMemberFilter(excludeGroupIds: number[]): DebouncedMemberFilter {
  const excludeGroupIdsKey = excludeGroupIds.toSorted((a, b) => a - b).join(",");

  const [debouncedExcludeGroupIds, setDebouncedExcludeGroupIds] =
    useState<number[]>(excludeGroupIds);
  const [apiTotal, setApiTotal] = useState<number | null>(null);
  const [duplicateCount, setDuplicateCount] = useState<number>(0);

  const isFirstRenderRef = useRef(true);
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }

    setApiTotal(null);
    setDuplicateCount(0);

    const timer = setTimeout(() => {
      setDebouncedExcludeGroupIds(excludeGroupIds);
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [excludeGroupIdsKey]);

  return {
    debouncedExcludeGroupIds,
    apiTotal,
    setApiTotal,
    duplicateCount,
    setDuplicateCount,
  };
}
