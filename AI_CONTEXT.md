# AI_CONTEXT.md — Full Project Context for AI Handoff

> **Purpose of this file:** Give any AI (or developer) everything it needs to understand,
> run, and safely modify this project **without reading every source file first**.
> Read this top-to-bottom and you will know what the project is, how it's structured,
> how each piece works, and where to make changes.

---

## 1. What this project is

**Name:** Voyager — Parag Gupta's 3D Solar-System Portfolio
**One-liner:** A personal developer portfolio presented as an interactive 3D "flight"
through the solar system. The visitor launches a rocket, then scrolls to fly outward
from the Sun past every planet; each planet is one portfolio section (About, Skills,
Projects, etc.). It ends with a black-hole dive into a "Journey's End" finale.

**Owner / subject of the portfolio:** Parag Gupta — Java Backend Developer
(Associate Engineer at Alphavima Technologies Inc.).

**Type:** A fully **static** website. No backend, no database, no build step, no package
manager, **no npm dependencies to install**. It's plain HTML + CSS + JavaScript plus a
**vendored** (checked-in) copy of Three.js. You can open `index.html` directly or serve
the folder with any static file server.

**Tech stack:**
- Vanilla **HTML5 / CSS3 / JavaScript (ES6, no modules/bundler)**
- **Three.js r128** (vendored in `js/vendor/`) for all WebGL 3D rendering
- **UnrealBloom** post-processing (also vendored) for glow
- **Web Audio API** for 100% synthesized sound (no audio files)
- Deployed as a static site (GitHub Pages / Vercel-style hosting)

**Key design principle:** *Almost all portfolio content lives in one file — [`js/config.js`](js/config.js).*
Everything else (3D, camera, audio, HUD) is generic machinery driven by that config.
**One exception:** the space-fact blurbs shown in the info panels — plus the UFO's
"alien transmission" lines — live in a hardcoded `FACTS` object near the top of
[`js/main.js`](js/main.js), not in `config.js` (see §7.5 and §8).

---

## 2. How to run it

It's static, so any of these work:

```bash
# Option A — just open the file
#   double-click index.html

# Option B — serve the folder (recommended; avoids file:// quirks)
npx serve .
# or
python -m http.server 8000
```

Then open the printed URL. There is nothing to install or compile.

**Entry point:** [`index.html`](index.html). It loads scripts in a **specific order that matters**
(see §5). Browsers must support WebGL and the Web Audio API (all modern browsers do).

---

## 3. Directory structure

```
.
├── index.html            # Markup, meta/OpenGraph tags, DOM scaffolding, script load order
├── README.md             # Human-facing project readme (marketing-flavored)
├── AI_CONTEXT.md         # ← THIS FILE (technical handoff context)
├── .gitignore
├── css/
│   └── style.css         # ALL styling (~42 KB): space theme, HUD, panels, animations, responsive
├── js/
│   ├── config.js         # ← ALL PORTFOLIO CONTENT. Edit this to change text/data.
│   ├── audio.js          # Web Audio engine — synthesized SFX & ambient (window.VoyagerAudio)
│   ├── scene.js          # The 3D solar system in Three.js (window.VoyagerScene)
│   ├── rocket.js         # The 3D rocket on the launch intro screen (window.RocketLaunch)
│   ├── main.js           # Controller/glue: scroll→camera, HUD, interactions, orchestration
│   └── vendor/           # Three.js r128 + bloom post-processing passes (checked-in, do not edit)
└── assets/
    ├── og-image.svg      # Social share preview image
    └── README.md
```

---

## 4. Architecture at a glance

The code is organized as **four independent IIFE modules** that each attach a single
global, plus one controller that wires them together. There is no module system/import —
globals are the integration surface.

| Global           | File        | Responsibility |
|------------------|-------------|----------------|
| `CONFIG`         | config.js   | Plain data object: all portfolio content |
| `window.VoyagerAudio` | audio.js | Synthesized sound engine |
| `window.VoyagerScene` | scene.js | The WebGL solar system (Sun, 8 planets, galaxies, black hole) |
| `window.RocketLaunch` | rocket.js | The 3D rocket shown only on the launch screen |
| *(controller)*   | main.js     | Reads CONFIG → fills DOM; maps scroll to camera; routes all UI/3D/audio events |

