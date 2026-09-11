"use client";

import {
  Building2,
  Bot,
  Clock,
  Package,
  UserRound,
  Check,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WIZARD_STEPS } from "../types";

const STEP_ICONS = [Building2, Package, Clock, UserRound, Bot] as const;

type OnboardingStepperProps = {
  currentStep: number;
  completedSteps: Set<number>;
  progressPercent: number;
  orientation?: "vertical" | "horizontal";
  onStepClick?: (stepId: number) => void;
};

function canNavigateToStep(
  stepId: number,
  currentStep: number,
  completedSteps: Set<number>
) {
  if (stepId === currentStep) return false;
  return completedSteps.has(stepId) || stepId < currentStep;
}

export function OnboardingStepper({
  currentStep,
  completedSteps,
  progressPercent,
  orientation = "vertical",
  onStepClick,
}: OnboardingStepperProps) {
  const completedCount = completedSteps.size;

  if (orientation === "horizontal") {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Progreso</span>
          <span className="font-medium text-[#7678ed]">{progressPercent}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-[#7678ed] transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {onStepClick && (
          <div className="flex justify-between gap-1 pt-1">
            {WIZARD_STEPS.map((step) => {
              const isCompleted = completedSteps.has(step.id);
              const isCurrent = currentStep === step.id;
              const clickable = canNavigateToStep(step.id, currentStep, completedSteps);

              return (
                <button
                  key={step.id}
                  type="button"
                  title={step.label}
                  disabled={!clickable}
                  onClick={() => clickable && onStepClick(step.id)}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-200",
                    isCurrent && "bg-[#7678ed] text-white",
                    isCompleted && !isCurrent && "bg-[#7678ed]/15 text-[#7678ed]",
                    clickable && !isCurrent && "hover:bg-[#7678ed]/25 cursor-pointer",
                    !clickable && !isCurrent && "bg-muted text-muted-foreground/50"
                  )}
                >
                  {isCompleted && !isCurrent ? (
                    <Check className="size-3.5" />
                  ) : (
                    step.id
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6">
        <h2 className="text-lg font-semibold tracking-tight">Configuración inicial</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {completedCount}/{WIZARD_STEPS.length} pasos completados
        </p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-[#7678ed] transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <ol className="flex flex-1 flex-col gap-1">
        {WIZARD_STEPS.map((step, index) => {
          const Icon = STEP_ICONS[index];
          const isCompleted = completedSteps.has(step.id);
          const isCurrent = currentStep === step.id;
          const isUpcoming = step.id > currentStep && !isCompleted;
          const clickable = canNavigateToStep(step.id, currentStep, completedSteps);

          return (
            <li key={step.id}>
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onStepClick?.(step.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg px-2 py-2.5 text-left transition-all duration-300",
                  isCurrent && "bg-[#7678ed]/8",
                  isUpcoming && "opacity-50",
                  clickable && "cursor-pointer hover:bg-[#7678ed]/5",
                  !clickable && !isCurrent && "cursor-default"
                )}
              >
                <div
                  className={cn(
                    "relative flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300",
                    isCompleted &&
                      "border-[#7678ed] bg-[#7678ed] text-white scale-100",
                    isCurrent &&
                      !isCompleted &&
                      "border-[#7678ed] border-dashed bg-[#7678ed]/10 text-[#7678ed]",
                    isUpcoming && "border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {isCompleted && !isCurrent ? (
                    <Check className="size-4" />
                  ) : isCurrent ? (
                    <Icon className="size-4" />
                  ) : (
                    <Circle className="size-3 fill-current" />
                  )}
                </div>
                <div className="min-w-0 pt-0.5">
                  <p
                    className={cn(
                      "text-sm font-medium leading-tight transition-colors duration-300",
                      isCurrent && "text-[#7678ed]",
                      isCompleted && !isCurrent && "text-foreground",
                      clickable && !isCurrent && "group-hover:text-[#7678ed]"
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{step.hint}</p>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
