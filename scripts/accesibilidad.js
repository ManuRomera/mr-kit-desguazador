/**
 * Accesibilidad y memoria de las ventanas del módulo.
 *
 * Los ajustes (tamaño del texto, modo oscuro, alto contraste, fuente legible, reducir movimiento y ayuda
 * inmediata) son los mismos que los de MR- Mothership en español: si ese módulo está activo, se leen y se
 * escriben allí (una sola configuración para todo Mothership); si no, el Kit registra los suyos y activa las
 * mismas clases del <body> (`mr-mosh-*`) y la misma variable `--mr-escala`.
 */
import { MODULE } from "./util.js";

const ES = "mr-mothership-es";
const CAJAS = [
  ["oscuro", "Modo oscuro", "Ventanas y tarjetas del Kit en negro."],
  ["contraste", "Alto contraste", "Texto y bordes más marcados."],
  ["legible", "Fuente de alta legibilidad", "Letra más espaciada y de formas claras."],
  ["movimiento", "Reducir movimiento", "Sin transiciones ni animaciones en las ventanas y tarjetas."],
  ["ayuda", "Ayuda inmediata", "Los textos de ayuda aparecen al instante al pasar el ratón."],
];

const dueno = () => (game.modules.get(ES)?.active ? ES : MODULE);
const leer = (k) => game.settings.get(dueno(), `a11y-${k}`);

/** Clases y variable del <body>. Si MR- Mothership en español está activo, ya lo hace él. */
export function aplicarAccesibilidad() {
  if (dueno() === ES) return;
  document.documentElement.style.setProperty("--mr-escala", String(leer("escala") / 100));
  for (const [k] of CAJAS) document.body.classList.toggle(`mr-mosh-${k}`, leer(k));
  const tip = game.tooltip?.constructor;
  if (tip) tip.TOOLTIP_ACTIVATION_MS = leer("ayuda") ? 60 : 500;
}

/** Registrar en `init`. Sin MR- Mothership en español, el Kit lleva sus propios ajustes de cliente. */
export function registrarAccesibilidad() {
  if (dueno() === ES) return;
  const reg = (k, datos) => game.settings.register(MODULE, `a11y-${k}`, { scope: "client", config: true, onChange: aplicarAccesibilidad, ...datos });
  reg("escala", { name: "Accesibilidad: tamaño del texto (%)", hint: "Escala el texto de las ventanas y tarjetas del Kit del Desguazador.", type: Number, default: 100, range: { min: 85, max: 160, step: 5 } });
  for (const [k, t, ayuda] of CAJAS) reg(k, { name: k === "oscuro" ? t : `Accesibilidad: ${t.toLowerCase()}`, hint: ayuda, type: Boolean, default: k === "ayuda" });
  Hooks.once("ready", aplicarAccesibilidad);
}

async function panel() {
  const filas = CAJAS.map(([k, t, ayuda]) => `<label class="mr-a11y-fila"><input type="checkbox" name="${k}" ${leer(k) ? "checked" : ""}><span><strong>${t}</strong><small>${ayuda}</small></span></label>`).join("");
  const datos = await foundry.applications.api.DialogV2.input({
    window: { title: "Accesibilidad", icon: "fa-solid fa-universal-access" }, classes: ["mr-a11y", "macro-popup-dialog"], position: { width: 420 },
    content: `<label class="mr-a11y-fila"><span><strong>Tamaño del texto (%)</strong><small>Ventanas y tarjetas del Kit del Desguazador.</small></span>
      <input type="number" name="escala" min="85" max="160" step="5" value="${leer("escala")}"></label>${filas}
      <p class="hint">También están en Configuración → Ajustes del módulo${dueno() === ES ? " de MR- Mothership en español" : ""}.</p>`,
    ok: { label: "Guardar", icon: "fa-solid fa-check" }, rejectClose: false,
  });
  if (!datos) return;
  for (const [k] of CAJAS) await game.settings.set(dueno(), `a11y-${k}`, !!datos[k]);
  await game.settings.set(dueno(), "a11y-escala", Math.min(160, Math.max(85, Number(datos.escala) || 100)));
}

/* ------------------------------------------------------------------ */
/* Memoria de ventana                                                  */
/* ------------------------------------------------------------------ */
const guardar = (k, v) => { try { localStorage.setItem(`${MODULE}.${k}`, JSON.stringify(v)); } catch { /* sin almacenamiento */ } };
const recordar = (k) => { try { return JSON.parse(localStorage.getItem(`${MODULE}.${k}`)); } catch { return null; } };
export { guardar as guardarLocal, recordar as recordarLocal };

/**
 * Mezcla para las ventanas del módulo: recuerda posición y tamaño (por ventana, en este navegador)
 * y añade a la cabecera el icono de accesibilidad, justo antes del de cerrar.
 */
export const ConAccesibilidad = (Base) => class extends Base {
  constructor(options = {}) {
    super(options);
    this._guardada = this._posicionGuardada(); // se lee ya: el primer pintado guardaría la posición por defecto encima
  }

  /** Posición guardada de esta ventana, ajustada a la pantalla actual. */
  _posicionGuardada() {
    const p = recordar(`ventana.${this.id}`);
    if (!p || ![p.left, p.top, p.width, p.height].every(Number.isFinite)) return null;
    return {
      left: Math.max(0, Math.min(p.left, window.innerWidth - 120)), top: Math.max(0, Math.min(p.top, window.innerHeight - 80)),
      width: Math.min(p.width, window.innerWidth), height: Math.min(p.height, window.innerHeight),
    };
  }

  _onPosition(position) {
    super._onPosition?.(position);
    const { left, top, width, height } = this.position;
    if (this._guardada) return; // aún sin restaurar
    if ([left, top, width, height].every(Number.isFinite)) guardar(`ventana.${this.id}`, { left, top, width, height });
  }

  async _onRender(context, options) {
    await super._onRender?.(context, options);
    if (options.isFirstRender && this._guardada) {
      const p = this._guardada;
      this._guardada = null;
      this.setPosition(p);
    }
    const cab = this.element?.querySelector(".window-header");
    if (!cab || cab.querySelector(".mr-kit-a11y-boton")) return;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "header-control icon fa-solid fa-universal-access mr-kit-a11y-boton";
    b.dataset.tooltip = "Accesibilidad";
    b.setAttribute("aria-label", "Opciones de accesibilidad");
    b.addEventListener("click", (ev) => { ev.stopPropagation(); panel(); });
    const cerrar = cab.querySelector('[data-action="close"]');
    if (cerrar) cerrar.before(b); else cab.append(b);
  }
};
