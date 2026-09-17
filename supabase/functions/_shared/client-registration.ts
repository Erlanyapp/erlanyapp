export interface ClientRegistration { name: string; email: string; password: string }

// Shared allowlist: no role, user ID, plan or arbitrary metadata from the form.
export function clientRegistration(input: Record<string, unknown>): ClientRegistration {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";
  if (name.length < 2 || name.length > 100) throw new Error("Informe um nome entre 2 e 100 caracteres.");
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Informe um e-mail válido.");
  if (email === "erlanyoliveira95@gmail.com") throw new Error("A conta administrativa não pode ser criada neste formulário.");
  if (password.length < 12 || password.length > 128 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    throw new Error("Use uma senha inicial de 12 a 128 caracteres com maiúscula, minúscula e número.");
  }
  if (input.confirmed !== true) throw new Error("Confirme que validou o e-mail e que entregará a senha por um canal seguro.");
  return { name, email, password };
}
