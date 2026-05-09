import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UserDetailPage } from "@/pages/users/ui/UserDetailPage";

vi.mock("@/pages/users/model/useUserDetail", () => ({
  useUserDetail: vi.fn(),
}));

function renderWithRouter(userId = "1") {
  return render(
    <MemoryRouter initialEntries={[`/users/${userId}`]}>
      <Routes>
        <Route path="/users/:id" element={<UserDetailPage />} />
        <Route path="/users" element={<div>Users List Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("UserDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ローディング中にスケルトン要素が DOM に存在する", async () => {
    const { useUserDetail } = await import("@/pages/users/model/useUserDetail");
    vi.mocked(useUserDetail).mockReturnValue({
      user: null,
      loading: true,
      error: null,
      notFound: false,
    });

    renderWithRouter();

    expect(document.querySelector("[data-testid='user-detail-skeleton']")).toBeInTheDocument();
  });

  it("成功時に id・uuid・姓名が DOM に表示される", async () => {
    const { useUserDetail } = await import("@/pages/users/model/useUserDetail");
    vi.mocked(useUserDetail).mockReturnValue({
      user: {
        id: 1,
        uuid: "550e8400-e29b-41d4-a716-446655440001",
        first_name: "太郎",
        last_name: "山田",
      },
      loading: false,
      error: null,
      notFound: false,
    });

    renderWithRouter();

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("550e8400-e29b-41d4-a716-446655440001")).toBeInTheDocument();
    expect(screen.getByText("山田 太郎")).toBeInTheDocument();
  });

  it("404 時に「ユーザーが見つかりません」が表示される", async () => {
    const { useUserDetail } = await import("@/pages/users/model/useUserDetail");
    vi.mocked(useUserDetail).mockReturnValue({
      user: null,
      loading: false,
      error: null,
      notFound: true,
    });

    renderWithRouter();

    expect(screen.getByText("ユーザーが見つかりません")).toBeInTheDocument();
  });

  it("エラー時にエラーカード要素が DOM に表示される", async () => {
    const { useUserDetail } = await import("@/pages/users/model/useUserDetail");
    vi.mocked(useUserDetail).mockReturnValue({
      user: null,
      loading: false,
      error: "500 Internal Server Error",
      notFound: false,
    });

    renderWithRouter();

    expect(document.querySelector("[data-testid='user-detail-error']")).toBeInTheDocument();
  });

  it("戻るボタンクリックで /users に遷移する", async () => {
    const user = userEvent.setup();
    const { useUserDetail } = await import("@/pages/users/model/useUserDetail");
    vi.mocked(useUserDetail).mockReturnValue({
      user: {
        id: 1,
        uuid: "550e8400-e29b-41d4-a716-446655440001",
        first_name: "太郎",
        last_name: "山田",
      },
      loading: false,
      error: null,
      notFound: false,
    });

    renderWithRouter();

    const backButton = screen.getByRole("button", { name: /戻る/ });
    await user.click(backButton);

    expect(screen.getByText("Users List Page")).toBeInTheDocument();
  });
});
