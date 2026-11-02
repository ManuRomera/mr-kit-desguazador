/**
 * Dossier de nave: panel de consulta y control rápido del Kit del Desguazador (ApplicationV2).
 */
import { MODULE, mdmgTotal, ajustarRecurso, valorMDMG, flagsNave, efectoMegadanio } from "./util.js";
import { ConAccesibilidad, guardarLocal, recordarLocal } from "./accesibilidad.js";
import { sincronizarNave } from "./sincronizar.js";
import * as macros from "./macros.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const PLANTILLA = `modules/${MODULE}/templates/dossier.hbs`;
const PESTANAS = ["resumen", "estado", "cubiertas", "reglas"];

export class DossierNave extends ConAccesibilidad(HandlebarsApplicationMixin(ApplicationV2)) {
  static DEFAULT_OPTIONS = {
    id: "mr-kit-dossier",
    classes: ["mr-kit", "mr-kit-dossier"],
    tag: "div",
    window: { title: "Dossier de nave", icon: "fa-solid fa-satellite-dish", resizable: true, contentClasses: ["mr-kit-contenido"] },
    position: { width: 780, height: 800 },
    actions: {
      pestana: DossierNave.pestana,
      tirada: DossierNave.tirada,
      ajustar: DossierNave.ajustar,
      alternarMdmg: DossierNave.alternarMdmg,
      borrarAveria: DossierNave.borrarAveria,
      mantenimiento: DossierNave.mantenimiento,
      megadanio: DossierNave.megadanio,
      socorro: DossierNave.socorro,
      quiebra: DossierNave.quiebra,
      reparar: DossierNave.reparar,
      iniciales: DossierNave.iniciales,
      sincronizar: DossierNave.sincronizar,
      abrirFicha: DossierNave.abrirFicha,
      abrirCompendio: DossierNave.abrirCompendio,
    },
  };

  static PARTS = { cuerpo: { template: PLANTILLA } };

  static _initializeApplicationOptions(options) {
    const o = super._initializeApplicationOptions(options);
    if (options?.actor) o.id = `mr-kit-dossier-${options.actor.id}`;
    return o;
  }

  constructor(options = {}) {
    super(options);
    this.actor = options.actor ?? null;
    const recordada = recordarLocal(`pestana.${this.actor?.id}`);
    this.tab = [options.tab, recordada].find((t) => PESTANAS.includes(t)) ?? "resumen";
    // Repinta cuando cambia la nave o alguno de sus objetos (armas, mejoras, averías).
    this._ganchos = [
      ["updateActor", (a) => a.id === this.actor?.id && this.rendered && this.render()],
      ...["createItem", "updateItem", "deleteItem"].map((h) => [h, (i) => i.parent?.id === this.actor?.id && this.rendered && this.render()]),
    ].map(([hook, fn]) => [hook, Hooks.on(hook, fn)]);
  }

  async close(options) {
    for (const [hook, id] of this._ganchos) Hooks.off(hook, id);
    return super.close(options);
  }

  get title() {
    return this.actor ? `Dossier · ${this.actor.name}` : "Dossier de nave";
  }

