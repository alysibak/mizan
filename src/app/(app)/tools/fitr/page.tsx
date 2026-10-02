import { getCurrentUser, getUserSettings } from "@/lib/session";
import FitrTool from "@/components/FitrTool";

export default async function FitrPage() {
  const user = (await getCurrentUser())!;
  const settings = await getUserSettings(user.id);
  return <FitrTool currency={settings.currency} />;
}
