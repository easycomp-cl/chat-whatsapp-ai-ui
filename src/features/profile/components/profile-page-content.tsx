import { PageHeader } from "@/components/layout/page-header";
import { MyProfileForm } from "@/features/profile/components/my-profile-form";
import { getMyProfileAction } from "@/lib/actions/profile-actions";

export async function ProfilePageContent() {
  const profile = await getMyProfileAction();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mi Perfil"
        description="Administra tu nombre, teléfono y datos de contacto personal"
      />
      <MyProfileForm initial={profile} />
    </div>
  );
}
