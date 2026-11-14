# claude -p로 고정 질문을 네 조건(일반/간결/dandap/chodandap)에서 반복 실행해 출력 토큰을 비교하는 측정 스크립트.
"""
사용법:
  python3 bench/measure.py --out <결과.jsonl> [--reps 3] [--workers 4] [--cwd <빈 디렉터리>]
  python3 bench/measure.py --summarize <결과.jsonl>

- 각 실행은 `claude -p <prompt> --tools "" --no-session-persistence --output-format json`이다.
- dandap hook의 상태 파일은 DANDAP_STATE_DIR(기본: <out>.state/)로 분리해 실제 세션 기록과 섞지 않는다.
- 이미 기록된 (condition, qid, rep)은 건너뛰므로 중단 후 다시 실행할 수 있다.
"""
import argparse
import json
import os
import statistics
import subprocess
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor

QUESTIONS = [
    "파이썬에서 리스트와 튜플의 차이는?",
    "React 컴포넌트가 불필요하게 다시 렌더링되는 이유와 해결법은?",
    "git rebase와 merge는 각각 언제 쓰나?",
    "HTTP 401과 403의 차이는?",
    "DB 커넥션 풀은 왜 쓰나?",
    "\"TypeError: Cannot read properties of undefined (reading 'map')\" 원인과 해결법은?",
    "Docker 이미지 크기를 줄이는 방법은?",
    "인덱스를 걸었는데 쿼리가 느린 이유는?",
    "async/await와 Promise.then의 차이는?",
    "비밀 키를 환경 변수로 관리할 때 주의할 점은?",
]

CONDITIONS = {
    "normal": lambda q: q,
    "concise": lambda q: f"{q} 간결하게 답해줘.",
    "dandap": lambda q: f"/dandap {q}",
    "chodandap": lambda q: f"/chodandap {q}",
}


def run_one(condition, qid, rep, cwd, state_dir):
    prompt = CONDITIONS[condition](QUESTIONS[qid])
    env = {**os.environ, "DANDAP_STATE_DIR": state_dir}
    started = time.time()
    for attempt in range(2):
        try:
            proc = subprocess.run(
                ["claude", "-p", prompt, "--tools", "", "--no-session-persistence", "--output-format", "json"],
                cwd=cwd, env=env, stdin=subprocess.DEVNULL, capture_output=True, text=True, timeout=300,
            )
            data = json.loads(proc.stdout)
            if data.get("is_error"):
                raise RuntimeError(str(data.get("result"))[:200])
            usage = data.get("usage") or {}
            return {
                "condition": condition, "qid": qid, "rep": rep,
                "output_tokens": usage.get("output_tokens"),
                "result_chars": len(data.get("result") or ""),
                "cost_usd": data.get("total_cost_usd"),
                "duration_s": round(time.time() - started, 1),
                "session_id": data.get("session_id"),
                "result": data.get("result"),
            }
        except Exception as e:  # 재시도 1회 후 실패로 기록한다.
            error = f"{type(e).__name__}: {e}"
    return {"condition": condition, "qid": qid, "rep": rep, "error": error}


def measure(args):
    cwd = os.path.abspath(args.cwd)
    os.makedirs(cwd, exist_ok=True)
    state_dir = os.path.abspath(args.out + ".state")
    done = set()
    if os.path.exists(args.out):
        for line in open(args.out, encoding="utf-8"):
            r = json.loads(line)
            if "error" not in r:
                done.add((r["condition"], r["qid"], r["rep"]))
    jobs = [(c, q, r) for r in range(args.reps) for q in range(len(QUESTIONS)) for c in CONDITIONS
            if (c, q, r) not in done]
    print(f"실행 대상 {len(jobs)}건 (완료 {len(done)}건 건너뜀)", flush=True)
    lock = threading.Lock()
    count = [0]

    def task(job):
        res = run_one(*job, cwd, state_dir)
        with lock:
            with open(args.out, "a", encoding="utf-8") as f:
                f.write(json.dumps(res, ensure_ascii=False) + "\n")
            count[0] += 1
            tag = res.get("error") or f"{res['output_tokens']} tok"
            print(f"[{count[0]}/{len(jobs)}] {job[0]} q{job[1]} r{job[2]}: {tag}", flush=True)

    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        list(ex.map(task, jobs))


def summarize(path):
    rows = [json.loads(l) for l in open(path, encoding="utf-8")]
    ok = [r for r in rows if "error" not in r and r.get("output_tokens") is not None]
    errors = [r for r in rows if "error" in r]
    by = {c: [r["output_tokens"] for r in ok if r["condition"] == c] for c in CONDITIONS}
    base = {c: statistics.median(v) for c, v in by.items() if v}
    print(f"성공 {len(ok)}건, 실패 {len(errors)}건")
    print(f"{'조건':<10} {'n':>3} {'중앙값':>7} {'평균':>7} {'최소':>6} {'최대':>6} {'일반 대비':>9} {'간결 대비':>9}")
    for c, v in by.items():
        if not v:
            continue
        med = statistics.median(v)
        vs_n = f"{(med / base['normal'] - 1) * 100:+.1f}%" if base.get("normal") else "-"
        vs_c = f"{(med / base['concise'] - 1) * 100:+.1f}%" if base.get("concise") else "-"
        print(f"{c:<10} {len(v):>3} {med:>7.0f} {statistics.mean(v):>7.0f} {min(v):>6} {max(v):>6} {vs_n:>9} {vs_c:>9}")
    print("\n질문별 중앙값 (output_tokens)")
    print("qid  " + "  ".join(f"{c:>9}" for c in CONDITIONS))
    for q in range(len(QUESTIONS)):
        cells = []
        for c in CONDITIONS:
            v = [r["output_tokens"] for r in ok if r["condition"] == c and r["qid"] == q]
            cells.append(f"{statistics.median(v):>9.0f}" if v else f"{'-':>9}")
        print(f"q{q:<3} " + "  ".join(cells))
    for r in errors:
        print("실패:", r["condition"], f"q{r['qid']}", f"r{r['rep']}", r["error"][:150])


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--out")
    p.add_argument("--reps", type=int, default=3)
    p.add_argument("--workers", type=int, default=4)
    p.add_argument("--cwd", default=".")
    p.add_argument("--summarize")
    args = p.parse_args()
    if args.summarize:
        summarize(args.summarize)
    elif args.out:
        measure(args)
    else:
        p.error("--out 또는 --summarize가 필요하다.")


if __name__ == "__main__":
    sys.exit(main())
