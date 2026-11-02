#!/usr/bin/env python3
"""Planos de cubierta de las naves: las dos páginas (doble página) de cada nave del PDF en español del Kit,
renderizadas a WebP con la marca MR en assets/planos/. Uso: python3 tools/planos.py "<ruta al PDF en español>"
"""
import sys
from pathlib import Path
import fitz
from PIL import Image

sys.path.insert(0, "/Volumes/Datos_Dock/FoundryVTT/Trabajo LOGO/marca")
import marca  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
PDF = sys.argv[1] if len(sys.argv) > 1 else "/Volumes/Datos_Dock/FoundryVTT/Trabajo SBT/salida/Shipbreaker's Toolkit (ES).pdf"
# clave de la nave → páginas (1-based) de su doble página con el plano de cubierta
PAGINAS = {
    "desembarco": (8, 9), "asaltante": (10, 11), "transporte-ejecutivo": (12, 13), "carguero": (14, 15),
    "patrullera": (16, 17), "cutter-salvamento": (18, 19), "corbeta": (20, 21), "jumpliner": (22, 23),
    "transporte-tropas": (24, 25), "exploracion": (26, 27),
}
destino = RAIZ / "assets" / "planos"
destino.mkdir(parents=True, exist_ok=True)
doc = fitz.open(PDF)
for clave, (a, b) in PAGINAS.items():
    paginas = []
    for n in (a, b):
        pm = doc[n - 1].get_pixmap(dpi=170)
        paginas.append(Image.frombytes("RGB", (pm.width, pm.height), pm.samples))
    ancho = sum(p.width for p in paginas)
    hoja = Image.new("RGB", (ancho, paginas[0].height), "white")
    x = 0
    for p in paginas:
        hoja.paste(p, (x, 0)); x += p.width
    hoja = marca.esquina(hoja)
    hoja.save(destino / f"{clave}.webp", "WEBP", quality=82, method=6)
    print("ok", clave, hoja.size, (destino / f"{clave}.webp").stat().st_size // 1024, "KB")