**Data flow:**
`CONFIG` → `main.js` renders HTML sections + wires events → user scrolls/clicks →
`main.js` calls into `VoyagerScene` (move/fly/dive camera) and `VoyagerAudio` (play SFX).
The 3D scene reports hover/click/arrival back to `main.js` via callbacks.

---

## 5. Script load order (important — defined in index.html)

Order is required because the vendored Three.js add-ons depend on each other:

```
three.min.js                 # core THREE
CopyShader.js                # shaders first…
LuminosityHighPassShader.js
EffectComposer.js            # defines THREE.Pass
RenderPass.js                # …then passes that extend Pass
ShaderPass.js
MaskPass.js
UnrealBloomPass.js
config.js                    # content
audio.js                     # VoyagerAudio
scene.js                     # VoyagerScene
rocket.js                    # RocketLaunch
main.js                      # controller — boots on DOMContentLoaded
```

If you add a vendored Three.js add-on, insert it **after** `EffectComposer.js`
(which defines `THREE.Pass`) but before anything that extends it.

---

## 6. The journey / section map

Scrolling = traveling outward from the Sun. Each DOM `<section class="station">` maps to a
planet (via its `data-planet` attribute) and to a 3D camera target.

| Order | Planet  | DOM section id | Portfolio content |
|-------|---------|----------------|-------------------|
| 0 | ☀️ Sun     | `#top`        | Hero: name, title, tagline, résumé & contact buttons |
| 1 | ☿ Mercury  | `#about`      | About / mission briefing + stats |
| 2 | ♀ Venus    | `#skills`     | Skills grid (proficiency gauges) |
| 3 | 🌍 Earth   | `#projects`   | Projects / "payload manifest" |
| 4 | ♂ Mars     | `#experience` | Work experience timeline |
| 5 | ♃ Jupiter  | `#education`  | Education timeline |
| 6 | ♄ Saturn   | `#exploring`  | "Currently exploring" chips |
| 7 | ⛢ Uranus   | `#waypoint`   | Flavor/breather section (no config data) |
| 8 | ♆ Neptune  | `#contact`    | Contact / outro + relaunch |
| — | 🕳️ Black hole | (overlay)  | Dive → `#endscene` "Journey's End" finale |

The `SECTIONS` array in `main.js` is the ordered list of these ids and is the source of
truth for scroll progress, the orbit map, auto-tour, and camera targeting.

---

## 7. File-by-file reference

### 7.1 `js/config.js` — the content (EDIT THIS to change the portfolio)
A single `const CONFIG = { ... }` object. Shape:
- `callsign`, `title`, `roles[]` (typewriter cycle), `tagline`, `location`, `status`
- `avatarImage` (Google Drive thumbnail URL), `avatarFocus` (CSS object-position)
- `resumeUrl` (Google Drive link)
- `email`, `phone`, `links[]` ({label, url, icon})
- `about` {heading, paragraphs[], stats[]} → Mercury
- `skills[]` [{system, subtitle, items:[{name, level 0–100}]}] → Venus gauges
- `projects[]` [{name, blurb, tags[], link}] → Earth (link shows "OPEN DOCK")
- `experience[]` [{role, org, period, points[]}] → Mars
- `education[]` [{role, org, period, points[]}] → Jupiter
- `exploring` {heading, lead, items[]} → Saturn chips
- `outro` {heading, message} → Neptune finale

> To update the portfolio you normally only edit this file. No layout knowledge needed.
> Keep the JS object syntax valid (quotes, commas).

### 7.2 `js/scene.js` — the 3D solar system (`window.VoyagerScene`)
Builds and animates the WebGL scene: Sun + all 8 planets (procedural textures, Saturn's
rings, orbiting moons, fresnel atmospheres, particle halos), distant galaxies
(Andromeda / Triangulum / Whirlpool), a star field, and the black hole. Uses an
EffectComposer with UnrealBloom for glow.

