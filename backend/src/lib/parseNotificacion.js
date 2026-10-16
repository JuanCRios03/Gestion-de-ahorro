// Interpreta el texto de una notificación bancaria (ej. push de BBVA) para
// sugerir monto y comercio. Es un parser best-effort: como no hay un formato
// oficial garantizado, si algo no se puede extraer se deja en null y el
// texto_original siempre se guarda completo para que la persona lo complete
// a mano al confirmar la captura. Nunca se descarta una notificación por no
// poder parsearla.

// "$45.000", "$45.000,50", "COP 45000", "45,000.00" → 45000 / 45000.5
function extraerMonto(texto) {
  const match = texto.match(/(?:\$|COP)\s*([\d.,]+)/i);
  if (!match) return null;

  let raw = match[1];
  const tieneComaDecimal = /,\d{1,2}$/.test(raw);
  const tienePuntoDecimal = /\.\d{1,2}$/.test(raw) && !/\.\d{3}\b/.test(raw);

  if (tieneComaDecimal) {
    raw = raw.replace(/\./g, '').replace(',', '.');
  } else if (tienePuntoDecimal) {
    raw = raw.replace(/,/g, '');
  } else {
    raw = raw.replace(/[.,]/g, '');
  }

  const monto = Number(raw);
  return Number.isFinite(monto) && monto > 0 ? monto : null;
}

// "...compra ... en ALMACENES EXITO el 10/08..." → "ALMACENES EXITO"
function extraerComercio(texto) {
  const match = texto.match(/\ben\s+([A-ZÑÁÉÍÓÚ0-9][^.,]*?)(?:\s+(?:el|por)\s+\d|\s+el\s|\.|,|$)/i);
  if (!match) return '';
  return match[1].trim().slice(0, 120);
}

export function parseNotificacion(texto) {
  return {
    monto: extraerMonto(texto),
    comercio: extraerComercio(texto),
  };
}
