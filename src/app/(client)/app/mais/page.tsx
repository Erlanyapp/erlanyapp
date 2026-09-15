import { PageHeader, Card, Avatar } from "@/components/ui";
import { LogoutButton } from "@/components/auth/logout-button";
const menu = ["Meus dados", "Meus treinos", "Minhas conquistas", "Notificações", "Falar com a Erlany", "Central de ajuda", "Configurações", "Sair"];
export default function MorePage() { return <div><PageHeader title="Mais" /><Card className="profile-summary"><Avatar>JS</Avatar><div><strong>Juliana Silva</strong><small>Ver meu perfil</small></div></Card><div className="category-list more-list">{menu.map((item) => item === "Sair" ? <LogoutButton key={item} /> : <Card className="category-row" key={item}><span className="tip-icon">♡</span><strong>{item}</strong><b>›</b></Card>)}</div></div>; }
