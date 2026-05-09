import type { Group } from "@/entities/group";

export type CreateGroupRequest = {
  name: string;
  description: string;
};

export type CreateGroupResponse = Group;
