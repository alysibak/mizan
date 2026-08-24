import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Self-contained Node server for Docker / VPS. Omit on Vercel (platform handles it).
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),
  // Silence incorrect workspace-root inference when other lockfiles exist higher up.
  outputFileTracingRoot: path.join(__dirname),
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/icon.svg" }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
