import { apiFetch } from "@/shared/api";

export function deleteSubgroup(groupId: number, childId: number): Promise<void> {
  return apiFetch<void>(`/api/v1/groups/${String(groupId)}/subgroups/${String(childId)}`, {
    method: "DELETE",
  });
}
