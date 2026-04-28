import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { addSubgroup } from "@/pages/group-detail/api/add-subgroup";
import { fetchGroupsForSheet } from "@/pages/group-detail/api/fetch-groups";
import { AddSubgroupSheet } from "@/pages/group-detail/ui/AddSubgroupSheet";

vi.mock("@/pages/group-detail/api/add-subgroup", () => ({
  addSubgroup: vi.fn(),
}));

vi.mock("@/pages/group-detail/api/fetch-groups", () => ({
  fetchGroupsForSheet: vi.fn(),
}));

const mockAddSubgroup = addSubgroup as ReturnType<typeof vi.fn>;
const mockFetchGroupsForSheet = fetchGroupsForSheet as ReturnType<typeof vi.fn>;

const mockOnClose = vi.fn();
const mockOnSuccess = vi.fn();

const sampleGroups = [
  { id: 2, name: "Group B", description: "desc b", member_count: 0 },
  { id: 3, name: "Group C", description: "desc c", member_count: 0 },
];

const sampleGroupsWithA = [
  { id: 10, name: "Group A", description: "desc a", member_count: 0 },
  { id: 20, name: "Group B", description: "desc b", member_count: 0 },
];

// デバウンスがあるため waitFor のタイムアウトを延長
const WAIT_OPTIONS = { timeout: 2000 };

