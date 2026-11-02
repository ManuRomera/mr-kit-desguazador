/**
 * Mantiene al día las cifras de una nave del Kit cuando se le añaden o quitan armas, mejoras y naves de Clase 0.
 * Solo toca naves que vienen del módulo (llevan el flag `aplicado`) y trabaja con diferencias: lo que ya
 * se aplicó se guarda en el flag, así que lo que edites a mano en la ficha se respeta.
 */
import { MODULE, flagsNave, esArmaDefensiva } from "./util.js";

const MDMG = ["1", "1d5", "1d10"];
const colas = new Map();

/** Efectos acumulados de los objetos instalados en la nave. */
function efectosInstalados(nave) {
  const e = { thrusters: 0, systems: 0, battle: 0, fuel: 0, clase: 0, upgrades: 0, hardpoints: 0, hull: 0, mdmgUp: 0 };
  let armasOfensivas = 0;
  let cazas = 0;
  for (const i of nave.items) {
    const q = Number(i.system?.quantity ?? 1) || 1;
    if (i.type === "weapon") {
      e.battle += Number(i.system.bonus) || 0;
      if (!esArmaDefensiva(i)) armasOfensivas++;
    } else if (i.type === "module") {
      for (const [k, v] of Object.entries(i.flags?.[MODULE]?.efecto ?? {})) {
        if (k === "hull") e.hull = Math.max(e.hull, v);
        else e[k] += v * q;
      }
    } else if (i.type === "item" && i.flags?.[MODULE]?.caza) {
      cazas += q;
    }
  }
  e.battle += Math.min(10, cazas);
  const armas = nave.items.filter((i) => i.type === "weapon");
  return {
    e,
    armas: armas.length,
    bonusArmas: armas.reduce((a, i) => a + (Number(i.system.bonus) || 0), 0),
    armasOfensivas,
    mejoras: nave.items.filter((i) => i.type === "module").length,
  };
}

export async function sincronizarNave(nave) {
  const f = flagsNave(nave);
  if (!f.aplicado) return null;
  const { e, armas, bonusArmas, armasOfensivas, mejoras } = efectosInstalados(nave);
  const antes = f.aplicado;
  const s = nave.system;
  const cambios = {};
  const poner = (ruta, valor) => {
    if (foundry.utils.getProperty(nave._source, ruta) !== valor) cambios[ruta] = valor;
  };

  // Diferencias sobre las Características y el combustible.
  for (const [clave, ruta] of [["thrusters", "system.stats.thrusters.value"], ["systems", "system.stats.systems.value"], ["battle", "system.stats.battle.value"], ["fuel", "system.supplies.fuel.max"]]) {
    const delta = e[clave] - (antes[clave] ?? 0);
    if (delta) poner(ruta, Math.max(0, (Number(foundry.utils.getProperty(nave._source, ruta)) || 0) + delta));
  }

  // Casco: las mejoras fijan un máximo (no suman). Si sube, la parte nueva llega intacta.
  const cascoMax = Math.max(Number(f.cascoBase ?? 0), e.hull);
  const cascoMaxActual = Number(s.supplies.hull.max) || 0;
  if (cascoMax !== cascoMaxActual) {
    poner("system.supplies.hull.max", cascoMax);
    poner("system.supplies.hull.value", Math.max(0, Math.min(cascoMax, (Number(s.supplies.hull.value) || 0) + (cascoMax - cascoMaxActual))));
  }

  // Clase.
  const deltaClase = e.clase - (antes.clase ?? 0);
  if (deltaClase) {
    cambios[`flags.${MODULE}.clase`] = (Number(f.clase) || 0) + deltaClase;
    poner("system.class", String((Number(s.class) || 0) + deltaClase));
  }

  // Contadores, siempre derivados de lo instalado.
  poner("system.weapon-stats.hardpoints.value", armas);
  poner("system.weapon-stats.hardpoints.max", Number(f.anclajesMax ?? 0) + e.hardpoints);
  poner("system.weapon-stats.weapons.max", bonusArmas);
  poner("system.supplies.upgrades.value", mejoras);
  poner("system.supplies.upgrades.max", Number(f.mejorasMax ?? 0) + e.upgrades);

  // Megadaño base (sube con «Mayor potencia de MDMG») y efectivo (0* sin arma ofensiva).
  const base = String(f.mdmgBase ?? s["weapon-stats"].megadamage.value);
  const mdmg = MDMG.includes(base) ? MDMG[Math.min(MDMG.length - 1, MDMG.indexOf(base) + e.mdmgUp)] : base;
  poner("system.weapon-stats.megadamage.value", mdmg);
  poner("system.weapon-stats.megadamage.max", armasOfensivas || mdmg === "0" ? mdmg : "0*");

  const aplicado = Object.fromEntries(["thrusters", "systems", "battle", "fuel", "clase"].map((k) => [k, e[k]]));
  if (Object.keys(aplicado).some((k) => (antes[k] ?? 0) !== aplicado[k])) cambios[`flags.${MODULE}.aplicado`] = aplicado;

  if (!Object.keys(cambios).length) return null;
  await nave.update(cambios);
  return cambios;
}

/** Encadena las sincronizaciones de una misma nave para que no se pisen. */
export function sincronizarEnCola(nave) {
  const siguiente = (colas.get(nave.id) ?? Promise.resolve()).catch(() => {}).then(() => sincronizarNave(nave));
  colas.set(nave.id, siguiente);
  return siguiente;
}

export function registrarSincronizacion() {
  const reaccionar = (item, ...resto) => {
    const nave = item.parent;
    if (resto.at(-1) !== game.user.id || nave?.documentName !== "Actor" || nave.type !== "ship") return;
    if (!game.settings.get(MODULE, "sincronizar")) return;
    sincronizarEnCola(nave).catch((err) => console.error(`${MODULE} | No se pudo sincronizar ${nave.name}`, err));
  };
  Hooks.on("createItem", reaccionar);
  Hooks.on("updateItem", reaccionar);
  Hooks.on("deleteItem", reaccionar);
}
