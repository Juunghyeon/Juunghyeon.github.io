"""Scripted arm motion -> arm reference bridge (same shared memory 'g1_arm_ref' as xr_arm_bridge.py), robot PC 2026-11-13.

HWE2 arm-motion sessions without a headset: plays a retargeted ACCAD arm clip (the simulation comparison's motions, joints
15-28 of 'dof') as repetitions, each separated by an exact still hold at the controller's standing arm pose:

  [pre s still] then per repetition: ramp (smooth, at least --ramp s and at most --ramp_v rad/s per joint) from the standing pose to the clip's first frame, the clip at
  --speed (all of it, or at most --clip_s s), ramp back to the standing pose, then --hold s still.

deploy_real.py --init_ctrl falcon --shadow ... --fs_upper xr makes the FALCON stand follow it (filter tau 0.08 s, 1.5 rad/s per
joint); AutoStepController upper_motion={'shm': 'g1_arm_ref'} too. 'engaged' stays on for the whole sequence (the holds are exact
poses, not freezes) and is cleared at the end or on Ctrl+C / SIGTERM (the reference then freezes where it is).

  python arm_replay_bridge.py --clips <accad .pkl or .npz> --motion swing [--reps 5 --hold 4 --speed 1.0]
  python arm_replay_bridge.py --clips ... --motion swing --dry      # print the timeline and joint speeds, write nothing
"""
import argparse, os, sys, time
from pathlib import Path
import numpy as np

HERE = Path(__file__).resolve().parent; sys.path.insert(0, str(HERE))
KEYS = {'jab': '0-ACCAD_Male2MartialArtsPunches_c3d_E1 -  Jab left_poses', 'gesture': '0-ACCAD_Female1Gestures_c3d_D3 - Conversation Gestures_poses',
        'lift': '0-ACCAD_Female1General_c3d_A6 - lift box_poses', 'swing': '0-ACCAD_Male1General_c3d_General A3 - Swing Arms While Stand_poses'}   # run_ffk.sh / estcmp2 ARMS


def load_clip(path, motion):
    if str(path).endswith('.npz'):
        Z = np.load(path); return np.asarray(Z[f'{motion}_q'], float), float(Z[f'{motion}_fps'])
    import joblib
    M = joblib.load(path); m = M[KEYS.get(motion, motion)]
    return np.asarray(m['dof'], float)[:, 15:29], float(m['fps'])


