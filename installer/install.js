#!/usr/bin/env node
// dandap 스킬·명령 래퍼를 ~/.dandap에 복사하고 감지된 도구(Claude Code, Codex, agy·Gemini CLI)에 링크하는 설치 스크립트.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const SRC = path.join(__dirname, '..');
const HOME = os.homedir();
const BASE = path.join(HOME, '.dandap');
const PARTS = ['skills', 'commands', 'hooks'];
const SKILLS = ['dandap', 'chodandap', 'dandap-help', 'dandap-commit', 'dandap-review'];
const MODES = ['dandap', 'chodandap'];

// 도구별 설정 디렉터리와 명령 래퍼 위치. agy와 Gemini CLI는 ~/.gemini를 함께 쓴다.
const TOOLS = [
  { name: 'Claude Code', dir: '.claude', commands: { from: 'claude', ext: '.md' } },
  { name: 'Codex', dir: '.codex' },
  { name: 'agy·Gemini CLI', dir: '.gemini', commands: { from: 'gemini', ext: '.toml' } },
];

const HOOKS = {
  SessionStart: 'dandap-activate.js',
  UserPromptSubmit: 'dandap-mode-tracker.js',
};

const USAGE = `사용법: npx dandap@latest [--with-hooks | --uninstall]

  (옵션 없음)    스킬과 명령 래퍼를 설치한다.
  --with-hooks  위와 함께 Claude Code hook을 ~/.claude/settings.json에 등록한다.
  --uninstall   설치한 링크, hook, ~/.dandap을 제거한다.`;

function lstat(p) {
  try {
    return fs.lstatSync(p);
  } catch (e) {
    return null;
  }
}

// 링크가 ~/.dandap 안을 가리키면 이 설치 스크립트가 만든 것으로 본다.
function isOurLink(p) {
  const st = lstat(p);
  if (!st || !st.isSymbolicLink()) return false;
  const target = path.resolve(path.dirname(p), fs.readlinkSync(p));
  return target.startsWith(BASE + path.sep);
}

function link(target, p) {
  const st = lstat(p);
  if (st && !st.isSymbolicLink()) {
    console.warn(`건너뜀: ${p} 가 링크가 아닌 실제 파일·디렉터리다.`);
    return;
  }
  if (st) {
    if (!isOurLink(p)) console.log(`교체: ${p} (기존 대상 ${fs.readlinkSync(p)})`);
    fs.unlinkSync(p);
  }
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.symlinkSync(target, p, fs.statSync(target).isDirectory() ? 'junction' : 'file');
}

function unlinkOurs(p) {
  if (isOurLink(p)) fs.unlinkSync(p);
}

function toolEntries(tool) {
  const entries = SKILLS.map((s) => ({
    target: path.join(BASE, 'skills', s),
    link: path.join(HOME, tool.dir, 'skills', s),
  }));
  if (tool.commands) {
    for (const m of MODES) {
      const file = m + tool.commands.ext;
      entries.push({
        target: path.join(BASE, 'commands', tool.commands.from, file),
        link: path.join(HOME, tool.dir, 'commands', file),
      });
    }
  }
  return entries;
}

function settingsPath() {
  return path.join(HOME, '.claude', 'settings.json');
}

