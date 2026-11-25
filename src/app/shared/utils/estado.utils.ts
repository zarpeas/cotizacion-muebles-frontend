/**
 * Helpers de presentación compartidos por listados, detalle y reportes.
 * Centralizan el formato de estados y el mapa de clases de badge, de modo que
 * un nuevo estado solo se agrega aquí.
 */

export type TonoEstado = 'pendiente' | 'aceptada' | 'rechazada' | 'cancelada' | 'default';
export type VarianteBadge = 'lista' | 'reporte';

const TONO_POR_ESTADO: Record<string, TonoEstado> = {
  PENDIENTE: 'pendiente',
  APROBADO: 'aceptada',
  ACEPTADA: 'aceptada',
  RECHAZADA: 'rechazada',
  CANCELADA: 'cancelada',
};

const CLASES_LISTA: Record<TonoEstado, string> = {
  pendiente: 'badge-pendiente',
  aceptada: 'badge-aceptada',
  rechazada: 'badge-rechazada',
  cancelada: 'badge-cancelada',
  default: 'badge-default',
};

const CLASES_REPORTE: Record<TonoEstado, string> = {
  pendiente: 'badge-naranja',
  aceptada: 'badge-verde',
  rechazada: 'badge-rojo',
  cancelada: 'badge-rojo',
  default: 'badge-default',
};

/** Primera letra en mayúscula y el resto en minúscula. */
export function formatoEstado(estado?: string | null): string {
  const texto = (estado ?? '').toLowerCase();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Estado normalizado a un tono visual, con `default` como fallback. */
export function tonoEstado(estado?: string | null): TonoEstado {
  return TONO_POR_ESTADO[(estado ?? '').trim().toUpperCase()] ?? 'default';
}

/** Clase CSS del badge. `reporte` usa la paleta del módulo de reportes. */
export function claseEstado(estado?: string | null, variante: VarianteBadge = 'lista'): string {
  const mapa = variante === 'reporte' ? CLASES_REPORTE : CLASES_LISTA;
  return mapa[tonoEstado(estado)];
}

/** Iniciales de las dos primeras palabras de un nombre o razón social. */
export function iniciales(nombre?: string | null): string {
  if (!nombre) return '?';
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((palabra) => palabra.charAt(0).toUpperCase())
    .join('');
}
