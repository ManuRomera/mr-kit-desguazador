/**
 * Utilidades compartidas del Kit del Desguazador.
 * Evitan depender de APIs internas del sistema mosh: solo usan los datos del actor.
 */

export const MODULE = "mr-kit-desguazador";
export const BANDAS = ["contacto", "disparo", "deteccion"];
export const ETIQUETA_BANDA = { contacto: "Contacto", disparo: "Disparo", deteccion: "Detección" };
export const COSTE_EVASION = { contacto: 3, disparo: 2, deteccion: 1 };
export const PRECIO_FUEL = { 1: 1000, 2: 2000, 3: 5000, 4: 50000, 5: 100000 };

const { DialogV2 } = foundry.applications.api;
const cacheTablas = new Map();

/* ------------------------------------------------------------------ */
/* Diálogos                                                            */
/* ------------------------------------------------------------------ */
export function aviso(titulo, html) {
  return DialogV2.wait({
    window: { title: titulo },
    classes: ["mr-kit-dialogo", "macro-popup-dialog"],
    content: html,
    buttons: [{ label: "Cerrar", action: "cerrar", icon: "fa-solid fa-xmark", default: true }],
    rejectClose: false,
  });
}

export function elegirModo(titulo = "Tirada", texto = "Elige el tipo de tirada:") {
  return DialogV2.wait({
    window: { title: titulo },
    classes: ["mr-kit-dialogo", "macro-popup-dialog"],
    content: `<p>${texto}</p>`,
    buttons: [
      { label: "Ventaja", action: "ventaja", icon: "fa-solid fa-angles-up", callback: () => "ventaja" },
      { label: "Normal", action: "normal", icon: "fa-solid fa-minus", default: true, callback: () => "normal" },
      { label: "Desventaja", action: "desventaja", icon: "fa-solid fa-angles-down", callback: () => "desventaja" },
    ],
    rejectClose: false,
  });
}

/* ------------------------------------------------------------------ */
/* Naves                                                               */
/* ------------------------------------------------------------------ */
export function navesDisponibles() {
  return game.actors.filter((a) => a.type === "ship" && a.isOwner);
}

export async function elegirNave({ titulo = "Selecciona una nave", obligatoria = true } = {}) {
  const controlada = canvas?.tokens?.controlled?.find((t) => t.actor?.type === "ship")?.actor;
  if (controlada) return controlada;

  const naves = navesDisponibles();
  if (!naves.length) {
    if (obligatoria) ui.notifications.warn("No tienes ninguna nave importada ni seleccionada.");
    return null;
  }
  if (naves.length === 1) return naves[0];

  const opciones = naves.map((n) => `<option value="${n.id}">${foundry.utils.escapeHTML(n.name)}</option>`).join("");
  const elegida = await DialogV2.wait({
    window: { title: titulo },
    classes: ["mr-kit-dialogo", "macro-popup-dialog"],
    content: `<div class="form-group"><label>Nave</label><select name="nave">${opciones}</select></div>`,
    buttons: [{ label: "Abrir", action: "abrir", icon: "fa-solid fa-check", default: true, callback: (event, button) => button.form.elements.nave.value }],
    rejectClose: false,
  });
  return elegida ? game.actors.get(elegida) : null;
}

/* ------------------------------------------------------------------ */
/* Tiradas                                                             */
/* ------------------------------------------------------------------ */
/**
 * Tirada con la lógica del propio sistema mosh: la cadena (`1d100`, `1d100 [+]`, `1d10 [-]`…) se convierte con
 * `actor.parseRollString` y el resultado se interpreta con `actor.parseRollResult` (ventaja y desventaja con la
 * regla de críticos del sistema, 90 o más siempre falla, dobles = crítico, 100 cuenta como 00).
 * `aim`: «low» tira por debajo del objetivo, «high» por encima. Devuelve el Roll para el chat.
 */
export async function tirarSistema(actor, { dado = "1d100", modo = "normal", aim = "low", objetivo = null, comparacion = "<", cero = true, criticos = true } = {}) {
  const marca = modo === "ventaja" ? " [+]" : modo === "desventaja" ? " [-]" : "";
  const cadena = `${dado}${marca}`;
  const roll = await new Roll(actor.parseRollString(cadena, aim)).evaluate();
  const r = actor.parseRollResult(cadena, roll, cero, criticos, objetivo, comparacion, null);
  const dados = roll.dice.flatMap((d) => d.results.map((x) => x.result));
  return { roll, total: r.total, exito: Boolean(r.success), critico: Boolean(r.critical), dados };
}

