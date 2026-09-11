import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { buildLegalMetadata } from "@/lib/legal/metadata";
import { PrivacyPolicyContent } from "@/lib/legal/privacy-policy-content";

export const metadata = buildLegalMetadata({
  title: "Política de privacidad | easycomp-chat-bot-manager",
  description:
    "Política de privacidad de easycomp-chat-bot-manager, plataforma de atención al cliente y automatización de conversaciones operada por EasyComp.",
  path: "/politica-de-privacidad",
});

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      title="Política de privacidad"
      subtitle="Información sobre el tratamiento de datos personales en easycomp-chat-bot-manager, operado bajo la marca EasyComp, conforme a la legislación chilena aplicable."
      relatedLinks={[
        { href: "/eliminacion-de-datos", label: "Eliminación de datos" },
      ]}
    >
      <PrivacyPolicyContent />
    </LegalPageLayout>
  );
}