**Public API (returned object):**
- `init(container, callbacks)` — build scene; `callbacks = { onHover, onSelect, onArrive, onEmpty }`. Returns truthy on success (WebGL available).
- `update(progress, velocity)` — called every frame with scroll progress (0–1) and velocity; drives the cinematic fly-through camera.
- `resize()` — on window resize.
- `jump()` — quick visual hop (used by orbit-map clicks).
- `flyTo(pick)` — animate camera to a clicked planet/galaxy; opens facts on arrival.
- `returnHome()` — fly back from a galaxy.
- `systemView()` — pull back to see the whole system.
- `diveTo()` — black-hole dive animation.
- `resetToStart()` — reset camera for relaunch.

### 7.3 `js/audio.js` — synthesized sound (`window.VoyagerAudio`)
All sound is generated with the Web Audio API at runtime — **no audio files**. Must be
initialized/resumed after a user gesture (browser autoplay policy); `main.js` warms it on
first `pointerdown` and on the launch click.

**Public API:** `init`, `resume`, `countdownBeep`, `launch`, `whoosh`, `dive`, `blip`,
`chime`, `wish`, `alien`, `ambientStart`, `ambientStop`, `setEnabled`, `toggle`, `isEnabled`.
A mute toggle in the HUD calls `toggle()`/`isEnabled()`.

### 7.4 `js/rocket.js` — launch-screen rocket (`window.RocketLaunch`)
A small dedicated Three.js scene rendered only on the intro/launch overlay. The vehicle is
a **realistic Falcon-style launch rocket**: a tall metallic first stage, seam bands + a cyan
accent ring, a nine-engine octaweb, four stowed landing legs, four deployed grid fins, a
black interstage, a short second stage, and an ogive payload fairing (built with
`LatheGeometry`). The engines are **off while idle** and ignite on launch with a long,
layered **blue-white Merlin plume** (outer glow + white mid + bright core + animated Mach
diamonds) plus particle exhaust and venting steam at the pad.
Idle = slow turn + gentle bob + cinematic camera drift; on `launch()` = ignition flare,
screen shake, accelerating blast-off, then callback.
**API:** `init(container)` (returns truthy if it rendered), `launch(onDone)`, `dispose()`
(frees the GPU context after the intro fades out). Build helpers: `buildRocket()`,
`gridFin()`, `buildFlame()`, `buildExhaust()`.

### 7.5 `js/main.js` — the controller (no global; boots on DOMContentLoaded)
The glue. Responsibilities:
- **Boot:** on `DOMContentLoaded`, render all sections from `CONFIG`, init `VoyagerScene`
  (passing the `onHover/onSelect/onArrive/onEmpty` callbacks), start the loaders.
- **Content rendering:** builds hero, about, skills gauges, projects, timelines, chips,
  contact links from `CONFIG`; typewriter for `roles`.
- **`FACTS` object (second content source):** a hardcoded object near the top of this file
  holds the info-panel blurbs for each planet, the Sun, the three galaxies, the `ufo`, the
  `comet`, and the asteroid `belt` (keys: `sun`, `mercury`, … `neptune`, `andromeda`,
  `triangulum`, `whirlpool`, `ufo`, `comet`, `belt`). Each entry is
  `{ name, tag, color, facts:[...] }`. **The UFO's lines include Parag's email.** Edit space
  facts / the alien transmission here — not in `config.js`. (Full catalog in §12.)
- **Fact-panel modes (`factMode`):** `"planet"` (auto-dismisses + scrolls to the section),
  `"galaxy"` (flies the camera out and back), `"ufo"` and `"info"` (comet/belt — panel in
  place, no camera travel). All close on ✕ / ESC / a real scroll.
- **Launch sequence:** `launchSequence()` → countdown beeps → `RocketLaunch.launch()` →
  reveal the journey, start ambient audio, dispose the rocket.
- **Scroll→camera loop:** `loop()` tracks scroll `curProgress` + `velocity`, calls
  `VoyagerScene.update(...)`, updates the HUD/telemetry/orbit-map.
- **Interactions:** hover reticle, click-to-fly (`onSelect`→`flyTo`), facts panels
  (`openFacts`/`closeFacts`), black-hole dive (`startDive`), finale relaunch, auto-tour
  (`startTour`/`stopTour`), system view, sound toggle, orbit-map jumps.
- **Easter eggs:** clickable UFO → `VoyagerAudio.alien()` + transmission; click empty
  space → `spawnWish()` (shooting star + chime via `onEmpty`).
- **Accessibility:** respects `prefers-reduced-motion` (`reduce`) to skip heavy animation.

