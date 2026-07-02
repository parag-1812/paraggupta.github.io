/* =========================================================================
   VOYAGER · 3D SCENE  (Three.js)  — full solar system edition
   Sun + all 8 planets (Saturn has real rings), an asteroid belt you fly
   through, a roaming comet, depth starfield + nebulae, fresnel atmospheres,
   particle halos, RAYCAST hover/click navigation, mouse parallax, a system
   OVERVIEW shot (all planets visible at once) and UnrealBloom glow.

   window.VoyagerScene = { init, update, resize, jump }.
   ========================================================================= */
window.VoyagerScene = (function () {
  "use strict";

  let renderer, scene, camera, sunLight, sun, planets = [], starLayers = [];
  let belt, comet, cometTail, raycaster, composer = null;
  let lastT = 0, curFov = 58, container, opts = {};
  let hovered = -1, boost = 0, currentPick = null, pickObj = null;
  let cine = null;                       // cinematic fly-to-galaxy state
  const galaxiesByKey = {};
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  let ndc, clickable = [];

  const SPACING = 98;
  const START_Z = 48;
  const BODIES = [
    { key: "sun",     r: 16,  x: 0,   y: 3,  spin: 0.02 },
    { key: "mercury", r: 4,   x: -16, y: 7,  spin: 0.20 },
    { key: "venus",   r: 6,   x: 15,  y: -8, spin: 0.12 },
    { key: "earth",   r: 6.6, x: -13, y: 6,  spin: 0.30 },
    { key: "mars",    r: 5,   x: 17,  y: -7, spin: 0.26 },
    { key: "jupiter", r: 11,  x: -20, y: 9,  spin: 0.16, moons: 2 },
    { key: "saturn",  r: 9,   x: 21,  y: -9, spin: 0.18, rings: true, moons: 1 },
    { key: "uranus",  r: 7,   x: -17, y: 8,  spin: 0.14 },
    { key: "neptune", r: 6.8, x: 18,  y: -8, spin: 0.15, moons: 1 },
  ];
  const TOTAL = (BODIES.length - 1) * SPACING;
  const ATMO = { mercury: 0x8899aa, venus: 0xffd27a, earth: 0x4fb0ff, mars: 0xff7a52, jupiter: 0xe0b884, saturn: 0xf0d9a0, uranus: 0x9fe6ef, neptune: 0x5b7bff };

  // system-overview camera (progress 0 → see the whole system)
  const OVER_POS = new THREE.Vector3(64, 96, 165);
  const OVER_LOOK = new THREE.Vector3(0, -12, -320);
  // wide "SYSTEM VIEW" shot — a side-on lineup so every planet is visible
  const SYS_POS = new THREE.Vector3(650, 120, -392);
  const SYS_LOOK = new THREE.Vector3(0, -10, -392);

  /* ---------- canvas texture helpers ---------- */
  function cv(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function smooth(t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }
  function blobs(ctx, w, h, n, colors, rMin, rMax, aMin, aMax) {
    for (let i = 0; i < n; i++) { ctx.globalAlpha = rnd(aMin, aMax); ctx.fillStyle = colors[(Math.random() * colors.length) | 0]; const x = Math.random() * w, y = rnd(h * 0.12, h * 0.88), r = rnd(rMin, rMax); ctx.beginPath(); ctx.ellipse(x, y, r, r * rnd(0.6, 1), 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
  function bands(x, w, h, palette, minH, maxH) { let y = 0; while (y < h) { const bh = rnd(minH, maxH); x.fillStyle = palette[(Math.random() * palette.length) | 0]; x.fillRect(0, y, w, bh); x.globalAlpha = .2; x.fillStyle = "#000"; x.fillRect(0, y + bh - 2, w, 2); x.globalAlpha = 1; y += bh; } }

  function tex(key) {
    const w = 1024, h = 512, c = cv(w, h), x = c.getContext("2d");
    if (key === "sun") {
      const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#ffb347"); g.addColorStop(.5, "#ff8a1e"); g.addColorStop(1, "#ff6a12"); x.fillStyle = g; x.fillRect(0, 0, w, h);
      blobs(x, w, h, 240, ["#ffd27a", "#ffe6a8"], 6, 22, .15, .5); blobs(x, w, h, 200, ["#e8531a", "#c73a08"], 5, 18, .15, .45);
    } else if (key === "mercury") {
      x.fillStyle = "#837c73"; x.fillRect(0, 0, w, h); blobs(x, w, h, 420, ["#4c4843", "#5c574f"], 3, 16, .2, .5); blobs(x, w, h, 260, ["#a7a096", "#b8b1a5"], 2, 9, .15, .4);
    } else if (key === "venus") {
      x.fillStyle = "#d8a441"; x.fillRect(0, 0, w, h); for (let i = 0; i < 60; i++) { x.globalAlpha = rnd(.12, .35); x.fillStyle = i % 2 ? "#f3dfa6" : "#a9701f"; x.beginPath(); x.ellipse(rnd(0, w), rnd(0, h), rnd(120, 300), rnd(8, 20), rnd(-.3, .3), 0, Math.PI * 2); x.fill(); } x.globalAlpha = 1;
    } else if (key === "earth") {
      const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#0b3b86"); g.addColorStop(.5, "#1257a8"); g.addColorStop(1, "#0b3b86"); x.fillStyle = g; x.fillRect(0, 0, w, h);
      for (let k = 0; k < 26; k++) { const cx = Math.random() * w, cy = rnd(h * 0.2, h * 0.8); x.fillStyle = Math.random() < .5 ? "#2f8f57" : "#3fa564"; for (let j = 0; j < 26; j++) { x.globalAlpha = .9; const a = Math.random() * 6.28, d = rnd(0, 46); x.beginPath(); x.ellipse(cx + Math.cos(a) * d, cy + Math.sin(a) * d * .7, rnd(6, 20), rnd(6, 16), 0, 0, 6.28); x.fill(); } }
      x.globalAlpha = 1; x.fillStyle = "#eef6ff"; x.fillRect(0, 0, w, 26); x.fillRect(0, h - 26, w, 26);
    } else if (key === "mars") {
      x.fillStyle = "#b0492a"; x.fillRect(0, 0, w, h); blobs(x, w, h, 240, ["#7d2d16", "#8f3a1c"], 6, 26, .2, .45); blobs(x, w, h, 160, ["#d0754a", "#c96538"], 4, 14, .15, .4); x.fillStyle = "#f2eee9"; x.fillRect(0, 0, w, 20); x.fillRect(0, h - 16, w, 16);
    } else if (key === "jupiter") {
      bands(x, w, h, ["#d9b98a", "#b98b56", "#e2c99f", "#a9743f", "#d3ab77", "#c79a63"], 14, 40);
      x.fillStyle = "#c1442a"; x.beginPath(); x.ellipse(w * 0.62, h * 0.6, 46, 26, 0, 0, 6.28); x.fill(); x.fillStyle = "#e06540"; x.globalAlpha = .6; x.beginPath(); x.ellipse(w * 0.62, h * 0.6, 30, 16, 0, 0, 6.28); x.fill(); x.globalAlpha = 1;
    } else if (key === "saturn") {
      bands(x, w, h, ["#e8d3a4", "#d8bd86", "#f0e2bd", "#c9a86f", "#e0cb96"], 16, 44);
    } else if (key === "uranus") {
      const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#b7ecf2"); g.addColorStop(.5, "#a3e2ec"); g.addColorStop(1, "#9fdbe8"); x.fillStyle = g; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 12; i++) { x.globalAlpha = .12; x.fillStyle = i % 2 ? "#d6f6fa" : "#88c9d6"; x.fillRect(0, i * (h / 12), w, h / 12); } x.globalAlpha = 1;
    } else if (key === "neptune") {
      const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#2f52c9"); g.addColorStop(.5, "#2a49b8"); g.addColorStop(1, "#28409f"); x.fillStyle = g; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 14; i++) { x.globalAlpha = .12; x.fillStyle = i % 2 ? "#5f80e6" : "#1f347f"; x.fillRect(0, i * (h / 14), w, h / 14); }
      x.globalAlpha = .8; x.fillStyle = "#14205e"; x.beginPath(); x.ellipse(w * 0.6, h * 0.55, 40, 22, 0, 0, 6.28); x.fill();
      x.globalAlpha = .5; x.fillStyle = "#cfe0ff"; for (let i = 0; i < 20; i++) { x.beginPath(); x.ellipse(rnd(0, w), rnd(0, h), rnd(20, 60), rnd(2, 5), 0, 0, 6.28); x.fill(); } x.globalAlpha = 1;
    }
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
  }
  function cloudTex() {
    const w = 1024, h = 512, c = cv(w, h), x = c.getContext("2d"); x.clearRect(0, 0, w, h); x.fillStyle = "#fff";
    for (let i = 0; i < 90; i++) { x.globalAlpha = rnd(.25, .7); const cx = Math.random() * w, cy = rnd(h * 0.15, h * 0.85); for (let j = 0; j < 12; j++) { const a = Math.random() * 6.28, d = rnd(0, 40); x.beginPath(); x.ellipse(cx + Math.cos(a) * d, cy + Math.sin(a) * d * .6, rnd(8, 22), rnd(5, 12), 0, 0, 6.28); x.fill(); } } x.globalAlpha = 1; return new THREE.CanvasTexture(c);
  }
  function ringTex() {
    const s = 512, c = cv(s, s), x = c.getContext("2d"); x.clearRect(0, 0, s, s);
    const cx = s / 2, cy = s / 2, inner = s * 0.30, outer = s * 0.5;
    for (let r = inner; r < outer; r += 1) {
      const tt = (r - inner) / (outer - inner);
      let a = 0.5 + Math.sin(tt * 40) * 0.18 + rnd(-0.05, 0.05);
      if (tt > 0.55 && tt < 0.63) a *= 0.15;                 // Cassini division
      a = Math.max(0, Math.min(0.85, a));
      const shade = 200 + Math.sin(tt * 30) * 30;
      x.strokeStyle = `rgba(${shade | 0},${(shade - 20) | 0},${(shade - 70) | 0},${a})`;
      x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.stroke();
    }
    return new THREE.CanvasTexture(c);
  }
  function radialSprite(stops, blend) {
    const c = cv(256, 256), x = c.getContext("2d"), g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    stops.forEach((s) => g.addColorStop(s[0], s[1])); x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    return new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), blending: blend || THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false }));
  }

  function atmosphere(radius, color, power, opacity) {
    const mat = new THREE.ShaderMaterial({
      uniforms: { glowColor: { value: new THREE.Color(color) }, p: { value: power }, o: { value: opacity } },
      vertexShader: `varying vec3 vN; void main(){ vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader: `varying vec3 vN; uniform vec3 glowColor; uniform float p; uniform float o; void main(){ float i = pow(1.0-abs(vN.z), p); gl_FragColor = vec4(glowColor, i*o);}`,
      side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, toneMapped: false,
    });
    return new THREE.Mesh(new THREE.SphereGeometry(radius * 1.22, 48, 48), mat);
  }
  function halo(radius, color, count) {
    const g = new THREE.BufferGeometry(), pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) { const a = Math.random() * 6.28, rr = radius * rnd(1.5, 2.6), tilt = rnd(-0.5, 0.5); pos[i * 3] = Math.cos(a) * rr; pos[i * 3 + 1] = Math.sin(a) * rr * tilt; pos[i * 3 + 2] = Math.sin(a) * rr; }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return new THREE.Points(g, new THREE.PointsMaterial({ color, size: 0.5, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  }

  function starLayer(count, spread, size, color) {
    const g = new THREE.BufferGeometry(), pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) { pos[i * 3] = rnd(-spread, spread); pos[i * 3 + 1] = rnd(-spread, spread); pos[i * 3 + 2] = rnd(-TOTAL - spread, spread); }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const p = new THREE.Points(g, new THREE.PointsMaterial({ color, size, transparent: true, opacity: 0.9, depthWrite: false })); scene.add(p); return p;
  }
  function nebula(color, x, y, z, s) { const spr = radialSprite([[0, color + "55"], [0.5, color + "18"], [1, color + "00"]]); spr.material.opacity = 0.6; spr.position.set(x, y, z); spr.scale.set(s, s, 1); scene.add(spr); }

  function asteroidBelt() {
    const count = 900, g = new THREE.BufferGeometry(), pos = new Float32Array(count * 3); const zc = -4.5 * SPACING;
    for (let i = 0; i < count; i++) { const a = Math.random() * 6.28, rr = rnd(34, 74); pos[i * 3] = Math.cos(a) * rr; pos[i * 3 + 1] = Math.sin(a) * rr * 0.42 + rnd(-4, 4); pos[i * 3 + 2] = zc + Math.sin(a) * rr * 0.42 + rnd(-10, 10); }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    belt = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xb9a48c, size: 0.9, transparent: true, opacity: 0.85, depthWrite: false })); scene.add(belt);
  }
  function makeComet() {
    comet = radialSprite([[0, "rgba(200,240,255,0.95)"], [0.4, "rgba(120,200,255,0.5)"], [1, "rgba(120,200,255,0)"]]); comet.scale.set(6, 6, 1); scene.add(comet);
    cometTail = radialSprite([[0, "rgba(150,220,255,0.5)"], [1, "rgba(150,220,255,0)"]]); cometTail.scale.set(40, 6, 1); scene.add(cometTail);
  }

  /* ---------- moons (orbit their planet) ---------- */
  function addMoons(grp, planetR, count) {
    const arr = [];
    for (let i = 0; i < count; i++) {
      const pivot = new THREE.Group();
      const dist = planetR * (1.8 + i * 0.7);
      const m = new THREE.Mesh(new THREE.SphereGeometry(planetR * 0.2, 24, 24),
        new THREE.MeshStandardMaterial({ color: 0xcdccd3, roughness: 1, metalness: 0 }));
      m.position.set(dist, 0, 0);
      pivot.add(m); pivot.rotation.x = rnd(-0.5, 0.5); pivot.rotation.z = rnd(-0.3, 0.3);
      pivot.userData.speed = rnd(0.3, 0.7) * (i % 2 ? 1 : -1);
      pivot.rotation.y = rnd(0, 6.28);
      grp.add(pivot); arr.push(pivot);
    }
    grp.userData.moons = arr;
  }

  /* ---------- distant spiral galaxy sprite ---------- */
  function galaxyTex(hue) {
    const s = 256, c = cv(s, s), x = c.getContext("2d");
    x.translate(s / 2, s / 2);
    for (let arm = 0; arm < 2; arm++) {
      for (let i = 0; i < 220; i++) {
        const a = i * 0.13 + arm * Math.PI, r = i * 0.5;
        const px = Math.cos(a) * r, py = Math.sin(a) * r * 0.5;
        x.globalAlpha = Math.max(0, 0.5 - r / 240);
        x.fillStyle = hue; x.beginPath(); x.arc(px, py, rnd(0.6, 2), 0, 6.28); x.fill();
      }
    }
    x.globalAlpha = 0.9; const g = x.createRadialGradient(0, 0, 0, 0, 0, 26);
    g.addColorStop(0, "rgba(255,255,255,0.9)"); g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, 26, 0, 6.28); x.fill();
    return new THREE.CanvasTexture(c);
  }
  function galaxy(key, hue, x, y, z, s, rot) {
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: galaxyTex(hue), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.8, toneMapped: false, fog: false }));
    spr.position.set(x, y, z); spr.scale.set(s, s, 1); spr.material.rotation = rot;
    spr.userData.pick = { kind: "galaxy", key };
    scene.add(spr); clickable.push(spr); galaxiesByKey[key] = spr;
  }

  /* ---------- Milky Way band across the far sky ---------- */
  function milkyway() {
    const w = 1024, h = 256, c = cv(w, h), x = c.getContext("2d");
    const g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "rgba(120,140,220,0)"); g.addColorStop(0.5, "rgba(160,150,230,0.22)"); g.addColorStop(1, "rgba(120,140,220,0)");
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 1400; i++) { x.globalAlpha = rnd(0.05, 0.5); x.fillStyle = ["#cdd6ff", "#fff", "#e7d6ff", "#bcd0ff"][(Math.random() * 4) | 0]; x.fillRect(Math.random() * w, h / 2 + rnd(-h * 0.32, h * 0.32), rnd(0.5, 1.6), rnd(0.5, 1.6)); }
    x.globalAlpha = 1;
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.5, fog: false }));
    spr.position.set(-60, 30, -TOTAL - 500); spr.scale.set(1900, 480, 1); spr.material.rotation = -0.4; scene.add(spr);
  }

  /* ---------- meteor shower (several streaks) ---------- */
  let meteors = [];
  function makeMeteors(n) {
    for (let i = 0; i < n; i++) {
      const head = radialSprite([[0, "rgba(255,250,235,0.95)"], [0.4, "rgba(255,220,170,0.4)"], [1, "rgba(255,220,170,0)"]]); head.scale.set(3.5, 3.5, 1); scene.add(head);
      const tail = radialSprite([[0, "rgba(255,235,200,0.5)"], [1, "rgba(255,235,200,0)"]]); tail.scale.set(26, 3.5, 1); scene.add(tail);
      meteors.push({ head, tail, speed: 0.04 + i * 0.017, phase: i / n, sx: -160 + i * 70, sy: 90 - i * 24, z: -120 - i * 30, dx: 300, dy: -150 });
    }
  }

  /* ====================================================================
     INIT
     ==================================================================== */
  function init(host, options) {
    if (typeof THREE === "undefined") return false;
    container = host; opts = options || {};
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" }); }
    catch (e) { return false; }
    if (!renderer || !renderer.getContext()) return false;

    ndc = new THREE.Vector2(-2, -2); raycaster = new THREE.Raycaster();
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setSize(innerWidth, innerHeight);
    // filmic tone mapping compresses highlights so lit planets keep their
    // colour instead of clipping to white.
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x04050c, 0.0013);
    camera = new THREE.PerspectiveCamera(curFov, innerWidth / innerHeight, 0.1, 3000);
    camera.position.copy(OVER_POS);

    // Moderate, colour-preserving lighting (kept low so lit sides don't clip
    // to white). No distance falloff so far planets are still lit.
    scene.add(new THREE.AmbientLight(0x8a97c4, 0.26));
    scene.add(new THREE.HemisphereLight(0xaecbff, 0x120a1c, 0.22));
    sunLight = new THREE.PointLight(0xffe6c0, 1.15, 4000, 0.0); sunLight.position.set(0, 3, 0); scene.add(sunLight);
    const sunFill = new THREE.DirectionalLight(0xfff0d8, 0.22); sunFill.position.set(0, 6, 20); scene.add(sunFill);
    const headlight = new THREE.PointLight(0xbfd2ff, 0.35, 700); camera.add(headlight); scene.add(camera);

    BODIES.forEach((b, i) => {
      const grp = new THREE.Group(); grp.position.set(b.x, b.y, -i * SPACING);
      const mat = b.key === "sun" ? new THREE.MeshBasicMaterial({ map: tex("sun"), toneMapped: false }) : new THREE.MeshStandardMaterial({ map: tex(b.key), roughness: 1, metalness: 0 });
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(b.r, 64, 64), mat);
      mesh.rotation.z = rnd(-0.35, 0.35); mesh.userData.index = i;
      mesh.userData.pick = { kind: "planet", index: i, key: b.key };
      grp.add(mesh); clickable.push(mesh);

      if (b.key === "sun") {
        const s1 = radialSprite([[0, "rgba(255,220,140,0.95)"], [0.25, "rgba(255,160,60,0.55)"], [0.6, "rgba(255,110,30,0.18)"], [1, "rgba(255,90,20,0)"]]); s1.scale.set(90, 90, 1); grp.add(s1);
        const s2 = radialSprite([[0, "rgba(255,200,120,0.5)"], [1, "rgba(255,120,40,0)"]]); s2.scale.set(150, 150, 1); grp.add(s2);
      } else {
        const atmo = atmosphere(b.r, ATMO[b.key], b.key === "earth" ? 3.0 : 2.2, b.key === "earth" ? 0.9 : 0.55); grp.add(atmo); grp.userData.atmo = atmo;
        const h = halo(b.r, ATMO[b.key], 260); grp.add(h); grp.userData.halo = h;
      }
      if (b.key === "earth") { const clouds = new THREE.Mesh(new THREE.SphereGeometry(b.r * 1.03, 48, 48), new THREE.MeshStandardMaterial({ map: cloudTex(), transparent: true, opacity: 0.9, depthWrite: false })); grp.add(clouds); grp.userData.clouds = clouds; }
      if (b.rings) {
        const ring = new THREE.Mesh(new THREE.RingGeometry(b.r * 1.35, b.r * 2.25, 96), new THREE.MeshBasicMaterial({ map: ringTex(), side: THREE.DoubleSide, transparent: true, depthWrite: false }));
        ring.rotation.x = 1.35; ring.rotation.y = 0.18; grp.add(ring); grp.userData.ring = ring;
        mesh.rotation.x = 0.2;
      }
      if (b.moons) addMoons(grp, b.r, b.moons);

      grp.userData.mesh = mesh; grp.userData.spin = b.spin; grp.userData.base = { y: b.y, phase: i }; grp.userData.scale = 1;
      scene.add(grp); planets.push(grp);
    });
    sun = planets[0];

    starLayers.push(starLayer(1600, 460, 0.7, 0xbfd4ff));
    starLayers.push(starLayer(1000, 560, 1.2, 0x9fb8ff));
    starLayers.push(starLayer(560, 680, 1.8, 0xffffff));
    nebula("#4a2b8f", -170, 90, -160, 460); nebula("#123a7a", 200, -100, -300, 560); nebula("#7a1f5a", -130, -70, -30, 320); nebula("#1f5a6a", 150, 110, -430, 520);
    milkyway();
    galaxy("andromeda", "#a9c4ff", -330, 150, -900, 240, 0.6); galaxy("triangulum", "#ffcf9a", 320, -180, -640, 170, -0.3); galaxy("whirlpool", "#e6a9ff", -280, -160, -1180, 300, 1.1);
    asteroidBelt(); makeComet(); makeMeteors(4);

    // bloom (optional — vendored postprocessing). Never let it break the scene.
    try {
      if (THREE.EffectComposer && THREE.RenderPass && THREE.UnrealBloomPass) {
        composer = new THREE.EffectComposer(renderer);
        composer.addPass(new THREE.RenderPass(scene, camera));
        // gentle bloom — only the Sun / halos glow, planets keep their colour
        const bloom = new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.5, 0.5, 0.72);
        composer.addPass(bloom);
      }
    } catch (e) { composer = null; console.warn("Bloom unavailable:", e.message); }

    addEventListener("pointermove", (e) => {
      mouse.tx = (e.clientX / innerWidth - 0.5) * 2; mouse.ty = (e.clientY / innerHeight - 0.5) * 2;
      ndc.x = (e.clientX / innerWidth) * 2 - 1; ndc.y = -(e.clientY / innerHeight) * 2 + 1;
    });
    renderer.domElement.addEventListener("click", () => {
      if (currentPick && opts.onSelect) { opts.onSelect(currentPick); if (currentPick.kind === "planet") jump(); }
    });
    return true;
  }

  function jump() { boost = 1; if (cine && cine.phase === "system") cine = null; }

  // cinematic wide shot of the whole system (exits on scroll)
  function systemView() { cine = { phase: "system", pos: SYS_POS.clone(), look: SYS_LOOK.clone() }; boost = 1; }

  // cinematic: fly the camera out to a galaxy, then (later) back home
  function flyTo(pick) {
    if (!pick || pick.kind !== "galaxy") return;
    const g = galaxiesByKey[pick.key]; if (!g) return;
    const G = g.position.clone();
    const pos = G.clone().add(new THREE.Vector3(0, 18, 250));   // in front & slightly above
    cine = { phase: "going", pos, look: G, pick, arrived: false };
    boost = 1;
  }
  function returnHome() { if (cine) cine.phase = "returning"; }

  /* ====================================================================
     UPDATE
     ==================================================================== */
  function update(progress, velocity) {
    if (!renderer) return;
    const now = performance.now();
    const dt = Math.min(0.05, (now - (lastT || now)) / 1000); lastT = now;
    const t = now / 1000;

    // blend from system overview → fly-through
    const blend = smooth(progress / 0.06);
    const tz = START_Z - progress * TOTAL;

    const fi = Math.max(0, Math.min(BODIES.length - 1, progress * (BODIES.length - 1)));
    const i0 = Math.floor(fi), i1 = Math.min(BODIES.length - 1, i0 + 1), f = fi - i0;
    const bx = BODIES[i0].x + (BODIES[i1].x - BODIES[i0].x) * f;
    const by = BODIES[i0].y + (BODIES[i1].y - BODIES[i0].y) * f;

    const travelPos = new THREE.Vector3(0, 3, tz);
    const scrollPos = OVER_POS.clone().lerp(travelPos, blend);
    scrollPos.x += mouse.x * 6; scrollPos.y += -mouse.y * 4;
    const travelLook = new THREE.Vector3(bx * 0.18 + mouse.x * 5, 3 + by * 0.12 - mouse.y * 4, tz - 100);
    const scrollLook = OVER_LOOK.clone().lerp(travelLook, blend);

    // choose camera target: scroll-driven, or a cinematic override
    let camTarget = scrollPos, camLook = scrollLook, lerpF = dt * 4.5;
    if (cine) {
      if (cine.phase === "system") {                      // wide system view
        lerpF = dt * 2.2; camTarget = cine.pos; camLook = cine.look;
        if (velocity > 0.6) cine = null;                  // any scroll exits
      } else if (cine.phase === "going") {                // flying out to a galaxy
        lerpF = dt * 1.7; camTarget = cine.pos; camLook = cine.look;
        if (!cine.arrived && camera.position.distanceTo(cine.pos) < 9) { cine.arrived = true; if (opts.onArrive) opts.onArrive(cine.pick); }
      } else {                                            // returning home
        lerpF = dt * 1.7; camTarget = scrollPos; camLook = scrollLook;
        if (camera.position.distanceTo(scrollPos) < 7) cine = null;
      }
    }
    camera.position.lerp(camTarget, Math.min(1, lerpF));
    camera.lookAt(camLook);

    boost *= 0.90;
    const targetFov = 58 + Math.min(10, velocity * 0.06) + boost * 16;
    curFov += (targetFov - curFov) * Math.min(1, dt * 5);
    camera.fov = curFov; camera.updateProjectionMatrix();

    // hover raycast (planets need to be near; galaxies clickable at any range)
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(clickable, false);
    currentPick = null; pickObj = null;
    if (hits.length) {
      const o = hits[0].object, pk = o.userData.pick;
      if (pk && (pk.kind === "galaxy" || hits[0].distance < 320)) { currentPick = pk; pickObj = o; }
    }
    hovered = (currentPick && currentPick.kind === "planet") ? currentPick.index : -1;
    renderer.domElement.style.cursor = currentPick ? "pointer" : "default";

    for (let i = 0; i < planets.length; i++) {
      const g = planets[i];
      g.userData.mesh.rotation.y += g.userData.spin * dt;
      if (g.userData.clouds) g.userData.clouds.rotation.y += g.userData.spin * dt * 1.3;
      if (g.userData.halo) { g.userData.halo.rotation.y += dt * 0.15; g.userData.halo.material.opacity = 0.6 + Math.sin(t * 2 + i) * 0.2; }
      g.position.y = g.userData.base.y + Math.sin(t * 0.6 + g.userData.base.phase) * 0.6;
      const tScale = i === hovered ? 1.18 : 1.0;
      g.userData.scale += (tScale - g.userData.scale) * Math.min(1, dt * 8);
      g.userData.mesh.scale.setScalar(g.userData.scale);
      if (g.userData.atmo) g.userData.atmo.material.uniforms.o.value += (((i === hovered ? 0.8 : (i === 0 ? 0 : 0.38))) - g.userData.atmo.material.uniforms.o.value) * Math.min(1, dt * 8);
      if (g.userData.moons) g.userData.moons.forEach((p) => { p.rotation.y += p.userData.speed * dt; });
    }
    sun.userData.mesh.rotation.y += 0.03 * dt;
    if (belt) belt.rotation.z += dt * 0.05;

    // meteor shower
    for (let mi = 0; mi < meteors.length; mi++) {
      const m = meteors[mi];
      const p = (t * m.speed + m.phase) % 1;
      const x = m.sx + p * m.dx, y = m.sy + p * m.dy;
      const len = Math.hypot(m.dx, m.dy), ux = m.dx / len, uy = m.dy / len;
      m.head.position.set(x, y, m.z);
      m.tail.position.set(x - ux * 11, y - uy * 11, m.z);
      m.tail.material.rotation = Math.atan2(m.dy, m.dx);
      const op = Math.sin(p * Math.PI);
      m.head.material.opacity = op; m.tail.material.opacity = op * 0.6;
    }

    if (comet) {
      const p = (t * 0.06) % 1, cx = -220 + p * 440, cy = 70 - p * 40, cz = -170;
      comet.position.set(cx, cy, cz); cometTail.position.set(cx + 18, cy + 1.6, cz);
      const tw = 0.5 + Math.sin(t * 6) * 0.15; comet.material.opacity = tw; cometTail.material.opacity = tw * 0.6;
    }

    if (opts.onHover) {
      if (currentPick && pickObj) {
        const v = new THREE.Vector3(); pickObj.getWorldPosition(v); v.project(camera);
        if (v.z < 1) opts.onHover(currentPick, (v.x * 0.5 + 0.5) * innerWidth, (-v.y * 0.5 + 0.5) * innerHeight);
        else opts.onHover(null);
      } else opts.onHover(null);
    }

    starLayers.forEach((s, k) => { s.rotation.z += dt * 0.005 * (k + 1); });
    if (composer) composer.render(); else renderer.render(scene, camera);
  }

  function resize() {
    if (!renderer) return;
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    if (composer) composer.setSize(innerWidth, innerHeight);
  }

  return { init, update, resize, jump, flyTo, returnHome, systemView };
})();
