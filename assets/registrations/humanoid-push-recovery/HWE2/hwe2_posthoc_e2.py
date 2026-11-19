"""Exploratory: E2 arm-motion peaks at latency-matched bandwidth (IMU-SME/CIMU first-order K', MOB registered)."""
import os, sys, json, numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import hwe2_posthoc_lib as P
HA, RS, E = P.HA, P.RS, P.E
KS = [float(x) for x in os.environ.get('KS', '100,25').split(',')]
def filt(X, t, K):
    Y = np.zeros_like(X); y = np.zeros(X.shape[1])
    for i in range(1, len(X)): a = min(K * (t[i] - t[i - 1]), 1.); y = y + a * (X[i] - y); Y[i] = y
    return Y
def job(Lw):
    E.K = 1e9; raw = P.replay_var(Lw, ''); O = RS._replay_window(Lw); return raw, O['MOB']
def run(rd):
    import multiprocessing as mp
    L, fz, mono, mg = RS.base_states(rd, 200., HA.CONTACT, verbose=False)
    R = dict(np.load(os.path.join(rd, 'robot.npz'))); tick = R['tick']; idx = np.flatnonzero(np.r_[True, np.diff(tick) > 0])[::5]
    dq_arm, q_arm = R['dq'][idx][:, HA.ARM], R['q'][idx][:, HA.ARM]
    both = (fz >= HA.CONTACT * mg).all(1); W = HA.pose_windows(mono, q_arm, dq_arm)
    sel = []
    for k, (w0, w1) in enumerate(W, 1):
        a = np.flatnonzero((mono >= w0 - HA.BASE - HA.WARM - .5) & (mono <= w1)); m = mono[a] if len(a) else None
        if len(a) < 100: continue
        w = (m >= w0) & (m <= w1); b = (m >= w0 - HA.BASE) & (m < w0)
        if not both[a][w].all() or b.sum() < 160: continue
        sel.append((k, a, w, b))
    with mp.get_context('fork').Pool(4) as pool: res = pool.map(job, [{kk: v[a] for kk, v in L.items()} for _, a, _, _ in sel])
    rows = []
    for (k, a, w, b), (raw, mob) in zip(sel, res):
        t = L['t'][a]; pk = lambda X: round(float(np.linalg.norm(X[w, :2] - np.median(X[b, :2], 0), axis=1).max()), 1)
        r = dict(run=os.path.basename(rd)[-28:], n=k, MOB=pk(mob))
        for K in KS: r[f'ours_K{int(K)}'] = pk(filt(raw['IMUSME'], t, K)); r[f'cimu_K{int(K)}'] = pk(filt(raw['CIMU'], t, K))
        rows.append(r); print(json.dumps(r), flush=True)
    return rows
if __name__ == '__main__':
    rows = []
    for rd in sys.argv[1:]: rows += run(rd)
    from scipy.stats import wilcoxon
    print('n', len(rows), 'median', {k: round(float(np.median([r[k] for r in rows])), 1) for k in rows[0] if k not in ('run', 'n')})
    for K in KS:
        o = np.array([r[f'ours_K{int(K)}'] for r in rows]); c = np.array([r[f'cimu_K{int(K)}'] for r in rows]); mb = np.array([r['MOB'] for r in rows])
        print(f'K{int(K)}: ours<MOB {(o<mb).sum()}/{len(o)} p {wilcoxon(mb-o, alternative="greater").pvalue:.2g} | ours<CIMU {(o<c).sum()}/{len(o)} p {wilcoxon(c-o, alternative="greater").pvalue:.2g}')
