# Icare Clinic: redesign proposal ("Iris Noir")

A redesign pitch for [ikiavisioncenter.com](https://www.ikiavisioncenter.com/) (Icare Clinic, Ike Ikechi, OD,
Houston, TX). The live site's structure, URLs, menus and copy are kept; the design is new: glassmorphism and
tenebrism, a dark stage lit by the brand's amber iris, layered depth, scroll and hover motion.

- Every page is `noindex` in the preview, and canonical links point at the live site.
- Decisions and open items for the practice: [docs/DECISIONS.md](docs/DECISIONS.md).
- Generated imagery (fal, Higgsfield) is illustrative and carries the IPTC `trainedAlgorithmicMedia` label; it never
  depicts the practice's doctor, staff, patients or office.

## Build

Node 18+ and `cwebp`/`webpmux` on PATH (no npm dependencies).

```
node src/build.mjs                      # src/content page models -> dist/
node tools/serve.mjs --root dist --port 8790 --not-found 404.html
```

| Path | What |
|---|---|
| `src/content/pages/*.json` | one model per live page (copy carried verbatim) |
| `src/content/site.json` | practice facts, menus, footer, sidebar, redirects |
| `src/theme/` | templates: shell, chrome (header, mega panels, drawer, footer), home, inner, blocks |
| `src/styles/` | tokens, base, components, chrome, motion, home, pages |
| `src/scripts/site.js` | reveal, parallax, tilt, spotlight, menus, loops (vanilla, no dependencies) |
| `assets/` | harvested photos (`source/`), generated media (`generated/`), brand and fonts |
