"use client";

import { useRouter } from "next/navigation";
import { sendJson } from "@/lib/client-fetch";
import { IconSignOut } from "./icons";

/** End this session on the server, then leave the app. */
export async function signOut(router: ReturnType<typeof useRouter>) {
  const res = await sendJson("/api/auth/logout", "POST", undefined, "Could not sign out");
  if (!res.ok) {
    window.alert(`${res.error}. You are still signed in.`);
    return;
  }
  router.push("/");
  router.refresh();
}

export default function SignOutButton({
  className,
  label = "Sign out",
  icon = true,
}: {
  className?: string;
  label?: string;
  icon?: boolean;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => void signOut(router)}
      className={
        className ?? "btn-ghost w-full justify-center text-danger md:hidden"
      }
    >
      {icon ? <IconSignOut className="h-5 w-5" /> : null}
      {label}
    </button>
  );
}
