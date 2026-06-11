const canvas = document.querySelector("#sample-canvas");
const ctx = canvas.getContext("2d");

const controls = {
  temperature: document.querySelector("#temperature"),
  pressure: document.querySelector("#pressure"),
  load: document.querySelector("#load"),
  permeability: document.querySelector("#permeability"),
  showHeat: document.querySelector("#show-heat"),
  showFlow: document.querySelector("#show-flow"),
  showMesh: document.querySelector("#show-mesh"),
};

const outputs = {
  temperature: document.querySelector("#temperature-out"),
  pressure: document.querySelector("#pressure-out"),
  load: document.querySelector("#load-out"),
  permeability: document.querySelector("#permeability-out"),
  flux: document.querySelector("#metric-flux"),
  strain: document.querySelector("#metric-strain"),
  porosity: document.querySelector("#metric-porosity"),
};

const equations = {
  energy: {
    label: "Energy conservation",
    text: "(rho c)_eff dT/dt = div(lambda_eff grad T) - rho_f c_f v dot grad T + Q_T",
    explain:
      "The left side stores heat in the solid-fluid mixture. The right side accounts for conduction, advective heat transport by flowing water, and sources such as injection or reactions.",
  },
  mass: {
    label: "Fluid mass conservation",
    text: "S_e dp/dt + alpha_B d(eps_v)/dt - beta_T dT/dt = -div(v) + q_f",
    explain:
      "Storage, pore-volume change, and thermal expansion must balance the divergence of Darcy flux and any injection or production source.",
  },
  momentum: {
    label: "Quasi-static momentum balance",
    text: "div(sigma) + rho_b g = 0, with sigma = sigma' - alpha_B p I",
    explain:
      "At geological time scales inertia is often negligible. Total stress equilibrium is solved together with effective stress and pore pressure.",
  },
  closure: {
    label: "Thermo-poroelastic closure",
    text: "sigma' = C : (eps - alpha_T (T - T0) I), eps = 1/2(grad u + grad u^T)",
    explain:
      "The constitutive law relates effective stress to elastic strain after subtracting free thermal expansion. More advanced models add plasticity, damage, or chemical effects.",
  },
};

const coupling = {
  "thermal-hydro": {
    kicker: "T -> H",
    title: "Thermal pressurization",
    body:
      "Heating expands pore fluid and grains by different amounts. In low-permeability rock, fluid expansion cannot drain quickly, so pore pressure rises and effective stress falls.",
    formula:
      "dp asymptotically follows Lambda dT, where Lambda depends on compressibility and expansion mismatch.",
  },
  "hydro-thermal": {
    kicker: "H -> T",
    title: "Advective heat transport",
    body:
      "Pressure gradients move pore water. That moving water carries enthalpy, so the thermal front can travel faster than pure conduction predicts.",
    formula: "Pe = v L / D_T. High Pe means advection dominates thermal spreading.",
  },
  "thermal-mech": {
    kicker: "T -> M",
    title: "Thermal strain and stress",
    body:
      "Free material expands when heated. If surrounding rock restrains that expansion, temperature change becomes stress change instead of free displacement.",
    formula: "eps_T = alpha_T Delta T I, and restrained stress scales with E alpha_T Delta T.",
  },
  "mech-thermal": {
    kicker: "M -> T",
    title: "Mechanical dissipation",
    body:
      "Rapid deformation, frictional slip, and plastic work can convert mechanical energy into heat. This is small in many reservoir problems but critical in shear bands and faults.",
    formula: "Q_M = sigma' : d eps_p / dt for plastic or frictional dissipation.",
  },
  "hydro-mech": {
    kicker: "H -> M",
    title: "Poroelastic stress path",
    body:
      "Increasing pore pressure reduces effective compressive stress carried by the grain skeleton. That can cause uplift, opening, or failure if strength is exceeded.",
    formula: "Delta sigma' = Delta sigma - alpha_B Delta p I.",
  },
  "mech-hydro": {
    kicker: "M -> H",
    title: "Consolidation and compaction",
    body:
      "Loading compresses pore volume and raises pressure. Drainage lets excess pressure dissipate while the skeleton settles toward its drained state.",
    formula: "S_e dp/dt + alpha_B d eps_v/dt = div((k / mu) grad p).",
  },
};

const scaleInputs = {
  length: document.querySelector("#length"),
  diffusivity: document.querySelector("#diffusivity"),
  velocity: document.querySelector("#velocity"),
};

