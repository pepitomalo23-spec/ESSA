// Sedes de la escuela. Añade dirección e instalación de prácticas de cada una.
export type Sede = { city: string; province: string; venue?: string };

export const SEDES: Sede[] = [
  { city: "Almería", province: "Almería" },
  { city: "Cádiz", province: "Cádiz" },
  { city: "Córdoba", province: "Córdoba" },
  { city: "Granada", province: "Granada" },
  { city: "Huelva", province: "Huelva" },
  { city: "Jaén", province: "Jaén" },
  { city: "Málaga", province: "Málaga" },
  { city: "Sevilla", province: "Sevilla" },
];
