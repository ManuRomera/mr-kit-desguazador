/**
 * Macros del Kit del Desguazador.
 * Se exponen en game.mrKit.macros y las macros del compendio llaman a estos métodos.
 */
import {
  aviso, elegirNave, elegirModo, tirarD100, esExito, tirarEnTabla, resultadoDeTabla, publicarTirada, filaDado, tarjeta,
  mdmgTotal, aplicarImpacto, textoImpacto, valorMDMG, tirarExpresionMDMG, efectoMegadanio, tirarAverias, htmlAveria,
  textoResultado, claseNave, formatearCreditos,
} from "./util.js";

const { DialogV2 } = foundry.applications.api;
const tirar = (formula) => new Roll(formula).evaluate();

const NOMBRE_CARACTERISTICA = { thrusters: "Propulsores", battle: "Batalla", systems: "Sistemas" };

/* ------------------------------------------------------------------ */
/* Tirada de característica de nave                                    */
/* ------------------------------------------------------------------ */
/** Delegada en el sistema: así comparte ventaja, críticos, estrés y mensaje con la ficha. */
export async function tiradaCaracteristica(nave = null, caracteristica = null) {
  nave ??= await elegirNave();
  if (!nave) return;

  if (!caracteristica) {
    const opciones = Object.entries(NOMBRE_CARACTERISTICA)
      .map(([k, n]) => `<option value="${k}">${n} (${nave.system.stats[k].value})</option>`).join("");
    caracteristica = await DialogV2.wait({
      window: { title: `Tirada de nave · ${nave.name}` },
      classes: ["mr-kit-dialogo", "macro-popup-dialog"],
      content: `<div class="form-group"><label>Característica</label><select name="car">${opciones}</select></div>`,
      buttons: [{ label: "Tirar", action: "tirar", icon: "fa-solid fa-dice-d20", default: true, callback: (e, b) => b.form.elements.car.value }],
      rejectClose: false,
    });
    if (!caracteristica) return;
  }
  return nave.rollCheck(null, "low", caracteristica, null, null, null);
}

/* ------------------------------------------------------------------ */
/* Mantenimiento                                                       */
/* ------------------------------------------------------------------ */
export async function mantenimiento(nave = null, { titulo = "Tirada de mantenimiento", texto = null } = {}) {
  nave ??= await elegirNave();
  if (!nave) return;

  const modo = await elegirModo(titulo, texto ?? "Tirada de Sistemas. Un jefe de ingeniería dedicado puede dar Ventaja, a criterio del Guardián.");
  if (!modo) return;

  const objetivo = Number(nave.system.stats.systems.value) || 0;
  const { roll, total, dados, critico } = await tirarD100(modo);
  const exito = esExito(total, objetivo);
  const { averias, rolls } = await tirarAverias(exito ? 0 : critico ? 2 : 1);

  let cuerpo = `<p class="mr-kit-dados">${filaDado(dados)}</p>
    <p class="mr-kit-resultado ${exito ? "ok" : "mal"}">${exito ? (critico ? "ÉXITO CRÍTICO" : "ÉXITO") : critico ? "FALLO CRÍTICO" : "FALLO"} · ${String(total).padStart(2, "0")} / ${objetivo}</p>`;

  if (exito) {
    cuerpo += `<p>Todo sigue funcionando con normalidad.</p>`;
  } else {
    cuerpo += `<p class="mr-kit-efecto">Todos a bordo ganan <strong>1 de Estrés</strong>.</p>`;
    if (critico) cuerpo += `<p class="mr-kit-efecto mr-kit-critico">Fallo crítico: todos a bordo hacen una <strong>tirada de Pánico</strong> y se tira <strong>dos veces</strong> en la tabla.</p>`;
    cuerpo += averias.map((a) => htmlAveria(a, nave)).join("");
  }

  const html = tarjeta({ titulo, icono: "averia", subtitulo: `${nave.name} · Sistemas ${objetivo}`, cuerpo, clase: exito ? "exito" : "fallo" });
  return publicarTirada([roll, ...rolls], html, { actor: nave, flavor: titulo });
}

/** Informe tras la batalla: tirada de Sistemas si la nave ha sufrido MDMG. */
export function informeBatalla(nave = null) {
  return mantenimiento(nave, {
    titulo: "Informe tras la batalla",
    texto: "Tras un enfrentamiento violento en el que la nave ha sufrido MDMG, haz una tirada de Sistemas. Si fallas, tira en la tabla de averías de mantenimiento; con un fallo crítico, dos veces.",
  });
}

