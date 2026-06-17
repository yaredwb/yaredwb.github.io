"""Generate the figures embedded in the teaching lecture-note posts.

Regenerates the four PNGs in ../assets/figs used by the posts under
_teaching/ (iterative solvers; stress invariants; failure criteria).
All figure data is computed from first principles, so the script is
deterministic and overwrites the PNGs in place.

Requires matplotlib and numpy, e.g. in a throwaway virtualenv:

    python3 -m venv /tmp/figvenv
    /tmp/figvenv/bin/pip install matplotlib numpy
    /tmp/figvenv/bin/python scripts/genfigs.py
"""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.ticker as mt
from matplotlib.patches import Arc
import numpy as np
import os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "figs")
os.makedirs(OUT, exist_ok=True)

PAPER = "#fffcf0"; INK = "#1a1916"; SUB = "#403e3c"; MUTED = "#6f6e69"; FAINT = "#9a988f"
ACCENT = "#bc5215"; BLUE = "#2f6f8f"; PURPLE = "#7a4f9c"; GREEN = "#3f6f4f"; OCHRE = "#a8801f"
GRID = "#e7e4d8"

plt.rcParams.update({
    "figure.facecolor": PAPER, "axes.facecolor": PAPER, "savefig.facecolor": PAPER,
    "savefig.dpi": 240, "figure.dpi": 120, "savefig.bbox": "tight", "savefig.pad_inches": 0.05,
    "font.family": "serif", "font.serif": ["STIXGeneral", "DejaVu Serif"],
    "mathtext.fontset": "stix",
    "font.size": 13, "axes.titlesize": 13.5, "axes.labelsize": 13.5,
    "axes.edgecolor": SUB, "axes.linewidth": 1.0, "axes.labelcolor": INK, "text.color": INK,
    "axes.titlecolor": INK,
    "xtick.color": SUB, "ytick.color": SUB, "xtick.labelcolor": SUB, "ytick.labelcolor": SUB,
    "xtick.direction": "in", "ytick.direction": "in",
    "xtick.major.size": 5, "ytick.major.size": 5, "xtick.minor.size": 2.8, "ytick.minor.size": 2.8,
    "xtick.major.width": 0.9, "ytick.major.width": 0.9,
    "xtick.minor.width": 0.7, "ytick.minor.width": 0.7,
    "axes.grid": False, "legend.frameon": False, "legend.fontsize": 11.5,
    "legend.handlelength": 2.0, "legend.labelspacing": 0.35,
    "lines.solid_capstyle": "round", "lines.dash_capstyle": "round",
})


def style_box(ax):
    ax.tick_params(which="both", top=True, right=True)
    for s in ax.spines.values():
        s.set_linewidth(1.0); s.set_color(SUB)


# ===========================================================================
# Figure 1 : Iterative solver convergence
# ===========================================================================
def tridiag(n):
    A = np.zeros((n, n)); np.fill_diagonal(A, -2.0)
    for i in range(n - 1):
        A[i, i + 1] = A[i + 1, i] = 1.0
    return A

def rhs(n):
    b = np.zeros(n); b[0] = 4.0; return b

def solve_iter(method, A, b, omega=1.0, tol=1e-12, maxit=700):
    xstar = np.linalg.solve(A, b)
    D = np.diag(np.diag(A)); L = np.tril(A, -1); U = np.triu(A, 1)
    x = np.zeros(len(b)); errs = [np.linalg.norm(x - xstar)]
    for _ in range(maxit):
        if method == "jacobi":
            x = np.linalg.solve(D, b - (L + U) @ x)
        elif method == "gs":
            x = np.linalg.solve(D + L, b - U @ x)
        else:
            x = np.linalg.solve(D + omega * L, omega * b - (omega * U + (omega - 1) * D) @ x)
        e = np.linalg.norm(x - xstar); errs.append(e)
        if e < tol:
            break
    return np.array(errs)

def omega_opt(A):
    D = np.diag(np.diag(A))
    rho = max(abs(np.linalg.eigvals(-np.linalg.solve(D, A - D))))
    return 2.0 / (1.0 + np.sqrt(1.0 - rho ** 2)), rho

TOL = 1e-11
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(9.7, 4.15))

A, b = tridiag(10), rhs(10)
w, rhoJ = omega_opt(A)
ej = solve_iter("jacobi", A, b, tol=TOL)
eg = solve_iter("gs", A, b, tol=TOL)
es = solve_iter("sor", A, b, omega=w, tol=TOL)
ax1.semilogy(ej, color=MUTED, lw=1.7, ls=(0, (6, 1.6)), marker="o", ms=4.2,
             markevery=14, mfc=PAPER, mec=MUTED, mew=1.0, label="Jacobi")
