import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export function Button({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) { return <button {...props}>{children}</button>; }
export function Input(props: InputHTMLAttributes<HTMLInputElement>) { return <input {...props} />; }
export function IconButton(props: ButtonHTMLAttributes<HTMLButtonElement>) { return <Button aria-label={props["aria-label"] ?? "Ação"} {...props} />; }
export function Avatar({ children }: { children?: ReactNode }) { return <span aria-label="Avatar">{children ?? "EF"}</span>; }
export function Badge({ children }: { children: ReactNode }) { return <span>{children}</span>; }
export function Divider() { return <hr />; }
export function Modal({ children }: { children: ReactNode }) { return <dialog open>{children}</dialog>; }
export function Drawer({ children }: { children: ReactNode }) { return <aside>{children}</aside>; }
export function Toast({ children }: { children: ReactNode }) { return <output>{children}</output>; }
export function Loading() { return <span role="status">Carregando…</span>; }
export function Skeleton() { return <span aria-hidden="true"> </span>; }
