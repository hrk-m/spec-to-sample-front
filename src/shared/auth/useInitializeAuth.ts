import { useEffect, useState } from "react";

import { apiFetch, HttpError } from "@/shared/api";
import { useAuth } from "./auth";

type MeResponse = {
  id: number;
  uuid: string;
  first_name: string;
  last_name: string;
};

export type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "api_unavailable";

export type InitializeAuthResult = {
  status: AuthStatus;
};

export function useInitializeAuth(): InitializeAuthResult {
  const { setUser } = useAuth();
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    apiFetch<MeResponse>("/api/v1/me")
      .then((me) => {
        setUser({
          id: me.id,
          uuid: me.uuid,
          firstName: me.first_name,
          lastName: me.last_name,
        });
        setStatus("authenticated");
      })
      .catch((err: unknown) => {
        if (err instanceof HttpError && err.status === 401) {
          setStatus("unauthenticated");
        } else {
          setStatus("api_unavailable");
        }
      });
  }, [setUser]);

  return { status };
}
