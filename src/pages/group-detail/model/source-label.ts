import type { GroupMember } from "@/entities/group";

export function buildSourceLabel(member: GroupMember, groupId: number): string {
  return member.source_groups
    .toSorted((a, b) => {
      if (a.group_id === groupId) return -1;
      if (b.group_id === groupId) return 1;
      return 0;
    })
    .map((sg) => (sg.group_id === groupId ? "自グループ" : sg.group_name))
    .join(", ");
}
