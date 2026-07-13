export const DELIVERY_COURIERS = [
  "Starken",
  "Chilexpress",
  "Correos Chile",
] as const;

export type DeliveryCourier = (typeof DELIVERY_COURIERS)[number];

export const DEFAULT_DELIVERY_COURIER: DeliveryCourier = "Starken";

export function isDeliveryCourier(value: string): value is DeliveryCourier {
  return DELIVERY_COURIERS.includes(value as DeliveryCourier);
}

export function parseDeliveryCourier(
  value: string | null | undefined
): DeliveryCourier {
  if (value && isDeliveryCourier(value)) return value;
  return DEFAULT_DELIVERY_COURIER;
}

export function deliveryCourierOptions(current?: string): string[] {
  const options = [...DELIVERY_COURIERS];
  if (current && !options.includes(current as DeliveryCourier)) {
    return [current, ...options];
  }
  return options;
}
