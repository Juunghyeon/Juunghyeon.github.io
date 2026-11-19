"""HWL1 registered analysis (CRITERIA_HWL1, from sim2real/criteria_drafts/CRITERIA_HWL1_DRAFT.json): latency budget on the real G1.
Written by the robot PC 2026-11-16 before any counted push; hashed at registration.

Input: synchronized recordings (g1_sync_session.py), one per block, label 'hwl1_L<ms>_b<k>' (L = 0, 20, 40: RA_EST_DELAY in ms);
optional deploy_real logs (json or .part.pkl) found automatically in experiments/claude_brace/real_logs by time overlap.

Per push (load cell 10 ms mean > 8 N, re-contacts within 0.3 s merged), decided from the load cell and contact state only:
  direction (amendment 3) counted only if the kinematic CoM excursion (joint angles + IMU, mid-feet frame, max over onset..end+0.2 s vs
            onset-0.2 s) is mainly lateral (|dy| >= |dx|); not from the estimate or the outcome
  shape     plateau P = median force between the first and last 50 %-of-peak crossings ... iterated once with 50 % of the median;
            duration D = time between those 50 % crossings, counted iff 0.35 <= D <= 0.65 s; rise 10-90 % of P < 0.15 s
  quiet     the 3 s before onset: load cell < 2 N from onset - 3 s to onset - 0.3 s (CRITERIA_HWL1 amendment 2: the window ended 0.02 s
            before onset, where a fast push itself already exceeds 2 N), both feet loaded (>= 15 % m g), no guard / DAMP
Outcome within 3 s of onset: failed if a foot load stays < 5 % m g for >= 0.1 s (step or lift; hold-first keeps >= 10 % per foot and
  the torque-based load dips below 5 % for <= 25 ms on held taps, real steps 240-290 ms), tilt change > 0.35 rad,
  or a guard / stop: lowcmd leg kp drops to 0 (DAMP) within 3 s, or the deploy rows leave RUN (HOLD / DAMP); otherwise held.
Boundary: common-slope logistic regression held ~ plateau (one intercept per level, maximum likelihood); F50(L) = intercept_L / slope;
  r20 = F50(20) / F50(0), r40 = F50(40) / F50(0); 95 % CI by parametric bootstrap (2000 refits, outcomes redrawn at the measured forces).
Amendment 5 (2026-11-18): recordings started after AMEND5_WALL count pushes of 0.25-1.2 s with a 10-90 % rise < 0.5 s; the fit adds a
  common log(duration / 0.5 s) term and reports F50 at 0.5 s; earlier recordings keep the registered shape window.
Decisions: L1-a r40 upper 95 % bound < 1; L1-b |r20 - 0.927| <= 0.08 and |r40 - 0.859| <= 0.08.
Reported: counted pushes and reversals per level (outcome changes in push order), reversal-mean boundary (mean plateau at the last 6
  reversals), hold-first entry latency (first est_on after onset minus the load-cell 25 N and 50 % crossings, when deploy rows exist).

  env -u PYTHONPATH python -B hwl1_analyze.py <run> [<run> ...] [--out hwl1_results.json] [--boot 2000]
"""
import os, sys, re, json, glob, pickle, argparse
import numpy as np

H = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, H)
import replay_sync as RS                                                        # deploy_real.foot_normal_forces, Robot (same model as closedloop_sync)
from sim2real.robot_io.lowstate_reader import LowStateSnapshot
from scipy.optimize import minimize
from scipy.spatial.transform import Rotation

ON, MERGE, CONTACT, WIN, TILT = 8., .3, .15, 3., .35
TILT = float(np.radians(8.)); KNEE_MIN = .6   # amendment 7: near-falls caught by the harness without a guard stop (tilt rise 9-15 deg, knees 0.4 rad) were 'held' with 0.35 rad
LIFT_FZ, LIFT_MIN = .05, .1                                                       # lift = a foot < 5 % m g for >= 0.1 s. Hold-first keeps >= 10 % per foot and
# the torque-based load then dips to 3-7 % for <= 25 ms (robot PC 2026-11-16: held taps <= 25 ms below 5 %, real steps 240-290 ms)
DUR, RISE, QUIET_F, QUIET_END = (.35, .65), .15, 2., .3   # QUIET_END: amendment 2 (was 0.02 s)
DUR5, RISE5, AMEND5_WALL = (.25, 1.2), .5, 1794994875   # amendment 5: wider hand-push shape for recordings started after the registration (wall s)
D_REF = .5                                                   # amendment 5: F50 reported at a 0.5 s push (log-duration covariate)
PRED = {20: .927, 40: .859}; BAND = .08
OMEGA = 3.8                                                  # G1 LIPM rate (1/s), as the predictions
LOGS = os.path.join(H, '..', 'claude_brace', 'real_logs')


