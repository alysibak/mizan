import type { Metadata } from "next";
import { emailEnabled } from "@/lib/email";
import ForgotForm from "./ForgotForm";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPage() {
  return <ForgotForm emailLinks={emailEnabled()} />;
}
