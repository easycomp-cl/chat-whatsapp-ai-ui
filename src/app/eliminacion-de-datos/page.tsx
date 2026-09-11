import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { ContactCard } from "@/components/legal/contact-card";
import { LegalSection } from "@/components/legal/legal-section";
import { TableOfContents } from "@/components/legal/table-of-contents";
import { buildLegalMetadata } from "@/lib/legal/metadata";
import { LEGAL_PRIVACY_EMAIL } from "@/lib/legal/constants";
import Link from "next/link";

export const metadata = buildLegalMetadata({
  title: "Eliminación de datos | easycomp-chat-bot-manager",
  description:
    "Instrucciones para solicitar la eliminación de datos personales asociados a easycomp-chat-bot-manager, operado por EasyComp.",
  path: "/eliminacion-de-datos",
});

const DELETION_TOC = [
  { id: "introduccion", label: "Introducción" },
  { id: "que-datos", label: "Qué datos pueden eliminarse" },
  { id: "diferencias", label: "Diferencias entre tipos de eliminación" },
  { id: "instrucciones", label: "Cómo solicitar la eliminación" },
  { id: "excepciones", label: "Excepciones y conservación" },
  { id: "estado-solicitud", label: "Estado de la solicitud" },
  { id: "nota-tecnica", label: "Nota técnica Meta" },
  { id: "contacto", label: "Contacto" },
] as const;