// settings.json을 읽는다. 깨져 있으면 덮어쓰지 않도록 예외를 그대로 던진다.
function readSettings() {
  const file = settingsPath();
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeSettings(settings) {
  const file = settingsPath();
  if (fs.existsSync(file)) {
    const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
    // 같은 초에 여러 번 실행해도 이전 백업을 덮어쓰지 않는다.
    let backup = `${file}.dandap-backup-${stamp}`;
    for (let i = 1; fs.existsSync(backup); i++) backup = `${file}.dandap-backup-${stamp}-${i}`;
    fs.copyFileSync(file, backup);
    console.log(`백업: ${backup}`);
  }
  fs.writeFileSync(file, JSON.stringify(settings, null, 2) + '\n');
}

// shouldRemove(command)가 참인 hook을 지우고, 비게 된 그룹·이벤트도 지운다.
function removeHooks(settings, shouldRemove) {
  if (!settings.hooks) return;
  for (const event of Object.keys(HOOKS)) {
    const groups = settings.hooks[event];
    if (!Array.isArray(groups)) continue;
    const kept = groups
      .map((g) => ({ ...g, hooks: (g.hooks || []).filter((h) => !shouldRemove(h.command || '')) }))
      .filter((g) => g.hooks.length > 0);
    if (kept.length > 0) settings.hooks[event] = kept;
    else delete settings.hooks[event];
  }
}

function hookCommand(file) {
  return `node "${path.join(BASE, 'hooks', file)}"`;
}

function installHooks() {
  const settings = readSettings();
  // 다른 위치(저장소 직접 연결 등)에 등록된 dandap hook이 있으면 중복 주입되므로 교체한다.
  removeHooks(settings, (cmd) => Object.values(HOOKS).some((f) => cmd.includes(f)));
  settings.hooks = settings.hooks || {};
  for (const [event, file] of Object.entries(HOOKS)) {
    settings.hooks[event] = settings.hooks[event] || [];
    settings.hooks[event].push({ hooks: [{ type: 'command', command: hookCommand(file) }] });
  }
  writeSettings(settings);
  console.log('hook 등록: SessionStart, UserPromptSubmit');
}

function uninstallHooks() {
  if (!fs.existsSync(settingsPath())) return;
  const settings = readSettings();
  const ours = Object.values(HOOKS).map(hookCommand);
  const before = JSON.stringify(settings);
  removeHooks(settings, (cmd) => ours.includes(cmd));
  if (JSON.stringify(settings) === before) return;
  writeSettings(settings);
  console.log('hook 제거: SessionStart, UserPromptSubmit');
}

function detectTools() {
  return TOOLS.filter((t) => lstat(path.join(HOME, t.dir))?.isDirectory());
}

function install(withHooks) {
  const tools = detectTools();
  if (tools.length === 0) {
    console.error('설치 대상 도구를 찾지 못했다. ~/.claude, ~/.codex, ~/.gemini 중 하나가 있어야 한다.');
    return 1;
  }
  // hook 설정이 깨져 있으면 아무것도 바꾸기 전에 멈춘다.
  if (withHooks) {
    if (!tools.some((t) => t.dir === '.claude')) {
      console.error('--with-hooks는 Claude Code(~/.claude)가 있어야 한다.');
      return 1;
    }
    try {
      readSettings();
    } catch (e) {
      console.error(`${settingsPath()} 를 읽지 못해 중단한다: ${e.message}`);
      return 1;
    }
  }

  for (const part of PARTS) {
    fs.rmSync(path.join(BASE, part), { recursive: true, force: true });
    fs.cpSync(path.join(SRC, part), path.join(BASE, part), { recursive: true });
  }
  console.log(`복사: ${BASE}`);

  for (const tool of tools) {
    for (const e of toolEntries(tool)) link(e.target, e.link);
    console.log(`설치: ${tool.name} (~/${tool.dir})`);
  }
  if (withHooks) installHooks();
  console.log('완료. 실행 중인 에이전트 세션은 다시 시작해야 적용된다.');
  return 0;
}

function uninstall() {
  try {
    uninstallHooks();
  } catch (e) {
    console.error(`${settingsPath()} 를 읽지 못해 중단한다: ${e.message}`);
    return 1;
  }
  for (const tool of TOOLS) {
    for (const e of toolEntries(tool)) unlinkOurs(e.link);
  }
  fs.rmSync(BASE, { recursive: true, force: true });
  console.log(`제거 완료: 링크와 ${BASE}`);
  return 0;
}

function main(args) {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(USAGE);
    return 0;
  }
  const known = ['--with-hooks', '--uninstall'];
  const unknown = args.filter((a) => !known.includes(a));
  if (unknown.length > 0 || args.length > 1) {
    console.error(`알 수 없는 옵션 조합: ${args.join(' ')}\n\n${USAGE}`);
    return 1;
  }
  if (args[0] === '--uninstall') return uninstall();
  return install(args[0] === '--with-hooks');
}

process.exitCode = main(process.argv.slice(2));
