/**
 * GroupDetailContent - fetchGroupMembers 呼び出し回数の結合テスト
 *
 * このファイルでは useMemberList をモックしない。
 * fetchGroupMembers をスパイして呼び出し回数・引数を直接アサートする。
 *
 * 注意: shouldAdvanceTime: true を使うと実際のテスト実行時間が偽タイマーに加算されるため、
 * このテストファイルでは vi.useFakeTimers()（shouldAdvanceTime: false がデフォルト）を使う。
 * vi.advanceTimersByTime と await Promise.resolve() の組み合わせで同期・非同期をコントロールする。
 */
import { MockIntersectionObserver } from "@/test/setup";
import { Theme } from "@radix-ui/themes";
import { act, fireEvent, render, screen } from "@testing-library/react";
import type * as ReactRouter from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GroupDetailContent } from "@/pages/group-detail/ui/GroupDetailContent";

// useMemberList はモックしない（fetchGroupMembers まで到達させるため）
// 代わりに fetchGroupMembers をスパイ付きでモックする
const mockFetchGroupMembers = vi.hoisted(() => vi.fn());

vi.mock("@/pages/group-detail/api/fetch-group-members", () => ({
  fetchGroupMembers: mockFetchGroupMembers,
}));

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

vi.mock("@/pages/group-detail/ui/AddMemberSheet", () => ({
  AddMemberSheet: vi.fn(() => null),
}));

vi.mock("@/pages/group-detail/ui/SubgroupManagementSheet", () => ({
  SubgroupManagementSheet: vi.fn(() => null),
}));

const subgroups = [{ id: 2, name: "Sub A", description: "", member_count: 5 }];

