import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDebouncedMemberFilter } from "@/pages/group-detail/model/useDebouncedMemberFilter";

describe("useDebouncedMemberFilter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("Bridge: setDuplicateCount called with same value as before still updates display", async () => {
    const { result, rerender } = renderHook(
      ({ excludeGroupIds }: { excludeGroupIds: number[] }) =>
        useDebouncedMemberFilter(excludeGroupIds),
      { initialProps: { excludeGroupIds: [] as number[] } },
    );

    // 初期値として 4 をセットする
    act(() => {
      result.current.setDuplicateCount(4);
    });
    expect(result.current.duplicateCount).toBe(4);

    // フィルターを変更する（即時リセットが走らないことを確認）
    rerender({ excludeGroupIds: [28] });
    expect(result.current.duplicateCount).toBe(4);

    // 300ms 経過させてデバウンス完了
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    // MemberList 経由で同じ値 4 が再度セットされる
    act(() => {
      result.current.setDuplicateCount(4);
    });

    // 0 に落ちることなく 4 のまま維持されること
    expect(result.current.duplicateCount).toBe(4);
  });

  it("debouncedExcludeGroupIds は 300ms 後に更新される", async () => {
    const { result, rerender } = renderHook(
      ({ excludeGroupIds }: { excludeGroupIds: number[] }) =>
        useDebouncedMemberFilter(excludeGroupIds),
      { initialProps: { excludeGroupIds: [] as number[] } },
    );

    // フィルターを変更する
    rerender({ excludeGroupIds: [28] });

    // 300ms 前は更新されていない
    expect(result.current.debouncedExcludeGroupIds).toEqual([]);

    // 300ms 経過後に更新される
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(result.current.debouncedExcludeGroupIds).toEqual([28]);
  });

  it("excludeGroupIds を連続変更するとタイマーがリセットされる", async () => {
    const { result, rerender } = renderHook(
      ({ excludeGroupIds }: { excludeGroupIds: number[] }) =>
        useDebouncedMemberFilter(excludeGroupIds),
      { initialProps: { excludeGroupIds: [] as number[] } },
    );

    // 1回目の変更
    rerender({ excludeGroupIds: [28] });

    // 100ms 経過（まだデバウンス未完了）
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    expect(result.current.debouncedExcludeGroupIds).toEqual([]);

    // 2回目の変更でタイマーリセット
    rerender({ excludeGroupIds: [27] });

    // さらに 250ms 経過（2回目の変更から 250ms、タイマーはまだ 50ms 残り）
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });
    expect(result.current.debouncedExcludeGroupIds).toEqual([]);

    // さらに 50ms 経過（2回目の変更から合計 300ms）
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });
    expect(result.current.debouncedExcludeGroupIds).toEqual([27]);
  });

  it("フィルター変更時に apiTotal / duplicateCount が即時リセットされない", () => {
    const { result, rerender } = renderHook(
      ({ excludeGroupIds }: { excludeGroupIds: number[] }) =>
        useDebouncedMemberFilter(excludeGroupIds),
      { initialProps: { excludeGroupIds: [] as number[] } },
    );

    // 初期値をセット
    act(() => {
      result.current.setApiTotal(17);
      result.current.setDuplicateCount(4);
    });
    expect(result.current.apiTotal).toBe(17);
    expect(result.current.duplicateCount).toBe(4);

    // フィルターを変更（タイマーは進めない）
    rerender({ excludeGroupIds: [28] });

    // 即時リセットが走らないこと
    expect(result.current.apiTotal).toBe(17);
    expect(result.current.duplicateCount).toBe(4);
  });
});
