/**
 * Calculadora de viaje espacial: combustible, núcleos warp, coste y billetes.
 */
import { MODULE, PRECIO_FUEL, claseNave, formatearCreditos, navesDisponibles, publicarTirada, tarjeta, filaDado } from "./util.js";
import { ConAccesibilidad } from "./accesibilidad.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const PLANTILLA = `modules/${MODULE}/templates/viaje.hbs`;

/** Duraciones orientativas (meses) para empezar: el manual solo da órdenes de magnitud; el Guardián decide. */
const ETAPAS = {
  1: "A un mundo cercano o punto de Salto (semanas)",
  6: "A un planeta lejano (meses)",
  24: "Al borde solar (años)",
};

/** Tarifas de pasaje del manual (créditos). `mult`: el multiplicador de destino se aplica a este servicio. */
const SERVICIOS = {
  interplanetario: {
    lanzadera: { n: "Lanzadera: asiento de pasajeros", p: 250, carga: 1000 },
    j0c3_3: { n: "J0C-III · 3.ª clase (solo criocápsula)", p: 1000, carga: 5000, hangar: 250000, mult: true },
    j0c3_2: { n: "J0C-III · 2.ª clase (4 literas por camarote, criocápsula)", p: 2500, carga: 5000, hangar: 250000, mult: true },
    j0c3_1: { n: "J0C-III · 1.ª clase (camarote privado, criocápsula)", p: 10000, carga: 5000, hangar: 250000, mult: true },
    j0c1_1: { n: "J0C-I Transporte ejecutivo · 1.ª clase (suite privada, criocápsula)", p: 20000 },
    flete: { n: "Nave fletada", p: 1000000, fijo: true },
  },
  interestelar: {
    j1c3_3: { n: "J1C-III Jumpliner · 3.ª clase (solo criocápsula)", p: 2000, carga: 20000, hangar: 500000, salto: true },
    j1c3_2: { n: "J1C-III Jumpliner · 2.ª clase (camarote privado, criocápsula)", p: 5000, carga: 20000, hangar: 500000, salto: true },
    j1c3_1: { n: "J1C-III Jumpliner · 1.ª clase (suite privada, criocápsula)", p: 20000, carga: 20000, hangar: 500000, salto: true },
    j2c1_1: { n: "J2C-I Transporte ejecutivo · 1.ª clase (suite privada, criocápsula)", p: 40000 },
    flete: { n: "Nave fletada", p: 2000000, fijo: true },
  },
};
const REMOLQUE = 500000;
const RECARGO_SALTO = { 1: 0, 2: 10000, 3: 30000 };
const DESTINOS = { 1: "Destino normal", 2: "A un planeta lejano (×2)", 4: "Al límite del sistema (×4)" };

export class ViajeEspacial extends ConAccesibilidad(HandlebarsApplicationMixin(ApplicationV2)) {
  static DEFAULT_OPTIONS = {
    id: "mr-kit-viaje",
    classes: ["mr-kit", "mr-kit-viaje"],
    tag: "div",
    window: { title: "Calculadora de viaje", icon: "fa-solid fa-route", resizable: true, contentClasses: ["mr-kit-contenido"] },
    position: { width: 720, height: 720 },
    actions: {
      pestana: ViajeEspacial.pestana,
      calcular: ViajeEspacial.calcular,
      gastar: ViajeEspacial.gastar,
      hiperespacio: ViajeEspacial.hiperespacio,
      billete: ViajeEspacial.billete,
      reiniciar: ViajeEspacial.reiniciar,
    },
  };

  static PARTS = { cuerpo: { template: PLANTILLA } };

  constructor(options = {}) {
    super(options);
    this.estado = {
      pestana: "nave", naveId: options.naveId ?? null,
      tipo: "interplanetario", meses: 1, cambios: 0, inyectores: false, saltos: 1,
      bTipo: "interplanetario", bServicio: "j0c3_3", bPasajeros: 1, bCarga: 0, bHangar: 0, bDestino: 1, bSalto: 1, bRemolque: false,
    };
    this.resultado = null;
    this.factura = null;
  }

