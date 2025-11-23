// lib/analytics.ts
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

// Enviar eventos a GA4
export const trackEvent = (
  action: string,
  params?: Record<string, any>
) => {
  if (typeof window === "undefined") return; // seguridad para SSR
  if (!window.gtag) return; // si GA no está listo, no hace nada

  window.gtag("event", action, params || {});
};
