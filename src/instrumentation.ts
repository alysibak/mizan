import type { Instrumentation } from "next";

/**
 * Self-hosted, Next 16 logs every 404 from a `dynamicParams = false` route
 * (/zzz under [locale], /nisab/xyz) as "Error: Internal: NoFallbackError".
 * The visitor still gets the right 404; only the log line is wrong, and bots
 * probing /wp-admin would fill the logs with it. Drop exactly that line.
 */
export function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const original = console.error;
  console.error = (...args: unknown[]) => {
    const [first] = args;
    if (first instanceof Error && first.message === "Internal: NoFallbackError") return;
    original(...args);
  };
}

/**
 * One structured line per server error, for whatever collects the logs
 * (Vercel, Docker, journald). It carries the route and Next's error digest,
 * which the error page shows the user, so a report can be matched to a line.
 * Never the request body, query, or cookies: those can hold someone's finances.
 */
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  const error = err as Error & { digest?: string };
  console.error(
    JSON.stringify({
      level: "error",
      at: new Date().toISOString(),
      message: error?.message ?? String(err),
      digest: error?.digest,
      method: request.method,
      path: request.path.split("?")[0],
      routePath: context.routePath,
      routeType: context.routeType,
      stack: error?.stack?.split("\n").slice(0, 8).join("\n"),
    }),
  );
};