ax1.semilogy(eg, color=BLUE, lw=1.8, marker="s", ms=4.0,
             markevery=14, mfc=PAPER, mec=BLUE, mew=1.0, label="Gauss–Seidel")
ax1.semilogy(es, color=ACCENT, lw=2.2, marker="^", ms=5.0,
             markevery=6, mfc=PAPER, mec=ACCENT, mew=1.2, label=fr"SOR ($\omega={w:.2f}$)")
ax1.axhline(TOL, color=FAINT, lw=1.0, ls=":")
ax1.text(119, TOL * 1.7, r"tolerance $\varepsilon$", color=MUTED, fontsize=10.5,
         ha="right", va="bottom")
ax1.set_xlim(0, 120); ax1.set_ylim(1e-12, 30)
ax1.set_xlabel(r"iteration number $k$")
ax1.set_ylabel(r"error $\;\|\mathbf{x}^{(k)}-\mathbf{x}^{\ast}\|_2$")
ax1.set_title(r"(a)  three methods, $n=10$", loc="left")
ax1.legend(loc="lower left", bbox_to_anchor=(0.0, 0.0))

for nn, col, mk in zip([5, 10, 15], [GREEN, BLUE, ACCENT], ["o", "s", "^"]):
    e = solve_iter("gs", tridiag(nn), rhs(nn), tol=TOL)
    ax2.semilogy(e, color=col, lw=1.9, marker=mk, ms=4.2, markevery=18,
                 mfc=PAPER, mec=col, mew=1.0, label=fr"$n={nn}$")
ax2.axhline(TOL, color=FAINT, lw=1.0, ls=":")
ax2.set_xlim(0, 260); ax2.set_ylim(1e-12, 30)
ax2.set_xlabel(r"iteration number $k$")
ax2.set_ylabel(r"error $\;\|\mathbf{x}^{(k)}-\mathbf{x}^{\ast}\|_2$")
ax2.set_title(r"(b)  Gauss–Seidel, effect of size $n$", loc="left")
ax2.legend(loc="upper right")

for ax in (ax1, ax2):
    ax.yaxis.set_major_locator(mt.LogLocator(base=10, numticks=20))
    ax.yaxis.set_minor_locator(mt.LogLocator(base=10, subs=np.arange(2, 10) * 0.1, numticks=100))
    ax.yaxis.set_minor_formatter(mt.NullFormatter())
    ax.xaxis.set_minor_locator(mt.AutoMinorLocator())
    ax.grid(True, which="major", color=GRID, lw=0.8)
    ax.grid(True, which="minor", color=GRID, lw=0.5, alpha=0.6)
    ax.set_axisbelow(True); style_box(ax)
fig.tight_layout()
fig.savefig(f"{OUT}/iterative_convergence.png")
plt.close(fig)
print("F1: rhoJ=%.4f omega=%.4f iters J/GS/SOR=%d/%d/%d"
      % (rhoJ, w, len(ej) - 1, len(eg) - 1, len(es) - 1))

# ===========================================================================
# Figure 2 : Mohr's circles
# ===========================================================================
s1, s2, s3 = 120.0, 60.0, 30.0
p = (s1 + s2 + s3) / 3.0
J2 = ((s1 - s2) ** 2 + (s2 - s3) ** 2 + (s3 - s1) ** 2) / 6.0
q = np.sqrt(3 * J2); tau_oct = np.sqrt(2 * J2 / 3.0)

fig, ax = plt.subplots(figsize=(7.4, 4.35))
th = np.linspace(0, np.pi, 400)
cx, r = (s1 + s3) / 2, (s1 - s3) / 2
ax.fill(cx + r * np.cos(th), r * np.sin(th), color=ACCENT, alpha=0.05, lw=0, zorder=0)
def arc(c, rr, color, lw):
    ax.plot(c + rr * np.cos(th), rr * np.sin(th), color=color, lw=lw, zorder=3)
arc((s1 + s3) / 2, (s1 - s3) / 2, ACCENT, 2.4)
arc((s1 + s2) / 2, (s1 - s2) / 2, BLUE, 1.7)
arc((s2 + s3) / 2, (s2 - s3) / 2, BLUE, 1.7)
# radius showing tau_max
ax.plot([cx, cx], [0, r], color=ACCENT, lw=1.1, ls=(0, (4, 2)), zorder=4)
ax.plot([cx], [r], "o", color=ACCENT, ms=4, zorder=5)
ax.annotate(r"$\tau_{\max}=\frac{\sigma_1-\sigma_3}{2}$", (cx, r),
            textcoords="offset points", xytext=(8, 2), color=ACCENT, fontsize=12, va="center")
