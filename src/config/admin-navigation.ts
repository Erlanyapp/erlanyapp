import type { IconName } from "@/components/icons";
export const adminNavigation:{href:string;label:string;icon:IconName}[]=[
  {href:"/admin",label:"Dashboard",icon:"progress"},{href:"/admin/clientes",label:"Clientes",icon:"profile"},
  {href:"/admin/treinos",label:"Treinos",icon:"workout"},{href:"/admin/exercicios",label:"Exercícios",icon:"workout"},
  {href:"/admin/alimentacao",label:"Alimentação",icon:"nutrition"},{href:"/admin/dicas",label:"Dicas",icon:"tips"},
  {href:"/admin/midia",label:"Mídia",icon:"media"},{href:"/admin/planos",label:"Planos",icon:"crown"},
  {href:"/admin/relatorios",label:"Relatórios",icon:"progress"},{href:"/admin/configuracoes",label:"Configurações",icon:"settings"},
];
export const adminArea=(pathname:string)=>adminNavigation.find(x=>x.href!=="/admin"&&(pathname===x.href||pathname.startsWith(x.href+"/")))?.label??"Dashboard";
