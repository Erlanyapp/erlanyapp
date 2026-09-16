import { PageHeader } from "@/components/ui";
import { ProfileForm } from "@/components/client/account-forms";
import { getClientAccount } from "@/services/server-account";
export default async function EditProfilePage() {
  const { account } = await getClientAccount();
  return <div><PageHeader title="Editar perfil" back backHref="/app/perfil" /><ProfileForm account={account} /></div>;
}
