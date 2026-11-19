"""HWE2 registered analysis (experiments/recovery_authority/CRITERIA_HWE2.json, 2026-11-13): spurious external-force estimate
under the robot's own arm motion on the real G1, no push. Written and hashed before the first arm-motion session.

Input: synchronized recordings (sim2real/tools/ads1256/g1_sync_session.py) with FALCON standing and the arms teleoperated.
Motion type per recording: '<run>:<type>' on the command line, else the first of gesture / lift / jab / swing found in the
directory name (g1lc_<date>_<time>_<label>), else 'unknown'.

Per recording (lowstate decimated to 200 Hz exactly as replay_sync.base_states):
  repetition  (--window pose, amendment 4: arms away from the hold pose > 0.05 rad, see pose_windows) or (--window speed) arm joint speed norm |dq[15:29]| (both arms, 14 joints) > 0.5 rad/s, segments merged when the gap is < 0.3 s,
              window extended by 0.3 s on both sides
  exclusion   (decided without any estimate) a foot lifts in the window (foot normal force below 15 % of m g, the replay contact
              threshold; FALCON step), or the load cell (10 ms mean) exceeds 2 N in the window. The same two conditions on the
              1 s baseline before the window -> 'baseline disturbed' (a push or step there would bias the reference). A repetition
              whose baseline is not covered by a valid replay (the first 3 s of a recording) is reported as 'no baseline'
  replay      registered estimators (replay_sync._replay_window: SME, IMU-SME, CIMU, MOB, EMO; unchanged settings), one window per
              repetition from 3 s before it (2 s warm-up + 1 s baseline) to its end, overlapping windows merged, run in parallel
  metric      peak over the window of |xy estimate - median xy estimate of the 1 s before the window|, per estimator
Pooled over all recordings:
  A1 (primary)  CIMU peak > ours (IMU-SME) peak, paired one-sided Wilcoxon signed-rank, alpha 0.05; >= 20 repetitions, else
                inconclusive
  reported      per motion type medians of all five estimators; repetitions above the 25 N hold-entry threshold per estimator;
                kappa = least-squares slope (through 0) of the peak estimate against the peak horizontal arm inertial force
                m_arm |d2 c_arm / dt2| (arm + hand bodies, CoM from the measured joint angles with the pelvis fixed, Savitzky-Golay
                second derivative over 55 ms)

  env -u PYTHONPATH OPENBLAS_NUM_THREADS=1 taskset -c 16-27 python -B hw_arm_sync.py <run> [<run>[:type] ...] [--out hwe2_results.json]
"""
import os, sys, json, argparse
import numpy as np

H = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, H)
import replay_sync as RS                                                        # base_states, _replay_window (registered, hashed in HWE1)
from scipy.stats import wilcoxon
from scipy.signal import savgol_filter

NAMES = ('IMUSME', 'MOB', 'EMO', 'CIMU', 'SME')
TYPES = ('gesture', 'lift', 'jab', 'swing')
RATE, CONTACT = 200., .15                                                       # as replay_sync defaults (controller rate, deploy_real shadow contact)
ARM = slice(15, 29)                                                             # motor order: 12 legs, 3 waist, 7 left arm, 7 right arm
V_ON, MERGE, PAD, BASE, WARM = .5, .3, .3, 1., 2.                               # registered window (CRITERIA_HWE2 'window')
F_MAX, TH_ENTRY, MIN_N, ALPHA = 2., 25., 20, .05


def arm_windows(t, dq_arm, v_on=V_ON, merge=MERGE, pad=PAD):
    """[t0, t1] of every repetition: |dq_arm| > v_on, merged when the gap < merge s, extended by pad s on both sides."""
    hi = np.linalg.norm(dq_arm, axis=1) > v_on; S = []
    for i in np.flatnonzero(np.diff(np.r_[0, hi.astype(int)]) == 1):
        j = np.flatnonzero(~hi[i:]); j = i + (j[0] - 1 if len(j) else len(hi) - 1 - i)
        if S and t[i] - S[-1][1] < merge: S[-1][1] = t[j]
        else: S.append([t[i], t[j]])
    return [(a - pad, b + pad) for a, b in S]


