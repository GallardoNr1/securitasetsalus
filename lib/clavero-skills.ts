/**
 * Catálogo oficial de códigos de skills SES → Clavero.
 *
 * Estos códigos los emite SES al diplomar a un alumno y los consume
 * Clavero v2 al validar el diploma para certificación profesional.
 *
 * Fuente de verdad: docs/course-catalog.md.
 *
 * Si Clavero modifica su catálogo, este archivo y SesCoursesMap (en
 * Clavero) deben sincronizarse para no romper la integración.
 */

export const CLAVERO_SKILL_CODES = [
  'LE', // Llaves estándar
  'LP', // Llaves estándar y de puntos
  'L3', // Electrónico de alta precisión (con sufijo opcional 'e+')
  'AB', // Aperturas básicas
  'AA', // Aperturas avanzadas
  'AA+', // Aperturas avanzadas + asesor
  'V1', // Llaves de vehículos
  'V2', // Aperturas de vehículos
  'M1', // Módulo: instalador EU-Perfil
  'M2', // Módulo: amaestramientos
] as const;

export type ClaveroSkillCode = (typeof CLAVERO_SKILL_CODES)[number];

export const CLAVERO_SKILL_LABELS: Record<ClaveroSkillCode, string> = {
  LE: 'LE — Llaves estándar',
  LP: 'LP — Llaves estándar y de puntos',
  L3: 'L3 — Electrónico de alta precisión',
  AB: 'AB — Aperturas básicas',
  AA: 'AA — Aperturas avanzadas',
  'AA+': 'AA+ — Aperturas avanzadas + asesor',
  V1: 'V1 — Llaves de vehículos',
  V2: 'V2 — Aperturas de vehículos',
  M1: 'M1 — Módulo instalador EU-Perfil',
  M2: 'M2 — Módulo amaestramientos',
};

/** Sufijos opcionales que extienden el código base (p. ej. 'e+' para L3 con máquina avanzada). */
export const CLAVERO_SKILL_SUFFIXES = ['e+'] as const;
export type ClaveroSkillSuffix = (typeof CLAVERO_SKILL_SUFFIXES)[number];

export function isValidClaveroSkillCode(value: string | null | undefined): value is ClaveroSkillCode {
  if (!value) return false;
  return (CLAVERO_SKILL_CODES as readonly string[]).includes(value);
}

export function isValidClaveroSkillSuffix(
  value: string | null | undefined,
): value is ClaveroSkillSuffix {
  if (!value) return false;
  return (CLAVERO_SKILL_SUFFIXES as readonly string[]).includes(value);
}

/**
 * Renderiza el código completo con sufijo opcional. Útil para mostrar
 * en UI o pasar al endpoint público de verificación.
 */
export function formatSkillCode(
  code: ClaveroSkillCode | null | undefined,
  suffix?: ClaveroSkillSuffix | null,
): string | null {
  if (!code) return null;
  return suffix ? `${code} ${suffix}` : code;
}
