"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, CloudOff, Headphones, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  completeOnboardingAction,
  patchOnboardingAction,
  uploadOnboardingLogoAction,
} from "@/lib/actions/app-actions";
import { OnboardingStepper } from "./onboarding-stepper";
import { StepIdentity } from "./steps/step-identity";
import { StepOfferings } from "./steps/step-offerings";
import { StepOperations } from "./steps/step-operations";
import { StepHumanContact } from "./steps/step-human-contact";
import { StepBotIdentity } from "./steps/step-bot-identity";
import { WIZARD_STEPS } from "../types";
import { buildStepPatch, mergeDraft, validateStep } from "../utils";
import { validateScheduleString } from "../schedule-utils";
import { SUPPORT_EMAIL } from "@/lib/brand/constants";
import { WHATSAPP_ONBOARDING_PATH } from "@/lib/meta/embedded-signup";
import {
  useOnboardingDraft,
  type OnboardingPersistStatus,
} from "../use-onboarding-draft";

const STEP_TITLES: Record<number, { title: string; description: string }> = {
  1: {
    title: "Tu negocio",
    description: "Nombre, logo opcional, tipo de negocio y una descripción para que el bot te conozca.",
  },
  2: {
    title: "Qué ofreces",
    description: "Agrega tus productos o servicios principales.",
  },
  3: {
    title: "Operación",
    description: "Horarios, ubicación y formas de pago de tu negocio.",
  },
  4: {
    title: "Contacto humano",
    description: "Quién atenderá cuando el bot derive una conversación.",
  },
  5: {
    title: "Tu asistente",
    description: "Tono, saludo obligatorio y vista previa de cómo responderá en WhatsApp.",
  },
};

type OnboardingWizardDialogProps = {
  businessId: string;
  businessName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Si es true, no se puede cerrar hasta completar el wizard. */
  required?: boolean;
};

function persistStatusLabel(status: OnboardingPersistStatus): string | null {
  switch (status) {
    case "saving":
      return "Guardando…";
    case "synced":
      return "Guardado";
    case "saved-local":
      return "Guardado en este dispositivo";
    case "offline":
      return "Sin conexión · guardado aquí";
    default:
      return null;
  }
}

