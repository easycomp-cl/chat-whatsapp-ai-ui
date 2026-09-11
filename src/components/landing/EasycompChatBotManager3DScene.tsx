"use client";

import dynamic from "next/dynamic";
import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Application } from "@splinetool/runtime";
import { HeroFallback } from "./HeroFallback";
import {
  getSplineSceneUrl,
  SPLINE_OBJECTS,
  type SplineObjectKey,
} from "@/lib/landing/spline-config";
import { useReducedMotion } from "@/lib/landing/use-reduced-motion";
import { cn } from "@/lib/utils";

const Spline = dynamic(() => import("@splinetool/react-spline"), {
  ssr: false,
});

/**
 * Comparte composición (halo + núcleo central) con HeroFallback para que la
 * transición skeleton → escena cargada no produzca un salto visual brusco.
 */
function HeroSceneSkeleton() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-lg animate-pulse">
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_45%,rgba(109,94,245,0.22),transparent_65%)]" />
      <div className="absolute inset-10 rounded-full bg-[radial-gradient(circle_at_60%_25%,rgba(62,230,208,0.16),transparent_60%)] blur-2xl" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="size-44 rounded-[2.25rem] bg-gradient-to-br from-[#6d5ef5]/40 to-[#397bff]/30 shadow-lg sm:size-52" />
      </div>
    </div>
  );
}

type EasycompChatBotManager3DSceneProps = {
  className?: string;
};

export function EasycompChatBotManager3DScene({ className }: EasycompChatBotManager3DSceneProps) {
  const sceneUrl = getSplineSceneUrl();
  const reducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleLoad = useCallback((app: Application) => {
    appRef.current = app;
    setLoaded(true);

    (Object.keys(SPLINE_OBJECTS) as SplineObjectKey[]).forEach((key) => {
      const name = SPLINE_OBJECTS[key];
      const obj = app.findObjectByName(name);
      if (!obj && process.env.NODE_ENV === "development") {
        console.warn(`[spline] Objeto no encontrado: ${name}`);
      }
    });
  }, []);

  useEffect(() => {
    return () => {
      appRef.current = null;
    };
  }, []);

  const useFallback = !sceneUrl || reducedMotion || failed;

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full", className)}
      aria-hidden="true"
    >
      {useFallback ? (
        <HeroFallback />
      ) : (
        <div className="relative mx-auto aspect-square w-full max-w-lg">
          <div
            className={cn(
              "absolute inset-0 transition-opacity duration-300",
              loaded ? "opacity-0" : "opacity-100"
            )}
          >
            <HeroSceneSkeleton />
          </div>

          {visible ? (
            <Suspense fallback={null}>
              <div
                className={cn(
                  "absolute inset-0 transition-opacity duration-700",
                  loaded ? "opacity-100" : "opacity-0"
                )}
              >
                <ErrorBoundaryFallback onError={() => setFailed(true)}>
                  <Spline scene={sceneUrl} onLoad={handleLoad} />
                </ErrorBoundaryFallback>
              </div>
            </Suspense>
          ) : null}
        </div>
      )}
    </div>
  );
}

/**
 * Spline puede lanzar errores de render fuera del flujo normal de promesas;
 * este wrapper captura errores del subárbol y activa el fallback CSS.
 */
class ErrorBoundaryFallback extends Component<
  { children: ReactNode; onError: () => void },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
