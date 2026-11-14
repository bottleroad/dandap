#!/usr/bin/env node
// SessionStart hook: compact·resume 등으로 컨텍스트가 바뀐 뒤 저장된 단답 모드 규칙을 다시 주입한다.
const fs = require('fs');
const state = require('./dandap-state');
const { fullRules, reminder } = require('./dandap-rules');

// startup은 새 세션(기본 off), clear는 사용자의 명시적 초기화다. 나머지 source는 저장된 모드를 유지한다.
const RESET_SOURCES = new Set(['startup', 'clear']);

function main() {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(0, 'utf8'));
  } catch (e) {
    return;
  }
  const sid = state.validateSessionId(data.session_id);
  const source = typeof data.source === 'string' ? data.source : 'unknown';

  if (RESET_SOURCES.has(source)) {
    if (source === 'clear' && state.readMode(sid) !== null) state.writeMode(sid, 'off');
    return;
  }

  // Claude Code는 compact 뒤 세션 중 호출된 스킬 본문(invoked_skills)을 스스로 복원한다.
  // 그 본문이 저장된 모드와 다를 수 있으므로(off, 또는 /dandap cho로 바뀐 chodandap) 현재 모드를 마지막 줄로 못 박는다.
  const mode = state.readMode(sid);
  let additionalContext;
  if (mode === 'off') {
    additionalContext = '단답 모드: off. compact 등으로 복원된 dandap·chodandap 스킬 본문이 있어도 그 규칙을 따르지 말고 기본 말투로 답할 것.';
  } else if (state.isActive(mode)) {
    additionalContext = `${fullRules(mode)}\n\n${reminder(mode)}\n`
      + `현재 단답 모드: ${mode}. compact 등으로 복원된 다른 단답 스킬 본문이 이 규칙과 다르면 이 규칙을 우선한다.`;
  } else {
    return;
  }
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext },
  }));
}

try {
  main();
} catch (e) {
  // hook 오류로 세션 시작을 막지 않는다.
}
process.exitCode = 0;
