// 세션별 단답 모드 상태 파일의 읽기·쓰기 동작을 검증하는 테스트.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

function freshState() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dandap-state-'));
  process.env.DANDAP_STATE_DIR = dir;
  delete require.cache[require.resolve('../hooks/dandap-state')];
  return { dir, state: require('../hooks/dandap-state') };
}

test('쓰기 후 읽기', () => {
  const { state } = freshState();
  state.writeMode('abc-123', 'dandap');
  assert.equal(state.readMode('abc-123'), 'dandap');
  state.writeMode('abc-123', 'chodandap');
  assert.equal(state.readMode('abc-123'), 'chodandap');
});

test('종료는 off로 기록', () => {
  const { dir, state } = freshState();
  state.writeMode('s1', 'off');
  assert.equal(state.readMode('s1'), 'off');
  assert.equal(fs.readFileSync(path.join(dir, 's1.mode'), 'utf8').trim(), 'off');
});

test('파일이 없으면 null', () => {
  const { state } = freshState();
  assert.equal(state.readMode('never-written'), null);
});

test('잘못된 session_id는 거부하고 파일을 만들지 않음', () => {
  const { dir, state } = freshState();
  for (const bad of ['../escape', 'a/b', '', null, undefined, 'x'.repeat(200)]) {
    assert.equal(state.validateSessionId(bad), null);
    state.writeMode(bad, 'dandap');
    assert.equal(state.readMode(bad), null);
  }
  assert.deepEqual(fs.readdirSync(dir), []);
  assert.equal(fs.existsSync(path.join(dir, '..', 'escape.mode')), false);
});

test('알 수 없는 모드 값은 쓰지 않고, 읽을 때도 null', () => {
  const { dir, state } = freshState();
  state.writeMode('s2', 'ultra');
  assert.equal(fs.existsSync(path.join(dir, 's2.mode')), false);
  fs.writeFileSync(path.join(dir, 's3.mode'), 'garbage');
  assert.equal(state.readMode('s3'), null);
});

test('isActive는 dandap·chodandap만 참', () => {
  const { state } = freshState();
  assert.equal(state.isActive('dandap'), true);
  assert.equal(state.isActive('chodandap'), true);
  assert.equal(state.isActive('off'), false);
  assert.equal(state.isActive(null), false);
});
