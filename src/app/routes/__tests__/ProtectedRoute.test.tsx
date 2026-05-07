import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProtectedRoute } from "@/app/routes/ProtectedRoute";
import { AuthProvider, type AuthStatus } from "@/shared/auth";

// vi.mock is hoisted — use vi.hoisted to create mock references
const mockApiFetch = vi.hoisted(() => vi.fn());
const mockSetUser = vi.hoisted(() => vi.fn());
const mockUseInitializeAuth = vi.hoisted(() =>
  vi.fn((): { status: AuthStatus } => ({
    status: "loading",
  })),
);

vi.mock("@/shared/api", () => {
  class MockHttpError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.name = "HttpError";
      this.status = status;
    }
  }
  return {
    apiFetch: mockApiFetch,
    HttpError: MockHttpError,
  };
});

vi.mock("@/shared/auth", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({ user: null, setUser: mockSetUser }),
  useInitializeAuth: mockUseInitializeAuth,
}));

// /service-unavailable へ遷移したとき location.state を検証できるヘルパーコンポーネント
function ServiceUnavailableCapture() {
  const location = useLocation();
  const reason = (location.state as { reason?: string } | null)?.reason ?? "none";
  return (
    <div data-testid="service-unavailable" data-reason={reason}>
      DevLogin
    </div>
  );
}

function renderWithRouter(ui: React.ReactElement, initialPath = "/") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <Routes>
          <Route path="/*" element={ui} />
          <Route path="/service-unavailable" element={<ServiceUnavailableCapture />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /api/v1/me が 200 を返すとユーザー情報が setUser に渡される（firstName/lastName マッピング確認）", async () => {
    mockUseInitializeAuth.mockReturnValue({
      status: "authenticated",
    });
    mockApiFetch.mockResolvedValueOnce({
      id: 1,
      uuid: "test-uuid",
      first_name: "太郎",
      last_name: "山田",
    });

    renderWithRouter(
      <ProtectedRoute>
        <div data-testid="protected-content">Protected</div>
      </ProtectedRoute>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    });
  });

  it("GET /api/v1/me が 401 を返すと reason='unauthenticated' で /service-unavailable へリダイレクトされる", async () => {
    mockUseInitializeAuth.mockReturnValue({
      status: "unauthenticated",
    });

    renderWithRouter(
      <ProtectedRoute>
        <div data-testid="protected-content">Protected</div>
      </ProtectedRoute>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("service-unavailable")).toBeInTheDocument();
    });

    expect(screen.getByTestId("service-unavailable")).toHaveAttribute(
      "data-reason",
      "unauthenticated",
    );
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
  });

  it("GET /api/v1/me がネットワークエラーを返すと reason='api_unavailable' で /service-unavailable へリダイレクトされる", async () => {
    mockUseInitializeAuth.mockReturnValue({
      status: "api_unavailable",
    });

    renderWithRouter(
      <ProtectedRoute>
        <div data-testid="protected-content">Protected</div>
      </ProtectedRoute>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("service-unavailable")).toBeInTheDocument();
    });

    expect(screen.getByTestId("service-unavailable")).toHaveAttribute(
      "data-reason",
      "api_unavailable",
    );
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
  });
});
