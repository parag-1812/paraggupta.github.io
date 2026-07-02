/* =========================================================================
   MISSION CONTROL — engine
   Renders content from CONFIG, runs the starfield, launch sequence,
   scroll reveals, altitude rail, and nav highlighting.
   ========================================================================= */
(function () {
  "use strict";

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ======================================================================
     1. STARFIELD  (animated canvas: stars + occasional shooting star)
     ====================================================================== */
  function starfield() {
    const canvas = $("#starfield");
    const ctx = canvas.getContext("2d");
    let stars = [], shooters = [], w, h, dpr;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.width = innerWidth * dpr;
      h = canvas.height = innerHeight * dpr;
      canvas.style.width = innerWidth + "px";
      canvas.style.height = innerHeight + "px";
      const count = Math.min(260, Math.floor((innerWidth * innerHeight) / 6000));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: Math.random() * 0.9 + 0.1,     // depth → size & twinkle speed
        tw: Math.random() * Math.PI * 2,
      }));
    }

    function spawnShooter() {
      const startX = Math.random() * w;
      shooters.push({ x: startX, y: -20, len: 0, life: 0, vx: 6 * dpr, vy: 9 * dpr });
    }

    let last = 0;
    function frame(t) {
      const dt = t - last; last = t;
      ctx.clearRect(0, 0, w, h);

      // stars
      for (const s of stars) {
        s.tw += 0.02 * s.z;
        const a = 0.4 + Math.sin(s.tw) * 0.35 + s.z * 0.2;
        const r = s.z * 1.6 * dpr;
        ctx.beginPath();
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,225,255,${a})`;
        ctx.fill();
        // subtle parallax drift downward
        s.y += s.z * 0.06 * dpr;
        if (s.y > h) { s.y = 0; s.x = Math.random() * w; }
      }

      // shooting stars
      if (Math.random() < 0.004) spawnShooter();
      shooters = shooters.filter((sh) => sh.life < 120);
      for (const sh of shooters) {
        sh.x += sh.vx; sh.y += sh.vy; sh.life += 1;
        const tailX = sh.x - sh.vx * 6, tailY = sh.y - sh.vy * 6;
        const grad = ctx.createLinearGradient(sh.x, sh.y, tailX, tailY);
        grad.addColorStop(0, "rgba(120,230,255,0.9)");
        grad.addColorStop(1, "rgba(120,230,255,0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2 * dpr;
        ctx.beginPath();
        ctx.moveTo(sh.x, sh.y); ctx.lineTo(tailX, tailY); ctx.stroke();
      }

      requestAnimationFrame(frame);
    }

    resize();
    addEventListener("resize", resize);
    requestAnimationFrame(frame);
  }

  /* ======================================================================
     2. RENDER CONTENT FROM CONFIG
     ====================================================================== */
  function render() {
    const c = CONFIG;

    // Launch screen + hero identity
    $("#launch-name").textContent  = c.callsign;
    $("#launch-title").textContent = c.title;
    $("#hero-name").textContent    = c.callsign;
    $("#hero-title").textContent   = c.title;
    $("#hero-tagline").textContent = c.tagline;
    $("#hero-status").textContent  = "● " + (c.status || "Online");
    $("#hero-location").textContent = c.location ? "◎ " + c.location : "";
    $("#hud-callsign").textContent = c.callsign.split(" ")[0];
    $("#footer-name").textContent  = c.callsign;
    document.title = c.callsign + " · Mission Control";

    // About
    $("#about-heading").textContent = c.about.heading;
    $("#about-copy").innerHTML = c.about.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("");
    $("#about-stats").innerHTML = c.about.stats.map((s) => `
      <div class="dial">
        <div class="dial-value">${esc(s.value)}</div>
        <div class="dial-label">${esc(s.label)}</div>
      </div>`).join("");

    // Skills
    $("#skills-grid").innerHTML = c.skills.map((grp) => `
      <div class="skill-panel">
        <h3>${esc(grp.system)}</h3>
        <div class="sys-sub">${esc(grp.subtitle || "")}</div>
        ${grp.items.map((it) => `
          <div class="gauge">
            <div class="gauge-top"><span>${esc(it.name)}</span><span class="pct">${it.level}%</span></div>
            <div class="gauge-track"><div class="gauge-bar" data-level="${it.level}"></div></div>
          </div>`).join("")}
      </div>`).join("");

    // Projects
    $("#projects-grid").innerHTML = c.projects.map((p, i) => `
      <div class="project-card">
        <span class="project-tag-sat">SAT-${String(i + 1).padStart(2, "0")}</span>
        <h3>${esc(p.name)}</h3>
        <p>${esc(p.blurb)}</p>
        <div class="chips">${(p.tags || []).map((t) => `<span class="chip">${esc(t)}</span>`).join("")}</div>
        ${p.link ? `<a class="project-link" href="${esc(p.link)}" target="_blank" rel="noopener">OPEN DOCK ↗</a>` : ""}
      </div>`).join("");

    // Experience
    $("#timeline").innerHTML = c.experience.map((e) => `
      <div class="tl-item">
        <h3>${esc(e.role)} <span style="color:var(--ink-dim);font-size:.8em">· ${esc(e.period)}</span></h3>
        <div class="tl-org">${esc(e.org)}</div>
        <ul>${e.points.map((pt) => `<li>${esc(pt)}</li>`).join("")}</ul>
      </div>`).join("");

    // Contact
    const emailEl = $("#contact-email");
    emailEl.textContent = c.email;
    emailEl.href = "mailto:" + c.email;
    const links = (c.links || []).slice();
    if (c.phone) links.push({ label: "Call", url: "tel:" + c.phone, icon: "\u{1F4DE}" });
    $("#contact-links").innerHTML = links.map((l) => `
      <a href="${esc(l.url)}" target="_blank" rel="noopener">
        <span>${l.icon || "→"}</span> ${esc(l.label)}
      </a>`).join("");

    $("#year").textContent = new Date().getFullYear();
  }

  /* ======================================================================
     3. LAUNCH SEQUENCE
     ====================================================================== */
  function launchSequence() {
    const screen = $("#launch-screen");
    const btn = $("#launch-btn");
    const countdown = $("#countdown");
    const rocket = $("#rocket-liftoff");
    let firing = false;

    function ignite() {
      if (firing) return;
      firing = true;
      btn.style.display = "none";
      $(".launch-hint").style.display = "none";
      countdown.classList.add("show");

      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const seq = ["3", "2", "1", "LIFTOFF"];
      let i = 0;
      const step = () => {
        countdown.textContent = seq[i];
        if (seq[i] === "LIFTOFF") { rocket.classList.add("fire"); }
        i++;
        if (i < seq.length) setTimeout(step, reduce ? 120 : 750);
        else setTimeout(finish, reduce ? 120 : 1100);
      };
      step();
    }

    function finish() {
      screen.classList.add("gone");
      $("#hud").classList.add("show");
      document.body.style.overflow = "";
      // reveal hero + start gauges when visible
      revealObserver();
    }

    btn.addEventListener("click", ignite);
    // Allow Enter/Space to launch too
    addEventListener("keydown", (e) => {
      if (!screen.classList.contains("gone") && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault(); ignite();
      }
    });

    // Lock scroll until launch
    document.body.style.overflow = "hidden";
  }

  /* ======================================================================
     4. SCROLL REVEALS + GAUGE FILL
     ====================================================================== */
  function revealObserver() {
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          // fill any gauges inside
          $$(".gauge-bar", en.target).forEach((b) => {
            b.style.width = b.dataset.level + "%";
          });
          io.unobserve(en.target);
        }
      }
    }, { threshold: 0.18 });

    $$(".reveal").forEach((el) => io.observe(el));
    // gauges live inside skill panels which are inside .reveal heads? ensure panels animate:
    $$(".skill-panel").forEach((el) => io.observe(el));
  }

  /* ======================================================================
     5. ALTITUDE RAIL + ACTIVE NAV
     ====================================================================== */
  function scrollHud() {
    const fill = $("#altitude-fill");
    const label = $("#altitude-label");
    const bands = [
      { p: 0.00, name: "GROUND" },
      { p: 0.18, name: "TROPOSPHERE" },
      { p: 0.40, name: "STRATOSPHERE" },
      { p: 0.62, name: "MESOSPHERE" },
      { p: 0.82, name: "ORBIT" },
    ];
    const sections = $$("main .stage, main .hero");
    const navLinks = $$(".hud-links a");

    function onScroll() {
      const max = document.documentElement.scrollHeight - innerHeight;
      const p = max > 0 ? scrollY / max : 0;
      fill.style.height = (p * 100).toFixed(1) + "%";
      let band = bands[0].name;
      for (const b of bands) if (p >= b.p) band = b.name;
      label.textContent = band;

      // active nav link
      let current = "";
      const mid = scrollY + innerHeight * 0.4;
      sections.forEach((s) => { if (s.offsetTop <= mid) current = s.id; });
      navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + current));
    }
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ======================================================================
     6. MISC — back to top
     ====================================================================== */
  function misc() {
    $("#to-top").addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));
  }

  /* ---- boot ---- */
  document.addEventListener("DOMContentLoaded", () => {
    if (typeof CONFIG === "undefined") {
      console.error("CONFIG missing — check js/config.js is loaded before js/main.js");
      return;
    }
    starfield();
    render();
    launchSequence();
    scrollHud();
    misc();
  });
})();
