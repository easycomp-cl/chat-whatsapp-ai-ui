import { CHILE_REGION_NAMES } from "./chile-regions";
import communesByRegion from "./chile-communes-by-region.json";

/** Mapeo entre nombres usados en la UI y claves del dataset de comunas. */
const REGION_DATA_KEY: Record<(typeof CHILE_REGION_NAMES)[number], string> = {
  "Región de Arica y Parinacota": "Arica y Parinacota",
  "Región de Tarapacá": "Tarapacá",
  "Región de Antofagasta": "Antofagasta",
  "Región de Atacama": "Atacama",
  "Región de Coquimbo": "Coquimbo",
  "Región de Valparaíso": "Valparaíso",
  "Región Metropolitana de Santiago": "Región Metropolitana de Santiago",
  "Región del Libertador General Bernardo O'Higgins":
    "Región del Libertador Gral. Bernardo O'Higgins",
  "Región del Maule": "Región del Maule",
  "Región de Ñuble": "Región de Ñuble",
  "Región del Biobío": "Región del Biobío",
  "Región de La Araucanía": "Región de la Araucanía",
  "Región de Los Ríos": "Región de los Ríos",
  "Región de Los Lagos": "Región de los Lagos",
  "Región de Aysén": "Región Aisén del Gral. Carlos Ibañez del Campo",
  "Región de Magallanes y de la Antártica Chilena":
    "Región de Magallanes y de la Antártica Chilena",
};

export function getCommunesForRegion(regionName: string): string[] {
  const dataKey = REGION_DATA_KEY[regionName as keyof typeof REGION_DATA_KEY];
  if (!dataKey) return [];
  return communesByRegion[dataKey as keyof typeof communesByRegion] ?? [];
}

export { CHILE_REGION_NAMES };
