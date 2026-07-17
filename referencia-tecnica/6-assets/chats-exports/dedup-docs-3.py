#!/usr/bin/env python3
"""
Dedup para el árbol docs-4 (o cualquier carpeta).

Uso:
  python3 dedup_docs.py /ruta/a/docs-4            # dry-run: solo reporta
  python3 dedup_docs.py /ruta/a/docs-4 --apply     # borra duplicados de verdad
  python3 dedup_docs.py /ruta/a/docs-4 --apply --link  # borra y deja hardlinks en su lugar

Criterio para elegir cuál copia conservar quando hay duplicados exactos (mismo hash):
  1. Prioriza rutas que NO contengan carpetas "sospechosas" de ser copias
     temporales/anidadas: extracted/, -nested-unzipped/, /docs/attached_assets/zips/
  2. Entre las que quedan, prioriza la ruta más corta (asumida como la más "canónica").
  3. Si hay empate, la primera en orden alfabético (determinístico).
"""
import hashlib
import os
import sys
import argparse
from collections import defaultdict

SUSPECT_MARKERS = [
    "attached_assets/zips",
    "attached_assets/extracted",
    "-nested-unzipped",
    "/extracted/",
]

def is_suspect(path):
    p = path.replace(os.sep, "/")
    return any(marker in p for marker in SUSPECT_MARKERS)

def file_hash(path, block_size=65536):
    h = hashlib.md5()
    try:
        with open(path, "rb") as f:
            while chunk := f.read(block_size):
                h.update(chunk)
    except (OSError, IOError) as e:
        print(f"  ! no se pudo leer {path}: {e}", file=sys.stderr)
        return None
    return h.hexdigest()

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("root", help="Carpeta raíz a escanear (ej: /home/clientum/Descargas/docs-4)")
    ap.add_argument("--apply", action="store_true", help="Borra los duplicados de verdad (si no, solo reporta)")
    ap.add_argument("--link", action="store_true", help="Junto con --apply: reemplaza duplicados por hardlinks al canónico en vez de solo borrar")
    args = ap.parse_args()

    root = os.path.abspath(args.root)
    if not os.path.isdir(root):
        print(f"No existe la carpeta: {root}")
        sys.exit(1)

    # 1. Agrupar archivos por tamaño primero (barato), después por hash (caro) solo dentro de cada grupo de igual tamaño
    by_size = defaultdict(list)
    total_files = 0
    for dirpath, dirnames, filenames in os.walk(root):
        for fn in filenames:
            full = os.path.join(dirpath, fn)
            try:
                size = os.path.getsize(full)
            except OSError:
                continue
            by_size[size].append(full)
            total_files += 1

    print(f"Archivos escaneados: {total_files}")

    by_hash = defaultdict(list)
    candidates = 0
    for size, paths in by_size.items():
        if len(paths) < 2 or size == 0:
            continue
        candidates += len(paths)
        for p in paths:
            h = file_hash(p)
            if h:
                by_hash[(size, h)].append(p)

    dup_groups = {k: v for k, v in by_hash.items() if len(v) > 1}

    total_wasted = 0
    to_delete = []

    print(f"\nGrupos de duplicados encontrados: {len(dup_groups)}\n")

    for (size, h), paths in sorted(dup_groups.items(), key=lambda kv: -kv[0][0]):
        # Elegir canónico: primero los NO sospechosos, luego ruta más corta, luego alfabético
        ranked = sorted(paths, key=lambda p: (is_suspect(p), len(p), p))
        keep = ranked[0]
        losers = ranked[1:]
        wasted = size * len(losers)
        total_wasted += wasted
        to_delete.extend(losers)

        print(f"[{size/1024:.1f} KB x {len(losers)} duplicado(s), {wasted/1024:.1f} KB desperdiciados]")
        print(f"  MANTENER: {os.path.relpath(keep, root)}")
        for l in losers:
            print(f"  BORRAR:   {os.path.relpath(l, root)}")
        print()

    print("=" * 60)
    print(f"Total archivos duplicados a borrar: {len(to_delete)}")
    print(f"Espacio recuperable: {total_wasted/1024/1024:.2f} MB")
    print("=" * 60)

    if not args.apply:
        print("\n(dry-run, no se borró nada. Corré con --apply para aplicar de verdad)")
        return

    keep_map = {}
    for (size, h), paths in dup_groups.items():
        ranked = sorted(paths, key=lambda p: (is_suspect(p), len(p), p))
        keep_map[ranked[0]] = ranked[0]
        for loser in ranked[1:]:
            keep_map[loser] = ranked[0]

    deleted = 0
    for loser in to_delete:
        canon = keep_map[loser]
        try:
            os.remove(loser)
            if args.link:
                os.link(canon, loser)
            deleted += 1
        except OSError as e:
            print(f"  ! error borrando {loser}: {e}", file=sys.stderr)

    print(f"\nListo. {deleted} archivos duplicados eliminados" + (" y reemplazados por hardlinks." if args.link else "."))

    # Limpieza de directorios vacíos que hayan quedado
    for dirpath, dirnames, filenames in os.walk(root, topdown=False):
        try:
            if not os.listdir(dirpath) and dirpath != root:
                os.rmdir(dirpath)
        except OSError:
            pass

if __name__ == "__main__":
    main()