def level_of(run):
    m = re.search(r'hwl1_L(\d+)', os.path.basename(run.rstrip('/')))
    if not m:
        raise SystemExit(f'{run}: label must contain hwl1_L<ms>_b<k>')
    return int(m.group(1))


def deploy_rows(t0, t1, wall0, dur):
    """RUN-relevant rows (mono, mode, est_on) of the deploy log overlapping [t0, t1]; [] if none. Candidates: logs whose name stamp
    (local wall time of the process start / of the json dump) lies within 2 h before to 10 min after the recording."""
    import datetime
    best = []
    def stamp_ok(f):
        m_ = re.search(r'_(\d{8}_\d{6})', os.path.basename(f))
        if not m_: return False
        w = datetime.datetime.strptime(m_.group(1), '%Y%m%d_%H%M%S').timestamp()
        return wall0 - 7200 <= w <= wall0 + dur + 600
    cands = [f for f in sorted(glob.glob(os.path.join(LOGS, 'R2_*.part.pkl')) + glob.glob(os.path.join(LOGS, 'R2_*.json'))) if stamp_ok(f)]
    cands = [f for f in cands if f.endswith('.pkl')] + [f for f in cands if f.endswith('.json') and not os.path.exists(f.replace('.json', '.part.pkl'))]
    for f in cands:
        rows = []
        try:
            if f.endswith('.pkl'):
                with open(f, 'rb') as fh:
                    while True:
                        try: rows += pickle.load(fh)
                        except EOFError: break
                        except Exception: break
            else:
                rows = json.load(open(f))['rows']
        except Exception:
            continue
        rows = [r for r in rows if r.get('mono') is not None]
        if rows and rows[0]['mono'] <= t1 and rows[-1]['mono'] >= t0 and len(rows) > len(best):
            best = rows
    return [(r['mono'], r['mode'], bool((r.get('hold') or {}).get('est_on'))) for r in best]


def pushes(tF, F):
    hi = F > ON; up = np.flatnonzero(np.diff(hi.astype(int)) == 1); dn = np.flatnonzero(np.diff(hi.astype(int)) == -1); P = []
    for i in up:
        j = dn[dn > i]; j = j[0] if len(j) else len(F) - 1
        if P and tF[i] - P[-1][1] < MERGE: P[-1] = (P[-1][0], tF[j], P[-1][2], j); continue
        P.append((tF[i], tF[j], i, j))
    return P


def shape(tF, F, i, j):
    seg = slice(max(i - 375, 0), min(j + 375, len(F))); t, f = tF[seg], F[seg]
    pk = f.max(); half = .5 * pk
    for _ in range(2):
        above = np.flatnonzero(f > half)
        a, b = above[0], above[-1]; P = float(np.median(f[a:b + 1])); half = .5 * P
    above = np.flatnonzero(f > .5 * P); a, b = above[0], above[-1]
    r10 = np.flatnonzero(f > .1 * P)[0]; r90 = np.flatnonzero(f > .9 * P)[0]
    return P, float(t[b] - t[a]), float(t[r90] - t[r10]), float(t[a])


