export type SubgroupSummary = {
  id: number;
  name: string;
  description: string;
  member_count: number;
};

export type GroupDetail = {
  id: number;
  name: string;
  description: string;
  member_count: number;
  subgroups: SubgroupSummary[];
};

export type UserSummary = {
  id: number;
  uuid: string;
  first_name: string;
  last_name: string;
  source_groups: Array<{ group_id: number; group_name: string }>;
};

export type MembersResponse = {
  members: UserSummary[];
  total: number;
};

export function isDirectMember(member: UserSummary, groupId: number): boolean {
  return member.source_groups.some((sg) => sg.group_id === groupId);
}

export function buildSourceLabel(member: UserSummary, groupId: number): string {
  return member.source_groups
    .toSorted((a, b) => {
      if (a.group_id === groupId) return -1;
      if (b.group_id === groupId) return 1;
      return 0;
    })
    .map((sg) => (sg.group_id === groupId ? "自グループ" : sg.group_name))
    .join(", ");
}
