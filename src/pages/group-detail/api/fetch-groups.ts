import { apiFetch } from "@/shared/api";

export type GroupSummary = {
  id: number;
  name: string;
  description: string;
  member_count: number;
};

export type FetchGroupsForSheetResponse = {
  groups: GroupSummary[];
  total: number;
};

/**
 * Sheet 用の全グループ一覧取得。
 * pages/home/api/fetch-groups.ts の同一レイヤークロスインポートを避けるため、
 * pages/group-detail スライス内に独立して実装する。
 *
 * @param q 検索キーワード。空文字または undefined のとき q パラメータを付与しない。
 */
export function fetchGroupsForSheet(q?: string): Promise<FetchGroupsForSheetResponse> {
  const url = q ? `/api/v1/groups?q=${encodeURIComponent(q)}` : "/api/v1/groups";
  return apiFetch<FetchGroupsForSheetResponse>(url);
}