/**
 * Publica un mensaje de chat con el HTML dado y adjunta las tiradas (para Dice So Nice y el registro).
 * `rolls` puede ser un Roll o una lista de ellos.
 */
export async function publicarTirada(rolls, html, { actor = null, flavor = "" } = {}) {
  const lista = [rolls].flat().filter(Boolean);
  return ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor,
    content: html,
    rolls: lista,
    sound: lista.length ? CONFIG.sounds.dice : null,
  });
}

export function filaDado(resultados) {
  return resultados.map((r) => `<span class="mr-kit-dado">${String(r).padStart(2, "0")}</span>`).join(" ");
}

/**
 * Tarjeta de chat con el mismo marcado que las del sistema mosh (`.mosh > .rollcontainer`), de modo que
 * hereda su aspecto y lo que añaden otros módulos de Mothership (modo oscuro, tamaño del texto, contraste…).
 */
export function tarjeta({ titulo, subtitulo = "", cuerpo = "", pie = "", clase = "", icono = "dossier" }) {
  const img = `modules/${MODULE}/assets/iconos/${icono}.webp`;
  return `<div class="mosh mr-kit-card ${clase}">
    <div class="rollcontainer">
      <div class="flexrow" style="margin-bottom: 5px;">
        <div class="rollweaponh1">${titulo}</div>
        <div style="text-align: right"><img class="roll-image" src="${img}" alt="" /></div>
      </div>
      ${subtitulo ? `<div class="rollmods mr-kit-card-sub">${subtitulo}</div>` : ""}
      <div class="description mr-kit-card-body"><div class="body">${cuerpo}</div></div>
      ${pie ? `<div class="description mr-kit-card-foot"><div class="body">${pie}</div></div>` : ""}
    </div>
  </div>`;
}

/* ------------------------------------------------------------------ */
/* Tablas y compendios                                                 */
/* ------------------------------------------------------------------ */
/** Índice del compendio con los flags del módulo (el índice por defecto no los trae). */
const indiceConFlags = (pack) => pack.getIndex({ fields: [`flags.${MODULE}`] });

export async function tablaDePack(clave) {
  if (cacheTablas.has(clave)) return cacheTablas.get(clave);
  const pack = game.packs.get(`${MODULE}.tablas`);
  if (!pack) return null;
  const entrada = (await indiceConFlags(pack)).find((e) => e.flags?.[MODULE]?.tabla === clave);
  if (!entrada) return null;
  const tabla = await pack.getDocument(entrada._id);
  cacheTablas.set(clave, tabla);
  return tabla;
}

/** Resultado de una tabla del módulo para un valor dado (0-based, como las tablas del manual). */
export async function resultadoDeTabla(clave, valor) {
  const tabla = await tablaDePack(clave);
  if (!tabla) return null;
  return { tabla, resultado: tabla.getResultsForRoll(valor)?.[0] ?? null };
}

/** Tira en una tabla del módulo con su propia fórmula (1d100-1, 1d10-1…). */
export async function tirarEnTabla(clave) {
  const tabla = await tablaDePack(clave);
  if (!tabla) return null;
  const roll = await new Roll(tabla.formula || "1d100-1").evaluate();
  return { tabla, roll, total: roll.total, resultado: tabla.getResultsForRoll(roll.total)?.[0] ?? null };
}

/** Texto de un resultado de tabla sin el enlace al objeto ni el número inicial. */
export function textoResultado(resultado) {
  return (resultado?.description ?? "").replace(/<br\s*\/?>.*$/s, "").replace(/^<strong>[^<]*<\/strong>\s*·\s*/, "");
}

/** Efecto de megadaño para un total dado, leído de la tabla del módulo. */
export async function efectoMegadanio(total) {
  const r = await resultadoDeTabla("megadanio", Math.min(9, Math.max(0, total)));
  return textoResultado(r?.resultado).replace(/^\d\d\+?\s*·\s*/, "");
}

/* ------------------------------------------------------------------ */
/* Estado de la nave                                                   */
/* ------------------------------------------------------------------ */
export const flagsNave = (nave) => nave?.flags?.[MODULE] ?? {};
export const claseNave = (nave) => Number(flagsNave(nave).clase ?? nave?.system?.class ?? 1) || 1;

export function mdmgTotal(nave) {
  const hits = (nave?.system?.megadamage?.hits ?? []).map(Number).filter(Number.isFinite);
  return hits.length ? Math.max(...hits) : 0;
}

