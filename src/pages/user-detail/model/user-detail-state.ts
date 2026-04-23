import { useEffect, useState } from "react";

import { fetchUser } from "@/pages/user-detail/api/fetch-user";
import type { UserDetail } from "@/pages/user-detail/model/user-detail";

type UserDetailState = {
  user: UserDetail | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
};

export function useUserDetail(id: string | undefined): UserDetailState {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    let isActive = true;

    setLoading(true);
    setError(null);
    setNotFound(false);
    setUser(null);

    fetchUser(id)
      .then((data) => {
        if (!isActive) return;
        setUser(data);
      })
      .catch((err: unknown) => {
        if (!isActive) return;
        if (
          err instanceof Error &&
          "notFound" in err &&
          (err as Error & { notFound: boolean }).notFound
        ) {
          setNotFound(true);
        } else {
          setError(String(err));
        }
      })
      .finally(() => {
        if (!isActive) return;
        setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [id]);

  return { user, loading, error, notFound };
}
