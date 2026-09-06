import { getCurrentUser, getUserSettings } from "@/lib/session";
import BeginWizard from "@/components/BeginWizard";

export default async function BeginPage() {
  const user = (await getCurrentUser())!;
  const settings = await getUserSettings(user.id);

  return (
    <BeginWizard
      name={user.name.split(" ")[0] || user.name}
      settings={settings}
    />
  );
}
