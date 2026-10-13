import { useMemo, useState } from "react";
import { calcular, validar } from "./indicadores.js";

/**
 * PARADIGMA REACTIVO con React
 * ---------------------------------------------------------------
 * 1. Fuente única de verdad: el estado `datos` (useState).
 * 2. Flujo de datos unidireccional: input -> setDatos -> nuevo estado -> render.
 * 3. Valores derivados declarativos: `errores` y `r` se calculan con useMemo
 *    a partir de `datos`; nunca se asignan a mano ni se manipula el DOM.
 * 4. La vista es una función del estado: UI = f(datos).
 */

const CAMPOS = [
  { id: "poblacion", etiqueta: "Población de la comunidad", ayuda: "habitantes" },
  { id: "camasPublicas", etiqueta: "Camas en hospitales públicos", ayuda: "camas" },
  { id: "camasPrivadas", etiqueta: "Camas en establecimientos privados", ayuda: "camas" },
  { id: "camasOcupadas", etiqueta: "Camas ocupadas ahora", ayuda: "opcional" },
  { id: "muertesMaternas", etiqueta: "Defunciones maternas en el año", ayuda: "opcional" },
  { id: "nacidosVivos", etiqueta: "Nacidos vivos en el año", ayuda: "opcional" },
];

const fmt = (v, dec = 2) =>
  v === null ? "—" : new Intl.NumberFormat("es-CO", { maximumFractionDigits: dec }).format(v);
const pct = (v) => (v === null ? "—" : `${fmt(v * 100, 1)} %`);

/** Campo de entrada controlado: su valor siempre viene del estado. */
function Campo({ campo, valor, error, onCambio }) {
  return (
    <label className={`campo ${error ? "campo--error" : ""}`}>
      <span className="campo__etiqueta">{campo.etiqueta}</span>
      <input
        inputMode="numeric"
        value={valor}
        placeholder={campo.ayuda}
        aria-invalid={!!error}
        onChange={(e) => onCambio(campo.id, e.target.value)}
      />
      {error && <span className="campo__error" role="alert">{error}</span>}
    </label>
  );
}

/** Tarjeta de un indicador: muestra valor, nombre y fórmula. */
function Indicador({ tipo, nombre, valor, formula }) {
  return (
    <article className="indicador">
      <p className="indicador__tipo">{tipo}</p>
      <p className="indicador__valor">{valor}</p>
      <h3>{nombre}</h3>
      <p className="indicador__formula">{formula}</p>
    </article>
  );
}

/** Barra horizontal SVG con segmentos proporcionales (gráfico reactivo). */
function BarraSegmentos({ titulo, segmentos }) {
  const suma = segmentos.reduce((a, s) => a + (s.valor ?? 0), 0);
  return (
    <figure className="grafico">
      <figcaption>{titulo}</figcaption>
      <svg viewBox="0 0 400 34" role="img" aria-label={titulo}>
        <rect width="400" height="34" rx="4" fill="var(--vacio)" />
        {suma > 0 &&
          segmentos.reduce((acc, s) => {
            const w = ((s.valor ?? 0) / suma) * 400;
            acc.nodes.push(<rect key={s.nombre} x={acc.x} width={w} height="34" fill={s.color} style={{ transition: "all .4s" }} />);
            acc.x += w;
            return acc;
          }, { x: 0, nodes: [] }).nodes}
      </svg>
      <ul className="leyenda">
        {segmentos.map((s) => (
          <li key={s.nombre}>
            <i style={{ background: s.color }} /> {s.nombre}: <b>{fmt(s.valor, 0)}</b>
          </li>
        ))}
      </ul>
    </figure>
  );
}