/**
 * Aplica un impacto de MDMG a la nave respetando el Casco: un impacto menor que el Casco se ignora;
 * uno igual o mayor destruye el Casco y la nave sufre el resto. Devuelve lo ocurrido.
 */
export async function aplicarImpacto(nave, cantidad) {
  const casco = Number(nave.system?.supplies?.hull?.value) || 0;
  const anterior = mdmgTotal(nave);
  let resto = Math.max(0, Number(cantidad) || 0);
  let absorbido = false;
  let cascoDestruido = false;
  const cambios = {};

  if (casco > 0 && resto > 0) {
    if (resto < casco) {
      absorbido = true;
      resto = 0;
    } else {
      cascoDestruido = true;
      resto -= casco;
      cambios["system.supplies.hull.value"] = 0;
    }
  }

  // El registro lleva una sola marca, la del total: solo se aplica el efecto del total acumulado.
  const total = Math.min(9, anterior + resto);
  if (total !== anterior) cambios["system.megadamage.hits"] = total ? [total] : [];
  if (Object.keys(cambios).length) await nave.update(cambios);
  return { anterior, total, resto, absorbido, cascoDestruido };
}

/** Descripción corta de un impacto para el chat. */
export function textoImpacto(i) {
  if (i.absorbido) return "El Casco absorbe el impacto: ningún MDMG.";
  if (i.cascoDestruido && i.total === i.anterior) return "El Casco queda destruido y absorbe todo el impacto: ningún MDMG.";
  const casco = i.cascoDestruido ? " El Casco queda destruido." : "";
  return `${i.anterior} → <strong>${i.total}</strong> MDMG.${casco}`;
}

/** Armas «solo defensivas»: no infligen MDMG por sí solas. */
export const esArmaDefensiva = (item) => Boolean(item?.flags?.[MODULE]?.defensiva);

/** Expresión de MDMG de una nave: «0» si no tiene un arma ofensiva instalada. */
export function valorMDMG(nave) {
  const base = String(nave?.system?.["weapon-stats"]?.megadamage?.value ?? "1").trim() || "1";
  const armas = nave?.items?.filter((i) => i.type === "weapon") ?? [];
  if (!armas.some((a) => !esArmaDefensiva(a))) return "0";
  const extra = armas.reduce((s, a) => s + (Number(a.flags?.[MODULE]?.mdmgExtra) || 0), 0);
  return extra ? `${base}+${extra}` : base;
}

/** Tira una expresión de MDMG; con ventaja o desventaja tira los dados dos veces y se queda con los mejores o los peores. */
export async function tirarExpresionMDMG(expr, modo = "normal") {
  if (!expr || expr === "0") return { total: 0, roll: null };
  const m = /^(\d*)d(\d+)(.*)$/.exec(expr);
  if (!m || modo === "normal") {
    const roll = await new Roll(expr).evaluate();
    return { total: roll.total, roll };
  }
  const n = Number(m[1] || 1);
  const roll = await new Roll(`${n * 2}d${m[2]}${modo === "ventaja" ? "kh" : "kl"}${n}${m[3]}`).evaluate();
  return { total: roll.total, roll };
}

export async function ajustarRecurso(nave, ruta, delta) {
  const actual = Number(foundry.utils.getProperty(nave, ruta) ?? 0);
  await nave.update({ [ruta]: Math.max(0, actual + delta) });
}

/* ------------------------------------------------------------------ */
/* Créditos                                                            */
/* ------------------------------------------------------------------ */
/** Los costes del manual son para Clase I y se multiplican por la Clase de la nave. */
export function costeClase(coste, clase) {
  const m = /^([\d.]+)\s*(kcr|mcr|bcr)$/i.exec(String(coste).trim());
  if (!m) return null;
  const mult = { kcr: 1e3, mcr: 1e6, bcr: 1e9 }[m[2].toLowerCase()];
  return Number(m[1]) * mult * Math.max(1, clase || 1);
}

export function formatearCreditos(n) {
  if (n == null || Number.isNaN(n)) return "—";
  const f = (v, u) => `${Number(v.toFixed(2)).toLocaleString("es-ES")} ${u}`;
  if (n >= 1e9) return f(n / 1e9, "BCR");
  if (n >= 1e6) return f(n / 1e6, "MCR");
  if (n >= 1e3) return f(n / 1e3, "kCR");
  return `${n} CR`;
}

