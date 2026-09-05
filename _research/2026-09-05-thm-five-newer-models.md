---
layout: post
title: "Same Prompt, Five Newer AI Models: The THM Explainer Test, Three Months On"
date: 2026-09-05
tags: [AI, LLM, Visualization, THM, Porous Media, Geotechnical Engineering, Comparison]
excerpt: "In June I gave five frontier models one sentence: build a website explaining coupled thermo-hydro-mechanical processes in porous media, with beautiful and interactive illustrations. Since then every lab has shipped a new generation. Here are Claude Opus 5, Claude Fable 5.1, GPT-6, GPT-5.6 and Gemini 3.8 Flash on the same unchanged prompt, embedded as produced, with my honest assessment of each and of what changed since June."
---

In June I gave five frontier models the same one-sentence brief, to build a website explaining coupled thermo-hydro-mechanical (THM) processes in porous media with beautiful and interactive illustrations, and wrote up [the results](/research/thm-five-ai-models/). The spread was the finding: a teaching-grade primer at one end, unrendered equations at the other. Since then every lab in that test has shipped at least one new generation, so I ran the same sentence again, unchanged, through Claude Opus 5, Claude Fable 5.1, GPT-6, GPT-5.6 and Gemini 3.8 Flash. This is my second round: each result embedded as produced, my assessment of each, and then the comparison I find more interesting, each model against its own predecessor.

## The prompt

The same sentence as in June, typo included:

> Build a website that illustrates the physical and mathematical principles behind thermo-hydo-mechanical processes in porous media, including beautiful and interactive illustrations.

The same rules too: one shot, no art direction, no starter code, no follow-up corrections. The results are embedded as produced, bugs included. The one liberty I took is that GPT-5.6 and GPT-6 returned Vite projects rather than static files, so I ran their build step with the base path needed to host them here and changed nothing else. Click **Open interactive view** on any embed for the full page. As before, these are full web applications and are best explored on a PC; the previews give you the idea on a phone, but the interactive views really want a large screen.

## Claude Opus 5

