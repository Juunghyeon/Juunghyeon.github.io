---
title: "Intent-Preserving Execution of Cartesian Trajectories Under Unknown Contact Constraints"
permalink: /projects/ipcr-manipulation/
date: 2026-10-15
period: "Sep.2025 -- Present"
category: "Robot Learning · Contact-Rich Manipulation"
status: "Working paper"
group: "research"
role: "First Author"
award: "Master's Research Encouragement Grant, National Research Foundation of Korea (2025)"
skills: ["Python", "Manipulator Control", "Contact Mechanics", "Optimization"]
summary: "A framework for executing Cartesian manipulation trajectories that preserves task intent under unknown contact constraints."
icon: "hand-paper"
header:
  teaser: # /assets/images/projects/ipcr-manipulation/teaser.jpg
  image: # /assets/images/projects/ipcr-manipulation/cover.jpg
---

*Jeonghyeon Kim, Shinsuk Park (corresponding)*

## Abstract

A manipulator following a Cartesian reference built from a nominal surface model loses feasibility when the real contact geometry differs. The standard fixes — move to the nearest feasible point, or absorb the mismatch along the estimated surface normal — restore feasibility but can silently drift coordinates the task meant to keep fixed (e.g. progress along a wiping path). This work formulates **intent-preserving constraint realization (IPCR)**: the task specifies both a *yield subspace* (where the reference may deviate) and the *coordinates that must be preserved*, and the framework derives the unique realization — and the execution-level controller — that satisfies both, with closed-form guarantees.

## Method

- **Target-level realization.** Given a yield subspace 𝒟 and preserved coordinates y = Lx (with LD = 0), proved the unique feasible point that keeps y unchanged exists and has maximal invariance (Theorem 1) — for affine constraints directly, and for nonlinear ones via a Newton iteration that preserves Lx at every step (Theorem 3)
- **Drift of the usual approach.** Derived the exact drift of the conventional nearest-feasible realization relative to IPCR, in closed form via the principal angles between the constraint normals and the yield direction (Theorem 2)
- **Execution-level condition.** Derived the exact null-space requirement on a servo's absorption subspace, 𝒩<sub>e</sub> ⊆ ker L, under which residual constraint mismatch leaves the preserved coordinates untouched regardless of its size (Theorem 4)
- **Controller.** Built an IPCR-compatible single-contact controller that separates the *execution yield direction* from the *physical force direction* — conventional hybrid control conflates both into the same estimated surface normal
- **Validation.** 15,000 random numerical cases for the theorems; pre-registered experiments on a simulated torque-controlled manipulator with proprioception only, plus a stress test and a curved-constraint boundary test

## Results

- On unseen contact constraints, the same geometry produced different, correctly predicted realizations for different tasks
- The executed leak matched the theoretical transfer **G(Ñ)** quantitatively as the absorption subspace was varied, vanishing exactly where the execution-level condition holds
- A pre-registered replication on further unseen constraints reproduced the result
- A stress test with an oracle-normal intervention isolated high-friction degradation as a contact-geometry *estimation* effect, not a framework failure

## Skills

`Python` `Manipulator Control` `Contact Mechanics` `Optimization`
