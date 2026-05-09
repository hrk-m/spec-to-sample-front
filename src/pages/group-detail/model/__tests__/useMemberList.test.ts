import { MockIntersectionObserver } from "@/test/setup";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchGroupMembers } from "@/pages/group-detail/api/fetch-group-members";
import { FETCH_LIMIT, useMemberList } from "@/pages/group-detail/model/useMemberList";

vi.mock("@/pages/group-detail/api/fetch-group-members", () => ({
  fetchGroupMembers: vi.fn(),
}));

describe("useMemberList", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    MockIntersectionObserver.reset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("マウント時に API を呼び出し members と total をセットする", async () => {
    const mockMembers = [
      {
        id: 1,
        uuid: "00000000-0000-0000-0000-000000000001",
        first_name: "太郎",
        last_name: "山田",
        source_groups: [{ group_id: 1, group_name: "Engineering" }],
      },
    ];
    vi.mocked(fetchGroupMembers).mockResolvedValueOnce({
      members: mockMembers,
      total: 1,
      duplicate_count: 0,
    });

    const { result } = renderHook(() => useMemberList(1));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.members).toEqual(mockMembers);
    expect(result.current.total).toBe(1);
    expect(fetchGroupMembers).toHaveBeenCalledWith({
      groupId: 1,
      limit: FETCH_LIMIT,
      offset: 0,
    });
  });

  it("API エラー時に error をセットする", async () => {
    vi.mocked(fetchGroupMembers).mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useMemberList(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toContain("Network error");
    expect(result.current.members).toEqual([]);
  });

  it("検索クエリを 300ms デバウンスしてから API を呼び出す", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.mocked(fetchGroupMembers).mockResolvedValue({ members: [], total: 0, duplicate_count: 0 });

    const { result } = renderHook(() => useMemberList(1));

    // 初回マウント時の fetch を完了させる
    await act(() => {
      vi.runAllTimers();
    });

    vi.clearAllMocks();

    // 検索クエリをセット
    act(() => {
      result.current.setSearchQuery("山田");
    });

    // デバウンス前は呼ばれない
    expect(fetchGroupMembers).not.toHaveBeenCalled();

    // 300ms 経過させる
    await act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(fetchGroupMembers).toHaveBeenCalledWith(
      expect.objectContaining({ q: "山田", offset: 0 }),
    );

    vi.useRealTimers();
  });

  it("初期ローディング状態が true である", () => {
    vi.mocked(fetchGroupMembers).mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useMemberList(1));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.members).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  describe("excludeGroupIds パラメータ", () => {
    it("excludeGroupIds が指定された場合、fetchGroupMembers に exclude_group_ids が渡される", async () => {
      vi.mocked(fetchGroupMembers).mockResolvedValueOnce({
        members: [],
        total: 0,
        duplicate_count: 0,
      });

      renderHook(() => useMemberList(1, [28, 29]));

      await waitFor(() => {
        expect(fetchGroupMembers).toHaveBeenCalledWith(
          expect.objectContaining({ exclude_group_ids: "28,29" }),
        );
      });
    });

    it("excludeGroupIds が空配列の場合、exclude_group_ids は渡されない", async () => {
      vi.mocked(fetchGroupMembers).mockResolvedValueOnce({
        members: [],
        total: 0,
        duplicate_count: 0,
      });

      renderHook(() => useMemberList(1, []));

      await waitFor(() => {
        expect(fetchGroupMembers).toHaveBeenCalledWith(
          expect.objectContaining({ exclude_group_ids: undefined }),
        );
      });
    });

    it("excludeGroupIds が未指定の場合、exclude_group_ids は渡されない", async () => {
      vi.mocked(fetchGroupMembers).mockResolvedValueOnce({
        members: [],
        total: 0,
        duplicate_count: 0,
      });

      renderHook(() => useMemberList(1));

      await waitFor(() => {
        expect(fetchGroupMembers).toHaveBeenCalledWith(
          expect.objectContaining({ exclude_group_ids: undefined }),
        );
      });
    });

    it("refetch 後の再フェッチで excludeGroupIds が最新の値で送信される", async () => {
      const initialMembers = [
        {
          id: 1,
          uuid: "00000000-0000-0000-0000-000000000001",
          first_name: "太郎",
          last_name: "山田",
          source_groups: [{ group_id: 1, group_name: "Engineering" }],
        },
      ];
      vi.mocked(fetchGroupMembers).mockResolvedValue({
        members: initialMembers,
        total: 1,
        duplicate_count: 0,
      });

      const { result, rerender } = renderHook(
        ({ excludeGroupIds }: { excludeGroupIds?: number[] }) => useMemberList(1, excludeGroupIds),
        { initialProps: { excludeGroupIds: undefined as number[] | undefined } },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      rerender({ excludeGroupIds: [28] });

      act(() => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(vi.mocked(fetchGroupMembers).mock.calls.length).toBeGreaterThanOrEqual(2);
      });

      const lastCall = vi.mocked(fetchGroupMembers).mock.calls.at(-1)?.[0];
      expect(lastCall?.exclude_group_ids).toBe("28");
    });
  });

  describe("excludeGroupIds を OFF→ON と切り替えたとき", () => {
    it("同じ excludeGroupIds=[] に戻ったときもデバウンス後に再 fetch が走る", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      vi.mocked(fetchGroupMembers).mockResolvedValue({
        members: [],
        total: 0,
        duplicate_count: 0,
      });

      // 初回: excludeGroupIds = [] (OFF状態)
      const { rerender } = renderHook(
        ({ excludeGroupIds }: { excludeGroupIds?: number[] }) => useMemberList(1, excludeGroupIds),
        { initialProps: { excludeGroupIds: [] as number[] } },
      );

      // 初回フェッチ完了
      await act(() => {
        vi.runAllTimers();
      });
      const firstCallCount = vi.mocked(fetchGroupMembers).mock.calls.length;
      expect(firstCallCount).toBeGreaterThanOrEqual(1);

      // ON: excludeGroupIds = [1] に切り替え
      rerender({ excludeGroupIds: [1] });
      await act(() => {
        vi.runAllTimers();
      });
      const secondCallCount = vi.mocked(fetchGroupMembers).mock.calls.length;
      expect(secondCallCount).toBeGreaterThan(firstCallCount);

      vi.clearAllMocks();

      // OFF: 再び excludeGroupIds = [] に戻す（同じ値）
      rerender({ excludeGroupIds: [] });
      await act(() => {
        vi.advanceTimersByTime(300);
      });

      // 再 fetch が走ること
      expect(vi.mocked(fetchGroupMembers)).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });
  });

  describe("refetch による再フェッチ", () => {
    it("refetch 呼び出し後に useMemberList が再フェッチする", async () => {
      const initialMembers = [
        {
          id: 1,
          uuid: "00000000-0000-0000-0000-000000000001",
          first_name: "太郎",
          last_name: "山田",
          source_groups: [{ group_id: 1, group_name: "Engineering" }],
        },
      ];
      const refreshedMembers = [
        {
          id: 2,
          uuid: "00000000-0000-0000-0000-000000000002",
          first_name: "花子",
          last_name: "鈴木",
          source_groups: [{ group_id: 1, group_name: "Engineering" }],
        },
      ];

      vi.mocked(fetchGroupMembers)
        .mockResolvedValueOnce({ members: initialMembers, total: 1, duplicate_count: 0 })
        .mockResolvedValueOnce({ members: refreshedMembers, total: 1, duplicate_count: 0 });

      const { result } = renderHook(() => useMemberList(1));

      // 初回フェッチ完了を待つ
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.members).toEqual(initialMembers);
      expect(fetchGroupMembers).toHaveBeenCalledTimes(1);

      // refetch を呼び出す
      act(() => {
        result.current.refetch();
      });

      // 再フェッチが実行されることを確認
      await waitFor(() => {
        expect(fetchGroupMembers).toHaveBeenCalledTimes(2);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.members).toEqual(refreshedMembers);
    });
  });

  describe("無限スクロール", () => {
    it("members は cachedMembers の全件を返す", async () => {
      const mockMembers = Array.from({ length: 55 }, (_, i) => ({
        id: i + 1,
        uuid: `00000000-0000-0000-0000-${String(i + 1).padStart(12, "0")}`,
        first_name: `名${i + 1}`,
        last_name: `姓${i + 1}`,
        source_groups: [{ group_id: 1, group_name: "Engineering" }],
      }));
      vi.mocked(fetchGroupMembers).mockResolvedValueOnce({
        members: mockMembers,
        total: 55,
        duplicate_count: 0,
      });

      const { result } = renderHook(() => useMemberList(1));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.members).toHaveLength(55);
      expect(result.current.members[0]?.id).toBe(1);
    });

    it("sentinel が visible になったら doFetchMore を呼ぶ（lastBatchSize === FETCH_LIMIT のとき）", async () => {
      const initialMembers = Array.from({ length: FETCH_LIMIT }, (_, i) => ({
        id: i + 1,
        uuid: `00000000-0000-0000-0000-${String(i + 1).padStart(12, "0")}`,
        first_name: `名${i + 1}`,
        last_name: `姓${i + 1}`,
        source_groups: [{ group_id: 1, group_name: "Engineering" }],
      }));
      const additionalMembers = Array.from({ length: 10 }, (_, i) => ({
        id: FETCH_LIMIT + i + 1,
        uuid: `00000000-0000-0000-0000-${String(FETCH_LIMIT + i + 1).padStart(12, "0")}`,
        first_name: `名${FETCH_LIMIT + i + 1}`,
        last_name: `姓${FETCH_LIMIT + i + 1}`,
        source_groups: [{ group_id: 1, group_name: "Engineering" }],
      }));

      vi.mocked(fetchGroupMembers)
        .mockResolvedValueOnce({
          members: initialMembers,
          total: FETCH_LIMIT + 10,
          duplicate_count: 0,
        })
        .mockResolvedValueOnce({
          members: additionalMembers,
          total: FETCH_LIMIT + 10,
          duplicate_count: 0,
        });

      const { result } = renderHook(() => useMemberList(1));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Trigger sentinel: lastBatchSize === FETCH_LIMIT → doFetchMore fires
      act(() => {
        MockIntersectionObserver.triggerAll([
          { isIntersecting: true, target: document.createElement("div") },
        ]);
      });

      await waitFor(() => {
        expect(vi.mocked(fetchGroupMembers)).toHaveBeenCalledWith(
          expect.objectContaining({ offset: FETCH_LIMIT }),
        );
      });
    });

    it("sentinel が visible になった後に追加データが表示される", async () => {
      const initialMembers = Array.from({ length: FETCH_LIMIT }, (_, i) => ({
        id: i + 1,
        uuid: `00000000-0000-0000-0000-${String(i + 1).padStart(12, "0")}`,
        first_name: `名${i + 1}`,
        last_name: `姓${i + 1}`,
        source_groups: [{ group_id: 1, group_name: "Engineering" }],
      }));
      const additionalMembers = Array.from({ length: 10 }, (_, i) => ({
        id: FETCH_LIMIT + i + 1,
        uuid: `00000000-0000-0000-0000-${String(FETCH_LIMIT + i + 1).padStart(12, "0")}`,
        first_name: `名${FETCH_LIMIT + i + 1}`,
        last_name: `姓${FETCH_LIMIT + i + 1}`,
        source_groups: [{ group_id: 1, group_name: "Engineering" }],
      }));

      vi.mocked(fetchGroupMembers)
        .mockResolvedValueOnce({
          members: initialMembers,
          total: FETCH_LIMIT + 10,
          duplicate_count: 0,
        })
        .mockResolvedValueOnce({
          members: additionalMembers,
          total: FETCH_LIMIT + 10,
          duplicate_count: 0,
        });

      const { result } = renderHook(() => useMemberList(1));

      await waitFor(() => {
        expect(result.current.members).toHaveLength(FETCH_LIMIT);
      });

      act(() => {
        MockIntersectionObserver.triggerAll([
          { isIntersecting: true, target: document.createElement("div") },
        ]);
      });

      await waitFor(() => {
        expect(result.current.members).toHaveLength(FETCH_LIMIT + 10);
      });
    });

    it("追加フェッチ失敗時に fetchMoreError がセットされ既存メンバーは維持される", async () => {
      const initialMembers = Array.from({ length: FETCH_LIMIT }, (_, i) => ({
        id: i + 1,
        uuid: `00000000-0000-0000-0000-${String(i + 1).padStart(12, "0")}`,
        first_name: `名${i + 1}`,
        last_name: `姓${i + 1}`,
        source_groups: [{ group_id: 1, group_name: "Engineering" }],
      }));

      vi.mocked(fetchGroupMembers).mockResolvedValueOnce({
        members: initialMembers,
        total: FETCH_LIMIT,
        duplicate_count: 0,
      });

      const { result } = renderHook(() => useMemberList(1));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // 2 回目のトリガー前に fetchGroupMembers をエラーに設定する
      vi.mocked(fetchGroupMembers).mockRejectedValueOnce(new Error("fetch failed"));

      // Trigger sentinel: lastBatchSize === FETCH_LIMIT → doFetchMore fires and fails
      act(() => {
        MockIntersectionObserver.triggerAll([
          { isIntersecting: true, target: document.createElement("div") },
        ]);
      });

      await waitFor(() => {
        expect(result.current.fetchMoreError).toContain("fetch failed");
      });

      // 既存メンバーが維持されていること
      expect(result.current.members).toHaveLength(100);
      expect(result.current.members[0]?.id).toBe(1);
      expect(result.current.members[99]?.id).toBe(100);

      // フェッチ中フラグが false に戻っていること
      expect(result.current.isFetchingMore).toBe(false);
    });
  });
});