/* ------------------------------------------------------------------ */
/* Megadaño                                                            */
/* ------------------------------------------------------------------ */
export async function megadanio(nave = null) {
  nave ??= await elegirNave();
  if (!nave) return;
  const propio = valorMDMG(nave);

  const eleccion = await DialogV2.wait({
    window: { title: `Megadaño · ${nave.name}` },
    classes: ["mr-kit-dialogo", "macro-popup-dialog"],
    content: `<p>MDMG acumulado: <strong>${mdmgTotal(nave)}</strong> · Casco: <strong>${nave.system.supplies.hull.value}</strong></p>
      <p>¿Cuánto megadaño recibe la nave?</p>`,
    buttons: [
      { label: "1", action: "1", callback: () => "1" },
      { label: "1d5", action: "1d5", callback: () => "1d5" },
      { label: "1d10", action: "1d10", callback: () => "1d10" },
      { label: propio === "0" ? "Sin arma ofensiva" : `Como esta nave (${propio})`, action: "nave", icon: "fa-solid fa-crosshairs", default: true, callback: () => "nave" },
    ],
    rejectClose: false,
  });
  if (!eleccion) return;

  const expr = eleccion === "nave" ? propio : eleccion;
  if (expr === "0") return ui.notifications.warn(`${nave.name} no tiene un arma ofensiva instalada: no inflige MDMG.`);

  const { total: cantidad, roll } = await tirarExpresionMDMG(expr);
  const impacto = await aplicarImpacto(nave, cantidad);
  const efecto = await efectoMegadanio(impacto.total);

  const html = tarjeta({
    titulo: "Megadaño", icono: "megadanio",
    subtitulo: `${nave.name} · ${cantidad} MDMG${/d/.test(expr) ? ` (${expr})` : ""}`,
    cuerpo: `<p>${textoImpacto(impacto)}</p>
      ${impacto.absorbido ? "" : `<p class="mr-kit-resultado mal">${String(impacto.total).padStart(2, "0")}</p><p>${efecto}</p>`}
      ${impacto.total >= 9 ? `<p class="mr-kit-critico"><strong>¡La nave queda destruida!</strong></p>` : ""}
      <p class="mr-kit-nota">Solo se aplica el efecto del total acumulado. Recibir más megadaño suma al registro; hay que ir a puerto para borrarlo.</p>`,
    clase: "fallo",
  });
  return publicarTirada(roll, html, { actor: nave, flavor: "Megadaño" });
}

/* ------------------------------------------------------------------ */
/* Señal de socorro                                                    */
/* ------------------------------------------------------------------ */
export async function socorro(nave = null) {
  nave ??= await elegirNave({ obligatoria: false });
  const r = await tirarEnTabla("socorro");
  if (!r) return ui.notifications.error("No se encuentra la tabla de señales de socorro del módulo.");

  const t = r.total;
  const extra = t >= 3 && t <= 4
    ? `<p class="mr-kit-efecto">Salvación de <strong>Cuerpo</strong> o pierde <strong>1d5</strong> en todas las Características y Salvaciones.</p>`
    : t === 5
      ? `<p class="mr-kit-efecto">Salvación de <strong>Cuerpo [-]</strong> o pierde <strong>1d10</strong> en todas las Características y Salvaciones.</p>`
      : "";

  const html = tarjeta({
    titulo: "Señal de socorro", icono: "socorro",
    subtitulo: `d10 · ${String(t).padStart(2, "0")}`,
    cuerpo: `<p>${textoResultado(r.resultado).replace(/^\d\d(-\d\d)?\s*·\s*/, "")}</p>${extra}`,
    clase: "fallo",
  });
  return publicarTirada(r.roll, html, { actor: nave, flavor: "Señal de socorro" });
}

/* ------------------------------------------------------------------ */
/* Salvación de quiebra                                                */
/* ------------------------------------------------------------------ */
export async function quiebra(nave = null) {
  nave ??= await elegirNave({ obligatoria: false });
  const modo = await elegirModo("Salvación de Quiebra", "La Salvación de Quiebra empieza en 2d10+10. Ajusta el valor de la nave si ha cambiado.");
  if (!modo) return;

  const objetivo = Number(nave?.system?.stats?.bankruptcy?.value ?? 20);
  const { roll, total, dados, critico } = await tirarD100(modo);
  const exito = esExito(total, objetivo);
  const clave = exito ? (critico ? 0 : 1) : critico ? 3 : 2;
  const etiqueta = ["Éxito crítico", "Éxito", "Fallo", "Fallo crítico"][clave];

  const { resultado } = (await resultadoDeTabla("quiebra", clave)) ?? {};
  const html = tarjeta({
    titulo: "Salvación de Quiebra", icono: "quiebra",
    subtitulo: `${nave?.name ?? "Empresa"} · objetivo ${objetivo} o menos`,
    cuerpo: `<p class="mr-kit-dados">${filaDado(dados)}</p>
      <p class="mr-kit-resultado ${exito ? "ok" : "mal"}">${etiqueta} · ${String(total).padStart(2, "0")}</p>
      <p>${(resultado?.description ?? "—").replace(/^[^·]*·\s*/, "")}</p>`,
    clase: exito ? "exito" : "fallo",
  });
  return publicarTirada(roll, html, { actor: nave, flavor: "Salvación de Quiebra" });
}

