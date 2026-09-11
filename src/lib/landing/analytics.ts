export type LandingAnalyticsEvent =
  | "hero_demo_clicked"
  | "hero_how_it_works_clicked"
  | "navbar_demo_clicked"
  | "final_demo_clicked"
  | "demo_form_started"
  | "demo_form_submitted"
  | "login_clicked";

type EventPayload = Record<string, string | number | boolean | undefined>;

/** Adapter tipado para analítica futura — no envía datos personales. */
export function trackLandingEvent(
  event: LandingAnalyticsEvent,
  payload?: EventPayload
): void {
  if (process.env.NODE_ENV === "development") {
    console.debug("[landing-analytics]", event, payload ?? {});
  }
}
