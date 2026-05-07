import type { GroupDetail } from "@/entities/group";
import { Theme } from "@radix-ui/themes";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type * as ReactRouter from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchGroupMembers } from "@/pages/group-detail/api/fetch-group-members";
import { GroupDetailContent } from "@/pages/group-detail/ui/GroupDetailContent";

vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof ReactRouter>();
  return {
    ...actual,
    useNavigate: vi.fn(() => vi.fn()),
  };
});

vi.mock("@/shared/lib/sheet-stack", () => ({
  useSheetStack: vi.fn(() => ({
    openSheet: vi.fn(),
    closeSheet: vi.fn(),
    sheets: [],
    removeSheet: vi.fn(),
    closeAll: vi.fn(),
  })),
}));

vi.mock("@/pages/group-detail/model/useGroupDetail", () => ({
  useGroupDetail: vi.fn(),
}));

vi.mock("@/pages/group-detail/api/fetch-group-members", () => ({
  fetchGroupMembers: vi.fn(),
}));

vi.mock("@/pages/group-detail/model/useMemberList", () => ({
  useMemberList: vi.fn(() => ({
    members: [],
    directMembers: [],
    directMemberCount: 0,
    total: 0,
    duplicateCount: 0,
    searchQuery: "",
    error: null,
    isLoading: false,
    isFetchingMore: false,
    fetchMoreError: null,
    sentinelRef: { current: null },
    setSearchQuery: vi.fn(),
    refetch: vi.fn(),
  })),
}));

vi.mock("@/pages/group-detail/ui/AddMemberSheet", () => ({
  AddMemberSheet: vi.fn(() => null),
}));

vi.mock("@/pages/group-detail/ui/SubgroupManagementSheet", () => ({
  SubgroupManagementSheet: vi.fn(() => null),
}));

const mockGroup: GroupDetail = {
  id: 1,
  name: "dev-team",
  description: "Development team",
  member_count: 3,
  subgroups: [],
};