const scaleOutputs = {
  length: document.querySelector("#length-out"),
  diffusivity: document.querySelector("#diffusivity-out"),
  velocity: document.querySelector("#velocity-out"),
  diffusionTime: document.querySelector("#diffusion-time"),
  peclet: document.querySelector("#peclet"),
  regime: document.querySelector("#regime"),
  regimeCopy: document.querySelector("#regime-copy"),
};

let state = readState();
let time = 0;

function readState() {
  return {
    temperature: Number(controls.temperature.value),
    pressure: Number(controls.pressure.value),
    load: Number(controls.load.value),
    permeabilityExp: Number(controls.permeability.value),
    showHeat: controls.showHeat.checked,
    showFlow: controls.showFlow.checked,
    showMesh: controls.showMesh.checked,
  };
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function updateControls() {
  state = readState();
  outputs.temperature.innerHTML = `${state.temperature.toFixed(0)}&deg;C`;
  outputs.pressure.textContent = `${state.pressure.toFixed(1)} MPa/m`;
  outputs.load.textContent = `${state.load.toFixed(1)} MPa`;
  outputs.permeability.innerHTML = `10^${state.permeabilityExp.toFixed(1)} m&sup2;`;

  const permeability = 10 ** state.permeabilityExp;
  const viscosity = 1e-3;
  const pressureGradient = state.pressure * 1e6;
  const darcyVelocity = (permeability / viscosity) * pressureGradient;
  const thermalExpansion = 1.15e-5;
  const thermalStrain = thermalExpansion * state.temperature;
  const pressureSupport = 0.16 * state.pressure;
  const porosityChange = 0.012 * state.temperature - 0.19 * state.load + pressureSupport;

  outputs.flux.textContent = `${(darcyVelocity * 1000).toFixed(3)} mm/s`;
  outputs.strain.textContent = `${(thermalStrain * 100).toFixed(3)}%`;
  outputs.porosity.textContent = `${porosityChange >= 0 ? "+" : ""}${porosityChange.toFixed(2)}%`;
}

function draw() {
  time += 0.016;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  ctx.clearRect(0, 0, width, height);
  drawBackground(width, height);

  const sample = sampleRect(width, height);
  drawThermalField(sample);
  drawPores(sample);

  if (state.showMesh) drawMesh(sample);
  if (state.showHeat) drawHeatVectors(sample);
  if (state.showFlow) drawFlow(sample);

  drawStress(sample);
  drawLabels(sample);
  requestAnimationFrame(draw);
}

function sampleRect(width, height) {
  const marginX = Math.max(32, width * 0.08);
  const marginY = Math.max(48, height * 0.1);
  return {
    x: marginX,
    y: marginY,
    w: width - marginX * 2,
    h: height - marginY * 2.05,
  };
}

function drawBackground(width, height) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(1, "#e7f4f8");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(31, 142, 214, 0.09)";
  ctx.lineWidth = 1;
  const spacing = 34;
  for (let x = -spacing; x < width + spacing; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + height * 0.2, height);
    ctx.stroke();
  }
}

function drawThermalField(sample) {
  const gradient = ctx.createLinearGradient(sample.x, 0, sample.x + sample.w, 0);
  const hotAlpha = clamp(0.22 + state.temperature / 230, 0.25, 0.86);
  gradient.addColorStop(0, `rgba(240, 92, 58, ${hotAlpha})`);
  gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.74)");
  gradient.addColorStop(1, "rgba(31, 142, 214, 0.62)");

  roundedRect(sample.x, sample.y, sample.w, sample.h, 18);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.strokeStyle = "rgba(54, 68, 90, 0.7)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "rgba(240, 120, 60, 0.94)";
  roundedRect(sample.x - 12, sample.y + 14, 18, sample.h - 28, 8);
  ctx.fill();
  ctx.fillStyle = "rgba(31, 142, 214, 0.92)";
  roundedRect(sample.x + sample.w - 6, sample.y + 14, 18, sample.h - 28, 8);
  ctx.fill();
}

