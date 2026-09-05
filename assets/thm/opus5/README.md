# thm-interactive

**Thermo–Hydro–Mechanical processes in porous media — an interactive primer.**

Nine chapters on the physics and mathematics of coupled THM behaviour in soils,
rocks and other porous media, with about twenty live figures. **Every figure is
computed in the browser at the moment you look at it** — the sliders change the
equations, not a stored picture. Where a closed-form solution exists it is
evaluated directly; where one does not, a small solver runs, and the scheme is
stated in the caption.

No frameworks, no build step, no network requests, no runtime dependencies.
Plain HTML, CSS and JavaScript, with [KaTeX](https://katex.org) and the display
face vendored locally (fonts inlined as data URIs), so it works offline and
from `file://`.

<!-- Once GitHub Pages is enabled for this repo (Settings → Pages → Deploy from
     branch → main / root), the site is live at
     https://yaredwb.github.io/thm-interactive/ -->

---

## Run it

```bash
./serve.sh          # → http://localhost:8000/
# or
python3 -m http.server 8000
```

Opening `index.html` directly from the filesystem mostly works, but a local
server is recommended (some browsers restrict `file://` subresources).

## Build the single-page edition

```bash
node build-single.js
```

Produces two files in `dist/`:

| File | What it is |
|---|---|
| `thm-single.html` | The whole site as one standalone, fully self-contained page (~1 MB). Open it anywhere; no server needed. |
| `thm-artifact.html` | The same content as a bare fragment (no `<!doctype>`/`<head>`/`<body>`), for hosts that supply their own document skeleton. |

The builder reads the chapter manifest out of `assets/js/core.js`, so adding a
chapter there and creating the matching page is all that is needed.

---

## Layout

```
index.html            00  Overview — the coupling map, the regime calculator
porous-media.html     01  REV, porosity, saturation, volume averaging, effective properties
flow.html             02  Darcy, permeability, pressure diffusion, unsaturated flow
heat.html             03  Conduction, advection, Péclet, free convection
mechanics.html        04  Effective stress, Biot constants, Mohr–Coulomb failure
coupled.html          05  The assembled system + Terzaghi, Mandel, thermal pressurisation
numerics.html         06  Discretisation, inf–sup stability, splitting schemes
simulator.html        07  A live 2-D THM reservoir sandbox
reference.html        08  Nomenclature, property ranges, dimensionless groups, reading

assets/
  css/site.css        design tokens (light + dark), layout, every component
  js/core.js          chapter manifest, theme, nav shell, KaTeX, term explorer,
                      lazy-init registry, numerics helpers, colour ramps
  js/plot.js          canvas plotter (axes, hover crosshair, legend, table view),
                      scalar-field painter, marching-squares contours, controls
  js/viz-*.js         one module per chapter
  js/sim2d.js         the 2-D solver for chapter 07
  vendor/katex/       KaTeX with fonts inlined into the CSS
build-single.js       assembles the one-page editions
serve.sh              local static server
LICENSE               MIT
THIRD-PARTY.md        KaTeX (MIT) and Newsreader (OFL 1.1) notices
.nojekyll             so GitHub Pages serves the files verbatim
```

### Adding a figure

1. Put a container in the page:
   `<div class="fig full" id="myFig"><div class="fig__head">…</div><div class="fig__body"></div></div>`
2. Register it: `THM.viz('myFig', function (host) { … });`

It is initialised lazily, the first time it comes near the viewport, and any
exception is caught and reported inside the figure rather than taking the page
down. `THM.loop(host, fn)` gives a `requestAnimationFrame` loop that pauses when
the figure is off-screen or the tab is hidden.

---

## What is actually solved

| Chapter | Figure | Method |
|---|---|---|
| 00 | Hero | Masked Darcy pressure solve (SOR) on a synthetic grain pack; tracers advected by the resulting velocity field; temperature advected + diffused on the same grid |
| 00 | Regime calculator | Closed-form time scales, Péclet, Rayleigh, retardation; water properties from correlations |
| 01 | REV | Summed-area table over a rasterised pack — exact void fraction for any window, plus a ±1σ envelope over window positions |
| 01 | Conductivity | Wiener and Hashin–Shtrikman bounds, geometric mean |
| 02 | Darcy column | Forchheimer quadratic law, β = 0.55/√k (Ward 1964) |
| 02 | Permeability | Kozeny–Carman + measured ranges for real materials |
| 02 | Pressure diffusion | erfc half-space solution |
| 02 | Retention | van Genuchten + Mualem, Carsel & Parrish parameters |
| 02 | Infiltration | Richards' equation, mass-conservative modified Picard (Celia et al. 1990), tridiagonal solve |
| 03 | Fronts | Ogata–Banks advection–dispersion solution for both tracer and heat |
| 03 | Convection | Horton–Rogers–Lapwood: ∇²ψ = −Ra ∂T/∂x by SOR + advected/diffused temperature; Nusselt measured at the base |
| 04 | Biot constants | Standard Biot relations from K, G, K_s, K_f, φ |
| 04 | Mohr | Effective-stress Mohr circle, Mohr–Coulomb envelope, Δp to failure of the intact material and of an arbitrarily oriented fault |
| 05 | Terzaghi | Fourier series, 200 terms |
| 05 | Mandel | Abousleiman et al. form; eigenvalues of tan α = (1−ν)/(ν_u−ν) α by bisection, 60 terms |
| 05 | Heated column | Coupled 1-D THM under uniaxial strain; backward-Euler tridiagonal solves for p and T |
| 06 | Oscillations | A real 1-D poroelastic finite-element assembly (P1–P1), one backward-Euler step, dense solve, optional fluid-pressure-Laplacian stabilisation |
| 06 | Splitting | The four sequential schemes iterated on the scalar model problem |
| 07 | Sandbox | 2-D: implicit pressure (red–black Gauss–Seidel, no-flow boundary), explicit upwind temperature, plane-strain poro-thermo-elasticity by SOR, Coulomb failure function from the resulting stresses |

Simplifications are stated in each caption; chapter 07 has an explicit
limitations note.

---

## Design notes

Colours come from a categorical palette checked with a colour-vision-deficiency
validator in both themes. The three physics take fixed slots — **H = blue,
T = orange, M = aqua** — which pass the adjacent *and* all-pairs CVD gates on
both surfaces:

```
dark  (surface #12120f): CVD ΔE 9.4 · normal-vision ΔE 20.9 · contrast ≥ 3:1   PASS
light (surface #fcfcfb): CVD ΔE 9.2 · normal-vision ΔE 24.0 · aqua 2.74:1      PASS*
```

\* the light-mode aqua sits just below 3:1, which obliges a relief channel —
every chart ships a legend, direct labels and a table view, so no value is
reachable by colour alone.

Sequential fields use single-hue ramps (pressure, saturation) or a semantic heat
scale (temperature), always with a colour bar. Signed fields (stress change,
volumetric strain, ΔCFS) use a blue↔red diverging ramp with a neutral grey
midpoint. Marks are thin, grids are hairline and solid, and direct labels are
dropped rather than allowed to collide.

Both themes are designed, not flipped: dark values are declared under both
`prefers-color-scheme` and `[data-theme]` so the toggle wins either way.

---

## Conventions

Continuum mechanics sign convention throughout: **tension positive**, so
σ′ = σ + αp. Where geotechnical practice (compression positive) is used — the
Mohr circle in chapter 04 — it is flagged in the figure. Strains are small.
The fluid is a single wetting phase unless stated otherwise.

---

## Licence

MIT — see [`LICENSE`](LICENSE). Use it, fork it, teach from it.

Two components are vendored rather than fetched, under their own licences:
**KaTeX** (MIT) and **Newsreader** (SIL OFL 1.1). Full notices in
[`THIRD-PARTY.md`](THIRD-PARTY.md).

## Publishing it

The repository *is* the site — there is nothing to compile. To put it online
with GitHub Pages: **Settings → Pages → Deploy from a branch → `main` / `/ (root)`**.
A `.nojekyll` file is already present so Pages serves the files verbatim.

To re-vendor the dependencies (only needed if you want to bump KaTeX or change
the display face):

```bash
npm i katex @fontsource-variable/newsreader
# then re-run the small inlining snippets documented in assets/vendor/katex/
```