/* ------------------------------------------------------------------ */
/* Moral                                                               */
/* ------------------------------------------------------------------ */
export async function moral(mdmgEnemigo = null) {
  const mdmg = mdmgEnemigo ?? await DialogV2.wait({
    window: { title: "Tirada de moral" },
    classes: ["mr-kit-dialogo", "macro-popup-dialog"],
    content: `<div class="form-group"><label>MDMG actual de la nave enemiga</label>
      <input type="number" name="mdmg" value="3" min="0" max="9" autofocus /></div>`,
    buttons: [{ label: "Tirar", action: "tirar", icon: "fa-solid fa-dice-d20", default: true, callback: (e, b) => Number(b.form.elements.mdmg.value) }],
    rejectClose: false,
  });
  if (mdmg == null) return;

  const roll = await tirar("1d10-1");
  const valor = roll.total;
  const ofrece = valor < mdmg;

  const html = tarjeta({
    titulo: "Tirada de moral", icono: "moral",
    subtitulo: `MDMG enemigo ${mdmg}`,
    cuerpo: `<p class="mr-kit-dados">${filaDado([valor])}</p>
      <p class="mr-kit-resultado ${ofrece ? "ok" : "mal"}">${ofrece ? "Ofrece un alto el fuego" : "Sigue combatiendo"} · ${valor}</p>
      <p class="mr-kit-nota">Si saca menos que su MDMG actual, puede enviar una llamada para ofrecer un alto el fuego y reanudar las negociaciones.</p>`,
    clase: ofrece ? "exito" : "fallo",
  });
  return publicarTirada(roll, html, { flavor: "Moral" });
}

/* ------------------------------------------------------------------ */
/* Averías iniciales                                                   */
/* ------------------------------------------------------------------ */
export async function averiasIniciales(nave = null) {
  nave ??= await elegirNave();
  if (!nave) return;

  const cuantas = await tirar("1d5+1");
  const { averias, rolls } = await tirarAverias(cuantas.total);
  const cuerpo = `<p>Estado inicial: <strong>${cuantas.total}</strong> reparaciones (1d5+1).</p>${averias.map((a) => htmlAveria(a, nave)).join("")}`;
  const html = tarjeta({ titulo: "Averías iniciales", icono: "averia", subtitulo: nave.name, cuerpo, clase: "fallo" });
  return publicarTirada([cuantas, ...rolls], html, { actor: nave, flavor: "Estado inicial de la nave" });
}

