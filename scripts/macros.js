/**
 * Macros del Kit del Desguazador.
 * Se exponen en game.mrKit.macros y las macros del compendio llaman a estos métodos.
 */
import { dispararNave } from "./ataque.js";
import { MODULE } from "./util.js";
import {
  aviso, elegirNave, elegirModo, pedirTirada, tirarSistema, publicarTirada, filaDado, tarjeta,
  mdmgTotal, armasPendientes, modoConPenalizacion, precioReabastecer, aplicarImpacto, textoImpacto, valorMDMG, tirarExpresionMDMG, efectoMegadanio, tirarAverias, htmlAveria,
  claseNave, formatearCreditos,
} from "./util.js";

const { DialogV2 } = foundry.applications.api;
const tirar = (formula) => new Roll(formula).evaluate();

const NOMBRE_CARACTERISTICA = { thrusters: "Propulsores", battle: "Batalla", systems: "Sistemas" };

/* ------------------------------------------------------------------ */
/* Tirada de característica de nave                                    */
/* ------------------------------------------------------------------ */
/**
 * Tirada de Propulsores, Batalla o Sistemas de la nave con la lógica del sistema (por debajo, 90+ falla, dobles críticos,
 * Ventaja/Desventaja) y la regla del manual: cada vez que una nave falla una tirada de Característica, todos a bordo
 * ganan 1 de Estrés (y hacen una tirada de Pánico con un fallo crítico). Solo una persona aporta su bonificación de habilidad.
 */
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
      buttons: [{ label: "Siguiente", action: "tirar", icon: "fa-solid fa-dice-d20", default: true, callback: (e, b) => b.form.elements.car.value }],
      rejectClose: false,
    });
    if (!caracteristica) return;
  }

  const nombre = NOMBRE_CARACTERISTICA[caracteristica];
  const efecto = mdmgTotal(nave);
  if (caracteristica === "thrusters" && efecto === 3) return ui.notifications.warn("Sin navegación (MDMG 3): la nave no puede hacer tiradas de Propulsores.");
  const sinArmas = caracteristica === "battle" && (efecto === 2 || armasPendientes(nave) >= 2);

  const datos = await pedirTirada(nave, `Tirada de ${nombre} · ${nave.name}`);
  if (!datos) return;

  const valor = (Number(nave.system.stats[caracteristica].value) || 0) + datos.bonus;
  const modo = caracteristica === "battle" ? modoConPenalizacion(nave, datos.modo) : datos.modo;
  const rolls = [];
  let t = { total: null, exito: false, critico: false, dados: [] };
  if (!sinArmas) {
    t = await tirarSistema(nave, { modo, objetivo: valor });
    rolls.push(t.roll);
  }

  const etiqueta = sinArmas ? "Falla automáticamente" : `${t.exito ? (t.critico ? "ÉXITO CRÍTICO" : "ÉXITO") : t.critico ? "FALLO CRÍTICO" : "FALLO"} · ${String(t.total).padStart(2, "0")} / ${valor}`;
  let cuerpo = `${sinArmas ? "" : `<p class="mr-kit-dados">${filaDado(t.dados)}</p>`}<p class="mr-kit-resultado ${t.exito ? "ok" : "mal"}">${etiqueta}</p>`;
  if (sinArmas) cuerpo += `<p class="mr-kit-nota">${efecto === 2 ? "Armas inactivas (MDMG 2)" : "Armas sin reabastecer"}: la nave falla todas las tiradas de Batalla.</p>`;
  if (!t.exito) cuerpo += `<p class="mr-kit-efecto">Todos a bordo ganan <strong>1 de Estrés</strong> @UUID[Compendium.mosh.macros_triggered_1e.dvJR9DYXI2kV0BbR]{+1 Estrés}${t.critico ? " y hacen una <strong>tirada de Pánico</strong>" : ""}.</p>`;
  const icono = { thrusters: "viaje", battle: "combate", systems: "averia" }[caracteristica];
  const html = tarjeta({ titulo: `Tirada de ${nombre}`, icono, subtitulo: `${nave.name}${datos.bonus ? ` · ${datos.quien || "habilidad"} +${datos.bonus}` : ""}`, cuerpo, clase: t.exito ? "exito" : "fallo" });
  return publicarTirada(rolls, html, { actor: nave, flavor: `Tirada de ${nombre}` });
}

/* ------------------------------------------------------------------ */
/* Mantenimiento                                                       */
/* ------------------------------------------------------------------ */