export default function DataDeletionPage() {
  return (
    <LegalPageLayout
      title="Eliminación de datos de easycomp-chat-bot-manager"
      subtitle="Instrucciones públicas para solicitar la eliminación de datos personales asociados a la plataforma easycomp-chat-bot-manager, operada bajo la marca EasyComp."
      relatedLinks={[
        { href: "/politica-de-privacidad", label: "Política de privacidad" },
      ]}
    >
      <TableOfContents items={[...DELETION_TOC]} />

      <LegalSection id="introduccion" title="1. Introducción">
        <p>
          Esta página describe cómo solicitar la eliminación de datos personales
          tratados por easycomp-chat-bot-manager. Para información general sobre privacidad, consulte
          la{" "}
          <Link
            href="/politica-de-privacidad"
            className="text-[var(--chat-primary)] underline-offset-2 hover:underline"
          >
            Política de privacidad
          </Link>
          .
        </p>
        <p>
          Según su relación con la plataforma, la solicitud puede tramitarse
          directamente con easycomp-chat-bot-manager o coordinarse con la empresa cliente que actúa
          como responsable del tratamiento respecto de sus contactos.
        </p>
      </LegalSection>

      <LegalSection id="que-datos" title="2. Qué datos pueden eliminarse">
        <p>
          Dependiendo de su rol y de la configuración del servicio, puede solicitar la
          eliminación de datos como:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>datos de cuenta de usuario (nombre, correo, perfil, permisos);</li>
          <li>datos de organización o negocio asociados;</li>
          <li>tokens, credenciales o metadatos de integración con Meta / WhatsApp;</li>
          <li>datos obtenidos mediante Facebook Login for Business o Embedded Signup;</li>
          <li>conversaciones, mensajes y notas asociadas;</li>
          <li>archivos adjuntos, imágenes, audios y documentos;</li>
          <li>plantillas y configuraciones vinculadas a una integración;</li>
          <li>registros técnicos vinculados a su cuenta, cuando proceda.</li>
        </ul>
        <p>
          No todos los datos pueden eliminarse de inmediato en todos los casos. Algunos
          registros pueden conservarse por obligaciones legales, contractuales, de
          seguridad o respaldo, según se indica más abajo.
        </p>
      </LegalSection>

      <LegalSection id="diferencias" title="3. Diferencias entre tipos de eliminación">
        <p>Es importante distinguir las siguientes acciones:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Eliminar cuenta de usuario:</strong> suprime o desactiva el acceso de
            un usuario a easycomp-chat-bot-manager. Puede no eliminar automáticamente todos los datos de
            la organización si otros usuarios siguen activos.
          </li>
          <li>
            <strong>Eliminar organización:</strong> afecta a la empresa cliente y a los
            datos asociados a su operación en la plataforma. Requiere verificación de
            autoridad sobre la organización.
          </li>
          <li>
            <strong>Desconectar integración con Meta:</strong> revoca la conexión activa
            con WhatsApp Business Platform, pero no necesariamente borra el historial ya
            almacenado.
          </li>
          <li>
            <strong>Eliminar datos de Facebook Login:</strong> se refiere a datos de
            autenticación o perfil básico obtenidos al iniciar sesión o conectar con
            Meta. Puede requerir acciones adicionales en Meta.
          </li>
          <li>
            <strong>Eliminar conversaciones:</strong> borra o anonimiza mensajes e
            historial de contactos, sujeto a políticas de retención y obligaciones
            legales.
          </li>
          <li>
            <strong>Eliminar archivos:</strong> afecta medios adjuntos almacenados en
            relación con mensajes o cargas del cliente.
          </li>
          <li>
            <strong>Eliminar plantillas:</strong> puede referirse a registros en
            easycomp-chat-bot-manager y/o a plantillas en Meta; no siempre son equivalentes.
          </li>
          <li>
            <strong>Eliminar logs:</strong> registros técnicos de seguridad, errores o
            auditoría pueden conservarse por un período adicional, incluso tras eliminar
            otros datos.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="instrucciones" title="4. Cómo solicitar la eliminación">
        <p>
          Mientras no exista una función automatizada completa dentro de la aplicación,
          utilice el siguiente procedimiento:
        </p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            Envíe un correo a{" "}
            <a
              href={`mailto:${LEGAL_PRIVACY_EMAIL}?subject=${encodeURIComponent("Solicitud de eliminación de datos - easycomp-chat-bot-manager")}`}
              className="text-[var(--chat-primary)] underline-offset-2 hover:underline"
            >
              {LEGAL_PRIVACY_EMAIL}
            </a>
            .
          </li>
          <li>
            Asunto: <strong>Solicitud de eliminación de datos - easycomp-chat-bot-manager</strong>.
          </li>
          <li>Indique su nombre y el correo asociado a la cuenta.</li>
          <li>Indique la empresa u organización relacionada, si corresponde.</li>
          <li>
            Indique el número de WhatsApp o activo de Meta relacionado, si aplica.
          </li>
          <li>Describa con claridad los datos que desea eliminar.</li>
          <li>
            <strong>No envíe</strong> contraseñas, tokens, códigos de verificación ni
            documentos sensibles por correo.
          </li>
        </ol>
        <p>Tras recibir la solicitud:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>easycomp-chat-bot-manager confirmará su recepción por el mismo medio de contacto;</li>
          <li>
            easycomp-chat-bot-manager podrá solicitar una verificación de identidad proporcional al
            riesgo;
          </li>
          <li>
            la solicitud será respondida dentro del plazo legal aplicable (hasta 30 días
            corridos, prorrogable una vez cuando legalmente proceda).
          </li>
        </ul>
        <p>
          Si la solicitud corresponde a datos de los que una empresa cliente es
          responsable (por ejemplo, mensajes de sus consumidores), easycomp-chat-bot-manager podrá
          derivar o coordinar la gestión con dicha empresa.
        </p>
        <p>
          También puede utilizar mecanismos de eliminación ofrecidos por Meta cuando
          correspondan a datos gestionados directamente en sus plataformas.
        </p>
      </LegalSection>

      <LegalSection id="excepciones" title="5. Excepciones y conservación">
        <p>
          Aun habiendo solicitado la eliminación, algunos datos pueden conservarse
          cuando exista una base legítima para ello, por ejemplo:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>cumplimiento de obligaciones legales o regulatorias;</li>
          <li>registros de facturación y contabilidad;</li>
          <li>prevención de fraude y seguridad de la plataforma;</li>
          <li>defensa ante reclamaciones o procedimientos legales;</li>
          <li>copias de respaldo que se eliminan en ciclos programados;</li>
          <li>
            datos anonimizados que ya no permiten identificar a una persona de manera
            razonable.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="estado-solicitud" title="6. Estado de la solicitud">
        <p>
          [COMPLETAR: descripción del código o estado de solicitud cuando el backend
          implemente seguimiento de eliminación de datos]
        </p>
        <p>
          Actualmente las solicitudes se gestionan por correo y la confirmación se
          entrega por el mismo canal de contacto utilizado en la solicitud.
        </p>
      </LegalSection>

      <LegalSection id="nota-tecnica" title="7. Nota técnica Meta">
        <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950">
          Esta página contiene instrucciones públicas. El callback técnico de
          eliminación de datos de Meta se implementará y configurará separadamente en
          el backend.
        </p>
      </LegalSection>

      <LegalSection id="contacto" title="8. Contacto">
        <ContactCard showDeletionLink={false} />
      </LegalSection>
    </LegalPageLayout>
  );
}
