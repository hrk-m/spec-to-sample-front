import type { GroupMember } from "@/entities/group";

import { apiFetch } from "@/shared/api";

export type NonMembersResponse = {
  users: GroupMember[];
  total: number;
};

export type FetchNonMembersParams = {
  groupId: number;
  q?: string;
  limit?: number;
  offset?: number;
};

export function fetchNonMembers(params: FetchNonMembersParams): Promise<NonMembersResponse> {
  const query = new URLSearchParams({
    limit: String(params.limit ?? 100),
    offset: String(params.offset ?? 0),
  });

  if (params.q) {
    query.set("q", params.q);
  }

  return apiFetch<NonMembersResponse>(
    `/api/v1/groups/${String(params.groupId)}/non-members?${query.toString()}`,
  );
}