### 7.6 `css/style.css`
All styling in one file: space theme, loader, launch screen, HUD/nav, telemetry readout,
orbit map, glass section panels, skill gauges, timelines, fact panels, black-hole/warp
overlays, finale, and responsive + reduced-motion rules.

### 7.7 `js/vendor/`
Checked-in Three.js r128 core plus bloom post-processing passes. **Do not hand-edit**;
treat as an external dependency pinned by copy.

---

## 8. Common tasks / "where do I change X?"

| I want to…​ | Go to |
|-------------|-------|
| Change name, roles, tagline, contact, résumé, avatar | `js/config.js` (identity block) |
| Add/edit/remove a project | `js/config.js` → `projects[]` (each: `name`, `blurb`, `tags[]`, `repo`, `live`) |
| Add a skill or change a proficiency bar | `js/config.js` → `skills[]` (`level` 0–100) |
| Edit About text or stats | `js/config.js` → `about` |
| Edit experience / education | `js/config.js` → `experience[]` / `education[]` |
| Edit a planet/galaxy/comet/belt space fact or the UFO transmission | `js/main.js` → `FACTS` object (NOT config.js) |
| Restyle anything (colors, spacing, panels) | `css/style.css` |
| Change camera motion / planet behavior | `js/scene.js` |
| Change the rocket model / plume / launch | `js/rocket.js` |
| Add a new clickable space object (asteroid, moon, satellite…) | `js/scene.js` + `FACTS` in `js/main.js` (see §14) |
| Change/add a sound | `js/audio.js` (+ call it from `js/main.js`) |
| Change interaction logic, HUD, tour, dive | `js/main.js` |
| Change the DOM scaffolding or script order | `index.html` |
| Change social preview / meta tags | `index.html` (OpenGraph) + `assets/og-image.svg` |

---

## 9. Gotchas & conventions for an AI editing this

1. **No build step.** Edit a file, refresh the browser. Do not add bundlers/transpilers
   unless explicitly requested — the project intentionally has zero dependencies to install.
2. **Globals are the API.** Modules communicate via `window.VoyagerScene`, `window.VoyagerAudio`,
   `window.RocketLaunch`, and `CONFIG`. Don't convert to ES modules without updating
   `index.html` script tags and the load order.
3. **Script order in `index.html` is load-bearing** (see §5).
4. **Audio needs a user gesture** before it can play (browser autoplay policy). Keep the
   `init()`/`resume()` warm-up on first interaction intact.
5. **WebGL may be unavailable.** `VoyagerScene.init()` and `RocketLaunch.init()` return
   truthy on success; `main.js` degrades gracefully if they return falsy. Preserve that.
6. **`prefers-reduced-motion`** is honored (`reduce` flag in `main.js`). Keep heavy
   animations guarded.
7. **`SECTIONS` array in `main.js`** is the ordered source of truth for the journey. If you
   add/remove a section, update: the `<section>` in `index.html`, its `data-planet`, the
   orbit map `<li>` list, `SECTIONS`, and (if it has content) `CONFIG` + the renderer in
   `main.js`.
8. **Content vs. machinery:** keep *portfolio* content in `config.js` and *behavior* in the
   JS modules. The one deliberate exception is the `FACTS` object in `main.js` (info-panel
   space facts + UFO lines) — edit those there, not in `config.js`.
