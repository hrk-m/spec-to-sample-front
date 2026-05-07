import { useState } from "react";
import { validateGroupName } from "@/entities/group";

import { updateGroup } from "@/pages/group-detail/api/update-group";
import type { UpdateGroupRequest } from "./group-update";

type UseUpdateGroupReturn = {
  isLoading: boolean;
  error: string | null;
  submit: (req: UpdateGroupRequest) => Promise<void>;
};

export function useUpdateGroup(groupId: number, onSuccess?: () => void): UseUpdateGroupReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(req: UpdateGroupRequest): Promise<void> {
    const validationError = validateGroupName(req.name);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await updateGroup(groupId, { name: req.name.trim(), description: req.description });
      onSuccess?.();
    } catch (err: unknown) {
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  }

  return { isLoading, error, submit };
}
