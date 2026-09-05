/**
 * THM Solver 1D: Coupled Thermo-Hydro-Mechanical Finite Difference Engine
 * Solves coupled 1D Biot poroelasticity with thermal expansion & pressurization.
 * 
 * Governing Equations:
 * 1) Heat Conduction & Advection:
 *    (rho * Cp)_m * dT/dt = d/dz ( kappa * dT/dz ) - rho_f * c_f * q_z * dT/dz
 * 
 * 2) Fluid Mass Conservation (Storage Equation with Poro-Thermal Coupling):
 *    (Ss + alpha^2 / K') * dp/dt = d/dz ( k/mu * dp/dz ) + beta_eff * dT/dt - (alpha / K') * d(sigma_v)/dt
 *    where beta_eff = beta_m - 3 * alpha * K * alpha_T / K'
 *    beta_m = alpha * beta_s + (phi - alpha) * beta_f (thermal expansion mismatch)
 * 
 * 3) Mechanical 1D Strain & Effective Stress:
 *    sigma'_v = sigma_v - alpha * p
 *    epsilon_v(z) = (sigma_v + alpha * p + 3 * K * alpha_T * (T - T0)) / K'
 *    u(z) = integral_{z}^{L} epsilon_v(z') dz'  (base fixed at z=L)
 */

export class THMSolver1D {
  constructor(options = {}) {
    // Spatial grid
    this.nz = options.nz || 50; // number of nodes
    this.L = options.L || 10.0; // depth in meters (0 = top / surface, L = base)
    this.dz = this.L / (this.nz - 1);
    this.z = new Float64Array(this.nz);
    for (let i = 0; i < this.nz; i++) {
      this.z[i] = i * this.dz;
    }

    // Material parameters (default: Low-permeability Clay / Host Rock)
    this.params = {
      E: 2.0e9,           // Young's modulus (Pa)
      nu: 0.25,           // Poisson's ratio
      phi: 0.15,          // Porosity
      k_perm: 1.0e-18,    // Intrinsic permeability (m^2)
      alpha_biot: 0.85,   // Biot-Willis coefficient
      kappa_th: 1.8,      // Bulk thermal conductivity (W / (m * K))
      rho_m: 2400.0,      // Bulk density (kg/m^3)
      cp_m: 900.0,        // Bulk specific heat capacity (J / (kg * K))
      beta_s: 3.0e-5,     // Solid volumetric thermal expansion (1/K)
      beta_f: 3.0e-4,     // Fluid volumetric thermal expansion (1/K)
      mu_f0: 1.0e-3,      // Fluid viscosity at 20°C (Pa*s)
      rho_f: 1000.0,      // Fluid density (kg/m^3)
      cf_fluid: 4184.0,   // Fluid specific heat capacity (J / (kg * K))
      Ss: 1.0e-9,         // Specific storage (1/Pa)
      T0: 20.0,           // Initial temperature (°C)
      p0: 1.0e6,          // Initial pore pressure (Pa = 1 MPa)
      sigma_v0: 5.0e6,    // Initial total vertical stress (Pa = 5 MPa)
      ...options.params
    };

    // Derived mechanical properties
    this.updateDerivedProperties();

    // Field variables at nodes
    this.T = new Float64Array(this.nz);       // Temperature (°C)
    this.p = new Float64Array(this.nz);       // Pore pressure (Pa)
    this.sigma_v = new Float64Array(this.nz); // Total vertical stress (Pa)
    this.sigma_eff = new Float64Array(this.nz);// Effective vertical stress (Pa)
    this.eps_v = new Float64Array(this.nz);   // Volumetric strain
    this.u = new Float64Array(this.nz);       // Vertical displacement (m)

    // Boundary Conditions
    this.bc = {
      topT: 20.0,            // Top temperature fixed (°C)
      bottomT: 20.0,         // Bottom temperature fixed (°C)
      bottomHeatFlux: 0.0,   // or heat flux (W/m^2) if flux mode
      bottomIsFlux: false,
      topP: 1.0e6,           // Top drained pressure (Pa)
      bottomPFlux: 0.0,      // Bottom fluid flux (m/s)
      surcharge: 0.0,        // Additional mechanical load on top (Pa)
      bottomHeatSource: 80.0 // Applied bottom temperature in heating mode
    };

    this.time = 0.0;
    this.dt = 3600.0; // 1 hour per step
    this.reset();
  }