9. **Vendored Three.js is r128.** API calls must match that version (e.g. some newer
   Three.js APIs won't exist).

---

## 10. Deployment

Static hosting. The live site is on **Vercel** at `https://paragguptagithubio.vercel.app/`
(this is the `og:url` / `twitter:image` host in `index.html`). Any static host (Vercel,
Netlify, GitHub Pages) works — just publish the folder as-is; there is no build command.

---

## 11. Quick orientation for a fresh AI

If you're an AI picking this up cold:
1. Read **this file** (done).
2. Skim [`js/config.js`](js/config.js) to see what content exists.
3. Skim [`index.html`](index.html) for the DOM structure and script order.
4. For a content change → edit `config.js`. For a visual change → `css/style.css`.
   For behavior → `js/main.js`. For the 3D → `js/scene.js`. For sound → `js/audio.js`.
5. Test by serving the folder and opening it in a browser (§2).

---

## 12. Astronomical content & data (the "space" layer)

This gathers **all** the astronomy in the project and where each piece lives, so it can be
edited or extended without hunting.

### 12.1 Where the space data lives
- **Geometry / sizes / layout:** `BODIES` array + related constants in `js/scene.js`.
- **Info-panel facts (text shown on click):** `FACTS` object in `js/main.js`.
- **Per-section distance readout (telemetry):** `AU` array in `js/main.js`.

### 12.2 `BODIES` — the solar-system layout (`js/scene.js`)
Each body: `{ key, r (radius), x, y (offset), spin, rings?, moons? }`. They are laid out
along −Z, `SPACING = 98` units apart, starting at the Sun.

| key | radius `r` | spin | extras |
|-----|-----------|------|--------|
| sun     | 16  | 0.02 | emissive, two corona sprites |
| mercury | 4   | 0.20 | — |
| venus   | 6   | 0.12 | — |
| earth   | 6.6 | 0.30 | cloud layer, strong atmosphere |
| mars    | 5   | 0.26 | — |
| jupiter | 11  | 0.16 | 2 moons |
| saturn  | 9   | 0.18 | **rings**, 1 moon |
| uranus  | 7   | 0.14 | — |
| neptune | 6.8 | 0.15 | 1 moon |

Planet textures are **procedurally drawn on canvas** at runtime (`tex(key)` in `scene.js`) —
there are no image files. Each non-Sun planet also gets a shader `atmosphere()` and a
particle `halo()`.

### 12.3 Other 3D space objects (all in `js/scene.js`)
- **Star field** — 3 parallax `starLayer()`s.
- **Nebulae** — 4 coloured `nebula()` sprites; a faint **Milky Way** band (`milkyway()`).
- **Asteroid belt** — `asteroidBelt()`, ~900 points between Mars & Jupiter. **Clickable**
  (invisible torus hit area → `pick.kind === "belt"`).
- **Comet** — `makeComet()`, a sprite + tail that arcs across the sky. **Clickable**
  (invisible sphere that follows it → `pick.kind === "comet"`).
- **Meteor shower** — `makeMeteors()`, 2–4 streaking sprites (ambient, not clickable).
- **3 galaxies** — `galaxy()` for Andromeda / Triangulum / Whirlpool. **Clickable** → the
  camera flies out to them (`pick.kind === "galaxy"`).
- **Black hole** — `blackHole()` at the end of the journey. **Clickable** → triggers the
  dive (`pick.kind === "blackhole"`).
- **UFO** — `buildUFO()`, a roaming saucer. **Clickable** → alien transmission
  (`pick.kind === "ufo"`).

### 12.4 Full `FACTS` catalog (the clickable info panels, `js/main.js`)
All current keys and their facts (edit the text here):

- **sun** — "The Sun": 1.3M Earths fit inside · surface ~5,500°C · light takes 8 min to reach us
- **mercury** — year lasts 88 days · +400°C days / −170°C nights · no moons
- **venus** — spins backwards · day longer than its year · ~465°C surface
- **earth** — only world known to host life · 71% water · orbits at 30 km/s
- **mars** — Olympus Mons (tallest volcano) · moons Phobos & Deimos · 24h 37m day
- **jupiter** — 1,300+ Earths fit inside · 350-year-old Great Red Spot · 95+ moons
- **saturn** — would float on water · icy rings · 140+ moons
- **uranus** — 98° axial tilt · coldest planet (~−224°C) · rolls like a barrel
- **neptune** — 2,100 km/h winds · 30 AU out · 165-Earth-year orbit
- **andromeda** — 2.5M ly away · will collide with the Milky Way · ~1 trillion stars
- **triangulum** — ~2.7M ly away · ~40 billion stars · maybe an Andromeda satellite
- **whirlpool** — ~31M ly away · first galaxy classified as a spiral · dancing with a companion
- **comet** — "dirty snowball" of ice/dust/rock · tail points away from the Sun · long orbits
- **belt** — millions of asteroids · all combined < our Moon · Ceres is a 940 km dwarf planet
- **ufo** — three joke "transmission" lines (one includes Parag's email)

### 12.5 Distance readout
`AU = [0.0, 0.39, 0.72, 1.0, 1.52, 5.2, 9.5, 19.2, 30.1]` in `js/main.js` maps each station
to its real distance from the Sun in astronomical units; the telemetry HUD interpolates it
and also shows km (`AU_KM = 149,597,870`).

---

## 13. Future expansion roadmap (ideas + how hard)

Grouped by effort. None of these are built yet — this is a menu for later.

### 13.1 Content (easy — mostly `config.js` / `FACTS`)
- **More projects** → add objects to `projects[]` (each supports `repo` + `live` links).
- **More space facts** → extend any `FACTS` entry, or add facts for the meteor shower.
- **Testimonials / certifications** → would need a new section (see §13.3).
- **Downloadable résumé variants**, blog links, etc. → `config.js` `links[]`.

### 13.2 New clickable space objects (medium — `scene.js` + `FACTS`, see §14)
- **Pluto / dwarf planets** beyond Neptune, each with facts.
- **Earth's Moon / the ISS** as a clickable near Earth.
- **Named constellations** drawn in the star field.
- **A "project satellite"** orbiting Earth for each flagship project (click → project facts),
  tying the Projects section to the 3D scene.
- Make the **meteor shower** or individual **nebulae** clickable.

### 13.3 New journey stops / sections (medium–hard — HTML + CSS + `SECTIONS` + scene)
- A dedicated **station for a flagship project** (e.g. Synapse) instead of a card — a new
  `<section>`, a `data-planet`, an entry in `SECTIONS` + the orbit map, and a camera target.
- A **"space station" / ISS** stop for certifications or an interactive timeline.
- Remember: adding a stop means touching `index.html` (section + orbit-map `<li>`),
  `SECTIONS` + the renderer in `main.js`, and ideally a matching 3D body in `scene.js`
  (see Gotcha #7).

### 13.4 Interaction & polish (varies)
- **Project detail modal** (richer than the hover card) with screenshots/GIFs.
- **Deep-link / share** a specific planet (`#earth` → auto-fly there on load).
- **Quality / performance toggle**, FPS-aware particle counts (there's already a mobile `Q`).
- **More audio**: distinct arrival tones per planet, a subtle UI click, volume slider.
- **Guided narration** overlay during the auto-tour.
- **VR / device-orientation** parallax on mobile.

### 13.5 Rocket / launch (medium — `js/rocket.js`)
- **Stage separation** animation (jettison the interstage / fairing on ascent).
- **Deploying landing legs / grid fins** on launch.
- **Launch-pad hold-down clamps + flame trench** detail.
- A **second rocket variant** (e.g. Starship-style) selectable from config.

---

## 14. How to add a new clickable space object (worked recipe)

This is exactly how the comet & asteroid belt were made clickable — follow it for any new
object (a moon, a satellite, Pluto, etc.).

**1. In `js/scene.js`** — when you build the object, add an **invisible hit mesh** and
register it in the `clickable` array with a `pick` tag:

```js
const hit = new THREE.Mesh(
  new THREE.SphereGeometry(11, 12, 12),               // generous hit volume
  new THREE.MeshBasicMaterial({ visible: false })     // invisible, but still raycast-hit
);
hit.userData.pick = { kind: "moon", key: "moon" };    // kind routes behavior; key → FACTS
scene.add(hit); clickable.push(hit);
```
If the object moves, update `hit.position` every frame in `update()` (as the comet does).
Note: planets are only pickable within distance 320; everything else is clickable at any
range, so size/position the hit mesh sensibly.

**2. In `js/main.js`** — add a `FACTS` entry keyed by your `key`:

```js
moon: { name: "The Moon", tag: "Earth's companion", color: "#cdd3e3",
        facts: ["...", "...", "..."] },
```

**3. In `js/main.js` `onSelect(pick)`** — decide what clicking does. For a simple
info-panel-in-place object, mirror the comet/belt branch:

```js
if (pick.kind === "moon") {
  factMode = "info";
  document.body.classList.add("facts-open");
  if (window.VoyagerAudio) VoyagerAudio.chime();
  openFacts(pick.key, false, "right");
  return;
}
```
The reticle label (`onHover`) falls through to a generic "… ▸ CLICK FOR FACTS" using the
`FACTS` name automatically, so no change is needed there unless you want custom text.

That's it — no build step; refresh to see it.
