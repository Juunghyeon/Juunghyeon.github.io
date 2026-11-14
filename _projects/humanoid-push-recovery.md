---
title: "Hold Before You Step: The Information Requirement of In-Place Push Recovery on Force-Sensorless Humanoids"
permalink: /projects/humanoid-push-recovery/
date: 2026-11-05
period: "2026"
category: "Humanoid Robotics · Disturbance Estimation"
status: "Manuscript in Preparation"
role: "First Author"
group: "research"
summary: "Measures how fast and how accurately a force-sensorless humanoid must know a push to hold it in place instead of stepping, then designs the estimator and the controller's signal paths by that requirement."
skills: ["Python", "MuJoCo", "Model Predictive Control", "State Estimation"]
icon: "walking"
links:
  - label: "Video"
    url: "#video"
header:
  teaser: /assets/images/projects/humanoid-push-recovery/teaser.png
  image: # /assets/images/projects/humanoid-push-recovery/cover.jpg
---

<style>
.hb-media { margin: 1.4em 0 0.4em; }
.hb-media video, .hb-media img { width: 100%; display: block; border-radius: 4px; }
.hb-cap { font-size: 0.82em; opacity: 0.72; line-height: 1.5; margin: 0.5em 0 1.6em; }
.hb-wide { width: min(calc(100vw - 32px), 1080px); position: relative; left: 50%; transform: translateX(-50%); }
.hb-table { font-size: 0.88em; width: 100%; border-collapse: collapse; margin: 0.6em 0 0.4em; display: table; }
.hb-table th, .hb-table td { padding: 0.35em 0.6em; border-bottom: 1px solid rgba(127,127,127,0.25); text-align: right; }
.hb-table th:first-child, .hb-table td:first-child { text-align: left; }
.hb-note { font-size: 0.85em; opacity: 0.8; }
</style>

*Jeonghyeon Kim, Jaesang Kim, Shinsuk Park*

<div class="hb-media" id="video">
  <video controls preload="metadata" playsinline poster="{{ '/assets/videos/humanoid-push-recovery/poster.jpg' | relative_url }}">
    <source src="{{ '/assets/videos/humanoid-push-recovery/hold-before-you-step.mp4' | relative_url }}" type="video/mp4">
    <track kind="subtitles" srclang="en" label="English" src="{{ '/assets/videos/humanoid-push-recovery/hold-before-you-step.en.vtt' | relative_url }}">
  </video>
</div>
<p class="hb-cap">Narrated overview (2.5 min). Robot scenes are logged runs on a simulated Unitree G1 (MuJoCo); the hardware results are estimator tests only.</p>

<div class="hb-media hb-wide">
  <a href="{{ '/assets/images/projects/humanoid-push-recovery/overview.png' | relative_url }}"><img src="{{ '/assets/images/projects/humanoid-push-recovery/overview.png' | relative_url }}" alt="Overview: the same 70 N push makes the stepping baseline step while our controller holds; holdable force falls with the hold-start latency; the estimate uses the pelvis IMU and the 12 leg joints."></a>
</div>
<p class="hb-cap"><b>(a)</b> The same 70 N lateral push (registered run, same seed): our controller entered an ankle-priority hold 10 ms after onset and did not step; the stepping baseline lifted a foot after 85 ms. Both recovered on all four seeds of this condition. <b>(b)</b> Holdable force when the hold starts <i>L</i> after onset, relative to <i>L</i> = 0: pendulum model (line, band ±0.08) and measured boundaries. <b>(c)</b> The estimate resolves the pelvis IMU through the floating-base model using the 12 leg joints. Simulated Unitree G1.</p>

## Abstract

In-place push recovery preserves a humanoid's task stance, but depends on timely and accurate disturbance information. Without force/torque sensors, this information must be estimated. We measure this information requirement on a simulated Unitree G1 by supplying a fixed hold-or-step controller with the true push force, delayed and corrupted. The force that can be held falls by about 3.7 % per 10 ms of delay, the initial rate of a pendulum model, and actuation delay draws on the same budget; slow errors of 30 N are tolerated, but 20 N errors on the time scale of the push are not. The requirement selects an estimate that resolves the pelvis inertial measurement unit (IMU) through the floating-base model instead of differentiating a reconstructed base velocity. In closed loop, hold-entry latency predicted the normalised holdable force within 0.02 for three of four estimators; the fourth lost fore-aft holds to a wrong-sign transient in the push band. With signal paths designed to meet this requirement, the controller met its pre-registered recovery criterion against a stepping baseline (65 against 62 of 80 runs recovered) with 49 % fewer steps and, on holdable pushes both recovered, 96 % less base displacement. On the real G1, our estimate's median half-rise delay relative to a load cell was 29 ms, compared with 57 ms for a momentum observer.

## Contributions

- **The requirement.** The holdable force falls at the initial rate of a pendulum model, about 3.7 % per 10 ms of delay, and actuation delay draws on the same budget. Slow errors of 30 N are tolerated; errors of 20 N on the time scale of the push are not.
- **An estimate that meets it.** Resolving the pelvis IMU through the floating-base model avoids differentiating a reconstructed base velocity and needs no upper-body torques. In closed loop, hold-entry latency predicted the normalised holdable force within 0.02 for three of four estimators.
- **Design by the requirement.** Path-specific latency and filtering reduce recovery steps and base displacement while meeting the pre-registered recovery criterion against a stepping baseline.

