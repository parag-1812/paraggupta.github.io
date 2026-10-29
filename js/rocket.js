/* =========================================================================
   ROCKET LAUNCH · 3D  (Three.js)
   A realistic Falcon-style launch vehicle on its own transparent canvas over
   the launch screen: metallic first stage, black interstage + second stage,
   an ogive payload fairing, deployed grid fins, stowed landing legs and a
   nine-engine octaweb. Idle: slow turn + gentle bob + venting steam. On
   launch(): ignition flare, a long blue-white Merlin plume, particle exhaust,
   screen shake and a cinematic accelerating blast-off, then hands control back
   to the main scene.

   window.RocketLaunch = { init, launch, dispose }.
   ========================================================================= */
window.RocketLaunch = (function () {
  "use strict";

  let renderer, scene, camera, rocket, flame, exhaust, glowLight, raf = 0;
  let bgStars = null, bgPlanet = null; const steamSprites = [];
  let lastT = 0, mode = "idle", vy = 0, launchT = 0, done = null, host;
  const PN = 300;                 // exhaust particle count
  let pData = [];

  function mat(color, m, r, emissive) {
    return new THREE.MeshStandardMaterial({ color, metalness: m, roughness: r, emissive: emissive || 0x000000, emissiveIntensity: emissive ? 0.6 : 0 });
  }

  // a stowed grid fin: a dark lattice panel (Falcon-style) near the stage top
  function gridFin(dark) {
    const grp = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.5, 0.07), dark); grp.add(frame);
    for (let i = -1; i <= 1; i++) { const v = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.09), dark); v.position.x = i * 0.2; grp.add(v); }
    for (let j = -1; j <= 1; j++) { const h = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.05, 0.09), dark); h.position.y = j * 0.16; grp.add(h); }
    return grp;
  }

  function buildRocket() {
    const g = new THREE.Group();
    const white = mat(0xeef1f7, 0.4, 0.38);
    const panel = mat(0xc4ccda, 0.5, 0.4);          // subtle seam bands
    const dark  = mat(0x15171c, 0.6, 0.5);          // interstage / fins / legs
    const metal = mat(0x8b93a3, 0.9, 0.3);          // engine bells
    const accent = new THREE.MeshBasicMaterial({ color: 0x34e2ff, toneMapped: false });

    // ---- first stage (tall metallic body) ----
    const body = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 6.4, 48), white);
    body.position.y = 4.0; g.add(body);
    // seam bands for panel detail
    [2.3, 5.0].forEach((y) => { const s = new THREE.Mesh(new THREE.CylinderGeometry(1.006, 1.006, 0.06, 48), panel); s.position.y = y; g.add(s); });
    // cyan accent ring near the base (a nod to the portfolio theme)
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.02, 0.035, 8, 48), accent); ring.rotation.x = Math.PI / 2; ring.position.y = 1.1; g.add(ring);

    // ---- octaweb + 9 Merlin engines ----
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.06, 0.55, 48), dark); skirt.position.y = 0.5; g.add(skirt);
    const makeBell = (x, z) => { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.2, 0.55, 16), metal); b.position.set(x, -0.1, z); g.add(b); };
    makeBell(0, 0);
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; makeBell(Math.cos(a) * 0.62, Math.sin(a) * 0.62); }

    // ---- grid fins (4, near the top of the first stage) ----
    for (let i = 0; i < 4; i++) {
      const fin = gridFin(dark);
      const a = i / 4 * Math.PI * 2;
      fin.position.set(Math.cos(a) * 1.28, 6.5, Math.sin(a) * 1.28);
      fin.rotation.y = -a; g.add(fin);
    }

    // ---- stowed landing legs (4, along the lower body) ----
    for (let i = 0; i < 4; i++) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.6, 0.3), dark);
      const a = i / 4 * Math.PI * 2 + Math.PI / 4;
      leg.position.set(Math.cos(a) * 1.04, 1.7, Math.sin(a) * 1.04);
      leg.rotation.y = -a; leg.rotation.z = 0.05; g.add(leg);
    }

    // ---- interstage (black) + second stage ----
    const inter = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.7, 48), dark); inter.position.y = 7.55; g.add(inter);
    const stage2 = new THREE.Mesh(new THREE.CylinderGeometry(0.96, 1.0, 1.5, 48), white); stage2.position.y = 8.65; g.add(stage2);

    // ---- payload fairing (ogive nose via lathe) ----
    const faBase = new THREE.Mesh(new THREE.CylinderGeometry(0.96, 0.96, 0.4, 48), white); faBase.position.y = 9.6; g.add(faBase);
    const ogive = []; const L = 2.0, R = 0.96;
    for (let i = 0; i <= 14; i++) { const y = i / 14 * L; ogive.push(new THREE.Vector2(R * Math.sqrt(Math.max(0, 1 - (y / L) * (y / L))), y)); }
    const nose = new THREE.Mesh(new THREE.LatheGeometry(ogive, 48), white); nose.position.y = 9.8; g.add(nose);

    return g;
  }

  // long, layered blue-white Merlin plume with Mach diamonds
  function buildFlame() {
    const grp = new THREE.Group();
    const bm = (color, op) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.95, 5.0, 28), bm(0xbfe0ff, 0.42));
    cone.rotation.x = Math.PI; cone.position.y = -2.9; grp.add(cone);
    const mid = new THREE.Mesh(new THREE.ConeGeometry(0.52, 3.6, 24), bm(0xffffff, 0.6));
    mid.rotation.x = Math.PI; mid.position.y = -2.2; grp.add(mid);
    const core = new THREE.Mesh(new THREE.ConeGeometry(0.26, 2.6, 20), bm(0x9fd0ff, 0.9));
    core.rotation.x = Math.PI; core.position.y = -1.7; grp.add(core);
    // Mach diamonds — bright pulses down the core
    const diamonds = [];
    [-1.3, -2.0, -2.7].forEach((y) => { const d = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 10), bm(0xffffff, 0.85)); d.scale.set(1, 0.4, 1); d.position.y = y; grp.add(d); diamonds.push(d); });
    grp.userData = { cone, core, mid, diamonds };
    return grp;
  }

  function buildExhaust() {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(PN * 3);
    pData = [];
    for (let i = 0; i < PN; i++) { resetP(i, pos, true); }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({ color: 0xbfe0ff, size: 0.3, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const pts = new THREE.Points(geo, m); pts.userData.pos = pos; return pts;
  }
  function resetP(i, pos, spread) {
    const a = Math.random() * 6.28, r = Math.random() * 0.5;
    pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = -1.1 - Math.random() * (spread ? 2 : 0.5); pos[i * 3 + 2] = Math.sin(a) * r;
    pData[i] = { vy: -(3 + Math.random() * 4), life: Math.random() };
  }

  function buildStars() {
    const n = 520, g = new THREE.BufferGeometry(), p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { p[i * 3] = (Math.random() - 0.5) * 130; p[i * 3 + 1] = (Math.random() - 0.5) * 90; p[i * 3 + 2] = -18 - Math.random() * 90; }
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    bgStars = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xcfe0ff, size: 0.35, transparent: true, opacity: 0.9, depthWrite: false }));
    scene.add(bgStars);
  }
  function buildPlanet() {
    bgPlanet = new THREE.Mesh(new THREE.SphereGeometry(7, 40, 40),
      new THREE.MeshStandardMaterial({ color: 0x2a5aa8, roughness: 1, emissive: 0x0a1a3a, emissiveIntensity: 0.5 }));
    bgPlanet.position.set(-17, 11, -46); scene.add(bgPlanet);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(7.8, 40, 40),
      new THREE.MeshBasicMaterial({ color: 0x4f8fff, transparent: true, opacity: 0.12, side: THREE.BackSide, toneMapped: false }));
    glow.position.copy(bgPlanet.position); scene.add(glow);
  }
  function buildTower() {
    const g = new THREE.Group();
    const mm = new THREE.MeshStandardMaterial({ color: 0x39414f, metalness: 0.6, roughness: 0.5 });
    const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.36, 10.5, 0.36), mm); p1.position.set(2.8, 3.2, 0.7); g.add(p1);
    const p2 = p1.clone(); p2.position.z = -0.7; g.add(p2);
    for (let y = 1; y <= 8.5; y += 1.5) { const beam = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 1.5), mm); beam.position.set(2.8, y, 0); g.add(beam); }
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.24, 0.24), mm); arm.position.set(1.75, 4.6, 0); g.add(arm);
    const light = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), new THREE.MeshBasicMaterial({ color: 0xff4433, toneMapped: false })); light.position.set(2.8, 8.9, 0); g.add(light);
    scene.add(g);
  }

  function softSprite(rgb) {
    const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d");
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, `rgba(${rgb},0.55)`); g.addColorStop(1, `rgba(${rgb},0)`);
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    return new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  }
  function buildPad() {
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 5.3, 0.7, 46), new THREE.MeshStandardMaterial({ color: 0x252b3a, metalness: 0.7, roughness: 0.5 }));
    pad.position.y = -3.4; scene.add(pad);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(4.75, 0.1, 12, 52), new THREE.MeshBasicMaterial({ color: 0x34e2ff, toneMapped: false }));
    ring.rotation.x = Math.PI / 2; ring.position.y = -3.02; scene.add(ring);
  }
  function buildSteam() {
    for (let i = 0; i < 5; i++) { const s = softSprite("232,238,250"); s.userData = { ph: i / 5, x: (i - 2) * 1.3 }; s.visible = false; scene.add(s); steamSprites.push(s); }
  }

  function init(container) {
    if (typeof THREE === "undefined") return false;
    host = container;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
    catch (e) { return false; }
    if (!renderer || !renderer.getContext()) return false;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setSize(innerWidth, innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 100);
    camera.position.set(0, 3.6, 18); camera.lookAt(0, 3.8, 0);

    scene.add(new THREE.AmbientLight(0xafc0ff, 0.5));
    const key = new THREE.DirectionalLight(0xffffff, 1.05); key.position.set(4, 9, 8); scene.add(key);
    const rim = new THREE.DirectionalLight(0x6fd0ff, 0.8); rim.position.set(-6, 3, -4); scene.add(rim);     // cyan rim
    const back = new THREE.DirectionalLight(0xbfe0ff, 0.45); back.position.set(0, 5, -12); scene.add(back);
    glowLight = new THREE.PointLight(0x7fb8ff, 0, 16); glowLight.position.set(0, -1, 0); scene.add(glowLight);

    rocket = buildRocket();
    flame = buildFlame(); flame.visible = false; rocket.add(flame);   // engines off until ignition
    exhaust = buildExhaust(); rocket.add(exhaust);
    rocket.position.y = -2.0;
    scene.add(rocket);

    buildStars(); buildPlanet(); buildTower(); buildPad(); buildSteam();

    addEventListener("resize", onResize);
    lastT = performance.now();
    loop();
    return true;
  }

  function onResize() {
    if (!renderer) return;
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  }

  function loop() {
    raf = requestAnimationFrame(loop);
    const now = performance.now();
    const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
    const t = now / 1000;

    // idle presentation: slow turn + gentle bob + smooth cinematic camera drift
    if (mode === "idle") {
      rocket.rotation.y += dt * 0.28;
      rocket.position.y = -2.0 + Math.sin(t * 1.2) * 0.1;
      camera.position.x = Math.sin(t * 0.22) * 2.6;
      camera.position.y = 3.6 + Math.sin(t * 0.34) * 0.5;
      camera.position.z = 18 + Math.sin(t * 0.18) * 0.9;
      camera.lookAt(0, 3.8, 0);
    }
    if (bgStars) bgStars.rotation.y += dt * 0.008;
    if (bgPlanet) bgPlanet.rotation.y += dt * 0.05;
    // rising steam at the pad (idle venting)
    for (let i = 0; i < steamSprites.length; i++) {
      const s = steamSprites[i], ph = (t * 0.22 + s.userData.ph) % 1;
      s.visible = mode !== "flying";
      s.position.set(s.userData.x, -3 + ph * 6.5, 0.4);
      s.scale.setScalar(2 + ph * 4.5);
      s.material.opacity = (1 - ph) * 0.22 * (mode === "igniting" ? 2 : 1);
    }

    // engines only fire once ignition starts
    flame.visible = mode !== "idle";
    const fl = 0.85 + Math.random() * 0.35;
    flame.userData.cone.scale.set(1 + Math.random() * 0.08, fl, 1 + Math.random() * 0.08);
    flame.userData.mid.scale.set(1, 0.85 + Math.random() * 0.4, 1);
    flame.userData.core.scale.set(1, 0.8 + Math.random() * 0.5, 1);
    flame.userData.diamonds.forEach((d, i) => { const s = 0.7 + Math.abs(Math.sin(t * 22 + i * 1.7)) * 0.6; d.scale.set(s, s * 0.4, s); });
    const idleGlow = mode === "idle" ? 0.1 : 3.0;
    glowLight.intensity += (idleGlow - glowLight.intensity) * Math.min(1, dt * 6);
    glowLight.position.copy(rocket.position); glowLight.position.y -= 1.5;

    // launch dynamics
    if (mode === "igniting") {
      flame.scale.y += (2.4 - flame.scale.y) * Math.min(1, dt * 5);
      rocket.position.y += (Math.sin(t * 60) * 0.03);        // vibration
    } else if (mode === "flying") {
      vy += 26 * dt;                                          // acceleration
      rocket.position.y += vy * dt;
      rocket.rotation.z = Math.sin(t * 3) * 0.02;
      camera.position.x = Math.sin(t * 40) * 0.06;            // camera shake
      if (rocket.position.y > 34 && done) { const cb = done; done = null; cb(); }
    }

    // exhaust particles
    const pos = exhaust.userData.pos;
    const emit = mode === "idle" ? 0.4 : 1;
    for (let i = 0; i < PN; i++) {
      pData[i].life -= dt * 1.2;
      pos[i * 3 + 1] += pData[i].vy * dt * emit;
      if (pData[i].life <= 0 || pos[i * 3 + 1] < -6) resetP(i, pos, false);
    }
    exhaust.geometry.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
  }

  function launch(cb) {
    done = cb; mode = "igniting";
    setTimeout(() => { mode = "flying"; vy = 2; }, 260);
  }

  function dispose() {
    cancelAnimationFrame(raf);
    removeEventListener("resize", onResize);
    if (renderer) { renderer.dispose(); if (renderer.domElement && renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement); }
    renderer = scene = camera = rocket = null;
  }

  return { init, launch, dispose };
})();
