import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchUser } from "@/pages/user-detail/api/fetch-user";

vi.mock("@/shared/api", () => ({
  apiFetch: vi.fn(),
}));

describe("fetchUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ID 付き URL で apiFetch を呼び出す", async () => {
    const { apiFetch } = await import("@/shared/api");
    vi.mocked(apiFetch).mockResolvedValueOnce({
      id: 1,
      uuid: "550e8400-e29b-41d4-a716-446655440001",
      first_name: "太郎",
      last_name: "山田",
    });

    await fetchUser("1");

    expect(apiFetch).toHaveBeenCalledWith("/api/v1/users/1");
  });
});