export function OnboardingWizardDialog({
  businessId,
  open,
  onOpenChange,
  required = false,
}: OnboardingWizardDialogProps) {
  const router = useRouter();
  const {
    draft,
    step,
    completedSteps,
    progressPercent,
    loading,
    apiAvailable,
    persistStatus,
    updateDraft: persistDraft,
    rememberStep,
    markStepCompleted,
    replaceDraft,
    persistLocal,
    flushRemote,
    clearPersistedDraft,
    setApiAvailable,
    setProgressPercent,
  } = useOnboardingDraft(businessId, open);
  const [error, setError] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const pendingLogoFileRef = useRef<File | null>(null);
  const logoClearedRef = useRef(false);

  function updateDraft(patch: Parameters<typeof persistDraft>[0]) {
    persistDraft(patch);
    setError(null);
    if (patch.operations?.schedule !== undefined) {
      setScheduleError(null);
    }
  }

  function handleLogoFileChange(file: File | null) {
    pendingLogoFileRef.current = file;
    logoClearedRef.current = file === null;
    if (!file) return;

    const previousUrl = draft.identity?.logo_url;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? "");
      if (!dataUrl.startsWith("data:image/")) return;
      if (previousUrl?.startsWith("blob:")) URL.revokeObjectURL(previousUrl);
      updateDraft({ identity: { logo_url: dataUrl } });
    };
    reader.readAsDataURL(file);
  }

  function handleBack() {
    const nextStep = Math.max(1, step - 1);
    setDirection("back");
    rememberStep(nextStep);
    setError(null);
    setScheduleError(null);
  }

  function goToStep(targetStep: number) {
    if (targetStep === step) return;
    const canNavigate =
      completedSteps.has(targetStep) || targetStep < step;
    if (!canNavigate) return;

    setDirection(targetStep < step ? "back" : "forward");
    rememberStep(targetStep);
    setError(null);
    setScheduleError(null);
  }

  function handleNext() {
    const validationError = validateStep(step, draft);
    if (validationError) {
      if (step === 3) {
        const schedErr = validateScheduleString(draft.operations?.schedule ?? "");
        if (schedErr) {
          setScheduleError(schedErr);
          setError(null);
          return;
        }
      }
      setScheduleError(null);
      setError(validationError);
      return;
    }

    setScheduleError(null);
    const pendingLogo = pendingLogoFileRef.current;
    const logoCleared = logoClearedRef.current;

    startTransition(async () => {
      let uploadedLogoUrl: string | null = null;
      if (step === 1 && pendingLogo) {
        const form = new FormData();
        form.append("file", pendingLogo);
        const uploaded = await uploadOnboardingLogoAction(businessId, form);
        if (uploaded.ok) {
          uploadedLogoUrl = uploaded.logo_url;
          pendingLogoFileRef.current = null;
          logoClearedRef.current = false;
          const previousUrl = draft.identity?.logo_url;
          if (previousUrl?.startsWith("blob:")) URL.revokeObjectURL(previousUrl);
          replaceDraft(mergeDraft(draft, { identity: { logo_url: uploaded.logo_url } }));
        }
      }

      const patch = buildStepPatch(step, draft, {
        logoUrl: uploadedLogoUrl,
        logoCleared,
      });
      const patched = await patchOnboardingAction(businessId, patch);
      if (patched.ok) {
        setApiAvailable(true);
        markStepCompleted(step, patched.status.progress_percent);
        setProgressPercent(patched.status.progress_percent);
      } else {
        setApiAvailable(false);
        markStepCompleted(step);
        persistLocal();
      }

      if (step < 5) {
        setDirection("forward");
        rememberStep(step + 1);
        setError(null);
        return;
      }

      await handleComplete();
    });
  }

  async function handleComplete() {
    try {
      const completed = await completeOnboardingAction(businessId, {
        enable_bot: true,
        handoff_on_low_confidence: true,
      });
      if (!completed.ok) {
        throw new Error(completed.error);
      }
      clearPersistedDraft();
      toast.success("¡Tu asistente está listo!", {
        description: "Ahora conecta WhatsApp Business con Meta.",
      });
      onOpenChange(false);
      router.push(WHATSAPP_ONBOARDING_PATH);
    } catch (err) {
      setApiAvailable(false);
      persistLocal();
      const message = err instanceof Error ? err.message : "Error al activar";
      setError(message);
    }
  }

  const preventDismiss = required && apiAvailable;
  const saveLabel = persistStatusLabel(persistStatus);
  const stepMeta = STEP_TITLES[step] ?? STEP_TITLES[1];
  const isLastStep = step === 5;

  return (
    <Dialog
      open={open}
      disablePointerDismissal={preventDismiss}
      onOpenChange={(next) => {
        if (!next && preventDismiss) return;
        if (!next) {
          persistLocal();
          void flushRemote();
        }
        onOpenChange(next);
      }}
    >
      <DialogContent
        className="flex max-h-[min(90vh,720px)] max-w-[min(960px,calc(100%-2rem))] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(960px,calc(100%-2rem))]"
        showCloseButton={!preventDismiss}
        closeButtonClassName="top-6 right-6"
      >
        <DialogTitle className="sr-only">Configuración inicial del negocio</DialogTitle>
        <DialogDescription className="sr-only">
          Wizard de onboarding en 5 pasos para configurar tu asistente de WhatsApp.
        </DialogDescription>

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {/* Panel izquierdo — stepper */}
          <aside className="hidden shrink-0 border-r bg-muted/30 p-6 md:block md:w-[260px]">
            <OnboardingStepper
              currentStep={step}
              completedSteps={completedSteps}
              progressPercent={progressPercent}
              onStepClick={goToStep}
            />
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="mt-6 flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-[#0d9488]"
            >
              <Headphones className="size-3.5" />
              Contactar soporte
            </a>
          </aside>

          {/* Panel derecho — contenido */}
          <div className="flex min-h-0 flex-1 flex-col">
            {/* Header móvil */}
            <div className="border-b px-6 py-4 md:hidden">
              <OnboardingStepper
                currentStep={step}
                completedSteps={completedSteps}
                progressPercent={progressPercent}
                orientation="horizontal"
                onStepClick={goToStep}
              />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-6">
              <div className="mb-6">
                <p className="text-xs font-medium uppercase tracking-wider text-[#0d9488]">
                  Paso {step} de {WIZARD_STEPS.length}
                </p>
                <h3 className="mt-1 text-xl font-semibold tracking-tight">
                  {stepMeta.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {stepMeta.description}
                </p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="size-6 animate-spin text-[#0d9488]" />
                </div>
              ) : (
                <div
                  key={step}
                  className={
                    direction === "forward"
                      ? "animate-in fade-in-0 slide-in-from-right-4 duration-300"
                      : "animate-in fade-in-0 slide-in-from-left-4 duration-300"
                  }
                >
                  {step === 1 && (
                    <StepIdentity
                      draft={draft}
                      onChange={updateDraft}
                      onLogoFileChange={handleLogoFileChange}
                    />
                  )}
                  {step === 2 && <StepOfferings draft={draft} onChange={updateDraft} />}
                  {step === 3 && <StepOperations draft={draft} onChange={updateDraft} scheduleError={scheduleError} />}
                  {step === 4 && (
                    <StepHumanContact
                      businessId={businessId}
                      draft={draft}
                      onChange={updateDraft}
                    />
                  )}
                  {step === 5 && (
                    <StepBotIdentity draft={draft} onChange={updateDraft} />
                  )}
                </div>
              )}

              {error && (
                <p className="mt-4 animate-in fade-in-0 text-sm text-destructive">
                  {error}
                </p>
              )}
            </div>

            {/* Footer navegación */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-t bg-card px-6 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={step === 1 || pending || loading}
                className="min-w-[100px] transition-opacity"
              >
                Atrás
              </Button>
              {saveLabel ? (
                <p className="flex min-w-0 flex-1 items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground sm:text-xs">
                  {persistStatus === "offline" ? (
                    <CloudOff className="size-3.5 shrink-0" />
                  ) : persistStatus === "saving" ? (
                    <Loader2 className="size-3.5 shrink-0 animate-spin" />
                  ) : null}
                  <span className="truncate">{saveLabel}</span>
                </p>
              ) : (
                <span className="flex-1" />
              )}
              <Button
                type="button"
                onClick={handleNext}
                disabled={pending || loading}
                className="min-w-[120px] bg-[#0d9488] text-white hover:bg-[#0d9488]/90"
              >
                {pending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : isLastStep ? (
                  "Activar y conectar"
                ) : (
                  <>
                    Siguiente
                    <ChevronRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