The goal is the requirement and its use, not maximal push recovery. The hold-first controller is assembled from existing components and serves as the test bed.

## The information requirement

<div class="hb-media hb-wide">
  <a href="{{ '/assets/images/projects/humanoid-push-recovery/requirement.png' | relative_url }}"><img src="{{ '/assets/images/projects/humanoid-push-recovery/requirement.png' | relative_url }}" alt="Information requirement and estimators: holds versus delay and noise, one latency budget, error tolerance by time scale, estimator noise at equal latency, and closed-loop holdable force versus hold-entry latency."></a>
</div>
<p class="hb-cap"><b>(a)</b> Pushes held without a step when the true push force reaches the hold decision delayed by <i>L</i> and with white noise σ (12 near-boundary pushes per cell). <b>(b)</b> Holdable force relative to no delay versus the total of command and information delay (608 runs). <b>(c)</b> Holds under injected errors of different correlation times (240 runs). <b>(d)</b> Quiet-stance noise versus detection latency over each estimator family's tuning range (55 logs). <b>(e)</b> Closed-loop holdable force against the prediction from hold-entry latency (380 runs).</p>

- With ideal information, the controller held 10 of 12 near-boundary pushes in place; a delay of 10 ms left 10, and 20 ms reduced them to 3.
- A boundary search matched the pendulum ratio within ±0.08 at 20 and 40 ms in both directions; with four delays, the test supports the **initial rate**, not the exponential form.
- Delaying the joint commands cost as much holdable force as an equal information delay: information and actuation share one budget.
- With a 2 kg hand load, an arm swing or both, the normalised holdable force matched the prediction in all 24 checks (1200 runs).

## Results (simulation, pre-registered)

<table class="hb-table">
  <thead><tr><th>Controller (80 paired runs, 50–80 N)</th><th>Recovered</th><th>Zero-step</th><th>Steps</th></tr></thead>
  <tbody>
    <tr><td><b>Ours</b></td><td><b>65</b></td><td><b>30</b></td><td><b>117</b></td></tr>
    <tr><td>Baseline (stepping MPC)</td><td>62</td><td>0</td><td>228</td></tr>
    <tr><td>Predicted-instability step rule (Li 2025)</td><td>65</td><td>13</td><td>165</td></tr>
    <tr><td>Capture point + velocity rule (Meng 2025)</td><td>51</td><td>32</td><td>120</td></tr>
    <tr><td>0-step capture gate</td><td>48</td><td>32</td><td>151</td></tr>
    <tr><td>Ours, momentum observer</td><td>63</td><td>10</td><td>181</td></tr>
  </tbody>
</table>
<p class="hb-note">Literature rules: our implementations of the cited step triggers on our hold layer and information paths, not the published controllers. Registered pass criteria: at most 4 fewer recovered runs of the 80 and at most 80 % of the steps (pass criteria, not a statistical non-inferiority test).</p>

- Our controller **met the pre-registered recovery criterion** against the stepping baseline (65 vs 62 recovered), held 30 pushes in place against none, and took 49 % fewer steps. On the runs both recovered (post hoc), it took 34 against 89 steps.
- With the tuned momentum observer in place of our estimate, the same controller met the recovery criterion but took 181 instead of 117 steps and held 10 instead of 30 pushes in place.
- Under own arm motion and hand loads: with a 2 kg hand load during four arm motions, ours held 30 of 48 runs with a 50 N push in place, against one for the baseline.
- **Cost of recovery.** On holdable pushes (30–50 N) that both controllers recovered, ours held 59 of 60 in place against 12, and reduced base displacement by 96 %, peak foot force by 44 % and leg mechanical work by 69 %.

## Hardware (real Unitree G1)

The completed hardware tests evaluate the **estimators**; the controller comparisons above are simulation results. The robot stood in a gantry, with a learned policy keeping it standing and moving its arms while our estimators ran in shadow (computed, not commanded).

- **E1: response to a load cell (pre-registered, 71 hand pushes of 16–45 N).** Our estimate's median half-rise delay was 29 ms, against 57 ms for a momentum observer; ours was earlier in 60 of 69 pushes.
- **E2: own arm motion (pre-registered).** The simulated advantage over the centroidal estimate was not reproduced at the registered bandwidth (median peak 43 vs 40 N). Post hoc, at matched latency, the peak was 16.6 N for ours, 18.6 N for the momentum observer and 19.3 N for the centroidal estimate.
- Holding in place, stepping and the latency budget have **not yet been evaluated on the robot**. Hardware video: to be added.

## Limitations

- The requirement is controller-dependent: it was measured on one hold-first controller.
- The error tests injected exogenous error into the true force; a real estimate's error is endogenous. A closed-loop error map is future work.
- All simulated pushes lasted 0.2 s; longer pushes were not tested.
- Estimate-driven decisions are restricted to the fixed-contact hold phase; their use during stepping was not evaluated.

## Skills

`Python` `MuJoCo` `Model Predictive Control` `State Estimation`
