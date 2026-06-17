---
layout: post
title: "Failure Criteria in Geomechanics and the Deviatoric Plane"
date: 2023-06-05
tags: [constitutive modelling, plasticity, failure criteria, Mohr-Coulomb, Drucker-Prager, geomechanics]
excerpt: "An excerpt from the lecture notes of a course I taught entitled Constitutive Modelling in Geomechanics. A failure criterion defines the surface in stress space that bounds the states a soil can sustain. This note compares the classical criteria, Tresca, von Mises, Mohr-Coulomb, Drucker-Prager and Matsuoka-Nakai, through their cross-sections in the deviatoric plane."
---

An excerpt from the lecture notes of a course I taught entitled Constitutive Modelling in Geomechanics. A failure (or yield) criterion defines a surface in stress space that separates the stress states a material can sustain from those it cannot. This note compares the classical criteria used in geomechanics by drawing them in the deviatoric plane, building directly on the [stress invariants](/teaching/stress-invariants-and-the-deviatoric-stress-tensor/) developed earlier. A compression-positive convention is used throughout.

## Stress Space and the Deviatoric Plane

Any stress state can be plotted in the space of principal stresses $$ (\sigma_1, \sigma_2, \sigma_3) $$. It is natural to use cylindrical (Haigh-Westergaard) coordinates aligned with the *hydrostatic axis* $$ \sigma_1 = \sigma_2 = \sigma_3 $$,

$$
\xi = \frac{I_1}{\sqrt{3}} = \sqrt{3}\, p, \qquad
\rho = \sqrt{2 J_2}, \qquad
\theta = \text{Lode angle}
$$

Here $$ \xi $$ measures distance along the hydrostatic axis (mean stress), $$ \rho $$ is the radial distance from that axis (a measure of shear), and the Lode angle $$ \theta $$ fixes the position around it. The plane perpendicular to the hydrostatic axis is the *deviatoric* or $$ \pi $$-plane. A criterion that is independent of the mean stress appears as the same closed curve on every $$ \pi $$-plane, whereas a pressure-dependent criterion grows with $$ p $$, tracing out a cone or pyramid.

## Pressure-Independent Criteria

For undrained analysis of saturated clays, strength is often taken to be independent of the mean stress. The two classical criteria of this type were inherited from metal plasticity.

The **Tresca** criterion limits the maximum shear stress,

$$
\sigma_1 - \sigma_3 = \sigma_y
$$

which plots as a regular hexagon in the $$ \pi $$-plane and a horizontal line in the meridian plane. The **von Mises** criterion limits the deviatoric stress,

$$
q = \sqrt{3 J_2} = \sigma_y
$$

and plots as the circle that circumscribes the Tresca hexagon. Both are recovered as the zero-friction limit of the pressure-dependent criteria below.

## Pressure-Dependent Criteria

Soils are frictional materials: their strength increases with confining pressure. The governing criterion in geotechnical practice is the **Mohr-Coulomb** criterion, written in terms of the major and minor principal stresses as

$$
\sigma_1 - \sigma_3 = (\sigma_1 + \sigma_3)\sin\varphi + 2c\cos\varphi
$$

where $$ c $$ is the cohesion and $$ \varphi $$ the angle of internal friction. On the triaxial compression meridian this becomes a straight line in the $$ p $$-$$ q $$ plane,

$$
q = \frac{6\sin\varphi}{3-\sin\varphi}\, p + \frac{6c\cos\varphi}{3-\sin\varphi}
$$

In the $$ \pi $$-plane the Mohr-Coulomb criterion is an *irregular* hexagon: its radius on the compression meridian is larger than on the extension meridian, in the ratio $$ (3-\sin\varphi)/(3+\sin\varphi) $$. The sharp corners of this hexagon are awkward for numerical implementation, which motivates the smooth approximations.

The **Drucker-Prager** criterion replaces the hexagon with a circular cone,

$$
\sqrt{J_2} = \alpha I_1 + k
$$

where the constants $$ \alpha $$ and $$ k $$ are chosen to match Mohr-Coulomb along a chosen meridian. Matching at the compression corners gives

$$
\alpha = \frac{2\sin\varphi}{\sqrt{3}\,(3-\sin\varphi)}, \qquad
k = \frac{6c\cos\varphi}{\sqrt{3}\,(3-\sin\varphi)}
$$

The **Matsuoka-Nakai** criterion offers a smooth surface that, unlike Drucker-Prager, passes through *all* of the Mohr-Coulomb corners. It is written compactly in terms of the stress invariants,

$$
\frac{I_1 I_2}{I_3} = \frac{9 - \sin^2\varphi}{1 - \sin^2\varphi}
$$

## The Deviatoric Cross-Section

The figure below shows the three frictional criteria on the $$ \pi $$-plane for a friction angle $$ \varphi = 30^\circ $$. The Mohr-Coulomb hexagon touches the Drucker-Prager circle at the three compression corners, where the circle has been matched. Away from those corners the Drucker-Prager circle lies outside Mohr-Coulomb, so it over-predicts strength, most noticeably at the extension corners. The Matsuoka-Nakai surface threads smoothly through every Mohr-Coulomb corner, which makes it an attractive rounded substitute for the hexagon.

![Failure criteria in the deviatoric plane](/assets/figs/failure_pi_plane.png){: .center-image }
*Cross-sections of the frictional criteria in the deviatoric plane for $$ \varphi = 30^\circ $$. Drucker-Prager is matched to Mohr-Coulomb at the compression corners; Matsuoka-Nakai passes through all the corners*

## The Meridian Plane

The pressure dependence is seen most clearly in the meridian plane, which plots the deviatoric stress $$ q $$ against the mean stress $$ p $$. The Mohr-Coulomb and Drucker-Prager criteria are inclined lines whose slope is set by the friction angle, with distinct compression and extension meridians for Mohr-Coulomb. The Tresca and von Mises criteria, having no friction, are horizontal lines.

![Meridian plane of the failure criteria](/assets/figs/failure_meridian.png){: .center-image }
*Meridian plane: the frictional criteria grow with mean stress, while the cohesive (zero-friction) criteria do not*

A failure criterion fixes only *when* a soil yields. To describe *how* it deforms once yielding, the direction of the plastic strains, dilatancy, and hardening, the criterion must be combined with a flow rule and a hardening law, which together complete a constitutive model and were the subject of the remaining lectures in the course.