describe("GroupDetailContent", () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    const { useGroupDetail } = await import("@/pages/group-detail/model/useGroupDetail");
    vi.mocked(useGroupDetail).mockReturnValue({
      group: mockGroup,
      error: null,
      isLoading: false,
      refetch: vi.fn(),
      subgroups: [],
    });

    vi.mocked(fetchGroupMembers).mockResolvedValue({
      members: [],
      total: 0,
      duplicate_count: 0,
    });
  });

  it("スプリットビュー要素が存在せず縦1列レイアウトになっている", async () => {
    render(
      <Theme>
        <GroupDetailContent groupId={1} />
      </Theme>,
    );

    await waitFor(() => {
      expect(screen.getByText("dev-team")).toBeInTheDocument();
    });

    expect(document.querySelector("[data-testid='splitViewWrapper']")).not.toBeInTheDocument();
    expect(document.querySelector("[data-testid='splitViewLeft']")).not.toBeInTheDocument();
    expect(document.querySelector("[data-testid='splitViewRight']")).not.toBeInTheDocument();
  });

  it("Delete ボタンクリックで確認ダイアログが開く", async () => {
    const user = userEvent.setup();

    render(
      <Theme>
        <GroupDetailContent groupId={1} />
      </Theme>,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
    });

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });
  });

  it("「メンバー追加」ボタン押下で AddMemberSheet が表示される", async () => {
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

    render(
      <Theme>
        <GroupDetailContent groupId={1} />
      </Theme>,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "メンバー追加" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "メンバー追加" }));

    expect(mockOpenSheet).toHaveBeenCalledOnce();
    expect(mockOpenSheet).toHaveBeenCalledWith(expect.objectContaining({ id: "add-member-1" }));
  });

  it("「サブグループ管理」ボタン押下で SubgroupManagementSheet が openSheet で開かれる", async () => {
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

    render(
      <Theme>
        <GroupDetailContent groupId={1} />
      </Theme>,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "サブグループ管理" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "サブグループ管理" }));

    expect(mockOpenSheet).toHaveBeenCalledOnce();
    expect(mockOpenSheet).toHaveBeenCalledWith(
      expect.objectContaining({ id: "subgroup-management-1" }),
    );
  });

  it("subgroups が非空のとき SubgroupFilterChips にチップが表示される", async () => {
    const { useGroupDetail } = await import("@/pages/group-detail/model/useGroupDetail");
    vi.mocked(useGroupDetail).mockReturnValue({
      group: {
        ...mockGroup,
        subgroups: [{ id: 2, name: "Sub Group", description: "desc", member_count: 1 }],
      },
      error: null,
      isLoading: false,
      refetch: vi.fn(),
      subgroups: [{ id: 2, name: "Sub Group", description: "desc", member_count: 1 }],
    });

    render(
      <Theme>
        <GroupDetailContent groupId={1} />
      </Theme>,
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Sub Group")).toBeInTheDocument();
    });
  });

  it("subgroups が全選択状態のとき membersTitle が「すべてのメンバー」になる", async () => {
    const { useGroupDetail } = await import("@/pages/group-detail/model/useGroupDetail");
    vi.mocked(useGroupDetail).mockReturnValue({
      group: {
        ...mockGroup,
        subgroups: [
          { id: 2, name: "Sub A", description: "", member_count: 1 },
          { id: 3, name: "Sub B", description: "", member_count: 2 },
        ],
      },
      error: null,
      isLoading: false,
      refetch: vi.fn(),
      subgroups: [
        { id: 2, name: "Sub A", description: "", member_count: 1 },
        { id: 3, name: "Sub B", description: "", member_count: 2 },
      ],
    });

    render(
      <Theme>
        <GroupDetailContent groupId={1} />
      </Theme>,
    );

    await waitFor(() => {
      expect(screen.getByText("すべてのメンバー")).toBeInTheDocument();
    });
  });

  it("subgroups が空のとき membersTitle が「すべてのメンバー」になる", async () => {
    render(
      <Theme>
        <GroupDetailContent groupId={1} />
      </Theme>,
    );

    await waitFor(() => {
      expect(screen.getByText("すべてのメンバー")).toBeInTheDocument();
    });
  });

  it("useMemberList の total が確定すると apiTotal として件数に反映される", async () => {
    const { useMemberList } = await import("@/pages/group-detail/model/useMemberList");
    vi.mocked(useMemberList).mockReturnValue({
      members: [],
      directMembers: [],
      directMemberCount: 0,
      total: 42,
      duplicateCount: 0,
      searchQuery: "",
      error: null,
      isLoading: false,
      isFetchingMore: false,
      fetchMoreError: null,
      sentinelRef: { current: null },
      setSearchQuery: vi.fn(),
      refetch: vi.fn(),
    });

    render(
      <Theme>
        <GroupDetailContent groupId={1} />
      </Theme>,
    );

    // useMemberList の total が MemberList 経由で onTotalChange に伝播し 42件 と表示される
    await waitFor(() => {
      expect(screen.getByText("42件")).toBeInTheDocument();
    });
  });

  it("useMemberList の duplicateCount > 0 のとき重複件数が表示される", async () => {
    const { useMemberList } = await import("@/pages/group-detail/model/useMemberList");
    vi.mocked(useMemberList).mockReturnValue({
      members: [],
      directMembers: [],
      directMemberCount: 0,
      total: 10,
      duplicateCount: 3,
      searchQuery: "",
      error: null,
      isLoading: false,
      isFetchingMore: false,
      fetchMoreError: null,
      sentinelRef: { current: null },
      setSearchQuery: vi.fn(),
      refetch: vi.fn(),
    });

    render(
      <Theme>
        <GroupDetailContent groupId={1} />
      </Theme>,
    );

    await waitFor(() => {
      expect(screen.getByText("重複 3件")).toBeInTheDocument();
    });
  });

  it("AddMemberSheet open 中は useGroupDetail が enabled:false で呼ばれ、close 後に enabled:true に戻る", async () => {
    const user = userEvent.setup();

    const { useSheetStack } = await import("@/shared/lib/sheet-stack");
    const mockCloseSheet = vi.fn();
    const mockOpenSheet = vi.fn();
    vi.mocked(useSheetStack).mockReturnValue({
      openSheet: mockOpenSheet,
      closeSheet: mockCloseSheet,
      sheets: [],
      removeSheet: vi.fn(),
      closeAll: vi.fn(),
    });

    const { useGroupDetail } = await import("@/pages/group-detail/model/useGroupDetail");
    vi.mocked(useGroupDetail).mockReturnValue({
      group: mockGroup,
      error: null,
      isLoading: false,
      refetch: vi.fn(),
      subgroups: [],
    });

    render(
      <Theme>
        <GroupDetailContent groupId={1} />
      </Theme>,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "メンバー追加" })).toBeInTheDocument();
    });

    // 初期状態では enabled:true
    expect(vi.mocked(useGroupDetail)).toHaveBeenLastCalledWith(
      1,
      expect.objectContaining({ enabled: true }),
    );

    await user.click(screen.getByRole("button", { name: "メンバー追加" }));

    expect(mockOpenSheet).toHaveBeenCalledOnce();

    // シート open 後は enabled:false になる
    await waitFor(() => {
      expect(vi.mocked(useGroupDetail)).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ enabled: false }),
      );
    });

    const openSheetArg = mockOpenSheet.mock.calls[0]?.[0] as {
      id: string;
      onClose: () => void;
    };
    expect(openSheetArg.id).toBe("add-member-1");
    expect(typeof openSheetArg.onClose).toBe("function");

    // onClose を呼んで enabled が true に戻ることを確認
    act(() => {
      openSheetArg.onClose();
    });

    await waitFor(() => {
      expect(vi.mocked(useGroupDetail)).toHaveBeenLastCalledWith(
        1,
        expect.objectContaining({ enabled: true }),
      );
    });
  });
});

