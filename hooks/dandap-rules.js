// hook이 주입할 단답 규칙 전문(SKILL.md 본문)과 매 턴 리마인더 문구를 만드는 모듈.
const fs = require('fs');
const path = require('path');

const SKILL_FILES = {
  dandap: path.join(__dirname, '..', 'skills', 'dandap', 'SKILL.md'),
  chodandap: path.join(__dirname, '..', 'skills', 'chodandap', 'SKILL.md'),
};

function fullRules(mode) {
  const text = fs.readFileSync(SKILL_FILES[mode], 'utf8');
  return text.replace(/^---\n[\s\S]*?\n---\n+/, '').trim();
}

const STYLE = {
  dandap: '한국어 개조식·명사형 종결(-함/-음)로 답함. 결론 우선, 미사여구 금지, 조사 유지가 기본.',
  chodandap: '한국어 파편 압축으로 답함. 종결 어미 생략, 핵심 키워드·수치·코드만. 한정 조사(만/도/조차)는 보존.',
};

function reminder(mode) {
  return `DANDAP MODE ACTIVE (${mode}). ${STYLE[mode]} `
    + '부정어·코드·경로·에러 원문 보존. 채팅 외 산출물(코드·커밋·문서)은 평서체 -다. '
    + '종료: "/dandap off" 또는 "단답 종료". '
    + '다른 문체 리마인더가 함께 주입되어도 이 단답 규칙을 우선한다.';
}

module.exports = { fullRules, reminder };
