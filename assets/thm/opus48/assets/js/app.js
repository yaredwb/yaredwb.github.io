/* =========================================================================
   THM in Porous Media — UI: nav, reveal, coupling triangle, KaTeX
   ========================================================================= */
(function () {
  "use strict";

  /* ---------- scroll progress + nav state ---------- */
  const progress = document.getElementById("scrollProgress");
  const nav = document.getElementById("nav");
  function onScroll() {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
    if (progress) progress.style.width = pct + "%";
    if (nav) nav.classList.toggle("scrolled", h.scrollTop > 24);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- mobile nav ---------- */
  const toggle = document.getElementById("navToggle");
  const links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => links.classList.toggle("open"));
    links.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => links.classList.remove("open")));
  }

  /* ---------- reveal on scroll ---------- */
  const revObserver = new IntersectionObserver(
    (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); revObserver.unobserve(e.target); } }),
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );
  document.querySelectorAll(".reveal").forEach((el) => revObserver.observe(el));

  /* ---------- coupling triangle ---------- */
  const NODES = {
    T: { x: 260, y: 70, color: "#ff6b3d" },
    H: { x: 110, y: 360, color: "#3b9dff" },
    M: { x: 410, y: 360, color: "#35d49b" },
  };
  const R = 52;
  const COUPLINGS = {
    TH: {
      from: "T", to: "H", color: NODES.T.color, label: "T → H",
      title: "Thermal pressurization",
      desc: "Heat a saturated pore space and the fluid expands far more than the solid skeleton. With nowhere to escape, the trapped fluid's pressure rises. Warming also thins the fluid (lower viscosity μ), easing later flow.",
      term: "-\\,3\\alpha_m\\,\\dfrac{\\partial T}{\\partial t}",
      where: "fluid mass balance",
    },
    HT: {
      from: "H", to: "T", color: NODES.H.color, label: "H → T",
      title: "Advective heat transport",
      desc: "Flowing pore fluid bodily carries thermal energy, on top of conduction. This is how cold recharge cools a geothermal reservoir and how groundwater redistributes heat underground.",
      term: "(\\rho c)_f\\,\\mathbf{q}\\!\\cdot\\!\\nabla T",
      where: "energy balance",
    },
    TM: {
      from: "T", to: "M", color: NODES.T.color, label: "T → M",
      title: "Thermal expansion & stress",
      desc: "The skeleton expands when heated. Free to move, it strains; confined, the thwarted expansion appears as thermal stress — a key driver near boreholes and waste canisters.",
      term: "-\\,3K\\beta_s\\,\\Delta T\\,\\mathbf{I}",
      where: "constitutive law",
    },
    MT: {
      from: "M", to: "T", color: NODES.M.color, label: "M → T",
      title: "Thermo-elastic heating",
      desc: "Straining the skeleton does work that surfaces as a small temperature change and dissipation. Usually the weakest of the six couplings, and frequently neglected.",
      term: "-\\,T_0\\,\\beta\\,\\dfrac{\\partial \\varepsilon_v}{\\partial t}",
      where: "energy balance (often negligible)",
    },
    HM: {
      from: "H", to: "M", color: NODES.H.color, label: "H → M",
      title: "Effective stress",
      desc: "Pore pressure carries part of the total load, so the grain contacts feel only the effective stress σ′ = σ − αp. Raising pressure unloads the grains — the mechanism behind liquefaction and induced seismicity.",
      term: "-\\,\\alpha\\,p\\,\\mathbf{I}",
      where: "momentum balance",
    },
    MH: {
      from: "M", to: "H", color: NODES.M.color, label: "M → H",
      title: "Poroelastic storage",
      desc: "Compressing the skeleton shrinks the pores, squeezing fluid out and pushing pressure up; dilation draws fluid in. The volumetric strain rate acts as a source for pressure.",
      term: "\\alpha\\,\\dfrac{\\partial \\varepsilon_v}{\\partial t}",
      where: "fluid mass balance",
    },
  };

  const svgNS = "http://www.w3.org/2000/svg";
  const edgesGroup = document.getElementById("edgesGroup");

  function norm(x, y) { const m = Math.hypot(x, y) || 1; return [x / m, y / m]; }

  function buildEdge(id, c, side) {
    const A = NODES[c.from], B = NODES[c.to];
    let [dx, dy] = norm(B.x - A.x, B.y - A.y);
    const [px, py] = [-dy, dx]; // perpendicular
    const off = 15 * side, bow = 30 * side;
    const sx = A.x + dx * (R + 1) + px * off;
    const sy = A.y + dy * (R + 1) + py * off;
    const ex = B.x - dx * (R + 13) + px * off;
    const ey = B.y - dy * (R + 13) + py * off;
    const cx = (A.x + B.x) / 2 + px * bow;
    const cy = (A.y + B.y) / 2 + py * bow;
    const d = `M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`;

    const hit = document.createElementNS(svgNS, "path");
    hit.setAttribute("d", d); hit.setAttribute("class", "edge-hit"); hit.dataset.coupling = id;

    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", d); path.setAttribute("class", "edge"); path.setAttribute("stroke", c.color);
    path.dataset.coupling = id;

    // arrowhead at end, oriented along tangent (end - ctrl)
    let [tx, ty] = norm(ex - cx, ey - cy);
    const [ax, ay] = [-ty, tx];
    const len = 11, wid = 6;
    const p1 = `${ex},${ey}`;
    const p2 = `${ex - tx * len + ax * wid},${ey - ty * len + ay * wid}`;
    const p3 = `${ex - tx * len - ax * wid},${ey - ty * len - ay * wid}`;
    const head = document.createElementNS(svgNS, "polygon");
    head.setAttribute("points", `${p1} ${p2} ${p3}`);
    head.setAttribute("fill", c.color); head.setAttribute("class", "edge-head"); head.dataset.coupling = id;

    edgesGroup.appendChild(path);
    edgesGroup.appendChild(head);
    edgesGroup.appendChild(hit);
    return [path, head];
  }

  const edgeEls = {};
  // pair the two directions on opposite sides
  edgeEls.TH = buildEdge("TH", COUPLINGS.TH, +1);
  edgeEls.HT = buildEdge("HT", COUPLINGS.HT, +1);
  edgeEls.TM = buildEdge("TM", COUPLINGS.TM, +1);
  edgeEls.MT = buildEdge("MT", COUPLINGS.MT, +1);
  edgeEls.HM = buildEdge("HM", COUPLINGS.HM, +1);
  edgeEls.MH = buildEdge("MH", COUPLINGS.MH, +1);

  const ciContent = document.getElementById("ciContent");
  const chipsWrap = document.getElementById("couplingChips");
  const DEFAULT_CONTENT = ciContent.innerHTML;

  // build persistent chips
  Object.entries(COUPLINGS).forEach(([id, c]) => {
    const b = document.createElement("button");
    b.className = "cchip"; b.dataset.coupling = id; b.textContent = c.label;
    b.style.borderColor = c.color + "66";
    chipsWrap.appendChild(b);
    b.addEventListener("mouseenter", () => highlight(id));
    b.addEventListener("click", () => selectCoupling(id));
  });
  chipsWrap.addEventListener("mouseleave", () => { if (!locked) clearInfo(); });

  function setActive(id) {
    document.querySelectorAll("#thmTriangle .edge, #thmTriangle .edge-head").forEach((el) => {
      el.classList.toggle("active", el.dataset.coupling === id);
      el.classList.toggle("dim", !!id && el.dataset.coupling !== id);
    });
    document.querySelectorAll(".cchip").forEach((el) => el.classList.toggle("active", el.dataset.coupling === id));
  }

  function highlight(id) {
    setActive(id);
    const c = COUPLINGS[id];
    ciContent.innerHTML =
      `<div class="ci-route" style="color:${c.color}">${c.label}</div>` +
      `<h3>${c.title}</h3>` +
      `<p>${c.desc}</p>` +
      `<div class="ci-term eq" id="ciTerm"></div>` +
      `<p class="muted" style="margin-top:.3rem">appears in the <strong>${c.where}</strong></p>`;
    const termEl = document.getElementById("ciTerm");
    if (window.katex) {
      try { window.katex.render(c.term, termEl, { displayMode: true, throwOnError: false }); }
      catch (e) { termEl.textContent = c.term; }
    } else { termEl.textContent = c.term; }
  }

  let locked = null;
  function selectCoupling(id) { locked = (locked === id) ? null : id; if (locked) highlight(id); else clearInfo(); }
  function clearInfo() {
    if (locked) return;
    setActive(null);
    ciContent.innerHTML = DEFAULT_CONTENT;
  }

  // hover handlers on edges
  document.querySelectorAll("#thmTriangle .edge-hit").forEach((el) => {
    el.addEventListener("mouseenter", () => highlight(el.dataset.coupling));
    el.addEventListener("click", () => selectCoupling(el.dataset.coupling));
  });
  const svg = document.getElementById("thmTriangle");
  svg.addEventListener("mouseleave", () => { if (!locked) clearInfo(); });
  // clicking a node clears the lock
  svg.querySelectorAll(".node").forEach((n) => n.addEventListener("click", () => { locked = null; clearInfo(); }));

  /* ---------- KaTeX render + start sims ---------- */
  function renderMath() {
    if (window.renderMathInElement) {
      try {
        window.renderMathInElement(document.body, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false },
          ],
          throwOnError: false,
          macros: { "\\mathsf": "\\mathrm" },
        });
      } catch (e) { console.warn("katex", e); }
    }
  }

  function boot() {
    renderMath();
    if (window.THMSims) window.THMSims.initAll();
  }

  if (document.readyState === "complete") boot();
  else window.addEventListener("load", boot);
})();