def arm_force(t, q_arm):
    """Horizontal arm inertial force m_arm |d2 c_arm/dt2| (N) from the measured arm joint angles, pelvis fixed."""
    import mujoco
    r = RS.Robot(); m, d = r.m, r.d
    bodies = [b for b in range(m.nbody) if any(k in m.body(b).name for k in ('shoulder', 'elbow', 'wrist', 'hand'))]
    mb = m.body_mass[bodies]; ma = float(mb.sum()); q = r.qref.copy(); q[:3] = 0.; q[3:7] = [1, 0, 0, 0]; C = np.zeros((len(t), 2))
    for k in range(len(t)):
        q[r.qa[ARM]] = q_arm[k]; d.qpos[:] = q; mujoco.mj_kinematics(m, d)
        C[k] = (mb[:, None] * d.xipos[bodies, :2]).sum(0) / ma
    dt = float(np.median(np.diff(t))); n = 11 if len(t) >= 11 else (len(t) // 2) * 2 - 1
    if n < 5:
        return np.zeros(len(t)), ma
    A = savgol_filter(C, n, 3, deriv=2, delta=dt, axis=0)
    return ma * np.linalg.norm(A, axis=1), ma


def pose_windows(t, q_arm, dq_arm, dev=.05, merge=1., min_len=.5, pad=PAD):
    """Amendment 4 (scripted replay): a repetition = the arms away from their hold pose (max joint deviation > dev rad from the median
    arm pose of 0.5-2.5 s into the recording, before the replay starts), merged when the gap < merge s, at least min_len s, extended by pad s on both
    sides. The replay returns to the exact standing pose for 4 s between repetitions, so this finds one window per repetition."""
    first = (t >= t[0] + .5) & (t <= t[0] + 2.5)                                  # the replay starts >= 3 s after the recording: standing pose
    qh = np.median(q_arm[first], 0)
    hi = np.abs(q_arm - qh).max(1) > dev; S = []
    for i in np.flatnonzero(np.diff(np.r_[0, hi.astype(int)]) == 1):
        j = np.flatnonzero(~hi[i:]); j = i + (j[0] - 1 if len(j) else len(hi) - 1 - i)
        if S and t[i] - S[-1][1] < merge: S[-1][1] = t[j]
        else: S.append([t[i], t[j]])
    return [(a - pad, b + pad) for a, b in S if b - a >= min_len]


def motion_type(spec):
    run, _, ty = spec.partition(':')
    if not ty:
        ty = next((k for k in TYPES if k in os.path.basename(run.rstrip('/')).lower()), 'unknown')
    return run, ty


def analyse_run(run, ty, workers, window='pose'):
    import multiprocessing as mp
    L, fz, mono, mg = RS.base_states(run, RATE, CONTACT, verbose=False)
    R = dict(np.load(os.path.join(run, 'robot.npz')))                         # same decimation as base_states
    tick = R['tick']; idx = np.flatnonzero(np.r_[True, np.diff(tick) > 0])[::max(1, int(round(1000. / RATE)))]
    dq_arm, q_arm = R['dq'][idx][:, ARM], R['q'][idx][:, ARM]
    fpath = os.path.join(run, 'force_rezero.npz') if os.path.exists(os.path.join(run, 'force_rezero.npz')) else os.path.join(run, 'force.npz')
    f = np.load(fpath); F10 = np.convolve(f['force_N'], np.ones(75) / 75, 'same'); tF = f['t_mono']
    T0 = json.load(open(os.path.join(run, 'session.json')))['start_mono_ns'] / 1e9
    both = (fz >= CONTACT * mg).all(1)
    W = pose_windows(mono, q_arm, dq_arm) if window == 'pose' else arm_windows(mono, dq_arm)
    # replay windows: [w0 - BASE - WARM, w1], merged
    RW = []
    for w0, w1 in W:
        a = [w0 - BASE - WARM - .5, w1]                                     # amendment 5: 0.5 s margin (the 2 s warm-up is counted in ticks)
        if RW and a[0] <= RW[-1][1]: RW[-1][1] = max(RW[-1][1], a[1])
        else: RW.append(a)
    sl = [np.flatnonzero((mono >= a) & (mono <= b)) for a, b in RW]; sl = [s for s in sl if len(s) > 50]
    O = {k: np.full((len(mono), 6), np.nan) for k in NAMES}
    if sl:
        with mp.get_context('fork').Pool(max(1, min(workers, len(sl)))) as pool:
            res = pool.map(RS._replay_window, [{k: v[s] for k, v in L.items()} for s in sl])
        for s, r_ in zip(sl, res):
            ok = s[int(WARM * RATE):]                                          # valid after the warm-up
            for k in NAMES:
                O[k][ok] = r_[k][int(WARM * RATE):]
    Fa, m_arm = arm_force(mono, q_arm)
    reps = []
    for k, (w0, w1) in enumerate(W, 1):
        w = (mono >= w0) & (mono <= w1); b = (mono >= w0 - BASE) & (mono < w0)
        fw = (tF >= w0) & (tF <= w1); fb = (tF >= w0 - BASE) & (tF < w0)
        rec = dict(run=os.path.basename(run.rstrip('/')), type=ty, n=k, t0=w0 - T0, t1=w1 - T0, dur=w1 - w0,
                   vmax=float(np.linalg.norm(dq_arm[w], axis=1).max()) if w.any() else np.nan,
                   Fload_max=float(np.abs(F10[fw]).max()) if fw.any() else np.nan, F_arm=float(Fa[w].max()) if w.any() else np.nan)
        if not both[w].all(): rec['excluded'] = 'foot lift'
        elif fw.any() and np.abs(F10[fw]).max() > F_MAX: rec['excluded'] = 'load cell > 2 N'
        elif not both[b].all() or (fb.any() and np.abs(F10[fb]).max() > F_MAX): rec['excluded'] = 'baseline disturbed'
        elif b.sum() < .8 * BASE * RATE or not all(np.isfinite(O[nm][b, :2]).all() and np.isfinite(O[nm][w, :2]).all() for nm in NAMES):
            rec['excluded'] = 'no baseline'
        else:
            for nm in NAMES:
                rec[nm] = float(np.linalg.norm(O[nm][w, :2] - np.median(O[nm][b, :2], 0), axis=1).max())
        reps.append(rec)
    return reps, m_arm


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('runs', nargs='+'); ap.add_argument('--out', default='hwe2_results.json')
    ap.add_argument('--workers', type=int, default=10); ap.add_argument('--window', choices=('pose', 'speed'), default='pose', help='pose: amendment 4 (scripted replay); speed: the original registered rule')
    a = ap.parse_args()
    reps, m_arm = [], None
    for spec in a.runs:
        run, ty = motion_type(spec); r_, m_arm = analyse_run(run, ty, a.workers, a.window); reps += r_
        inc = [r for r in r_ if 'excluded' not in r]
        print(f'{os.path.basename(run.rstrip("/"))} ({ty}): {len(r_)} repetitions, {len(inc)} included')
        for r in r_:
            print(f'  {r["n"]:2d} {r["t0"]:6.1f}-{r["t1"]:6.1f} s  v {r["vmax"]:4.1f} rad/s  F_arm {r["F_arm"]:5.1f} N  load {r["Fload_max"]:4.1f} N | ' +
                  (r['excluded'] if 'excluded' in r else ' '.join(f'{nm} {r[nm]:5.1f}' for nm in NAMES)))
    S = [r for r in reps if 'excluded' not in r]
    d = np.array([r['CIMU'] - r['IMUSME'] for r in S])
    if len(d) and np.any(d):
        A1 = dict(n=int(len(d)), median_N=float(np.median(d)), cimu_higher=int((d > 0).sum()),
                  p=float(wilcoxon(d, alternative='greater').pvalue), alpha=ALPHA)
        A1['met'] = bool(A1['p'] < ALPHA) if len(d) >= MIN_N else None             # fewer than 20 repetitions: inconclusive
    else:
        A1 = dict(n=int(len(d)), met=None if len(d) < MIN_N else False)
    rep = dict(by_type={ty: dict(n=len(R_), **{nm: float(np.median([r[nm] for r in R_])) for nm in NAMES})
                        for ty in sorted({r['type'] for r in S}) for R_ in [[r for r in S if r['type'] == ty]]},
               above_entry_threshold={nm: int(sum(r[nm] > TH_ENTRY for r in S)) for nm in NAMES},
               excluded={k: sum(r.get('excluded') == k for r in reps) for k in ('foot lift', 'load cell > 2 N', 'baseline disturbed', 'no baseline')},
               m_arm_kg=m_arm)
    x = np.array([r['F_arm'] for r in S])
    rep['kappa'] = {nm: (float(np.dot(x, [r[nm] for r in S]) / np.dot(x, x)) if len(S) and np.dot(x, x) > 0 else None) for nm in NAMES}
    out = dict(criteria='CRITERIA_HWE2.json', runs=a.runs, repetitions=len(reps), included=len(S),
               decisions={'A1 (primary) peak CIMU > ours': A1}, reported=rep, per_repetition=reps)
    json.dump(out, open(a.out, 'w'), indent=1, default=float)
    print(json.dumps(dict(included=len(S), decisions=out['decisions'], reported={k: v for k, v in rep.items()}), indent=1, default=float))


if __name__ == '__main__':
    main()
