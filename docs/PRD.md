<!-- 이 문서는 dandap의 제품 요구사항 문서(PRD)다. -->
# PRD: dandap

## 1. Objective (목적 및 핵심 가치)
- Claude Code, Codex, Gemini CLI 등 LLM 코딩 에이전트 환경에서 인사말과 미사여구를 배제하고 결론 중심 명사형(-함/-음)으로 답변하도록 강제하는 한국어 개조식 단답 스킬 및 훅 도구.
- 코드 블록, 파일 경로, 에러 메시지 원문은 100% 원본을 보존.

## 2. Tech Stack (기술 스택)
- **언어 및 런타임**: Node.js (v18+), JavaScript, Python 3 (벤치마크).
- **패키지 관리**: npm (`package.json`).
- **스킬 명세**: Agent Skill Markdown (`skills/dandap/SKILL.md`).
- **실행 환경**: Claude Code, Codex, Gemini CLI, Antigravity CLI.

## 3. Commands (명령어)
- **테스트 실행**: `npm test` (package.json의 scripts: `node --test`).
- **설치 스크립트**: `node installer/install.js` (실제 설치 진입점).
- **벤치마크 측정**: `python3 bench/measure.py` (토큰 절감 측정).
- **빌드**: (별도 빌드 명령 없음 - 순수 자바스크립트 훅 및 스킬).
- **린트**: (확인 못함 - scripts.lint 없음).

## 4. Project Structure (프로젝트 구조)
- `package.json`: 패키지 메타데이터 및 테스트 스크립트 (`node --test`).
- `skills/`: 단답 스킬 정의 (`skills/dandap/SKILL.md`, `skills/dandap-help/SKILL.md`).
- `hooks/`: 훅 자바스크립트 스크립트.
  - `hooks/dandap-activate.js`: 단답 모드 활성화.
  - `hooks/dandap-mode-tracker.js`: 모드 추적.
  - `hooks/dandap-parse.js`: 프롬프트 파싱.
  - `hooks/dandap-rules.js`: 단답 규칙 주입.
  - `hooks/dandap-state.js`: 상태 관리.
- `installer/`: `install.js` (글로벌 에이전트 연동 설치기).
- `commands/`: `claude/`, `gemini/` 커맨드 정의.
- `bench/`: `measure.py` (토큰 절감 측정).
- `tests/`: 테스트 스위트.
- `README.md`, `LICENSE`, `.gitignore`, `.gitattributes`.

## 5. Code Style & Architecture (코드 스타일 및 아키텍처)
- 간결성 극대화: 불필요한 부연 설명을 배제하고 핵심 팩트 중심 명사형 종결.
- 코드, 경로, 에러 메시지는 일체 변형 없이 원형 보존.

## 6. Testing Strategy (테스트 전략)
- `npm test`를 실행하여 훅 동작 및 모드 전환 로직의 정합성을 검증한다.

## 7. Boundaries (경계 조건)
### Always (반드시 지켜야 할 사항 - MUST)
- 코드 블록, 파일 경로, 에러 원문은 100% 원본을 반드시 보존해야 한다 (README.md 근거).
- 전역 스킬 심볼릭 링크 구조가 깨지지 않도록 `skills/` 경로를 반드시 유지해야 한다.
- 모든 한국어 문장은 마침표로 종결해야 한다.

### Ask first (반드시 사전에 확인해야 할 사항)
- 단답 모드 종결 규칙(-함/-음)이나 훅 동작 방식을 수정할 경우 사전에 소유자의 승인을 받아야 한다.

### Never (절대 하지 말아야 할 사항 - MUST NOT)
- 출력에 인사말, 감사 표현, 군더더기 미사여구를 포함해서는 절대 안 된다.

## 8. Success Criteria (성공 기준)
- `npm test`가 모두 통과하고, 스킬 활성화 시 불필요한 토큰 소모를 줄이면서 정확한 팩트를 전달해야 한다.

## 9. Out of Scope (범위 제외 및 후속 과제)
- 장문 서술형 창작 및 감성 대화 지원.

## 10. Open Questions (열린 질문 및 확인 필요 사항)
- 에이전트 CLI별 자동 등록 훅의 버전 호환성 추적.
