export const BUSINESS_LOGO_MAX_BYTES = 2 * 1024 * 1024;
export const BUSINESS_LOGO_ACCEPT = "image/png,image/jpeg,image/webp";
export const BUSINESS_LOGO_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

const LOGO_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp"]);

export function isPersistedLogoUrl(url?: string | null): url is string {
  return Boolean(url && /^https?:\/\//i.test(url));
}

export function isDataLogoUrl(url?: string | null): url is string {
  return Boolean(url && url.startsWith("data:image/"));
}

export function isStorableLogoUrl(url?: string | null): url is string {
  return isPersistedLogoUrl(url) || isDataLogoUrl(url);
}

export function validateBusinessLogoFile(file: File): string | null {
  const type = file.type.toLowerCase();
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const typeOk = BUSINESS_LOGO_TYPES.has(type);
  const extensionOk = LOGO_EXTENSIONS.has(extension);

  if (!typeOk && !extensionOk) {
    return "Usa un archivo PNG, JPG o WebP.";
  }
  if (file.size > BUSINESS_LOGO_MAX_BYTES) {
    return "El logo no puede superar 2 MB.";
  }
  return null;
}
