/**
 * Utilitare poziții mese pe hartă (%). Evită salvarea {0,0} sau NaN când
 * containerul nu e încă măsurat sau mapRef lipsește la drag.
 */

/** Convertește punct ecran → procente în container; null = nu persista (layout invalid). */
export function clientPointToMapPercent(
  clientX: number,
  clientY: number,
  mapEl: HTMLElement | null,
): { x: number; y: number } | null {
  if (!mapEl) return null;
  const rect = mapEl.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) return null;
  const rawX = ((clientX - rect.left) / rect.width) * 100;
  const rawY = ((clientY - rect.top) / rect.height) * 100;
  if (!Number.isFinite(rawX) || !Number.isFinite(rawY)) return null;
  const x = Math.max(2, Math.min(98, rawX));
  const y = Math.max(2, Math.min(98, rawY));
  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
}

/**
 * Poziție nevalidă pentru persist după drag (fallback când mapRef era gol → 0,0).
 * Poziții valide din UI folosesc minim 2% (vezi clientPointToMapPercent).
 */
export function isInvalidAccidentalZeroPosition(p: { x: number; y: number }): boolean {
  return p.x === 0 && p.y === 0;
}

/** Pregătește coordonate pentru PATCH; null dacă nu sunt numere finite. */
export function sanitizeTablePositionForApi(pos: {
  x: number;
  y: number;
}): { x: number; y: number } | null {
  const x = Number(pos.x);
  const y = Number(pos.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return {
    x: Math.max(0, Math.min(100, Math.round(x * 10) / 10)),
    y: Math.max(0, Math.min(100, Math.round(y * 10) / 10)),
  };
}
