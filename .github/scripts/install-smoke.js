// npm pack 결과물을 npx로 실제 설치·재설치·제거하고, 등록된 hook 명령을 여러 셸에서 실행해 검증하는 스모크 스크립트.
// 사용법: node install-smoke.js <tgz 경로> <임시 HOME 경로>
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const [tgz, home] = process.argv.slice(2).map((p) => path.resolve(p));
const isWin = process.platform === 'win32';
const env = { ...process.env, HOME: home, USERPROFILE: home };
const base = path.join(home, '.dandap');
const SKILLS = ['dandap', 'chodandap', 'dandap-help', 'dandap-commit', 'dandap-review'];
const WRAPPERS = [['.claude', 'dandap.md'], ['.claude', 'chodandap.md'], ['.gemini', 'dandap.toml'], ['.gemini', 'chodandap.toml']];

function step(name) {
  console.log(`\n== ${name}`);
}

// 설치 디렉터리 밖(임시 HOME)에서 실행해야 저장소 자체 package.json의 영향을 받지 않는다.
function installer(...args) {
  const res = spawnSync('npm', ['exec', '--yes', `--package=${tgz}`, '--', 'dandap', ...args],
    { cwd: home, env, encoding: 'utf8', shell: isWin });
  process.stdout.write(res.stdout);
  process.stderr.write(res.stderr);
  assert.equal(res.status, 0, `dandap ${args.join(' ')} 실패`);
}

function settings() {
  return JSON.parse(fs.readFileSync(path.join(home, '.claude', 'settings.json'), 'utf8'));
}

function hookCommand(event) {
  const cmds = settings().hooks[event].flatMap((g) => g.hooks.map((h) => h.command));
  assert.equal(cmds.length, 1, `${event} hook은 1개`);
  return cmds[0];
}

function shells() {
  if (!isWin) return [['sh', (c) => ['sh', ['-c', c]]]];
  return [
    ['cmd', (c) => ['cmd.exe', ['/d', '/s', '/c', `"${c}"`]]],
    ['powershell', (c) => ['powershell.exe', ['-NoProfile', '-Command', c]]],
    ['pwsh', (c) => ['pwsh.exe', ['-NoProfile', '-Command', c]]],
    // Claude Code는 Windows에서 Git Bash로 hook을 실행한다. PATH의 bash는 WSL일 수 있어 경로를 지정한다.
    ['git-bash', (c) => ['C:\\Program Files\\Git\\bin\\bash.exe', ['-c', c]]],
  ];
}

function runHook(shell, command, input) {
  const [file, args] = shell(command);
  const res = spawnSync(file, args, { env, input: JSON.stringify(input), encoding: 'utf8', windowsVerbatimArguments: file === 'cmd.exe' });
  assert.equal(res.status, 0, `hook 종료 코드 0 기대, stderr: ${res.stderr}`);
  assert.ok(res.stdout.trim(), `hook 출력 없음, stderr: ${res.stderr}`);
  return JSON.parse(res.stdout).hookSpecificOutput.additionalContext;
}

function checkInstalled() {
  for (const dir of ['.claude', '.codex', '.gemini']) {
    for (const s of SKILLS) {
      const p = path.join(home, dir, 'skills', s);
      assert.ok(fs.lstatSync(p).isSymbolicLink(), `${p} 는 링크`);
      const target = path.resolve(path.dirname(p), fs.readlinkSync(p));
      console.log(`링크: ${p} -> ${fs.readlinkSync(p)}`);
      assert.equal(target.replace(/[\\/]+$/, ''), path.join(base, 'skills', s));
      assert.ok(fs.existsSync(path.join(p, 'SKILL.md')), `${p}/SKILL.md 읽기 가능`);
    }
  }
  for (const [dir, file] of WRAPPERS) {
    const p = path.join(home, dir, 'commands', file);
    const kind = fs.lstatSync(p).isSymbolicLink() ? '링크' : '복사본';
    console.log(`명령 래퍼(${kind}): ${p}`);
    assert.ok(fs.readFileSync(p, 'utf8').includes('$ARGUMENTS'), `${p} 내용 확인`);
  }
}

console.log(`node ${process.version}, ${process.platform}, HOME=${home}`);
for (const dir of ['.claude', '.codex', '.gemini']) fs.mkdirSync(path.join(home, dir), { recursive: true });

step('설치 (--with-hooks)');
installer('--with-hooks');
checkInstalled();

step('hook 실행');
const tracker = hookCommand('UserPromptSubmit');
const activate = hookCommand('SessionStart');
console.log(`UserPromptSubmit: ${tracker}\nSessionStart: ${activate}`);
for (const [name, shell] of shells()) {
  const sid = `smoke-${name}`;
  const on = runHook(shell, tracker, { session_id: sid, hook_event_name: 'UserPromptSubmit', prompt: '/dandap' });
  assert.match(on, /DANDAP MODE ACTIVE \(dandap\)/);
  const status = runHook(shell, tracker, { session_id: sid, hook_event_name: 'UserPromptSubmit', prompt: '/dandap status' });
  assert.match(status, /단답 모드: dandap/);
  const compact = runHook(shell, activate, { session_id: sid, hook_event_name: 'SessionStart', source: 'compact' });
  assert.ok(!compact.startsWith('---'), 'frontmatter 제거');
  assert.match(compact, /현재 단답 모드: dandap/);
  console.log(`${name}: 통과`);
}
assert.ok(fs.existsSync(path.join(home, '.claude', '.dandap-sessions', 'smoke-cmd.mode')) || !isWin, '상태 파일 기록');

step('재설치');
installer('--with-hooks');
checkInstalled();
hookCommand('SessionStart');

step('제거');
installer('--uninstall');
assert.ok(!fs.existsSync(base), '~/.dandap 제거');
for (const dir of ['.claude', '.codex', '.gemini']) {
  for (const s of SKILLS) assert.ok(!fs.existsSync(path.join(home, dir, 'skills', s)), `${dir}/skills/${s} 제거`);
}
for (const [dir, file] of WRAPPERS) assert.ok(!fs.existsSync(path.join(home, dir, 'commands', file)), `${file} 제거`);
assert.equal(settings().hooks?.SessionStart, undefined, 'hook 제거');

console.log('\n스모크 테스트 통과');
