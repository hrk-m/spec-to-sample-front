import type { MembersResponse } from "@/pages/group-detail/model/members-response";
import { apiFetch } from "@/shared/api";

export type FetchGroupMembersParams = {
  groupId: number;
  limit: number;
  offset: number;
  q?: string;
  exclude_group_ids?: string;
};

export function fetchGroupMembers(params: FetchGroupMembersParams): Promise<MembersResponse> {
  const query = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
  });

  if (params.q) {
    query.set("q", params.q);
  }

  if (params.exclude_group_ids) {
    query.set("exclude_group_ids", params.exclude_group_ids);
  }

  return apiFetch<MembersResponse>(
    `/api/v1/groups/${String(params.groupId)}/members?${query.toString()}`,
  );
}
