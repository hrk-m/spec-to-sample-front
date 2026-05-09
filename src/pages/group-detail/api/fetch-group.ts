import type { GroupDetail } from "@/entities/group";

import { apiFetch } from "@/shared/api";

export function fetchGroup(groupId: number): Promise<GroupDetail> {
  return apiFetch<GroupDetail>(`/api/v1/groups/${String(groupId)}`);
}
