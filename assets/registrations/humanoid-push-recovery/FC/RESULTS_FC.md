# FC: fall-criterion correction and re-scoring (registered: CRITERIA_FC.json, 2026-11-11)

## Why
Every runner had inherited from the project's first runner a stop "pelvis tilt > 0.35 rad or pelvis height < 0.5 m", counted as a fall, with no documented source.
On dev seeds 1300-1302 (lift motion + 50 N fore-aft push), the final controller hit the 0.35 rad stop 3/3 with both feet loaded and the DCM inside the support.
With the stop at 0.6 rad the same runs recovered 3/3 without a step (pelvis peak 0.37 rad). The stop is not neutral between strategies: an in-place hold may lean the trunk, while a step keeps it upright.

## Criterion
- **Fall** (first occurrence of any of):
  - a non-foot body touches the ground;
  - pelvis height < 0.5 m;
  - tilt > 1.0 rad (divergence stop only);
  - a controller error.
- **Recovered**: no fall, and standing at the end (last 0.5 s: mean pelvis height > 0.6 m and mean horizontal speed < 0.1 m/s).
- **Steps**: counted until the fall.

## Procedure
- Runs that ended on the old stop (`physical_bounds`) were re-run with permissive stops (tilt 1.2 rad, height 0.4 m), suffix `_fc`.
  - Scripts: `claude_brace/run_fcall.sh MODE=fc`, the `MT_FC` hook in `run_mt.sh`.
- All other runs were re-scored from their logs.
- `claude_brace/fc_rescore.py` writes `claude_brace/runs_fc/`. The registered analysis scripts were then run unchanged on that tree (`FC_RUNS=...`) and wrote `*_results_fc.json`.
- Factorial HFDB/HFABL (seeds 1090-1099) used the variants reported in the manuscript: B11, SME, R1i, DB, 65 re-runs.

### Reproduction check (`_rep`, original stops)
- Every experiment reproduced exactly, except one LN2D run, `mt1_SmePI_100_0.3_i+50_s1261_ln2Ix_ORd20n0`:
  - stop time 6.525 vs 6.500 s; failure type and 9 steps identical;
  - divergence began at 4.8 s, after 9 steps.
- This is reported; the outcome is the same.

## Counts (manuscript experiments, registered seed ranges; `fc_counts.json`, `fc_sens_paper.json`)
- 4372 runs re-scored.
- 40 changed failed → recovered; 22 changed recovered → failed.
  - The 22 are mostly end-state `not_standing` (NZ1, NZ2, EST1).
- MOTCI: 5 of the OURS runs changed failed → recovered (lift + forward push).

| Experiment | n | Old recovered | FC recovered | FC held |
|---|---:|---:|---:|---:|
| BUD2 | 216 | 191 | 191 | 88 |
| BUDF | 240 | 180 | 181 | 93 |
| COST1 | 348 | 330 | 330 | 214 |
| EST1 | 380 | 316 | 315 | 212 |
| EST2 | 152 | 131 | 131 | 89 |
| HFDB (B11, SME, R1i, DB) | 320 | 248 | 249 | 22 |
| HFFINAL | 848 | 680 | 689 | 353 |
| HFLAT | 192 | 167 | 170 | 94 |
| HFLAT3 | 208 | 178 | 184 | 123 |
| LAT2 | 608 | 425 | 425 | 311 |
| LN2D | 204 | 180 | 181 | 97 |
| MOTCI | 144 | 129 | 132 | 101 |
| MOTCI2 | 192 | 149 | 152 | 95 |
| NZ1 | 240 | 188 | 184 | 116 |
| NZ2 | 80 | 75 | 71 | 53 |

### Decisions
- All registered decisions are unchanged, except MOTCI M3 and M4, which were not met before and are now met:
  - M3, held: 30 vs 23, discordant 7 vs 0, p = .0078;
  - M4, recovered: 43 vs 42.
- `make_numbers.py FC=1` reports "FC changed decisions: []": every asserted decision holds.

### Factorial steps (seeds 1090-1099, 80 runs per variant, steps until the fall)

| Variant | Old steps | FC steps |
|---|---:|---:|
| B11 | 210 | 231 |
| hold layer alone (SME) | 186 | 198 |
| IMU estimate alone (R1i) | 219 | 244 |
| both (DB) | 141 | 159 |

The order is unchanged. Totals rose because failed runs now continue past 0.35 rad and step before falling.

## Sensitivity (reported, not a decision)
- Tilt stop 0.6 / 1.0 / 1.2 rad × height 0.4 / 0.5 m: counts identical.
- End speed 0.05 m/s: counts change (MOTCI, MOTCI2, HFFINAL), but all decisions are unchanged.
  - Tree: `runs_fc_v05`, results `*_fcv05.json`.
- Controller touchdown timeouts:
  - 381 runs end on one, 89 of them at tilt < 0.35.
  - They count as failures for every model-based controller alike.

## Other threshold audits (offline, `robust_holdability/estcmp3_results_*.json`)
- **Detection threshold 15 / 25 / 35 N:** the order of the estimators is unchanged.
  - Ours is faster than MOB and EMO at every threshold.
  - At 15 N, ours vs CIMU is n.s. (28.0 vs 28.3 ms, p = .09).
- **Replay noise ×2:** unchanged.
- **Replay noise "severe":** ours 21.2 N vs CIMU 21.8 N RMS (p = .2, n.s.); MOB and EMO remain slower and less accurate.
- **±0.08 tolerance:** about one 5 N step of the boundary force grid. This is stated as a fact, not as the original rationale.

## Manuscript
- `manuscript_RAL/main.tex` now uses `numbers_fc.tex` and `figures/fig_requirement_fc.pdf` (`FC=1 python3 paper_figure/make_requirement.py`).
- The original-criterion numbers stay in `numbers.tex` and `*_results.json`.

## Touchdown-timeout diagnosis (2026-11-11, exploratory)

### What the stop is
- The "touchdown timeout" is raised in `ctrl_v2/autostep.py` when the swing foot has not touched down 0.35 s after the planned landing.

### How the runs looked at the stop
- In the paper experiments, 421 runs ended this way.
- At the stop:
  - pelvis tilt, median 0.54 rad (IQR 0.37–0.71);
  - horizontal speed, median 0.63 m/s.
- Only 37 runs (9 %) were "calm" at the stop: tilt < 0.35 rad and speed < 0.3 m/s.

### Re-run with the timeout disabled
- **Which runs:** all 37 calm runs plus 40 random others (`random.seed(1)`).
- **Settings:**
  - opt-in `TD_TIMEOUT=5` (`run_mt.sh MT_FC=td`, suffix `_td`);
  - permissive stops;
  - scored with the FC criterion.
- **Result:** none of the 77 recovered.
  - 69 fell physically (calm 35, moving 34);
  - 7 ended on a tracker QP failure;
  - 1 was not standing.
- The stop therefore marks a fall in progress, not a stand that was cut short.
- Results file: `td_diag_results.json`.
