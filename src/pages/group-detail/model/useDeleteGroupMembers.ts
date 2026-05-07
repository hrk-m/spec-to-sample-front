import { useState } from "react";

import { deleteGroupMembers } from "@/pages/group-detail/api/delete-group-members";

type UseDeleteGroupMembersReturn = {
  isLoading: boolean;
  error: string | null;
  submit: (userIds: number[]) => Promise<boolean>;
};

export function useDeleteGroupMembers(groupId: number): UseDeleteGroupMembersReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(userIds: number[]): Promise<boolean> {
    setIsLoading(true);
    setError(null);
    try {
      await deleteGroupMembers({ groupId, userIds });
      return true;
    } catch (err: unknown) {
      setError(String(err));
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  return { isLoading, error, submit };
}