def analyse_run(run):
    L = level_of(run); s = json.load(open(os.path.join(run, 'session.json'))); T0 = s['start_mono_ns'] / 1e9
    fp = os.path.join(run, 'force_rezero.npz') if os.path.exists(os.path.join(run, 'force_rezero.npz')) else os.path.join(run, 'force.npz')
    fz_ = np.load(fp); tF = fz_['t_mono']; F = np.convolve(fz_['force_N'], np.ones(75) / 75, 'same')
    R = dict(np.load(os.path.join(run, 'robot.npz'))); ts = R['state_recv_time']; tc = R['cmd_recv_time']; kp = R['cmd'][:, :12, 2].mean(1)
    m = RS.Robot(); mg = m.mass * 9.81
    def fz_at(i):
        sn = LowStateSnapshot(recv_time=0., tick=int(R['tick'][i]), q=R['q'][i], dq=R['dq'][i], tau_est=R['tau_est'][i], quat_wxyz=R['quat_wxyz'][i], gyro=R['gyro'][i], acc=R['acc'][i])
        return RS.D.foot_normal_forces(m, sn)
    tilt = np.arccos(np.clip(Rotation.from_quat(R['quat_wxyz'][:, [1, 2, 3, 0]]).apply([0, 0, 1])[:, 2], -1, 1))
    rows = deploy_rows(T0, s['stop_mono_ns'] / 1e9, s['start_wall_ns'] / 1e9, s['duration_s']); rm = np.array([r[0] for r in rows]); rmode = np.array([r[1] for r in rows]); reo = np.array([r[2] for r in rows])
    def com_xy(i):                                                              # amendment 3: kinematic CoM relative to the mid-feet point, heading frame
        qq = m.qref.copy(); qq[:3] = 0.; qq[3:7] = R['quat_wxyz'][i]; qq[m.qa] = R['q'][i]; m.set(qq, np.zeros(m.m.nv))
        c_ = m.d.subtree_com[1].copy(); pf_ = [m.foot(k_)[0] for k_ in range(2)]; mid_ = .5 * (pf_[0] + pf_[1]); d_ = pf_[0] - pf_[1]
        yaw_ = np.arctan2(d_[1], d_[0]) - np.pi / 2; cy_, sy_ = np.cos(yaw_), np.sin(yaw_); r_ = (c_ - mid_)[:2]
        return np.array([cy_ * r_[0] + sy_ * r_[1], -sy_ * r_[0] + cy_ * r_[1]])   # x = forward of the feet line, y = along it (left)
    out = []
    for k, (t0, t1, i, j) in enumerate(pushes(tF, F), 1):
        P, D, rise, t50 = shape(tF, F, i, j)
        wq = (ts >= t0 - 3) & (ts < t0 - .02); wf = (tF >= t0 - 3) & (tF < t0 - QUIET_END)   # amendment 2
        iq = np.flatnonzero(wq)[::20]; fzq = np.array([fz_at(x) for x in iq]) if len(iq) else np.zeros((0, 2))
        quiet = bool(wf.any() and np.abs(F[wf]).max() < QUIET_F and len(iq) and (fzq >= CONTACT * mg).all() and t0 - 3 >= ts[0]
                     and not ((tc >= t0 - 3) & (tc < t0) & (kp < 1)).any() and not (len(rm) and ((rm >= t0 - 3) & (rm < t0) & (rmode != 'RUN')).any()))
        i0_ = int(np.searchsorted(ts, t0 - .2)); iw_ = np.flatnonzero((ts >= t0) & (ts <= t1 + .2))[::10]   # amendment 3: push direction from the kinematic
        dv_ = np.array([com_xy(x_) - com_xy(i0_) for x_ in iw_]) if len(iw_) and i0_ < len(ts) else np.zeros((1, 2))   # CoM excursion (load cell / contact only, no estimate)
        ex_ = dv_[int(np.argmax(np.linalg.norm(dv_, axis=1)))]; lateral = bool(abs(ex_[1]) >= abs(ex_[0]))
        new5_ = s['start_wall_ns'] / 1e9 >= AMEND5_WALL; DW_, RW_ = (DUR5, RISE5) if new5_ else (DUR, RISE)
        seg_ = slice(i, j + 1); imp_ = float(np.trapz(np.clip(F[seg_], 0., None), tF[seg_]))   # amendment 6 (reported only): impulse of the push (N s)
        delta_ = float(np.trapz(np.clip(F[seg_], 0., None) * np.exp(OMEGA * (tF[j] - tF[seg_])), tF[seg_]) / (m.mass * OMEGA))   # LIPM DCM shift, CoP fixed (m)
        side_ = 'L' if ex_[1] < 0 else 'R'                                         # pushed on the robot's left side -> CoM moves to -y (right)
        ir_ = np.flatnonzero((ts >= t1) & (ts <= t1 + 1.5))[::20]                  # release rebound: CoM travel back past its start, toward the pusher
        rb_ = max((float(-np.sign(ex_[1]) * (com_xy(x_) - com_xy(i0_))[1]) for x_ in ir_), default=0.) if abs(ex_[1]) > 1e-6 else 0.
        counted = quiet and DW_[0] <= D <= DW_[1] and rise < RW_ and lateral
        ww = np.flatnonzero((ts >= t0) & (ts <= t0 + WIN))[::5]
        fzw = np.array([fz_at(x) for x in ww]) if len(ww) else np.zeros((0, 2))
        lo_ = (fzw < LIFT_FZ * mg) if len(fzw) else np.zeros((0, 2), bool); run_, best_ = np.zeros(2), 0.
        for row_ in lo_:
            run_ = np.where(row_, run_ + 1, 0); best_ = max(best_, run_.max())
        lift = bool(best_ * 5 * np.median(np.diff(ts)) >= LIFT_MIN); tl = bool(len(ww) and (np.abs(tilt[ww] - np.median(tilt[np.flatnonzero(wq)])) > TILT).any()) if wq.any() else False
        damp = bool(((tc >= t0) & (tc <= t0 + WIN) & (kp < 1)).any()); left_run = bool(len(rm) and ((rm >= t0) & (rm <= t0 + WIN) & (rmode != 'RUN')).any())
        ended = bool(tc[-1] < t0 + WIN)                                         # the stream stopped (e-stop / process end) inside the window
        knee = bool(len(ww) and (R['q'][ww][:, [3, 9]].min() < KNEE_MIN))           # amendment 7: legs straightened (no-step stance knees 0.86-1.2 rad)
        held = not (lift or tl or damp or left_run or ended or knee)
        t25 = tF[i:j + 1][np.argmax(F[i:j + 1] > 25)] if (F[i:j + 1] > 25).any() else np.nan
        ie = np.flatnonzero((rm >= t0 - .05) & (rm <= t1) & reo) if len(rm) else []
        te = rm[ie[0]] if len(ie) else np.nan
        out.append(dict(run=os.path.basename(run.rstrip('/')), L=L, n=k, t=t0 - T0, plateau=P, dur=D, rise=rise, quiet=quiet, counted=counted, shape_rule=('amendment 5' if new5_ else 'registered'), lateral=lateral, impulse=imp_, delta_dcm=delta_, side=side_, rebound=rb_, shape_registered=bool(DUR[0] <= D <= DUR[1] and rise < RISE), block=(re.search(r'_b(\d+)', os.path.basename(run.rstrip('/'))).group(1) if re.search(r'_b(\d+)', os.path.basename(run.rstrip('/'))) else ''), com_exc=[round(float(ex_[0]), 4), round(float(ex_[1]), 4)],
                        held=held, lift=lift, tilt=tl, knee=knee, damp=damp, left_run=left_run, ended=ended,
                        entry_after_25N_ms=(te - t25) * 1e3 if np.isfinite(te) and np.isfinite(t25) else np.nan,
                        entry_after_50pct_ms=(te - t50) * 1e3 if np.isfinite(te) else np.nan))
    return out


