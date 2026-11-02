/**
 * Panel de combate nave contra nave (fases de Movimiento, Ataque y Moral) según el Kit del Desguazador.
 */
import {
  MODULE, BANDAS, ETIQUETA_BANDA, COSTE_EVASION, mdmgTotal, aplicarImpacto, valorMDMG, tirarExpresionMDMG,
  tirarSistema, efectoMegadanio, publicarTirada, tarjeta, claseNave, navesDisponibles,
} from "./util.js";
import { ConAccesibilidad } from "./accesibilidad.js";
import * as macros from "./macros.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const PLANTILLA = `modules/${MODULE}/templates/combate.hbs`;
const POSTURAS = { evadir: "Evadir", perseguir: "Perseguir", mantener: "Mantener el rumbo" };
const dir = (postura) => (postura === "evadir" ? 1 : -1);
const dos = (n) => String(n).padStart(2, "0");

/** Impacto sobre una nave sin ficha (la enemiga): el Casco absorbe lo que sea menor que él. */
function impactoLocal(enemigo, cantidad) {
  const anterior = enemigo.mdmg;
  let resto = cantidad;
  let absorbido = false;
  let cascoDestruido = false;
  if (enemigo.casco > 0 && resto > 0) {
    if (resto < enemigo.casco) { absorbido = true; resto = 0; }
    else { cascoDestruido = true; resto -= enemigo.casco; enemigo.casco = 0; }
  }
  enemigo.mdmg = Math.min(9, anterior + resto);
  return { anterior, total: enemigo.mdmg, absorbido, cascoDestruido };
}

const resumenImpacto = (i) => (i.absorbido ? "el Casco absorbe el impacto"
  : i.cascoDestruido && i.total === i.anterior ? "el Casco se destruye y absorbe todo el impacto"
  : `${i.anterior} → ${i.total} MDMG${i.cascoDestruido ? ", Casco destruido" : ""}`);

export class CombateNaves extends ConAccesibilidad(HandlebarsApplicationMixin(ApplicationV2)) {
  static DEFAULT_OPTIONS = {
    id: "mr-kit-combate",
    classes: ["mr-kit", "mr-kit-combate"],
    tag: "div",
    window: { title: "Combate de naves", icon: "fa-solid fa-crosshairs", resizable: true, contentClasses: ["mr-kit-contenido"] },
    position: { width: 820, height: 820 },
    actions: {
      movimiento: CombateNaves.movimiento,
      ataque: CombateNaves.ataque,
      moral: CombateNaves.moral,
      informe: CombateNaves.informe,
      ronda: CombateNaves.ronda,
      reiniciar: CombateNaves.reiniciar,
      mdmgEnemigo: CombateNaves.mdmgEnemigo,
    },
  };

  static PARTS = { cuerpo: { template: PLANTILLA } };

  constructor(options = {}) {
    super(options);
    this.estado = {
      naveId: options.naveId ?? null,
      enemigo: { nombre: "Nave enemiga", clase: 2, pro: 20, bat: 20, sis: 20, casco: 0, mdmg: 0, dmg: "1d5", armas: true },
      distancia: "disparo",
      ronda: 1,
      log: [],
      mov: { postura: "perseguir", posturaEnemiga: "evadir", fuelPropia: 0, fuelEnemiga: 0 },
    };
  }

  get title() {
    return `Combate de naves · ronda ${this.estado.ronda}`;
  }

  get nave() {
    return game.actors.get(this.estado.naveId) ?? null;
  }

  async _prepareContext() {
    const naves = navesDisponibles();
    if (!this.estado.naveId && naves.length) this.estado.naveId = naves[0].id;
    const nave = this.nave;
    const e = this.estado.enemigo;
    const diff = nave ? claseNave(nave) - e.clase : 0;

    return {
      naves: naves.map((n) => ({ id: n.id, nombre: n.name, seleccionada: n.id === this.estado.naveId })),
      nave,
      enemigo: e,
      posturas: POSTURAS,
      mov: this.estado.mov,
      distancias: { contacto: "Contacto", disparo: "Disparo", deteccion: "Detección" },
      distancia: this.estado.distancia,
      costeEvasion: COSTE_EVASION[this.estado.distancia],
      ronda: this.estado.ronda,
      log: this.estado.log.slice().reverse(),
      mdmgNave: nave ? mdmgTotal(nave) : 0,
      mdmgDado: nave ? valorMDMG(nave) : "0",
      puedeAtacar: BANDAS.indexOf(this.estado.distancia) <= 1,
      efectoNave: nave ? await efectoMegadanio(mdmgTotal(nave)) : "",
      efectoEnemigo: await efectoMegadanio(e.mdmg),
      aviso: diff === 1 ? "Tu nave es de una Clase superior: tienes [+] en Batalla y MDMG."
        : diff === -1 ? "La nave enemiga es de una Clase superior: tiene [+] en Batalla y MDMG."
        : diff >= 2 ? "Tu nave es invencible en un enfrentamiento directo (2 o más Clases por encima), salvo que el Guardián decida lo contrario."
        : diff <= -2 ? "La nave enemiga es invencible en un enfrentamiento directo (2 o más Clases por encima), salvo que el Guardián decida lo contrario."
        : "",
    };
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    this.element.querySelector("select[name='naveId']")?.addEventListener("change", (ev) => {
      this.leer();
      this.estado.naveId = ev.target.value;
      this.render();
    });
    this.element.querySelector("select[name='distancia']")?.addEventListener("change", (ev) => {
      this.estado.distancia = ev.target.value;
      this.render();
    });
  }

