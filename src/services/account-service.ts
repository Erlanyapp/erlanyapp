import { randomUUID } from "node:crypto";
import type { createAccountRepository } from "@/repositories/account-repository";
import type { Account } from "@/types/account";
import { avatarFormat, MAX_AVATAR_BYTES, validateName, validateWeight } from "@/domain/client-account";

export function createAccountService(repository: ReturnType<typeof createAccountRepository>) {
  return {
    account: repository.account,
    achievements: repository.achievements,
    notifications: repository.notifications,
    messages: repository.messages,
    plans: repository.plans,
    async saveProfile(account: Account, form: FormData) {
      const name = validateName(form.get("name"));
      const photo = form.get("photo");
      let newPath: string | undefined;
      if (photo instanceof File && photo.name) {
        if (photo.size > MAX_AVATAR_BYTES) throw new Error("A foto deve ter no máximo 4 MB.");
        const bytes = new Uint8Array(await photo.arrayBuffer());
        const extension = avatarFormat(bytes, photo.type);
        newPath = `avatars/${account.id}/${randomUUID()}.${extension}`;
        await repository.uploadAvatar(newPath, bytes, photo.type);
      }
      try { await repository.updateProfile(account.id, name, newPath); }
      catch (error) {
        if (newPath) await repository.removeFailedUpload(newPath).catch(() => undefined);
        throw error;
      }
    },
    async saveWeight(account: Account, form: FormData) {
      const weight = validateWeight(form.get("weight"), form.get("date"));
      await repository.recordWeight(account.clientId, weight.value, weight.recordedAt);
    },
    async contact(account: Account, form: FormData) {
      const message = String(form.get("message") ?? "").trim();
      if (message.length < 3 || message.length > 2000) throw new Error("A mensagem deve ter entre 3 e 2000 caracteres.");
      await repository.sendMessage(account, message);
    },
  };
}
