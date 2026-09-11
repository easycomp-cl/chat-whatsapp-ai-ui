import {
  LEGAL_BRAND_NAME,
  LEGAL_COMMERCIAL_ADDRESS,
  LEGAL_COUNTRY,
  LEGAL_GENERAL_EMAIL,
  LEGAL_LEGAL_ENTITY,
  LEGAL_PRIVACY_EMAIL,
  LEGAL_PRODUCT_NAME,
} from "@/lib/legal/constants";

type ContactCardProps = {
  showDeletionLink?: boolean;
};

export function ContactCard({ showDeletionLink = true }: ContactCardProps) {
  return (
    <aside
      aria-label="Información de contacto"
      className="rounded-lg border bg-card p-5 text-sm shadow-sm"
    >
      <h3 className="mb-3 font-semibold text-foreground">Contacto</h3>
      <dl className="space-y-2 text-foreground/90">
        <div>
          <dt className="font-medium text-foreground">Producto</dt>
          <dd>{LEGAL_PRODUCT_NAME}</dd>
        </div>
        <div>
          <dt className="font-medium text-foreground">Marca</dt>
          <dd>{LEGAL_BRAND_NAME}</dd>
        </div>
        <div>
          <dt className="font-medium text-foreground">Responsable legal</dt>
          <dd>{LEGAL_LEGAL_ENTITY}</dd>
        </div>
        <div>
          <dt className="font-medium text-foreground">País</dt>
          <dd>{LEGAL_COUNTRY}</dd>
        </div>
        <div>
          <dt className="font-medium text-foreground">Domicilio comercial</dt>
          <dd>{LEGAL_COMMERCIAL_ADDRESS}</dd>
        </div>
        <div>
          <dt className="font-medium text-foreground">Correo de privacidad</dt>
          <dd>
            <a
              href={`mailto:${LEGAL_PRIVACY_EMAIL}`}
              className="text-[var(--chat-primary)] underline-offset-2 hover:underline"
            >
              {LEGAL_PRIVACY_EMAIL}
            </a>
          </dd>
        </div>
        <div>
          <dt className="font-medium text-foreground">Correo general</dt>
          <dd>
            <a
              href={`mailto:${LEGAL_GENERAL_EMAIL}`}
              className="text-[var(--chat-primary)] underline-offset-2 hover:underline"
            >
              {LEGAL_GENERAL_EMAIL}
            </a>
          </dd>
        </div>
        {showDeletionLink ? (
          <div>
            <dt className="font-medium text-foreground">Eliminación de datos</dt>
            <dd>
              <a
                href="/eliminacion-de-datos"
                className="text-[var(--chat-primary)] underline-offset-2 hover:underline"
              >
                /eliminacion-de-datos
              </a>
            </dd>
          </div>
        ) : null}
      </dl>
    </aside>
  );
}
