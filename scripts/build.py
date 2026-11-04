#!/usr/bin/env python3
"""Regenerate the gallery sections of index.html from the images/ folder.

Each subfolder of images/ containing photos becomes a gallery:
  - filter button, group heading, masonry items and hero slideshow slides
  are generated between the HERO-SLIDES / FILTERS / GALLERIES markers.

Titles and subtitles come from galleries.json (optional). A folder that is
not listed there gets a default title (folder name capitalized) and no
subtitle. Listed folders also define the gallery order; new folders are
appended alphabetically at the end.

Usage:  python3 scripts/build.py
The GitHub Action (.github/workflows/build.yml) runs it automatically
whenever images/, galleries.json, this script or index.html change.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
IMG = ROOT / "images"
INDEX = ROOT / "index.html"
CFG = ROOT / "galleries.json"
EXTS = {".jpg", ".jpeg", ".png", ".webp", ".avif"}


def natural(path):
    return tuple((0, int(t)) if t.isdigit() else (1, t.lower())
                 for t in re.split(r"(\d+)", path.stem)) + (path.suffix.lower(),)


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def attr(s):
    return esc(s).replace('"', "&quot;")


def load_cfg():
    if CFG.exists():
        return json.loads(CFG.read_text(encoding="utf-8"))
    return {}


def scan():
    if not IMG.is_dir():
        sys.exit(f"ERROR: {IMG} not found")
    cfg = load_cfg()
    present = sorted(d.name for d in IMG.iterdir() if d.is_dir())
    names = [n for n in cfg if n in present] + [n for n in present if n not in cfg]
    galleries = []
    for name in names:
        d = IMG / name
        photos = sorted(
            (f for f in d.iterdir()
             if f.is_file() and not f.name.startswith(".")
             and f.suffix.lower() in EXTS),
            key=natural,
        )
        if not photos:
            continue
        meta = cfg.get(name, {})
        galleries.append({
            "category": name,
            "title": meta.get("title", name.capitalize()),
            "sub": meta.get("sub", ""),
            "photos": [f.relative_to(ROOT).as_posix() for f in photos],
        })
    return galleries


def hero_block(gals):
    def slide(g, clone):
        if clone:
            return (f'        <div class="hero-slide" data-name="{attr(g["title"])}"'
                    f' data-teaser="{attr(g["sub"])}" data-clone>'
                    f'<img src="{g["photos"][0]}" alt=""></div>')
        return (f'        <div class="hero-slide" data-name="{attr(g["title"])}"'
                f' data-gallery="{attr(g["category"])}"'
                f' data-teaser="{attr(g["sub"])}">'
                f'<img src="{g["photos"][0]}" alt="{attr(g["title"])} photograph"></div>')
    lines = [slide(g, False) for g in gals]
    lines.append(slide(gals[0], True))
    return "\n".join(lines)


def filters_block(gals):
    lines = ['          <button class="filter-btn is-active" data-filter="all">All</button>']
    lines += [f'          <button class="filter-btn" data-filter="{attr(g["category"])}">'
              f'{esc(g["title"])}</button>' for g in gals]
    return "\n".join(lines)


def galleries_block(gals):
    blocks = []
    for g in gals:
        head = (f'        <div class="gallery-group" data-group="{attr(g["category"])}">\n'
                f'          <div class="group-head">\n'
                f'            <h3 class="group-title">{esc(g["title"])}</h3>')
        if g["sub"]:
            head += f'\n            <p class="group-sub">{esc(g["sub"])}</p>'
        head += '\n          </div>\n          <div class="gallery-grid">'
        items = []
        for i, photo in enumerate(g["photos"], 1):
            items.append(
                f'          <figure class="gallery-item reveal" '
                f'data-category="{attr(g["category"])}" tabindex="0">\n'
                f'            <img src="{photo}" alt="{esc(g["title"])} photograph {i:02d}" loading="lazy">\n'
                f'            <figcaption>{esc(g["title"])} {i:02d}'
                f'<span>{esc(g["title"])}</span></figcaption>\n'
                f'          </figure>')
        blocks.append(head + "\n" + "\n".join(items) +
                      "\n          </div>\n        </div>")
    return "\n\n".join(blocks)


def replace_block(html, marker, new):
    start = f"<!-- {marker}:START -->"
    end = f"<!-- {marker}:END -->"
    s = html.find(start)
    e = html.find(end)
    if s < 0 or e < 0:
        sys.exit(f"ERROR: {start} / {end} markers missing in index.html")
    ls = html.find("\n", s) + 1
    le = html.rfind("\n", 0, e) + 1
    return html[:ls] + new + "\n" + html[le:]


def main():
    gals = scan()
    if not gals:
        sys.exit("ERROR: no gallery folders with photos found in images/")
    html = INDEX.read_text(encoding="utf-8")
    out = replace_block(html, "HERO-SLIDES", hero_block(gals))
    out = replace_block(out, "FILTERS", filters_block(gals))
    out = replace_block(out, "GALLERIES", galleries_block(gals))
    if out != html:
        INDEX.write_text(out, encoding="utf-8")
        print("index.html regenerated")
    else:
        print("index.html up to date")
    total = 0
    for g in gals:
        total += len(g["photos"])
        print(f'  {g["category"]:<12} {len(g["photos"]):>3} photos   "{g["title"]}"')
    print(f'  {"TOTAL":<12} {total:>3} photos')


if __name__ == "__main__":
    main()
