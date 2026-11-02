#!/usr/bin/env python3
"""Convierte los SVG de tools/svg/ en WebP con la marca MR (esquina) en assets/.
Regla de la casa: toda imagen publicada lleva la marca (Trabajo LOGO/marca/marca.py).
Uso: node tools/iconos.mjs && node tools/planos.mjs && python3 tools/marcar.py
"""
import subprocess, sys, tempfile
from pathlib import Path
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, "/Volumes/Datos_Dock/FoundryVTT/Trabajo LOGO/marca")
import marca  # noqa: E402

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
LADO = 512

for svg in sorted((RAIZ / "tools" / "svg").rglob("*.svg")):
    ANCHO, ALTO = (1200, 720) if svg.parent.name == "planos" else (LADO, LADO)
    destino = RAIZ / "assets" / svg.parent.name / f"{svg.stem}.webp"
    destino.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as t:
        png = Path(t) / "a.png"
        subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--default-background-color=00000000",
                        f"--window-size={ANCHO},{ALTO}", f"--screenshot={png}", svg.as_uri()], check=True, capture_output=True)
        im = Image.open(png).convert("RGBA")
    im = marca.esquina(im)
    im.save(destino, "WEBP", quality=90, method=6)
    print("ok", destino.relative_to(RAIZ))
