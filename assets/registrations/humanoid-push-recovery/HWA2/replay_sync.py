"""Offline estimator replay on a synchronized G1 + load-cell recording (sim2real/tools/ads1256/g1_sync_session.py), 2026-11-13.

The deploy_real SHADOW log stops while FALCON steps (a foot unloaded), so most strong pushes have no estimate there. The
synchronized recording keeps the full 1 kHz lowstate. This script rebuilds the controller's base state from it and runs the
registered estimators of the simulation comparison (estcmp2.replay: SME, IMU-SME, CIMU, tuned MOB; emo: EMO) causally:
  - lowstate decimated to --rate (default 200 Hz, the controller rate); IMU heading removed (deploy_real.deyaw)
  - base pose/velocity: ctrl_v2.model.ContactEstimator with the execution env of the run (RA_VEL_CF, RA_V_LP), anchors set
    from the first sample as AutoStepController.reanchor does
  - contacts: deploy_real.foot_normal_forces (leg torque estimates) >= --contact of m g per foot (deploy_real's shadow uses 15 %)
Output: <run>/estimators.npz with t_mono (same clock as force.npz), the six-axis estimates per estimator, act, foot fz.

  env -u PYTHONPATH python -B replay_sync.py ../../sim2real/logs/sync/g1lc_<time>_<label>
"""
import os, sys, json, argparse, copy
import numpy as np

H = os.path.dirname(os.path.abspath(__file__))
WB = os.path.abspath(os.path.join(H, '..', '..')); CB = os.path.join(WB, 'experiments', 'claude_brace')
os.environ.setdefault('DEPLOY_HAND', 'dex3'); os.environ.setdefault('DEPLOY_IMU', 'pelvis')
for k, v in dict(RA_VEL_CF='2', RA_V_LP='15').items():                       # execution env of the S21a shadow runs (base velocity filters)
    os.environ.setdefault(k, v)
sys.path[:0] = [CB, WB, H]
_src = open(os.path.join(H, 'estcmp2.py')).read(); _src = _src[:_src.index('\ncells = [')].replace("assert hashlib.sha256(raw_c.encode())", "(lambda *a: None)(raw_c.encode())  #")
exec(compile(_src, 'estcmp2.py', 'exec'))                                       # E, replay, emo, K
_aff = os.sched_getaffinity(0)                                                  # deploy_real pins itself to the P-cores 0-15 at import (the
argv, sys.argv = sys.argv, ['x']; import deploy_real as D; sys.argv = argv      # controller cores on the robot PC); an offline replay must stay
os.sched_setaffinity(0, _aff)                                                   # where it was started (taskset -c 16-27)
from ctrl_v2.model import Robot, ContactEstimator
from sim2real.robot_io.lowstate_reader import LowStateSnapshot
from scipy.spatial.transform import Rotation


def reanchor(est, r, s):
    """AutoStepController.reanchor for the estimator only: feet where they really are, centred on the nominal stance."""
    q = r.qref.copy(); v = np.zeros(r.m.nv); q[:3] = 0.; q[3:7] = [1, 0, 0, 0]; q[r.qa] = np.asarray(s.q, float); r.set(q, v)
    rel = r.d.site_xmat[r.imu].reshape(3, 3).copy(); Rimu = Rotation.from_quat(np.asarray(s.quat_wxyz, float)[[1, 2, 3, 0]]).as_matrix()
    q[3:7] = Rotation.from_matrix(Rimu @ rel.T).as_quat()[[3, 0, 1, 2]]; r.set(q, v)
    P = np.array([r.foot(i)[0] for i in range(2)]); init = np.array(r.initial_feet)
    est.anchors = P + np.r_[init[:, :2].mean(0) - P[:, :2].mean(0), init[:, 2].min() - P[:, 2].min()]


def push_windows(run, pre=3., post=1., on=8., quiet=10.):          # pre = 2 s warm-up + 1 s pre-push baseline
    """[t0, t1] (monotonic s) around every load-cell push (10 ms mean > on N), merged, plus the longest quiet stretch (<= quiet s)."""
    f = np.load(os.path.join(run, 'force_rezero.npz') if os.path.exists(os.path.join(run, 'force_rezero.npz')) else os.path.join(run, 'force.npz'))
    t, F = f['t_mono'], np.convolve(f['force_N'], np.ones(75) / 75, 'same'); hi = F > on
    W = []
    for i in np.flatnonzero(np.diff(hi.astype(int)) == 1):
        j = np.flatnonzero(~hi[i + 1:]); j = i + 1 + (j[0] if len(j) else len(F) - i - 2)
        w = [t[i] - pre, t[j] + post]
        if W and w[0] <= W[-1][1]: W[-1][1] = max(W[-1][1], w[1])
        else: W.append(w)
    gaps = [(W[k][1], W[k + 1][0]) for k in range(len(W) - 1)] + ([(t[0], W[0][0])] if W else [(t[0], t[-1])])
    g = max(gaps, key=lambda x: x[1] - x[0])
    if g[1] - g[0] > 3.:
        W.append([g[0], min(g[1], g[0] + quiet + pre)])
    return sorted(W)


