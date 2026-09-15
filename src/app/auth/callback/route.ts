import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "@/lib/supabase/env";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : "/app/inicio";
  const config = getSupabaseEnv();
  if (!config || !code) return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent("Não foi possível concluir a autenticação.")}`, url));
  const cookieStore = await cookies();
  const response = NextResponse.redirect(new URL(safeNext, url));
  const client = createServerClient(config.url, config.key, { cookies: { getAll: () => cookieStore.getAll(), setAll: (cookiesToSet) => cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options)) } });
  const { error } = await client.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("[auth/callback]", error.message);
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent("Não foi possível concluir a autenticação.")}`, url));
  }
  return response;
}
