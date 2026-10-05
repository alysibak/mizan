"use client";

import { useEffect } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { analyticsConfig, isPublicPath, send } from "@/lib/analytics";

/**
 * Loads the analytics script in manual mode and reports a page view for
 * public pages only, by path, without the query string.
 */
export default function Analytics() {
  const pathname = usePathname();
  const config = analyticsConfig();

  useEffect(() => {
    if (!config || !pathname || !isPublicPath(pathname)) return;
    send("pageview", { u: `${window.location.origin}${pathname}` });
  }, [config, pathname]);

  if (!config) return null;
  return <Script src={config.src} data-domain={config.domain} strategy="afterInteractive" />;
}
