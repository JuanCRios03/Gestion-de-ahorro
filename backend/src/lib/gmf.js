// Cálculo del Gravamen a los Movimientos Financieros (4x1000) vigente en Colombia.
export const GMF_RATE = 0.004; // 0.4%

export function calcularGMF(monto) {
  if (!monto || monto <= 0) return 0;
  // El GMF se cobra redondeado a la centena/peso más cercano en la práctica bancaria;
  // aquí se redondea al peso entero, suficiente para el propósito de este control personal.
  return Math.round(monto * GMF_RATE);
}
