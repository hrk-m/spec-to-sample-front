import type { ReactNode } from "react";
import type { GroupMember } from "@/entities/group";
import { Box } from "@radix-ui/themes";

import { PageContainer } from "@/shared/ui";
import { GroupDetailContent } from "./GroupDetailContent";
import { styles } from "./GroupDetailPage.styles";

type GroupDetailViewProps = {
  groupId: number;
  onMemberClick?: (member: GroupMember) => void;
  header?: ReactNode;
};

export function GroupDetailView({ groupId, onMemberClick, header }: GroupDetailViewProps) {
  return (
    <div
      style={{
        position: "fixed",
        top: "calc(var(--header-height) + env(safe-area-inset-top, 0px))",
        left: 0,
        right: 0,
        bottom: "env(safe-area-inset-bottom, 0px)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        background: "#ffffff",
      }}
    >
      <PageContainer
        padding="0 24px 16px"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        <Box
          style={{
            ...styles.content,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            minHeight: 0,
          }}
        >
          {header}
          <GroupDetailContent key={groupId} groupId={groupId} onMemberClick={onMemberClick} />
        </Box>
      </PageContainer>
    </div>
  );
}