for c in [(s1 + s2) / 2, (s2 + s3) / 2]:
    ax.plot([c], [0], "|", color=BLUE, ms=8, mew=1.2, zorder=5)
for sv, lab, dx, ha in [(s1, r"$\sigma_1$", 12, "left"),
                        (s2, r"$\sigma_2$", 0, "center"),
                        (s3, r"$\sigma_3$", -12, "right")]:
    ax.plot([sv], [0], "o", color=INK, ms=4.5, zorder=6)
    ax.annotate(lab, (sv, 0), textcoords="offset points", xytext=(dx, 6),
                ha=ha, va="bottom", color=INK, fontsize=13)
ax.axvline(p, color=MUTED, ls=":", lw=1.2, zorder=2)
ax.annotate(r"$p=\frac{1}{3}I_1$", (p, 52), textcoords="offset points",
            xytext=(5, 0), color=MUTED, fontsize=12)
ax.set_xlabel(r"normal stress $\sigma_n$ (kPa)")
ax.set_ylabel(r"shear stress $\tau$ (kPa)")
ax.set_xlim(0, 142); ax.set_ylim(0, 58)
ax.set_aspect("equal", adjustable="box")
ax.xaxis.set_minor_locator(mt.AutoMinorLocator())
ax.yaxis.set_minor_locator(mt.AutoMinorLocator())
ax.set_axisbelow(True); style_box(ax)
fig.tight_layout()
fig.savefig(f"{OUT}/mohr_circles.png")
plt.close(fig)
print("F2: p=%.1f q=%.2f tau_oct=%.2f" % (p, q, tau_oct))

# ===========================================================================
# Figures 3 & 4 : failure criteria
# ===========================================================================
phi = np.deg2rad(30.0); sphi = np.sin(phi)
pmean = 100.0
ea = np.array([2.0, -1.0, -1.0]) / np.sqrt(6.0)
eb = np.array([0.0, 1.0, -1.0]) / np.sqrt(2.0)
dvec = lambda t: np.cos(t) * ea + np.sin(t) * eb

def rho_MC(t, pm=pmean, c=0.0):
    d = dvec(t); dmax, dmin = d.max(), d.min()
    return (2 * pm * sphi + 2 * c * np.cos(phi)) / ((dmax - dmin) - (dmax + dmin) * sphi)

K_MN = (9 - sphi ** 2) / (1 - sphi ** 2)
def rho_MN(t, pm=pmean):
    d = dvec(t); rs = np.linspace(1e-6, 3 * pmean, 6000)
    sig = pm + np.outer(rs, d)
    I1 = sig.sum(1)
    I2 = sig[:, 0] * sig[:, 1] + sig[:, 1] * sig[:, 2] + sig[:, 2] * sig[:, 0]
    I3 = sig.prod(1)
    f = I1 * I2 - K_MN * I3
    i = np.where(np.diff(np.sign(f)) != 0)[0][0]
    return rs[i] - f[i] * (rs[i + 1] - rs[i]) / (f[i + 1] - f[i])

thetas = np.linspace(0, 2 * np.pi, 1441)
rmc = np.array([rho_MC(t) for t in thetas])
rmn = np.array([rho_MN(t) for t in thetas])
rdp = rho_MC(0.0)
# theta=0 (triaxial compression, sigma1 largest) points UP; sigma_i axes at 0,120,240 deg
to_xy = lambda r, t: (-r * np.sin(t), r * np.cos(t))

fig, ax = plt.subplots(figsize=(6.9, 7.0))
xmc, ymc = to_xy(rmc, thetas)
ax.fill(xmc, ymc, color=ACCENT, alpha=0.06, lw=0, zorder=0)
phi_c = np.linspace(0, 2 * np.pi, 400)
ax.plot(rdp * np.cos(phi_c), rdp * np.sin(phi_c), color=BLUE, lw=1.9,
        label="Drucker–Prager", zorder=2)
ax.plot(xmc, ymc, color=ACCENT, lw=2.5, label="Mohr–Coulomb", zorder=4)
xmn, ymn = to_xy(rmn, thetas)
ax.plot(xmn, ymn, color=PURPLE, lw=2.0, label="Matsuoka–Nakai", zorder=3)
# principal-stress axis projections at theta = 0, 120, 240 deg
L = rdp * 1.34
for k, lab in enumerate((r"$\sigma_1$", r"$\sigma_2$", r"$\sigma_3$")):
    x, y = to_xy(L, k * 2 * np.pi / 3)
    ax.plot([0, x], [0, y], color=FAINT, lw=1.0, ls=(0, (1, 2)), zorder=1)
    ax.annotate(lab, (x, y), color=SUB, ha="center", va="center", fontsize=13.5)
