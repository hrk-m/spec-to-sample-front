import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchSubgroups } from "@/pages/group-detail/api/fetch-subgroups";

vi.mock("@/shared/api", () => ({
  apiFetch: vi.fn(),
}));

describe("fetchSubgroups", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("正常系: 200 を受け取り subgroups 配列を返す", async () => {
    const { apiFetch } = await import("@/shared/api");
    const mockSubgroups = [
      { id: 2, name: "Frontend Team", description: "FE チーム", member_count: 3 },
      { id: 3, name: "Backend Team", description: "BE チーム", member_count: 4 },
    ];
    vi.mocked(apiFetch).mockResolvedValueOnce({ subgroups: mockSubgroups });

    const result = await fetchSubgroups(1);

    expect(apiFetch).toHaveBeenCalledWith("/api/v1/groups/1/subgroups");
    expect(result).toEqual(mockSubgroups);
  });

  it("境界値: 0 件レスポンスで空配列を返す", async () => {
    const { apiFetch } = await import("@/shared/api");
    vi.mocked(apiFetch).mockResolvedValueOnce({ subgroups: [] });

    const result = await fetchSubgroups(999);

    expect(result).toEqual([]);
  });

  it("異常系: エラーレスポンスで throw する", async () => {
    const { apiFetch } = await import("@/shared/api");
    vi.mocked(apiFetch).mockRejectedValueOnce(new Error("500 Internal Server Error"));

    await expect(fetchSubgroups(1)).rejects.toThrow("500 Internal Server Error");
  });
});
