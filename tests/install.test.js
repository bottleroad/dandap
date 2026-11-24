// installer/install.js를 임시 HOME에서 실행해 설치·hook 병합·제거 동작을 검증하는 테스트.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const INSTALLER = path.join(__dirname, '..', 'installer', 'install.js');
const EPERM = path.join(__dirname, 'fixtures', 'symlink-eperm.js');
const SKILLS = ['dandap', 'chodandap', 'dandap-help', 'dandap-commit', 'dandap-review'];
const KIRO_SKILLS = ['dandap', 'chodandap', 'dandap-help'];
const TOOL_DIRS = ['.claude', '.codex', '.gemini', '.kiro'];

function freshHome(tools = TOOL_DIRS) {
  // 한글·공백 사용자명 경로에서도 동작해야 한다(Windows의 fs.cpSync는 비 ASCII 경로를 깨뜨린 적이 있다).
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'dandap home 사용자-'));
  for (const t of tools) fs.mkdirSync(path.join(home, t));
  return home;
}

// Windows의 os.homedir()는 HOME이 아니라 USERPROFILE을 읽으므로 둘 다 바꾼다.
function runNode(home, argv) {
  return spawnSync(process.execPath, argv, {
    env: { ...process.env, HOME: home, USERPROFILE: home },
    encoding: 'utf8',
  });
}

function run(home, ...args) {
  return runNode(home, [INSTALLER, ...args]);
}

function ok(home, ...args) {
  const res = run(home, ...args);
  assert.equal(res.status, 0, `exit code 0 기대, stderr: ${res.stderr}`);
  return res;
}

// 파일 symlink가 EPERM으로 실패하는 환경에서 설치 스크립트를 실행한다.
function okWithoutFileSymlink(home, ...args) {
  const res = runNode(home, ['-r', EPERM, INSTALLER, ...args]);
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
  for (const s of KIRO_SKILLS) {
    const link = path.join(home, '.kiro', 'skills', s);
    assert.equal(fs.readlinkSync(link), path.join(base, 'skills', s));
  }
  for (const s of ['dandap-commit', 'dandap-review']) {
    assert.ok(!fs.existsSync(path.join(home, '.kiro', 'skills', s)), `Kiro에는 ${s}를 설치하지 않음`);
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
  for (const dir of TOOL_DIRS) {
    for (const s of SKILLS) assert.ok(!fs.existsSync(path.join(home, dir, 'skills', s)));
  }
  assert.ok(!fs.existsSync(path.join(home, '.claude', 'commands', 'dandap.md')));
  assert.ok(fs.existsSync(mine));
  assert.deepEqual(hookCommands(home, 'SessionStart'), ['echo other']);
  assert.equal(settings(home).hooks.UserPromptSubmit, undefined);
});

test('파일 symlink 권한이 없으면 명령 래퍼를 복사해 설치를 끝까지 진행', () => {
  const home = freshHome();
  okWithoutFileSymlink(home, '--with-hooks');
  const base = path.join(home, '.dandap');
  const wrapper = path.join(home, '.claude', 'commands', 'dandap.md');
  assert.ok(!fs.lstatSync(wrapper).isSymbolicLink(), '명령 래퍼는 복사본');
  assert.equal(fs.readFileSync(wrapper, 'utf8'),
    fs.readFileSync(path.join(base, 'commands', 'claude', 'dandap.md'), 'utf8'));
  assert.ok(fs.existsSync(path.join(home, '.gemini', 'commands', 'chodandap.toml')));
  for (const dir of TOOL_DIRS) {
    assert.ok(fs.lstatSync(path.join(home, dir, 'skills', 'dandap')).isSymbolicLink(), `${dir} 스킬은 링크`);
  }
  assert.equal(hookCommands(home, 'UserPromptSubmit').length, 1, 'hook 등록까지 진행');
});

test('파일 symlink 권한이 없을 때 재설치는 복사본을 갱신하고 제거는 복사본만 지움', () => {
  const home = freshHome(['.claude']);
  okWithoutFileSymlink(home);
  const wrapper = path.join(home, '.claude', 'commands', 'dandap.md');
  fs.writeFileSync(wrapper, 'stale');
  const mine = path.join(home, '.claude', 'commands', 'mine.md');
  fs.writeFileSync(mine, 'mine');

  okWithoutFileSymlink(home);
  assert.notEqual(fs.readFileSync(wrapper, 'utf8'), 'stale', '재설치 시 복사본 갱신');

  ok(home, '--uninstall');
  assert.ok(!fs.existsSync(wrapper));
  assert.ok(!fs.existsSync(path.join(home, '.claude', 'commands', 'chodandap.md')));
  assert.equal(fs.readFileSync(mine, 'utf8'), 'mine', '사용자 파일은 남김');
});

