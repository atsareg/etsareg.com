# Kate — Geneva Photography

Static single-page portfolio site: plain HTML/CSS/JS, no build step to *view*
it, one small Python script to *generate* the gallery content. Hosted on
GitHub Pages, kept fresh by a GitHub Action that rebuilds the page whenever new
photos are pushed.

Sections: hero slideshow, about, filterable galleries (masonry) with lightbox,
contact form. The previous version of the site (Colorlib template) is preserved
in git history only — on the `legacy` branch and the `old-site-2026-11-04` tag.

---

## 1. Repository layout

```
.
├── index.html                 the single page (mixed hand-written + generated)
├── galleries.json             titles/subtitles + order of the galleries
├── .nojekyll
├── css/style.css              all styles (colors/fonts = variables on top)
├── js/main.js                 all interactions (nav, filter, lightbox, hero)
├── scripts/build.py           generates galleries into index.html markers
├── .github/workflows/build.yml  GitHub Action: push → rebuild → publish Pages
└── images/
    ├── logo_wb_app.png        header logo (white text)
    ├── favicon.png            site favicon (from the old site)
    ├── me-1.jpg / me-2.JPG    portraits of Kate (About section)
    └── <gallery folders>/     one folder = one gallery
        portrait/  creative/  events/  street/  travel/
```

## 2. How the site is put together

There are **two kinds of content** in `index.html`:

| Kind | Where | You edit it? |
|------|-------|--------------|
| **Generated** — hero slides, filter buttons, gallery groups & photo tiles | between `<!-- X:START -->` / `<!-- X:END -->` markers | ❌ never — it is overwritten by `scripts/build.py` |
| **Hand-written** — nav, hero text, About, Contact, Footer | everything outside the markers | ✅ with any text editor |

Generated markers (keep them intact):

- `<!-- HERO-SLIDES:START/END -->` — one `<div class="hero-slide">` per gallery + a clone of the first (for the seamless loop)
- `<!-- FILTERS:START/END -->` — the "All" + one button per gallery
- `<!-- GALLERIES:START/END -->` — one `<div class="gallery-group">` per gallery, each with its own masonry grid

### The generation rule

**A gallery = a subfolder of `images/` that contains photos.**
Supported formats: `.jpg .jpeg .png .webp .avif` (hidden files ignored). The
folder name is used everywhere as the gallery's internal id (`data-category`,
filter value, hero slide id).

Photos are sorted **naturally** inside a gallery: numbers are compared as
numbers, so `p2.jpg` comes before `p10.jpg`.

`galleries.json` maps folder → presentation:

```json
"events": { "title": "Events",
            "sub":  "Warm, candid moments from your gatherings and events" }
```

- `title` — filter button label, group heading, hero chip name, tile captions
- `sub` — italic line under the group heading and in the hero corner chip (optional)
- the **order of entries in the file = the order of the galleries** on the site
- a folder **not listed** still works: title = folder name capitalized, no
  subtitle, placed alphabetically after all listed galleries
- a listed folder with no photos (or deleted) simply disappears

The Hero and Home slideshow automatically include every gallery: slides are
generated one per gallery; at page load `js/main.js` picks **one random photo
per gallery** (drawing from the grid), so new photos are candidates without
touching any code.

## 3. Day-to-day: adding and removing photos

Everything below works the same way — push, and the workflow does the rest
(§4), or run `python3 scripts/build.py` locally first (§6).

| Task | Steps |
|------|-------|
| **Add photos to a gallery** | drop files into e.g. `images/street/`, `git add images/street && git commit && git push` |
| **Create a new gallery** | `mkdir images/weddings`, add photos, add a `"weddings": {…}` entry to `galleries.json` (optional but recommended), commit & push |
| **Remove a photo** | delete the file, commit & push |
| **Remove a whole gallery** | delete its folder (and its entry in `galleries.json`), commit & push |
| **Reorder galleries / rename titles** | edit `galleries.json` order and strings, commit & push |
| **Rename a gallery id** | rename the folder *and* the key in `galleries.json` |

Photo advice: JPG, ~1500–2400 px on the long side, sRGB, quality ≈ 80
(≈ 0.5–2 MB each). Portrait/landscape/square are all fine — the masonry grid
lays out each photo at its native proportions. EXIF orientation is honoured by
browsers.

## 4. Automatic rebuild & publish — GitHub Action

`.github/workflows/build.yml` runs on **every push to `main`** and on manual
dispatch (**Actions → Rebuild galleries & deploy → Run workflow**). It:

1. runs `scripts/build.py` and, if `index.html` changed, commits
   `"Update galleries from images/ [skip ci]"` back to the repo (the
   `[skip ci]` tag prevents an infinite loop);
2. assembles `_site/` (index.html, css/, js/, images/, galleries.json,
   .nojekyll) and **uploads it as the GitHub Pages artifact**;
3. the `deploy` job publishes it with `actions/deploy-pages@v4` — the run
   summary shows the live URL.

**Requirement** (one-time): **Settings → Pages → Build and deployment →
Source: GitHub Actions** (not "Deploy from a branch"). The workflow requests
`contents: write`, `pages: write` and `id-token: write` permissions itself.

