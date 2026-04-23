import type { UserDetail } from "@/pages/user-detail/model/user-detail";
import { apiFetch, HttpError } from "@/shared/api";

export async function fetchUser(id: string): Promise<UserDetail> {
  try {
    return await apiFetch<UserDetail>("/api/v1/users/" + id);
  } catch (err) {
    if (err instanceof HttpError && err.status === 404) {
      throw Object.assign(err, { notFound: true });
    }
    throw err;
  }
}