  /** Lee el formulario al estado, para que no se pierda al repintar. */
  leer() {
    const f = this.element;
    const el = (n) => f.querySelector(`[name='${n}']`);
    const val = (n, d) => el(n)?.value ?? d;
    const num = (n, d = 0) => Number(el(n)?.value ?? d) || 0;
    const e = this.estado.enemigo;

    this.estado.naveId = val("naveId", this.estado.naveId);
    this.estado.distancia = val("distancia", this.estado.distancia);
    Object.assign(e, {
      nombre: val("enemigoNombre", e.nombre), clase: num("enemigoClase", e.clase), pro: num("enemigoPro", e.pro),
      bat: num("enemigoBat", e.bat), sis: num("enemigoSis", e.sis), casco: num("enemigoCasco", e.casco),
      dmg: val("enemigoDmg", e.dmg).trim() || "1d5", armas: Boolean(el("enemigoArmas")?.checked ?? e.armas),
    });
    Object.assign(this.estado.mov, {
      postura: val("postura", "perseguir"), posturaEnemiga: val("posturaEnemiga", "evadir"),
      fuelPropia: num("fuelPropia"), fuelEnemiga: num("fuelEnemiga"),
    });
    return this.estado.mov;
  }

  registrar(texto) {
    this.estado.log.push({ ronda: this.estado.ronda, texto });
  }

  /** Publica en el chat lo ocurrido en una fase y lo anota en el registro del panel. */
  async publicar(titulo, nave, rolls, lineas) {
    for (const l of lineas) this.registrar(l);
    const html = tarjeta({ titulo, icono: "combate", subtitulo: `${nave.name} contra ${this.estado.enemigo.nombre} · ronda ${this.estado.ronda}`, cuerpo: lineas.map((l) => `<p>${l}</p>`).join(""), clase: "fallo" });
    return publicarTirada(rolls.filter(Boolean), html, { actor: nave, flavor: titulo });
  }

