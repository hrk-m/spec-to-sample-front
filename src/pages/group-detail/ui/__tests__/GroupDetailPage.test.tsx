import type { GroupDetail } from "@/entities/group";
import { Theme } from "@radix-ui/themes";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchGroup } from "@/pages/group-detail/api/fetch-group";
import { fetchGroupMembers } from "@/pages/group-detail/api/fetch-group-members";
import type { MembersResponse } from "@/pages/group-detail/model/members-response";
import { GroupDetailPage } from "@/pages/group-detail/ui/GroupDetailPage";
import { SheetStackProvider } from "@/shared/lib/sheet-stack";

vi.mock("@/pages/group-detail/api/fetch-group", () => ({
  fetchGroup: vi.fn(),
}));

vi.mock("@/pages/group-detail/api/fetch-group-members", () => ({
  fetchGroupMembers: vi.fn(),
}));

const mockGroup: GroupDetail = {
  id: 1,
  name: "dev-team",
  description: "Development team",
  member_count: 5,
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

function renderWithRouter(groupId = "1") {
  return render(
    <Theme>
      <SheetStackProvider>
        <MemoryRouter initialEntries={[`/groups/${groupId}`]}>
          <Routes>
            <Route path="/groups/:id" element={<GroupDetailPage />} />
            <Route path="/" element={<div>Home Page</div>} />
          </Routes>
        </MemoryRouter>
      </SheetStackProvider>
    </Theme>,
  );
}

describe("GroupDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ローディング中にスケルトンを表示する", () => {
    vi.mocked(fetchGroup).mockReturnValue(new Promise(() => {}));
    vi.mocked(fetchGroupMembers).mockReturnValue(new Promise(() => {}));

    renderWithRouter();

    expect(screen.getByText("Groups")).toBeInTheDocument();
  });

  it("グループ情報を表示する", async () => {
    vi.mocked(fetchGroup).mockResolvedValueOnce(mockGroup);
    vi.mocked(fetchGroupMembers).mockResolvedValueOnce(mockMembersResponse);

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText("dev-team")).toBeInTheDocument();
    });
    expect(screen.getByText("Development team")).toBeInTheDocument();
  });

  it("グループ名と説明がヘッダーに表示される", async () => {
    vi.mocked(fetchGroup).mockResolvedValueOnce(mockGroup);
    vi.mocked(fetchGroupMembers).mockResolvedValueOnce(mockMembersResponse);

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "dev-team" })).toBeInTheDocument();
    });
    expect(screen.getByText("Development team")).toBeInTheDocument();
  });

  it("API エラー時にエラーメッセージを表示する", async () => {
    vi.mocked(fetchGroup).mockRejectedValueOnce(new Error("404 Not Found"));
    vi.mocked(fetchGroupMembers).mockResolvedValueOnce(mockMembersResponse);

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText("Error: 404 Not Found")).toBeInTheDocument();
    });
  });

  it("戻るボタンクリックで / に遷移する", async () => {
    const user = userEvent.setup();
    vi.mocked(fetchGroup).mockResolvedValueOnce(mockGroup);
    vi.mocked(fetchGroupMembers).mockResolvedValueOnce(mockMembersResponse);

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText("dev-team")).toBeInTheDocument();
    });

    const backButton = screen.getByRole("button", { name: "Groups" });
    await user.click(backButton);

    await waitFor(() => {
      expect(screen.getByText("Home Page")).toBeInTheDocument();
    });
  });

  it("Members セクションヘッダーを表示する", async () => {
    vi.mocked(fetchGroup).mockResolvedValueOnce(mockGroup);
    vi.mocked(fetchGroupMembers).mockResolvedValueOnce(mockMembersResponse);

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText("すべてのメンバー")).toBeInTheDocument();
    });
    // API から返された重複除外済み total（2）が表示される（APIロード完了後）
    await waitFor(() => {
      expect(screen.getByText("2件")).toBeInTheDocument();
    });
  });

  it("メンバークリックで右シートにメンバー詳細を表示する", async () => {
    const user = userEvent.setup();

    vi.mocked(fetchGroup).mockResolvedValueOnce(mockGroup);
    vi.mocked(fetchGroupMembers).mockResolvedValueOnce(mockMembersResponse);

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText("Yamada Taro")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Yamada Taro"));

    await waitFor(() => {
      expect(screen.getByText("詳細は今後追加予定")).toBeInTheDocument();
    });
  });
});
