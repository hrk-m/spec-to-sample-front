import { useState } from "react";

import { addGroupMembers } from "@/pages/group-detail/api/add-group-members";

type UseAddGroupMembersReturn = {
  isLoading: boolean;
  error: string | null;
  submit: (userIds: number[]) => Promise<boolean>;
};

export function useAddGroupMembers(groupId: number): UseAddGroupMembersReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(userIds: number[]): Promise<boolean> {
    setIsLoading(true);
    setError(null);
    try {
      await addGroupMembers({ groupId, userIds });
      return true;
    } catch (err: unknown) {
      const message = String(err);
      if (message.includes("409")) {
        setError("選択したユーザーはすでにメンバーです");
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
