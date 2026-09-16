"use client";

import { useState, useTransition } from "react";
import { confirmPhoneVerificationAction } from "@/lib/actions/public-verify-actions";

type ConfirmPhoneButtonProps = {
  token: string;
};

export function ConfirmPhoneButton({ token }: ConfirmPhoneButtonProps) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (done) {
    return (
      <p className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        Número confirmado. Ya puedes cerrar esta página.
      </p>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await confirmPhoneVerificationAction(token);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            setDone(true);
          });
        }}
        className="inline-flex w-full items-center justify-center rounded-lg bg-[var(--chat-primary)] px-4 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Confirmando…" : "Confirmar este número"}
      </button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