test('알 수 없는 옵션은 실패', () => {
  const home = freshHome();
  const res = run(home, '--bogus');
  assert.equal(res.status, 1);
  assert.ok(!fs.existsSync(path.join(home, '.dandap')));
});

test('Kiro: 3개 스킬만 설치하고 기존 5개 링크 재설치 시 남은 2개 링크를 정리', () => {
  const home = freshHome(['.kiro']);
  const base = path.join(home, '.dandap');
  ok(home);
  for (const s of KIRO_SKILLS) {
    assert.equal(fs.readlinkSync(path.join(home, '.kiro', 'skills', s)), path.join(base, 'skills', s));
  }
  for (const s of ['dandap-commit', 'dandap-review']) {
    assert.ok(!fs.existsSync(path.join(home, '.kiro', 'skills', s)));
  }

  // 과거 버전처럼 5개 링크가 모두 존재하는 상태를 시뮬레이션
  for (const s of ['dandap-commit', 'dandap-review']) {
    fs.symlinkSync(path.join(base, 'skills', s), path.join(home, '.kiro', 'skills', s), 'junction');
  }
  for (const s of SKILLS) {
    assert.ok(fs.existsSync(path.join(home, '.kiro', 'skills', s)));
  }

  // 재설치 시 제외된 2개 링크가 정리됨
  ok(home);
  for (const s of KIRO_SKILLS) {
    assert.ok(fs.existsSync(path.join(home, '.kiro', 'skills', s)));
  }
  for (const s of ['dandap-commit', 'dandap-review']) {
    assert.ok(!fs.existsSync(path.join(home, '.kiro', 'skills', s)), `재설치 시 ${s} 링크 제거됨`);
  }
});

test('Kiro: 재설치 시 사용자가 만든 다른 파일·디렉터리·외부 링크는 보존', () => {
  const home = freshHome(['.kiro']);
  const base = path.join(home, '.dandap');
  ok(home);

  // 사용자가 직접 생성한 디렉터리
  const userDir = path.join(home, '.kiro', 'skills', 'my-custom-skill');
  fs.mkdirSync(userDir, { recursive: true });
  fs.writeFileSync(path.join(userDir, 'SKILL.md'), 'custom');

  // 사용자가 외부 경로로 직접 링크한 dandap-commit
  const externalDir = path.join(home, 'external-commit');
  fs.mkdirSync(externalDir, { recursive: true });
  const userLink = path.join(home, '.kiro', 'skills', 'dandap-commit');
  fs.symlinkSync(externalDir, userLink, 'junction');

  // dandap이 만들었던 링크(dandap-review)를 가상으로 추가
  const ourStaleLink = path.join(home, '.kiro', 'skills', 'dandap-review');
  fs.symlinkSync(path.join(base, 'skills', 'dandap-review'), ourStaleLink, 'junction');

  // 재설치 실행
  ok(home);

  // dandap 이전 링크는 삭제
  assert.ok(!fs.existsSync(ourStaleLink), 'dandap 이전 링크는 삭제');
  // 사용자의 디렉터리는 보존
  assert.ok(fs.existsSync(userDir), '사용자 디렉터리 보존');
  assert.equal(fs.readFileSync(path.join(userDir, 'SKILL.md'), 'utf8'), 'custom');
  // 사용자의 외부 링크는 보존
  assert.ok(fs.lstatSync(userLink).isSymbolicLink(), '사용자 링크 보존');
  assert.equal(fs.readlinkSync(userLink), externalDir);
});

test('Kiro: 5개 링크 상태에서 --uninstall 실행 시 5개 모두 제거되고 사용자 항목은 보존', () => {
  const home = freshHome(['.kiro']);
  const base = path.join(home, '.dandap');
  ok(home);

  // 과거 5개 링크 상태 시뮬레이션
  for (const s of ['dandap-commit', 'dandap-review']) {
    fs.symlinkSync(path.join(base, 'skills', s), path.join(home, '.kiro', 'skills', s), 'junction');
  }
  // 사용자 파일 추가
  const userFile = path.join(home, '.kiro', 'skills', 'user-note.txt');
  fs.writeFileSync(userFile, 'note');

  // 제거 실행
  ok(home, '--uninstall');

  // dandap 스킬 5개 링크 모두 제거됨
  for (const s of SKILLS) {
    assert.ok(!fs.existsSync(path.join(home, '.kiro', 'skills', s)), `${s} 링크 제거됨`);
  }
  // 사용자 파일은 보존됨
  assert.ok(fs.existsSync(userFile), '사용자 파일 보존');
  assert.equal(fs.readFileSync(userFile, 'utf8'), 'note');
});
