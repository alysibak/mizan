import { getCurrentUser, getUserSettings } from "@/lib/session";
import UdhiyahTool from "@/components/UdhiyahTool";

export default async function UdhiyahPage() {
  const user = (await getCurrentUser())!;
  const settings = await getUserSettings(user.id);
  return <UdhiyahTool currency={settings.currency} />;
}
