import {
  listBusinessCustomersAction,
} from "@/lib/actions/customer-profile-actions";
import { requireAppAccess } from "@/lib/auth/session";
import { CustomersManager } from "@/features/customers/components/customers-manager";

export async function CustomersPageContent() {
  const profile = await requireAppAccess();
  const customers = await listBusinessCustomersAction();

  return (
    <CustomersManager
      businessId={profile.business_id!}
      customers={customers}
    />
  );
}
