/* =========================================================================
   ROCKET LAUNCH · 3D  (Three.js)
   A detailed 3D rocket on its own transparent canvas over the launch screen.
   Idle: slow rotation + engine flicker. On launch(): ignition flare, screen
   shake, particle exhaust and a cinematic accelerating blast-off, then hands
   control back to the main scene.

   window.RocketLaunch = { init, launch, dispose }.
   ========================================================================= */
window.RocketLaunch = (function () {
  "use strict";

  let renderer, scene, camera, rocket, flame, exhaust, glowLight, raf = 0;
  let bgStars = null, bgPlanet = null; const steamSprites = [];
  let lastT = 0, mode = "idle", vy = 0, launchT = 0, done = null, host;
  const PN = 240;                 // exhaust particle count
  let pData = [];

  function mat(color, m, r, emissive) {
    return new THREE.MeshStandardMaterial({ color, metalness: m, roughness: r, emissive: emissive || 0x000000, emissiveIntensity: emissive ? 0.6 : 0 });
  }

  function buildRocket() {
    const g = new THREE.Group();
    const white = mat(0xeef2fb, 0.55, 0.32);
    const red   = mat(0xe5382b, 0.35, 0.45);
    const dark  = mat(0x2c3140, 0.85, 0.4);
    const gold  = mat(0xf4c063, 0.7, 0.35);

    // main body
    const body = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.2, 5.0, 40), white);
    body.position.y = 2.9; g.add(body);
    // shoulder taper to nose
    const shoulder = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 1.1, 0.9, 40), white);
    shoulder.position.y = 5.85; g.add(shoulder);
    // nose cone
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.72, 1.9, 40), red);
    nose.position.y = 7.25; g.add(nose);
    // accent stripes
    [1.1, 4.4].forEach((y) => { const s = new THREE.Mesh(new THREE.CylinderGeometry(1.16, 1.16, 0.34, 40), red); s.position.y = y; g.add(s); });
    const band = new THREE.Mesh(new THREE.CylinderGeometry(1.13, 1.13, 0.2, 40), gold); band.position.y = 2.9; g.add(band);
    // window
    const win = new THREE.Mesh(new THREE.CircleGeometry(0.42, 32), mat(0x22b6e6, 0.2, 0.2, 0x0a6a9c));
    win.position.set(0, 3.7, 1.16); g.add(win);
    const winRing = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.55, 32), gold);
    winRing.position.set(0, 3.7, 1.15); g.add(winRing);
    // engine skirt + nozzle
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.35, 0.6, 40), dark); skirt.position.y = 0.2; g.add(skirt);
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.95, 1.1, 32), dark); nozzle.position.y = -0.6; g.add(nozzle);

    // fins (3, around base)
    const finShape = new THREE.Shape();
    finShape.moveTo(0, 0); finShape.lineTo(0, 2.0); finShape.lineTo(1.5, -0.2); finShape.lineTo(0.2, -0.5); finShape.lineTo(0, 0);
    const finGeo = new THREE.ExtrudeGeometry(finShape, { depth: 0.16, bevelEnabled: false });
    for (let i = 0; i < 3; i++) {
      const fin = new THREE.Mesh(finGeo, red);
      const a = (i / 3) * Math.PI * 2;
      fin.position.set(Math.cos(a) * 1.05, 0.4, Math.sin(a) * 1.05);
      fin.rotation.y = -a + Math.PI / 2; fin.rotation.z = 0;
      g.add(fin);
    }

    // side boosters
    for (let s = -1; s <= 1; s += 2) {
      const bo = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 3.0, 24), white);
      bo.position.set(s * 1.45, 1.6, 0); g.add(bo);
      const bn = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.8, 24), red);
      bn.position.set(s * 1.45, 3.5, 0); g.add(bn);
      const bnoz = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.4, 0.5, 16), dark);
      bnoz.position.set(s * 1.45, -0.05, 0); g.add(bnoz);
    }

    return g;
  }

  function buildFlame() {
    const grp = new THREE.Group();
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.8, 3.0, 24),
      new THREE.MeshBasicMaterial({ color: 0xffb03a, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    cone.rotation.x = Math.PI; cone.position.y = -2.4; grp.add(cone);
    const core = new THREE.Mesh(new THREE.ConeGeometry(0.4, 2.0, 20),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    core.rotation.x = Math.PI; core.position.y = -1.9; grp.add(core);
    grp.userData = { cone, core };
    return grp;
  }

  function buildExhaust() {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(PN * 3);
    pData = [];
    for (let i = 0; i < PN; i++) { resetP(i, pos, true); }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({ color: 0xffca6a, size: 0.28, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
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
    camera.position.set(0, 2.6, 16); camera.lookAt(0, 2.6, 0);

    scene.add(new THREE.AmbientLight(0xafc0ff, 0.5));
    const key = new THREE.DirectionalLight(0xffffff, 1.0); key.position.set(4, 8, 8); scene.add(key);
    const rim = new THREE.DirectionalLight(0x6f8cff, 0.7); rim.position.set(-6, 2, -4); scene.add(rim);
    const back = new THREE.DirectionalLight(0xffd9a0, 0.5); back.position.set(0, 4, -12); scene.add(back);  // warm rim
    glowLight = new THREE.PointLight(0xff8a2a, 0, 14); glowLight.position.set(0, -1, 0); scene.add(glowLight);

    rocket = buildRocket();
    flame = buildFlame(); rocket.add(flame);
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
      rocket.rotation.y += dt * 0.32;
      rocket.position.y = -2.0 + Math.sin(t * 1.2) * 0.1;
      camera.position.x = Math.sin(t * 0.22) * 2.4;
      camera.position.y = 2.6 + Math.sin(t * 0.34) * 0.45;
      camera.position.z = 16 + Math.sin(t * 0.18) * 0.8;
      camera.lookAt(0, 2.9, 0);
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

    // engine flicker
    const fl = 0.8 + Math.random() * 0.4;
    flame.userData.cone.scale.set(1, fl, 1);
    flame.userData.core.scale.set(1, 0.8 + Math.random() * 0.5, 1);
    const idleGlow = mode === "idle" ? 0.6 : 2.6;
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
