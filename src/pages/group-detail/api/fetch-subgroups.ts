import type { SubgroupSummary } from "@/entities/group";

import { apiFetch } from "@/shared/api";

type SubgroupsResponse = {
  subgroups: SubgroupSummary[];
};

export function fetchSubgroups(groupId: number): Promise<SubgroupSummary[]> {
  return apiFetch<SubgroupsResponse>(`/api/v1/groups/${String(groupId)}/subgroups`).then(
    (res) => res.subgroups,
  );
}
