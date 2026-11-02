/**
 * MR- Kit del Desguazador
 * Contenido y automatizaciones del Shipbreakers Toolkit para Mothership (sistema mosh).
 * Punto de entrada: ajustes, ficha de nave, parche de mantenimiento y sincronización de cifras.
 */
import { MODULE, registrarBotonesChat, elegirNave, uuidDeTabla } from "./util.js";
import * as macros from "./macros.js";
import { ViajeEspacial } from "./viaje.js";
import { registrarAccesibilidad } from "./accesibilidad.js";
import { registrarSincronizacion, sincronizarNave } from "./sincronizar.js";
import { crearHojaNave } from "./hoja-nave.js";

const ultimaNave = () => game.user.getFlag(MODULE, "ultimaNave") ?? null;

const apps = {
  /** Abre la ficha de la nave (el Kit ya no tiene ventanas aparte: todo está en la ficha). */
  async abrirHoja(actor = null) {
    const nave = actor ?? (await elegirNave({ titulo: "¿Qué nave abrir?" }));
    if (!nave) return null;
    game.user.setFlag(MODULE, "ultimaNave", nave.id).catch(() => {});
    return nave.sheet.render({ force: true });
  },

  abrirViaje({ naveId = null } = {}) {
    return new ViajeEspacial({ naveId: naveId ?? ultimaNave() }).render({ force: true });
  },
};

/* ------------------------------------------------------------------ */
/* Ajustes                                                             */
/* ------------------------------------------------------------------ */
Hooks.once("init", () => {
  game.settings.register(MODULE, "hojaNave", {
    name: "Ficha de nave del Kit",
    hint: "Usa la ficha de nave del Kit (aspecto de la ficha de personaje, tiradas, armas, megadaño y reabastecimiento integrados). Al desactivarla vuelve la ficha de nave del sistema. Hay que recargar.",
    scope: "world", config: true, type: Boolean, default: true, requiresReload: true,
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

/** La ficha del Kit se crea a partir de la del sistema, que el sistema registra al terminar de cargar (no antes de `ready`). */
Hooks.once("ready", () => {
  if (game.system.id !== "mosh" || !game.settings.get(MODULE, "hojaNave")) return;
  const Hoja = crearHojaNave();
  if (!Hoja) return console.warn(`${MODULE} | No se encontró la ficha de nave del sistema: se mantiene la original.`);
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Actor, MODULE, Hoja, { types: ["ship"], makeDefault: true, label: "Nave del Kit del Desguazador" });
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
    apps_ui: { ViajeEspacial },
    sincronizarNave,
  };

  registrarBotonesChat();
  registrarSincronizacion();
  // Las naves importadas antes de 1.5.0 llevaban el plano de cubierta por defecto del sistema, igual para todas.
  if (game.user.isGM) {
    game.actors.filter((n) => n.type === "ship" && n.flags?.[MODULE]?.nave && /Galloway_Top/.test(n.system.images?.layout ?? ""))
      .forEach((n) => n.update({ "system.images.layout": `modules/${MODULE}/assets/planos/${n.flags[MODULE].nave}.webp` }));
  }
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
/* Fin del combate: al cerrar el combate se pide reabastecer las armas  */
/* ------------------------------------------------------------------ */
Hooks.on("deleteCombat", (combate, opciones, userId) => {
  if (userId !== game.user.id || !game.user.isGM) return;
  const naves = new Set(combate.combatants.map((c) => c.actor).filter((a) => a?.type === "ship"));
  naves.forEach((nave) => macros.terminarCombate(nave, { auto: true }));
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
