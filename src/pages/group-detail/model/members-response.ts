import type { GroupMember } from "@/entities/group";

export type MembersResponse = {
  members: GroupMember[];
  total: number;
  duplicate_count: number;
};
