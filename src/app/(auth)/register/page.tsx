import { RegisterForm } from "@/features/auth/components/register-form";
import { PRODUCT_DISPLAY_NAME } from "@/lib/brand/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Crear cuenta · ${PRODUCT_DISPLAY_NAME}`,
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <RegisterForm />
    </div>
  );
}