  /* ---------------------------------------------------------------- */
  static async movimiento() {
    const { postura, posturaEnemiga, fuelPropia, fuelEnemiga } = this.leer();
    const nave = this.nave;
    if (!nave) return ui.notifications.warn("Selecciona una nave propia.");
    const e = this.estado.enemigo;
    const banda = this.estado.distancia;
    const minimo = COSTE_EVASION[banda];
    const efectoN = mdmgTotal(nave);
    const lineas = [];

    // Combustible: el mínimo para evadir, y 1 más con «Fuga de combustible de emergencia» (MDMG 1).
    let gasto = postura === "mantener" ? 0 : Math.max(0, fuelPropia);
    if (postura === "evadir" && gasto < minimo) {
      ui.notifications.warn(`Para evadir a alcance de ${ETIQUETA_BANDA[banda]} hacen falta al menos ${minimo} de combustible.`);
      gasto = minimo;
    }
    const fuga = gasto > 0 && efectoN === 1 ? 1 : 0;
    const disponible = Number(nave.system.supplies.fuel.value) || 0;
    if (disponible < gasto + fuga) return ui.notifications.warn(`${nave.name} solo tiene ${disponible} de combustible.`);
    let gastoE = posturaEnemiga === "mantener" ? 0 : Math.max(0, fuelEnemiga);
    if (posturaEnemiga === "evadir" && gastoE < minimo) gastoE = minimo;

    const P = { auto: false, exito: false, critico: false, valor: null };
    const E = { auto: false, exito: false, critico: false, valor: null };
    const rolls = [];

    if (postura === "mantener" && posturaEnemiga === "mantener") {
      lineas.push("<strong>Movimiento</strong> · Ambas naves mantienen el rumbo: la distancia no cambia.");
    } else if (postura === "mantener" || posturaEnemiga === "mantener") {
      if (postura === "mantener") E.auto = true; else P.auto = true;
    } else {
      // Las dos tiran Propulsores; quien gastó más combustible tiene [+].
      if (efectoN === 3) {
        lineas.push("Sin navegación (MDMG 3): tu nave no puede hacer tiradas de Propulsores y falla.");
      } else {
        const r = await tirarSistema(nave, { modo: gasto > gastoE ? "ventaja" : "normal", objetivo: Number(nave.system.stats.thrusters.value) || 0 });
        rolls.push(r.roll);
        Object.assign(P, { valor: r.total, critico: r.critico, exito: r.exito });
      }
      const r2 = await tirarSistema(nave, { modo: gastoE > gasto ? "ventaja" : "normal", objetivo: e.pro });
      rolls.push(r2.roll);
      Object.assign(E, { valor: r2.total, critico: r2.critico, exito: r2.exito });
    }

    // Éxito crítico: avanzas aunque el enemigo también tenga éxito. Fallo crítico: el otro avanza aunque falle.
    const fallaCrit = (x) => x.valor !== null && !x.exito && x.critico;
    const logra = (a, b) => a.auto || (a.exito && (!b.exito || a.critico)) || fallaCrit(b);
    const lograP = logra(P, E);
    const lograE = logra(E, P);
    let mov = 0;
    let nota = "Empate: la distancia no cambia.";
    if (lograP && lograE) mov = dir(postura) === dir(posturaEnemiga) ? dir(postura) : 0;
    else if (lograP) { mov = dir(postura); nota = `${nave.name} logra su objetivo${P.auto ? " sin tirar" : ""}.`; }
    else if (lograE) { mov = dir(posturaEnemiga); nota = `${e.nombre} logra su objetivo${E.auto ? " sin tirar" : ""}.`; }
    if (postura === "mantener" && posturaEnemiga === "mantener") nota = "";

    const indice = Math.max(0, Math.min(BANDAS.length - 1, BANDAS.indexOf(banda) + mov));
    this.estado.distancia = BANDAS[indice];

    if (gasto + fuga > 0) await nave.update({ "system.supplies.fuel.value": disponible - gasto - fuga });

    if (nota) {
      const tira = (x, objetivo, ventaja) => (x.valor === null ? "" : `${dos(x.valor)}/${objetivo}${ventaja ? " [+]" : ""}${x.critico ? " crítico" : ""}`);
      lineas.push(`<strong>Movimiento</strong> · ${nave.name} (${POSTURAS[postura]}${gasto ? `, ${gasto + fuga} de combustible` : ""}) ${tira(P, nave.system.stats.thrusters.value, gasto > gastoE)} · ${e.nombre} (${POSTURAS[posturaEnemiga]}${gastoE ? `, ${gastoE}` : ""}) ${tira(E, e.pro, gastoE > gasto)}. ${nota} Alcance de <strong>${ETIQUETA_BANDA[this.estado.distancia]}</strong>.`);
    }
    if (fuga) lineas.push("Fuga de combustible de emergencia: has gastado 1 de combustible más.");
    if (P.valor !== null && !P.exito) lineas.push(`Fallo de Propulsores: todos a bordo ganan <strong>1 de Estrés</strong>${P.critico ? " y hacen una <strong>tirada de Pánico</strong>" : ""}.`);

    await this.publicar("Fase de movimiento", nave, rolls, lineas);
    return this.render();
  }

