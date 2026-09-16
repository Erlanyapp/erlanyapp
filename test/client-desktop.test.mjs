import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(new URL("../src/config/client-desktop-navigation.ts", import.meta.url), "utf8");
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const navigation = await import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}`);

test("desktop routes keep semantic icons and only existing client destinations", () => {
  const items = [...navigation.desktopPrimaryNavigation, ...navigation.desktopAccountNavigation];
  assert.equal(new Set(items.map(item => item.href)).size, items.length);
  for (const item of items) {
    assert.ok(item.href.startsWith("/app/"));
    assert.match(item.icon, /^[a-z-]+$/);
  }
  assert.equal(items.find(item => item.href === "/app/planos").icon, "crown");
  assert.equal(items.find(item => item.href === "/app/alimentacao").icon, "nutrition");
});

test("desktop navigation handles detail routes without prefix collisions", () => {
  assert.equal(navigation.desktopNavigationActive("/app/treinos/real-id", "/app/treinos"), true);
  assert.equal(navigation.desktopNavigationActive("/app/exercicios/real-id", "/app/treinos"), true);
  assert.equal(navigation.desktopNavigationActive("/app/perfil/editar", "/app/perfil"), true);
  assert.equal(navigation.desktopNavigationActive("/app/treinos-outro", "/app/treinos"), false);
  assert.equal(navigation.desktopNavigationActive("/admin", "/app/mais"), false);
});

test("desktop header derives context from route without viewport sniffing", () => {
  assert.equal(navigation.desktopPageContext("/app/perfil/editar"), "Editar perfil");
  assert.equal(navigation.desktopPageContext("/app/exercicios/real-id"), "Exercício");
  assert.equal(navigation.desktopPageContext("/app/notificacoes"), "Notificações");
  assert.equal(navigation.desktopPageContext("/app/alimentacao/receitas/real-id"), "Alimentação");
});

test("desktop CSS changes layout only from 768px; mobile additions are layout-neutral", async () => {
  const css = await readFile(new URL("../src/app/(client)/client-desktop.css", import.meta.url), "utf8");
  const preamble = css.slice(0, css.indexOf("@media"));
  assert.match(preamble, /\.client-desktop-only\s*\{ display: none; \}/);
  assert.match(preamble, /\.client-workspace\s*\{ display: contents; \}/);
  assert.equal((preamble.match(/\{/g) || []).length, 2);
  for (const breakpoint of css.matchAll(/@media\s*\(min-width:\s*(\d+)px\)/g)) assert.ok(Number(breakpoint[1]) >= 768);
  assert.doesNotMatch(css, /max-width:\s*767px|\.admin-|\.splash-|\.login-/);
});

test("desktop shell reuses logout and the server-authenticated profile instead of new data queries", async () => {
  const sidebar = await readFile(new URL("../src/components/layout/desktop-sidebar.tsx", import.meta.url), "utf8");
  const header = await readFile(new URL("../src/components/layout/desktop-header.tsx", import.meta.url), "utf8");
  assert.match(sidebar, /<LogoutButton\s*\/>/);
  assert.match(sidebar, /\/assets\/branding\/erlany-fit-logo\.png/);
  assert.match(header, /<ProfileAvatar account=\{account\}/);
  assert.doesNotMatch(sidebar + header, /supabase|navigator\.userAgent|window\.innerWidth|localStorage/);
});
