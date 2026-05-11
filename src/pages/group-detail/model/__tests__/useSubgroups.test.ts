import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchSubgroups } from "@/pages/group-detail/api/fetch-subgroups";
import { useSubgroups } from "@/pages/group-detail/model/useSubgroups";

vi.mock("@/pages/group-detail/api/fetch-subgroups", () => ({
  fetchSubgroups: vi.fn(),
}));

const sampleSubgroups = [
  { id: 2, name: "Frontend Team", description: "FE チーム", member_count: 3 },
  { id: 3, name: "Backend Team", description: "BE チーム", member_count: 4 },
];

describe("useSubgroups", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("状態変化: 初回マウントで取得し subgroups を反映、refetch を呼ぶと再取得される", async () => {
    vi.mocked(fetchSubgroups).mockResolvedValue(sampleSubgroups);

    const { result } = renderHook(() => useSubgroups(1));

    await waitFor(() => {
      expect(result.current.subgroups).toEqual(sampleSubgroups);
    });

    expect(fetchSubgroups).toHaveBeenCalledTimes(1);
    expect(fetchSubgroups).toHaveBeenCalledWith(1);

    // refetch を呼ぶと再取得される
    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(fetchSubgroups).toHaveBeenCalledTimes(2);
    });

    expect(result.current.subgroups).toEqual(sampleSubgroups);
  });

  it("異常系: 取得失敗時は state が空のまま、コンソールエラーが出る", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(fetchSubgroups).mockRejectedValueOnce(new Error("fetch failed"));

    const { result } = renderHook(() => useSubgroups(1));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    expect(result.current.subgroups).toEqual([]);

    consoleSpy.mockRestore();
  });
});