  updateDerivedProperties() {
    const { E, nu, alpha_biot, beta_s, beta_f, phi } = this.params;
    // Bulk modulus K
    this.K = E / (3 * (1 - 2 * nu));
    // Shear modulus G
    this.G = E / (2 * (1 + nu));
    // 1D Constrained Oedometer Modulus K' = K + 4/3 G = E*(1-nu)/((1+nu)*(1-2nu))
    this.K_prime = (E * (1 - nu)) / ((1 + nu) * (1 - 2 * nu));
    // Linear thermal expansion of solid
    this.alpha_T = beta_s / 3.0;
    // Mismatch thermal expansion beta_m = alpha * beta_s + (phi - alpha) * beta_f
    // If phi < alpha, standard poro-thermal expansion difference
    this.beta_m = alpha_biot * beta_s + (phi * beta_f - phi * beta_s);
    // Effective thermal expansion factor in flow equation
    this.beta_eff = this.beta_m - (3 * alpha_biot * this.K * this.alpha_T) / this.K_prime;
    // Combined storage coefficient
    this.S_eff = this.params.Ss + (alpha_biot * alpha_biot) / this.K_prime;
    // Volumetric heat capacity
    this.rhoCp = this.params.rho_m * this.params.cp_m;
  }

  reset() {
    this.time = 0.0;
    for (let i = 0; i < this.nz; i++) {
      this.T[i] = this.params.T0;
      this.p[i] = this.params.p0;
      this.sigma_v[i] = this.params.sigma_v0 + (this.params.rho_m * 9.81 * this.z[i]);
    }
    this.updateMechanicalFields();
  }

  // Set preset rock / scenario
  setPreset(presetName) {
    if (presetName === 'nuclear_clay') {
      // Boom clay / Opalinus clay (very low perm, high thermal pressurization)
      this.params.E = 3.5e9;
      this.params.nu = 0.28;
      this.params.phi = 0.16;
      this.params.k_perm = 2.0e-20;
      this.params.alpha_biot = 0.90;
      this.params.kappa_th = 2.2;
      this.params.Ss = 2.0e-9;
      this.bc.bottomHeatSource = 90.0; // 90°C canister heat
      this.bc.surcharge = 0.0;
    } else if (presetName === 'geothermal_cooling') {
      // High-permeability granite reservoir undergoing cold injection
      this.params.E = 35.0e9;
      this.params.nu = 0.22;
      this.params.phi = 0.05;
      this.params.k_perm = 5.0e-15;
      this.params.alpha_biot = 0.65;
      this.params.kappa_th = 3.0;
      this.params.Ss = 5.0e-10;
      this.params.T0 = 150.0;
      this.bc.topT = 150.0;
      this.bc.bottomHeatSource = 40.0; // Cold water injection at 40°C
      this.bc.topP = 5.0e6;
      this.bc.surcharge = 2.0e6;
    } else if (presetName === 'terzaghi_consolidation') {
      // Pure mechanical loading on soft clay without thermal pulse
      this.params.E = 0.8e9;
      this.params.nu = 0.32;
      this.params.phi = 0.30;
      this.params.k_perm = 1.0e-16;
      this.params.alpha_biot = 1.0;
      this.params.kappa_th = 1.5;
      this.params.Ss = 1.0e-8;
      this.bc.bottomHeatSource = 20.0;
      this.bc.surcharge = 5.0e6; // 5 MPa surface surcharge
    } else if (presetName === 'thermal_pressurization_fault') {
      // Low-perm fault zone sheared / heated suddenly
      this.params.E = 15.0e9;
      this.params.nu = 0.25;
      this.params.phi = 0.08;
      this.params.k_perm = 1.0e-19;
      this.params.alpha_biot = 0.8;
      this.params.kappa_th = 2.5;
      this.params.Ss = 8.0e-10;
      this.bc.bottomHeatSource = 130.0; // Sudden frictional shear heating
      this.bc.surcharge = 0.0;
    }
    this.updateDerivedProperties();
    this.reset();
  }

  // Dynamic fluid viscosity as function of temperature (Vogel-Fulcher-Tammann approx for water)
  getFluidViscosity(tempC) {
    const T_K = tempC + 273.15;
    // Viscosity in Pa*s (approx 1.0e-3 at 20°C, 0.3e-3 at 90°C)
    return 2.414e-5 * Math.pow(10, 247.8 / (T_K - 140.0));
  }

