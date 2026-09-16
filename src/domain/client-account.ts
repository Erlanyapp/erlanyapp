export const MAX_AVATAR_BYTES = 4 * 1024 * 1024;
export function validateName(value: unknown): string {
  const name = typeof value === "string" ? value.trim() : "";
  if (name.length < 2 || name.length > 100) throw new Error("Informe um nome entre 2 e 100 caracteres.");
  return name;
}
export function validateWeight(value: unknown, date: unknown, today = new Date().toISOString().slice(0, 10)) {
  const weight = typeof value === "string" ? Number(value.replace(",", ".")) : Number.NaN;
  if (!Number.isFinite(weight) || weight <= 0 || weight > 500) throw new Error("Informe um peso válido entre 0 e 500 kg.");
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date || date > today) {
    throw new Error("Informe uma data válida, não futura.");
  }
  return { value: weight, recordedAt: date };
}
export function avatarFormat(bytes: Uint8Array, mime: string) {
  if (!bytes.length || bytes.length > MAX_AVATAR_BYTES) throw new Error("A foto deve ter no máximo 4 MB.");
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every((b, i) => bytes[i] === b);
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const webp = String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (mime === "image/png" && png) return "png";
  if (mime === "image/jpeg" && jpeg) return "jpg";
  if (mime === "image/webp" && webp) return "webp";
  throw new Error("Escolha uma foto PNG, JPEG ou WebP válida.");
}
export function ownAvatarPath(path: string | null, userId: string) {
  return !!path && path.startsWith(`avatars/${userId}/`) && !path.includes("..") && !path.includes("\\");
}
