"""Exploratory (2026-11-14): which input path makes the IMU-resolved estimates spike under own arm motion on the real G1 (HWE2)?
Re-runs IMU-SME and CIMU on the HWE2 recordings with one input low-passed at a time (first-order, FC Hz):
gyro derivative (g), accelerometer (a), joint accelerations from differenced velocities (q), leg torques (t), all (gaqt).
Windows, baseline and peak metric as hw_arm_sync (pose windows, 1 s baseline median, peak |xy - baseline|)."""
import os, sys, json, numpy as np
RH = '/home/jh/FALCON-BD/wt_hold/experiments/robust_holdability'; sys.path.insert(0, RH); os.chdir(RH)
import hw_arm_sync as HA
RS = HA.RS; E = RS.E
FC = float(os.environ.get('FC', 10.))
VARIANTS = ('', 'g', 'a', 'q', 't', 'gaqt')

def lp(x, prev, al):
    return x if prev is None else prev + al * (x - prev)

def replay_var(L, var):
    import mujoco
    n = len(L['t']); out = {k: np.zeros((n, 6)) for k in ('IMUSME', 'CIMU')}; y = {k: np.zeros(6) for k in out}
    st = dict(g=None, a=None, q=None, t=None)
    for i in range(1, n):
        dt = L['t'][i] - L['t'][i - 1]
        if dt <= 0: out['IMUSME'][i] = y['IMUSME']; out['CIMU'][i] = y['CIMU']; continue
        al = min(E.K * dt, 1.); alf = min(2 * np.pi * FC * dt, 1.)
        qj = np.zeros(E.NV); qj[6:] = (L['vhat'][i, 6:] - L['vhat'][i - 1, 6:]) / dt; gd = (L['gyro'][i] - L['gyro'][i - 1]) / dt
        acc = L['acc'][i].copy(); tau = L['tau'][i].copy()
        if 'g' in var: st['g'] = gd = lp(gd, st['g'], alf)
        if 'a' in var: st['a'] = acc = lp(acc, st['a'], alf)
        if 'q' in var: st['q'] = qj = lp(qj, st['q'], alf)
        if 't' in var: st['t'] = tau = lp(tau, st['t'], alf)
        E.df.qpos[:] = L['qhat'][i]; E.df.qvel[:] = L['vhat'][i]; mujoco.mj_forward(E.mf, E.df)
        qB = qj.copy(); qB[:6] = E.base_from_imu(qj, gd, acc); q0 = np.zeros(E.NV); qC = q0.copy(); qC[:6] = E.base_from_imu(q0, gd, acc)
        for k_, qa in (('IMUSME', qB), ('CIMU', qC)):
            w = E.wrench(L['qhat'][i], L['vhat'][i], qa, tau, L['act'][i]); y[k_] += al * (w - y[k_]); out[k_][i] = y[k_]
    return out

def job(args):
    Lw, var = args; return var, replay_var(Lw, var)

def run(rd):
    import multiprocessing as mp
    L, fz, mono, mg = RS.base_states(rd, HA.RATE, HA.CONTACT, verbose=False)
    R = dict(np.load(os.path.join(rd, 'robot.npz'))); tick = R['tick']; idx = np.flatnonzero(np.r_[True, np.diff(tick) > 0])[::5]
    dq_arm, q_arm = R['dq'][idx][:, HA.ARM], R['q'][idx][:, HA.ARM]
    both = (fz >= HA.CONTACT * mg).all(1); W = HA.pose_windows(mono, q_arm, dq_arm)
    Fa, _ = HA.arm_force(mono, q_arm)
    gyr = np.r_[np.zeros((1, 3)), np.diff(L['gyro'], axis=0) / np.maximum(np.diff(L['t'])[:, None], 1e-4)]
    rows = []
    for k, (w0, w1) in enumerate(W, 1):
        a = np.flatnonzero((mono >= w0 - HA.BASE - HA.WARM - .5) & (mono <= w1))
        if len(a) < 100: continue
        Lw = {kk: v[a] for kk, v in L.items()}; m = mono[a]
        with mp.get_context('fork').Pool(4) as pool:
            res = dict(pool.map(job, [(Lw, v) for v in VARIANTS]))
        w = (m >= w0) & (m <= w1); b = (m >= w0 - HA.BASE) & (m < w0)
        if not both[a][w].all() or b.sum() < 100: continue
        r = dict(run=os.path.basename(rd), n=k, Farm=float(Fa[(mono >= w0) & (mono <= w1)].max()),
                 gd_rms_motion=float(np.sqrt((np.linalg.norm(gyr[a][w], axis=1) ** 2).mean())), gd_rms_base=float(np.sqrt((np.linalg.norm(gyr[a][b], axis=1) ** 2).mean())),
                 dt_jitter_ms=float(np.std(np.diff(Lw['t'])) * 1e3))
        for v in VARIANTS:
            for nm in ('IMUSME', 'CIMU'):
                X = res[v][nm]; r[f'{nm}_{v or "base"}'] = float(np.linalg.norm(X[w, :2] - np.median(X[b, :2], 0), axis=1).max())
        rows.append(r); print(json.dumps({kk: (round(vv, 1) if isinstance(vv, float) else vv) for kk, vv in r.items()}), flush=True)
    return rows

if __name__ == '__main__':
    runs = json.load(open('/home/jh/FALCON-BD/wt_hold/sim2real/robot_pc_reports/2026-11-13/hwe2_results.json'))['runs']
    base = '/home/jh/FALCON-BD/wt_hold/sim2real/robot_pc_reports/2026-11-13'
    allr = []
    for rd in runs:
        p = os.path.normpath(os.path.join(base, rd)) if not os.path.isabs(rd) else rd
        if not os.path.exists(p): p = os.path.normpath(os.path.join(RH, rd))
        allr += run(p)
    json.dump(allr, open(os.path.join(RH, 'hwe2_posthoc_paths.json'), 'w'), indent=1)
    print('n', len(allr))
    for nm in ('IMUSME', 'CIMU'):
        print(nm, {v or 'base': round(float(np.median([r[f'{nm}_{v or "base"}'] for r in allr])), 1) for v in VARIANTS})
    print('gyro-derivative RMS motion/base median', round(float(np.median([r['gd_rms_motion'] / max(r['gd_rms_base'], 1e-9) for r in allr])), 2))
