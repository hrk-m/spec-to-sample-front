import { useState } from "react";

import { deleteSubgroup as deleteSubgroupApi } from "@/pages/group-detail/api/delete-subgroup";
import { HttpError } from "@/shared/api";

type UseDeleteSubgroupReturn = {
  isLoading: boolean;
  error: string | null;
  deleteSubgroup: (groupId: number, childId: number) => Promise<boolean>;
  clearError: () => void;
};

export function useDeleteSubgroup(): UseDeleteSubgroupReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deleteSubgroup(groupId: number, childId: number): Promise<boolean> {
    setIsLoading(true);
    setError(null);

    try {
      await deleteSubgroupApi(groupId, childId);
      return true;
    } catch (err: unknown) {
      if (err instanceof HttpError && err.status === 404) {
        setError("対象のサブグループ関係が見つかりませんでした");
      } else {
        setError("サブグループの削除に失敗しました。しばらくしてから再度お試しください");
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  function clearError() {
    setError(null);
  }

  return { isLoading, error, deleteSubgroup, clearError };
}