/* ------------------------------------------------------------------ */
/* Averías                                                             */
/* ------------------------------------------------------------------ */
export async function crearAveriaEnNave(nave, numero) {
  const pack = game.packs.get(`${MODULE}.averias`);
  if (!pack) return null;
  const entrada = (await indiceConFlags(pack)).find((e) => e.flags?.[MODULE]?.numero === Number(numero));
  const item = entrada ? await pack.getDocument(entrada._id) : null;
  if (!item) return null;
  const datos = item.toObject();
  delete datos._id;
  const [creado] = await nave.createEmbeddedDocuments("Item", [datos]);
  return creado;
}

/** Tira en la tabla de averías `veces` veces y devuelve los resultados con su número. */
export async function tirarAverias(veces) {
  const averias = [];
  const rolls = [];
  for (let i = 0; i < veces; i++) {
    const r = await tirarEnTabla("averias");
    if (!r) break;
    rolls.push(r.roll);
    const texto = textoResultado(r.resultado);
    averias.push({ valor: r.total, texto: texto.replace(/\s*<em>\(mayor\)<\/em>/, ""), mayor: /\(mayor\)/.test(texto) });
  }
  return { averias, rolls };
}

/** HTML de una avería con su botón para añadirla a la nave. */
export function htmlAveria(a, nave) {
  return `<div class="mr-kit-averia ${a.mayor ? "mayor" : "menor"}">
    <div class="mr-kit-averia-titulo">d100 · ${String(a.valor).padStart(2, "0")} · ${a.mayor ? "Reparación mayor" : "Reparación menor"}</div>
    <div>${a.texto}</div>
    ${nave ? `<button type="button" data-mrkit-action="aplicar-averia" data-actor="${nave.id}" data-numero="${a.valor}"><i class="fa-solid fa-plus"></i> Añadir a la nave</button>` : ""}
  </div>`;
}

/* ------------------------------------------------------------------ */
/* Botones del chat                                                    */
/* ------------------------------------------------------------------ */
/** UUID de un objeto/tabla del módulo: Compendium.<módulo>.<pack>.<Tipo>.<id>. */
export const uuidDeTabla = async (clave) => (await tablaDePack(clave))?.uuid ?? null;

/** Añade a la nave un objeto del compendio de averías (por su UUID) y devuelve el objeto creado. */
export async function crearAveriaDesdeUuid(nave, uuid) {
  const item = await fromUuid(uuid);
  if (!item || item.type !== "repair") return null;
  const datos = item.toObject();
  delete datos._id;
  const [creado] = await nave.createEmbeddedDocuments("Item", [datos]);
  return creado;
}

export function registrarBotonesChat() {
  Hooks.on("renderChatMessageHTML", (message, html) => {
    // Tarjetas del sistema (mantenimiento…): junto a cada enlace a una avería del Kit, un botón para añadirla a la nave.
    const nave = ChatMessage.getSpeakerActor(message.speaker);
    if (nave?.type === "ship" && nave.isOwner) {
      html.querySelectorAll(`a.content-link[data-uuid*="Compendium.${MODULE}.averias."]`).forEach((enlace) => {
        if (enlace.nextElementSibling?.dataset?.mrkitAction) return;
        const b = document.createElement("button");
        b.type = "button";
        b.className = "mr-kit-boton-averia";
        b.dataset.mrkitAction = "aplicar-averia-uuid";
        b.dataset.actor = nave.id;
        b.dataset.uuid = enlace.dataset.uuid;
        b.innerHTML = '<i class="fa-solid fa-plus"></i> Añadir a la nave';
        enlace.after(b);
      });
    }

    html.querySelectorAll("[data-mrkit-action]").forEach((boton) => {
      boton.addEventListener("click", async (ev) => {
        ev.preventDefault();
        const nave = game.actors.get(boton.dataset.actor);
        if (!nave) return ui.notifications.warn("La nave ya no existe.");
        if (!nave.isOwner) return ui.notifications.warn("No tienes permiso sobre esa nave.");
        const accion = boton.dataset.mrkitAction;

        if (accion === "aplicar-averia" || accion === "aplicar-averia-uuid") {
          const creada = accion === "aplicar-averia" ? await crearAveriaEnNave(nave, boton.dataset.numero) : await crearAveriaDesdeUuid(nave, boton.dataset.uuid);
          if (!creada) return ui.notifications.error("No se encontró la avería en el compendio.");
          ui.notifications.info(`Avería añadida a ${nave.name}: ${creada.name}`);
          boton.disabled = true;
          boton.textContent = "Avería añadida";
        }
      });
    });
  });
}
