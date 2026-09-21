"use client";

import { Car } from "lucide-react";
import { cn } from "@/lib/utils";
import { activeCustomerVehicle, vehicleLabel } from "@/lib/customers/vehicle";
import type { CustomerGarage } from "@/types/message";

export function ConversationVehicleChips({ garage }: { garage: CustomerGarage | null }) {
  if (!garage?.vehicles.length) return null;
  const active = activeCustomerVehicle(garage);

  return (
    <div className="mt-1.5 flex max-w-full flex-wrap gap-1">
      {garage.vehicles.map((vehicle) => {
        const isActive = active?.key === vehicle.key;
        return (
          <span
            key={vehicle.key}
            className={cn(
              "inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
              isActive
                ? "bg-[#dbeafe] text-[#1e3a5f] ring-1 ring-[#93c5fd]"
                : "bg-[#e9edef] text-[#54656f]"
            )}
            title={vehicleLabel(vehicle)}
          >
            <Car className="size-2.5 shrink-0" />
            <span className="truncate">{vehicleLabel(vehicle)}</span>
          </span>
        );
      })}
    </div>
  );
}