function drawPores(sample) {
  const pores = [
    [0.12, 0.2, 18],
    [0.24, 0.36, 25],
    [0.39, 0.22, 16],
    [0.55, 0.35, 28],
    [0.72, 0.2, 18],
    [0.84, 0.42, 24],
    [0.18, 0.64, 25],
    [0.37, 0.74, 20],
    [0.54, 0.62, 18],
    [0.69, 0.76, 26],
    [0.88, 0.68, 16],
  ];

  for (const [px, py, radius] of pores) {
    const x = sample.x + px * sample.w + Math.sin(time + px * 7) * 1.2;
    const y = sample.y + py * sample.h + deformation(py) * sample.h * 0.06;
    const r = radius * (1 + state.pressure * 0.018 - state.load * 0.006);
    ctx.beginPath();
    ctx.arc(x, y, Math.max(8, r), 0, Math.PI * 2);
    ctx.fillStyle = "rgba(13, 95, 120, 0.18)";
    ctx.fill();
    ctx.strokeStyle = "rgba(13, 95, 120, 0.46)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(54, 68, 90, 0.32)";
  for (let i = 0; i < 48; i += 1) {
    const px = pseudo(i * 19.17);
    const py = pseudo(i * 8.31 + 4);
    const x = sample.x + px * sample.w;
    const y = sample.y + py * sample.h + deformation(py) * sample.h * 0.05;
    const r = 3 + pseudo(i * 2.11) * 4;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMesh(sample) {
  const columns = 7;
  const rows = 5;
  ctx.strokeStyle = "rgba(38, 56, 77, 0.38)";
  ctx.lineWidth = 1.3;

  for (let c = 1; c < columns; c += 1) {
    ctx.beginPath();
    for (let r = 0; r <= 80; r += 1) {
      const t = r / 80;
      const baseX = sample.x + (c / columns) * sample.w;
      const x = baseX + Math.sin(t * Math.PI * 2 + c) * state.load * 0.35;
      const y = sample.y + t * sample.h + deformation(t) * sample.h * 0.06;
      if (r === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  for (let r = 1; r < rows; r += 1) {
    const t = r / rows;
    ctx.beginPath();
    for (let c = 0; c <= 100; c += 1) {
      const s = c / 100;
      const x = sample.x + s * sample.w + Math.sin(s * Math.PI * 2 + r) * state.load * 0.16;
      const y = sample.y + t * sample.h + deformation(t) * sample.h * 0.06;
      if (c === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

function drawHeatVectors(sample) {
  const rows = 4;
  const strength = state.temperature / 140;
  for (let row = 0; row < rows; row += 1) {
    const y = sample.y + ((row + 1) / (rows + 1)) * sample.h;
    for (let i = 0; i < 4; i += 1) {
      const x = sample.x + sample.w * (0.16 + i * 0.19);
      drawArrow(x, y, x + 34 + 28 * strength, y, "#f0783c", 5);
    }
  }
}

function drawFlow(sample) {
  const flowSpeed = 0.5 + (state.pressure * (state.permeabilityExp + 16.3)) / 5;
  const paths = [0.22, 0.38, 0.55, 0.72];
  for (let p = 0; p < paths.length; p += 1) {
    ctx.beginPath();
    for (let i = 0; i <= 100; i += 1) {
      const t = i / 100;
      const x = sample.x + t * sample.w;
      const y =
        sample.y +
        paths[p] * sample.h +
        Math.sin(t * Math.PI * 3 + p * 1.8) * sample.h * 0.035 +
        deformation(paths[p]) * sample.h * 0.05;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = "rgba(31, 142, 214, 0.48)";
    ctx.lineWidth = 4;
    ctx.stroke();

    for (let dot = 0; dot < 3; dot += 1) {
      const t = (time * flowSpeed * 0.09 + dot / 3 + p * 0.11) % 1;
      const x = sample.x + t * sample.w;
      const y =
        sample.y +
        paths[p] * sample.h +
        Math.sin(t * Math.PI * 3 + p * 1.8) * sample.h * 0.035 +
        deformation(paths[p]) * sample.h * 0.05;
      ctx.beginPath();
      ctx.arc(x, y, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = "#1f8ed6";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}

function drawStress(sample) {
  const load = state.load / 24;
  const arrowCount = 5;
  for (let i = 0; i < arrowCount; i += 1) {
    const x = sample.x + ((i + 0.5) / arrowCount) * sample.w;
    const top = sample.y - 26 - 20 * load;
    drawArrow(x, top, x, sample.y - 4, "#c3413d", 5 + load * 3);
    drawArrow(x, sample.y + sample.h + 26 + 20 * load, x, sample.y + sample.h + 4, "#c3413d", 5 + load * 3);
  }
}

function drawLabels(sample) {
  ctx.font = "700 13px Inter, sans-serif";
  ctx.fillStyle = "#26384d";
  ctx.fillText("hot", sample.x - 10, sample.y - 14);
  ctx.fillText("cool", sample.x + sample.w - 22, sample.y - 14);
  ctx.fillText("deforming porous skeleton", sample.x + 18, sample.y + sample.h + 42);
}

function deformation(normalizedY) {
  const loadTerm = (state.load / 24) * normalizedY;
  const thermalTerm = (state.temperature / 140) * (1 - normalizedY) * 0.28;
  const pressureTerm = (state.pressure / 4) * 0.2;
  return loadTerm - thermalTerm - pressureTerm;
}

function drawArrow(x1, y1, x2, y2, color, width) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLength = 13 + width;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - headLength * Math.cos(angle - Math.PI / 7),
    y2 - headLength * Math.sin(angle - Math.PI / 7),
  );
  ctx.lineTo(
    x2 - headLength * Math.cos(angle + Math.PI / 7),
    y2 - headLength * Math.sin(angle + Math.PI / 7),
  );
  ctx.closePath();
  ctx.fill();
}

function roundedRect(x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function pseudo(seed) {
  return Math.sin(seed * 999.91) * 0.5 + 0.5;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function updateEquation(key) {
  const data = equations[key];
  document.querySelector("#equation-label").textContent = data.label;
  document.querySelector("#equation-text").textContent = data.text;
  document.querySelector("#equation-explain").textContent = data.explain;

  document.querySelectorAll(".tab").forEach((tab) => {
    const active = tab.dataset.equation === key;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
  });
}

function updateCoupling(key) {
  const data = coupling[key];
  document.querySelector("#coupling-kicker").textContent = data.kicker;
  document.querySelector("#coupling-title-text").textContent = data.title;
  document.querySelector("#coupling-body").textContent = data.body;
  document.querySelector("#coupling-formula").textContent = data.formula;

  document.querySelectorAll(".matrix-cell").forEach((cell) => {
    cell.classList.toggle("active", cell.dataset.coupling === key);
  });
}

function updateScales() {
  const length = Number(scaleInputs.length.value);
  const diffusivity = 10 ** Number(scaleInputs.diffusivity.value);
  const velocity = 10 ** Number(scaleInputs.velocity.value);
  const diffusionSeconds = (length * length) / diffusivity;
  const peclet = (velocity * length) / diffusivity;

  scaleOutputs.length.textContent = `${length.toFixed(0)} m`;
  scaleOutputs.diffusivity.innerHTML = `1e${Number(scaleInputs.diffusivity.value).toFixed(1)} m&sup2;/s`;
  scaleOutputs.velocity.textContent = `1e${Number(scaleInputs.velocity.value).toFixed(1)} m/s`;
  scaleOutputs.diffusionTime.textContent = formatDuration(diffusionSeconds);
  scaleOutputs.peclet.textContent = peclet < 10 ? peclet.toFixed(2) : peclet.toFixed(0);

  if (peclet < 0.3) {
    scaleOutputs.regime.textContent = "diffusive";
    scaleOutputs.regimeCopy.textContent = "Gradients smooth out faster than moving water can transport heat or solute.";
  } else if (peclet > 3) {
    scaleOutputs.regime.textContent = "advective";
    scaleOutputs.regimeCopy.textContent = "Moving pore water carries signals farther than diffusion alone.";
  } else {
    scaleOutputs.regime.textContent = "mixed";
    scaleOutputs.regimeCopy.textContent = "Advection and diffusion both shape the response.";
  }
}

function formatDuration(seconds) {
  const minute = 60;
  const hour = 60 * minute;
  const day = 24 * hour;
  const year = 365.25 * day;
  if (seconds < hour) return `${(seconds / minute).toFixed(1)} minutes`;
  if (seconds < day) return `${(seconds / hour).toFixed(1)} hours`;
  if (seconds < year) return `${(seconds / day).toFixed(1)} days`;
  return `${(seconds / year).toFixed(1)} years`;
}

Object.values(controls).forEach((input) => {
  input.addEventListener("input", updateControls);
});

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => updateEquation(tab.dataset.equation));
});

document.querySelectorAll(".matrix-cell").forEach((cell) => {
  cell.addEventListener("click", () => updateCoupling(cell.dataset.coupling));
});

Object.values(scaleInputs).forEach((input) => {
  input.addEventListener("input", updateScales);
});

window.addEventListener("resize", resizeCanvas);

resizeCanvas();
updateControls();
updateScales();
requestAnimationFrame(draw);
