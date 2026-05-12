import type { SubgroupSummary } from "@/entities/group";
import { Theme } from "@radix-ui/themes";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { deleteSubgroup } from "@/pages/group-detail/api/delete-subgroup";
import { SubgroupManagementSheet } from "@/pages/group-detail/ui/SubgroupManagementSheet";

const mockAddSubgroupSheet = vi.hoisted(() => vi.fn(() => null));

vi.mock("@/pages/group-detail/api/delete-subgroup", () => ({
  deleteSubgroup: vi.fn(),
}));

vi.mock("@/shared/lib/sheet-stack", () => ({
  useSheetStack: vi.fn(() => ({
    openSheet: vi.fn(),
    closeSheet: vi.fn(),
    sheets: [],
    removeSheet: vi.fn(),
    closeAll: vi.fn(),
  })),
}));

vi.mock("@/pages/group-detail/ui/AddSubgroupSheet", () => ({
  AddSubgroupSheet: mockAddSubgroupSheet,
}));

vi.mock("@/pages/group-detail/model/useSubgroups", () => ({
  useSubgroups: vi.fn(),
}));

const mockDeleteSubgroup = deleteSubgroup as ReturnType<typeof vi.fn>;

const sampleSubgroups: SubgroupSummary[] = [
  { id: 2, name: "Frontend Team", description: "Frontend engineers", member_count: 5 },
  { id: 3, name: "Backend Team", description: "Backend engineers", member_count: 3 },
];

function renderSheet() {
  return render(
    <Theme>
      <SubgroupManagementSheet groupId={1} groupName="Test Group" />
    </Theme>,
  );
}

describe("SubgroupManagementSheet", () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    const { useSubgroups } = await import("@/pages/group-detail/model/useSubgroups");
    vi.mocked(useSubgroups).mockReturnValue({
      refetch: vi.fn(),
      subgroups: sampleSubgroups,
    });
  });

  it("サブグループ一覧が表示される", () => {
    renderSheet();

    expect(screen.getByText("Frontend Team")).toBeInTheDocument();
    expect(screen.getByText("Backend Team")).toBeInTheDocument();
  });

  it("各サブグループのメンバー数が表示される", () => {
    renderSheet();

    expect(screen.getByText("5 members")).toBeInTheDocument();
    expect(screen.getByText("3 members")).toBeInTheDocument();
  });

  it("各サブグループに「削除」ボタンが表示される", () => {
    renderSheet();

    const deleteButtons = screen.getAllByRole("button", { name: "削除" });
    expect(deleteButtons).toHaveLength(2);
  });

  it("「＋ 追加」ボタンが表示される", () => {
    renderSheet();

    expect(screen.getByRole("button", { name: "＋ 追加" })).toBeInTheDocument();
  });

  it("サブグループが空の場合に空状態メッセージが表示される", async () => {
    const { useSubgroups } = await import("@/pages/group-detail/model/useSubgroups");
    vi.mocked(useSubgroups).mockReturnValue({
      refetch: vi.fn(),
      subgroups: [],
    });

    renderSheet();

    expect(screen.getByText("サブグループはまだありません")).toBeInTheDocument();
  });

  it("「削除」ボタンクリックで DeleteSubgroupDialog が開く", async () => {
    const user = userEvent.setup();
    renderSheet();

    const deleteButtons = screen.getAllByRole("button", { name: "削除" });
    const firstButton = deleteButtons[0];
    if (!firstButton) throw new Error("削除ボタンが見つかりません");
    await user.click(firstButton);

    await waitFor(() => {
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });
  });

  it("削除成功後に refetch が呼ばれる", async () => {
    const user = userEvent.setup();
    mockDeleteSubgroup.mockResolvedValueOnce(undefined);

    const { useSubgroups } = await import("@/pages/group-detail/model/useSubgroups");
    const mockRefetch = vi.fn();
    vi.mocked(useSubgroups).mockReturnValue({
      refetch: mockRefetch,
      subgroups: sampleSubgroups,
    });

    renderSheet();

    const deleteButtons = screen.getAllByRole("button", { name: "削除" });
    const firstButton = deleteButtons[0];
    if (!firstButton) throw new Error("削除ボタンが見つかりません");
    await user.click(firstButton);

    await waitFor(() => {
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole("button", { name: "Delete" });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalledOnce();
    });
  });

  it("「＋ 追加」ボタンクリックで openSheet が呼ばれる", async () => {
    const user = userEvent.setup();
    const { useSheetStack } = await import("@/shared/lib/sheet-stack");
    const mockOpenSheet = vi.fn();
    vi.mocked(useSheetStack).mockReturnValue({
      openSheet: mockOpenSheet,
      closeSheet: vi.fn(),
      sheets: [],
      removeSheet: vi.fn(),
      closeAll: vi.fn(),
    });

    renderSheet();

    await user.click(screen.getByRole("button", { name: "＋ 追加" }));

    expect(mockOpenSheet).toHaveBeenCalledOnce();
    expect(mockOpenSheet).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.stringMatching(/^add-subgroup-from-management-1-\d+$/),
      }),
    );
  });

  it("AddSubgroupSheet に useSubgroups の subgroups を props で渡す", async () => {
    const user = userEvent.setup();

    const { useSheetStack } = await import("@/shared/lib/sheet-stack");
    const mockOpenSheet = vi.fn();
    vi.mocked(useSheetStack).mockReturnValue({
      openSheet: mockOpenSheet,
      closeSheet: vi.fn(),
      sheets: [],
      removeSheet: vi.fn(),
      closeAll: vi.fn(),
    });

    renderSheet();

    await user.click(screen.getByRole("button", { name: "＋ 追加" }));

    expect(mockOpenSheet).toHaveBeenCalledOnce();

    const openSheetArg = mockOpenSheet.mock.calls[0]?.[0] as {
      id: string;
      content: { props: { subgroups: SubgroupSummary[] } };
    };
    expect(openSheetArg.content.props.subgroups).toEqual(sampleSubgroups);
  });

  it("「＋ 追加」ボタンクリックで AddSubgroupSheet の onClose コールバック経由で refetch が呼ばれる", async () => {
    const user = userEvent.setup();

    const { useSubgroups } = await import("@/pages/group-detail/model/useSubgroups");
    const mockRefetch = vi.fn();
    vi.mocked(useSubgroups).mockReturnValue({
      refetch: mockRefetch,
      subgroups: sampleSubgroups,
    });

    const { useSheetStack } = await import("@/shared/lib/sheet-stack");
    const mockOpenSheet = vi.fn();
    vi.mocked(useSheetStack).mockReturnValue({
      openSheet: mockOpenSheet,
      closeSheet: vi.fn(),
      sheets: [],
      removeSheet: vi.fn(),
      closeAll: vi.fn(),
    });

    renderSheet();

    await user.click(screen.getByRole("button", { name: "＋ 追加" }));

    // openSheet が呼ばれ、content として AddSubgroupSheet が渡されること
    expect(mockOpenSheet).toHaveBeenCalledOnce();

    // openSheet に渡された content の props から onClose コールバックを取り出して手動で呼び出す
    const openSheetArg = mockOpenSheet.mock.calls[0]?.[0] as {
      id: string;
      content: { props: { onClose: () => void } };
    };
    expect(openSheetArg.id).toMatch(/^add-subgroup-from-management-1-\d+$/);

    // AddSubgroupSheet の onClose コールバックを直接呼び出してシミュレート（成功時も close 経由で refetch）
    openSheetArg.content.props.onClose();

    // 自分の refetch のみが呼ばれる
    expect(mockRefetch).toHaveBeenCalledOnce();
  });
});