def fit(Fv, y, lv, levels, Dv=None):
    """Common-slope logistic: logit P(held) = a_L - b F (- c log(D / D_REF) with the amendment-5 duration covariate); F50_L = a_L / b."""
    X = np.stack([lv == l for l in levels], 1).astype(float)
    ld = np.zeros(len(Fv)) if Dv is None else np.log(np.asarray(Dv, float) / D_REF); nc = 0 if Dv is None else 1
    def nll(th):
        z = X @ th[:len(levels)] - th[len(levels)] * Fv - (th[-1] * ld if nc else 0.); return np.sum(np.logaddexp(0, z) - y * z)
    s0 = 5. / (2 * np.log(9)); th0 = np.r_[[np.median(Fv) / s0] * len(levels), 1 / s0, [0.] * nc]
    r = minimize(nll, th0, method='BFGS')
    a, b = r.x[:len(levels)], r.x[len(levels)]
    return dict(zip(levels, a / b)), r.x, X


def lin(th, X, Fv, Dv, nl):
    z = X @ th[:nl] - th[nl] * Fv
    return z - th[-1] * np.log(np.asarray(Dv, float) / D_REF) if len(th) > nl + 1 else z


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('runs', nargs='+'); ap.add_argument('--out', default='hwl1_results.json'); ap.add_argument('--boot', type=int, default=2000)
    ap.add_argument('--seed', type=int, default=0)
    a = ap.parse_args()
    P = [p for run in a.runs for p in analyse_run(run)]
    for p in P:
        print(f"{p['run'][14:]:28s} #{p['n']:2d} {p['t']:6.1f}s L{p['L']:2d} plateau {p['plateau']:5.1f} N dur {p['dur']:.2f} rise {p['rise']:.2f} "
              f"{'COUNT' if p['counted'] else ('quiet-no' if not p['quiet'] else ('dir-no' if not p.get('lateral', True) else 'shape-no'))} | {'held' if p['held'] else 'FAILED'} | CoM exc x %+.3f y %+.3f" % tuple(p['com_exc'])
              + ('' if p['held'] else f" ({','.join(k for k in ('lift', 'tilt', 'knee', 'damp', 'left_run', 'ended') if p[k])})"))
    C = [p for p in P if p['counted']]; levels = sorted({p['L'] for p in C})
    res = dict(criteria='CRITERIA_HWL1.json', runs=a.runs, pushes=P, counted=len(C))
    rep = {}
    for l in levels:
        S = [p for p in C if p['L'] == l]; seq = [p['held'] for p in S]; rv = [i for i in range(1, len(seq)) if seq[i] != seq[i - 1]]
        last = [S[i]['plateau'] for i in rv[-6:]]
        e25 = [p['entry_after_25N_ms'] for p in S if np.isfinite(p['entry_after_25N_ms'])]; e50 = [p['entry_after_50pct_ms'] for p in S if np.isfinite(p['entry_after_50pct_ms'])]
        rep[l] = dict(counted=len(S), held=int(sum(seq)), reversals=len(rv), reversal_mean_N=float(np.mean(last)) if last else None,
                      entry_after_25N_ms_median=float(np.median(e25)) if e25 else None, entry_after_50pct_ms_median=float(np.median(e50)) if e50 else None)
    res['per_level'] = rep
    if levels and 0 in levels and len(levels) > 1 and len({p['held'] for p in C}) == 2:
        Fv = np.array([p['plateau'] for p in C]); y = np.array([p['held'] for p in C], float); lv = np.array([p['L'] for p in C])
        Dv = np.array([p['dur'] for p in C]); F50, th, X = fit(Fv, y, lv, levels, Dv)   # amendment 5: log-duration covariate
        rng = np.random.default_rng(a.seed); B = {l: [] for l in levels}
        pr = 1 / (1 + np.exp(-lin(th, X, Fv, Dv, len(levels))))
        for _ in range(a.boot):
            yb = (rng.random(len(y)) < pr).astype(float)
            try: Fb, _, _ = fit(Fv, yb, lv, levels, Dv)
            except Exception: continue
            for l in levels: B[l].append(Fb[l])
        B = {l: np.array(v) for l, v in B.items()}
        ratios = {}
        for l in levels:
            if l == 0: continue
            rb = B[l] / B[0]; rb = rb[np.isfinite(rb)]
            ratios[l] = dict(r=float(F50[l] / F50[0]), ci95=[float(np.percentile(rb, 2.5)), float(np.percentile(rb, 97.5))], pred=PRED.get(l))
        res['F50_N'] = {l: float(v) for l, v in F50.items()}; res['F50_ci95'] = {l: [float(np.percentile(B[l], 2.5)), float(np.percentile(B[l], 97.5))] for l in levels}
        res['ratios'] = ratios
        dec = {}
        if 40 in ratios: dec['L1-a r40 upper 95 % < 1'] = dict(upper=ratios[40]['ci95'][1], met=bool(ratios[40]['ci95'][1] < 1))
        if 20 in ratios and 40 in ratios:
            dec['L1-b |r - exp(-omega L)| <= 0.08'] = dict(r20=ratios[20]['r'], r40=ratios[40]['r'], met=bool(abs(ratios[20]['r'] - PRED[20]) <= BAND and abs(ratios[40]['r'] - PRED[40]) <= BAND))
        res['decisions'] = dec
        print(json.dumps(dict(F50=res['F50_N'], ratios=ratios, decisions=dec), indent=1, default=float))
    else:
        print('logistic fit needs L = 0 and another level with both outcomes; per level:', json.dumps(rep, default=float))
    json.dump(res, open(a.out, 'w'), indent=1, default=float)


if __name__ == '__main__':
    main()
