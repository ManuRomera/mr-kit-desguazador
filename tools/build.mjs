// Compila _data/<pack>.json a packs/<pack> (LevelDB) con el formato de compendios de Foundry v13.
import fs from "node:fs/promises";
import { ClassicLevel } from "classic-level";

const manifest = JSON.parse(await fs.readFile("module.json"));
const resultados = JSON.parse(await fs.readFile("_data/_resultados.json"));
const paginas = JSON.parse(await fs.readFile("_data/_paginas.json"));

const hijos = { Actor: ["items", "actors"], RollTable: ["results", "tables"], JournalEntry: ["pages", "journal"] };
const clave = { Actor: "actors", Item: "items", RollTable: "tables", JournalEntry: "journal", Macro: "macros" };

let total = 0;

for (const pack of manifest.packs) {
  const ruta = `_data/${pack.name}.json`;
  let docs;
  try {
    docs = JSON.parse(await fs.readFile(ruta));
  } catch {
    console.warn(`⚠ Falta ${ruta}; se omite el pack ${pack.name}.`);
    continue;
  }

  await fs.rm(pack.path, { recursive: true, force: true });
  const db = new ClassicLevel(pack.path, { valueEncoding: "json" });
  await db.open();
  const lote = db.batch();
  const col = clave[pack.type];

  for (const original of docs) {
    const doc = { ...original };

    if (pack.type === "Actor" && Array.isArray(original.items)) {
      for (const item of original.items) {
        lote.put(`!${col}.items!${doc._id}.${item._id}`, item);
      }
      doc.items = original.items.map((i) => i._id);
    }

    if (pack.type === "RollTable") {
      const res = resultados[doc._id] ?? [];
      for (const r of res) lote.put(`!${col}.results!${doc._id}.${r._id}`, r);
      doc.results = res.map((r) => r._id);
    }

    if (pack.type === "JournalEntry") {
      const pgs = paginas[doc._id] ?? [];
      for (const pg of pgs) lote.put(`!${col}.pages!${doc._id}.${pg._id}`, pg);
      doc.pages = pgs.map((pg) => pg._id);
    }

    doc._stats ??= { systemId: "mosh", systemVersion: "0.6.1", coreVersion: "13", createdTime: 0, modifiedTime: 0 };
    lote.put(`!${col}!${doc._id}`, doc);
  }

  await lote.write();
  await db.close();
  total += docs.length;
  console.log(`pack ${pack.name.padEnd(16)} ${String(docs.length).padStart(4)} documentos  (${pack.type})`);
}

console.log(`\nCompilados ${total} documentos en ${manifest.packs.length} compendios.`);
