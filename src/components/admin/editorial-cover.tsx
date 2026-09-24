"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { MAX_EDITORIAL_COVER_BYTES } from "@/domain/admin-editorial";

const types = ["image/png", "image/jpeg", "image/webp"];
export function EditorialCover({ imageUrl, error }: { imageUrl?: string | null; error?: string }) {
  const [preview, setPreview] = useState<string | null>(imageUrl ?? null); const [localError, setLocalError] = useState(""); const file = useRef<HTMLInputElement>(null);
  useEffect(() => () => { if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview); }, [preview]);
  const select = (value?: File) => { setLocalError(""); if (!value?.name || value.size === 0) return; if (value.size > MAX_EDITORIAL_COVER_BYTES) { setLocalError("A capa deve ter no máximo 4 MB."); if (file.current) file.current.value = ""; return; } if (!types.includes(value.type)) { setLocalError("Use uma capa PNG, JPG ou WebP."); if (file.current) file.current.value = ""; return; } setPreview((current) => { if (current?.startsWith("blob:")) URL.revokeObjectURL(current); return URL.createObjectURL(value); }); };
  return <label className="editorial-cover-field">Capa opcional<input ref={file} name="cover" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => select(event.target.files?.[0])} /><small>PNG, JPG ou WebP, até 4 MB. O arquivo fica privado.</small>{localError || error ? <small className="crm-feedback error" role="alert">{localError || error}</small> : null}{preview ? <Image src={preview} alt="Prévia da capa" width={220} height={132} className="editorial-cover-preview" unoptimized /> : <span className="editorial-cover-empty">Sem capa</span>}{imageUrl ? <label className="workout-checkbox"><input name="removeCover" type="checkbox" /> Remover capa atual</label> : null}</label>;
}
