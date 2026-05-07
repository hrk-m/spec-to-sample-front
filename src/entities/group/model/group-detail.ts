import type { SubgroupSummary } from "./subgroup";

export type GroupDetail = {
  id: number;
  name: string;
  description: string;
  member_count: number;
  subgroups: SubgroupSummary[];
};
