import { GroupList } from "./GroupList";

type HomePageProps = {
  onGroupClick?: (groupId: number) => void;
  refetchTrigger?: number;
};

export function HomePage({ onGroupClick, refetchTrigger }: HomePageProps) {
  return <GroupList onGroupClick={onGroupClick} externalRefetchKey={refetchTrigger} />;
}
