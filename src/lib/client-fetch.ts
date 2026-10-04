export type SendResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status: number };

const OFFLINE = "Could not reach Mizan. Check your connection and try again.";

/**
 * JSON request from the browser that never throws. Network failures and error
 * responses both come back as `{ ok: false, error }` with a readable message,
 * so a form can always clear its busy state and show what went wrong.
 */
export async function sendJson<T = unknown>(
  url: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body?: unknown,
  fallbackError = "Something went wrong. Please try again.",
): Promise<SendResult<T>> {
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    return { ok: false, error: OFFLINE, status: 0 };
  }
  const data = (await res.json().catch(() => null)) as
    | (T & { error?: string })
    | null;
  if (!res.ok) {
    return { ok: false, error: data?.error || fallbackError, status: res.status };
  }
  return { ok: true, data: data as T };
}
