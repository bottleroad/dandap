// installer/install.js를 임시 HOME에서 실행해 설치·hook 병합·제거 동작을 검증하는 테스트.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const INSTALLER = path.join(__dirname, '..', 'installer', 'install.js');
const SKILLS = ['dandap', 'chodandap', 'dandap-help', 'dandap-commit', 'dandap-review'];

function freshHome(tools = ['.claude', '.codex', '.gemini']) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'dandap-home-'));
  for (const t of tools) fs.mkdirSync(path.join(home, t));
  return home;
}

function run(home, ...args) {
  const res = spawnSync(process.execPath, [INSTALLER, ...args], {
    env: { ...process.env, HOME: home },
    encoding: 'utf8',
  });
  return res;
}

function ok(home, ...args) {
  const res = run(home, ...args);
  assert.equal(res.status, 0, `exit code 0 기대, stderr: ${res.stderr}`);
  return res;
}

function settings(home) {
  return JSON.parse(fs.readFileSync(path.join(home, '.claude', 'settings.json'), 'utf8'));
}

function hookCommands(home, event) {
  return (settings(home).hooks?.[event] || []).flatMap((g) => g.hooks.map((h) => h.command));
}

test('설치: ~/.dandap에 복사하고 감지된 도구에 스킬·명령을 링크', () => {
  const home = freshHome();
  ok(home);
  const base = path.join(home, '.dandap');
  assert.ok(fs.existsSync(path.join(base, 'skills', 'dandap', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(base, 'hooks', 'dandap-activate.js')));
  for (const dir of ['.claude', '.codex', '.gemini']) {
    for (const s of SKILLS) {
      const link = path.join(home, dir, 'skills', s);
      assert.equal(fs.readlinkSync(link), path.join(base, 'skills', s));
    }
  }
  assert.equal(fs.readlinkSync(path.join(home, '.claude', 'commands', 'dandap.md')),
    path.join(base, 'commands', 'claude', 'dandap.md'));
  assert.equal(fs.readlinkSync(path.join(home, '.gemini', 'commands', 'chodandap.toml')),
    path.join(base, 'commands', 'gemini', 'chodandap.toml'));
  assert.ok(!fs.existsSync(path.join(home, '.claude', 'settings.json')), 'hook 옵션 없이는 settings.json을 만들지 않음');
});

test('설치: 없는 도구는 건너뜀', () => {
  const home = freshHome(['.codex']);
  ok(home);
  assert.ok(fs.existsSync(path.join(home, '.codex', 'skills', 'dandap')));
  assert.ok(!fs.existsSync(path.join(home, '.claude')));
  assert.ok(!fs.existsSync(path.join(home, '.gemini')));
});

test('설치: 감지된 도구가 없으면 실패', () => {
  const home = freshHome([]);
  const res = run(home);
  assert.equal(res.status, 1);
  assert.ok(!fs.existsSync(path.join(home, '.dandap')));
});

test('설치: 실제 디렉터리는 덮어쓰지 않음', () => {
  const home = freshHome(['.claude']);
  const mine = path.join(home, '.claude', 'skills', 'dandap');
  fs.mkdirSync(mine, { recursive: true });
  fs.writeFileSync(path.join(mine, 'SKILL.md'), 'mine');
  ok(home);
  assert.equal(fs.readFileSync(path.join(mine, 'SKILL.md'), 'utf8'), 'mine');
  assert.ok(fs.lstatSync(path.join(home, '.claude', 'skills', 'chodandap')).isSymbolicLink());
});

test('--with-hooks: 기존 hook을 보존하고 백업한 뒤 병합, 재실행해도 중복 없음', () => {
  const home = freshHome(['.claude']);
  const file = path.join(home, '.claude', 'settings.json');
  const other = { hooks: [{ type: 'command', command: 'echo other' }] };
  const oldDev = { hooks: [{ type: 'command', command: 'node "/dev/dandap/hooks/dandap-activate.js"' }] };
  fs.writeFileSync(file, JSON.stringify({ model: 'x', hooks: { SessionStart: [other, oldDev] } }));

  ok(home, '--with-hooks');
  ok(home, '--with-hooks');

  const s = settings(home);
  assert.equal(s.model, 'x');
  const start = hookCommands(home, 'SessionStart');
  assert.deepEqual(start, ['echo other', `node "${path.join(home, '.dandap', 'hooks', 'dandap-activate.js')}"`]);
  assert.deepEqual(hookCommands(home, 'UserPromptSubmit'),
    [`node "${path.join(home, '.dandap', 'hooks', 'dandap-mode-tracker.js')}"`]);
  const backups = fs.readdirSync(path.join(home, '.claude')).filter((f) => f.startsWith('settings.json.dandap-backup-'));
  assert.equal(backups.length, 2, '같은 초에 두 번 실행해도 백업을 덮어쓰지 않음');
  const contents = backups.map((f) => fs.readFileSync(path.join(home, '.claude', f), 'utf8'));
  assert.ok(contents.some((c) => c.includes('/dev/dandap/hooks')), '설치 전 원본이 백업에 남음');
});

test('--with-hooks: settings.json이 깨져 있으면 수정하지 않고 실패', () => {
  const home = freshHome(['.claude']);
  const file = path.join(home, '.claude', 'settings.json');
  fs.writeFileSync(file, '{ broken');
  const res = run(home, '--with-hooks');
  assert.equal(res.status, 1);
  assert.equal(fs.readFileSync(file, 'utf8'), '{ broken');
});

test('--uninstall: 설치한 링크·hook·~/.dandap만 제거', () => {
  const home = freshHome();
  const file = path.join(home, '.claude', 'settings.json');
  fs.writeFileSync(file, JSON.stringify({ hooks: { SessionStart: [{ hooks: [{ type: 'command', command: 'echo other' }] }] } }));
  ok(home, '--with-hooks');
  const mine = path.join(home, '.codex', 'skills', 'mine');
  fs.mkdirSync(mine, { recursive: true });

  ok(home, '--uninstall');

  assert.ok(!fs.existsSync(path.join(home, '.dandap')));
  for (const dir of ['.claude', '.codex', '.gemini']) {
    for (const s of SKILLS) assert.ok(!fs.existsSync(path.join(home, dir, 'skills', s)));
  }
  assert.ok(!fs.existsSync(path.join(home, '.claude', 'commands', 'dandap.md')));
  assert.ok(fs.existsSync(mine));
  assert.deepEqual(hookCommands(home, 'SessionStart'), ['echo other']);
  assert.equal(settings(home).hooks.UserPromptSubmit, undefined);
});

test('알 수 없는 옵션은 실패', () => {
  const home = freshHome();
  const res = run(home, '--bogus');
  assert.equal(res.status, 1);
  assert.ok(!fs.existsSync(path.join(home, '.dandap')));
});
