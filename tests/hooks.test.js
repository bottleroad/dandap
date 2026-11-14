// UserPromptSubmit·SessionStart hook 스크립트를 실제 프로세스로 실행해 입출력과 상태 기록을 검증하는 테스트.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const TRACKER = path.join(__dirname, '..', 'hooks', 'dandap-mode-tracker.js');
const ACTIVATE = path.join(__dirname, '..', 'hooks', 'dandap-activate.js');

function run(script, input, dir) {
  const res = spawnSync(process.execPath, [script], {
    input: typeof input === 'string' ? input : JSON.stringify(input),
    env: { ...process.env, DANDAP_STATE_DIR: dir },
    encoding: 'utf8',
  });
  assert.equal(res.status, 0, `exit code 0 기대, stderr: ${res.stderr}`);
  return res.stdout.trim() ? JSON.parse(res.stdout) : null;
}

function context(out, eventName) {
  assert.ok(out, 'hook 출력이 있어야 함');
  assert.equal(out.hookSpecificOutput.hookEventName, eventName);
  return out.hookSpecificOutput.additionalContext;
}

function tmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'dandap-hook-'));
}

function stored(dir, sid) {
  const p = path.join(dir, `${sid}.mode`);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8').trim() : null;
}

// ── UserPromptSubmit ─────────────────────────────────────────────

