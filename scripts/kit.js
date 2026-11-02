/**
 * MR- Kit del Desguazador
 * Contenido y automatizaciones del Shipbreakers Toolkit para Mothership (sistema mosh).
 * Punto de entrada: ajustes, parche de mantenimiento, pestaña Dossier y sincronización de cifras.
 */
import { MODULE, registrarBotonesChat, elegirNave } from "./util.js";
import * as macros from "./macros.js";
import { DossierNave } from "./dossier.js";
import { CombateNaves } from "./combate.js";
import { ViajeEspacial } from "./viaje.js";
import { registrarAccesibilidad } from "./accesibilidad.js";
import { registrarSincronizacion, sincronizarNave } from "./sincronizar.js";

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

  game.settings.register(MODULE, "mantenimientoSBT", {
    name: "Usar la tabla de averías del Kit del Desguazador",
    hint: "Sustituye la tirada de mantenimiento de la ficha de nave por la del Kit: 69 averías menores y 31 mayores, con botón para añadirlas a la nave. Si se desactiva, se usa la tabla del sistema.",
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
  parchearMantenimiento();
});

/* ------------------------------------------------------------------ */
/* Parche de mantenimiento                                             */
/* ------------------------------------------------------------------ */
function parchearMantenimiento() {
  const proto = CONFIG.Actor?.documentClass?.prototype;
  if (!proto || typeof proto.maintenanceCheck !== "function" || proto.__mrKitMantenimientoOriginal) return;

  proto.__mrKitMantenimientoOriginal = proto.maintenanceCheck;
  proto.maintenanceCheck = function (...args) {
    if (this.type === "ship" && game.settings.get(MODULE, "mantenimientoSBT")) return macros.mantenimiento(this);
    return proto.__mrKitMantenimientoOriginal.apply(this, args);
  };
}

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
});