**If the site didn't update**, check: the run log in **Actions**; that the four
marker pairs still exist in `index.html`; or run the script locally and push
the result yourself.

## 5. One-time setup & deployment

1. Create a public GitHub repo and push this folder:
   ```bash
   git init && git add . && git commit -m "Portfolio site"
   git branch -M main
   git remote add origin https://github.com/<user>/<repo>.git
   git push -u origin main
   ```
2. **Settings → Pages → Source: GitHub Actions**. Every workflow run then
   publishes the site (~1 min).
3. Site: `https://<user>.github.io/<repo>/`.

> The repo contains a `.gitignore` that excludes `etsareg.com/` (a local
> clone of the old site used as asset source) and `_site/`.

Custom domain (`etsareg.photos`): add a `CNAME` file with the domain, set it in
**Settings → Pages**, and create the DNS record your registrar needs.

> The image set is ~60 MB — fine for GitHub (1 GB repo soft limit), but push
> with git, not the web "upload files" button.

## 6. Local development

```bash
# preview (any static server works)
python3 -m http.server 8000     # → http://localhost:8000

# after changing images/galleries.json, or to preview before pushing:
python3 scripts/build.py        # prints a per-gallery report

# commit ONLY new photos; let the Action (or you) update index.html
git add images/ galleries.json && git commit && git push
```

`scripts/build.py` needs only Python ≥ 3.8 — no dependencies. It rewrites the
three marker regions and prints each gallery's photo count; it exits with an
error if a marker is missing or no gallery folder was found, so a broken
`index.html` is never silently overwritten.

## 7. Editing the hand-written parts

| What | Where |
|------|-------|
| Hero headline / kicker / button | `index.html`, `.hero-content` |
| About text & services list | `index.html`, `#about` (photo: `images/me-2.JPG`, also `me-1.jpg`) |
| Email address (visible) | `index.html` (mailto link in the contact list); submissions go to the inbox tied to the Web3Forms `access_key` in `index.html` |
| Instagram link | `index.html`, `.socials` |
| Footer / copyright | `index.html`, `.site-footer` |
| Colors, fonts, spacing | CSS variables in `:root` of `css/style.css` |
| Slideshow speed | interval in `js/main.js` (Hero slideshow block, currently 10 s) |
| Slide animation feel | `dur` (1600 ms) + easing in `goTo()` |

### Behaviour worth knowing (`js/main.js`)

- **Sticky header** gets a blur background after 40 px of scroll
- **Mobile nav**: hamburger toggles `#siteNav`
- **Filters** show/hide whole `.gallery-group` blocks and mark items with `.hide`
- **Lightbox**: click/Enter on a tile; ←/→ navigate within the *currently
  filtered* set; Esc or backdrop click closes; focus returns to the tile
- **Masonry**: pure CSS `columns` (4 / 3 / 2 on desktop/tablet/phone)
- **Reveal**: tiles fade in on scroll (IntersectionObserver)

## 8. Contact form

The form posts to [Web3Forms](https://web3forms.com), which forwards every
submission to the inbox tied to the **access key** and keeps no dashboard copy.
The key lives in a hidden field in `index.html`:

```html
<input type="hidden" name="access_key" value="0e54d6af-…">
```

To change the destination inbox: generate a new key at web3forms.com with the
new email and replace that value (the key is public by design — it can only
deliver messages to your inbox, nothing else). A hidden `botcheck` checkbox
serves as the spam honeypot; `js/main.js` submits via `fetch` and shows an
inline confirmation in `#formNote`. Without JavaScript the plain POST still
works (Web3Forms built-in success page).

## 9. Troubleshooting

| Symptom | Fix |
|---------|-----|
| New photo not on the site | did the Action run? Check Actions tab; or run `python3 scripts/build.py` and push |
| Gallery missing | folder must be inside `images/` and contain a supported image file (not directly in `images/` root) |
| Weird gallery title | add the folder to `galleries.json` |
| Page shows stale galleries after edits to `index.html` by hand | hand edits *outside* markers are kept; inside markers they are overwritten by the next build — that's by design |
| Workflow loops or fails to push | keep `[skip ci]` in the bot's commit message; check Actions permissions (`contents: write`) |
| Images huge / slow first load | re-export at ~2000 px long side, quality ≈ 80, and re-push |

## 10. Rolling back to the old version of the site

The previous site (Colorlib template, published from `docs/`) is kept in git
history, so switching back is always possible:

- **Restore the old site as `/`**:
  ```bash
  git log --oneline        # find SHA of the replacement commit
  git revert <SHA>         # replays: docs/ + old workflow back, new files off
  git push
  ```
  (Pages source stays "GitHub Actions"; the restored `gh-pages.yml` publishes
  `docs/` again, exactly as before.)
- **Full state via the archive ref:**
  ```bash
  git checkout legacy            # browse/copy everything
  git switch -c try-old legacy   # or experiment on a throwaway branch
  ```
  GitHub UI: switch to the `legacy` branch or download the tag
  `old-site-2026-11-04` as a ZIP (**Releases/Tags → Download source**).

Nothing is ever deleted from git history: `git log --all -- docs/` still shows
every old file with full provenance.