/**
 * Mantenimiento, socorro y quiebra son del sistema: usa su diálogo de Ventaja/Normal/Desventaja, su tirada de
 * característica (por debajo, 90+ falla, dobles críticos), el Estrés de «todos a bordo» y su enlace para tirar
 * otra vez tras un fallo crítico. El Kit solo pone sus tablas (ajuste «Usar las tablas del Kit en las tiradas
 * del sistema») y un botón para añadir la avería a la nave.
 */
export async function mantenimiento(nave = null) {
  nave ??= await elegirNave();
  if (!nave) return;
  return nave.maintenanceCheck();
}

/** Informe tras la batalla: tirada de Sistemas y, si falla, la tabla de averías; es la misma tirada que el mantenimiento. */
export function informeBatalla(nave = null) {
  ui.notifications.info("Informe tras la batalla: tirada de Sistemas; si fallas, tabla de averías de mantenimiento.");
  return mantenimiento(nave);
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
  nave ??= await elegirNave();
  if (!nave) return;
  // El diálogo del sistema (`distressSignal`) apunta a una plantilla que no existe en mosh 0.6.1: se pide el modo aquí y se
  // tira con la misma llamada que usa el sistema (d10 por debajo, tabla de 0 a 9).
  const modo = await elegirModo("Señal de socorro", "Tira 1d10 en la tabla de señales de socorro.");
  if (!modo) return;
  const dado = modo === "ventaja" ? "1d10 [+]" : modo === "desventaja" ? "1d10 [-]" : "1d10";
  return nave.rollTable(game.settings.get("mosh", "table1eDistressSignal"), dado, "low", true, false, null, null);
}
/* ------------------------------------------------------------------ */
/* Salvación de quiebra                                                */
/* ------------------------------------------------------------------ */

export async function quiebra(nave = null) {
  nave ??= await elegirNave();
  if (!nave) return;
  return nave.bankruptcySave();
}
/* ------------------------------------------------------------------ */
/* Moral                                                               */
/* ------------------------------------------------------------------ */

