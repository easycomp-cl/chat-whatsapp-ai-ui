"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Headphones, Loader2 } from "lucide-react";
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
  getSetupStatusAction,
  patchOnboardingAction,
} from "@/lib/actions/app-actions";
import { OnboardingStepper } from "./onboarding-stepper";
import { StepIdentity } from "./steps/step-identity";
import { StepOfferings } from "./steps/step-offerings";
import { StepOperations } from "./steps/step-operations";
import { StepHumanContact } from "./steps/step-human-contact";
import { StepBotIdentity } from "./steps/step-bot-identity";
import type { OnboardingDraft, SetupStatus } from "../types";
import { WIZARD_STEPS } from "../types";
import {
  buildStepPatch,
  createEmptyDraft,
  mergeDraft,
  validateStep,
} from "../utils";
import { validateScheduleString } from "../schedule-utils";
import { TWC_SAMPLE_OFFERINGS } from "../twc-sample-data";
import { SUPPORT_EMAIL } from "@/lib/brand/constants";
import { WHATSAPP_ONBOARDING_PATH } from "@/lib/meta/embedded-signup";

const STEP_TITLES: Record<number, { title: string; description: string }> = {
  1: {
    title: "Tu negocio",
    description: "Nombre, tipo de negocio y una descripción para que el bot te conozca.",
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
};

export function OnboardingWizardDialog({
  businessId,
  businessName,
  open,
  onOpenChange,
}: OnboardingWizardDialogProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<OnboardingDraft>(createEmptyDraft());
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [progressPercent, setProgressPercent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [apiAvailable, setApiAvailable] = useState(true);
  const [pending, startTransition] = useTransition();
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const status = await getSetupStatusAction(businessId);
      applyStatus(status);
      setApiAvailable(true);
    } catch {
      setApiAvailable(false);
      setDraft(withBusinessNameFallback(createEmptyDraft()));
      setProgressPercent(0);
      setCompletedSteps(new Set());
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  function withBusinessNameFallback(draft: OnboardingDraft): OnboardingDraft {
    if (draft.identity?.business_name?.trim() || !businessName?.trim()) {
      return draft;
    }
    return {
      ...draft,
      identity: { ...draft.identity, business_name: businessName.trim() },
    };
  }

  function applyStatus(status: SetupStatus) {
    let merged = mergeDraft(createEmptyDraft(), status.draft ?? {});
    merged = withBusinessNameFallback(merged);

    if (process.env.NODE_ENV === "development") {
      const offerings = merged.offerings ?? [];
      const hasContent = offerings.some((o) => o.name.trim());
      if (!hasContent) {
        merged.offerings = TWC_SAMPLE_OFFERINGS.map((o) => ({ ...o }));
      }
    }

    setDraft(merged);
    setProgressPercent(status.progress_percent);

    const done = new Set<number>();
    const checklistMap: Record<number, keyof SetupStatus["checklist"]> = {
      1: "identity",
      2: "offerings",
      3: "operations",
      4: "human_contact",
      5: "bot_identity",
    };
    for (const [stepNum, key] of Object.entries(checklistMap)) {
      if (status.checklist[key]?.done) done.add(Number(stepNum));
    }
    setCompletedSteps(done);

    if (status.completed_at) {
      setStep(5);
    } else {
      const firstIncomplete = WIZARD_STEPS.find((s) => !done.has(s.id));
      setStep(firstIncomplete?.id ?? 1);
    }
  }

  useEffect(() => {
    if (open) {
      setStep(1);
      setDirection("forward");
      void loadStatus();
    }
  }, [open, loadStatus]);

  function updateDraft(patch: Partial<OnboardingDraft>) {
    setDraft((prev) => mergeDraft(prev, patch));
    setError(null);
    if (patch.operations?.schedule !== undefined) {
      setScheduleError(null);
    }
  }

  function handleBack() {
    setDirection("back");
    setStep((s) => Math.max(1, s - 1));
    setError(null);
    setScheduleError(null);
  }

  function goToStep(targetStep: number) {
    if (targetStep === step) return;
    const canNavigate =
      completedSteps.has(targetStep) || targetStep < step;
    if (!canNavigate) return;

    setDirection(targetStep < step ? "back" : "forward");
    setStep(targetStep);
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
    const patch = buildStepPatch(step, draft);

    startTransition(async () => {
      try {
        if (apiAvailable) {
          const status = await patchOnboardingAction(businessId, patch);
          applyStatus(status);
        } else {
          setCompletedSteps((prev) => new Set([...prev, step]));
          setProgressPercent(Math.round(((step) / WIZARD_STEPS.length) * 100));
        }

        if (step < 5) {
          setDirection("forward");
          setStep((s) => s + 1);
          setError(null);
        } else {
          await handleComplete();
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error al guardar";
        if (process.env.NODE_ENV === "development") {
          toast.warning("API no disponible — avanzando en modo local", {
            description: message,
          });
          setApiAvailable(false);
          setCompletedSteps((prev) => new Set([...prev, step]));
          if (step < 5) {
            setDirection("forward");
            setStep((s) => s + 1);
          } else {
            toast.success("¡Configuración completada en modo local!");
            onOpenChange(false);
          }
        } else {
          setError(message);
        }
      }
    });
  }

  async function handleComplete() {
    try {
      if (apiAvailable) {
        await completeOnboardingAction(businessId, {
          enable_bot: true,
          handoff_on_low_confidence: true,
        });
        toast.success("¡Tu asistente está listo!", {
          description: "Ahora conecta WhatsApp Business con Meta.",
        });
      } else {
        toast.success("¡Configuración completada en modo local!", {
          description: "Conecta el backend para activar el asistente.",
        });
      }
      onOpenChange(false);
      router.push(WHATSAPP_ONBOARDING_PATH);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al activar";
      if (process.env.NODE_ENV === "development") {
        toast.warning("No se pudo completar en el backend", { description: message });
        onOpenChange(false);
        router.push(WHATSAPP_ONBOARDING_PATH);
      } else {
        setError(message);
      }
    }
  }

  const stepMeta = STEP_TITLES[step];
  const isLastStep = step === 5;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[min(90vh,720px)] max-w-[min(960px,calc(100%-2rem))] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(960px,calc(100%-2rem))]"
        showCloseButton
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
              className="mt-6 flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-[#7678ed]"
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
                <p className="text-xs font-medium uppercase tracking-wider text-[#7678ed]">
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
                  <Loader2 className="size-6 animate-spin text-[#7678ed]" />
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
                  {step === 1 && <StepIdentity draft={draft} onChange={updateDraft} />}
                  {step === 2 && <StepOfferings draft={draft} onChange={updateDraft} />}
                  {step === 3 && <StepOperations draft={draft} onChange={updateDraft} scheduleError={scheduleError} />}
                  {step === 4 && (
                    <StepHumanContact draft={draft} onChange={updateDraft} />
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

              {!apiAvailable && process.env.NODE_ENV === "development" && (
                <p className="mt-4 rounded-lg border border-[#ff7a55]/30 bg-[#ff7a55]/5 px-3 py-2 text-xs text-[#ff7a55]">
                  Modo desarrollo: el backend no respondió. Los datos se guardan solo en
                  memoria.
                </p>
              )}
            </div>

            {/* Footer navegación */}
            <div className="flex shrink-0 items-center justify-between border-t bg-card px-6 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={step === 1 || pending || loading}
                className="min-w-[100px] transition-opacity"
              >
                Atrás
              </Button>
              <Button
                type="button"
                onClick={handleNext}
                disabled={pending || loading}
                className="min-w-[120px] bg-[#7678ed] text-white hover:bg-[#7678ed]/90"
              >
                {pending ? (
                  <Loader2 className="size-4 animate-spin" />
                )                 : isLastStep ? (
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
