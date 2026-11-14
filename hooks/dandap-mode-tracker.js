#!/usr/bin/env node
// UserPromptSubmit hook: 프롬프트에서 단답 모드 명령을 감지해 세션 상태를 기록하고 규칙·리마인더를 주입한다.
const fs = require('fs');
const { parseModeChange } = require('./dandap-parse');
const state = require('./dandap-state');
const { fullRules, reminder } = require('./dandap-rules');

function emit(additionalContext) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext },
  }));
}

function main() {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(0, 'utf8'));
  } catch (e) {
    return;
  }
  const sid = state.validateSessionId(data.session_id);
  const current = state.readMode(sid);
  const change = parseModeChange(data.prompt);

  if (change.action === 'status') {
    // 기록이 없다고 off는 아니다. hook 설치 전에 켰거나 모델이 스킬을 직접 호출한 세션일 수 있다.
    emit(current
      ? `모드를 바꾸지 말고 다음 한 줄만 그대로 보고할 것: 단답 모드: ${current}`
      : 'hook 기록 없음. 모드를 바꾸지 말고 대화에서 판단한 현재 모드를 '
        + '`단답 모드: <dandap|chodandap|off> (세션 추적 안 됨)` 한 줄로만 보고할 것.');
    return;
  }

  if (change.action === 'deactivate') {
    state.writeMode(sid, 'off');
    const label = current === 'chodandap' ? '초단답' : '단답';
    emit(`단답 모드 종료됨. "${label} 모드를 종료하고 기본 말투로 복귀합니다." 한 줄로 확인한 뒤 기본 말투로 답할 것.`);
    return;
  }

  if (change.action === 'activate') {
    state.writeMode(sid, change.mode);
    // 규칙 전문은 모델에게 아직 그 모드의 본문이 없을 때만 넣는다.
    // - 같은 모드 재호출: 이미 들어가 있다.
    // - 슬래시 명령 이름이 목표 모드와 같음: Claude Code가 같은 스킬 본문을 로드한다.
    //   (/dandap cho는 dandap 본문만 로드되므로 chodandap 전문이 필요하다.)
    const alreadyLoaded = change.mode === current || change.command === change.mode;
    emit(alreadyLoaded ? reminder(change.mode) : `${fullRules(change.mode)}\n\n${reminder(change.mode)}`);
    return;
  }

  if (state.isActive(current)) emit(reminder(current));
}

try {
  main();
} catch (e) {
  // hook 오류로 사용자 프롬프트를 막지 않는다.
}
process.exitCode = 0;
