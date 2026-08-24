"use client";

import { useRouter } from "next/navigation";
import { IconSignOut } from "./icons";

export default function SignOutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      className="btn-ghost w-full justify-center text-danger md:hidden"
    >
      <IconSignOut className="h-5 w-5" />
      Sign out
    </button>
  );
}