ax.plot(0, 0, "+", color=INK, ms=9, mew=1.2, zorder=5)
# Lode angle arc between compression meridian (theta=0, up) and a sample direction
ts = np.deg2rad(24.0); rs_ = rho_MC(ts)
xs, ys = to_xy(rs_, ts)
ax.plot([0, xs], [0, ys], color=MUTED, lw=1.0, zorder=2)
ax.add_patch(Arc((0, 0), 46, 46, angle=0, theta1=90 - np.rad2deg(ts), theta2=90,
                 color=MUTED, lw=1.1, zorder=2))
ax.annotate(r"$\theta$", to_xy(30, ts / 2), color=SUB, fontsize=12.5,
            ha="center", va="center")
ax.annotate("triaxial\ncompression", to_xy(rho_MC(0), 0), textcoords="offset points",
            xytext=(0, 10), ha="center", va="bottom", color=MUTED, fontsize=10)
ax.set_aspect("equal"); ax.axis("off")
ax.set_xlim(-L * 1.12, L * 1.12); ax.set_ylim(-L * 1.12, L * 1.18)
ax.set_title(r"Deviatoric ($\pi$-) plane,   $\varphi=30^{\circ}$", pad=2)
ax.legend(loc="lower center", ncol=3, bbox_to_anchor=(0.5, -0.02),
          columnspacing=1.3, handletextpad=0.5)
fig.tight_layout()
fig.savefig(f"{OUT}/failure_pi_plane.png")
plt.close(fig)
print("F3: rhoMC(0)=%.1f rhoMC(60)=%.1f ratio=%.3f (exp %.3f); MN(0)=%.1f MN(60)=%.1f"
      % (rho_MC(0), rho_MC(np.deg2rad(60)), rho_MC(np.deg2rad(60)) / rho_MC(0),
         (3 - sphi) / (3 + sphi), rho_MN(0), rho_MN(np.deg2rad(60))))

# Meridian plane
fig, ax = plt.subplots(figsize=(7.4, 4.45))
pp = np.linspace(0, 250, 200)
c_coh = 12.0
Mc = 6 * sphi / (3 - sphi); Me = 6 * sphi / (3 + sphi)
q0c = 6 * c_coh * np.cos(phi) / (3 - sphi)
qc = Mc * pp + q0c
qe = Me * pp + 6 * c_coh * np.cos(phi) / (3 + sphi)
qy = Mc * 100 + q0c
ax.fill_between(pp, 0, qc, color=ACCENT, alpha=0.05, lw=0, zorder=0)
ax.plot(pp, qc, color=ACCENT, lw=2.4, zorder=4,
        label=r"Mohr–Coulomb (compression) $\equiv$ Drucker–Prager")
ax.plot(pp, qe, color=ACCENT, lw=1.8, ls=(0, (5, 2)), zorder=4,
        label="Mohr–Coulomb (extension)")
ax.axhline(qy, color=GREEN, lw=2.0, zorder=3, label="Tresca / von Mises")
# slope triangle on the compression meridian
p0, p1 = 150.0, 195.0
ax.plot([p0, p1, p1], [Mc * p0 + q0c, Mc * p0 + q0c, Mc * p1 + q0c],
        color=MUTED, lw=1.0, zorder=5)
ax.annotate(r"$M_c=\frac{6\sin\varphi}{3-\sin\varphi}$",
            (p1 + 4, Mc * (p0 + p1) / 2 + q0c), color=SUB, fontsize=11.5, va="center")
ax.plot([0], [q0c], "o", color=ACCENT, ms=5, zorder=6)
ax.annotate(r"$q_0=\frac{6c\cos\varphi}{3-\sin\varphi}$", (0, q0c),
            textcoords="offset points", xytext=(8, 6), color=SUB, fontsize=11.5)
ax.axvline(100, color=MUTED, ls=":", lw=1.0, zorder=1)
ax.annotate(r"$p=100$", (100, 7), color=MUTED, fontsize=10.5, ha="center")
ax.set_xlabel(r"mean stress $p$ (kPa)")
ax.set_ylabel(r"deviatoric stress $q=\sqrt{3J_2}$ (kPa)")
ax.set_xlim(0, 250); ax.set_ylim(0, 345)
ax.xaxis.set_minor_locator(mt.AutoMinorLocator())
ax.yaxis.set_minor_locator(mt.AutoMinorLocator())
ax.set_axisbelow(True); style_box(ax)
ax.legend(loc="upper left")
fig.tight_layout()
fig.savefig(f"{OUT}/failure_meridian.png")
plt.close(fig)
print("done")