  /* ---------------------------------------------------------------- */
  static async ataque() {
    this.leer();
    const nave = this.nave;
    if (!nave) return ui.notifications.warn("Selecciona una nave propia.");
    const e = this.estado.enemigo;
    const lejos = BANDAS.indexOf(this.estado.distancia) > 1;
    const riel = nave.items.some((i) => i.type === "weapon" && i.name.startsWith("Cañón de riel"));
    if (lejos && !riel) return ui.notifications.warn("A alcance de detección solo dispara el cañón de riel.");

    const efectoN = mdmgTotal(nave);
    const tieneArmas = nave.items.some((i) => i.type === "weapon") && efectoN !== 2;
    const dmgNave = valorMDMG(nave);
    const soloDefensivas = tieneArmas && dmgNave === "0";
    const diff = claseNave(nave) - e.clase;
    const modoP = diff === 1 ? "ventaja" : "normal";
    const contramedidas = nave.items.some((i) => i.type === "weapon" && i.name.startsWith("Contramedidas"));
    const modoE = diff === -1 ? "ventaja" : "normal";
    const lineas = [];
    const rolls = [];

    // Batalla: sin armas (o desconectadas) se falla automáticamente y el oponente acierta sin tirar.
    const P = { exito: false, critico: false, valor: null };
    const E = { exito: false, critico: false, valor: null };
    if (tieneArmas) {
      const r = await tirarSistema(nave, { modo: modoP, objetivo: Number(nave.system.stats.battle.value) || 0 });
      rolls.push(r.roll);
      Object.assign(P, { valor: r.total, critico: r.critico, exito: r.exito });
    }
    if (!tieneArmas) E.exito = true;
    else if (e.armas) {
      const r = await tirarSistema(nave, { modo: modoE, objetivo: e.bat });
      rolls.push(r.roll);
      Object.assign(E, { valor: r.total, critico: r.critico, exito: r.exito });
    }

    // MDMG: éxito = MDMG de la nave (doble con crítico); fallo = 1 de MDMG propio (2 con crítico) además.
    let infligidoAlEnemigo = 0;
    let infligidoANave = 0;
    if (P.exito && !soloDefensivas) {
      const m = await tirarExpresionMDMG(dmgNave, modoP);
      if (m.roll) rolls.push(m.roll);
      infligidoAlEnemigo = m.total * (P.critico ? 2 : 1);
    }
    if (E.exito && e.armas) {
      const m = await tirarExpresionMDMG(e.dmg, modoE === "ventaja" ? "ventaja" : contramedidas ? "desventaja" : "normal");
      if (m.roll) rolls.push(m.roll);
      infligidoANave = m.total * (E.critico ? 2 : 1);
    }
    const extraNave = tieneArmas && !P.exito && !soloDefensivas ? (P.critico ? 2 : 1) : 0;
    const extraEnemigo = e.armas && !E.exito ? (E.critico ? 2 : 1) : 0;
    const danoANave = infligidoANave + extraNave;
    const danoAEnemigo = infligidoAlEnemigo + extraEnemigo;

    const tira = (x, objetivo, modo) => (x.valor === null ? "sin tirada" : `${dos(x.valor)}/${objetivo}${modo === "ventaja" ? " [+]" : ""} ${x.exito ? (x.critico ? "éxito crítico" : "éxito") : (x.critico ? "fallo crítico" : "fallo")}`);
    lineas.push(`<strong>Ataque</strong> · ${nave.name}: ${tieneArmas ? tira(P, nave.system.stats.battle.value, modoP) : "sin armas operativas, falla automáticamente"}. ${e.nombre}: ${e.armas ? tira(E, e.bat, modoE) : "sin armas, falla automáticamente"}.`);

    if (danoAEnemigo > 0) {
      const i = impactoLocal(e, danoAEnemigo);
      lineas.push(`${e.nombre} recibe <strong>${danoAEnemigo}</strong> MDMG (${resumenImpacto(i)}). ${i.absorbido ? "" : `Efecto: ${await efectoMegadanio(i.total)}`}`);
    } else {
      lineas.push(`${e.nombre} no recibe MDMG.`);
    }
    if (danoANave > 0) {
      const i = await aplicarImpacto(nave, danoANave);
      lineas.push(`${nave.name} recibe <strong>${danoANave}</strong> MDMG (${resumenImpacto(i)}). ${i.absorbido ? "" : `Efecto: ${await efectoMegadanio(i.total)}`}`);
    } else {
      lineas.push(`${nave.name} no recibe MDMG.`);
    }
    if (tieneArmas && !P.exito) lineas.push(`Fallo de Batalla: todos a bordo de ${nave.name} ganan <strong>1 de Estrés</strong>${P.critico ? " y hacen una <strong>tirada de Pánico</strong>" : ""}.`);
    if (soloDefensivas) lineas.push("Solo hay armas defensivas instaladas: no se inflige MDMG.");

    await this.publicar("Fase de ataque", nave, rolls, lineas);
    return this.render();
  }

  /* ---------------------------------------------------------------- */
  static async moral() {
    this.leer();
    const e = this.estado.enemigo;
    if (e.mdmg <= 0) return ui.notifications.warn("El enemigo no ha sufrido MDMG: no hace tirada de moral.");
    this.registrar(`<strong>Moral</strong> · ${e.nombre} tira 1d10 contra su MDMG (${e.mdmg}); el resultado está en el chat.`);
    await macros.moral(e.mdmg);
    return this.render();
  }

  static async informe() {
    this.leer();
    if (!this.nave) return ui.notifications.warn("Selecciona una nave propia.");
    this.registrar("<strong>Informe tras la batalla</strong> · tirada de Sistemas de la nave propia.");
    await macros.informeBatalla(this.nave);
    return this.render();
  }

  static async ronda() {
    this.leer();
    this.estado.ronda += 1;
    this.registrar(`<em>Comienza la ronda ${this.estado.ronda}.</em>`);
    return this.render();
  }

  static async reiniciar() {
    this.leer();
    this.estado.ronda = 1;
    this.estado.distancia = "disparo";
    this.estado.enemigo.mdmg = 0;
    this.estado.log = [];
    return this.render();
  }

  static async mdmgEnemigo() {
    this.leer();
    this.estado.enemigo.mdmg = Math.min(9, this.estado.enemigo.mdmg + 1);
    this.registrar(`<strong>MDMG manual</strong> · ${this.estado.enemigo.nombre} sube a ${this.estado.enemigo.mdmg}.`);
    return this.render();
  }
}
