// 프롬프트 문자열에서 단답 모드 활성화·종료·상태 요청을 판정하는 로직의 코퍼스 테스트.
const test = require('node:test');
const assert = require('node:assert/strict');
const { parseModeChange } = require('../hooks/dandap-parse');

function envelope(name, args) {
  const argPart = args === undefined ? '' : `\n<command-args>${args}</command-args>`;
  return `<command-message>${name.slice(1)}</command-message>\n<command-name>${name}</command-name>${argPart}`;
}

const cases = {
  // 슬래시 명령: Claude Code가 명령 이름과 같은 스킬 본문을 로드한다. command 필드로 구분한다.
  commandDandap: [
    '/dandap',
    '/dandap on',
    '/dandap 이 함수 설명해줘',
    envelope('/dandap'),
    envelope('/dandap', ''),
    envelope('/dandap', 'on'),
  ],
  commandChodandap: [
    '/chodandap',
    '/chodandap on',
    envelope('/chodandap'),
  ],
  // /dandap cho: 로드되는 스킬은 dandap, 목표 모드는 chodandap.
  commandDandapToCho: [
    '/dandap cho',
    envelope('/dandap', 'cho'),
  ],
  phraseDandap: ['단답', '단답 모드', '  단답  '],
  phraseChodandap: ['초단답', '초단답 모드'],
  deactivate: [
    '/dandap off',
    '/dandap OFF',
    '/dandap 종료',
    '/dandap 해제',
    '/dandap 원래대로',
    '/chodandap stop',
    '/chodandap 그만',
    '단답 종료',
    '단답 해제',
    '단답 그만',
    '초단답 해제',
    '단답 모드 종료해줘',
    '초단답 종료해 줘',
    'normal mode',
    'Normal Mode',
    '원래대로',
    '원래대로 해줘',
    envelope('/dandap', 'off'),
    envelope('/chodandap', '종료'),
  ],
  none: [
    '빌드 취소해줘',
    '서버 stop 명령어 알려줘',
    'stop',
    '그만',
    'off',
    '끝',
    '단답 끄지 마',
    '단답 종료하지 마',
    '초단답 해제하면 안 돼',
    'vim normal mode 나가는 법',
    'normal mode로 나가는 법 알려줘',
    '원래대로 코드 복구해줘',
    '단답과 초단답 차이 알려줘',
    '/dandap-help',
    '/dandap-commit',
    '/dandapx',
    envelope('/dandap-help'),
    envelope('/review', '단답 종료'),
    '<scheduled-task name="x">단답</scheduled-task>',
    '',
  ],
  status: [
    '/dandap status',
    '/chodandap status',
    envelope('/dandap', 'status'),
  ],
};

const activateCases = [
  ['commandDandap', { action: 'activate', mode: 'dandap', command: 'dandap' }],
  ['commandChodandap', { action: 'activate', mode: 'chodandap', command: 'chodandap' }],
  ['commandDandapToCho', { action: 'activate', mode: 'chodandap', command: 'dandap' }],
  ['phraseDandap', { action: 'activate', mode: 'dandap' }],
  ['phraseChodandap', { action: 'activate', mode: 'chodandap' }],
];

for (const [key, expected] of activateCases) {
  for (const prompt of cases[key]) {
    test(`활성화(${key}): ${JSON.stringify(prompt)}`, () => {
      assert.deepEqual(parseModeChange(prompt), expected);
    });
  }
}

for (const prompt of cases.deactivate) {
  test(`종료: ${JSON.stringify(prompt)}`, () => {
    assert.deepEqual(parseModeChange(prompt), { action: 'deactivate' });
  });
}

for (const prompt of cases.none) {
  test(`판정 없음: ${JSON.stringify(prompt)}`, () => {
    assert.deepEqual(parseModeChange(prompt), { action: 'none' });
  });
}

for (const prompt of cases.status) {
  test(`상태: ${JSON.stringify(prompt)}`, () => {
    assert.deepEqual(parseModeChange(prompt), { action: 'status' });
  });
}

test('문자열이 아닌 입력은 판정 없음', () => {
  assert.deepEqual(parseModeChange(undefined), { action: 'none' });
  assert.deepEqual(parseModeChange(null), { action: 'none' });
});
