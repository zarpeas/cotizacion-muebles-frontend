/** Extrae un mensaje legible de errores HTTP de forma segura. */
export function mensajeError(error: unknown, fallback = ''): string {
  if (typeof error === 'string') return error;

  if (error && typeof error === 'object') {
    const externo = error as { error?: unknown; message?: unknown };

    if (externo.error && typeof externo.error === 'object') {
      const interno = externo.error as { message?: unknown };
      if (typeof interno.message === 'string') return interno.message;
    }
    if (typeof externo.error === 'string') return externo.error;
    if (typeof externo.message === 'string') return externo.message;
  }

  return fallback;
}
