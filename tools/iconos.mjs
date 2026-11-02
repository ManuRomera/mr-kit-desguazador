// Genera los SVG fuente de los iconos (naves, mejoras, armas, tablas y macros) en tools/svg/.
// tools/marcar.py los convierte a WebP con la marca MR en assets/.
import fs from "node:fs/promises";

const marco = (contenido) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
<rect x="8" y="8" width="496" height="496" rx="64" fill="#111111" stroke="#3a3a3a" stroke-width="6"/>
<g fill="none" stroke="#ececee" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
${contenido}
</g>
</svg>`;

const acento = "#d94a3d";

/* Siluetas de naves (vista lateral) */
const cascos = {
  asaltante: `<path d="M70 300 L120 240 L300 240 L300 210 L360 210 L360 240 L420 260 L420 300 L360 320 L300 320 L300 300 L120 300 Z" fill="#ececee"/>
    <rect x="150" y="300" width="40" height="60" fill="#ececee"/><rect x="250" y="300" width="40" height="60" fill="#ececee"/>
    <circle cx="80" cy="270" r="26" fill="${acento}"/>`,
  "transporte-ejecutivo": `<path d="M60 270 L140 230 L340 230 L400 200 L440 220 L440 280 L400 300 L340 300 L140 300 L60 290 Z" fill="#ececee"/>
    <rect x="170" y="196" width="30" height="34" fill="#ececee"/><rect x="230" y="196" width="30" height="34" fill="#ececee"/>
    <circle cx="70" cy="276" r="22" fill="${acento}"/>`,
  carguero: `<path d="M50 290 L110 250 L360 250 L360 230 L440 230 L440 300 L360 300 L360 310 L110 310 L50 300 Z" fill="#ececee"/>
    <rect x="130" y="250" width="36" height="60" fill="#ececee"/><rect x="196" y="250" width="36" height="60" fill="#ececee"/><rect x="262" y="250" width="36" height="60" fill="#ececee"/>
    <circle cx="58" cy="292" r="20" fill="${acento}"/>`,
  patrullera: `<path d="M60 286 L150 258 L330 258 L420 230 L456 246 L456 286 L420 296 L330 300 L150 300 L60 296 Z" fill="#ececee"/>
    <rect x="200" y="216" width="16" height="44" fill="#ececee"/><rect x="300" y="216" width="16" height="44" fill="#ececee"/>
    <circle cx="70" cy="292" r="18" fill="${acento}"/>`,
  "cutter-salvamento": `<path d="M50 290 L120 250 L330 250 L330 224 L410 224 L410 250 L456 262 L456 300 L410 310 L330 310 L330 300 L120 300 L50 300 Z" fill="#ececee"/>
    <path d="M160 250 L160 180 L250 180 L250 250" fill="#ececee"/><path d="M280 250 L280 196 L330 196 L330 250" fill="#ececee"/>
    <circle cx="58" cy="294" r="20" fill="${acento}"/>`,
  corbeta: `<path d="M50 286 L140 250 L320 250 L400 218 L456 236 L456 292 L400 306 L320 302 L140 302 L50 296 Z" fill="#ececee"/>
    <rect x="170" y="202" width="22" height="48" fill="#ececee"/><rect x="240" y="202" width="22" height="48" fill="#ececee"/>
    <path d="M300 250 L300 190 L380 190 L380 250" fill="#ececee"/>
    <circle cx="58" cy="292" r="18" fill="${acento}"/>`,
  jumpliner: `<path d="M40 280 L120 244 L320 244 L400 214 L470 232 L470 288 L400 302 L320 302 L120 302 L40 296 Z" fill="#ececee"/>
    <circle cx="200" cy="210" r="30" fill="#ececee"/><circle cx="300" cy="210" r="30" fill="#ececee"/>
    <circle cx="52" cy="290" r="18" fill="${acento}"/>`,
  "transporte-tropas": `<path d="M40 292 L120 250 L340 250 L420 218 L472 238 L472 296 L420 310 L340 308 L120 308 L40 302 Z" fill="#ececee"/>
    <rect x="150" y="196" width="26" height="54" fill="#ececee"/><rect x="210" y="196" width="26" height="54" fill="#ececee"/>
    <rect x="270" y="196" width="26" height="54" fill="#ececee"/>
    <circle cx="50" cy="296" r="18" fill="${acento}"/>`,
  exploracion: `<path d="M40 286 L110 250 L310 250 L310 226 L390 226 L390 250 L472 266 L472 296 L390 306 L310 306 L310 300 L110 300 L40 296 Z" fill="#ececee"/>
    <circle cx="230" cy="208" r="40" fill="none" stroke="#ececee" stroke-width="10"/>
    <circle cx="230" cy="208" r="10" fill="${acento}"/><circle cx="52" cy="292" r="18" fill="${acento}"/>`,
  desembarco: `<path d="M100 280 L160 240 L330 240 L390 210 L430 226 L430 300 L390 316 L160 316 L100 300 Z" fill="#ececee"/>
    <path d="M170 316 L200 360 L260 360 L290 316" fill="#ececee"/>
    <circle cx="112" cy="288" r="18" fill="${acento}"/>`,
};

await fs.mkdir("tools/svg/naves", { recursive: true });
await fs.mkdir("tools/svg/iconos", { recursive: true });

for (const [clave, contenido] of Object.entries(cascos)) {
  await fs.writeFile(`tools/svg/naves/${clave}.svg`, marco(contenido));
}

const iconos = {
  mejora: `<circle cx="256" cy="256" r="86" fill="none" stroke="#ececee" stroke-width="18"/>
    <circle cx="256" cy="256" r="30" fill="${acento}" stroke="none"/>
    <path d="M256 110 L256 150 M256 362 L256 402 M110 256 L150 256 M362 256 L402 256 M152 152 L180 180 M332 332 L360 360 M360 152 L332 180 M180 332 L152 360"/>`,
  arma: `<circle cx="256" cy="256" r="120" fill="none" stroke="#ececee" stroke-width="14"/>
    <path d="M256 96 L256 196 M256 316 L256 416 M96 256 L196 256 M316 256 L416 256"/>
    <circle cx="256" cy="256" r="26" fill="${acento}" stroke="none"/>`,
  clase0: `<path d="M96 288 L160 240 L340 240 L400 208 L440 224 L440 300 L400 316 L160 316 L96 304 Z" fill="#ececee"/>
    <circle cx="110" cy="292" r="16" fill="${acento}"/>`,
  vehiculo: `<rect x="110" y="190" width="290" height="130" rx="18" fill="#ececee"/>
    <circle cx="170" cy="340" r="34" fill="none" stroke="#ececee" stroke-width="14"/>
    <circle cx="342" cy="340" r="34" fill="none" stroke="#ececee" stroke-width="14"/>
    <rect x="140" y="214" width="70" height="46" fill="${acento}" stroke="none"/>`,
  averia: `<path d="M256 100 L452 410 L60 410 Z" fill="none" stroke="#ececee" stroke-width="18"/>
    <path d="M256 196 L256 306" stroke="${acento}" stroke-width="26"/>
    <circle cx="256" cy="358" r="16" fill="${acento}" stroke="none"/>`,
  megadanio: `<path d="M256 84 L392 160 L392 320 L256 420 L120 320 L120 160 Z" fill="none" stroke="#ececee" stroke-width="16"/>
    <path d="M256 170 L256 300" stroke="${acento}" stroke-width="26"/>
    <path d="M186 250 L256 320 L326 250" fill="none" stroke="${acento}" stroke-width="22"/>`,
  socorro: `<circle cx="256" cy="256" r="120" fill="none" stroke="#ececee" stroke-width="14"/>
    <path d="M256 176 L256 336 M176 256 L336 256" stroke="${acento}" stroke-width="30"/>
    <path d="M120 120 L168 168 M392 120 L344 168 M120 392 L168 344 M392 392 L344 344" stroke="#ececee" stroke-width="12"/>`,
  quiebra: `<rect x="110" y="150" width="292" height="212" rx="20" fill="none" stroke="#ececee" stroke-width="16"/>
    <path d="M110 216 L402 216" stroke="#ececee" stroke-width="14"/>
    <path d="M150 330 L216 270 L272 312 L362 230" fill="none" stroke="${acento}" stroke-width="18"/>`,
  contrabando: `<rect x="110" y="160" width="292" height="192" rx="16" fill="none" stroke="#ececee" stroke-width="16"/>
    <path d="M110 220 L402 220 M256 160 L256 352" stroke="#ececee" stroke-width="12"/>
    <circle cx="330" cy="290" r="22" fill="${acento}" stroke="none"/>`,
  restos: `<path d="M140 380 L200 250 L260 330 L330 190 L380 380 Z" fill="none" stroke="#ececee" stroke-width="14"/>
    <path d="M200 250 L230 290 M260 330 L292 290" stroke="${acento}" stroke-width="12"/>`,
  dossier: `<path d="M128 110 L340 110 L392 162 L392 402 L128 402 Z" fill="none" stroke="#ececee" stroke-width="16"/>
    <path d="M340 110 L340 162 L392 162" fill="none" stroke="#ececee" stroke-width="14"/>
    <path d="M176 220 L344 220 M176 268 L344 268 M176 316 L288 316" stroke="#ececee" stroke-width="12"/>
    <circle cx="356" cy="356" r="34" fill="${acento}" stroke="none"/>`,
  moral: `<circle cx="256" cy="200" r="70" fill="none" stroke="#ececee" stroke-width="16"/>
    <path d="M196 268 C196 340 316 340 316 268" fill="none" stroke="#ececee" stroke-width="16"/>
    <path d="M256 130 L256 270 M256 270 L206 320 M256 270 L306 320" stroke="${acento}" stroke-width="12"/>`,
  viaje: `<circle cx="256" cy="256" r="150" fill="none" stroke="#ececee" stroke-width="14"/>
    <path d="M256 150 L300 256 L256 362 L212 256 Z" fill="${acento}" stroke="none"/>
    <path d="M106 256 L150 256 M362 256 L406 256" stroke="#ececee" stroke-width="12"/>`,
  combate: `<path d="M120 140 L392 372 M392 140 L120 372" stroke="#ececee" stroke-width="22"/>
    <circle cx="256" cy="256" r="64" fill="none" stroke="${acento}" stroke-width="14"/>`,
  taller: `<path d="M320 130 A86 86 0 1 0 382 192 L300 274 L238 212 Z" fill="none" stroke="#ececee" stroke-width="16"/>
    <path d="M238 212 L130 320 L192 382 L300 274" fill="none" stroke="#ececee" stroke-width="16"/>
    <circle cx="160" cy="352" r="14" fill="${acento}" stroke="none"/>`,
  credito: `<circle cx="256" cy="256" r="140" fill="none" stroke="#ececee" stroke-width="16"/>
    <path d="M256 140 L256 372 M320 190 C320 160 192 160 192 212 C192 264 320 248 320 300 C320 352 192 352 192 322" fill="none" stroke="${acento}" stroke-width="16"/>`,
};

for (const [clave, contenido] of Object.entries(iconos)) {
  await fs.writeFile(`tools/svg/iconos/${clave}.svg`, marco(contenido));
}

console.log(`Generados ${Object.keys(cascos).length} iconos de nave y ${Object.keys(iconos).length} iconos.`);
