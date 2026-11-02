// Empaqueta el módulo (mismo script en local y en CI). Uso: node scripts/zip.mjs → dist/mr-kit-desguazador.zip + dist/module.json
import { readFileSync, mkdirSync, copyFileSync, existsSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";

const m = JSON.parse(readFileSync("module.json", "utf8"));
const salida = "dist/mr-kit-desguazador.zip";
if (!m.download.endsWith("/mr-kit-desguazador.zip")) throw new Error("module.json: «download» no apunta a mr-kit-desguazador.zip");

mkdirSync("dist", { recursive: true });
rmSync(salida, { force: true });
const archivos = ["module.json", "LICENSE", "NOTICE.md", "README.md", "CHANGELOG.md", "scripts", "styles", "templates", "assets", "packs"];
execFileSync("zip", ["-qr", "-X", salida, ...archivos.filter((f) => existsSync(f)), "-x", "packs/*/LOCK", "-x", "*.DS_Store"], { stdio: "inherit" });
copyFileSync("module.json", "dist/module.json");

const lista = execFileSync("unzip", ["-Z1", salida]).toString().split("\n");
const imprescindibles = [
  "module.json", "scripts/kit.js", "scripts/sincronizar.js", "scripts/accesibilidad.js", "scripts/hoja-nave.js", "templates/nave.hbs",
  "templates/viaje.hbs", "styles/kit.css", "assets/naves/corbeta.webp", "assets/iconos/averia.webp",
  ...m.packs.map((p) => `${p.path}/CURRENT`),
];
for (const f of imprescindibles) if (!lista.includes(f)) throw new Error(`Falta en el zip: ${f}`);
console.log(`OK ${salida} (${m.version}, ${lista.length} archivos)`);
