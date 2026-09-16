"use client";
import Image from "next/image";
import { useState } from "react";
import type { Account } from "@/types/account";
export function ProfileAvatar({ account, large = false, preview }: { account: Pick<Account, "name" | "avatarUrl">; large?: boolean; preview?: string | null }) {
  const source = preview || account.avatarUrl;
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const initials = account.name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "EF";
  return <span className={`profile-avatar ${large ? "profile-avatar-large" : ""}`} aria-label={`Foto de ${account.name}`}>
    {source && failedSource !== source ? <Image src={source} fill sizes={large ? "112px" : "42px"} unoptimized alt={`Foto de ${account.name}`} onError={() => setFailedSource(source)} /> : initials}
  </span>;
}