def base_states(run, rate=200., contact=.15, verbose=True):
    """Controller-side base state from robot.npz: (L for estcmp2.replay, foot fz [N], t_mono [s], m g [N])."""
    R = dict(np.load(os.path.join(run, 'robot.npz')))                         # load once (indexing an npz decompresses the whole array each time)
    step = max(1, int(round(1000. / rate)))
    tick = R['tick']; keep = np.r_[True, np.diff(tick) > 0]                    # drop repeated ticks
    idx = np.flatnonzero(keep)[::step]
    snap = lambda i: LowStateSnapshot(recv_time=float(R['state_recv_time'][i]), tick=int(tick[i]), q=R['q'][i], dq=R['dq'][i], tau_est=R['tau_est'][i],
                                      quat_wxyz=R['quat_wxyz'][i], gyro=R['gyro'][i], acc=R['acc'][i])
    r = Robot(); est = ContactEstimator(r); fzm = Robot(); mg = float(fzm.mass) * 9.81
    s0 = snap(idx[0]); yaw0 = D.imu_yaw(s0.quat_wxyz); reanchor(est, r, D.deyaw(s0, yaw0))
    n = len(idx); L = dict(t=np.zeros(n), tick=np.zeros(n, int), qhat=np.zeros((n, r.m.nq)), vhat=np.zeros((n, r.m.nv)), tau_all=np.zeros((n, 29)),
                           acc=np.zeros((n, 3)), gyro=np.zeros((n, 3)), act=np.zeros((n, 2)), quat=np.zeros((n, 4)))
    fz = np.zeros((n, 2)); mono = R['state_recv_time'][idx]
    for j, i in enumerate(idx):
        s = D.deyaw(snap(i), yaw0)
        fz[j] = D.foot_normal_forces(fzm, s); act = fz[j] >= contact * mg
        if not act.any(): act = fz[j] >= fz[j].max()                           # never 'flight' for the estimator: keep the loaded foot
        q, v = est.estimate(s, act)
        L['t'][j] = tick[i] * 1e-3; L['tick'][j] = tick[i]; L['qhat'][j] = q; L['vhat'][j] = v; L['tau_all'][j] = np.asarray(s.tau_est, float)[:29]
        L['acc'][j] = s.acc; L['gyro'][j] = s.gyro; L['act'][j] = act; L['quat'][j] = s.quat_wxyz
        if verbose and j % 4000 == 0:
            print(f'  base state {j}/{n}', flush=True)
    L['tau'] = L['tau_all'][:, :12]
    return L, fz, mono, mg


def _replay_window(Lw):
    O = replay(Lw); O['EMO'] = emo(O['SME'], Lw['t'], json.load(open(os.path.join(H, 'estcmp2_results.json')))['EMO_r'])
    return {k: np.asarray(v) for k, v in O.items()}


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('run'); ap.add_argument('--rate', type=float, default=200.)
    ap.add_argument('--contact', type=float, default=.15, help='foot load (fraction of m g) for an active contact')
    ap.add_argument('--full', action='store_true', help='replay every tick in one pass (slow); default: push windows in parallel')
    ap.add_argument('--workers', type=int, default=10); ap.add_argument('--out', default='estimators.npz'); ap.add_argument('--on', type=float, default=8., help='load-cell level (N, 10 ms mean) that opens a replay window')
    ap.add_argument('--pre', type=float, default=3., help='s before a push (2 s of it is warm-up)'); ap.add_argument('--post', type=float, default=1.)
    a = ap.parse_args()
    L, fz, mono, mg = base_states(a.run, a.rate, a.contact)
    n = len(mono)
    print(f'{n} ticks at {1 / np.median(np.diff(L["t"])):.0f} Hz; single support {(L["act"].sum(1) < 2).mean() * 100:.1f} % of ticks; running estimators ...', flush=True)
    if a.full:
        O = _replay_window(L); win = np.ones(n, bool)
    else:                                                                      # independent windows (2 s warm-up each) in parallel
        import multiprocessing as mp
        W = push_windows(a.run, pre=a.pre, post=a.post, on=a.on); sl = [np.flatnonzero((mono >= w0) & (mono <= w1)) for w0, w1 in W]; sl = [s_ for s_ in sl if len(s_) > 50]
        print(f'  {len(sl)} windows, {sum(len(s_) for s_ in sl)} of {n} ticks, {min(a.workers, len(sl))} workers', flush=True)
        with mp.get_context('fork').Pool(min(a.workers, len(sl))) as pool:
            res = pool.map(_replay_window, [{k: v[s_] for k, v in L.items()} for s_ in sl])
        O = {k: np.full((n, 6), np.nan) for k in res[0]}; win = np.zeros(n, bool)
        for s_, r_ in zip(sl, res):
            for k in O:
                O[k][s_] = r_[k]
            win[s_[int(2. * a.rate):]] = True                                 # valid after the warm-up
        for k in O:
            O[k][~win] = np.nan
    np.savez_compressed(os.path.join(a.run, a.out), t_mono=mono, t_tick=L['t'], act=L['act'], foot_fz=fz, mg=mg, valid=win,
                        **{k: np.asarray(v) for k, v in O.items()})
    print('saved', os.path.join(a.run, a.out), 'estimators:', sorted(O))


if __name__ == '__main__':
    main()
