export const DELIVERY_COURIERS = [
  "Starken",
  "Chilexpress",
  "Correos Chile",
] as const;

export type DeliveryCourier = (typeof DELIVERY_COURIERS)[number];

export const DEFAULT_DELIVERY_COURIER: DeliveryCourier = "Starken";

export function deliveryCourierOptions(current?: string): string[] {
  const options = [...DELIVERY_COURIERS];
  if (current && !options.includes(current as DeliveryCourier)) {
    return [current, ...options];
  }
  return options;
}
