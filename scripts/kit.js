/**
 * MR- Kit del Desguazador
 * Contenido y automatizaciones del Shipbreakers Toolkit para Mothership (sistema mosh).
 * Punto de entrada: ajustes, parche de mantenimiento, pestaña Dossier y sincronización de cifras.
 */
import { MODULE, registrarBotonesChat, elegirNave, uuidDeTabla } from "./util.js";
import * as macros from "./macros.js";
import { DossierNave } from "./dossier.js";
import { CombateNaves } from "./combate.js";
import { ViajeEspacial } from "./viaje.js";
import { registrarAccesibilidad } from "./accesibilidad.js";
import { registrarSincronizacion, sincronizarNave } from "./sincronizar.js";
import { dispararNave } from "./ataque.js";

const ultimaNave = () => game.user.getFlag(MODULE, "ultimaNave") ?? null;

const apps = {
  async abrirDossier(actor = null, tab = null) {
    const nave = actor ?? (await elegirNave({ titulo: "¿De qué nave abrir el dossier?" }));
    if (!nave) return null;
    game.user.setFlag(MODULE, "ultimaNave", nave.id).catch(() => {});
    return new DossierNave({ actor: nave, tab }).render({ force: true });
  },

  abrirCombate({ naveId = null } = {}) {
    return new CombateNaves({ naveId: naveId ?? ultimaNave() }).render({ force: true });
  },

  abrirViaje({ naveId = null } = {}) {
    return new ViajeEspacial({ naveId: naveId ?? ultimaNave() }).render({ force: true });
  },
};

/* ------------------------------------------------------------------ */
/* Ajustes                                                             */
/* ------------------------------------------------------------------ */
Hooks.once("init", () => {
  game.settings.register(MODULE, "botonDossier", {
    name: "Botón Dossier en la ficha de nave",
    hint: "Añade una pestaña «Dossier» a la ficha de nave del sistema mosh.",
    scope: "client", config: true, type: Boolean, default: true,
  });

  game.settings.register(MODULE, "tablasSistema", {
    name: "Usar las tablas del Kit en las tiradas del sistema",
    hint: "El mantenimiento, las señales de socorro, la salvación de quiebra y la lista de megadaño de la ficha de nave usan las tablas del Kit del Desguazador (averías d100, megadaño, socorro y quiebra) en lugar de las del sistema. Al desactivarlo se restauran las del sistema.",
    scope: "world", config: true, type: Boolean, default: true,
  });

  game.settings.register(MODULE, "sincronizar", {
    name: "Mantener al día las cifras de la nave",
    hint: "Al añadir o quitar armas, mejoras y naves de Clase 0 a una nave del Kit, recalcula anclajes, mejoras, Batalla, MDMG y los efectos de las mejoras (Sistemas, Propulsores, combustible, Casco, Clase). Respeta lo que edites a mano.",
    scope: "world", config: true, type: Boolean, default: true,
  });

  registrarAccesibilidad();
});

/* ------------------------------------------------------------------ */
/* Listo                                                               */
/* ------------------------------------------------------------------ */
Hooks.once("ready", () => {
  if (game.system.id !== "mosh") {
    console.warn(`${MODULE}: este módulo está pensado para el sistema mosh (MoSh – Unofficial Mothership).`);
  }

  game.mrKit = {
    version: game.modules.get(MODULE)?.version,
    macros,
    apps,
    apps_ui: { DossierNave, CombateNaves, ViajeEspacial },
    sincronizarNave,
  };

  registrarBotonesChat();
  registrarSincronizacion();
  vincularTablas().catch((err) => console.error(`${MODULE} | No se pudieron vincular las tablas`, err));
});

/* ------------------------------------------------------------------ */
/* Tablas del Kit en los ajustes del sistema                           */
/* ------------------------------------------------------------------ */
/** Ajuste de mosh → clave de la tabla del Kit que lo sustituye. */
const TABLAS = { table1eMaintenance: "averias", table1eDistressSignal: "socorro", table1eBankruptcy: "quiebra", table1eMegadamageEffects: "megadanio" };

/**
 * El sistema lee qué tabla usar de sus ajustes (`table1e…`). Mientras el ajuste del Kit esté activo, esas lecturas
 * devuelven las tablas del Kit; los ajustes del sistema no se tocan, así que al desactivar el módulo todo vuelve a
 * ser como antes.
 */
async function vincularTablas() {
  if (game.system.id !== "mosh") return;
  const uuids = {};
  for (const [ajuste, clave] of Object.entries(TABLAS)) uuids[ajuste] = await uuidDeTabla(clave);
  const leer = game.settings.get.bind(game.settings);
  game.settings.get = (modulo, clave, opciones) =>
    modulo === "mosh" && uuids[clave] && leer(MODULE, "tablasSistema") ? uuids[clave] : leer(modulo, clave, opciones);
}

/* ------------------------------------------------------------------ */
/* Salvación de Quiebra inicial                                        */
/* ------------------------------------------------------------------ */
/** El manual la fija en 2d10+10 al empezar: las naves del Kit la tiran al importarse en lugar de llevar un 20 fijo. */
Hooks.on("createActor", async (actor, options, userId) => {
  if (userId !== game.user.id || actor.type !== "ship" || !actor.flags?.[MODULE]?.aplicado || actor.flags[MODULE].quiebraInicial) return;
  const roll = await new Roll("2d10+10").evaluate();
  await actor.update({ "system.stats.bankruptcy.value": roll.total, [`flags.${MODULE}.quiebraInicial`]: roll.total });
  ui.notifications.info(`${actor.name}: Salvación de Quiebra inicial 2d10+10 = ${roll.total}.`);
});