/* ------------------------------------------------------------------ */
/* Reparaciones                                                        */
/* ------------------------------------------------------------------ */
export async function reparar(nave = null) {
  nave ??= await elegirNave();
  if (!nave) return;

  const clase = claseNave(nave);
  const cascoMax = Number(nave.system.supplies.hull.max) || 0;
  const cascoPerdido = Math.max(0, cascoMax - (Number(nave.system.supplies.hull.value) || 0));
  const mdmg = mdmgTotal(nave);
  const reparaciones = nave.items.filter((i) => i.type === "repair");
  const mayores = reparaciones.filter((i) => i.system.major);
  const menores = reparaciones.filter((i) => !i.system.major);
  const puntos = cascoPerdido + mdmg;

  const fila = (nombre, etiqueta, n, extra = "") =>
    `<label class="mr-kit-fila-check"><input type="checkbox" name="${nombre}" ${n ? "checked" : "disabled"}> <span>${etiqueta} <strong>${n}</strong>${extra}</span></label>`;

  const marcado = await DialogV2.wait({
    window: { title: `Reparar · ${nave.name}` },
    classes: ["mr-kit-dialogo", "macro-popup-dialog"],
    content: `<p>Cada reparación mayor se hace en puerto y cuesta <strong>1d5 MCR × Clase ${clase}</strong>. Cada punto de Casco o de Megadaño cuenta como una reparación mayor independiente. Las menores las hace la tripulación en unos 2d10 días.</p>
      ${fila("puntos", "Casco perdido y Megadaño", puntos, ` <small>(Casco ${cascoPerdido} + MDMG ${mdmg})</small>`)}
      ${fila("mayores", "Averías mayores", mayores.length)}
      ${fila("menores", "Averías menores", menores.length)}`,
    buttons: [
      {
        label: "Reparar lo marcado", action: "reparar", icon: "fa-solid fa-wrench", default: true,
        callback: (e, b) => ({ puntos: b.form.elements.puntos.checked, mayores: b.form.elements.mayores.checked, menores: b.form.elements.menores.checked }),
      },
      { label: "Cerrar", action: "cerrar", icon: "fa-solid fa-xmark", callback: () => null },
    ],
    rejectClose: false,
  });
  if (!marcado) return;

  const cambios = {};
  const borrar = [];
  let nMayores = 0;
  if (marcado.puntos && puntos) {
    cambios["system.supplies.hull.value"] = cascoMax;
    cambios["system.megadamage.hits"] = [];
    nMayores += puntos;
  }
  if (marcado.mayores) { borrar.push(...mayores.map((i) => i.id)); nMayores += mayores.length; }
  if (marcado.menores) borrar.push(...menores.map((i) => i.id));
  if (!nMayores && !borrar.length) return ui.notifications.info("No hay nada que reparar.");

  const costeRoll = nMayores ? await tirar(`${nMayores}d5`) : null;
  const coste = costeRoll ? costeRoll.total * 1e6 * clase : 0;
  if (Object.keys(cambios).length) await nave.update(cambios);
  if (borrar.length) await nave.deleteEmbeddedDocuments("Item", borrar);

  const html = tarjeta({
    titulo: "Reparaciones", icono: "taller",
    subtitulo: nave.name,
    cuerpo: `<ul>
        ${marcado.puntos && puntos ? `<li>Casco y Megadaño: <strong>${puntos}</strong> reparaciones mayores (Casco ${cascoPerdido}, MDMG ${mdmg}).</li>` : ""}
        ${marcado.mayores && mayores.length ? `<li>Averías mayores resueltas: <strong>${mayores.length}</strong> (${mayores.map((i) => i.name.replace(/^\d+ · /, "")).join("; ")}).</li>` : ""}
        ${marcado.menores && menores.length ? `<li>Averías menores resueltas: <strong>${menores.length}</strong> (unos 2d10 días de trabajo).</li>` : ""}
      </ul>
      ${nMayores ? `<p class="mr-kit-resultado mal">${formatearCreditos(coste)}</p>
        <p>${nMayores}d5 MCR = <strong>${costeRoll.total}</strong> MCR × Clase ${clase}. Llevan de unos meses a un año, según la gravedad y la disponibilidad de piezas y mano de obra.</p>` : ""}`,
    clase: "exito",
  });
  return publicarTirada(costeRoll, html, { actor: nave, flavor: "Reparaciones" });
}

/* ------------------------------------------------------------------ */
/* Costes                                                              */
/* ------------------------------------------------------------------ */
export function costes() {
  return aviso("Costes de viaje y repostaje", `
    <h3>Costes de combustible</h3>
    <table><thead><tr><th>Acción</th><th>Combustible</th></tr></thead><tbody>
      <tr><td>Encender propulsores (al mes)</td><td>1 Combustible</td></tr>
      <tr><td>Intento de evasión (contacto)</td><td>3</td></tr>
      <tr><td>Intento de evasión (disparo)</td><td>2</td></tr>
      <tr><td>Intento de evasión (detección)</td><td>1</td></tr>
      <tr><td>Cambiar de rumbo</td><td>1</td></tr>
      <tr><td>Salto al hiperespacio</td><td>1 núcleo warp</td></tr>
    </tbody></table>
    <h3>Repostar</h3>
    <table><thead><tr><th>Clase de fuel</th><th>Coste/unidad</th></tr></thead><tbody>
      <tr><td>Clase I</td><td>1kcr</td></tr><tr><td>Clase II</td><td>2kcr</td></tr><tr><td>Clase III</td><td>5kcr</td></tr>
      <tr><td>Clase IV</td><td>50kcr</td></tr><tr><td>Clase V</td><td>100kcr</td></tr><tr><td>Núcleo warp</td><td>1mcr</td></tr>
    </tbody></table>
    <h3>Reabastecer armas (Clase I)</h3>
    <table><thead><tr><th>Arma</th><th>Coste</th></tr></thead><tbody>
      <tr><td>Cañón automático</td><td>100kcr</td></tr><tr><td>Láseres</td><td>50kcr</td></tr><tr><td>Misiles ligeros</td><td>200kcr</td></tr>
      <tr><td>Misiles pesados</td><td>300kcr</td></tr><tr><td>Haz de partículas</td><td>75kcr</td></tr><tr><td>Cañón de riel</td><td>400kcr</td></tr>
    </tbody></table>
    <p class="mr-kit-nota">Multiplica el coste por la Clase de tu nave. Si no reabasteces las armas tras un combate, tus tiradas de Batalla tendrán [-] en el siguiente y después fallarás todas automáticamente.</p>
  `);
}

/* ------------------------------------------------------------------ */
/* Aplicaciones                                                        */
/* ------------------------------------------------------------------ */
export const abrirDossier = () => game.mrKit.apps.abrirDossier();
export const viaje = () => game.mrKit.apps.abrirViaje();
export const combate = () => game.mrKit.apps.abrirCombate();
