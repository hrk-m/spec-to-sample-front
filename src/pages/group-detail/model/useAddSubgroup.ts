import { useState } from "react";

import { addSubgroup } from "@/pages/group-detail/api/add-subgroup";

type UseAddSubgroupReturn = {
  isLoading: boolean;
  error: string | null;
  submit: (childGroupId: number) => Promise<boolean>;
};

export function useAddSubgroup(groupId: number): UseAddSubgroupReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(childGroupId: number): Promise<boolean> {
    setIsLoading(true);
    setError(null);
    try {
      await addSubgroup({ groupId, childGroupId });
      return true;
    } catch (err: unknown) {
      const message = String(err);
      if (message.includes("409")) {
        setError("すでに追加済みです");
      } else {
        setError("エラーが発生しました。しばらくしてから再試行してください。");
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  return { isLoading, error, submit };
}
