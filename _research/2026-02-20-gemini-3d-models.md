---
layout: post
title: "Generating 3D Soil Constitutive Models with Gemini 3.1 Pro"
date: 2026-02-20
tags: [AI, 3D Modeling, Visualization, Gemini, LLM, Geotechnical Engineering]
excerpt: "Exploring the capabilities of the newly released Gemini 3.1 Pro by generating a complex, interactive 3D visualization of soil constitutive models using Three.js and Plotly."
---

With the release of Gemini 3.1 Pro yesterday, I wanted to test its capabilities for generating complex, interactive engineering visualizations. As geotechnical engineers, we deal precisely with 3D stress states, but visualizing constitutive models like Mohr-Coulomb or Modified Cam-Clay in principal stress space is notoriously difficult to code from scratch.

I decided to see if Gemini could generate a fully functional, interactive web application to visualize these models based on natural language prompting.

## The Challenge

My goal was to create an interactive dashboard that could:
1. Render 3D yield surfaces (Mohr-Coulomb, Drucker-Prager, Tresca, Von Mises, and Modified Cam-Clay) in principal stress space using `three.js`.
2. Display rigorously accurate 2D mathematical cross-sections: the $\pi$-plane (deviatoric), the $p-q$ plane (triaxial), and the $\sigma_1 - \sigma_3$ plane using `plotly.js`.
3. Provide a user interface to dynamically adjust model parameters like cohesion ($c'$), friction angle ($\phi'$), undrained shear strength ($s_u$), or preconsolidation pressure ($p'_c$) and see the surfaces update in real-time.

## The Result

In a single interaction, Gemini 3.1 Pro produced the complete, working code for this tool. It successfully integrated TailwindCSS for the UI overlay, Three.js for the dynamic 3D canvas, and Plotly.js for the 2D contour generation. 

Most impressively, it grasped the physical and mathematical nuances of the models: it knew that Mohr-Coulomb forms an irregular hexagonal cone while Drucker-Prager acts as a smooth continuous approximation. The underlying algorithmic logic correctly implemented the mathematical yield functions for all five constitutive models, ensuring the principal stress sorting exactly resolved the vertices of the hexagons on the $\pi$-plane.

Here is the embedded result. I highly recommend dragging the 3D canvas and playing with the parameters:

<div style="position: relative; width: 100%; height: 750px; border-radius: 12px; overflow: hidden; margin: 2.5rem 0; border: 1px solid #334155; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
  <iframe src="{{ '/assets/geotech-3d.html' | relative_url }}" width="100%" height="100%" frameborder="0" loading="lazy"></iframe>
</div>

*(You can also view the full conversation and the model generation in this [shared Gemini link](https://gemini.google.com/share/cdec42be0688)).*

## Reflections on AI-Assisted Engineering Visualizations

The velocity at which complex domain knowledge can now be prototyped into software is staggering. Writing this visualization manually would require significant boilerplate and specialized multi-domain knowledge: setting up the WebGL renderer, adding the orbit controls with aligned labels, mapping the parameter sliders to the exact yield equations, and defining the contour logic.

Gemini 3.1 Pro acted less like a generic code assistant and more like a competent technical partner that deeply understood the *domain context* of geotechnical engineering. 

For engineers, this capability fundamentally alters how we communicate. Mental models and abstract equations that previously remained as static diagrams in academic papers can now be rapidly protracted into interactive, exploratory tools. AI models have matured into highly capable engines that can translate complex physical theories directly into software interfaces.