describe("AddSubgroupSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchGroupsForSheet.mockResolvedValue({
      groups: sampleGroups,
      total: sampleGroups.length,
    });
  });

  // テスト #1: 正常系 — グループ選択 → 追加ボタン押下 → 201 成功 → onClose が呼ばれ refetch
  it("グループを選択して追加ボタンを押すと201成功後にonCloseが呼ばれリフレッシュされる", async () => {
    const user = userEvent.setup();
    mockAddSubgroup.mockResolvedValueOnce({
      parent_group_id: 1,
      child_group_id: 2,
    });

    render(
      <AddSubgroupSheet
        groupId={1}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        subgroups={[]}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Group B")).toBeInTheDocument();
    }, WAIT_OPTIONS);

    await user.click(screen.getByText("Group B"));
    await user.click(screen.getByRole("button", { name: "追加" }));

    await waitFor(() => {
      expect(addSubgroup).toHaveBeenCalledWith({ groupId: 1, childGroupId: 2 });
      expect(mockOnSuccess).toHaveBeenCalledOnce();
      expect(mockOnClose).toHaveBeenCalledOnce();
    }, WAIT_OPTIONS);
  });

  // テスト #2: 分岐条件 — グループ未選択時は追加ボタン disabled
  it("グループ未選択時は追加ボタンがdisabledである", async () => {
    render(
      <AddSubgroupSheet
        groupId={1}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        subgroups={[]}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Group B")).toBeInTheDocument();
    }, WAIT_OPTIONS);

    expect(screen.getByRole("button", { name: "追加" })).toBeDisabled();
  });

  // テスト #3: 分岐条件 — グループ選択後は追加ボタン enabled
  it("グループを選択すると追加ボタンがenabledになる", async () => {
    const user = userEvent.setup();

    render(
      <AddSubgroupSheet
        groupId={1}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        subgroups={[]}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Group B")).toBeInTheDocument();
    }, WAIT_OPTIONS);

    await user.click(screen.getByText("Group B"));

    expect(screen.getByRole("button", { name: "追加" })).not.toBeDisabled();
  });

  // テスト #4: 異常系 — POST API が 400 を返す → Sheet 内にエラーメッセージ
  it("APIが400を返すとSheet内にエラーメッセージが表示される", async () => {
    const user = userEvent.setup();
    mockAddSubgroup.mockRejectedValueOnce(new Error("400 Bad Request"));

    render(
      <AddSubgroupSheet
        groupId={1}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        subgroups={[]}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Group B")).toBeInTheDocument();
    }, WAIT_OPTIONS);

    await user.click(screen.getByText("Group B"));
    await user.click(screen.getByRole("button", { name: "追加" }));

    await waitFor(() => {
      expect(screen.getByText(/エラーが発生しました/)).toBeInTheDocument();
    }, WAIT_OPTIONS);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  // テスト #5: 異常系 — POST API が 409 を返す → 「すでに追加済みです」を表示
  it("APIが409を返すと「すでに追加済みです」が表示される", async () => {
    const user = userEvent.setup();
    mockAddSubgroup.mockRejectedValueOnce(new Error("409 Conflict"));

    render(
      <AddSubgroupSheet
        groupId={1}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        subgroups={[]}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Group B")).toBeInTheDocument();
    }, WAIT_OPTIONS);

    await user.click(screen.getByText("Group B"));
    await user.click(screen.getByRole("button", { name: "追加" }));

    await waitFor(() => {
      expect(screen.getByText("すでに追加済みです")).toBeInTheDocument();
    }, WAIT_OPTIONS);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  // テスト #6: 正常系 — Sheet 開封時に全件取得され "X groups" 件数が表示される
  it("Sheet開封時にfetchGroupsForSheetが呼ばれtotalが件数として表示される", async () => {
    mockFetchGroupsForSheet.mockResolvedValue({
      groups: sampleGroups,
      total: 2,
    });

    render(
      <AddSubgroupSheet
        groupId={1}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        subgroups={[]}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("2 groups")).toBeInTheDocument();
    }, WAIT_OPTIONS);

    expect(fetchGroupsForSheet).toHaveBeenCalledWith("");
  });

  // テスト #8: 分岐条件 — 検索結果が 0 件のとき "0 groups" が表示される
  it("検索結果が0件のとき0 groupsが表示される", async () => {
    mockFetchGroupsForSheet.mockResolvedValue({
      groups: [],
      total: 0,
    });

    render(
      <AddSubgroupSheet
        groupId={1}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        subgroups={[]}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("0 groups")).toBeInTheDocument();
    }, WAIT_OPTIONS);
  });

  // テスト #10: 異常系 — GET API がエラーを返す → Sheet 内にエラーメッセージ
  it("GET APIがエラーを返すとSheet内にエラーメッセージが表示される", async () => {
    mockFetchGroupsForSheet.mockRejectedValueOnce(new Error("500 Internal Server Error"));

    render(
      <AddSubgroupSheet
        groupId={1}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        subgroups={[]}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Error 500 Internal Server Error/)).toBeInTheDocument();
    }, WAIT_OPTIONS);
  });

  // テスト #11: 外部依存 — fetchGroupsForSheet はモックに差し替える（実際の HTTP 通信は発生しない）
  it("fetchGroupsForSheetはモックに差し替えられており実HTTP通信は発生しない", async () => {
    render(
      <AddSubgroupSheet
        groupId={1}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        subgroups={[]}
      />,
    );

    await waitFor(() => {
      expect(fetchGroupsForSheet).toHaveBeenCalled();
    }, WAIT_OPTIONS);

    expect(typeof mockFetchGroupsForSheet.mock).toBe("object");
  });

  // 既存テスト: subgroups に含まれるグループは選択リストから除外される
  it("subgroups に含まれるグループは選択リストに表示されない", async () => {
    mockFetchGroupsForSheet.mockResolvedValue({
      groups: sampleGroupsWithA,
      total: sampleGroupsWithA.length,
    });

    render(
      <AddSubgroupSheet
        groupId={1}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        subgroups={[{ id: 10, name: "Group A", description: "", member_count: 0 }]}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Group B")).toBeInTheDocument();
    }, WAIT_OPTIONS);

    expect(screen.queryByText("Group A")).not.toBeInTheDocument();
  });

  // テスト #7: 正常系 — キーワード入力後 300ms で q 付き API が呼ばれる（fake timers）
  it("キーワード入力後300msでfetchGroupsForSheetが検索キーワードで呼ばれる", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    try {
      vi.clearAllMocks();

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      const devGroups = [{ id: 5, name: "dev-group", description: "dev", member_count: 1 }];
      mockFetchGroupsForSheet.mockResolvedValueOnce({
        groups: sampleGroups,
        total: 2,
      });
      mockFetchGroupsForSheet.mockResolvedValueOnce({
        groups: devGroups,
        total: 1,
      });

      render(
        <AddSubgroupSheet
          groupId={1}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          subgroups={[]}
        />,
      );

      // 初回ロード（300ms デバウンス後）— async act で Promise 解決まで含めて待つ
      await act(async () => {
        vi.advanceTimersByTime(300);
        await Promise.resolve();
      });

      const searchInput = screen.getByPlaceholderText("Search by name or description");

      // userEvent.type で React の合成イベントを正しく発火させる
      await user.type(searchInput, "dev");

      // 300ms 経過前は初回の1回のみ
      expect(fetchGroupsForSheet).toHaveBeenCalledTimes(1);

      // 300ms 経過させる — async act で Promise 解決まで含めて待つ
      await act(async () => {
        vi.advanceTimersByTime(300);
        await Promise.resolve();
      });

      expect(fetchGroupsForSheet).toHaveBeenCalledWith("dev");
    } finally {
      vi.useRealTimers();
    }
  });

  // テスト #9: 分岐条件 — 検索フィールドをクリアすると q なしで全件取得される（fake timers）
  it("検索フィールドをクリアするとfetchGroupsForSheetが空文字で再呼び出しされる", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    try {
      vi.clearAllMocks();

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      mockFetchGroupsForSheet.mockResolvedValue({
        groups: sampleGroups,
        total: 2,
      });

      render(
        <AddSubgroupSheet
          groupId={1}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          subgroups={[]}
        />,
      );

      // 初回ロード
      await act(() => {
        vi.advanceTimersByTime(300);
      });

      const searchInput = screen.getByPlaceholderText("Search by name or description");

      // "dev" を入力して 300ms 経過
      await user.type(searchInput, "dev");
      await act(() => {
        vi.advanceTimersByTime(300);
      });

      // クリア（全選択してから Delete）
      await user.clear(searchInput);

      // 300ms 経過させる
      await act(() => {
        vi.advanceTimersByTime(300);
      });

      const calls = mockFetchGroupsForSheet.mock.calls as string[][];
      const lastCall = calls.at(-1);
      expect(lastCall).toBeDefined();
      expect(lastCall?.[0]).toBe("");
    } finally {
      vi.useRealTimers();
    }
  });
});
