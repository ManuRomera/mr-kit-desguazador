// Genera un plano esquemático de cubiertas por nave (tools/svg/planos/*.svg) a partir de sus datos.
// Es un dibujo propio, no el plano del manual: cada nave sale distinta según sus cubiertas, Anclajes y Salto.
// tools/marcar.py los convierte a WebP con la marca MR en assets/planos/.
import fs from "node:fs/promises";
import { NAVES } from "./contenido.mjs";

const W = 1200, H = 720;
const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");

/** Título corto de una cubierta: lo que va antes del primer punto. */
const titulo = (t) => {
  const corto = t.split(/\.\s/)[0].replace(/\.$/, "");
  return corto.length > 44 ? `${corto.slice(0, 42).replace(/\s+\S*$/, "")}…` : corto;
};

function envolver(texto, max) {
  const lineas = [];
  let actual = "";
  for (const palabra of texto.split(" ")) {
    if ((actual + " " + palabra).trim().length > max && actual) { lineas.push(actual); actual = palabra; }
    else actual = (actual + " " + palabra).trim();
  }
  if (actual) lineas.push(actual);
  return lineas.slice(0, 4);
}

function plano(nave) {
  const salas = nave.cubiertas.map(titulo);
  const n = salas.length;
  const arriba = Math.ceil(n / 2), abajo = n - arriba;
  const x0 = 190, x1 = 1020, y0 = 150, y1 = 590, hueco = 14;
  const alto = (y1 - y0 - hueco) / 2;
  const fila = (cant, y, desde) => Array.from({ length: cant }, (_, i) => {
    const ancho = (x1 - x0 - hueco * (cant - 1)) / cant;
    const x = x0 + i * (ancho + hueco);
    const lineas = envolver(salas[desde + i], Math.max(10, Math.floor(ancho / 12.5)));
    return `<rect x="${x}" y="${y}" width="${ancho}" height="${alto}" rx="14" fill="#1b1e24" stroke="#5b6068" stroke-width="3"/>
      <circle cx="${x + 28}" cy="${y + 28}" r="17" fill="#d94a3d"/><text x="${x + 28}" y="${y + 35}" text-anchor="middle" font-size="20" font-weight="700" fill="#fff">${desde + i + 1}</text>
      ${lineas.map((l, k) => `<text x="${x + 16}" y="${y + 74 + k * 27}" font-size="21" fill="#ececee">${esc(l)}</text>`).join("")}`;
  }).join("");

  // Casco: proa más o menos larga según la Clase, tobera a la izquierda.
  const proa = 70 + nave.clase * 14;
  const casco = `<path d="M${x0 - 30} ${y0 - 26} L${x1 + 30} ${y0 - 26} L${x1 + 30 + proa} ${(y0 + y1) / 2} L${x1 + 30} ${y1 + 26} L${x0 - 30} ${y1 + 26} Z" fill="#14161b" stroke="#ececee" stroke-width="6" stroke-linejoin="round"/>
    <path d="M${x0 - 30} ${y0 + 40} L${x0 - 100} ${y0 + 10} L${x0 - 100} ${y1 - 10} L${x0 - 30} ${y1 - 40} Z" fill="#14161b" stroke="#ececee" stroke-width="6" stroke-linejoin="round"/>
    <circle cx="${x0 - 100}" cy="${(y0 + y1) / 2}" r="22" fill="#d94a3d"/>`;

  // Anclajes de armas: un triángulo por Anclaje máximo en el borde superior.
  const anclajes = nave.anclajes?.[1] ?? 0;
  const muescas = Array.from({ length: anclajes }, (_, i) => {
    const x = x0 + 60 + i * ((x1 - x0 - 120) / Math.max(1, anclajes - 1));
    return `<path d="M${x - 14} ${y0 - 26} L${x} ${y0 - 58} L${x + 14} ${y0 - 26} Z" fill="#ececee"/>`;
  }).join("");

  const salto = nave.salto ? `Salto ${nave.salto}` : "Sin motor de Salto";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="Helvetica, Arial, sans-serif">
<rect width="${W}" height="${H}" fill="#0c0d10"/>
<text x="40" y="58" font-size="34" font-weight="700" fill="#ececee" letter-spacing="2">${esc(nave.nombre.toUpperCase())}</text>
<text x="40" y="88" font-size="19" fill="#9a9aa0">Plano esquemático de cubiertas · Clase ${nave.clase} · ${salto} · ${esc(nave.eslora.replace(/\s*\(.*$/, ""))}</text>
${casco}${muescas}
${fila(arriba, y0, 0)}${fila(abajo, y0 + alto + hueco, arriba)}
<text x="40" y="${H - 40}" font-size="16" fill="#6f6f76">Esquema orientativo dibujado para el módulo; los triángulos son los Anclajes de arma. El texto de cada cubierta está en la pestaña Notas.</text>
</svg>`;
}

await fs.mkdir("tools/svg/planos", { recursive: true });
for (const nave of NAVES) await fs.writeFile(`tools/svg/planos/${nave.clave}.svg`, plano(nave));
console.log(`Planos: ${NAVES.length}`);
