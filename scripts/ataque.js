/**
 * Disparo de una nave desde su ficha, como el de un arma de personaje pero con la regla del manual: la nave hace
 * UNA tirada de Batalla por ronda (las armas ya suman su bonificación a la Batalla y fijan el MDMG que se inflige),
 * así que dispararla desde cualquier arma hace esa misma tirada contra la nave marcada como objetivo.
 *
 *  - Éxito: la nave inflige su MDMG al objetivo (doble con éxito crítico).
 *  - Fallo: la nave sufre 1 MDMG (2 con fallo crítico) y todos a bordo ganan 1 de Estrés.
 *  - Sin armas o con las armas inactivas (MDMG 2) falla automáticamente; con solo armas defensivas no inflige MDMG.
 *  - 1 Clase por encima del objetivo: [+] en Batalla y en MDMG. 2 o más por encima: invencible (decide el Guardián).
 *  - Contramedidas electrónicas del objetivo: [-] en el MDMG.
 * La tirada de Batalla del objetivo la hace su propia nave cuando dispara.
 */
import {
  claseNave, mdmgTotal, valorMDMG, aplicarImpacto, textoImpacto, tirarSistema, tirarExpresionMDMG,
  efectoMegadanio, publicarTirada, tarjeta, filaDado, esArmaDefensiva, pedirTirada, armasPendientes, modoConPenalizacion, marcarArmasUsadas,
} from "./util.js";

const ENLACE_ESTRES = "@UUID[Compendium.mosh.macros_triggered_1e.dvJR9DYXI2kV0BbR]{+1 Estrés}";

/** «Batalla 32 = 30 base + 2 de armas» a partir de los datos de la nave. */
function desgloseBatalla(nave) {
  const total = Number(nave.system.stats.battle.value) || 0;
  const base = Number(nave.flags?.["mr-kit-desguazador"]?.batallaBase);
  const armas = nave.items.filter((i) => i.type === "weapon").reduce((a, i) => a + (Number(i.system.bonus) || 0), 0);
  const cazas = Math.min(10, nave.items.filter((i) => i.flags?.["mr-kit-desguazador"]?.caza).reduce((a, i) => a + (Number(i.system.quantity) || 1), 0));
  if (!Number.isFinite(base) || base + armas + cazas !== total) return `Batalla ${total}`;
  return `Batalla ${total} = ${base} de base + ${armas} de armas${cazas ? ` + ${cazas} de cazas` : ""}`;
}

/** Nave marcada como objetivo (T), si es una nave. */
export const objetivoMarcado = () => [...game.user.targets].map((t) => t.actor).find((a) => a?.type === "ship") ?? null;

const tiene = (nave, prefijo) => nave.items.some((i) => i.type === "weapon" && i.name.startsWith(prefijo));

