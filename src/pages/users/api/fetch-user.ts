import type { User } from "@/pages/users/model/user";
import { apiFetch, HttpError } from "@/shared/api";

export async function fetchUser(id: string): Promise<User> {
  try {
    return await apiFetch<User>("/api/v1/users/" + id);
  } catch (err) {
    if (err instanceof HttpError && err.status === 404) {
      throw Object.assign(err, { notFound: true });
    }
    throw err;
  }
}