/* ------------------------------------------------------------------ */
/* Pestaña Dossier en la ficha de nave                                 */
/* ------------------------------------------------------------------ */
Hooks.on("renderActorSheet", (app, html) => {
  if (app.actor?.type !== "ship" || !game.settings.get(MODULE, "botonDossier")) return;

  const raiz = html instanceof HTMLElement ? html : html?.[0];
  const nav = raiz?.querySelector?.("#sheet-tabs");
  if (!nav || nav.querySelector(".mr-kit-dossier-tab")) return;

  const enlace = document.createElement("a");
  enlace.className = "mr-kit-dossier-tab";
  enlace.dataset.tooltip = "Abrir el dossier del Kit del Desguazador";
  enlace.innerHTML = '<i class="fa-solid fa-satellite-dish"></i> Dossier';
  enlace.addEventListener("click", (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    apps.abrirDossier(app.actor);
  });
  nav.appendChild(enlace);

  // Pestaña de armas: como en la ficha de un personaje, se dispara pulsando el nombre del arma.
  const armas = raiz.querySelector('.tab[data-tab="weapons"]');
  if (!armas) return;
  armas.addEventListener("click", (ev) => {
    const nombre = ev.target.closest(".weapon-roll");
    if (!nombre) return;
    ev.preventDefault();
    ev.stopImmediatePropagation(); // en lugar de solo mostrar la descripción
    const arma = app.actor.items.get(nombre.closest("li.item")?.dataset.itemId);
    dispararNave(app.actor, arma);
  }, true);
  armas.querySelectorAll(".weapon-roll").forEach((n) => { n.dataset.tooltip = "Disparar: tirada de Batalla contra la nave marcada como objetivo (T)"; });

  // Estado de cada arma (cargada o sin reabastecer) y barra para terminar el combate y rearmar.
  armas.querySelectorAll("li.item[data-item-id]").forEach((fila) => {
    const arma = app.actor.items.get(fila.dataset.itemId);
    const controles = fila.querySelector(".item-controls");
    if (!arma || !controles || controles.querySelector(".mr-kit-rearmar")) return;
    const vacia = Boolean(arma.flags?.[MODULE]?.vacia);
    const a = document.createElement("a");
    a.className = `item-control mr-kit-rearmar ${vacia ? "vacia" : "cargada"}`;
    a.dataset.tooltip = vacia ? "Sin reabastecer: pulsa para rearmar esta arma" : "Cargada";
    a.setAttribute("aria-label", vacia ? `Rearmar ${arma.name}` : `${arma.name} cargada`);
    a.innerHTML = `<i class="fa-solid ${vacia ? "fa-battery-empty" : "fa-battery-full"}"></i>`;
    if (vacia) a.addEventListener("click", (ev) => { ev.preventDefault(); ev.stopPropagation(); macros.reabastecerArma(app.actor, arma); });
    controles.prepend(a);
  });
  const lista = armas.querySelector("ol.items-list");
  if (lista && !armas.querySelector(".mr-kit-armas-barra") && app.actor.items.some((i) => i.type === "weapon")) {
    const pendiente = Number(app.actor.flags?.[MODULE]?.pendiente) || 0;
    const barra = document.createElement("div");
    barra.className = "mr-kit-armas-barra";
    barra.innerHTML = `<span>${pendiente >= 2 ? "Armas sin reabastecer: la nave falla la Batalla." : pendiente === 1 ? "Armas sin reabastecer: [-] en Batalla en el próximo combate." : app.actor.flags?.[MODULE]?.armasUsadas ? "Has usado las armas: al terminar el combate hay que reabastecerlas." : "Pulsa el nombre de un arma para disparar."}</span>
      <a class="mr-kit-barra-boton" data-accion="terminar"><i class="fa-solid fa-flag-checkered"></i> Terminar el combate</a>
      <a class="mr-kit-barra-boton" data-accion="rearmar"><i class="fa-solid fa-gun"></i> Rearmar todas</a>`;
    barra.addEventListener("click", (ev) => {
      const accion = ev.target.closest("[data-accion]")?.dataset.accion;
      if (accion === "terminar") macros.terminarCombate(app.actor);
      if (accion === "rearmar") macros.reabastecer(app.actor);
    });
    lista.before(barra);
  }
});

/* ------------------------------------------------------------------ */
/* Tripulación: arrastrar un personaje a la ficha de la nave           */
/* ------------------------------------------------------------------ */
Hooks.on("dropActorSheetData", (nave, hoja, datos) => {
  if (nave.type !== "ship" || datos?.type !== "Actor") return;
  const personaje = fromUuidSync(datos.uuid);
  if (!personaje || personaje.type !== "character") return;
  if (nave.items.some((i) => i.type === "crew" && i.flags?.[MODULE]?.actorUuid === personaje.uuid)) {
    ui.notifications.info(`${personaje.name} ya forma parte de la tripulación de ${nave.name}.`);
    return false;
  }
  nave.createEmbeddedDocuments("Item", [{
    name: personaje.name, type: "crew", img: personaje.img,
    system: { job: String(personaje.system.class?.value ?? ""), text: "" },
    flags: { [MODULE]: { actorUuid: personaje.uuid } },
  }]).then(() => ui.notifications.info(`${personaje.name} se une a la tripulación de ${nave.name}: sus habilidades se pueden sumar a las tiradas de la nave.`));
  return false;
});
