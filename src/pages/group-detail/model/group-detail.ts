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
};

export type MembersResponse = {
  members: UserSummary[];
  total: number;
};
