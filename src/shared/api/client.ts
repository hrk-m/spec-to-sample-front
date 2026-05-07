import { API_BASE_URL } from "@/shared/config";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const start = performance.now();
  const res = await fetch(`${API_BASE_URL}${path}`, init);

  if (!res.ok) {
    const latencyS = (performance.now() - start) / 1000;
    const method = init?.method ?? "GET";
    const endpoint = `${method} ${path.split("?")[0]}`;
    const loginUser = res.headers.get("X-Login-User") ?? undefined;

    const logEntry: Record<string, unknown> = {
      time: new Date().toISOString(),
      endpoint,
      latency_s: latencyS,
      status: res.status,
    };
    if (loginUser !== undefined) {
      logEntry.login_user = loginUser;
    }

    // oxlint-disable-next-line no-console
    console.error(JSON.stringify(logEntry));
    throw new HttpError(res.status, `${res.status} ${res.statusText}`);
  }

  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}
