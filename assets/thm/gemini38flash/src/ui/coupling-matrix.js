/**
 * Interactive THM Triangle & Coupling Matrix Explorer
 * Renders the 3 physics vertices and 6 directional coupling pathways
 * with live animations, mathematical formulations, and engineering explanations.
 */

export const COUPLING_DETAILS = {
  'T_H': {
    id: 'T_H',
    name: 'Thermal → Hydraulic',
    direction: 'T → H',
    title: 'Thermal Pressurization & Viscosity Reduction',
    mathTerm: '+\\beta_m \\frac{\\partial T}{\\partial t} \\quad \\text{and} \\quad \\mu_f(T)',
    formulaFull: 'S_s \\frac{\\partial p}{\\partial t} = \\nabla \\cdot \\left(\\frac{k}{\\mu_f(T)} \\nabla p\\right) + \\beta_m \\frac{\\partial T}{\\partial t}',
    microMechanism: 'Water molecules gain kinetic energy and expand at ~10× the volumetric rate of solid mineral grains (\\beta_f \\approx 3\\times 10^{-4}\\,\\text{K}^{-1} vs \\beta_s \\approx 3\\times 10^{-5}\\,\\text{K}^{-1}). When fluid is trapped in tight pore throats, this volumetric mismatch drives immense excess pore pressure.',
    continuumEffect: 'Thermal pressurization coefficient \\Lambda = \\beta_m / S_s. In low-permeability clays and fault gouge, a 50°C heating pulse can generate 10–30 MPa of fluid overpressure, drastically lowering effective stress.',
    engineeringImpact: 'Deep nuclear waste repositories (canister heating induces overpressure in claystone host rocks); rapid frictional heating during earthquake fault slip causing catastrophic fault lubrication.',
    badgeClass: 'badge-th'
  },
  'H_T': {
    id: 'H_T',
    name: 'Hydraulic → Thermal',
    direction: 'H → T',
    title: 'Convective / Advective Heat Transport',
    mathTerm: '-\\rho_f c_f (\\mathbf{q}_d \\cdot \\nabla T)',
    formulaFull: '(\\rho C_p)_m \\frac{\\partial T}{\\partial t} = \\nabla \\cdot (\\kappa_m \\nabla T) - \\rho_f c_f \\mathbf{q}_d \\cdot \\nabla T',
    microMechanism: 'Fluid particles flowing through interconnected pore channels carry enthalpy across the pore geometry, transferring heat to or from mineral surfaces by micro-convection.',
    continuumEffect: 'The relative dominance of advection over conduction is governed by the Thermal Péclet Number: Pe = \\rho_f c_f v L / \\kappa_m. High Darcy velocity skews isotherms in the direction of seepage.',
    engineeringImpact: 'Enhanced Geothermal Systems (cold water circulating through hot fractures extracting energy); geothermal heat pumps; contaminant transport in thermal aquifers.',
    badgeClass: 'badge-ht'
  },
  'T_M': {
    id: 'T_M',
    name: 'Thermal → Mechanical',
    direction: 'T → M',
    title: 'Thermoelastic Stress & Thermal Fracturing',
    mathTerm: '- 3K \\alpha_T (T - T_0) \\mathbf{I}',
    formulaFull: '\\boldsymbol{\\sigma} = \\mathbf{C} : \\boldsymbol{\\epsilon} - 3K \\alpha_T (T - T_0)\\mathbf{I} - \\alpha p \\mathbf{I}',
    microMechanism: 'Mineral crystal lattices (quartz, feldspar, calcite) expand upon heating and contract upon cooling. Anisotropic mineral expansion produces severe intergranular micro-stresses.',
    continuumEffect: 'Constrained thermal expansion generates compressive thermal stress \\Delta \\sigma_{th} = \\frac{E \\alpha_T \\Delta T}{1-\\nu}. Cold injection produces thermal tension, opening fracture apertures.',
    engineeringImpact: 'Cryogenic rock fracturing; thermal spalling around high-level nuclear waste canisters; thermal shock micro-cracking in geothermal reservoirs.',
    badgeClass: 'badge-tm'
  },
  'M_T': {
    id: 'M_T',
    name: 'Mechanical → Thermal',
    direction: 'M → T',
    title: 'Piezocaloric Effect & Plastic Dissipation',
    mathTerm: '- T_0 \\beta_s K \\frac{\\partial \\epsilon_v}{\\partial t} + \\dot{W}_p',
    formulaFull: '(\\rho C_p)_m \\frac{\\partial T}{\\partial t} = \\nabla \\cdot (\\kappa_m \\nabla T) - T_0 \\beta_s K \\frac{\\partial \\epsilon_v}{\\partial t} + \\tau : \\dot{\\boldsymbol{\\epsilon}}^p',
    microMechanism: 'Deforming crystalline grains undergo isentropic lattice strain (piezocaloric effect). Inelastic inter-grain slip and crushing convert mechanical shear work directly into frictional heat.',
    continuumEffect: 'Rapid compression produces minor reversible thermoelastic heating. Plastic deformation and frictional slip on active shear bands dissipate energy into heat: Q = \\tau \\cdot v_{slip}.',
    engineeringImpact: 'Earthquake fault slip zone flash heating (temperatures exceeding 800°C causing pseudotachylyte melt); energetic rockbursts in ultra-deep mining.',
    badgeClass: 'badge-mt'
  },
  'H_M': {
    id: 'H_M',
    name: 'Hydraulic → Mechanical',
    direction: 'H → M',
    title: "Terzaghi Effective Stress & Hydraulic Fracturing",
    mathTerm: '\\boldsymbol{\\sigma}\' = \\boldsymbol{\\sigma} - \\alpha p \\mathbf{I}',
    formulaFull: '\\nabla \\cdot (\\boldsymbol{\\sigma}\' + \\alpha p \\mathbf{I}) + \\rho \\mathbf{g} = 0',
    microMechanism: 'Fluid pressure in pores pushes outward against mineral grain contacts, reducing the intergranular clamping force (normal contact force) between grains.',
    continuumEffect: 'Pore pressure directly offsets total confining stress (Terzaghi / Biot principle). As p increases, the Mohr circle shifts left toward the shear failure envelope, triggering fault slip or tensile hydraulic breakdown.',
    engineeringImpact: 'Hydraulic fracturing for shale gas / geothermal stimulation; pore-pressure induced earthquakes from wastewater injection; dam stability and liquefaction.',
    badgeClass: 'badge-hm'
  },
  'M_H': {
    id: 'M_H',
    name: 'Mechanical → Hydraulic',
    direction: 'M → H',
    title: 'Poroelastic Pressurization & Permeability Evolution',
    mathTerm: '-\\alpha \\frac{\\partial \\epsilon_v}{\\partial t} \\quad \\text{and} \\quad k(\\phi, \\sigma\')',
    formulaFull: 'S_s \\frac{\\partial p}{\\partial t} + \\alpha \\frac{\\partial \\epsilon_v}{\\partial t} = \\nabla \\cdot \\left(\\frac{k(\\boldsymbol{\\sigma}\')}{\\mu} \\nabla p\\right)',
    microMechanism: 'Mechanical compaction squeezes pore throats and narrows fracture apertures (cubic law: Q \\propto w^3). Shear dilation rearranges grains, creating new pore connectivity.',
    continuumEffect: 'Volumetric strain rate acts as an internal fluid source/sink (undrained Skempton effect: \\Delta p = B \\Delta \\sigma_m). Permeability varies exponentially with effective stress: k = k_0 e^{-\\gamma \\sigma\'}.',
    engineeringImpact: 'Aquifer compaction and massive land subsidence (e.g. San Joaquin Valley, Mexico City); reservoir compaction and casing shear in offshore oilfields.',
    badgeClass: 'badge-mh'
  }
};