/** Odds visualizado: una columna de cuadros por cada cama (hasta 60). */
function GraficoOdds({ pub, pri, odds }) {
  if (odds === null) return <p className="vacio">El odds se mostrará cuando haya camas privadas.</p>;
  const escala = Math.max(1, Math.ceil((pub + pri) / 60));
  const nPub = Math.round(pub / escala), nPri = Math.round(pri / escala);
  return (
    <figure className="grafico">
      <figcaption>Odds: {fmt(odds)} camas públicas por cada cama privada</figcaption>
      <div className="puntos" aria-hidden="true">
        {Array.from({ length: nPub }, (_, i) => <span key={`u${i}`} className="p pub" />)}
        {Array.from({ length: nPri }, (_, i) => <span key={`v${i}`} className="p pri" />)}
      </div>
      {escala > 1 && <p className="nota">Cada cuadro equivale a {escala} camas.</p>}
    </figure>
  );
}

export default function App() {
  // Única fuente de verdad. Se guarda como texto para permitir campos vacíos.
  // Valores iniciales: ejemplo del enunciado (20 000 hab., 250 públicas, 50 privadas).
  const [datos, setDatos] = useState({
    poblacion: "20000", camasPublicas: "250", camasPrivadas: "50",
    camasOcupadas: "", muertesMaternas: "", nacidosVivos: "",
  });

  const cambiar = (id, valor) => setDatos((prev) => ({ ...prev, [id]: valor }));

  // Valores derivados: se recalculan solos cuando `datos` cambia.
  const errores = useMemo(() => validar(datos), [datos]);
  const hayErrores = Object.keys(errores).length > 0;
  const r = useMemo(() => (hayErrores ? calcular({}) : calcular(datos)), [datos, hayErrores]);

  return (
    <main className="pagina">
      <header className="cabecera">
        <h1>Camas hospitalarias</h1>
        <p>Los indicadores se recalculan mientras escribe.</p>
        <div className="hero" aria-live="polite">
          <span className="hero__num">{fmt(r.camasPor100)}</span>
          <span className="hero__txt">camas por cada 100 habitantes</span>
        </div>
      </header>

      <section className="panel">
        <h2>Datos</h2>
        {CAMPOS.map((c) => (
          <Campo key={c.id} campo={c} valor={datos[c.id]} error={errores[c.id]} onCambio={cambiar} />
        ))}
        <button className="limpiar" onClick={() => setDatos(Object.fromEntries(CAMPOS.map((c) => [c.id, ""])))}>
          Borrar datos
        </button>
      </section>

      <section className="resultados">
        {hayErrores && <p className="aviso" role="alert">Corrija los campos marcados para ver los resultados.</p>}
        <div className="rejilla">
          <Indicador tipo="Razón" nombre="Camas por habitante" valor={fmt(r.razonCamasHabitante, 4)} formula="camas totales ÷ población" />
          <Indicador tipo="Proporción" nombre="Camas públicas" valor={pct(r.proporcionPublica)} formula="públicas ÷ camas totales" />
          <Indicador tipo="Proporción" nombre="Camas privadas" valor={pct(r.proporcionPrivada)} formula="privadas ÷ camas totales" />
          <Indicador tipo="Odds" nombre="Públicas por cada privada" valor={fmt(r.odds)} formula="p ÷ (1 − p), con p = proporción pública" />
          <Indicador tipo="Disponibilidad" nombre="Camas libres" valor={fmt(r.disponibles, 0)} formula="camas totales − ocupadas" />
          <Indicador tipo="Proporción" nombre="Ocupación" valor={pct(r.ocupacion)} formula="ocupadas ÷ camas totales" />
          <Indicador tipo="Razón" nombre="Mortalidad materna" valor={fmt(r.razonMaterna)} formula="defunciones ÷ nacidos vivos × 100 000" />
        </div>

        <BarraSegmentos titulo="Camas por tipo de establecimiento" segmentos={[
          { nombre: "Públicas", valor: r.pub, color: "var(--publica)" },
          { nombre: "Privadas", valor: r.pri, color: "var(--privada)" },
        ]} />
        {r.ocupacion !== null && (
          <BarraSegmentos titulo="Ocupación de camas" segmentos={[
            { nombre: "Ocupadas", valor: r.ocu, color: "var(--ocupada)" },
            { nombre: "Libres", valor: r.disponibles, color: "var(--libre)" },
          ]} />
        )}
        <GraficoOdds pub={r.pub} pri={r.pri} odds={r.odds} />
      </section>
    </main>
  );
}
