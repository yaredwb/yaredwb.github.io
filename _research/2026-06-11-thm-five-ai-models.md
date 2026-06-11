---
layout: post
title: "One Prompt, Five AI Models: Interactive Explainers of Thermo-Hydro-Mechanical Processes"
date: 2026-06-11
tags: [AI, LLM, Visualization, THM, Porous Media, Geotechnical Engineering, Comparison]
excerpt: "I gave five frontier AI models the same one-sentence prompt: build a website explaining coupled thermo-hydro-mechanical processes in porous media, with beautiful and interactive illustrations. The results ranged from genuinely impressive to broken. All five are embedded here, with my honest assessment of each."
---

In an [earlier note](/research/gemini-3d-models/) I had a single model build an interactive visualization of soil constitutive models, and the result was good enough to make me curious: if I hand the *same* brief to several frontier models, how does the output compare? Same physics, same mathematics, same instruction to make it beautiful and interactive — five different machines doing the design, the pedagogy, and the numerics.

The subject I chose is coupled **thermo-hydro-mechanical (THM) processes in porous media** — the way heat, pore fluid, and mechanical stress interact inside soils and rocks. It is close to my own research, rich in both physics and mathematics, and genuinely hard to convey with static figures. That makes it a good stress test: a model has to understand the governing equations, invent ways to make them tangible, and write correct simulation code, all while producing something pleasant to look at.

## The prompt

Each model got exactly this, verbatim:

> Build a website that illustrates the physical and mathematical principles behind thermo-hydo-mechanical processes in porous media, including beautiful and interactive illustrations.

One sentence. No art direction, no reference design, no starter code, no follow-up corrections. Each result below is embedded exactly as produced — including bugs, where they shipped them. Click **Open interactive view** on any embed for the full-screen, fully interactive page. A practical note: these are full web applications, and they are best explored on a PC — the previews give you the idea on a phone, but the interactive views really want a large screen. What follows is my honest assessment of each, on content and on visuals.

## Claude Fable 5

The best result of the five, and it isn't particularly close. Fable 5 produced a complete, structured primer — roughly 3,000 words across a seven-part arc from "what is a porous medium" through conduction versus advection, Darcy flow, effective stress, and the coupling triangle, to the full coupled balance laws and real applications (nuclear waste disposal, geothermal energy, CO₂ storage). The equations are properly typeset and, more importantly, the interactive pieces are *actual numerical models*, not animated decoration: a porosity playground that drives Kozeny–Carman permeability, a 1-D conduction–advection solver, a Darcy column, a draggable water table feeding a stress-profile plot, a Terzaghi consolidation solver drawing isochrones and a settlement curve, and a thermal-pressurization demo. Everything ran without a single console error. Visually it is polished and coherent — a dark, confident design with clear navigation. If I'm honest, my only criticism is abundance: it reads more like a short course than a web page, and a casual visitor may not make it to the end.

{% include app-embed.html src="/assets/thm/fable5/index.html" title="Claude Fable 5 — THM·Lab" hint="Claude Fable 5 — open for the full interactive page" %}

## Claude Opus 4.8

Also a great result, with the most distinctive visual identity of the five — a serif, editorial, reference-chapter aesthetic that I found genuinely beautiful. Mathematically it is arguably the most rigorous: the full coupled system (momentum, fluid mass, and energy balance plus closure relations) is laid out cleanly, with the coupling terms highlighted in colour and each term annotated in plain language — a lovely touch. It also runs clean, with working simulations including an explicit finite-difference heat solver with presets and a proper Terzaghi consolidation widget with a play button. Where it falls a notch short of Fable 5 is the interactive layer: there is somewhat less to *do* — fewer knobs, and a couple of the demos feel more like animated illustrations than instruments to explore — and the scroll pacing leaves some large empty stretches between sections. Content and typography first, interactivity second.

{% include app-embed.html src="/assets/thm/opus48/index.html" title="Claude Opus 4.8 — THM" hint="Claude Opus 4.8 — open for the full interactive page" %}

## Gemini 3.1 Pro

This one genuinely disappointed me — all the more because the [previous experiment](/research/gemini-3d-models/) showed the same model building an excellent interactive dashboard. The cinematic landing screen is striking, but there is very little underneath it: about 400 words of content in total — three short cards for the T, H, and M "pillars" and a brief couplings section — with two sliders and not a single button on the page. Worse, it shipped broken: the math renderer is called before it loads, so every equation displays as raw `$$ \mathbf{q} = ... $$` LaTeX source, and two of the pillar cards show placeholder tofu boxes where icons should be. For a prompt that explicitly asked for the *mathematical principles*, unrendered LaTeX is a failing grade. Style over substance this time.

{% include app-embed.html src="/assets/thm/gemini31pro/index.html" title="Gemini 3.1 Pro — The Dynamics of THM" hint="Gemini 3.1 Pro — open for the full interactive page" %}

## Gemini 3.5 Flash

The surprise of the test: the lightweight Flash model clearly outperformed its bigger sibling here. It built an app-like page with a clickable coupling matrix and a proper "Simulation Lab" — three tabbed experiments (soil consolidation, thermal pressurization, thermal fracturing), each with multiple parameter sliders driving a live canvas, nine sliders in all — plus an applications section spanning geothermal systems, nuclear waste disposal, CO₂ sequestration, and subsidence. It is not without rough edges: a fair number of equations in the mathematical section also display as raw LaTeX, and one of the animations throws a (non-fatal) canvas error in the console. The polish is a tier below the Anthropic results and the prose is brief. But the ambition-to-size ratio is impressive, and on this task I would take it over 3.1 Pro without hesitation.

{% include app-embed.html src="/assets/thm/gemini35flash/index.html" title="Gemini 3.5 Flash — THM-Media" hint="Gemini 3.5 Flash — open for the full interactive page" %}

## GPT-5.5

Disappointing, though it gets one big thing right. The opening move is the best instinct on display anywhere in this test: a live coupled simulation sits directly in the hero — sliders for temperature contrast, pressure gradient, vertical load, and permeability, with toggles for heat vectors, flow paths, and the deformed mesh — so you are playing with the physics before reading a word. But that hero is essentially the whole show: it is the only canvas on the page, the total content is under 500 words, and — most damning for this particular prompt — there is no mathematical typesetting at all. The governing equations are presented as plain-text code strings (`q_T = -lambda_eff grad(T) + ...`) in monospace boxes, which reads like a placeholder rather than a finished treatment of "mathematical principles." The visual design is clean but generic. A promising sketch that needed several more iterations.

{% include app-embed.html src="/assets/thm/gpt55/index.html" title="GPT-5.5 — THM Porous Media" hint="GPT-5.5 — open for the full interactive page" %}

## Reflections

A single careless sentence produced everything from a teaching-grade interactive primer to a page that ships with its equations unrendered. That spread is the real finding. The two Anthropic models delivered work I would actually show to students, with different centres of gravity: Fable 5 optimized for completeness and live computation, Opus 4.8 for typography and mathematical exposition. The Google results inverted my expectations — the small, fast model out-built the flagship — and GPT-5.5 had the single best interaction idea of the test wrapped in the shallowest execution.

Two lessons I take from this. First, per-task variance is real: Gemini 3.1 Pro built me an excellent constitutive-model dashboard a few months ago and stumbled badly here, so a model's reputation — or even its past performance on adjacent work — doesn't guarantee the next result. Evaluate the artifact, not the brand. Second, one-shot generation still needs review: two of the five shipped visible defects that any human glance would catch. The capability ceiling is remarkable — a complete, numerically correct, well-designed explainer from one sentence — but the floor is still low enough that you cannot skip looking.