  // Finite difference time-stepping
  step(substeps = 2) {
    const dtSub = this.dt / substeps;

    for (let s = 0; s < substeps; s++) {
      const nextT = new Float64Array(this.T);
      const nextP = new Float64Array(this.p);
      const dT_dt = new Float64Array(this.nz);

      const dz2 = this.dz * this.dz;

      // 1. Thermal Conduction & Advection
      nextT[0] = this.bc.topT;
      nextT[this.nz - 1] = this.bc.bottomHeatSource;

      for (let i = 1; i < this.nz - 1; i++) {
        const d2T_dz2 = (this.T[i + 1] - 2 * this.T[i] + this.T[i - 1]) / dz2;
        const mu = this.getFluidViscosity(this.T[i]);
        const dp_dz = (this.p[i + 1] - this.p[i - 1]) / (2 * this.dz);
        const q_z = -(this.params.k_perm / mu) * dp_dz;

        const dT_dz = (this.T[i + 1] - this.T[i - 1]) / (2 * this.dz);
        const advection = this.params.rho_f * this.params.cf_fluid * q_z * dT_dz;

        const rateT = (this.params.kappa_th * d2T_dz2 - advection) / this.rhoCp;
        dT_dt[i] = rateT;
        nextT[i] = this.T[i] + rateT * dtSub;
      }

      dT_dt[0] = (nextT[0] - this.T[0]) / dtSub;
      dT_dt[this.nz - 1] = (nextT[this.nz - 1] - this.T[this.nz - 1]) / dtSub;

      // 2. Fluid Mass Conservation & Thermal Pressurization
      nextP[0] = this.bc.topP; // Top drained condition

      for (let i = 1; i < this.nz - 1; i++) {
        const mu_mid_plus = this.getFluidViscosity(0.5 * (this.T[i + 1] + this.T[i]));
        const mu_mid_minus = this.getFluidViscosity(0.5 * (this.T[i] + this.T[i - 1]));
        const K_plus = this.params.k_perm / mu_mid_plus;
        const K_minus = this.params.k_perm / mu_mid_minus;

        const flux_plus = K_plus * (this.p[i + 1] - this.p[i]) / this.dz;
        const flux_minus = K_minus * (this.p[i] - this.p[i - 1]) / this.dz;
        const flow_div = (flux_plus - flux_minus) / this.dz;

        const thermal_pressurization = this.beta_eff * dT_dt[i];

        const rateP = (flow_div + thermal_pressurization) / this.S_eff;
        nextP[i] = this.p[i] + rateP * dtSub;
      }

      // Bottom no-flow Neumann condition
      nextP[this.nz - 1] = nextP[this.nz - 2];

      this.T.set(nextT);
      this.p.set(nextP);
      this.time += dtSub;
    }

    this.updateMechanicalFields();
  }

  // Calculate 1D Mechanical Fields: Stresses, Volumetric Strain, Heave/Settlement
  updateMechanicalFields() {
    const { alpha_biot, K_prime, K, alpha_T, rho_m } = this.params;
    const surcharge = this.bc.surcharge || 0.0;

    for (let i = 0; i < this.nz; i++) {
      const lithostatic = rho_m * 9.81 * this.z[i];
      this.sigma_v[i] = this.params.sigma_v0 + lithostatic + surcharge;
      this.sigma_eff[i] = this.sigma_v[i] - alpha_biot * this.p[i];

      const delta_sigma = this.sigma_v[i] - (this.params.sigma_v0 + lithostatic);
      const delta_p = this.p[i] - this.params.p0;
      const delta_T = this.T[i] - this.params.T0;

      // Positive eps_v is compression, negative is expansion (heave)
      this.eps_v[i] = (delta_sigma - alpha_biot * delta_p - 3.0 * K * alpha_T * delta_T) / K_prime;
    }

    // Integrate vertical displacement u(z) from fixed base at z = L upwards
    let accum = 0.0;
    this.u[this.nz - 1] = 0.0;
    for (let i = this.nz - 2; i >= 0; i--) {
      const avg_eps = 0.5 * (this.eps_v[i] + this.eps_v[i + 1]);
      accum += avg_eps * this.dz;
      // Inward compression reduces column height => settlement (negative u)
      // Expansion increases column height => heave (positive u)
      this.u[i] = -accum;
    }
  }

  getSurfaceDisplacement() {
    return this.u[0]; // meters
  }

  getMaxExcessPressure() {
    let maxDeltaP = 0;
    for (let i = 0; i < this.nz; i++) {
      const delta = this.p[i] - this.params.p0;
      if (Math.abs(delta) > Math.abs(maxDeltaP)) {
        maxDeltaP = delta;
      }
    }
    return maxDeltaP; // Pa
  }
}
