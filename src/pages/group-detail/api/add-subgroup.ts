import { apiFetch } from "@/shared/api";

export type AddSubgroupParams = {
  groupId: number;
  childGroupId: number;
};

export type AddSubgroupResponse = {
  parent_group_id: number;
  child_group_id: number;
};

export function addSubgroup(params: AddSubgroupParams): Promise<AddSubgroupResponse> {
  return apiFetch<AddSubgroupResponse>(`/api/v1/groups/${String(params.groupId)}/subgroups`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ child_group_id: params.childGroupId }),
  });
}
