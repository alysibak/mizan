"use client";

import { useRouter } from "next/navigation";
import { IconSignOut } from "./icons";

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

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      className={
        className ?? "btn-ghost w-full justify-center text-danger md:hidden"
      }
    >
      {icon ? <IconSignOut className="h-5 w-5" /> : null}
      {label}
    </button>
  );
}
