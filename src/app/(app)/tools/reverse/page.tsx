import { getCurrentUser, getUserSettings } from "@/lib/session";
import ReverseZakatTool from "@/components/ReverseZakatTool";

export default async function ReversePage() {
  const user = (await getCurrentUser())!;
  const settings = await getUserSettings(user.id);
  return (
    <ReverseZakatTool
      currency={settings.currency}
      basis={settings.calendarBasis as "lunar" | "solar"}
    />
  );
}