  async _prepareContext() {
    const actor = this.actor;
    if (!actor) return { vacio: true };

    const sistema = actor.system;
    const flags = flagsNave(actor);
    const armas = actor.items.filter((i) => i.type === "weapon");
    const modulos = actor.items.filter((i) => i.type === "module");
    const averias = actor.items.filter((i) => i.type === "repair");
    const hangar = actor.items.filter((i) => i.type === "item");
    const nombreAveria = (a) => a.name.replace(/^\d+ · /, "");

    const mdmg = mdmgTotal(actor);
    const hits = (sistema.megadamage?.hits ?? []).map(Number);
    const circulos = Array.from({ length: 9 }, (_, i) => ({ valor: i + 1, activo: i + 1 === mdmg, ultimo: i + 1 === mdmg }));

    const enriquecer = (html) => foundry.applications.ux.TextEditor.implementation.enrichHTML(html ?? "", { relativeTo: actor });

    return {
      vacio: false,
      actor,
      sistema,
      flags,
      armas: armas.map((a) => ({ id: a.id, nombre: a.name, bonus: a.system.bonus ?? 0, img: a.img, defensiva: Boolean(a.flags?.[MODULE]?.defensiva) })),
      modulos: modulos.map((m) => ({ id: m.id, nombre: m.name, rasgo: m.system.feature ?? "", img: m.img })),
      hangar: hangar.map((h) => ({ id: h.id, nombre: h.name, cantidad: h.system.quantity ?? 1, img: h.img })),
      averiasMenores: averias.filter((a) => !a.system.major).map((a) => ({ id: a.id, nombre: nombreAveria(a) })),
      averiasMayores: averias.filter((a) => a.system.major).map((a) => ({ id: a.id, nombre: nombreAveria(a) })),
      mdmg,
      circulos,
      mdmgDado: valorMDMG(actor),
      efecto: await efectoMegadanio(mdmg),
      reglas: await enriquecer(flags.extra),
      notas: flags.notas ?? [],
      cubiertas: flags.cubiertas ?? [],
      pestanas: [
        { id: "resumen", nombre: "Resumen", activa: this.tab === "resumen" },
        { id: "estado", nombre: "Estado y averías", activa: this.tab === "estado" },
        { id: "cubiertas", nombre: "Plano de cubierta", activa: this.tab === "cubiertas" },
        ...(flags.extra ? [{ id: "reglas", nombre: "Reglas de la nave", activa: this.tab === "reglas" }] : []),
      ],
      esResumen: this.tab === "resumen",
      esEstado: this.tab === "estado",
      esCubiertas: this.tab === "cubiertas",
      esReglas: this.tab === "reglas",
      anclajes: { usados: armas.length, max: sistema["weapon-stats"]?.hardpoints?.max ?? flags.anclajesMax ?? 0 },
      mejoras: { usadas: modulos.length, max: sistema.supplies?.upgrades?.max ?? flags.mejorasMax ?? 0 },
      sincronizable: Boolean(flags.aplicado),
      coste: flags.coste ?? "—",
      eslora: flags.eslora ?? "—",
    };
  }

  /* ----------------------------- Acciones ----------------------------- */
  static pestana(event, target) {
    this.tab = target.dataset.tab;
    guardarLocal(`pestana.${this.actor?.id}`, this.tab);
    this.render();
  }

  static tirada(event, target) {
    return macros.tiradaCaracteristica(this.actor, target.dataset.car);
  }

  static ajustar(event, target) {
    return ajustarRecurso(this.actor, target.dataset.ruta, Number(target.dataset.delta) || 0);
  }

  static async alternarMdmg(event, target) {
    // Una sola marca, la del total; pulsar la marcada la quita.
    const indice = Number(target.dataset.indice);
    await this.actor.update({ "system.megadamage.hits": mdmgTotal(this.actor) === indice ? [] : [indice] });
  }

  static async borrarAveria(event, target) {
    await this.actor.items.get(target.dataset.itemId)?.delete();
  }

  static mantenimiento() { return macros.mantenimiento(this.actor); }
  static megadanio() { return macros.megadanio(this.actor); }
  static socorro() { return macros.socorro(this.actor); }
  static quiebra() { return macros.quiebra(this.actor); }
  static reparar() { return macros.reparar(this.actor); }
  static iniciales() { return macros.averiasIniciales(this.actor); }

  static async sincronizar() {
    const cambios = await sincronizarNave(this.actor);
    ui.notifications.info(cambios ? `${this.actor.name}: cifras recalculadas.` : `${this.actor.name}: las cifras ya estaban al día.`);
  }

  static abrirFicha() {
    this.actor.sheet.render({ force: true });
  }

  static abrirCompendio(event, target) {
    game.packs.get(`${MODULE}.${target.dataset.pack}`)?.render(true);
  }
}
