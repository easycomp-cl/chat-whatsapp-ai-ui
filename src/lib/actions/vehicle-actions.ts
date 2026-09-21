"use server";

import {
  botApi,
  BotApiError,
  BOT_API_UNAVAILABLE_MESSAGE,
  getBotApiErrorMessage,
} from "@/lib/bot-api/client";
import { requireAppAccess } from "@/lib/auth/session";
import { compactPlate, formatPlateEntry } from "@/lib/customers/vehicle";
import type { VehicleFitmentQuery, VehicleFitmentResult, VehicleModelsResponse, VehiclePlateLookupResponse } from "@/lib/bot-api/vehicles";

function isVehicleEndpointUnavailable(error: unknown): boolean {
  return error instanceof BotApiError && (error.status === 404 || error.status === 405 || error.status === 501);
}

export async function lookupConversationVehiclePlateAction(
  conversationId: string,
  plate: string
): Promise<
  | { ok: true; result: VehiclePlateLookupResponse }
  | { ok: false; error: string; invalidPlate?: boolean; unavailable?: boolean }
> {
  await requireAppAccess();
  const entry = formatPlateEntry(plate);
  if (!conversationId.trim()) {
    return { ok: false, error: "Falta la conversación." };
  }
  if (!entry.complete) {
    return {
      ok: false,
      invalidPlate: true,
      error: entry.formatError || "Ingresa una patente válida (auto o moto).",
    };
  }

  try {
    const result = await botApi.lookupConversationVehiclePlate(conversationId, entry.compact);
    return { ok: true, result };
  } catch (error) {
    if (error instanceof BotApiError && error.status === 400) {
      return {
        ok: false,
        invalidPlate: true,
        error: error.message || "El formato de la patente no es válido.",
      };
    }
    if (isVehicleEndpointUnavailable(error)) {
      return {
        ok: false,
        unavailable: true,
        error: "La consulta de patente aún no está disponible en el servidor.",
      };
    }
    return {
      ok: false,
      error: getBotApiErrorMessage(error) || BOT_API_UNAVAILABLE_MESSAGE,
    };
  }
}

export async function searchVehicleModelsAction(
  query: string
): Promise<{ ok: true; models: VehicleModelsResponse["models"] } | { ok: false; error: string }> {
  await requireAppAccess();
  const q = query.trim();
  if (!q) return { ok: true, models: [] };

  try {
    const result = await botApi.searchVehicleModels(q);
    return { ok: true, models: result.models };
  } catch (error) {
    if (isVehicleEndpointUnavailable(error)) {
      return { ok: true, models: [] };
    }
    return {
      ok: false,
      error: getBotApiErrorMessage(error) || "No se pudieron buscar modelos",
    };
  }
}

export async function getVehicleFitmentAction(
  query: VehicleFitmentQuery
): Promise<
  | { ok: true; fitment: VehicleFitmentResult }
  | { ok: false; error: string; unavailable?: boolean }
> {
  const profile = await requireAppAccess();
  const businessId = profile.business_id;
  if (!businessId) {
    return { ok: false, error: "No hay un negocio asociado a tu usuario." };
  }

  try {
    const fitment = await botApi.getVehicleFitment(businessId, {
      plate: query.plate ? compactPlate(query.plate) : undefined,
      make: query.make?.trim() || undefined,
      model: query.model?.trim() || undefined,
      year: query.year,
    });
    return { ok: true, fitment };
  } catch (error) {
    if (error instanceof BotApiError && error.status === 400) {
      return { ok: false, error: error.message || "El formato de la patente no es válido." };
    }
    if (isVehicleEndpointUnavailable(error)) {
      return {
        ok: false,
        unavailable: true,
        error: "El filtro de compatibilidad aún no está disponible en el servidor.",
      };
    }
    return {
      ok: false,
      error: getBotApiErrorMessage(error) || BOT_API_UNAVAILABLE_MESSAGE,
    };
  }
}
