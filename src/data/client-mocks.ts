export type Category = { name: string; subtitle: string; tone: string; icon: string };
export type Tip = { title: string; category: string; icon: string };
export type Plan = { name: string; price: string; description: string; features: string[]; featured?: boolean };

export const categories: Category[] = [
  { name: "Glúteos", subtitle: "Força e definição", tone: "gold", icon: "✦" },
  { name: "Pernas", subtitle: "Treinos completos", tone: "pink", icon: "◒" },
  { name: "Costas", subtitle: "Postura e força", tone: "purple", icon: "⌁" },
  { name: "Braços", subtitle: "Tonificação", tone: "gold", icon: "♡" },
  { name: "Abdômen", subtitle: "Core fortalecido", tone: "pink", icon: "◈" },
  { name: "Cardio", subtitle: "Energia e ritmo", tone: "purple", icon: "↗" },
  { name: "Alongamento", subtitle: "Mobilidade e cuidado", tone: "gold", icon: "∿" },
];

export const tips: Tip[] = [
  { title: "Motivação", category: "Mente", icon: "✦" },
  { title: "Saúde e bem-estar", category: "Bem-estar", icon: "♡" },
  { title: "Cuidados com o corpo", category: "Autocuidado", icon: "◒" },
  { title: "Recuperação muscular", category: "Treino", icon: "⌁" },
];

export const plans: Plan[] = [
  { name: "Básico", price: "R$ 29,90", description: "O essencial para começar", features: ["Treinos guiados", "Acesso às dicas"] },
  { name: "Personalizado", price: "R$ 59,90", description: "Seu ritmo, seu plano", features: ["Tudo do Básico", "Plano personalizado", "Acompanhamento"], featured: true },
  { name: "Premium", price: "R$ 89,90", description: "Cuidado completo", features: ["Tudo do Personalizado", "Conteúdos exclusivos"] },
];

