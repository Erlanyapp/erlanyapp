import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { ProfileAvatar } from "@/components/client/profile-avatar";
import { getClientAccount } from "@/services/server-account";
import { getClientIntake } from "@/services/server-client-intake";
export default async function ProfilePage() {
  const [{ account },intake]=await Promise.all([getClientAccount(),getClientIntake().then(x=>x.get())]);
  return <div><PageHeader title="Meu perfil" back backHref="/app/mais" /><section className="card account-panel"><ProfileAvatar account={account} large /><h2>{account.name}</h2><dl className="account-data"><dt>E-mail</dt><dd>{account.email}</dd><dt>Tipo de conta</dt><dd>{account.role === "ADMIN" ? "Administradora" : "Cliente"}</dd></dl>{!intake||intake.status!=="COMPLETED"?<Link className="button button-gold full-width" href="/app/ficha-inicial">Completar ficha inicial</Link>:<Link className="button button-outline full-width" href="/app/ficha-inicial">Atualizar ficha inicial</Link>}{account.avatarError && <p role="alert">Não foi possível carregar a foto. Você pode enviar uma nova imagem.</p>}<Link className="button button-primary full-width" href="/app/perfil/editar">Editar perfil</Link></section></div>;
}
