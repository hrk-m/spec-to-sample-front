import { useCallback, useState } from "react";
import { validateGroupName } from "@/entities/group";
import { useNavigate } from "react-router";

import { createGroup } from "@/pages/home/api/create-group";
import type { CreateGroupRequest } from "./group";

export function useCreateGroup() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  const submit = useCallback(
    async (params: CreateGroupRequest) => {
      const validationError = validateGroupName(params.name);
      if (validationError) {
        setNameError(validationError);
        return;
      }

      setNameError(null);
      setError(null);
      setIsLoading(true);

      try {
        const group = await createGroup(params);
        navigate(`/groups/${String(group.id)}`);
      } catch (err: unknown) {
        setError(String(err));
      } finally {
        setIsLoading(false);
      }
    },
    [navigate],
  );

  return {
    isLoading,
    error,
    nameError,
    submit,
    setNameError,
    setError,
  };
}
