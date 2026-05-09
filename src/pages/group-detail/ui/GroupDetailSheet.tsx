import type { GroupMember } from "@/entities/group";

import { GroupDetailView } from "./GroupDetailView";

type GroupDetailSheetProps = {
  groupId: number;
  onMemberClick?: (member: GroupMember) => void;
};

export function GroupDetailSheet({ groupId, onMemberClick }: GroupDetailSheetProps) {
  return <GroupDetailView groupId={groupId} onMemberClick={onMemberClick} />;
}
