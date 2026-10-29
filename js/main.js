/* =========================================================================
   VOYAGER — controller
   Renders content from CONFIG, boots the 3D scene, and runs one smooth
   animation loop that maps scroll → eased journey progress, driving the
   camera, telemetry, orbit map and nav together.
   ========================================================================= */
(function () {
  "use strict";

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const AU = [0.0, 0.39, 0.72, 1.0, 1.52, 5.2, 9.5, 19.2, 30.1];   // per station
  const AU_KM = 149597870;
  const SECTIONS = ["top", "about", "skills", "projects", "experience", "education", "exploring", "waypoint", "contact"];
  const PLANET = ["Sun", "Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"];
  const DEST   = ["Home", "Briefing", "Systems", "Projects", "Flight Log", "Education", "Exploring", "Waypoint", "Comms"];
  const PLANET_KEY = ["sun", "mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune"];

  // Punchy space facts for the info panel (planets + clickable galaxies)
  const FACTS = {
    sun:      { name: "The Sun", tag: "Our home star · G-type", color: "#ffb43c", facts: ["1.3 million Earths would fit inside it", "Surface burns at ~5,500°C", "Its light takes 8 minutes to reach us"] },
    mercury:  { name: "Mercury", tag: "Smallest planet · closest to the Sun", color: "#9a938a", facts: ["A whole year lasts just 88 days", "Days above 400°C, nights below −170°C", "No moons and almost no atmosphere"] },
    venus:    { name: "Venus", tag: "The hottest planet", color: "#d9a441", facts: ["It spins backwards", "A day is longer than its year", "Surface ~465°C — hot enough to melt lead"] },
    earth:    { name: "Earth", tag: "The pale blue dot · home", color: "#3f8fe0", facts: ["The only world known to host life", "71% of it is covered by water", "Races around the Sun at 30 km every second"] },
    mars:     { name: "Mars", tag: "The red planet", color: "#c1502a", facts: ["Home to Olympus Mons — the tallest volcano in the system", "Has two tiny moons: Phobos & Deimos", "A day is 24h 37m, almost like Earth"] },
    jupiter:  { name: "Jupiter", tag: "The largest planet", color: "#c99a5b", facts: ["Over 1,300 Earths would fit inside", "The Great Red Spot is a 350-year-old storm", "Has 95+ known moons"] },
    saturn:   { name: "Saturn", tag: "The ringed jewel", color: "#e8d3a4", facts: ["So light it would float on water", "Its rings are mostly ice and rock", "Has 140+ known moons"] },
    uranus:   { name: "Uranus", tag: "The sideways ice giant", color: "#a3e2ec", facts: ["Rotates on its side at a 98° tilt", "Coldest planet: about −224°C", "It rolls around the Sun like a barrel"] },
    neptune:  { name: "Neptune", tag: "The windy blue giant", color: "#3a55c9", facts: ["Winds rip at up to 2,100 km/h — fastest in the system", "Farthest planet: 30 AU from the Sun", "One year = 165 Earth years"] },
    andromeda:  { name: "Andromeda Galaxy", tag: "Nearest major galaxy", color: "#a9c4ff", facts: ["2.5 million light-years away", "On a collision course with the Milky Way (~4.5 billion yrs)", "Holds around 1 trillion stars"] },
    triangulum: { name: "Triangulum Galaxy", tag: "3rd-largest in our Local Group", color: "#ffcf9a", facts: ["~2.7 million light-years away", "Home to about 40 billion stars", "Possibly a satellite of Andromeda"] },
    whirlpool:  { name: "Whirlpool Galaxy", tag: "The classic spiral", color: "#e6a9ff", facts: ["~31 million light-years away", "First galaxy ever classified as a spiral", "Locked in a slow dance with a smaller galaxy"] },
    ufo:        { name: "Unknown Craft", tag: "Signal decoded 🛸", color: "#7cff9e", facts: ["\"Greetings, Earthling — we come in peace (and Java).\"", "\"Nice portfolio, human. Very out of this world.\"", "\"Ping us at paraggupta9988@gmail.com — Parag builds cool things.\""] },
    comet:      { name: "Comet", tag: "Icy wanderer of the deep", color: "#9fe0ff", facts: ["Made of ice, dust and rock — a \"dirty snowball\"", "Its glowing tail always points away from the Sun", "Some take thousands of years to orbit once"] },
    belt:       { name: "The Asteroid Belt", tag: "Between Mars & Jupiter", color: "#b9a48c", facts: ["Millions of rocky asteroids orbit the Sun here", "All of them combined weigh less than our Moon", "Ceres, the largest, is a 940 km dwarf planet"] },
  };

  /* typewriter that types / deletes through a list of words, forever */
  function typewriter(el, words) {
    let wi = 0, ci = 0, del = false;
    (function tick() {
      const w = words[wi];
      ci += del ? -1 : 1;
      el.textContent = w.slice(0, ci);
      let delay = del ? 40 : 85;
      if (!del && ci === w.length) { delay = 1500; del = true; }
      else if (del && ci === 0) { del = false; wi = (wi + 1) % words.length; delay = 350; }
      setTimeout(tick, delay);
    })();
  }

  let scene3D = false, factMode = null, factTimer = 0, lastHoverKey = null;
  let touring = false, wishCooldown = 0, wishTipT = 0; const tourTimers = [];
  let curProgress = 0, lastScrollY = 0, velocity = 0;

  /* ======================================================================
     CONTENT RENDER
     ====================================================================== */
  function render() {
    const c = CONFIG;
    $("#launch-name").textContent  = c.callsign;
    $("#launch-title").textContent = c.title;
    $("#hero-name").textContent    = c.callsign;
    $("#hero-tagline").textContent = c.tagline;

    // Hero role: typewriter cycle if roles given, else static title
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (c.roles && c.roles.length && !reduce) {
      const ht = $("#hero-title");
      ht.innerHTML = '<span id="roletext"></span><span class="tw-cursor"></span>';
      typewriter($("#roletext"), c.roles);
    } else {
      $("#hero-title").textContent = c.title;
    }

    // Résumé button
    const rb = $("#resume-btn");
    if (rb) { if (c.resumeUrl) rb.href = c.resumeUrl; else rb.style.display = "none"; }
    $("#hero-status").textContent  = "● " + (c.status || "Online");
    $("#hero-location").textContent = c.location ? "◎ " + c.location : "";
    $("#hud-callsign").textContent = c.callsign.split(" ")[0];
    $("#footer-name").textContent  = c.callsign;
    document.title = c.callsign + " · Voyager";

    const initials = c.callsign.trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    const avatar = $("#avatar");
    const focus = c.avatarFocus || "center 20%";
    avatar.innerHTML = c.avatarImage
      ? `<img src="${esc(c.avatarImage)}" alt="${esc(c.callsign)}" style="object-position:${esc(focus)}" onerror="this.parentNode.innerHTML='<div class=&quot;avatar-fallback&quot;>${initials}</div>'">`
      : `<div class="avatar-fallback">${initials}</div>`;

    $("#about-heading").textContent = c.about.heading;
    $("#about-copy").innerHTML = c.about.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("");
    $("#about-stats").innerHTML = c.about.stats.map((s) => `
      <div class="dial"><div class="dial-value">${esc(s.value)}</div><div class="dial-label">${esc(s.label)}</div></div>`).join("");

    $("#skills-grid").innerHTML = c.skills.map((grp) => `
      <div class="skill-panel">
        <h3>${esc(grp.system)}</h3><div class="sys-sub">${esc(grp.subtitle || "")}</div>
        ${grp.items.map((it) => `
          <div class="gauge">
            <div class="gauge-top"><span>${esc(it.name)}</span><span class="pct">${it.level}%</span></div>
            <div class="gauge-track"><div class="gauge-bar" data-level="${it.level}"></div></div>
          </div>`).join("")}
      </div>`).join("");

    $("#projects-grid").innerHTML = c.projects.map((p, i) => {
      // `repo`/`live` are the current fields; `link` is still honoured as a fallback.
      const repo = p.repo || p.link || "";
      const live = p.live || "";
      const links = [
        repo ? `<a class="project-link" href="${esc(repo)}" target="_blank" rel="noopener">CODE ↗</a>` : "",
        live ? `<a class="project-link project-link-live" href="${esc(live)}" target="_blank" rel="noopener">LIVE ↗</a>` : "",
      ].join("");
      return `
      <div class="project-card">
        <span class="project-tag-sat">SAT-${String(i + 1).padStart(2, "0")}</span>
        <h3>${esc(p.name)}</h3><p>${esc(p.blurb)}</p>
        <div class="chips">${(p.tags || []).map((t) => `<span class="chip">${esc(t)}</span>`).join("")}</div>
        ${links ? `<div class="project-links">${links}</div>` : ""}
      </div>`;
    }).join("");

    const timelineHTML = (arr) => arr.map((e) => `
      <div class="tl-item">
        <h3>${esc(e.role)} <span style="color:var(--ink-dim);font-size:.8em">· ${esc(e.period)}</span></h3>
        <div class="tl-org">${esc(e.org)}</div>
        <ul>${e.points.map((pt) => `<li>${esc(pt)}</li>`).join("")}</ul>
      </div>`).join("");
    $("#timeline").innerHTML = timelineHTML(c.experience);
    if (c.education) $("#edu-timeline").innerHTML = timelineHTML(c.education);

    // Currently Exploring (Saturn)
    if (c.exploring) {
      $("#exploring-heading").textContent = c.exploring.heading;
      $("#exploring-lead").textContent = c.exploring.lead || "";
      $("#exploring-grid").innerHTML = c.exploring.items.map((it) => `<span class="chip">${esc(it)}</span>`).join("");
    }
    // Outro (Neptune)
    if (c.outro) {
      $("#outro-heading").textContent = c.outro.heading;
      $("#outro-message").textContent = c.outro.message;
    }

    const emailEl = $("#contact-email");
    emailEl.textContent = c.email; emailEl.href = "mailto:" + c.email;
    const links = (c.links || []).slice();
    if (c.phone) links.push({ label: "Call", url: "tel:" + c.phone, icon: "\u{1F4DE}" });
    const linksHTML = links.map((l) => `
      <a href="${esc(l.url)}" target="_blank" rel="noopener"><span>${l.icon || "→"}</span> ${esc(l.label)}</a>`).join("");
    $("#contact-links").innerHTML = linksHTML;

    // Finale scene (after the black-hole dive) reuses contact + outro
    if ($("#end-message") && c.outro) $("#end-message").textContent = c.outro.message;
    const endEmail = $("#end-email");
    if (endEmail) { endEmail.textContent = c.email; endEmail.href = "mailto:" + c.email; }
    if ($("#end-links")) $("#end-links").innerHTML = linksHTML;

    $("#year").textContent = new Date().getFullYear();
  }

  /* ======================================================================
     2D STARFIELD FALLBACK (only if WebGL is unavailable)
     ====================================================================== */
  function starfield2D() {
    const canvas = $("#starfield");
    canvas.style.display = "block";
    const ctx = canvas.getContext("2d");
    let stars = [], w, h, dpr;
    function resize() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.width = innerWidth * dpr; h = canvas.height = innerHeight * dpr;
      canvas.style.width = innerWidth + "px"; canvas.style.height = innerHeight + "px";
      stars = Array.from({ length: 220 }, () => ({ x: Math.random() * w, y: Math.random() * h, z: Math.random() * .9 + .1, tw: Math.random() * 6.28 }));
    }
    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        s.tw += 0.02 * s.z; const a = 0.4 + Math.sin(s.tw) * 0.35 + s.z * 0.2;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.z * 1.6 * dpr, 0, 6.28);
        ctx.fillStyle = `rgba(200,225,255,${a})`; ctx.fill();
        s.y += s.z * 0.15 * dpr; if (s.y > h) { s.y = 0; s.x = Math.random() * w; }
      }
      requestAnimationFrame(frame);
    }
    resize(); addEventListener("resize", resize); requestAnimationFrame(frame);
  }

  /* ======================================================================
     LAUNCH SEQUENCE
     ====================================================================== */
  function launchSequence() {
    const screen = $("#launch-screen"), btn = $("#launch-btn"), countdown = $("#countdown");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let firing = false, finished = false;

    // spin up the 3D rocket so it idles on the launch screen
    const rocket3D = !!(window.RocketLaunch && RocketLaunch.init($("#rocket3d")));

    function ignite() {
      if (firing) return; firing = true;
      if (window.VoyagerAudio) { VoyagerAudio.init(); VoyagerAudio.resume(); }
      btn.style.display = "none"; $(".launch-hint").style.display = "none";
      countdown.classList.add("show");
      const seq = ["3", "2", "1", "LIFT OFF"]; let i = 0;
      const step = () => {
        countdown.textContent = seq[i];
        if (window.VoyagerAudio) VoyagerAudio.countdownBeep(seq[i] === "LIFT OFF");
        if (seq[i] === "LIFT OFF") {
          screen.classList.add("launching");                 // screen shake
          if (rocket3D && !reduce) RocketLaunch.launch(finish);
          else setTimeout(finish, reduce ? 150 : 1400);
          return;
        }
        i++;
        setTimeout(step, reduce ? 120 : 720);
      };
      step();
    }
    function finish() {
      if (finished) return; finished = true;
      screen.classList.add("gone");
      $("#hud").classList.add("show");
      $("#telemetry").classList.add("show");
      $("#orbitmap").classList.add("show");
      document.body.style.overflow = "";
      revealObserver();
      if (window.VoyagerAudio) VoyagerAudio.ambientStart();               // space drone
      setTimeout(() => { if (rocket3D) RocketLaunch.dispose(); }, 900);  // free GPU after fade
    }
    btn.addEventListener("click", ignite);
    addEventListener("keydown", (e) => {
      if (!screen.classList.contains("gone") && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); ignite(); }
    });
    document.body.style.overflow = "hidden";
  }

  /* ======================================================================
     SCROLL REVEALS + GAUGES
     ====================================================================== */
  function revealObserver() {
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          $$(".gauge-bar", en.target).forEach((b) => { b.style.width = b.dataset.level + "%"; });
          io.unobserve(en.target);
        }
      }
    }, { threshold: 0.18 });
    $$(".reveal").forEach((el) => io.observe(el));
    $$(".skill-panel").forEach((el) => io.observe(el));
  }

  /* ======================================================================
     HUD SYNC (telemetry + orbit map + nav) from progress
     ====================================================================== */
  const omDots = () => $$(".om-dot");
  function updateHud(progress) {
    const n = SECTIONS.length - 1;                 // 5 gaps
    const fi = progress * n;
    const idx = Math.min(n, Math.floor(fi + 0.0001));
    const f = fi - idx;
    const au = idx < n ? AU[idx] + (AU[idx + 1] - AU[idx]) * f : AU[n];
    const nearest = Math.round(fi);

    const target = document.getElementById(SECTIONS[nearest]);
    $("#tel-target").textContent = ((target && target.dataset.planet) || "SUN").toUpperCase();
    $("#tel-dist").textContent = au.toFixed(2) + " AU · " + Math.round(au * AU_KM).toLocaleString("en-US") + " km";
    $("#tel-bar-fill").style.width = (progress * 100).toFixed(1) + "%";

    $("#orbitmap-probe").style.top = (progress * 100).toFixed(1) + "%";
    omDots().forEach((d, i) => d.classList.toggle("active", i === nearest));
    $$(".hud-links a").forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + SECTIONS[nearest]));

    // black-hole hint near the end of the journey
    const vh = $("#voidhint");
    if (vh) vh.classList.toggle("show", progress > 0.9 && !document.body.classList.contains("diving"));
  }

  /* ======================================================================
     MAIN LOOP — scroll → eased progress → scene + hud
     ====================================================================== */
  function loop() {
    const max = document.documentElement.scrollHeight - innerHeight;
    const target = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    curProgress += (target - curProgress) * 0.08;          // buttery easing
    velocity = velocity * 0.85 + Math.abs(scrollY - lastScrollY) * 0.15;
    lastScrollY = scrollY;

    if (scene3D) VoyagerScene.update(curProgress, velocity);
    updateHud(curProgress);
    requestAnimationFrame(loop);
  }

  /* ======================================================================
     PLANET INTERACTION (reticle + hyperspace jump)
     ====================================================================== */
  function goTo(i) {
    const t = document.getElementById(SECTIONS[i]);
    if (t) t.scrollIntoView({ behavior: "smooth" });
  }
  function flashJump() {
    const f = $("#flash");
    f.classList.remove("go"); void f.offsetWidth;   // restart animation
    f.classList.add("go");
    if (window.VoyagerAudio) VoyagerAudio.whoosh(0.7, 0.2);
  }
  function onHover(pick, x, y) {
    const ret = $("#reticle");
    const key = pick ? pick.kind + ":" + (pick.index != null ? pick.index : pick.key) : null;
    if (key !== lastHoverKey) { if (pick && window.VoyagerAudio) VoyagerAudio.blip(true); lastHoverKey = key; }
    if (!pick) { ret.classList.remove("show"); return; }
    ret.classList.add("show");
    ret.style.transform = `translate(${x}px, ${y}px)`;
    if (pick.kind === "planet") {
      $("#reticle-label").textContent = `${PLANET[pick.index].toUpperCase()} · ${DEST[pick.index]} ▸ CLICK TO TRAVEL`;
    } else if (pick.kind === "blackhole") {
      $("#reticle-label").textContent = "THE VOID ▸ ENTER THE BLACK HOLE";
    } else if (pick.kind === "ufo") {
      $("#reticle-label").textContent = "UNKNOWN CRAFT ▸ DECODE SIGNAL";
    } else {
      const f = FACTS[pick.key];
      $("#reticle-label").textContent = `${(f ? f.name : "GALAXY").toUpperCase()} ▸ CLICK FOR FACTS`;
    }
  }
  // Unified: planets and galaxies use the SAME facts panel. While it's open the
  // overlapping content is hidden; planets auto-dismiss, galaxies fly back on close.
  // panel sits opposite the section's content (align-right content → panel left)
  function planetPanelSide(index) {
    const sec = document.getElementById(SECTIONS[index]);
    return sec && sec.classList.contains("align-right") ? "left" : "right";
  }
  function onSelect(pick) {
    clearTimeout(factTimer);
    if (pick.kind === "blackhole") { startDive(); return; }
    if (pick.kind === "ufo") {
      factMode = "ufo";
      document.body.classList.add("viewing-space");
      if (window.VoyagerAudio) VoyagerAudio.alien();
      openFacts("ufo", false, "right");
      return;
    }
    // Comet & asteroid belt: show a facts panel in place — no camera travel.
    if (pick.kind === "comet" || pick.kind === "belt") {
      factMode = "info";
      document.body.classList.add("facts-open");
      if (window.VoyagerAudio) VoyagerAudio.chime();
      openFacts(pick.key, false, planetPanelSide(Math.round(curProgress * (SECTIONS.length - 1))));
      return;
    }
    if (pick.kind === "planet") {
      factMode = "planet";
      document.body.classList.add("facts-open");         // keep content, hide orbit map
      openFacts(PLANET_KEY[pick.index], true, planetPanelSide(pick.index));
      flashJump(); goTo(pick.index);
      factTimer = setTimeout(closeFacts, 8000);          // auto-dismiss
    } else if (scene3D) {
      factMode = "galaxy";
      document.body.classList.add("viewing-space");      // camera leaves → hide content
      document.body.style.overflow = "hidden";
      flashJump();
      VoyagerScene.flyTo(pick);                          // facts open on arrival
    } else {
      factMode = "galaxy"; openFacts(pick.key, false, "right");
    }
  }
  function onArrive(pick) { if (window.VoyagerAudio) VoyagerAudio.chime(); openFacts(pick.key, false, "right"); }

  /* ---- facts info panel (shared by planets + galaxies) ---- */
  function openFacts(key, isPlanet, side) {
    const f = FACTS[key]; if (!f) return;
    const dot = $("#fact-dot");
    dot.style.background = f.color; dot.style.boxShadow = `0 0 22px ${f.color}`;
    $("#fact-name").textContent = f.name;
    $("#fact-tag").textContent = f.tag;
    $("#fact-list").innerHTML = f.facts.map((x) => `<li>${esc(x)}</li>`).join("");
    $("#fact-hint").textContent = isPlanet ? "Clears shortly · ✕ / ESC to close now"
      : key === "ufo" ? "Close (✕ / ESC) to end transmission"
      : (key === "comet" || key === "belt") ? "Close (✕ / ESC) to resume the voyage"
      : "Close (✕ / ESC) to fly back to the system";
    const panel = $("#factpanel");
    panel.classList.toggle("left", side === "left");
    panel.classList.add("show");
  }
  function closeFacts() {
    if (!factMode) return;
    clearTimeout(factTimer);
    $("#factpanel").classList.remove("show");
    document.body.classList.remove("viewing-space", "facts-open");   // reveal UI
    document.body.style.overflow = "";
    if (factMode === "galaxy" && scene3D) VoyagerScene.returnHome();
    factMode = null;
  }

  /* ---- black-hole dive → finale scene ---- */
  function startDive() {
    closeFacts();
    document.body.classList.add("diving");
    document.body.style.overflow = "hidden";
    flashJump();
    if (window.VoyagerAudio) VoyagerAudio.dive();
    if (scene3D) VoyagerScene.diveTo();
    const warp = $("#warp-dive");
    warp.classList.add("active");
    setTimeout(() => warp.classList.add("flash"), 2100);
    setTimeout(() => {
      $("#endscene").classList.add("show");
      setTimeout(() => warp.classList.remove("active", "flash"), 700);
    }, 2650);
  }
  function endRelaunch() {
    $("#endscene").classList.remove("show");
    document.body.classList.remove("diving");
    document.body.style.overflow = "";
    if (scene3D) VoyagerScene.resetToStart();
    scrollTo({ top: 0, behavior: "auto" });
  }

  /* ---- make a wish (click empty space) ---- */
  function spawnWish() {
    if (factMode || document.body.classList.contains("diving")) return;
    const now = performance.now();
    if (now - wishCooldown < 850) return; wishCooldown = now;
    if (window.VoyagerAudio) VoyagerAudio.wish();
    const s = document.createElement("div"); s.className = "wishstar";
    s.style.left = (8 + Math.random() * 58) + "vw"; s.style.top = (6 + Math.random() * 32) + "vh";
    document.body.appendChild(s); setTimeout(() => s.remove(), 1300);
    const tip = $("#wishtip"); if (tip) { tip.classList.add("show"); clearTimeout(wishTipT); wishTipT = setTimeout(() => tip.classList.remove("show"), 1500); }
  }

  /* ---- auto-tour (hands-free flythrough) ---- */
  function startTour() {
    if (touring) return; touring = true;
    const btn = $("#tour-btn"); if (btn) { btn.textContent = "⏹ STOP"; btn.classList.add("on"); }
    closeFacts();
    const per = 3800;
    SECTIONS.forEach((id, i) => tourTimers.push(setTimeout(() => { goTo(i); if (window.VoyagerAudio) VoyagerAudio.whoosh(0.6, 0.14); }, i * per)));
    tourTimers.push(setTimeout(stopTour, SECTIONS.length * per + 1200));
  }
  function stopTour() {
    if (!touring) return; touring = false;
    const btn = $("#tour-btn"); if (btn) { btn.textContent = "▶ TOUR"; btn.classList.remove("on"); }
    tourTimers.forEach(clearTimeout); tourTimers.length = 0;
  }

  /* ======================================================================
     MISC
     ====================================================================== */
  function misc() {
    const toTop = () => scrollTo({ top: 0, behavior: "smooth" });
    $("#to-top").addEventListener("click", toTop);
    const rl = $("#relaunch"); if (rl) rl.addEventListener("click", toTop);
    // SYSTEM VIEW → cinematic wide shot of every planet (scroll to exit)
    const sv = $("#system-view");
    if (sv) sv.addEventListener("click", () => {
      closeFacts();
      if (window.VoyagerAudio) VoyagerAudio.whoosh(0.9, 0.18);
      if (scene3D) VoyagerScene.systemView();
      else scrollTo({ top: 0, behavior: "smooth" });
    });
    // sound toggle
    const st = $("#sound-toggle");
    if (st) {
      const sync = () => { const on = !window.VoyagerAudio || VoyagerAudio.isEnabled(); st.textContent = on ? "🔊" : "🔇"; st.classList.toggle("muted", !on); };
      sync();
      st.addEventListener("click", () => { if (window.VoyagerAudio) { VoyagerAudio.init(); VoyagerAudio.toggle(); } sync(); });
    }
    // auto-tour toggle
    const tb = $("#tour-btn");
    if (tb) tb.addEventListener("click", () => { touring ? stopTour() : startTour(); });
    // warm up audio on the first interaction so the countdown beeps are in sync
    const warm = () => { if (window.VoyagerAudio) { VoyagerAudio.init(); VoyagerAudio.resume(); } };
    addEventListener("pointerdown", warm, { once: true });
    omDots().forEach((d, i) => d.addEventListener("click", () => { if (scene3D) VoyagerScene.jump(); flashJump(); goTo(i); }));
    addEventListener("resize", () => { if (scene3D) VoyagerScene.resize(); });
    // finale relaunch
    const er = $("#end-relaunch"); if (er) er.addEventListener("click", endRelaunch);
    // facts panel close
    $("#fact-close").addEventListener("click", closeFacts);
    $("#fact-backdrop").addEventListener("click", closeFacts);
    addEventListener("keydown", (e) => { if (e.key === "Escape") closeFacts(); });
    // a real user scroll dismisses an open PLANET panel (so it never lingers
    // over the next section). Programmatic travel-scroll doesn't fire these.
    const dismissPlanet = () => { if (factMode === "planet" || factMode === "info") closeFacts(); if (touring) stopTour(); };
    addEventListener("wheel", dismissPlanet, { passive: true });
    addEventListener("touchmove", dismissPlanet, { passive: true });
    addEventListener("keydown", (e) => {
      if ((factMode === "planet" || factMode === "info") && ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " ", "Spacebar"].includes(e.key)) closeFacts();
    });
  }

  /* ---- boot ---- */
  document.addEventListener("DOMContentLoaded", () => {
    if (typeof CONFIG === "undefined") { console.error("CONFIG missing"); return; }
    render();

    // Try the 3D scene; fall back to a 2D starfield if WebGL/Three is missing.
    scene3D = !!(window.VoyagerScene && VoyagerScene.init($("#scene"), { onHover, onSelect, onArrive, onEmpty: spawnWish }));
    if (!scene3D) { console.warn("WebGL unavailable — using 2D fallback"); starfield2D(); }

    launchSequence();
    misc();
    requestAnimationFrame(loop);
    setTimeout(() => { const l = $("#loader"); if (l) l.classList.add("done"); }, 1500);
  });
})();
