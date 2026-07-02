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

  let scene3D = false;
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

    $("#projects-grid").innerHTML = c.projects.map((p, i) => `
      <div class="project-card">
        <span class="project-tag-sat">SAT-${String(i + 1).padStart(2, "0")}</span>
        <h3>${esc(p.name)}</h3><p>${esc(p.blurb)}</p>
        <div class="chips">${(p.tags || []).map((t) => `<span class="chip">${esc(t)}</span>`).join("")}</div>
        ${p.link ? `<a class="project-link" href="${esc(p.link)}" target="_blank" rel="noopener">OPEN DOCK ↗</a>` : ""}
      </div>`).join("");

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
    $("#contact-links").innerHTML = links.map((l) => `
      <a href="${esc(l.url)}" target="_blank" rel="noopener"><span>${l.icon || "→"}</span> ${esc(l.label)}</a>`).join("");
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
      btn.style.display = "none"; $(".launch-hint").style.display = "none";
      countdown.classList.add("show");
      const seq = ["3", "2", "1", "LIFT OFF"]; let i = 0;
      const step = () => {
        countdown.textContent = seq[i];
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
  }
  function onHover(i, x, y) {
    const ret = $("#reticle");
    if (i < 0) { ret.classList.remove("show"); return; }
    ret.classList.add("show");
    ret.style.transform = `translate(${x}px, ${y}px)`;
    $("#reticle-label").textContent = `${PLANET[i].toUpperCase()} · ${DEST[i]} ▸ CLICK TO TRAVEL`;
  }
  function onSelect(i) { flashJump(); goTo(i); }

  /* ======================================================================
     MISC
     ====================================================================== */
  function misc() {
    const toTop = () => scrollTo({ top: 0, behavior: "smooth" });
    $("#to-top").addEventListener("click", toTop);
    const sv = $("#system-view"); if (sv) sv.addEventListener("click", toTop);
    const rl = $("#relaunch"); if (rl) rl.addEventListener("click", toTop);
    omDots().forEach((d, i) => d.addEventListener("click", () => { if (scene3D) VoyagerScene.jump(); flashJump(); goTo(i); }));
    addEventListener("resize", () => { if (scene3D) VoyagerScene.resize(); });
  }

  /* ---- boot ---- */
  document.addEventListener("DOMContentLoaded", () => {
    if (typeof CONFIG === "undefined") { console.error("CONFIG missing"); return; }
    render();

    // Try the 3D scene; fall back to a 2D starfield if WebGL/Three is missing.
    scene3D = !!(window.VoyagerScene && VoyagerScene.init($("#scene"), { onHover, onSelect }));
    if (!scene3D) { console.warn("WebGL unavailable — using 2D fallback"); starfield2D(); }

    launchSequence();
    misc();
    requestAnimationFrame(loop);
  });
})();