  get nave() {
    return game.actors.get(this.estado.naveId) ?? null;
  }

  async _prepareContext() {
    const naves = navesDisponibles();
    if (!this.estado.naveId && naves.length) this.estado.naveId = naves[0].id;
    const nave = this.nave;
    const e = this.estado;
    const clase = nave ? claseNave(nave) : 1;
    const servicios = Object.fromEntries(Object.entries(SERVICIOS[e.bTipo]).map(([k, s]) => [k, `${s.n} · ${formatearCreditos(s.p)}`]));
    if (!servicios[e.bServicio]) e.bServicio = Object.keys(servicios)[0];
    const s = SERVICIOS[e.bTipo][e.bServicio];

    return {
      pestana: e.pestana,
      esNave: e.pestana === "nave",
      esBilletes: e.pestana === "billetes",
      naves: naves.map((n) => ({ id: n.id, nombre: n.name, seleccionada: n.id === e.naveId })),
      nave, clase, e,
      tipos: { interplanetario: "Interplanetario", interestelar: "Interestelar (Salto)" },
      etapas: ETAPAS,
      esInterplanetario: e.tipo === "interplanetario",
      precioFuel: formatearCreditos(PRECIO_FUEL[clase] ?? PRECIO_FUEL[1]),
      resultado: this.resultado,
      factura: this.factura,
      servicios,
      destinos: DESTINOS,
      saltos: { 1: "Salto-1", 2: "Salto-2", 3: "Salto-3" },
      bInterplanetario: e.bTipo === "interplanetario",
      bAdmiteCarga: Boolean(s?.carga),
      bAdmiteHangar: Boolean(s?.hangar),
      bMultiplicable: Boolean(s?.mult),
      bAdmiteSalto: Boolean(s?.salto),
      bFijo: Boolean(s?.fijo),
    };
  }

  /** Lee el formulario al estado (los nombres de los campos son las claves del estado). */
  leer() {
    for (const el of this.element.querySelectorAll("[name]")) {
      const k = el.name;
      if (!(k in this.estado)) continue;
      const actual = this.estado[k];
      this.estado[k] = typeof actual === "boolean" ? el.checked : typeof actual === "number" ? Number(el.value) || 0 : el.value;
    }
    return this.estado;
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    this.element.querySelectorAll("[data-cambio]").forEach((el) => el.addEventListener("change", () => {
      this.leer();
      this.render();
    }));
  }

  static pestana(event, target) {
    this.leer();
    this.estado.pestana = target.dataset.tab;
    this.render();
  }

  /* ----------------------------- Mi nave ----------------------------- */
  static async calcular() {
    const e = this.leer();
    const nave = this.nave;
    const clase = nave ? claseNave(nave) : 1;
    const precio = PRECIO_FUEL[clase] ?? PRECIO_FUEL[1];
    const factor = e.inyectores ? 2 : 1;
    const meses = Math.max(0, e.meses);
    const fuel = Math.ceil(meses / factor) + Math.max(0, e.cambios);
    const cambios = e.cambios ? ` + ${e.cambios} por cambiar de rumbo` : "";
    const inyectores = e.inyectores ? " Con inyectores optimizados, 1 de combustible dura 2 meses." : "";

    if (e.tipo === "interplanetario") {
      this.resultado = {
        tipo: "Interplanetario",
        tiempo: `${meses} ${meses === 1 ? "mes" : "meses"} de viaje espacial`,
        fuel, warp: 0, coste: formatearCreditos(fuel * precio),
        detalle: `1 de combustible por mes de viaje${cambios}.${inyectores} Combustible de Clase ${clase}: ${formatearCreditos(precio)} por unidad.`,
      };
    } else {
      const warp = Math.max(1, e.saltos);
      this.resultado = {
        tipo: `Interestelar · ${warp} ${warp === 1 ? "Salto" : "Saltos"}`,
        tiempo: `Unas 2 semanas hasta el punto de Salto, 2d10 días de hiperespacio por Salto y el viaje dentro del sistema (${meses} ${meses === 1 ? "mes" : "meses"})`,
        fuel, warp, coste: formatearCreditos(fuel * precio + warp * 1e6),
        detalle: `Cada Salto consume 1 núcleo warp (${formatearCreditos(1e6)}). El tramo dentro del sistema gasta 1 de combustible por mes${cambios}.${inyectores} Hace falta un motor de Salto del nivel adecuado.`,
      };
    }
    return this.render();
  }