describe("GroupDetailContent - debounce fetch (サブグループ ON/OFF 時の fetch 重複バグ修正)", () => {
  const subgroups = [{ id: 2, name: "Sub A", description: "", member_count: 5 }];

  beforeEach(async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.clearAllMocks();

    const { useGroupDetail } = await import("@/pages/group-detail/model/useGroupDetail");
    vi.mocked(useGroupDetail).mockReturnValue({
      group: {
        id: 1,
        name: "dev-team",
        description: "",
        member_count: 3,
        subgroups,
      },
      error: null,
      isLoading: false,
      refetch: vi.fn(),
      subgroups,
    });

    vi.mocked(fetchGroupMembers).mockResolvedValue({
      members: [],
      total: 0,
      duplicate_count: 0,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("サブグループチップ OFF 操作直後は useMemberList に渡る excludeGroupIds が変化せず、300ms 後に変化する", async () => {
    // RED: 実装前はチップ OFF 直後に excludeGroupIds が即座に変化して fetch が走るため失敗する
    const { useMemberList } = await import("@/pages/group-detail/model/useMemberList");

    render(
      <Theme>
        <GroupDetailContent groupId={1} />
      </Theme>,
    );

    const chip = screen.getByRole("button", { name: "Sub A" });

    // 初期状態: excludeGroupIds は [] (全選択)
    const callCountBefore = vi.mocked(useMemberList).mock.calls.length;
    const lastCallBefore = vi.mocked(useMemberList).mock.calls[callCountBefore - 1];
    expect(lastCallBefore?.[1]).toEqual([]);

    // チップをクリック（OFF）
    act(() => {
      fireEvent.click(chip);
    });

    // チップ OFF 直後: debouncedExcludeGroupIds はまだ更新されていないので
    // useMemberList には引き続き [] が渡る（fetch は走らない）
    const callCountAfterClick = vi.mocked(useMemberList).mock.calls.length;
    const lastCallAfterClick = vi.mocked(useMemberList).mock.calls[callCountAfterClick - 1];
    expect(lastCallAfterClick?.[1]).toEqual([]);

    // 300ms 経過後: debouncedExcludeGroupIds が更新され excludeGroupIds=[2] で useMemberList が呼ばれる
    act(() => {
      vi.advanceTimersByTime(300);
    });

    const callCountAfterDebounce = vi.mocked(useMemberList).mock.calls.length;
    const lastCallAfterDebounce = vi.mocked(useMemberList).mock.calls[callCountAfterDebounce - 1];
    expect(lastCallAfterDebounce?.[1]).toContain(2);
  });

  it("デバウンス中（< 300ms）は useMemberList に渡る excludeGroupIds が変化しない", async () => {
    const { useMemberList } = await import("@/pages/group-detail/model/useMemberList");

    render(
      <Theme>
        <GroupDetailContent groupId={1} />
      </Theme>,
    );

    const chip = screen.getByRole("button", { name: "Sub A" });

    act(() => {
      fireEvent.click(chip);
    });

    // 299ms 経過 → excludeGroupIds はまだ [] のまま
    act(() => {
      vi.advanceTimersByTime(299);
    });

    const callCountAfter = vi.mocked(useMemberList).mock.calls.length;
    const lastCall = vi.mocked(useMemberList).mock.calls[callCountAfter - 1];
    expect(lastCall?.[1]).toEqual([]);
  });

  it("連続チェック切替時、最後の操作から 300ms 後に 1 回だけ excludeGroupIds が更新される", async () => {
    const { useMemberList } = await import("@/pages/group-detail/model/useMemberList");

    render(
      <Theme>
        <GroupDetailContent groupId={1} />
      </Theme>,
    );

    const chip = screen.getByRole("button", { name: "Sub A" });

    // 1回目クリック（OFF: subgroup 2 を除外）
    act(() => {
      fireEvent.click(chip);
    });

    // 200ms 経過（まだ 300ms 未達）
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // excludeGroupIds はまだ [] のまま
    const callCountMid = vi.mocked(useMemberList).mock.calls.length;
    const lastCallMid = vi.mocked(useMemberList).mock.calls[callCountMid - 1];
    expect(lastCallMid?.[1]).toEqual([]);

    // 2回目クリック（ON: subgroup 2 を再選択）→ デバウンスリセット
    act(() => {
      fireEvent.click(chip);
    });

    // さらに 200ms 経過（2回目から 200ms → まだ未達）
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // 2回目クリック後の状態（選択済み）では excludeGroupIds は [] のまま変わらない
    const callCountAfterSecond = vi.mocked(useMemberList).mock.calls.length;
    const lastCallAfterSecond = vi.mocked(useMemberList).mock.calls[callCountAfterSecond - 1];
    expect(lastCallAfterSecond?.[1]).toEqual([]);

    // さらに 100ms 経過（2回目から 300ms 到達）
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // debounce 完了後: ON 状態なので excludeGroupIds は [] のまま
    const callCountFinal = vi.mocked(useMemberList).mock.calls.length;
    const lastCallFinal = vi.mocked(useMemberList).mock.calls[callCountFinal - 1];
    expect(lastCallFinal?.[1]).toEqual([]);
  });

  it("フィルター変化直後は apiTotal がリセットされ memberCount にフォールバックする", async () => {
    const { useMemberList } = await import("@/pages/group-detail/model/useMemberList");
    vi.mocked(useMemberList).mockReturnValue({
      members: [],
      directMembers: [],
      directMemberCount: 0,
      total: 99,
      duplicateCount: 0,
      searchQuery: "",
      error: null,
      isLoading: false,
      isFetchingMore: false,
      fetchMoreError: null,
      sentinelRef: { current: null },
      setSearchQuery: vi.fn(),
      refetch: vi.fn(),
    });

    render(
      <Theme>
        <GroupDetailContent groupId={1} />
      </Theme>,
    );

    // apiTotal が 99件 として表示されている（useMemberList から onTotalChange 経由で設定される）
    expect(screen.getByText("99件")).toBeInTheDocument();

    const chip = screen.getByRole("button", { name: "Sub A" });

    // サブグループチップをクリック（フィルター変化）
    act(() => {
      fireEvent.click(chip);
    });

    // デバウンス完了前: apiTotal がリセットされ memberCount (group.member_count=3) にフォールバック
    // group.member_count=3 で subgroups が全除外なので memberCount = 3
    expect(screen.queryByText("99件")).not.toBeInTheDocument();

    // デバウンス完了
    act(() => {
      vi.advanceTimersByTime(300);
    });
  });

  it("フィルター変化直後は duplicateCount が 0 にリセットされる", async () => {
    const { useMemberList } = await import("@/pages/group-detail/model/useMemberList");
    vi.mocked(useMemberList).mockReturnValue({
      members: [],
      directMembers: [],
      directMemberCount: 0,
      total: 10,
      duplicateCount: 5,
      searchQuery: "",
      error: null,
      isLoading: false,
      isFetchingMore: false,
      fetchMoreError: null,
      sentinelRef: { current: null },
      setSearchQuery: vi.fn(),
      refetch: vi.fn(),
    });

    render(
      <Theme>
        <GroupDetailContent groupId={1} />
      </Theme>,
    );

    // duplicateCount 5 が表示されている
    expect(screen.getByText("重複 5件")).toBeInTheDocument();

    const chip = screen.getByRole("button", { name: "Sub A" });

    // サブグループチップをクリック（フィルター変化）
    act(() => {
      fireEvent.click(chip);
    });

    // デバウンス完了前: duplicateCount がリセットされて重複表示が消える
    expect(screen.queryByText("重複 5件")).not.toBeInTheDocument();

    // デバウンス完了
    act(() => {
      vi.advanceTimersByTime(300);
    });
  });
});

describe("GroupDetailContent - excludeDirectMembers", () => {
  const subgroups = [{ id: 2, name: "Sub A", description: "", member_count: 5 }];

  beforeEach(async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.clearAllMocks();

    const { useGroupDetail } = await import("@/pages/group-detail/model/useGroupDetail");
    vi.mocked(useGroupDetail).mockReturnValue({
      group: {
        id: 1,
        name: "dev-team",
        description: "",
        member_count: 3,
        subgroups,
      },
      error: null,
      isLoading: false,
      refetch: vi.fn(),
      subgroups,
    });

    vi.mocked(fetchGroupMembers).mockResolvedValue({
      members: [],
      total: 0,
      duplicate_count: 0,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("MemberList に excludeDirectMembers=false と onExcludeDirectMembersChange が渡される", async () => {
    const { useMemberList } = await import("@/pages/group-detail/model/useMemberList");

    render(
      <Theme>
        <GroupDetailContent groupId={1} />
      </Theme>,
    );

    await waitFor(() => {
      expect(screen.getByText("dev-team")).toBeInTheDocument();
    });

    // useMemberList が呼ばれたとき excludeGroupIds に groupId(1) が含まれていないことを確認
    // (excludeDirectMembers=false の初期状態)
    const callArgs = vi.mocked(useMemberList).mock.calls;
    const lastCall = callArgs[callArgs.length - 1];
    // [0] = groupId, [1] = excludeGroupIds
    expect(lastCall?.[0]).toBe(1);
    const excludeGroupIds = lastCall?.[1] ?? [];
    expect(excludeGroupIds).not.toContain(1);
  });

  it("「自グループを除外」チェックボックスをクリックすると excludeGroupIds に親 ID(1) が含まれる", async () => {
    const { useMemberList } = await import("@/pages/group-detail/model/useMemberList");

    render(
      <Theme>
        <GroupDetailContent groupId={1} />
      </Theme>,
    );

    await waitFor(() => {
      expect(screen.getByText("dev-team")).toBeInTheDocument();
    });

    // 「自グループを除外」チェックボックスを探してクリック
    const excludeCheckbox = screen.getByLabelText("自グループを除外");
    act(() => {
      fireEvent.click(excludeCheckbox);
    });

    // 300ms 経過後に excludeGroupIds が更新される
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // useMemberList の最後の呼び出しで excludeGroupIds に groupId(1) が含まれることを確認
    const callArgs = vi.mocked(useMemberList).mock.calls;
    const lastCall = callArgs[callArgs.length - 1];
    const excludeGroupIds = lastCall?.[1] ?? [];
    expect(excludeGroupIds).toContain(1);
  });
});

describe("GroupDetailContent - subgroups 再フェッチ時の全リセット", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(fetchGroupMembers).mockResolvedValue({
      members: [],
      total: 0,
      duplicate_count: 0,
    });
  });

  it("subgroups の ID セットが変化したとき selectedSubgroupIds が全リセットされる", async () => {
    const { useGroupDetail } = await import("@/pages/group-detail/model/useGroupDetail");
    const initialSubgroups = [{ id: 2, name: "Sub A", description: "", member_count: 5 }];

    vi.mocked(useGroupDetail).mockReturnValue({
      group: {
        id: 1,
        name: "dev-team",
        description: "",
        member_count: 3,
        subgroups: initialSubgroups,
      },
      error: null,
      isLoading: false,
      refetch: vi.fn(),
      subgroups: initialSubgroups,
    });

    const { rerender } = render(
      <Theme>
        <GroupDetailContent groupId={1} />
      </Theme>,
    );

    await waitFor(() => {
      expect(screen.getByText("dev-team")).toBeInTheDocument();
    });

    // subgroups に新しい ID を追加して rerender
    const newSubgroups = [
      { id: 2, name: "Sub A", description: "", member_count: 5 },
      { id: 3, name: "Sub B", description: "", member_count: 2 },
    ];
    vi.mocked(useGroupDetail).mockReturnValue({
      group: {
        id: 1,
        name: "dev-team",
        description: "",
        member_count: 3,
        subgroups: newSubgroups,
      },
      error: null,
      isLoading: false,
      refetch: vi.fn(),
      subgroups: newSubgroups,
    });

    rerender(
      <Theme>
        <GroupDetailContent groupId={1} />
      </Theme>,
    );

    // 新しいサブグループチップが両方表示されることで全リセットが確認できる
    await waitFor(() => {
      expect(screen.getByLabelText("Sub A")).toBeInTheDocument();
      expect(screen.getByLabelText("Sub B")).toBeInTheDocument();
    });

    // SubgroupFilterChips に selectedSubgroupIds が全選択で渡されているか確認
    // (チップが active/checked 状態であることでわかる)
    const { useMemberList } = await import("@/pages/group-detail/model/useMemberList");
    const callArgs = vi.mocked(useMemberList).mock.calls;
    const lastCall = callArgs[callArgs.length - 1];
    const excludeGroupIds = lastCall?.[1] ?? [];
    // 全リセット後: excludeGroupIds は空（全サブグループが選択されているため除外なし）
    expect(excludeGroupIds).not.toContain(2);
    expect(excludeGroupIds).not.toContain(3);
  });

  it("subgroups の同じ ID セットで参照だけ変わった場合は selectedSubgroupIds はリセットされない", async () => {
    const { useGroupDetail } = await import("@/pages/group-detail/model/useGroupDetail");
    const subgroups = [
      { id: 2, name: "Sub A", description: "", member_count: 5 },
      { id: 3, name: "Sub B", description: "", member_count: 2 },
    ];

    vi.mocked(useGroupDetail).mockReturnValue({
      group: {
        id: 1,
        name: "dev-team",
        description: "",
        member_count: 3,
        subgroups,
      },
      error: null,
      isLoading: false,
      refetch: vi.fn(),
      subgroups,
    });

    const { rerender } = render(
      <Theme>
        <GroupDetailContent groupId={1} />
      </Theme>,
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Sub A")).toBeInTheDocument();
    });

    // Sub A チップをクリックして unchecked にする（選択解除）
    const chipA = screen.getByRole("button", { name: "Sub A" });
    act(() => {
      fireEvent.click(chipA);
    });

    // Sub A チップが OFF になっていることを確認（aria-pressed=false）
    expect(screen.getByRole("button", { name: "Sub A" })).toHaveAttribute("aria-pressed", "false");

    // 同じ ID の新しい配列参照で rerender（ID セットは変わらない）
    const sameIdsDifferentRef = [
      { id: 2, name: "Sub A", description: "", member_count: 5 },
      { id: 3, name: "Sub B", description: "", member_count: 2 },
    ];
    vi.mocked(useGroupDetail).mockReturnValue({
      group: {
        id: 1,
        name: "dev-team",
        description: "",
        member_count: 3,
        subgroups: sameIdsDifferentRef,
      },
      error: null,
      isLoading: false,
      refetch: vi.fn(),
      subgroups: sameIdsDifferentRef,
    });

    rerender(
      <Theme>
        <GroupDetailContent groupId={1} />
      </Theme>,
    );

    // ID セットが変わっていないので selectedSubgroupIds はリセットされない
    // rerender 後も Sub A チップは OFF のまま（aria-pressed=false）
    expect(screen.getByRole("button", { name: "Sub A" })).toHaveAttribute("aria-pressed", "false");
    // Sub B は選択されたまま（aria-pressed=true）
    expect(screen.getByRole("button", { name: "Sub B" })).toHaveAttribute("aria-pressed", "true");
  });
});

describe("GroupDetailContent - 初回マウント時 useMemberList の exclude_group_ids", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(fetchGroupMembers).mockResolvedValue({
      members: [],
      total: 0,
      duplicate_count: 0,
    });
  });

  it("subgroups 付きのグループが初期状態で提供されるとき useMemberList は exclude_group_ids 空で呼ばれる", async () => {
    // このテストはバグ修正を検証する:
    // 修正前: subgroups=[{id:28},{id:29}] が最初から提供されるとき
    //         selectedSubgroupIds が初期化される前に useMemberList(30, [28,29]) が呼ばれていた
    // 修正後: render 中 setState により selectedSubgroupIds が同期初期化され
    //         useMemberList(30, []) として呼ばれる（exclude なし）
    const { useMemberList } = await import("@/pages/group-detail/model/useMemberList");

    const subgroups = [
      { id: 28, name: "Sub A", description: "", member_count: 5 },
      { id: 29, name: "Sub B", description: "", member_count: 3 },
    ];

    const { useGroupDetail } = await import("@/pages/group-detail/model/useGroupDetail");
    vi.mocked(useGroupDetail).mockReturnValue({
      group: {
        id: 30,
        name: "dev-team",
        description: "",
        member_count: 2,
        subgroups,
      },
      error: null,
      isLoading: false,
      refetch: vi.fn(),
      subgroups,
    });

    render(
      <Theme>
        <GroupDetailContent groupId={30} />
      </Theme>,
    );

    // useMemberList の最初の呼び出しで excludeGroupIds が空配列であること
    // (バグがある場合は [28, 29] が渡される)
    const callArgs = vi.mocked(useMemberList).mock.calls;
    const firstCall = callArgs[0];
    expect(firstCall?.[0]).toBe(30);
    const excludeGroupIds = firstCall?.[1] ?? [];
    expect(excludeGroupIds).not.toContain(28);
    expect(excludeGroupIds).not.toContain(29);
  });
});
