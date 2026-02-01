"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * When Supabase redirects to the Site URL (/) after email confirmation or
 * password reset, we need to route to the right page. If the URL contains
 * type=recovery, send the user to /reset-password (with hash/query preserved
 * so the session can be established). Otherwise they stay on / (email confirm).
 */
export function AuthCallbackHandler() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/") return;

    const hash = window.location.hash.slice(1);
    const search = window.location.search.slice(1);
    const params = new URLSearchParams(hash || search);
    const type = params.get("type");

    if (type === "recovery") {
      const rest = window.location.hash || window.location.search;
      window.location.replace(`/reset-password${rest}`);
    }
  }, [pathname]);

  return null;
}