def timeline(q0, clip, fps, a):
    """Reference q(t) (14) sampled at a.rate and the repetition intervals."""
    dt = 1. / a.rate; n_clip = len(clip) / fps / a.speed; dur = min(n_clip, a.clip_s) if a.clip_s > 0 else n_clip
    s_ = lambda x: .5 - .5 * np.cos(np.pi * np.clip(x, 0, 1))                 # smooth ramp
    clip_at = lambda tc: clip[min(int(tc * fps * a.speed), len(clip) - 1)] + (clip[min(int(tc * fps * a.speed) + 1, len(clip) - 1)] - clip[min(int(tc * fps * a.speed), len(clip) - 1)]) * (tc * fps * a.speed % 1)
    Q, reps, t = [], [], 0.
    for _ in range(int(a.pre / dt)): Q.append(q0)
    for k in range(a.reps):
        t0 = len(Q) * dt; qa = clip_at(0.); qb = clip_at(dur)
        ri = max(a.ramp, np.pi / 2 * np.abs(qa - q0).max() / a.ramp_v); ro = max(a.ramp, np.pi / 2 * np.abs(qb - q0).max() / a.ramp_v)   # ramp peak speed <= ramp_v
        for i in range(int(ri / dt)): Q.append(q0 + s_(i * dt / ri) * (qa - q0))
        for i in range(int(dur / dt)): Q.append(clip_at(i * dt))
        for i in range(int(ro / dt) + 1): Q.append(qb + s_(i * dt / ro) * (q0 - qb))
        reps.append((t0, len(Q) * dt))
        for _ in range(int(a.hold / dt)): Q.append(q0)
    return np.array(Q), reps


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--clips', required=True); ap.add_argument('--motion', required=True, help='jab / gesture / lift / swing or a clip key')
    ap.add_argument('--reps', type=int, default=5); ap.add_argument('--hold', type=float, default=4.); ap.add_argument('--pre', type=float, default=3.)
    ap.add_argument('--ramp', type=float, default=1., help='minimum ramp s'); ap.add_argument('--ramp_v', type=float, default=1., help='ramp peak joint speed rad/s (ramps lengthen)'); ap.add_argument('--speed', type=float, default=1.); ap.add_argument('--clip_s', type=float, default=0., help='play at most this many s of the clip per repetition (0 = the whole clip)')
    ap.add_argument('--pitch_up', type=float, default=0., help='rad subtracted from both shoulder pitches (arms forward / up; HWE2 amendment 3)'); ap.add_argument('--roll_out', type=float, default=0., help='rad added to both shoulder rolls outward (swing: 0.1, HWE2 amendment 2)'); ap.add_argument('--rate', type=float, default=50.); ap.add_argument('--dry', action='store_true')
    a = ap.parse_args()
    os.environ.setdefault('DEPLOY_IMU', 'pelvis'); os.environ.setdefault('DEPLOY_HAND', 'dex3')
    from ctrl_v2.model import Robot
    r = Robot(); q0 = np.asarray(r.qref[r.qa][15:29], float); lo, hi = r.ranges[15:29, 0], r.ranges[15:29, 1]
    clip, fps = load_clip(a.clips, a.motion)
    if a.pitch_up:                                                           # both shoulder pitches forward / up (HWE2 amendment 3: hands clear the thighs on hardware)
        clip = clip.copy(); clip[:, [0, 7]] -= a.pitch_up
    if a.roll_out:                                                           # shoulder roll outward (left +, right -): clears the hand-hip contact of the swing clip (1.7 cm in the model)
        clip = clip.copy(); clip[:, 1] += a.roll_out; clip[:, 8] -= a.roll_out
    Q, reps = timeline(q0, clip, fps, a)
    if ((Q < lo - 1e-6) | (Q > hi + 1e-6)).any(): print('[replay] WARNING: reference outside the joint range, clipped', flush=True)
    Q = np.clip(Q, lo, hi); V = np.abs(np.diff(Q, axis=0)) * a.rate
    print(f'[replay] {a.motion}: clip {len(clip) / fps:.1f} s at {fps:g} fps, speed {a.speed:g}; {a.reps} repetitions, total {len(Q) / a.rate:.0f} s; '
          f'reference joint speed max {V.max():.2f} rad/s (p99 {np.percentile(V, 99):.2f}; deploy_real limits it to 1.5)', flush=True)
    for k, (t0, t1) in enumerate(reps, 1): print(f'  rep {k}: {t0:5.1f} - {t1:5.1f} s, then {a.hold:g} s still', flush=True)
    if a.dry:
        return
    from ctrl_v2.arm_ref_shm import ArmRefWriter
    import signal; stop = {'f': False}; signal.signal(signal.SIGTERM, lambda *_: stop.__setitem__('f', True))
    w = ArmRefWriter(); dt = 1. / a.rate; t_start = time.time(); k_last = -1
    try:
        for i, q in enumerate(Q):
            if stop['f']: break
            w.write(q, True)
            k = next((j for j, (t0, t1) in enumerate(reps) if t0 <= i * dt < t1), -1)
            if k != k_last and k >= 0: print(f'[replay] rep {k + 1}/{a.reps}', flush=True)
            k_last = k
            time.sleep(max(0., t_start + (i + 1) * dt - time.time()))
        w.write(Q[min(i, len(Q) - 1)], False); print('[replay] done (released)', flush=True); time.sleep(.5)
    except KeyboardInterrupt:
        w.write(q, False); print('[replay] stopped (released, reference frozen)', flush=True); time.sleep(.5)
    finally:
        w.close()


if __name__ == '__main__':
    main()