  static async gastar() {
    this.leer();
    const nave = this.nave;
    if (!nave || !this.resultado) return ui.notifications.warn("Calcula primero el viaje.");
    const fuel = Number(nave.system.supplies.fuel.value) || 0;
    const warp = Number(nave.system.supplies["warp-cores"].value) || 0;
    if (this.resultado.fuel > fuel) return ui.notifications.warn(`${nave.name} no tiene combustible suficiente (${fuel}).`);
    if (this.resultado.warp > warp) return ui.notifications.warn(`${nave.name} no tiene núcleos warp suficientes (${warp}).`);
    await nave.update({ "system.supplies.fuel.value": fuel - this.resultado.fuel, "system.supplies.warp-cores.value": warp - this.resultado.warp });
    ui.notifications.info(`Gasto aplicado a ${nave.name}.`);
    return this.render();
  }

  /** Duración del paso por el hiperespacio: 2d10 días por Salto. */
  static async hiperespacio() {
    const e = this.leer();
    const saltos = Math.max(1, e.saltos);
    const roll = await new Roll(`${saltos}d10+${saltos}d10`).evaluate();
    const html = tarjeta({
      titulo: "Hiperespacio", icono: "viaje",
      subtitulo: `${saltos} ${saltos === 1 ? "Salto" : "Saltos"} · 2d10 días cada uno`,
      cuerpo: `<p class="mr-kit-dados">${filaDado([roll.total])}</p><p class="mr-kit-resultado ok">${roll.total} días</p>
        <p class="mr-kit-nota">Los efectos relativistas son inciertos: fuera, la duración real puede ser muy distinta (desde segundos hasta años). El Guardián decide.</p>`,
    });
    return publicarTirada(roll, html, { actor: this.nave, flavor: "Duración del hiperespacio" });
  }

  /* ------------------------------ Billetes ----------------------------- */
  static async billete() {
    const e = this.leer();
    const s = SERVICIOS[e.bTipo][e.bServicio];
    if (!s) return;
    const pax = s.fijo ? 1 : Math.max(1, e.bPasajeros);
    const lineas = [];
    let total = 0;
    const suma = (texto, valor) => { lineas.push([texto, valor]); total += valor; };

    suma(`${s.n}${s.fijo ? "" : ` × ${pax}`}`, s.p * pax);
    if (s.salto && RECARGO_SALTO[e.bSalto]) suma(`Billete de Salto-${e.bSalto} × ${pax}`, RECARGO_SALTO[e.bSalto] * pax);
    if (s.carga && e.bCarga > 0) suma(`Espacio de carga × ${e.bCarga}`, s.carga * e.bCarga);
    if (s.hangar && e.bHangar > 0) suma(`Espacio de hangar × ${e.bHangar}`, s.hangar * e.bHangar);
    if (s.mult && e.bDestino > 1) {
      const extra = total * (e.bDestino - 1);
      suma(`Destino: ×${e.bDestino}`, extra);
    }
    if (e.bRemolque) suma("Remolque de nave (Clase II o inferior, máx. 1 nave)", REMOLQUE);

    this.factura = { lineas: lineas.map(([t, v]) => ({ texto: t, valor: formatearCreditos(v) })), total: formatearCreditos(total) };
    return this.render();
  }

  static reiniciar() {
    this.resultado = null;
    this.factura = null;
    return this.render();
  }
}