/** Moral de una nave enemiga sin ficha: 1d10 (0-9) con la misma regla que el sistema; si saca menos que su MDMG, puede pedir un alto el fuego. */
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
  const modo = await elegirModo("Tirada de moral", "La nave enemiga tira 1d10: si saca menos que su MDMG, puede ofrecer un alto el fuego.");
  if (!modo) return;

  const actor = game.actors.find((a) => a.type === "ship") ?? game.actors.contents[0];
  const { roll, total, exito, dados } = await tirarSistema(actor, { dado: "1d10", modo, aim: "high", objetivo: mdmg, comparacion: ">=", criticos: false });
  const ofrece = !exito;

  const html = tarjeta({
    titulo: "Tirada de moral",
    icono: "moral",
    subtitulo: `MDMG enemigo ${mdmg}`,
    cuerpo: `<p class="mr-kit-dados">${filaDado(dados)}</p>
      <p class="mr-kit-resultado ${ofrece ? "ok" : "mal"}">${ofrece ? "Ofrece un alto el fuego" : "Sigue combatiendo"} · ${total}</p>
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
    content: `${nave.items.some((i) => i.type === "module" && i.name.startsWith("Taller")) ? '<p class="mr-kit-nota">Con el <strong>Taller</strong> puedes reparar hasta 3 MDMG y 3 de Casco sin volver a puerto (reabastecer el taller: 200kcr).</p>' : ""}<p>Cada reparación mayor se hace en puerto y cuesta <strong>1d5 MCR × Clase ${clase}</strong>. Cada punto de Casco o de Megadaño cuenta como una reparación mayor independiente. Las menores las hace la tripulación en unos 2d10 días.</p>
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
/* Reabastecer las armas                                               */
/* ------------------------------------------------------------------ */
/**
 * Tras un enfrentamiento en el que hayas usado las armas de la nave debes reabastecerte (en puerto). Si no lo haces, tus
 * tiradas de Batalla tienen [-] en el siguiente combate; después, fallas automáticamente todas las tiradas de Batalla.
 */
export async function terminarCombate(nave = null) {
  nave ??= await elegirNave();
  if (!nave) return;
  const usadas = Boolean(nave.flags?.[MODULE]?.armasUsadas);
  const antes = armasPendientes(nave);
  if (!usadas) {
    return publicarTirada(null, tarjeta({ titulo: "Fin del combate", icono: "combate", subtitulo: nave.name, cuerpo: "<p>La nave no ha usado sus armas: no hace falta reabastecer.</p>" }), { actor: nave });
  }
  const pendiente = Math.min(2, antes + 1);
  await nave.update({ [`flags.${MODULE}.pendiente`]: pendiente, [`flags.${MODULE}.armasUsadas`]: false });
  await nave.updateEmbeddedDocuments("Item", nave.items.filter((i) => i.type === "weapon").map((i) => ({ _id: i.id, [`flags.${MODULE}.vacia`]: true })));
  const clase = claseNave(nave);
  const coste = nave.items.filter((i) => i.type === "weapon").reduce((a, i) => a + precioReabastecer(i), 0) * clase;
  const consecuencia = pendiente === 1 ? "Si no reabasteces, tus tiradas de Batalla tendrán [-] en el siguiente combate." : "Si no reabasteces, la nave fallará automáticamente todas las tiradas de Batalla.";
  const html = tarjeta({
    titulo: "Fin del combate", icono: "combate", subtitulo: nave.name,
    cuerpo: `<p>La nave ha usado sus armas: hay que <strong>reabastecerlas en puerto</strong> (${formatearCreditos(coste)}).</p><p class="mr-kit-efecto">${consecuencia}</p>
      ${mdmgTotal(nave) ? `<p class="mr-kit-nota">La nave ha sufrido MDMG: haz el informe tras la batalla (tirada de Sistemas).</p>` : ""}`,
    clase: "fallo",
  });
  return publicarTirada(null, html, { actor: nave, flavor: "Fin del combate" });
}

export async function reabastecer(nave = null) {
  nave ??= await elegirNave();
  if (!nave) return;
  const clase = claseNave(nave);
  const armas = nave.items.filter((i) => i.type === "weapon");
  const filas = armas.map((a) => `<li>${a.name}: ${formatearCreditos(precioReabastecer(a) * clase)}</li>`).join("");
  const coste = armas.reduce((s, a) => s + precioReabastecer(a), 0) * clase;
  const ok = await DialogV2.wait({
    window: { title: `Reabastecer armas · ${nave.name}` },
    classes: ["mr-kit-dialogo", "macro-popup-dialog"],
    content: `<p>Reabastecer las armas en puerto cuesta, por arma y Clase ${clase}:</p><ul>${filas || "<li>La nave no tiene armas.</li>"}</ul><p><strong>Total: ${formatearCreditos(coste)}</strong></p>`,
    buttons: [
      { label: "Reabastecer todas", action: "si", icon: "fa-solid fa-gun", default: true, callback: () => true },
      { label: "Cancelar", action: "no", icon: "fa-solid fa-xmark", callback: () => false },
    ],
    rejectClose: false,
  });
  if (!ok) return;
  await nave.update({ [`flags.${MODULE}.pendiente`]: 0, [`flags.${MODULE}.armasUsadas`]: false });
  await nave.updateEmbeddedDocuments("Item", armas.map((i) => ({ _id: i.id, [`flags.${MODULE}.vacia`]: false })));
  return publicarTirada(null, tarjeta({ titulo: "Armas reabastecidas", icono: "arma", subtitulo: nave.name, cuerpo: `<p>Coste: <strong>${formatearCreditos(coste)}</strong>. Las tiradas de Batalla vuelven a la normalidad.</p>`, clase: "exito" }), { actor: nave, flavor: "Reabastecer armas" });
}

/** Reabastece (rearma) una sola arma. Cuando no queda ninguna sin reabastecer, la nave recupera su Batalla normal. */
export async function reabastecerArma(nave, arma) {
  if (!nave || !arma) return;
  if (!arma.flags?.[MODULE]?.vacia) return ui.notifications.info(`${arma.name} ya está reabastecida.`);
  const coste = precioReabastecer(arma) * claseNave(nave);
  await arma.update({ [`flags.${MODULE}.vacia`]: false });
  const quedan = nave.items.some((i) => i.type === "weapon" && i.flags?.[MODULE]?.vacia);
  if (!quedan) await nave.update({ [`flags.${MODULE}.pendiente`]: 0, [`flags.${MODULE}.armasUsadas`]: false });
  return publicarTirada(null, tarjeta({
    titulo: "Arma reabastecida", icono: "arma", subtitulo: nave.name,
    cuerpo: `<p><strong>${arma.name}</strong>: ${formatearCreditos(coste)}.</p>${quedan ? "<p class=\"mr-kit-nota\">Quedan armas sin reabastecer.</p>" : "<p>Todas las armas están reabastecidas: las tiradas de Batalla vuelven a la normalidad.</p>"}`,
    clase: "exito",
  }), { actor: nave, flavor: "Reabastecer arma" });
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
/** Disparo de la nave controlada (o elegida) contra la nave marcada como objetivo. */
export async function disparar(nave = null) {
  nave ??= await elegirNave();
  return dispararNave(nave);
}

export const abrirDossier = () => game.mrKit.apps.abrirDossier();
export const viaje = () => game.mrKit.apps.abrirViaje();
export const combate = () => game.mrKit.apps.abrirCombate();