export async function dispararNave(nave, arma = null, { objetivo = null } = {}) {
  if (!nave || nave.type !== "ship") return ui.notifications.warn("Selecciona una nave.");
  if (arma && esArmaDefensiva(arma)) return ui.notifications.warn(`${arma.name} es un arma defensiva: no inflige MDMG por sí sola.`);
  objetivo ??= objetivoMarcado();
  if (!objetivo) return ui.notifications.warn("Marca como objetivo (T) el token de la nave contra la que disparas.");
  if (objetivo.id === nave.id) return ui.notifications.warn("La nave no puede dispararse a sí misma.");

  const armas = nave.items.filter((i) => i.type === "weapon");
  const sinReabastecer = armasPendientes(nave) >= 2; // dos combates sin reabastecer: falla automáticamente
  const sinArmas = !armas.length || mdmgTotal(nave) === 2 || sinReabastecer; // sin armas, «Armas inactivas» o sin munición
  // El Sistema de defensa láser del objetivo ignora la bonificación de MDMG de los lanzamisiles.
  const defensaLaser = tiene(objetivo, "Sistema de defensa láser");
  const dmg = valorMDMG(nave, { sinExtra: defensaLaser }); // «0» sin arma ofensiva
  const soloDefensivas = !sinArmas && dmg === "0";
  const diff = claseNave(nave) - claseNave(objetivo);

  const pedida = await pedirTirada(nave, `Disparo · ${nave.name}`, `Tirada de Batalla contra ${objetivo.name}${diff === 1 ? " (tienes [+] por Clase superior)" : ""}.`);
  if (!pedida) return;
  let modo = pedida.modo;
  if (diff === 1 && modo === "normal") modo = "ventaja";
  modo = modoConPenalizacion(nave, modo); // sin reabastecer tras el combate anterior: [-]

  // Batalla de la nave (la base ya incluye las armas y los cazas) más la habilidad de un tripulante.
  const valorBatalla = (Number(nave.system.stats.battle.value) || 0) + pedida.bonus;
  const rolls = [];
  let tirada = { total: null, exito: false, critico: false, dados: [] };
  if (!sinArmas) {
    tirada = await tirarSistema(nave, { modo, objetivo: valorBatalla });
    rolls.push(tirada.roll);
  }

  let inflige = 0;
  let textoMdmg = "";
  if (tirada.exito && !soloDefensivas) {
    const contramedidas = tiene(objetivo, "Contramedidas");
    const modoMdmg = diff === 1 && !contramedidas ? "ventaja" : contramedidas && diff !== 1 ? "desventaja" : "normal";
    const m = await tirarExpresionMDMG(dmg, modoMdmg);
    if (m.roll) rolls.push(m.roll);
    inflige = m.total * (tirada.critico ? 2 : 1);
    textoMdmg = `${m.total}${tirada.critico ? " × 2 (éxito crítico)" : ""}${/d/.test(dmg) ? ` (${dmg})` : ""}`;
  }
  const propio = !tirada.exito && !soloDefensivas ? (tirada.critico ? 2 : 1) : 0;

  const lineas = [];
  const etiqueta = sinArmas
    ? (sinReabastecer ? "Armas sin reabastecer: falla automáticamente" : "Sin armas operativas: falla automáticamente")
    : `${tirada.exito ? (tirada.critico ? "ÉXITO CRÍTICO" : "ÉXITO") : tirada.critico ? "FALLO CRÍTICO" : "FALLO"} · ${String(tirada.total).padStart(2, "0")} / ${valorBatalla}`;
  if (!sinArmas) lineas.push(`<p class="mr-kit-dados">${filaDado(tirada.dados)}</p>`);
  lineas.push(`<p class="mr-kit-resultado ${tirada.exito ? "ok" : "mal"}">${etiqueta}</p>`);
  lineas.push(`<p class="mr-kit-nota">${desgloseBatalla(nave)}${pedida.bonus ? ` + habilidad ${pedida.quien || ""} (+${pedida.bonus}) = ${valorBatalla}` : ""}.</p>`);
  if (arma) lineas.push(`<p>Dispara <strong>${arma.name}</strong> (+${arma.system.bonus ?? 0}, ya incluido en la Batalla de la nave).</p>`);
  if (armasPendientes(nave) === 1) lineas.push(`<p class="mr-kit-efecto">Armas sin reabastecer desde el combate anterior: tirada con [-].</p>`);
  if (defensaLaser && armas.some((a) => a.flags?.["mr-kit-desguazador"]?.mdmgExtra)) lineas.push(`<p class="mr-kit-nota">${objetivo.name} lleva un Sistema de defensa láser: ignora la bonificación de MDMG de los lanzamisiles.</p>`);
  if (diff >= 2) lineas.push(`<p class="mr-kit-efecto">${nave.name} está 2 o más Clases por encima: invencible en un enfrentamiento directo, salvo que el Guardián decida lo contrario.</p>`);
  if (diff <= -2) lineas.push(`<p class="mr-kit-efecto">${objetivo.name} está 2 o más Clases por encima: invencible en un enfrentamiento directo, salvo que el Guardián decida lo contrario.</p>`);

  let boton = "";
  if (inflige > 0) {
    if (objetivo.isOwner) {
      const i = await aplicarImpacto(objetivo, inflige);
      lineas.push(`<p><strong>${objetivo.name}</strong> recibe <strong>${inflige}</strong> MDMG (${textoMdmg}). ${textoImpacto(i)}</p>`);
      if (!i.absorbido && i.total) lineas.push(`<p class="mr-kit-efecto">${await efectoMegadanio(i.total)}</p>`);
      if (i.total >= 9) lineas.push(`<p class="mr-kit-critico"><strong>¡${objetivo.name} queda destruida!</strong></p>`);
    } else {
      lineas.push(`<p><strong>${objetivo.name}</strong> debe recibir <strong>${inflige}</strong> MDMG (${textoMdmg}). Lo aplica quien controla esa nave.</p>`);
      boton = `<button type="button" data-mrkit-action="aplicar-mdmg" data-actor="${objetivo.id}" data-cantidad="${inflige}"><i class="fa-solid fa-burst"></i> Aplicar ${inflige} MDMG</button>`;
    }
  } else if (soloDefensivas) {
    lineas.push("<p>Solo hay armas defensivas instaladas: no se inflige MDMG.</p>");
  } else if (!tirada.exito) {
    lineas.push(`<p>${objetivo.name} no recibe MDMG.</p>`);
  }

  if (tirada.exito && tiene(nave, "Haz de partículas")) lineas.push(`<p class="mr-kit-efecto">Haz de partículas: ${objetivo.name} debe superar una tirada de Sistemas o su nivel de radiación sube 1.</p>`);
  if (propio) {
    const i = await aplicarImpacto(nave, propio);
    lineas.push(`<p>Por el fallo, <strong>${nave.name}</strong> sufre <strong>${propio}</strong> MDMG. ${textoImpacto(i)}</p>`);
  }
  if (!tirada.exito) lineas.push(`<p class="mr-kit-efecto">Todos a bordo ganan <strong>1 de Estrés</strong> ${ENLACE_ESTRES}${tirada.critico ? " y hacen una <strong>tirada de Pánico</strong>" : ""}.</p>`);
  lineas.push(tiene(nave, "Cañón de riel")
    ? '<p class="mr-kit-nota">El cañón de riel puede disparar a alcance de detección; el resto de armas, solo a disparo o contacto.</p>'
    : '<p class="mr-kit-nota">Solo a alcance de disparo o de contacto. La tirada de Batalla del objetivo la hace su propia nave cuando dispara.</p>');

  await marcarArmasUsadas(nave);
  const html = tarjeta({ titulo: "Disparo", icono: "combate", subtitulo: `${nave.name} → ${objetivo.name}`, cuerpo: lineas.join(""), pie: boton, clase: tirada.exito ? "exito" : "fallo" });
  return publicarTirada(rolls, html, { actor: nave, flavor: "Disparo" });
}
