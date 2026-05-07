export type GroupMember = {
  id: number;
  uuid: string;
  first_name: string;
  last_name: string;
  source_groups: Array<{ group_id: number; group_name: string }>;
};

export function isDirectMember(member: GroupMember, groupId: number): boolean {
  return member.source_groups.some((sg) => sg.group_id === groupId);
}
