import type { GroupDetail } from "@/entities/group";
import { Theme } from "@radix-ui/themes";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchGroup } from "@/pages/group-detail/api/fetch-group";
import { fetchGroupMembers } from "@/pages/group-detail/api/fetch-group-members";
import type { MembersResponse } from "@/pages/group-detail/model/members-response";
import { GroupDetailSheet } from "@/pages/group-detail/ui/GroupDetailSheet";

vi.mock("@/pages/group-detail/api/fetch-group", () => ({
  fetchGroup: vi.fn(),
}));

vi.mock("@/pages/group-detail/api/fetch-group-members", () => ({
  fetchGroupMembers: vi.fn(),
}));

vi.mock("@/shared/lib/sheet-stack", () => ({
  useSheetStack: vi.fn(() => ({
    openSheet: vi.fn(),
    closeSheet: vi.fn(),
    sheets: [],
  })),
}));

const mockGroup: GroupDetail = {
  id: 1,
  name: "dev-team",
  description: "Development team",
  member_count: 2,
  subgroups: [],
};

const mockMembersResponse: MembersResponse = {
  members: [
    {
      id: 1,
      uuid: "00000000-0000-0000-0000-000000000001",
      first_name: "Taro",
      last_name: "Yamada",
      source_groups: [{ group_id: 1, group_name: "dev-team" }],
    },
    {
      id: 2,
      uuid: "00000000-0000-0000-0000-000000000002",
      first_name: "Hanako",
      last_name: "Sato",
      source_groups: [{ group_id: 1, group_name: "dev-team" }],
    },
  ],
  total: 2,
  duplicate_count: 0,
};

function renderSheet(onMemberClick?: (m: (typeof mockMembersResponse.members)[0]) => void) {
  return render(
    <Theme>
      <MemoryRouter>
        <GroupDetailSheet groupId={1} onMemberClick={onMemberClick} />
      </MemoryRouter>
    </Theme>,
  );
}

describe("GroupDetailSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("グループ名と説明を表示する", async () => {
    vi.mocked(fetchGroup).mockResolvedValueOnce(mockGroup);
    vi.mocked(fetchGroupMembers).mockResolvedValueOnce(mockMembersResponse);

    renderSheet();

    await waitFor(() => {
      expect(screen.getByText("dev-team")).toBeInTheDocument();
    });
    expect(screen.getByText("Development team")).toBeInTheDocument();
    expect(screen.getByText("すべてのメンバー")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("2件")).toBeInTheDocument();
    });
  });

  it("グループ名と説明がヘッダーに表示される", async () => {
    vi.mocked(fetchGroup).mockResolvedValueOnce(mockGroup);
    vi.mocked(fetchGroupMembers).mockResolvedValueOnce(mockMembersResponse);

    renderSheet();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "dev-team" })).toBeInTheDocument();
    });

    expect(screen.getByText("Development team")).toBeInTheDocument();
  });

  it("メンバークリックを親へ伝播する", async () => {
    const user = userEvent.setup();
    const onMemberClick = vi.fn();

    vi.mocked(fetchGroup).mockResolvedValueOnce(mockGroup);
    vi.mocked(fetchGroupMembers).mockResolvedValueOnce(mockMembersResponse);

    renderSheet(onMemberClick);

    await waitFor(() => {
      expect(screen.getByText("Yamada Taro")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Yamada Taro"));

    expect(onMemberClick).toHaveBeenCalledTimes(1);
    expect(onMemberClick).toHaveBeenCalledWith({
      id: 1,
      uuid: "00000000-0000-0000-0000-000000000001",
      first_name: "Taro",
      last_name: "Yamada",
      source_groups: [{ group_id: 1, group_name: "dev-team" }],
    });
  });

  it("再マウント時はグループローディングが発生する（キャッシュなし）", async () => {
    vi.mocked(fetchGroup)
      .mockResolvedValueOnce(mockGroup)
      .mockReturnValueOnce(new Promise(() => {}));
    vi.mocked(fetchGroupMembers)
      .mockResolvedValueOnce(mockMembersResponse)
      .mockReturnValueOnce(new Promise(() => {}));

    const { unmount } = renderSheet();

    await waitFor(() => {
      expect(screen.getByText("Yamada Taro")).toBeInTheDocument();
    });

    unmount();

    renderSheet();

    // キャッシュが無いため再マウント時はグループローディングが発生する
    expect(screen.getByText("loading group...")).toBeInTheDocument();
  });
});