For me this is the best result of the round, and the biggest leap from a predecessor. In June, Opus 4.8 gave me a single, beautifully typeset reference page; Opus 5 built me a nine-chapter site of close to 10,000 words that opens with the line "Soil and rock are a three-body problem" and then earns it: an overview with a coupling map, the porous medium, hydraulics, heat transport, poromechanics, the assembled coupled system, a chapter on numerics, a 2-D reservoir sandbox, and a reference chapter with nomenclature and property ranges. What impressed me most is that the figures are *actual solvers*, and it tells you which: Richards' equation with the mass-conservative Picard scheme of Celia et al. for infiltration, Horton–Rogers–Lapwood convection cells by successive over-relaxation, Mandel's problem with the eigenvalues found by bisection and the Mandel–Cryer overshoot on display, a small P1–P1 finite-element assembly that shows spurious pressure oscillations and then stabilises them, the four sequential splitting schemes, and a geothermal doublet on a finite-difference grid where I can drag the wells and watch the Coulomb stress halo grow around the cooled volume. It came with a README listing the method behind every figure, a licence, light and dark themes, KaTeX vendored so it works offline, and I did not see a single console error. My criticisms are the ones I would make of a textbook: it is long, the chapter navigation hides most of it from a casual visitor, and I find the serif interface quiet to the point of being shy. None of that stopped me from putting it online as a standalone site at [thm-interactive.yaredwb.com](https://thm-interactive.yaredwb.com/); I liked it that much.

{% include app-embed.html src="/assets/thm/opus5/index.html" title="Claude Opus 5, Porous Media / THM" hint="Claude Opus 5, open for the full interactive site" %}

## Claude Fable 5.1

Fable 5 won the June round for me on completeness, and 5.1 keeps the completeness while changing the temperament: THM·Lab was a dark, app-like page, and "Heat, Water, Stress" is a light, editorial primer with a sidebar, serif body text, eight numbered sections and about 3,500 words, all in one HTML file. I like the organising idea a lot: a reference-material selector in the sidebar (Opalinus Clay, Boom Clay, Berea sandstone, dense sand, granite) that every instrument on the page reads from, so when I switch the Terzaghi figure from clay to sand the settlement clock collapses from years to seconds. The instruments are many and small rather than few and large: an REV explorer where I drag a sampling window over a grain packing and watch the porosity scatter converge, a Darcy column, a Péclet-number profile, a Mohr circle under pore pressure, a clickable coupling triangle with a table of all six couplings and their typical strength, the full Biot-type balances with hoverable colour-coded terms, Terzaghi isochrones, the undrained pressurisation coefficient across the five materials, the Booker–Savvidou point heat source, an explicit finite-difference heater in saturated ground with groundwater flow, and a diffusion-time-against-length chart that explains in one picture why clay pressurises and sand does not. It even closes with eight numbered references, Terzaghi 1923 to Rutqvist 2001, which I did not expect from a one-sentence prompt. Everything rendered and nothing threw. One caveat I have to make, though: I ran this one through Claude Code, and its Artifact skill interfered with the work, imposing its own design guidance and page format on the output. So what I got is the model plus a harness rather than the bare one-shot the others got, and I think Fable 5.1 could have done better without that interference. Even so, this is the page I would hand a student first: one page instead of Opus 5's nine, better referenced and more careful than Fable 5, and, to my eye, a little less dramatic to look at.

{% include app-embed.html src="/assets/thm/fable51/index.html" title="Claude Fable 5.1, Heat, Water, Stress" hint="Claude Fable 5.1, open for the full interactive page" %}

## GPT-6

OpenAI's flagship took the opposite road from Anthropic's: less text, more engineering. "Strata" is a React and TypeScript app whose hero is a Three.js grain pack I can drag to rotate, with flow particles threading the pores and loading arrows pressing down, and toggles to isolate the thermal, hydraulic or mechanical part of the picture; the playground below couples five sliders and four material presets to the 3-D view, a profile plot and live readouts of Darcy flux and volume change. To me it is the most production-minded build in either round: fonts bundled, a static fallback without WebGL, reduced-motion respected, and, uniquely in this series, unit tests, seven checks on limits and units that all pass when I run them. I also appreciate the candour: a model-notes dialog says the sample is a steady 1-D illustration with prescribed linear profiles and that the app does not solve the coupled transient equations. But that candour names my problem with it. The mathematical principles my prompt asked for come to Fourier, Darcy and Biot effective stress, nicely typeset in KaTeX, plus their conservation statements; there is no assembled coupled system, no consolidation, no thermal pressurisation, and about 1,100 words of prose. Nor is it bug-free: the strata illustrations in the applications section build an SVG path with a missing separator, so my console filled with errors even though the page renders around them. Beautifully made, and for me the physics is the garnish.

{% include app-embed.html src="/assets/thm/gpt6/index.html" title="GPT-6, Strata" hint="GPT-6, open for the full interactive page" %}

## GPT-5.6

I tested this one in August, between the two rounds. GPT-5.5 had the best single idea of June, a live coupled simulation in the hero, and the shallowest execution. GPT-5.6 keeps the design-first instinct and moves it to React: a cream-and-coral "field guide" with an editorial italic that opens on a reservoir explorer drawn as a geological cross-section, with an injection well, a thermal front, three sliders (temperature, pore pressure, confining stress), three presets (cold injection, heat storage, deep production) and readouts of effective stress, thermal strain and a viscosity factor. The four-step "follow one cold-water pulse" walkthrough, inject, unload, contract, re-route, is the best bit of pedagogy in it for me, and I like that the equation lab lets me click any term of the mass, energy and momentum balances for a plain-language explanation. Two things hold it back in my view. It still does not typeset mathematics: the equations are Unicode strings, better than 5.5's monospace code boxes but still a placeholder next to KaTeX. And nothing is simulated: everything is SVG, and each readout is one line of algebra on the slider values, so the explorer illustrates rather than computes. Under a thousand words, no errors, very handsome. A brochure, and I say that with some affection.

{% include app-embed.html src="/assets/thm/gpt56/index.html" title="GPT-5.6, THM Field Guide" hint="GPT-5.6, open for the full interactive page" %}

## Gemini 3.8 Flash

Gemini 3.5 Flash was my surprise of June, out-building its bigger sibling, and 3.8 Flash doubles down on the recipe: a dark "Scientific Lab" with eight tabs and the longest feature list of any result in either round. A clickable coupling triangle with a detail card per pathway, a formula inspector where hovering a term gives its meaning, units and typical magnitude, a 1-D coupled consolidation-and-heating column solved in real time, a 2-D playground where I paint heat sources, injection, loads and barriers onto a grid and watch tracer particles respond, a Mohr–Coulomb induced-seismicity simulator, a KBS-3 repository timeline, case studies, a dimensionless-number sandbox, and, I am not making this up, sound effects. And once again it shipped broken. The maths renderer is only pointed at a few containers, so the inline LaTeX in the section introductions and the coupling cards appears as raw source, dollar signs and all; the two equation boxes in the coupling card were empty when the page loaded for me; and the consolidation column reported its surface displacement as NaN from the first frame. The prose (about 1,700 words) is breathless in a way I find tiring: "catastrophic shear rupture occurs!" My June verdict stands: the most ambition per kilobyte of any model I have tested, and the least quality control.

{% include app-embed.html src="/assets/thm/gemini38flash/index.html" title="Gemini 3.8 Flash, THM Porous Media" hint="Gemini 3.8 Flash, open for the full interactive page" %}

## Then and now

Side by side, the five new results look like this. Word counts are approximate, from the rendered text.

| Model | Stack | Prose | Typesetting | Live figures | Defects seen |
|---|---|---|---|---|---|
| Claude Opus 5 | Plain HTML and JS, nine pages, KaTeX vendored | 9,700 words | KaTeX | about twenty solvers | none |
| Claude Fable 5.1 | One HTML file, MathJax from a CDN | 3,500 words | MathJax | 19 canvases, 18 sliders | none |
| GPT-6 | React, TypeScript, Vite, Three.js, KaTeX | 1,100 words | KaTeX with MathML | one 3-D scene, one steady model | malformed SVG path |
| GPT-5.6 | React, TypeScript, Vite | 900 words | none, Unicode text | none, SVG illustrations | none |
| Gemini 3.8 Flash | Plain HTML, modular JS, KaTeX from a CDN | 1,700 words | KaTeX, partial | 5 canvases, 12 sliders | raw LaTeX, empty equation boxes, NaN readout |

The comparison I find more telling is each model against its own predecessor.

| Lab | June | September | What changed |
|---|---|---|---|
| Anthropic, Fable | Fable 5: dark seven-part explainer, seven live demos, clean | Fable 5.1: light editorial primer, a dozen instruments driven by a material selector, references, clean | Same completeness, calmer design, more scholarly |
| Anthropic, Opus | Opus 4.8: one serif reference page, rigorous equations, few knobs, clean | Opus 5: nine chapters, about twenty solvers, README and licence, clean | The largest jump of any model |
| OpenAI | GPT-5.5: one canvas, plain-text equations, under 500 words | GPT-5.6: React field guide, Unicode equations, no simulation. GPT-6: React and Three.js, KaTeX, unit tests, a steady 1-D model | Design and engineering up sharply, physics still thin |
| Google | Gemini 3.5 Flash: three tabbed labs, some raw LaTeX, one canvas error | Gemini 3.8 Flash: eight labs, sound effects, raw LaTeX, empty equation boxes, a NaN readout | More features, same defects |

## Reflections

A single sentence produced, again, everything from a graduate primer to a page with NaN in its readout. But the spread moved. In June two of my five results were visibly broken; this time one is, and a second has an error only the console sees, while the two Anthropic models were clean both times. That is progress. The defects that remain, unrendered LaTeX, a NaN, a malformed path, are still the kind I notice in the first minute and a model apparently does not; GPT-6's own test suite passed while its diagrams threw errors. One-shot output still needs a look from me.

The finding I did not expect is how stable each lab's house style is. Hand the same sentence to three labs and you get three genres, and the genres survived a generation. Anthropic writes textbooks with instruments in them; Fable and Opus differ in length and temperament, but both treat the physics as the product. OpenAI builds products with the physics as a garnish; 5.5, 5.6 and 6 are one lineage, each better designed and better engineered than the last, none of them getting past the constitutive laws. Google builds dashboards, with the most features and the most bugs, twice running. Since that held across two generations I do not think it is noise, and it changes how I would prompt: choosing the model is now choosing the genre, and if I want a Three.js grain pack from Claude or a Mandel–Cryer benchmark from GPT, my sentence has to say so.

My lesson from June was to evaluate the artifact, not the brand. It still holds for me. What is new is that one of the artifacts was good enough to keep: the Opus 5 primer is now a site of its own, the first time one of these one-sentence experiments has ended for me with "publish" rather than "interesting".