export class CouplingMatrixUI {
  constructor(containerElement, detailContainerElement, onSelectCallback) {
    this.container = containerElement;
    this.detailContainer = detailContainerElement;
    this.onSelect = onSelectCallback;
    this.activeKey = 'T_H';
    this.animationFrame = null;
    this.render();
  }

  selectCoupling(key) {
    if (!COUPLING_DETAILS[key]) return;
    this.activeKey = key;
    this.updateActiveStyles();
    this.renderDetails();
    if (this.onSelect) this.onSelect(key);
  }

  renderDetails() {
    const data = COUPLING_DETAILS[this.activeKey];
    if (!data || !this.detailContainer) return;

    this.detailContainer.innerHTML = `
      <div class="coupling-card glass-panel animate-fade-in">
        <div class="coupling-card-header">
          <span class="coupling-badge ${data.badgeClass}">${data.direction}</span>
          <h3 class="coupling-title">${data.title}</h3>
        </div>

        <div class="math-callout">
          <div class="math-term-box">
            <span class="math-label">Coupled Term in Governing Equations:</span>
            <div class="katex-render" data-math="${data.mathTerm}"></div>
          </div>
          <div class="math-full-box">
            <span class="math-label">Coupled Balance Equation:</span>
            <div class="katex-render" data-math="${data.formulaFull}"></div>
          </div>
        </div>

        <div class="coupling-grid-two">
          <div class="coupling-subpanel">
            <h4><span class="icon">🔬</span> Microscopic / Pore-Scale Mechanism</h4>
            <p>${data.microMechanism}</p>
          </div>
          <div class="coupling-subpanel">
            <h4><span class="icon">🌐</span> Continuum / REV Formulation</h4>
            <p>${data.continuumEffect}</p>
          </div>
        </div>

        <div class="coupling-engineering-callout">
          <h4><span class="icon">⚡</span> Engineering & Geological Application</h4>
          <p>${data.engineeringImpact}</p>
        </div>
      </div>
    `;

    // Trigger KaTeX render if available on window
    if (window.renderMathInElement) {
      window.renderMathInElement(this.detailContainer, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true }
        ],
        throwOnError: false
      });
    } else {
      // Direct span population
      this.detailContainer.querySelectorAll('.katex-render').forEach(el => {
        const formula = el.getAttribute('data-math');
        if (window.katex) {
          window.katex.render(formula, el, { throwOnError: false });
        }
      });
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="thm-triangle-wrapper">
        <svg class="thm-triangle-svg" viewBox="0 0 500 450" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="gradT" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ff7849" />
              <stop offset="100%" stop-color="#ea580c" />
            </linearGradient>
            <linearGradient id="gradH" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#38bdf8" />
              <stop offset="100%" stop-color="#0284c7" />
            </linearGradient>
            <linearGradient id="gradM" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#c084fc" />
              <stop offset="100%" stop-color="#7e22ce" />
            </linearGradient>

            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <!-- Arrow markers -->
            <marker id="arrow-th" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#f97316" />
            </marker>
            <marker id="arrow-ht" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#38bdf8" />
            </marker>
            <marker id="arrow-tm" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#fb923c" />
            </marker>
            <marker id="arrow-mt" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#c084fc" />
            </marker>
            <marker id="arrow-hm" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#0284c7" />
            </marker>
            <marker id="arrow-mh" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#a855f7" />
            </marker>
          </defs>

          <!-- Center porous media icon / mesh background -->
          <circle cx="250" cy="245" r="55" fill="#0f172a" stroke="#334155" stroke-width="1.5" stroke-dasharray="4,4" />
          <text x="250" y="242" text-anchor="middle" fill="#94a3b8" font-size="12" font-family="Inter" font-weight="600">POROUS</text>
          <text x="250" y="258" text-anchor="middle" fill="#64748b" font-size="10" font-family="JetBrains Mono">MEDIA (REV)</text>

          <!-- Coupling Paths (dual curved arrows between nodes) -->
          <!-- T (250, 70) to H (90, 360) -->
          <!-- T -> H -->
          <path id="path_T_H" class="coupling-path" d="M 230,95 Q 120,200 95,330" fill="none" stroke="#f97316" stroke-width="3" marker-end="url(#arrow-th)" />
          <!-- H -> T -->
          <path id="path_H_T" class="coupling-path" d="M 115,330 Q 155,210 235,110" fill="none" stroke="#38bdf8" stroke-width="3" marker-end="url(#arrow-ht)" />

          <!-- T (250, 70) to M (410, 360) -->
          <!-- T -> M -->
          <path id="path_T_M" class="coupling-path" d="M 270,95 Q 380,200 405,330" fill="none" stroke="#fb923c" stroke-width="3" marker-end="url(#arrow-tm)" />
          <!-- M -> T -->
          <path id="path_M_T" class="coupling-path" d="M 385,330 Q 345,210 265,110" fill="none" stroke="#c084fc" stroke-width="3" marker-end="url(#arrow-mt)" />

          <!-- H (90, 360) to M (410, 360) -->
          <!-- H -> M -->
          <path id="path_H_M" class="coupling-path" d="M 130,375 Q 250,420 370,375" fill="none" stroke="#0284c7" stroke-width="3" marker-end="url(#arrow-hm)" />
          <!-- M -> H -->
          <path id="path_M_H" class="coupling-path" d="M 370,350 Q 250,310 130,350" fill="none" stroke="#a855f7" stroke-width="3" marker-end="url(#arrow-mh)" />

          <!-- Clickable Labels on Arrows -->
          <g class="coupling-label-btn" data-key="T_H" transform="translate(130, 205)">
            <rect x="-35" y="-14" width="70" height="28" rx="14" class="label-bg" />
            <text x="0" y="4" text-anchor="middle" class="label-txt">T → H</text>
          </g>

          <g class="coupling-label-btn" data-key="H_T" transform="translate(195, 230)">
            <rect x="-35" y="-14" width="70" height="28" rx="14" class="label-bg" />
            <text x="0" y="4" text-anchor="middle" class="label-txt">H → T</text>
          </g>

          <g class="coupling-label-btn" data-key="T_M" transform="translate(370, 205)">
            <rect x="-35" y="-14" width="70" height="28" rx="14" class="label-bg" />
            <text x="0" y="4" text-anchor="middle" class="label-txt">T → M</text>
          </g>

          <g class="coupling-label-btn" data-key="M_T" transform="translate(305, 230)">
            <rect x="-35" y="-14" width="70" height="28" rx="14" class="label-bg" />
            <text x="0" y="4" text-anchor="middle" class="label-txt">M → T</text>
          </g>

          <g class="coupling-label-btn" data-key="H_M" transform="translate(250, 420)">
            <rect x="-35" y="-14" width="70" height="28" rx="14" class="label-bg" />
            <text x="0" y="4" text-anchor="middle" class="label-txt">H → M</text>
          </g>

          <g class="coupling-label-btn" data-key="M_H" transform="translate(250, 310)">
            <rect x="-35" y="-14" width="70" height="28" rx="14" class="label-bg" />
            <text x="0" y="4" text-anchor="middle" class="label-txt">M → H</text>
          </g>

          <!-- Node 1: THERMAL (T) -->
          <g class="thm-node" id="node-T" transform="translate(250, 60)">
            <circle r="44" fill="url(#gradT)" filter="url(#glow)" />
            <circle r="40" fill="#0f172a" stroke="#ff7849" stroke-width="2.5" />
            <text x="0" y="-8" text-anchor="middle" fill="#ffedd5" font-size="11" font-family="Inter" font-weight="700">THERMAL</text>
            <text x="0" y="14" text-anchor="middle" fill="#ff7849" font-size="22" font-family="Outfit" font-weight="800">T</text>
            <text x="0" y="28" text-anchor="middle" fill="#94a3b8" font-size="8" font-family="JetBrains Mono">HEAT / TEMP</text>
          </g>

          <!-- Node 2: HYDRAULIC (H) -->
          <g class="thm-node" id="node-H" transform="translate(90, 360)">
            <circle r="44" fill="url(#gradH)" filter="url(#glow)" />
            <circle r="40" fill="#0f172a" stroke="#38bdf8" stroke-width="2.5" />
            <text x="0" y="-8" text-anchor="middle" fill="#e0f2fe" font-size="11" font-family="Inter" font-weight="700">HYDRAULIC</text>
            <text x="0" y="14" text-anchor="middle" fill="#38bdf8" font-size="22" font-family="Outfit" font-weight="800">H</text>
            <text x="0" y="28" text-anchor="middle" fill="#94a3b8" font-size="8" font-family="JetBrains Mono">FLUID / PORE p</text>
          </g>

          <!-- Node 3: MECHANICAL (M) -->
          <g class="thm-node" id="node-M" transform="translate(410, 360)">
            <circle r="44" fill="url(#gradM)" filter="url(#glow)" />
            <circle r="40" fill="#0f172a" stroke="#c084fc" stroke-width="2.5" />
            <text x="0" y="-8" text-anchor="middle" fill="#f3e8ff" font-size="11" font-family="Inter" font-weight="700">MECHANICAL</text>
            <text x="0" y="14" text-anchor="middle" fill="#c084fc" font-size="22" font-family="Outfit" font-weight="800">M</text>
            <text x="0" y="28" text-anchor="middle" fill="#94a3b8" font-size="8" font-family="JetBrains Mono">STRESS / STRAIN</text>
          </g>
        </svg>

        <!-- Quick Pathway Selector Strip -->
        <div class="coupling-pills-bar">
          ${Object.keys(COUPLING_DETAILS).map(key => {
            const item = COUPLING_DETAILS[key];
            return `
              <button class="pill-btn ${key === this.activeKey ? 'active' : ''}" data-key="${key}">
                ${item.direction}
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `;

    this.bindEvents();
    this.updateActiveStyles();
    this.renderDetails();
  }

  bindEvents() {
    // Buttons on pills
    this.container.querySelectorAll('.pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-key');
        this.selectCoupling(key);
      });
    });

    // SVG Buttons
    this.container.querySelectorAll('.coupling-label-btn').forEach(el => {
      el.addEventListener('click', () => {
        const key = el.getAttribute('data-key');
        this.selectCoupling(key);
      });
    });

    // Vertex node click toggles primary coupling
    const nodeT = this.container.querySelector('#node-T');
    const nodeH = this.container.querySelector('#node-H');
    const nodeM = this.container.querySelector('#node-M');

    if (nodeT) nodeT.addEventListener('click', () => this.selectCoupling('T_H'));
    if (nodeH) nodeH.addEventListener('click', () => this.selectCoupling('H_M'));
    if (nodeM) nodeM.addEventListener('click', () => this.selectCoupling('M_H'));
  }

  updateActiveStyles() {
    // Update active pill button
    this.container.querySelectorAll('.pill-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-key') === this.activeKey);
    });

    // Update active SVG label and paths
    this.container.querySelectorAll('.coupling-label-btn').forEach(el => {
      const isSel = el.getAttribute('data-key') === this.activeKey;
      el.classList.toggle('selected', isSel);
    });

    this.container.querySelectorAll('.coupling-path').forEach(path => {
      const pId = path.id.replace('path_', '');
      const isSel = pId === this.activeKey;
      path.classList.toggle('active-flow', isSel);
      path.setAttribute('stroke-width', isSel ? '5.5' : '2.5');
      path.style.filter = isSel ? 'drop-shadow(0 0 8px currentColor)' : 'none';
    });
  }
}
