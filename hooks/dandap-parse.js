// 사용자 프롬프트에서 단답 모드 활성화·종료·상태 요청을 판정하는 순수 함수 모듈.

const MODES = new Set(['dandap', 'chodandap']);
const END_WORDS = new Set(['종료', '해제', '멈춤', '그만', '끝', '취소', 'stop', 'off', '원래대로']);

const NONE = Object.freeze({ action: 'none' });

// Claude Code는 슬래시 명령을 <command-name>/<command-args> 봉투로 hook에 넘긴다.
// 우리 명령이면 "/name args" 문자열로 복원하고, 다른 명령이면 null(판정 제외)을 돌려준다.
function unwrapEnvelope(prompt) {
  const name = /<command-name>\s*([^<\s]+)\s*<\/command-name>/.exec(prompt);
  if (!name) return prompt;
  const cmd = name[1];
  if (cmd !== '/dandap' && cmd !== '/chodandap') return null;
  const args = /<command-args>\s*([^<]*?)\s*<\/command-args>/.exec(prompt);
  return args && args[1] ? `${cmd} ${args[1]}` : cmd;
}

function parseCommand(prompt) {
  const m = /^\/(dandap|chodandap)(?:\s+(.*))?$/.exec(prompt);
  if (!m) return null;
  // command: Claude Code가 이 슬래시 명령으로 로드하는 스킬 이름. 목표 모드(mode)와 다를 수 있다(/dandap cho).
  const command = m[1];
  const args = (m[2] || '').trim();
  if (args === '' || args === 'on') return { action: 'activate', mode: command, command };
  if (args === 'status') return { action: 'status' };
  if (command === 'dandap' && args === 'cho') return { action: 'activate', mode: 'chodandap', command };
  if (END_WORDS.has(args)) return { action: 'deactivate' };
  // 인자에 질문이 붙은 경우: 모드를 켠 채 답한다. 종료어가 섞여 있어도 종료하지 않는다.
  return { action: 'activate', mode: command, command };
}

const NEGATION = /(하지\s*마|하지\s*말|하면\s*안|안\s*돼|않|끄지)/;
const PHRASE_END = /^(초단답|단답)(?:\s*모드)?\s*(종료|해제|멈춤|그만|끝|취소|stop|off)(?:\s*(?:해|해줘|해 줘|하자|해주세요))?[.!]?$/;
const PHRASE_ACTIVATE = /^(초단답|단답)(?:\s*모드)?(?:\s*(?:켜|켜줘|on|시작))?[.!]?$/;
const PHRASE_RESET = /^(?:normal mode|원래대로)(?:\s*(?:해|해줘|해 줘))?[.!]?$/;

function parseNaturalLanguage(prompt) {
  if (NEGATION.test(prompt)) return NONE;
  if (PHRASE_END.test(prompt) || PHRASE_RESET.test(prompt)) return { action: 'deactivate' };
  const act = PHRASE_ACTIVATE.exec(prompt);
  if (act) return { action: 'activate', mode: act[1] === '초단답' ? 'chodandap' : 'dandap' };
  return NONE;
}

function parseModeChange(raw) {
  if (typeof raw !== 'string') return NONE;
  let prompt = raw.trim().toLowerCase().replace(/\s+/g, ' ');
  if (prompt === '' || /<scheduled-task\b/.test(prompt)) return NONE;

  const unwrapped = unwrapEnvelope(prompt);
  if (unwrapped === null) return NONE;
  prompt = unwrapped;

  if (prompt.startsWith('/')) return parseCommand(prompt) || NONE;
  return parseNaturalLanguage(prompt);
}

module.exports = { parseModeChange, MODES };
