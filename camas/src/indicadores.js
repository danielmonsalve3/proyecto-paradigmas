/**
 * indicadores.js
 * Funciones PURAS (sin estado, sin efectos) que implementan la lógica del
 * enunciado. En el paradigma reactivo, los valores derivados se expresan como
 * funciones de la fuente de verdad (el estado): cuando el estado cambia,
 * React vuelve a evaluar estas funciones y la interfaz se actualiza sola.
 */

/** Convierte el texto de un input a número. "" -> null, texto inválido -> NaN. */
export const aNumero = (texto) => {
  if (texto === "" || texto === null || texto === undefined) return null;
  return Number(String(texto).replace(",", "."));
};

/**
 * Valida los datos digitados. Devuelve un objeto { campo: mensaje }.
 * Si el objeto está vacío, los datos son coherentes.
 */
export function validar(d) {
  const errores = {};
  const n = Object.fromEntries(Object.keys(d).map((k) => [k, aNumero(d[k])]));

  for (const [campo, valor] of Object.entries(n)) {
    if (valor === null) continue; // vacío: aún no se ha digitado
    if (Number.isNaN(valor)) errores[campo] = "Escriba solo números.";
    else if (valor < 0) errores[campo] = "No puede ser negativo.";
    else if (!Number.isInteger(valor)) errores[campo] = "Use un número entero.";
  }
  if (!errores.poblacion && n.poblacion === 0) errores.poblacion = "La población debe ser mayor que 0.";
  if (!errores.nacidosVivos && n.nacidosVivos === 0) errores.nacidosVivos = "Los nacidos vivos deben ser mayor que 0.";

  const total = (n.camasPublicas ?? 0) + (n.camasPrivadas ?? 0);
  if (!errores.camasOcupadas && n.camasOcupadas !== null && n.camasOcupadas > total)
    errores.camasOcupadas = "No puede superar el total de camas.";
  return errores;
}

/**
 * Calcula todos los indicadores a partir de los datos (texto de los inputs).
 * Cada indicador es `null` cuando faltan datos o no está definido
 * (por ejemplo, el odds cuando no hay camas privadas).
 */
export function calcular(d) {
  const pob = aNumero(d.poblacion);
  const pub = aNumero(d.camasPublicas);
  const pri = aNumero(d.camasPrivadas);
  const ocu = aNumero(d.camasOcupadas);
  const mue = aNumero(d.muertesMaternas);
  const nac = aNumero(d.nacidosVivos);
  const ok = (...v) => v.every((x) => x !== null && Number.isFinite(x) && x >= 0);

  const total = ok(pub, pri) ? pub + pri : null;
  const r = {
    total, pub, pri, ocu,
    // RAZÓN: numerador y denominador son de distinta naturaleza (camas / personas).
    razonCamasHabitante: ok(total, pob) && pob > 0 ? total / pob : null,
    // PROPORCIÓN: el numerador es un subconjunto del denominador (públicas ⊂ total).
    proporcionPublica: ok(total) && total > 0 ? pub / total : null,
    proporcionPrivada: ok(total) && total > 0 ? pri / total : null,
    // ODDS: p / (1 - p) = públicas / privadas.
    odds: ok(total) && total > 0 && pri > 0 ? pub / total / (pri / total) : null,
    // Adicionales (disponibilidad, tema central del MINSALUD).
    disponibles: ok(total, ocu) && ocu <= total ? total - ocu : null,
    ocupacion: ok(total, ocu) && total > 0 && ocu <= total ? ocu / total : null,
    // Razón de muertes maternas por 100.000 nacidos vivos.
    razonMaterna: ok(mue, nac) && nac > 0 ? (mue / nac) * 100000 : null,
  };
  r.camasPor100 = r.razonCamasHabitante === null ? null : r.razonCamasHabitante * 100;
  return r;
}
