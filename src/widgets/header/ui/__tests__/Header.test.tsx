import { Header } from "@/widgets/header";
import { Theme } from "@radix-ui/themes";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { useAuth } from "@/shared/auth";

vi.mock("@/shared/auth", () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: 1,
      uuid: "test-uuid-xxxx",
      firstName: "太郎",
      lastName: "山田",
    },
    setUser: vi.fn(),
  })),
}));

function renderWithTheme(ui: React.ReactElement) {
  return render(<Theme>{ui}</Theme>);
}

describe("Header", () => {
  it("画面タイトルを表示する", () => {
    renderWithTheme(<Header />);

    expect(screen.getByText("Sample Front")).toBeInTheDocument();
  });

  it("アカウント表示を表示する", () => {
    renderWithTheme(<Header />);

    expect(screen.getByLabelText("Account")).toBeInTheDocument();
  });

  it("ハンバーガーメニューを表示する", () => {
    renderWithTheme(<Header />);

    expect(screen.getByLabelText("Open navigation")).toBeInTheDocument();
  });

  it("banner ロールを持つ", () => {
    renderWithTheme(<Header />);

    expect(screen.getByRole("banner")).toBeInTheDocument();
  });

  it("メニューボタンをクリックすると onMenuClick が呼ばれる", async () => {
    const onMenuClick = vi.fn();
    renderWithTheme(<Header onMenuClick={onMenuClick} />);

    await userEvent.click(screen.getByLabelText("Open navigation"));
    expect(onMenuClick).toHaveBeenCalledTimes(1);
  });

  it("FaCircleUser アイコンが描画される — aria-label=Account のボタンが存在する", () => {
    renderWithTheme(<Header />);

    const accountButton = screen.getByRole("button", { name: "Account" });
    expect(accountButton).toBeInTheDocument();
  });

  it("アイコンクリックでドロップダウンが開く — UUID とユーザー名が DOM に表示される", async () => {
    renderWithTheme(<Header />);

    const accountButton = screen.getByRole("button", { name: "Account" });
    await userEvent.click(accountButton);

    expect(screen.getByText("test-uuid-xxxx")).toBeInTheDocument();
    expect(screen.getByText("太郎 山田")).toBeInTheDocument();
  });

  it("ドロップダウン内に UUID が表示される", async () => {
    renderWithTheme(<Header />);

    const accountButton = screen.getByRole("button", { name: "Account" });
    await userEvent.click(accountButton);

    expect(screen.getByText("test-uuid-xxxx")).toBeInTheDocument();
  });

  it("ドロップダウン内にユーザー名が表示される", async () => {
    renderWithTheme(<Header />);

    const accountButton = screen.getByRole("button", { name: "Account" });
    await userEvent.click(accountButton);

    expect(screen.getByText("太郎 山田")).toBeInTheDocument();
  });

  it("HR テキストが DOM に存在しない", () => {
    renderWithTheme(<Header />);

    expect(screen.queryByText("HR")).not.toBeInTheDocument();
  });

  it("useAuth モックで UUID とユーザー名を差し替えられる", async () => {
    vi.mocked(useAuth).mockReturnValueOnce({
      user: {
        id: 2,
        uuid: "another-uuid-yyyy",
        firstName: "花子",
        lastName: "鈴木",
      },
      setUser: vi.fn(),
    });

    renderWithTheme(<Header />);

    const accountButton = screen.getByRole("button", { name: "Account" });
    await userEvent.click(accountButton);

    expect(screen.getByText("another-uuid-yyyy")).toBeInTheDocument();
    expect(screen.getByText("花子 鈴木")).toBeInTheDocument();
  });
});
