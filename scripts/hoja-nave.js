/**
 * Ficha de nave del Kit del Desguazador.
 * Parte de la ficha de nave del sistema mosh (conserva sus listeners: objetos, plano de cubierta, quiebra, megadaño…) y
 * le da una plantilla propia con el aspecto de la ficha de personaje y todo lo del Kit integrado: tiradas de
 * Característica con la tripulación, disparo desde el nombre del arma, estado de reabastecimiento por arma,
 * megadaño con sus efectos, mantenimiento, socorro, moral, reparaciones y viaje.
 */
import { MODULE, mdmgTotal, armasPendientes, flagsNave, efectoMegadanio } from "./util.js";
import * as macros from "./macros.js";
import { dispararNave } from "./ataque.js";

const quitarEtiquetas = (html) => String(html ?? "").replace(/<br\s*\/?>.*$/s, "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

/** Crea la clase a partir de la ficha del sistema (que no existe hasta que mosh se inicializa). */
export function crearHojaNave() {
  const Base = Object.values(CONFIG.Actor.sheetClasses?.ship ?? {}).map((s) => s.cls).find((c) => c?.name === "MothershipShipSheetSBT");
  if (!Base) return null;

  return class HojaNaveKit extends Base {
    static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
        classes: ["mosh", "sheet", "actor", "ship", "mr-kit-nave"],
        template: `modules/${MODULE}/templates/nave.hbs`,
        width: 820,
        height: 840,
        tabs: [{ navSelector: "#sheet-tabs", contentSelector: "#sheet-body", initial: "weapons" }],
        scrollY: [".mr-kit-cuerpo .tab", ".mr-kit-trip-lista"],
      });
    }

    // La ficha del sistema reescribe en cada pintado el HTML de megadaño con un update; aquí se calcula sin escribir.
    _prepareMegadamage() {}

    /** El plano de cubierta se abre como imagen (la ventana del sistema sale colapsada) y el Guardián puede enseñarlo a los jugadores. */
    _onOpenDeckplan(event) {
      event.preventDefault();
      const src = this.actor.system.images?.layout;
      if (!src) return ui.notifications.warn("Esta nave no tiene plano de cubierta.");
      new foundry.applications.apps.ImagePopout({ src, window: { title: `${this.actor.name}: plano de cubierta` }, shareable: true }).render({ force: true });
    }

    async getData() {
      const d = await super.getData();
      const nave = this.actor;
      d.cssClass = this.isEditable ? "editable" : "locked";
      d.owner = nave.isOwner;
      d.editable = this.isEditable;
      d.weapons.forEach((w) => { w.mrVacia = Boolean(w.flags?.[MODULE]?.vacia); });

      // Megadaño: los nueve efectos de la tabla y cuáles están marcados.
      const total = mdmgTotal(nave);
      const hits = (nave.system.megadamage?.hits ?? []).map(Number);
      const tabla = await fromUuid(game.settings.get("mosh", "table1eMegadamageEffects")).catch(() => null);
      const resultados = tabla ? [...tabla.results].sort((a, b) => a.range[0] - b.range[0]) : [];
      const pasos = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => ({ n, activo: hits.includes(n), texto: quitarEtiquetas(resultados[n]?.description ?? resultados[n]?.text ?? "") }));
      const efectoActual = total ? await efectoMegadanio(total) : "Sin daños.";

      // Armas: estado del reabastecimiento.
      const f = flagsNave(nave);
      const pendiente = armasPendientes(nave);
      const hayVacias = d.weapons.some((w) => w.mrVacia);
      let estadoArmas = null;
      if (d.weapons.length) {
        if (pendiente >= 2) estadoArmas = { clase: "mal", icono: "fa-triangle-exclamation", texto: "Armas sin reabastecer: la nave falla la Batalla." };
        else if (pendiente === 1 || hayVacias) estadoArmas = { clase: "aviso", icono: "fa-battery-quarter", texto: "Armas sin reabastecer: [-] en la Batalla del próximo combate." };
        else if (f.armasUsadas) estadoArmas = { clase: "aviso", icono: "fa-fire", texto: "Has usado las armas: al acabar el combate hay que reabastecerlas." };
        if (estadoArmas) Object.assign(estadoArmas, { rearmar: pendiente > 0 || hayVacias, terminar: Boolean(f.armasUsadas) && !hayVacias });
      }

      d.mrKit = { mdmgTotal: total, efectoActual, pasos, estadoArmas };
      return d;
    }

    activateListeners(html) {
      super.activateListeners(html);
      const raiz = html[0];
      if (!raiz) return;
      const nave = this.actor;

      // Tiradas de Característica con la lógica del Kit (tripulación, Estrés, Pánico).
      raiz.querySelectorAll(".mr-kit-tirada").forEach((el) => el.addEventListener("click", (ev) => {
        ev.preventDefault();
        macros.tiradaCaracteristica(nave, el.dataset.key);
      }));

      // Como en una ficha de personaje, se dispara pulsando el nombre del arma (en lugar de mostrar su descripción).
      raiz.querySelector('.tab[data-tab="weapons"]')?.addEventListener("click", (ev) => {
        const nombre = ev.target.closest(".weapon-roll");
        if (!nombre) return;
        ev.preventDefault();
        ev.stopImmediatePropagation();
        dispararNave(nave, nave.items.get(nombre.closest("li.item")?.dataset.itemId));
      }, true);

      raiz.querySelectorAll(".mr-kit-rearmar.vacia").forEach((el) => el.addEventListener("click", (ev) => {
        ev.preventDefault();
        macros.reabastecerArma(nave, nave.items.get(el.closest("li.item")?.dataset.itemId));
      }));

      const acciones = {
        mantenimiento: () => macros.mantenimiento(nave),
        socorro: () => macros.socorro(nave),
        moral: () => macros.moral(),
        reparar: () => macros.reparar(nave),
        viaje: () => game.mrKit.apps.abrirViaje({ naveId: nave.id }),
        terminar: () => macros.terminarCombate(nave),
        "rearmar-todas": () => macros.reabastecer(nave),
      };
      raiz.querySelectorAll("[data-accion]").forEach((el) => el.addEventListener("click", (ev) => {
        ev.preventDefault();
        acciones[el.dataset.accion]?.();
      }));
    }
  };
}