test('tracker: 자연어(단답) 활성화 시 상태 기록과 규칙 전문 주입', () => {
  const dir = tmp();
  const ctx = context(run(TRACKER, { session_id: 's1', prompt: '단답' }, dir), 'UserPromptSubmit');
  assert.equal(stored(dir, 's1'), 'dandap');
  assert.match(ctx, /# dandap \(단답\)/);
  assert.doesNotMatch(ctx, /^---/m, 'frontmatter는 제외');
});

test('tracker: /dandap 명령 활성화는 Claude Code가 본문을 로드하므로 리마인더만 주입', () => {
  const dir = tmp();
  for (const prompt of ['/dandap', '/dandap 이 함수 설명해줘', '<command-name>/dandap</command-name>']) {
    const ctx = context(run(TRACKER, { session_id: 's1', prompt }, dir), 'UserPromptSubmit');
    assert.match(ctx, /DANDAP MODE ACTIVE \(dandap\)/);
    assert.doesNotMatch(ctx, /# dandap \(단답\)/);
  }
  assert.equal(stored(dir, 's1'), 'dandap');
});

test('tracker: /chodandap 명령 활성화도 리마인더만 주입', () => {
  const dir = tmp();
  run(TRACKER, { session_id: 's1', prompt: '단답' }, dir);
  const ctx = context(run(TRACKER, { session_id: 's1', prompt: '/chodandap' }, dir), 'UserPromptSubmit');
  assert.equal(stored(dir, 's1'), 'chodandap');
  assert.match(ctx, /DANDAP MODE ACTIVE \(chodandap\)/);
  assert.doesNotMatch(ctx, /# chodandap \(초단답\)/);
});

test('tracker: 활성 상태의 일반 프롬프트에 리마인더 주입, 다른 문체 리마인더 우선순위 문구 포함', () => {
  const dir = tmp();
  run(TRACKER, { session_id: 's1', prompt: '단답' }, dir);
  const ctx = context(run(TRACKER, { session_id: 's1', prompt: '이 함수 설명해줘' }, dir), 'UserPromptSubmit');
  assert.match(ctx, /DANDAP MODE ACTIVE \(dandap\)/);
  assert.match(ctx, /다른 문체 리마인더가 함께 주입되어도/);
  assert.doesNotMatch(ctx, /# dandap \(단답\)/, '일반 턴에는 전문을 다시 넣지 않음');
});

test('tracker: /dandap cho 전환 시 chodandap 기록과 전문 주입', () => {
  const dir = tmp();
  run(TRACKER, { session_id: 's1', prompt: '/dandap' }, dir);
  // /dandap cho는 Claude Code가 dandap 본문을 로드하므로 chodandap 전문이 필요하다.
  const ctx = context(run(TRACKER, { session_id: 's1', prompt: '/dandap cho' }, dir), 'UserPromptSubmit');
  assert.equal(stored(dir, 's1'), 'chodandap');
  assert.match(ctx, /# chodandap \(초단답\)/);
});

test('tracker: 이미 같은 모드면 전문 대신 리마인더만 주입', () => {
  const dir = tmp();
  run(TRACKER, { session_id: 's1', prompt: '단답' }, dir);
  const ctx = context(run(TRACKER, { session_id: 's1', prompt: '단답 모드' }, dir), 'UserPromptSubmit');
  assert.match(ctx, /DANDAP MODE ACTIVE \(dandap\)/);
  assert.doesNotMatch(ctx, /# dandap \(단답\)/);
});

test('tracker: status는 모드를 바꾸지 않고 현재 모드 보고', () => {
  const dir = tmp();
  run(TRACKER, { session_id: 's1', prompt: '/chodandap' }, dir);
  const ctx = context(run(TRACKER, { session_id: 's1', prompt: '/dandap status' }, dir), 'UserPromptSubmit');
  assert.match(ctx, /단답 모드: chodandap/);
  assert.doesNotMatch(ctx, /세션 추적 안 됨/);
  assert.equal(stored(dir, 's1'), 'chodandap');
});

test('tracker: 기록이 없을 때 status는 off로 단정하지 않고 대화 기준 보고 지시', () => {
  const dir = tmp();
  const ctx = context(run(TRACKER, { session_id: 's9', prompt: '/dandap status' }, dir), 'UserPromptSubmit');
  assert.match(ctx, /hook 기록 없음/);
  assert.match(ctx, /\(세션 추적 안 됨\)/);
  assert.doesNotMatch(ctx, /단답 모드: off/);
  assert.equal(stored(dir, 's9'), null);
});

test('tracker: 종료 시 off 기록, 이후 일반 프롬프트에는 출력 없음', () => {
  const dir = tmp();
  run(TRACKER, { session_id: 's1', prompt: '/dandap' }, dir);
  const ctx = context(run(TRACKER, { session_id: 's1', prompt: '단답 종료' }, dir), 'UserPromptSubmit');
  assert.match(ctx, /종료/);
  assert.equal(stored(dir, 's1'), 'off');
  assert.equal(run(TRACKER, { session_id: 's1', prompt: '이 함수 설명해줘' }, dir), null);
});

test('tracker: 종료 아님 문구는 모드 유지', () => {
  const dir = tmp();
  run(TRACKER, { session_id: 's1', prompt: '/dandap' }, dir);
  const ctx = context(run(TRACKER, { session_id: 's1', prompt: '빌드 취소해줘' }, dir), 'UserPromptSubmit');
  assert.match(ctx, /DANDAP MODE ACTIVE/);
  assert.equal(stored(dir, 's1'), 'dandap');
});

test('tracker: 비활성 세션의 일반 프롬프트에는 출력 없음', () => {
  const dir = tmp();
  assert.equal(run(TRACKER, { session_id: 's1', prompt: '안녕' }, dir), null);
});

test('tracker: session_id가 없어도 활성화 응답은 주되 파일은 만들지 않음', () => {
  const dir = tmp();
  const ctx = context(run(TRACKER, { prompt: '단답' }, dir), 'UserPromptSubmit');
  assert.match(ctx, /# dandap \(단답\)/);
  assert.deepEqual(fs.readdirSync(dir), []);
});

test('tracker: 잘못된 stdin에도 exit 0, 출력 없음', () => {
  const dir = tmp();
  assert.equal(run(TRACKER, 'not json', dir), null);
  assert.equal(run(TRACKER, '', dir), null);
});

// ── SessionStart ─────────────────────────────────────────────────

function seed(dir, sid, mode) {
  fs.writeFileSync(path.join(dir, `${sid}.mode`), mode);
}

test('activate: compact에서 저장된 dandap 규칙 재주입, 현재 모드 우선 문구는 맨 끝', () => {
  const dir = tmp();
  seed(dir, 's1', 'dandap');
  const ctx = context(run(ACTIVATE, { session_id: 's1', source: 'compact' }, dir), 'SessionStart');
  assert.match(ctx, /# dandap \(단답\)/);
  assert.match(ctx, /DANDAP MODE ACTIVE \(dandap\)/);
  assert.match(ctx.trimEnd().split('\n').pop(), /현재 단답 모드: dandap\. .*복원된 .*스킬 본문.*우선/, '현재 모드 문구가 마지막 줄');
  assert.equal(stored(dir, 's1'), 'dandap');
});

test('activate: resume에서 저장된 chodandap 규칙 재주입, 복원된 dandap 본문보다 우선', () => {
  const dir = tmp();
  seed(dir, 's1', 'chodandap');
  const ctx = context(run(ACTIVATE, { session_id: 's1', source: 'resume' }, dir), 'SessionStart');
  assert.match(ctx, /# chodandap \(초단답\)/);
  assert.match(ctx.trimEnd().split('\n').pop(), /현재 단답 모드: chodandap\. .*복원된 .*스킬 본문.*우선/);
});

test('activate: 알 수 없는 source도 저장된 모드를 유지하고 재주입', () => {
  const dir = tmp();
  seed(dir, 's1', 'dandap');
  const ctx = context(run(ACTIVATE, { session_id: 's1', source: 'fork' }, dir), 'SessionStart');
  assert.match(ctx, /# dandap \(단답\)/);
});

test('activate: off가 저장된 세션은 compact 후 규칙 없이 off 고지만 주입', () => {
  const dir = tmp();
  seed(dir, 's1', 'off');
  const ctx = context(run(ACTIVATE, { session_id: 's1', source: 'compact' }, dir), 'SessionStart');
  assert.match(ctx, /^단답 모드: off\. .*복원된 dandap·chodandap 스킬 본문.*따르지 말고 기본 말투/);
  assert.doesNotMatch(ctx, /# dandap \(단답\)|# chodandap|DANDAP MODE ACTIVE/);
  assert.equal(stored(dir, 's1'), 'off');
});

test('activate: 모드 기록이 없는 세션은 compact 후 출력 없음', () => {
  const dir = tmp();
  assert.equal(run(ACTIVATE, { session_id: 'none', source: 'compact' }, dir), null);
});

test('activate: clear는 off로 초기화하고 출력 없음', () => {
  const dir = tmp();
  seed(dir, 's1', 'dandap');
  assert.equal(run(ACTIVATE, { session_id: 's1', source: 'clear' }, dir), null);
  assert.equal(stored(dir, 's1'), 'off');
});

test('activate: startup은 기본 off, 출력 없음, 파일 만들지 않음', () => {
  const dir = tmp();
  assert.equal(run(ACTIVATE, { session_id: 's1', source: 'startup' }, dir), null);
  assert.deepEqual(fs.readdirSync(dir), []);
});

test('activate: 잘못된 stdin에도 exit 0, 출력 없음', () => {
  const dir = tmp();
  assert.equal(run(ACTIVATE, '{broken', dir), null);
});
