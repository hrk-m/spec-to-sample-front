---
name: vitest mock pattern for shared/auth with useInitializeAuth
description: When testing components that use useInitializeAuth via @/shared/auth, mock useInitializeAuth directly rather than relying on importOriginal
type: feedback
---

When `@/shared/auth` is mocked with `vi.mock`, any hook added to that module (e.g., `useInitializeAuth`) must be explicitly included in the mock factory. Using `importOriginal` does not help if the hook internally calls `useAuth` via a relative `./auth` import — the relative import bypasses the `@/shared/auth` module mock.

**Why:** `useInitializeAuth.ts` uses `import { useAuth } from "./auth"` (relative). When tests mock `@/shared/auth`, that relative import in `useInitializeAuth.ts` is NOT intercepted. So the real `useAuth` runs and throws "useAuth must be used within an AuthProvider" unless an actual AuthContext is present.

**How to apply:** For `ProtectedRoute.test.tsx` and similar tests:
1. Mock `useInitializeAuth` directly in the `vi.mock("@/shared/auth")` factory using `vi.hoisted`
2. Control the hook's return value per test case with `mockUseInitializeAuth.mockReturnValue({...})`
3. Remove unused `HttpError` import from test files after removing direct `apiFetch`-based assertions
