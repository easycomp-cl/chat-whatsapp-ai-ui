import Link from "next/link";
import { ContactCard } from "@/components/legal/contact-card";
import { LegalSection } from "@/components/legal/legal-section";
import { LegalTable, LegalTableRow } from "@/components/legal/legal-table";
import { TableOfContents } from "@/components/legal/table-of-contents";
import {
  LEGAL_BRAND_NAME,
  LEGAL_COMMERCIAL_ADDRESS,
  LEGAL_COUNTRY,
  LEGAL_GENERAL_EMAIL,
  LEGAL_LAST_UPDATED,
  LEGAL_LEGAL_ENTITY,
  LEGAL_META_APP_NAME,
  LEGAL_PRIVACY_EMAIL,
  LEGAL_PRODUCT_NAME,
  LEGAL_VERSION,
} from "@/lib/legal/constants";

export const PRIVACY_TOC = [
  { id: "responsable", label: "Identificación del responsable" },
  { id: "alcance", label: "Alcance de la política" },
  { id: "datos", label: "Datos que se pueden tratar" },
  { id: "fuentes", label: "Fuentes de los datos" },
  { id: "finalidades", label: "Finalidades" },
  { id: "bases-licitud", label: "Bases de licitud" },
  { id: "meta-whatsapp", label: "Datos de Meta y WhatsApp" },
  { id: "ia", label: "Inteligencia artificial y automatización" },
  { id: "datos-sensibles", label: "Datos sensibles" },
  { id: "cookies", label: "Cookies y almacenamiento local" },
  { id: "proveedores", label: "Proveedores y subencargados" },
  { id: "transferencias", label: "Transferencias internacionales" },
  { id: "conservacion", label: "Conservación" },
  { id: "seguridad", label: "Seguridad" },
  { id: "derechos", label: "Derechos de las personas" },
  { id: "eliminacion", label: "Eliminación de datos" },
  { id: "menores", label: "Niños, niñas y adolescentes" },
  { id: "cliente-empresarial", label: "Responsabilidades del cliente empresarial" },
  { id: "cambios", label: "Cambios a la política" },
  { id: "contacto", label: "Contacto" },
] as const;