describe("GroupDetailContent - fetchGroupMembers 直接スパイ（useMemberList 経由）", () => {
  beforeEach(async () => {
    // shouldAdvanceTime: false（デフォルト）を明示: 実際のテスト実行時間を偽タイマーに加算しない
    vi.useFakeTimers();
    vi.clearAllMocks();
    MockIntersectionObserver.reset();

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

    mockFetchGroupMembers.mockResolvedValue({
      members: [],
      total: 0,
      duplicate_count: 0,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("サブグループチップ OFF → 299ms では fetchGroupMembers が追加で呼ばれず、300ms で 1 回だけ追加で呼ばれる", async () => {
    render(
      <Theme>
        <GroupDetailContent groupId={1} />
      </Theme>,
    );

    // 初回マウント後の fetch が完了するまで待つ（タイマーを進めて非同期処理を完了させる）
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(screen.getByText("dev-team")).toBeInTheDocument();

    // 初回マウント時の fetchGroupMembers 呼び出し回数を記録
    const callCountBeforeChip = mockFetchGroupMembers.mock.calls.length;
    // 初回は exclude_group_ids なし（undefined）で呼ばれる
    const initialCall = mockFetchGroupMembers.mock.calls[callCountBeforeChip - 1]?.[0];
    expect(initialCall?.groupId).toBe(1);
    expect(initialCall?.exclude_group_ids).toBeUndefined();

    // チップ OFF クリック（Sub A を除外へ）
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Sub A" }));
    });
    // 非同期処理の flush
    await act(async () => {
      await Promise.resolve();
    });

    // チップ OFF 直後から 299ms 経過: GroupDetailContent の debounce 未完了
    // debouncedExcludeGroupIds は [] のまま → fetchGroupMembers は追加で呼ばれない
    act(() => {
      vi.advanceTimersByTime(299);
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(mockFetchGroupMembers.mock.calls.length).toBe(callCountBeforeChip);

    // さらに 1ms（合計 300ms）: GroupDetailContent の debounce が完了
    // debouncedExcludeGroupIds が [2] に更新 → cacheKey 変化 → doFetch がトリガーされる
    act(() => {
      vi.advanceTimersByTime(1);
    });
    // doFetch の非同期処理（mockFetchGroupMembers の Promise 解決）を flush する
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    // チップ OFF から 300ms 後に 1 回だけ追加で fetchGroupMembers が呼ばれる
    expect(mockFetchGroupMembers.mock.calls.length).toBe(callCountBeforeChip + 1);

    // 追加で呼ばれた fetch の引数を確認: exclude_group_ids に "2"（Sub A の ID）が含まれる
    const debounceCall = mockFetchGroupMembers.mock.calls[callCountBeforeChip]?.[0];
    expect(debounceCall?.groupId).toBe(1);
    expect(debounceCall?.exclude_group_ids).toBe("2");
  });

  it("連続でチップを 2 回操作しても、最後の操作から 300ms 後に 1 回だけ fetchGroupMembers が呼ばれる（デバウンス境界の検証）", async () => {
    // 2 つのサブグループを持つグループで検証
    const twoSubgroups = [
      { id: 2, name: "Sub A", description: "", member_count: 5 },
      { id: 3, name: "Sub B", description: "", member_count: 3 },
    ];

    const { useGroupDetail } = await import("@/pages/group-detail/model/useGroupDetail");
    vi.mocked(useGroupDetail).mockReturnValue({
      group: {
        id: 1,
        name: "dev-team",
        description: "",
        member_count: 3,
        subgroups: twoSubgroups,
      },
      error: null,
      isLoading: false,
      refetch: vi.fn(),
      subgroups: twoSubgroups,
    });

    render(
      <Theme>
        <GroupDetailContent groupId={1} />
      </Theme>,
    );

    // 初回マウント後の fetch が完了するまで待つ
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(screen.getByText("dev-team")).toBeInTheDocument();

    // 初回マウント時の呼び出し回数を記録
    const callCountBeforeChip = mockFetchGroupMembers.mock.calls.length;

    // 1回目クリック: Sub A を OFF（excludeGroupIdsKey = "2"）
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Sub A" }));
    });
    await act(async () => {
      await Promise.resolve();
    });

    // 200ms 経過（300ms 未達: デバウンスはまだ完了していない）
    act(() => {
      vi.advanceTimersByTime(200);
    });
    await act(async () => {
      await Promise.resolve();
    });

    // まだ fetchGroupMembers は追加で呼ばれていない（デバウンス未完了）
    expect(mockFetchGroupMembers.mock.calls.length).toBe(callCountBeforeChip);

    // 2回目クリック: Sub B も OFF（excludeGroupIdsKey = "2,3" → デバウンスがリセットされる）
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Sub B" }));
    });
    await act(async () => {
      await Promise.resolve();
    });

    // さらに 200ms 経過（2回目クリックから 200ms: まだ 300ms 未達）
    act(() => {
      vi.advanceTimersByTime(200);
    });
    await act(async () => {
      await Promise.resolve();
    });

    // まだ fetchGroupMembers は追加で呼ばれていない
    expect(mockFetchGroupMembers.mock.calls.length).toBe(callCountBeforeChip);

    // さらに 100ms 経過（2回目クリックから合計 300ms: デバウンス完了）
    act(() => {
      vi.advanceTimersByTime(100);
    });
    // doFetch の非同期処理（mockFetchGroupMembers の Promise 解決）を flush する
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    // 2回の操作（Sub A OFF → Sub B OFF）でデバウンスがリセットされ、
    // 最後の操作（Sub B OFF）から 300ms 後に 1 回だけ fetchGroupMembers が呼ばれる
    expect(mockFetchGroupMembers.mock.calls.length).toBe(callCountBeforeChip + 1);

    // 最終状態（Sub A + Sub B の両方が OFF）での fetch 引数を確認
    const debounceCall = mockFetchGroupMembers.mock.calls[callCountBeforeChip]?.[0];
    expect(debounceCall?.groupId).toBe(1);
    // exclude_group_ids に Sub A(2) と Sub B(3) が両方含まれる（ソート済み）
    expect(debounceCall?.exclude_group_ids).toBe("2,3");
  });
});
