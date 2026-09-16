import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/supabase/admin";
import { createAdminService } from "@/services/admin-service";
import "./admin-crm.css";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const {client,user}=await requireAdmin();
  const administrator=await createAdminService(client).getAdministrator(user.id,user.email);
  return <AdminShell administrator={administrator}>{children}</AdminShell>;
}
