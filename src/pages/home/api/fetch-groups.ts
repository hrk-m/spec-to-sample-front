import type { GroupsResponse } from "@/entities/group";

import { apiFetch } from "@/shared/api";

export type FetchGroupsParams = {
  q?: string;
  limit?: number;
  offset?: number;
};

export function fetchGroups(params: FetchGroupsParams): Promise<GroupsResponse> {
  const query = new URLSearchParams();

  if (params.q) {
    query.set("q", params.q);
  }
  if (params.limit !== undefined) {
    query.set("limit", String(params.limit));
  }
  if (params.offset !== undefined) {
    query.set("offset", String(params.offset));
  }

  const queryString = query.toString();
  const url = queryString ? `/api/v1/groups?${queryString}` : "/api/v1/groups";

  return apiFetch<GroupsResponse>(url);
}
