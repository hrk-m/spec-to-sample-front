import type { User } from "@/entities/user";

export type UsersResponse = {
  users: User[];
  total: number;
};

export type FetchUsersParams = {
  q?: string;
  limit?: number;
  offset?: number;
};