export function PrivacyPolicyContent() {
  return (
    <>
      <TableOfContents items={[...PRIVACY_TOC]} />

      <LegalSection id="responsable" title="1. Identificación del responsable">
        <p>
          La presente política describe el tratamiento de datos personales
          realizado en relación con <strong>{LEGAL_PRODUCT_NAME}</strong>, plataforma
          de atención al cliente y automatización de conversaciones operada bajo la
          marca comercial <strong>{LEGAL_BRAND_NAME}</strong>.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Responsable legal:</strong> {LEGAL_LEGAL_ENTITY}
          </li>
          <li>
            <strong>País:</strong> {LEGAL_COUNTRY}
          </li>
          <li>
            <strong>Domicilio comercial:</strong> {LEGAL_COMMERCIAL_ADDRESS}
          </li>
          <li>
            <strong>Correo de contacto general:</strong>{" "}
            <a
              href={`mailto:${LEGAL_GENERAL_EMAIL}`}
              className="text-[var(--chat-primary)] underline-offset-2 hover:underline"
            >
              {LEGAL_GENERAL_EMAIL}
            </a>
          </li>
          <li>
            <strong>Correo para privacidad:</strong>{" "}
            <a
              href={`mailto:${LEGAL_PRIVACY_EMAIL}`}
              className="text-[var(--chat-primary)] underline-offset-2 hover:underline"
            >
              {LEGAL_PRIVACY_EMAIL}
            </a>
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="alcance" title="2. Alcance de la política">
        <p>Esta política aplica al tratamiento de datos personales en relación con:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>usuarios empresariales que contratan o utilizan {LEGAL_PRODUCT_NAME};</li>
          <li>administradores, colaboradores y agentes autorizados por una empresa cliente;</li>
          <li>
            personas que se comunican con una empresa cliente a través de canales
            conectados a la plataforma (por ejemplo, WhatsApp);
          </li>
          <li>visitantes del sitio web o aplicación asociada a {LEGAL_PRODUCT_NAME};</li>
          <li>
            personas que utilizan el inicio de sesión o la conexión con Meta para
            vincular cuentas de WhatsApp Business.
          </li>
        </ul>
        <p>
          <strong>Roles en el tratamiento.</strong> En términos generales:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>{LEGAL_BRAND_NAME}/{LEGAL_PRODUCT_NAME}</strong> actúa como{" "}
            <em>responsable del tratamiento</em> respecto de los datos necesarios para
            crear y administrar cuentas, autenticar usuarios, gestionar organizaciones
            y permisos, mantener seguridad y registros técnicos, prestar soporte,
            facturar y comunicarse con sus clientes empresariales.
          </li>
          <li>
            Respecto de las conversaciones entre una empresa cliente y sus propios
            consumidores o contactos, la <strong>empresa cliente</strong> normalmente
            actúa como responsable del tratamiento y{" "}
            <strong>{LEGAL_PRODUCT_NAME}</strong> normalmente actúa como tercero
            mandatario o encargado del tratamiento, procesando datos conforme a las
            instrucciones y configuración del cliente.
          </li>
        </ul>
        <p>
          Esta distribución de roles puede variar si un contrato u operación específica
          determina algo diferente.
        </p>
        <p>
          Las empresas clientes deben mantener sus propias políticas de privacidad
          frente a sus consumidores y contactos, informando sobre el uso de
          herramientas como {LEGAL_PRODUCT_NAME} cuando corresponda.
        </p>
      </LegalSection>

      <LegalSection id="datos" title="3. Datos que se pueden tratar">
        <p>
          Según la configuración del servicio, el tipo de interacción y las
          integraciones habilitadas, {LEGAL_PRODUCT_NAME} puede recibir, procesar
          temporalmente o conservar las categorías siguientes. No todos los datos
          listados se almacenan en todos los casos.
        </p>
        <LegalTable
          caption="Categorías de datos personales tratados"
          headers={["Categoría", "Ejemplos", "Origen", "Finalidad principal"]}
        >
          <LegalTableRow
            cells={[
              "Datos de cuenta",
              <ul key="cuenta-ej">
                <li>Nombre y correo</li>
                <li>Teléfono</li>
                <li>Organización, cargo o rol</li>
                <li>Identificadores de autenticación y permisos</li>
                <li>Configuración de cuenta</li>
              </ul>,
              "La propia persona; la empresa cliente; sistemas de autenticación",
              "Crear y administrar cuentas, autenticar, asignar permisos y prestar el servicio",
            ]}
          />
          <LegalTableRow
            cells={[
              "Datos obtenidos mediante Meta",
              <ul key="meta-ej">
                <li>Identificador básico del usuario</li>
                <li>Nombre y perfil básico autorizado</li>
                <li>Business Manager ID, WABA ID, Phone Number ID</li>
                <li>Números empresariales y permisos concedidos</li>
                <li>Estado de conexión, plantillas y webhooks técnicos</li>
              </ul>,
              "Meta / WhatsApp Business Platform; autorización del usuario o negocio",
              "Conectar cuentas, enviar y recibir mensajes, administrar plantillas y mantener la integración",
            ]}
          />
          <LegalTableRow
            cells={[
              "Datos de conversaciones",
              <ul key="conv-ej">
                <li>Nombre o nombre de perfil y número telefónico</li>
                <li>Identificadores de contacto</li>
                <li>Mensajes de texto, notas de voz, imágenes, documentos y adjuntos</li>
                <li>Fecha, hora y estados de envío, entrega y lectura</li>
                <li>Etiquetas, historial de asignación y respuestas de bot o agentes</li>
              </ul>,
              "Meta / WhatsApp; la empresa cliente; agentes humanos; automatizaciones configuradas",
              "Administrar conversaciones, historial, asignación, respuestas asistidas y continuidad del servicio",
            ]}
          />
          <LegalTableRow
            cells={[
              "Datos técnicos",
              <ul key="tec-ej">
                <li>Dirección IP, navegador y sistema operativo</li>
                <li>Identificadores de sesión</li>
                <li>Registros de seguridad, errores, auditoría y uso</li>
              </ul>,
              "Sistemas técnicos de la plataforma; navegador del usuario",
              "Seguridad, diagnóstico, prevención de fraude y mejora operativa",
            ]}
          />
          <LegalTableRow
            cells={[
              "Datos comerciales",
              <ul key="com-ej">
                <li>Plan contratado</li>
                <li>Facturación y pagos</li>
                <li>Solicitudes de soporte</li>
                <li>Comunicaciones contractuales</li>
              </ul>,
              "La empresa cliente; proveedores de pago; interacciones de soporte",
              "Gestionar la relación contractual, facturación y soporte",
            ]}
          />
        </LegalTable>
        <p>
          Si el pago es procesado íntegramente por un proveedor externo,{" "}
          {LEGAL_PRODUCT_NAME} puede recibir únicamente confirmaciones o metadatos de
          pago, sin almacenar datos completos de tarjetas, salvo que ello quede
          expresamente documentado en el contrato aplicable.{" "}
          <strong>[COMPLETAR: proveedor de pagos y datos exactos recibidos]</strong>
        </p>
      </LegalSection>

      <LegalSection id="fuentes" title="4. Fuentes de los datos">
        <p>Los datos personales pueden provenir de:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>la propia persona titular;</li>
          <li>la empresa cliente que utiliza {LEGAL_PRODUCT_NAME};</li>
          <li>Meta y la WhatsApp Business Platform;</li>
          <li>integraciones autorizadas por el cliente;</li>
          <li>webhooks y eventos técnicos de terceros conectados;</li>
          <li>sistemas técnicos de {LEGAL_PRODUCT_NAME} (logs, auditoría, seguridad);</li>
          <li>proveedores contratados que prestan servicios a {LEGAL_PRODUCT_NAME};</li>
          <li>
            fuentes públicas, únicamente cuando exista una base jurídica válida para
            su uso.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="finalidades" title="5. Finalidades">
        <p>{LEGAL_PRODUCT_NAME} trata datos personales para finalidades concretas, entre ellas:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>prestar, configurar y mantener el servicio;</li>
          <li>autenticar usuarios y controlar accesos;</li>
          <li>conectar cuentas de Meta y WhatsApp Business;</li>
          <li>recibir, enviar y administrar mensajes y conversaciones;</li>
          <li>generar respuestas asistidas por inteligencia artificial;</li>
          <li>clasificar intenciones o conversaciones según reglas configuradas;</li>
          <li>enviar plantillas autorizadas por Meta;</li>
          <li>asignar conversaciones a agentes humanos;</li>
          <li>mantener historial y continuidad operativa;</li>
          <li>prevenir fraude, abuso y accesos no autorizados;</li>
          <li>diagnosticar y solucionar errores;</li>
          <li>prestar soporte técnico y comercial;</li>
          <li>cumplir contratos con clientes empresariales;</li>
          <li>cumplir obligaciones legales aplicables;</li>
          <li>
            mejorar el servicio mediante información agregada o anonimizada, cuando
            corresponda y esté permitido.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="bases-licitud" title="6. Bases de licitud">
        <p>
          Según la naturaleza del tratamiento y el rol de {LEGAL_PRODUCT_NAME}, la
          base jurídica puede incluir, entre otras:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Consentimiento</strong>, cuando la persona lo otorga de forma
            libre, específica e informada (por ejemplo, al autorizar una integración).
          </li>
          <li>
            <strong>Ejecución de un contrato</strong> o medidas precontractuales, para
            prestar el servicio contratado por la empresa cliente o administrar su cuenta.
          </li>
          <li>
            <strong>Cumplimiento de obligaciones legales</strong> aplicables a{" "}
            {LEGAL_BRAND_NAME} o a la empresa cliente, según corresponda.
          </li>
          <li>
            <strong>Interés legítimo</strong>, sujeto a evaluación y respeto de los
            derechos del titular (por ejemplo, seguridad, prevención de fraude o mejora
            operativa con salvaguardas).
          </li>
          <li>
            <strong>Instrucciones documentadas del cliente responsable</strong>, cuando{" "}
            {LEGAL_PRODUCT_NAME} actúa como encargado del tratamiento respecto de datos
            de contactos finales.
          </li>
        </ul>
        <p>
          El consentimiento no es la única base aplicable a todos los tratamientos
          realizados por la plataforma.
        </p>
      </LegalSection>

      <LegalSection id="meta-whatsapp" title="7. Datos de Meta y WhatsApp">
        <p>
          La aplicación de Meta asociada a {LEGAL_PRODUCT_NAME} tiene el nombre
          técnico <strong>{LEGAL_META_APP_NAME}</strong>. Para conectar y operar
          WhatsApp Business, puede solicitarse autorización para permisos como:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>public_profile:</strong> permite acceder a información básica del
            perfil autorizado (por ejemplo, nombre e identificador), necesaria para
            identificar la cuenta que realiza la conexión.
          </li>
          <li>
            <strong>business_management:</strong> permite administrar activos
            empresariales vinculados en Meta, como cuentas y configuraciones necesarias
            para la integración.
          </li>
          <li>
            <strong>whatsapp_business_management:</strong> permite gestionar la cuenta
            de WhatsApp Business, números, plantillas y configuraciones asociadas.
          </li>
          <li>
            <strong>whatsapp_business_messaging:</strong> permite enviar y recibir
            mensajes a través de la WhatsApp Business Platform conforme a las reglas de
            Meta.
          </li>
        </ul>
        <p>
          El usuario o negocio debe autorizar expresamente la conexión. La autorización
          puede revocarse desde Meta o desconectando la integración en{" "}
          {LEGAL_PRODUCT_NAME}. Revocar permisos o desconectar una integración no
          implica necesariamente la eliminación inmediata de todos los datos ya
          tratados, cuando existan obligaciones legales, contractuales, de seguridad o
          de respaldo que exijan su conservación por un período determinado.
        </p>
        <p>
          Las políticas, términos y reglas de Meta y WhatsApp también resultan
          aplicables al uso de esos servicios.
        </p>
      </LegalSection>

      <LegalSection id="ia" title="8. Inteligencia artificial y automatización">
        <p>
          {LEGAL_PRODUCT_NAME} puede utilizar automatización e inteligencia artificial
          para, entre otras funciones:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>analizar mensajes entrantes;</li>
          <li>detectar intención o clasificar solicitudes;</li>
          <li>buscar información empresarial configurada por el cliente;</li>
          <li>sugerir o generar respuestas;</li>
          <li>resumir conversaciones;</li>
          <li>activar flujos configurados por la empresa cliente.</li>
        </ul>
        <p>
          Las respuestas generadas por IA pueden contener errores o imprecisiones. La
          empresa cliente es responsable de revisar configuraciones, contenidos y
          respuestas relevantes para su operación. Una conversación puede derivarse a
          un agente humano cuando el cliente lo configure o cuando la situación lo
          requiera.
        </p>
        <p>
          No deben adoptarse decisiones automatizadas con efectos jurídicos o
          significativamente adversos para las personas sin la evaluación, información
          y salvaguardas que correspondan. Cuando proceda, la persona puede solicitar
          intervención humana.
        </p>
        <p>
          <strong>Proveedor de inteligencia artificial:</strong>{" "}
          [COMPLETAR: proveedor, país, condiciones de retención y entrenamiento].
          Según la documentación interna del proyecto, el backend puede utilizar servicios
          compatibles con OpenAI para ciertas funciones, pero las condiciones
          contractuales, de retención y de uso de datos para entrenamiento deben
          confirmarse antes de publicar una afirmación definitiva.
        </p>
      </LegalSection>

      <LegalSection id="datos-sensibles" title="9. Datos sensibles">
        <p>
          {LEGAL_PRODUCT_NAME} no está diseñado para solicitar datos sensibles de forma
          innecesaria. No obstante, una persona podría incluirlos voluntariamente en
          una conversación (por ejemplo, información de salud, biométrica o financiera).
        </p>
        <p>
          La empresa cliente debe evitar recolectar datos sensibles salvo que sean
          estrictamente necesarios, contar con una base jurídica válida y aplicar
          medidas reforzadas de protección. {LEGAL_PRODUCT_NAME} puede aplicar
          restricciones adicionales para determinadas categorías protegidas según la
          configuración del servicio y las instrucciones del cliente.
        </p>
      </LegalSection>

      <LegalSection id="cookies" title="10. Cookies y almacenamiento local">
        <p>
          {LEGAL_PRODUCT_NAME} utiliza cookies y tecnologías similares según sea
          necesario para operar la plataforma. A continuación se describen categorías
          identificadas en la arquitectura actual:
        </p>
        <LegalTable
          caption="Cookies y almacenamiento utilizados"
          headers={["Categoría", "Descripción", "Ejemplos / notas"]}
        >
          <LegalTableRow
            cells={[
              "Necesarias",
              "Permiten el funcionamiento básico del sitio y la navegación segura.",
              "Cookies técnicas asociadas a Next.js y al entorno de ejecución.",
            ]}
          />
          <LegalTableRow
            cells={[
              "Autenticación",
              "Mantienen la sesión del usuario autenticado.",
              "Cookies de sesión de Supabase Auth (prefijo típico sb-).",
            ]}
          />
          <LegalTableRow
            cells={[
              "Seguridad",
              "Ayudan a proteger accesos y detectar uso indebido.",
              "[COMPLETAR: cookies o mecanismos adicionales de seguridad, si aplica]",
            ]}
          />
          <LegalTableRow
            cells={[
              "Preferencias",
              "Recuerdan configuraciones del usuario en el navegador.",
              "localStorage para preferencias de composición de chat y notificaciones en la UI.",
            ]}
          />
          <LegalTableRow
            cells={[
              "Analítica",
              "Miden uso agregado del servicio, si se habilita.",
              "[COMPLETAR: herramienta de analítica, si existe]",
            ]}
          />
        </LegalTable>
        <p>
          Si se incorporan cookies no esenciales, se implementará el mecanismo de
          consentimiento correspondiente conforme a la normativa aplicable.{" "}
          [COMPLETAR: mecanismo de consentimiento de cookies, si aplica]
        </p>
      </LegalSection>

      <LegalSection id="proveedores" title="11. Proveedores y subencargados">
        <p>
          {LEGAL_PRODUCT_NAME} puede apoyarse en proveedores que tratan datos por
          cuenta de {LEGAL_BRAND_NAME} o de la empresa cliente, según el caso:
        </p>
        <LegalTable
          caption="Proveedores y subencargados"
          headers={[
            "Proveedor",
            "Servicio",
            "Categorías de datos",
            "Ubicación / región",
            "Finalidad",
            "Política",
          ]}
        >
          <LegalTableRow
            cells={[
              "Meta / WhatsApp",
              "WhatsApp Business Platform",
              "Datos de perfil, mensajería, plantillas, identificadores de negocio",
              "Estados Unidos y otras regiones según Meta",
              "Envío, recepción y administración de mensajes",
              <a
                key="meta-pol"
                href="https://www.whatsapp.com/legal/privacy-policy"
                className="text-[var(--chat-primary)] underline-offset-2 hover:underline"
                rel="noopener noreferrer"
                target="_blank"
              >
                Política de WhatsApp
              </a>,
            ]}
          />
          <LegalTableRow
            cells={[
              "Vercel",
              "Hosting y funciones serverless de la UI",
              "Datos técnicos, registros de solicitudes",
              "Brasil (gru1) y otras regiones de Vercel",
              "Despliegue y ejecución de la aplicación web",
              <a
                key="vercel-pol"
                href="https://vercel.com/legal/privacy-policy"
                className="text-[var(--chat-primary)] underline-offset-2 hover:underline"
                rel="noopener noreferrer"
                target="_blank"
              >
                Política de Vercel
              </a>,
            ]}
          />
          <LegalTableRow
            cells={[
              "Supabase",
              "Autenticación, base de datos y tiempo real",
              "Datos de cuenta, conversaciones, registros técnicos",
              "sa-east-1 (São Paulo)",
              "Autenticación, almacenamiento y sincronización",
              <a
                key="supabase-pol"
                href="https://supabase.com/privacy"
                className="text-[var(--chat-primary)] underline-offset-2 hover:underline"
                rel="noopener noreferrer"
                target="_blank"
              >
                Política de Supabase
              </a>,
            ]}
          />
          <LegalTableRow
            cells={[
              "Amazon Web Services (AWS)",
              "Infraestructura de backend (ECS u otros servicios)",
              "Datos procesados por la API del bot y componentes asociados",
              "sa-east-1 (São Paulo)",
              "Procesamiento de lógica de negocio y servicios backend",
              <a
                key="aws-pol"
                href="https://aws.amazon.com/privacy/"
                className="text-[var(--chat-primary)] underline-offset-2 hover:underline"
                rel="noopener noreferrer"
                target="_blank"
              >
                Política de AWS
              </a>,
            ]}
          />
          <LegalTableRow
            cells={[
              "Upstash",
              "Redis (caché y colas)",
              "Datos temporales de procesamiento y colas",
              "sa-east-1 (São Paulo)",
              "Caché, colas y procesamiento temporal",
              <a
                key="upstash-pol"
                href="https://upstash.com/trust/privacy.pdf"
                className="text-[var(--chat-primary)] underline-offset-2 hover:underline"
                rel="noopener noreferrer"
                target="_blank"
              >
                Política de Upstash
              </a>,
            ]}
          />
          <LegalTableRow
            cells={[
              "[COMPLETAR: proveedor de IA]",
              "Procesamiento de lenguaje natural",
              "Contenido de mensajes y contexto enviado para generación o clasificación",
              "[COMPLETAR: país o región]",
              "Respuestas asistidas, clasificación y funciones de IA",
              "[COMPLETAR: enlace a política del proveedor]",
            ]}
          />
          <LegalTableRow
            cells={[
              "[COMPLETAR: proveedor de correo]",
              "Correo transaccional",
              "Correo, nombre y metadatos de notificaciones",
              "[COMPLETAR: país o región]",
              "Autenticación, recuperación de contraseña y notificaciones",
              "[COMPLETAR: enlace a política del proveedor]",
            ]}
          />
          <LegalTableRow
            cells={[
              "[COMPLETAR: proveedor de pagos]",
              "Procesamiento de pagos",
              "[COMPLETAR: categorías de datos]",
              "[COMPLETAR: país o región]",
              "Facturación y cobros",
              "[COMPLETAR: enlace a política del proveedor]",
            ]}
          />
          <LegalTableRow
            cells={[
              "[COMPLETAR: herramientas de monitoreo]",
              "Observabilidad y monitoreo",
              "[COMPLETAR: categorías de datos]",
              "[COMPLETAR: país o región]",
              "Diagnóstico, errores y rendimiento",
              "[COMPLETAR: enlace a política del proveedor]",
            ]}
          />
        </LegalTable>
      </LegalSection>

      <LegalSection id="transferencias" title="12. Transferencias internacionales">
        <p>
          Algunos proveedores pueden tratar información fuera de Chile, incluso cuando
          componentes principales estén desplegados en la región{" "}
          <strong>sa-east-1</strong> (São Paulo) o <strong>gru1</strong> (São Paulo en
          Vercel).
        </p>
        <p>
          Cuando corresponda, {LEGAL_BRAND_NAME} evaluará el nivel de protección del
          país o región de destino y aplicará garantías contractuales, técnicas u
          organizativas disponibles, incluyendo cláusulas con proveedores y medidas de
          seguridad razonables.{" "}
          [COMPLETAR: garantías contractuales específicas aplicables]
        </p>
        <p>
          Las transferencias se realizan con la finalidad de prestar el servicio
          contratado y operar integraciones necesarias (por ejemplo, Meta, infraestructura
          en la nube y servicios de IA).
        </p>
      </LegalSection>

      <LegalSection id="conservacion" title="13. Conservación">
        <p>
          Los datos se conservan durante el tiempo necesario para cumplir las
          finalidades descritas, las instrucciones del cliente y las obligaciones
          legales aplicables. Al terminar su finalidad, se eliminan o anonimizan, salvo
          excepciones legítimas (seguridad, respaldo, defensa de reclamaciones o
          obligaciones legales).
        </p>
        <LegalTable
          caption="Períodos de conservación"
          headers={["Categoría", "Período", "Notas"]}
        >
          <LegalTableRow
            cells={[
              "Cuentas de usuario",
              "[COMPLETAR: plazo técnico real]",
              "Mientras la cuenta esté activa y el tiempo adicional necesario tras su cierre.",
            ]}
          />
          <LegalTableRow
            cells={[
              "Organizaciones",
              "[COMPLETAR: plazo técnico real]",
              "Vinculado al contrato y obligaciones de facturación o soporte.",
            ]}
          />
          <LegalTableRow
            cells={[
              "Mensajes y conversaciones",
              "[COMPLETAR: plazo técnico real]",
              "Pueden conservarse según configuración del cliente y necesidades operativas.",
            ]}
          />
          <LegalTableRow
            cells={[
              "Archivos y medios",
              "[COMPLETAR: plazo técnico real]",
              "Asociados a mensajes o almacenamiento de medios.",
            ]}
          />
          <LegalTableRow
            cells={[
              "Logs técnicos",
              "[COMPLETAR: plazo técnico real]",
              "Seguridad, diagnóstico y auditoría.",
            ]}
          />
          <LegalTableRow
            cells={[
              "Webhooks y eventos",
              "[COMPLETAR: plazo técnico real]",
              "Procesamiento temporal o registro según implementación.",
            ]}
          />
          <LegalTableRow
            cells={[
              "Tokens de acceso",
              "[COMPLETAR: plazo técnico real]",
              "Hasta revocación o expiración; puede persistir registro de revocación.",
            ]}
          />
          <LegalTableRow
            cells={[
              "Respaldos",
              "[COMPLETAR: plazo técnico real]",
              "Eliminación mediante ciclos programados de rotación.",
            ]}
          />
          <LegalTableRow
            cells={[
              "Soporte",
              "[COMPLETAR: plazo técnico real]",
              "Tickets, correos y registros de atención.",
            ]}
          />
          <LegalTableRow
            cells={[
              "Facturación",
              "[COMPLETAR: plazo técnico real]",
              "Según obligaciones tributarias y contractuales en Chile.",
            ]}
          />
          <LegalTableRow
            cells={[
              "Solicitudes de privacidad",
              "[COMPLETAR: plazo técnico real]",
              "Registro de solicitudes y respuestas para cumplimiento y trazabilidad.",
            ]}
          />
        </LegalTable>
      </LegalSection>

      <LegalSection id="seguridad" title="14. Seguridad">
        <p>
          {LEGAL_BRAND_NAME} adopta medidas de seguridad razonables y proporcionales al
          riesgo. Entre las medidas implementadas o previstas en la arquitectura actual
          se incluyen, según corresponda:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>control de acceso por roles y permisos;</li>
          <li>aislamiento multitenant por organización o negocio;</li>
          <li>autenticación de usuarios mediante Supabase Auth;</li>
          <li>cifrado en tránsito mediante HTTPS;</li>
          <li>
            cifrado en reposo cuando lo provea la infraestructura contratada (por
            ejemplo, servicios de nube utilizados);
          </li>
          <li>gestión de secretos y credenciales de API;</li>
          <li>registros de actividad, errores y auditoría técnica;</li>
          <li>respaldos y procedimientos de recuperación;</li>
          <li>monitoreo operativo [COMPLETAR: herramientas de monitoreo, si aplica];</li>
          <li>revocación de tokens y sesiones;</li>
          <li>principio de mínimos privilegios en accesos internos;</li>
          <li>
            procedimiento de respuesta ante incidentes{" "}
            [COMPLETAR: procedimiento documentado, si existe].
          </li>
        </ul>
        <p>
          Ningún sistema es completamente invulnerable. {LEGAL_BRAND_NAME} no garantiza
          seguridad absoluta, pero trabaja por reducir riesgos de acceso no autorizado,
          pérdida o alteración de datos.
        </p>
      </LegalSection>

      <LegalSection id="derechos" title="15. Derechos de las personas">
        <p>
          Conforme a la legislación chilena aplicable, incluida la Ley N.º 19.628 y,
          a partir del 1 de diciembre de 2026, las disposiciones de la Ley N.º 21.719
          que resulten aplicables, las personas titulares pueden ejercer, entre otros,
          los siguientes derechos:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>acceso;</li>
          <li>rectificación;</li>
          <li>supresión (eliminación);</li>
          <li>oposición;</li>
          <li>bloqueo;</li>
          <li>portabilidad, cuando corresponda;</li>
          <li>revocación del consentimiento, cuando el tratamiento se base en él.</li>
        </ul>
        <p>
          Para ejercer estos derechos, puede escribir a{" "}
          <a
            href={`mailto:${LEGAL_PRIVACY_EMAIL}`}
            className="text-[var(--chat-primary)] underline-offset-2 hover:underline"
          >
            {LEGAL_PRIVACY_EMAIL}
          </a>
          . La solicitud debe permitir identificar, como mínimo:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>nombre de la persona solicitante;</li>
          <li>medio de contacto para responder;</li>
          <li>relación con {LEGAL_PRODUCT_NAME} o con la empresa cliente;</li>
          <li>cuenta, empresa o número relacionado, si se conoce;</li>
          <li>derecho que desea ejercer;</li>
          <li>descripción de los datos o tratamiento concernido.</li>
        </ul>
        <p>
          Por defecto no se solicitarán copias de documentos de identidad. La
          verificación de identidad será proporcional y utilizará el medio menos
          invasivo posible.
        </p>
        <p>
          {LEGAL_BRAND_NAME} responderá dentro de un plazo máximo de{" "}
          <strong>30 días corridos</strong>, prorrogable una vez cuando legalmente
          proceda y sea necesario por la complejidad de la solicitud.
        </p>
        <p>
          Cuando {LEGAL_PRODUCT_NAME} actúe como encargado del tratamiento respecto de
          datos de contactos finales, la solicitud puede remitirse o coordinarse con la
          empresa cliente responsable.
        </p>
      </LegalSection>

      <LegalSection id="eliminacion" title="16. Eliminación de datos">
        <p>
          Puede solicitar la eliminación de datos personales asociados a su cuenta,
          organización, integraciones o conversaciones, conforme a la página dedicada:
        </p>
        <p>
          <Link
            href="/eliminacion-de-datos"
            className="font-medium text-[var(--chat-primary)] underline-offset-2 hover:underline"
          >
            Eliminación de datos de easycomp-chat-bot-manager →
          </Link>
        </p>
        <p>Las solicitudes pueden realizarse, según corresponda, mediante:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            configuración de cuenta u organización, cuando exista una función
            automatizada [COMPLETAR: funciones de eliminación en la app, si existen];
          </li>
          <li>desconexión de una integración con Meta o WhatsApp;</li>
          <li>
            correo a{" "}
            <a
              href={`mailto:${LEGAL_PRIVACY_EMAIL}`}
              className="text-[var(--chat-primary)] underline-offset-2 hover:underline"
            >
              {LEGAL_PRIVACY_EMAIL}
            </a>
            ;
          </li>
          <li>mecanismos proporcionados por Meta, cuando apliquen.</li>
        </ul>
        <p>
          <strong>Importante:</strong> desconectar Meta, revocar permisos o cerrar una
          cuenta no siempre implica la eliminación automática e inmediata de todos los
          datos. Algunos registros pueden conservarse por obligaciones legales,
          contractuales, de seguridad o respaldo, según se describe en esta política.
        </p>
      </LegalSection>

      <LegalSection id="menores" title="17. Niños, niñas y adolescentes">
        <p>
          {LEGAL_PRODUCT_NAME} es una plataforma orientada a empresas y no está dirigida
          a niños, niñas o adolescentes como clientes contratantes del servicio.
        </p>
        <p>
          Si una empresa cliente utiliza la plataforma para atender a menores de edad,
          esa empresa deberá contar con una base jurídica válida, entregar información
          adecuada y adoptar medidas especiales de protección conforme a la normativa
          aplicable.
        </p>
      </LegalSection>

      <LegalSection id="cliente-empresarial" title="18. Responsabilidades del cliente empresarial">
        <p>La empresa cliente que utiliza {LEGAL_PRODUCT_NAME} es responsable de:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>informar a sus contactos sobre el tratamiento de sus datos;</li>
          <li>mantener una política de privacidad propia y actualizada;</li>
          <li>contar con autorización o base jurídica para enviar mensajes;</li>
          <li>respetar mecanismos de opt-in y opt-out;</li>
          <li>no enviar spam ni comunicaciones no solicitadas;</li>
          <li>utilizar plantillas aprobadas por Meta;</li>
          <li>configurar correctamente bots, flujos y derivaciones a humanos;</li>
          <li>restringir accesos internos según roles;</li>
          <li>no cargar datos innecesarios en la plataforma;</li>
          <li>
            atender solicitudes de derechos cuando actúe como responsable del
            tratamiento respecto de sus contactos.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="cambios" title="19. Cambios a la política">
        <p>
          Esta política puede actualizarse por cambios legales, técnicos o funcionales
          del servicio. La versión vigente indicará:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            fecha de última actualización: <strong>{LEGAL_LAST_UPDATED}</strong>;
          </li>
          <li>
            número de versión: <strong>{LEGAL_VERSION}</strong>.
          </li>
        </ul>
        <p>
          Los cambios relevantes podrán comunicarse por correo, aviso en la plataforma
          u otro medio razonable.{" "}
          [COMPLETAR: canal de comunicación de cambios importantes]
        </p>
      </LegalSection>

      <LegalSection id="contacto" title="20. Contacto">
        <ContactCard />
      </LegalSection>
    </>
  );
}
