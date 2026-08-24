import { redirect } from "next/navigation";
import { destroySession } from "@/lib/auth";

/** Clear an invalid session cookie, then send the visitor to login. */
export async function GET() {
  await destroySession();
  redirect("/login");
}
