export type Account = {
  id: string; clientId: string; name: string; email: string; role: string;
  avatarPath: string | null; avatarUrl: string | null; avatarError: boolean;
};
export type MembershipPlan = { id: string; name: string; description: string | null; priceCents: number; currency: string };
export type ActionResult = { ok: boolean; message: string };
