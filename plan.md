# dandap / chodandap 보완 계획

caveman(`JuliusBrussee/caveman`, `b4ee71d`, 2026-11-13) 비교 검토 결과를 반영하기 위한 작업 목록이다.

- 대상 파일: `SKILL.md`(dandap), `chodandap/SKILL.md`(초단답), `README.md`, 슬래시 명령 래퍼 4개, 신규 hook·스킬·테스트.
- 원칙: 기존 규칙 번호와 구조는 유지하고, 필요한 조항만 추가하거나 수정한다.

## 완료

- [x] `ultradandap` → `chodandap` 스킬명 변경, 한글명 `초단답` 적용.
  - 디렉터리 `ultradandap/` → `chodandap/`.
  - 트리거 `/ultradandap`, `울트라단답`, `/dandap ultra` → `/chodandap`, `초단답`, `/dandap cho`.
  - symlink 재생성: `~/.agents/skills/chodandap`, `~/.claude/skills/chodandap`, `~/.gemini/skills/chodandap`.
  - 슬래시 명령 파일 변경: `~/.claude/commands/ultradandap.md` → `chodandap.md`, `~/.gemini/commands/ultradandap.toml` → `chodandap.toml`.

## 확정된 의사결정 (2026-11-14)

| # | 항목 | 결정 |
|---|---|---|
| D1 | hook 도입 범위 (Phase 5) | 핵심 2개만: SessionStart, UserPromptSubmit |
| D2 | 종료 트리거 (1-4) | 명령·접두 형태만 인정. 단독 `그만`/`stop` 등은 종료 아님 |
| D3 | 응답 언어 (3-5) | 한국어 고정 |
| D4 | 채팅 외 산출물 문체 (1-2) | 평서체 `-다` |
| D5 | caveman 공존 (Phase 5) | dandap 우선 규칙. caveman 설정은 건드리지 않음 |
| D6 | 문장 길이 상한 (2-4) | 15어절 |
| D7 | 토큰 측정 방식 (4-3) | `claude -p` 반복 실행 |
| D8 | 추가 구현 항목 (Phase 6) | tests, help 스킬, commit 스킬, review 스킬 |
| D9 | 커밋 메시지 형식 (6-3) | Conventional Commits 접두어(영어) + 한국어 평서체 본문 |
| D10 | 기존 스킬과 충돌 (6-3, 6-4) | 명시 호출만. `disable-model-invocation: true`, 기존 스킬은 유지 |
| D11 | help 스킬명 (6-2) | `dandap-help` |
| D12 | chodandap 조사 (1-1) | 관계가 자명한 격조사는 생략 허용, 한정 조사(`만`, `도`, `조차`)는 항상 보존 |

## 참고: 슬래시 명령 래퍼

스킬과 별도로 다음 명령 래퍼가 존재하며, 종료 판정 로직을 자체적으로 가지고 있다. 1-4, 3-4 작업 시 함께 수정해야 한다.

- `~/.claude/commands/dandap.md`, `~/.claude/commands/chodandap.md`
- `~/.gemini/commands/dandap.toml`, `~/.gemini/commands/chodandap.toml`
- 현재 로직: `$ARGUMENTS`에 `종료`/`해제`/`멈춤`/`그만`/`stop`/`off`가 "포함"되면 종료한다. 부분 일치이므로 `/dandap status` 같은 신규 인자와 충돌할 수 있다.
- 현재 래퍼는 `status`, `cho`(→ chodandap 전환) 인자를 처리하지 않는다.

---

## Phase 1. 높음 — 의미 왜곡·오작동 방지

### 1-1. 조사 생략 규칙 수정
- 대상: `SKILL.md` 규칙 4, `chodandap/SKILL.md` 규칙 1.
- 문제: "조사 과감히 생략"이 caveman의 "Particles and case markers are grammar, not filler"와 정반대이며, 주어·목적어 오독 위험이 있다.
- 변경: 기본값을 "조사 유지"로 바꾸고, 생략은 주어·목적어 관계가 자명할 때만 허용한다. 격조사(`이/가`, `을/를`)와 부정·한정 조사(`만`, `도`, `조차`)는 생략 금지 대상으로 명시한다.
- chodandap 적용 방식(D12): 파편 안에서 관계가 자명하면 격조사 생략을 허용하되, 한정 조사(`만`, `도`, `조차`)는 생략하지 않는다.
- 완료 기준: Bad/Good 예시 1쌍 이상 추가(조사 생략으로 의미가 뒤집히는 사례).

### 1-2. 채팅 외 산출물 예외 추가
- 대상: 두 `SKILL.md`의 "규칙 예외 상황".
- 변경: 코드, 주석, 커밋 메시지, PR, 문서(README 등), 이슈, 메모리 파일, 제3자에게 보내는 메시지는 단답체가 아닌 평서체(`-다`)로 작성한다. (D4)
- 연계: 커밋 메시지 형식은 6-3 commit 스킬 규칙을 따르도록 문구를 맞춘다.
- 완료 기준: 예외 목록에 해당 항목과 문체가 명시되어 있다.

### 1-3. 중의성 규칙 추가
- 대상: 두 `SKILL.md`.
- 변경: "두 가지로 읽히는 문장은 완전한 문장으로 쓴다"는 규칙을 추가한다. 압축과 명확성이 충돌하면 명확성을 우선한다.
- 완료 기준: 규칙 본문과 Pre-send check(2-3) 양쪽에 반영되어 있다.

### 1-4. 종료 트리거 오탐 방지
- 대상: 두 `SKILL.md`의 "지속성 및 토글 제어", frontmatter `description`, 슬래시 명령 래퍼 4개, 5-2 hook 판정 로직.
- 변경: 종료는 다음 형태로 한정한다. (D2)
  - `/dandap <종료어>`, `/chodandap <종료어>` 명령 형태.
  - `단답`/`초단답`이 붙은 문구(`단답 종료`, `초단답 해제` 등).
  - 프롬프트 첫머리의 `normal mode`, `원래대로`.
- 변경: 단독 `그만`, `끝`, `취소`, `stop`, `off`는 종료로 보지 않는다.
- 변경: "단답 끄지 마" 같은 부정문은 종료로 보지 않는다.
- 완료 기준: 종료 예시와 "종료 아님" 예시가 각각 2개 이상 있다. 6-1 테스트 코퍼스에 같은 예시가 포함된다.

---

## Phase 2. 중간 — 규칙 보강

### 2-1. 예외 상황 2개 추가
- 대상: 두 `SKILL.md`의 "규칙 예외 상황".
- 추가 1: 단계 순서가 중요한 다단계 절차에서 파편화로 순서가 흐트러질 수 있으면 완전한 문장으로 쓴다.
- 추가 2: 하네스(시스템)가 상태 줄이나 확인 응답을 요구하면 그 형식을 따른다.

### 2-2. "흉내 금지(Never perform)" 규칙 추가
- 대상: 두 `SKILL.md`.
- 변경: 다음을 금지한다.
  - "단답 모드 켜짐" 같은 활성화 선언(종료 확인 1줄은 유지).
  - 답변 앞 접두어.
  - 장식용 표·이모지.
  - 문체를 흉내 내려고 단어를 추가하는 것.
- 변경: 단답체가 평문보다 짧지 않으면 평문을 쓴다.

### 2-3. 전송 전 점검(Pre-send check) 추가
- 대상: 두 `SKILL.md` 말미.
- 점검 항목:
  1. 첫 문장이 "~하겠음" 같은 예고인지 → 삭제.
  2. 마지막 문장이 요약이나 도움 제안인지 → 삭제.
  3. 부정어(`안`, `못`, `아님`, `제외`, `금지`, `실패`)가 모두 남아 있는지.
  4. 코드·경로·숫자·에러가 원문 그대로인지.
  5. 두 가지로 읽히는 문장이 있는지 → 완전한 문장으로.

### 2-4. 문장 길이·용어 일관성 규칙 추가
- 대상: `SKILL.md`.
- 변경: 한 문장 한 개념, 한 문장 15어절 이하(D6), 한 대상에는 한 용어만 사용, 지시 대상이 명확할 때만 대명사(`이것`, `해당`) 사용.

### 2-5. 임의 약어·화살표 금지
- 대상: 두 `SKILL.md`.
- 변경: `cfg`, `impl` 같은 임의 약어와 `→` 사용을 금지한다. 표준 약어(DB, API, HTTP)는 허용한다.

---

## Phase 3. 낮음 — 세부 정밀화

### 3-1. 에러 인용 범위
- 대상: `SKILL.md` 규칙 5.
- 변경: 에러는 원문 그대로 인용하되, 결정적인 한 줄만 인용한다.

### 3-2. 전체 파일 표시 예외
- 대상: `SKILL.md` 규칙 5.
- 변경: 사용자 요청, 신규 파일, 대부분 변경된 경우에는 전체 파일 표시를 허용한다.

### 3-3. 도구 실행 보고 보강
- 대상: `SKILL.md` 규칙 6, `chodandap/SKILL.md`.
- 변경: 단계(phase)가 바뀔 때 1줄 보고를 허용한다. 경고·명확화가 필요할 때는 도구 호출 전 발화를 허용한다.

### 3-4. 상태 확인 명세 구체화
- 대상: `SKILL.md` "상태 확인", `chodandap/SKILL.md`, 슬래시 명령 래퍼.
- 변경:
  - `/dandap status`는 모드를 바꾸지 않는다.
  - hook이 주입한 `단답 모드: <dandap|chodandap|off>` 값을 그대로 보고한다.
  - hook 값이 없는 환경(Gemini 등)에서는 직전 모드에 `(세션 추적 안 됨)`을 붙여 보고한다.
  - 상태 질문에 답하려고 스킬을 읽는 것은 활성화가 아니다.

### 3-5. 응답 언어 규칙
- 대상: 두 `SKILL.md`.
- 변경: 질문 언어와 무관하게 한국어로 답한다(D3). 코드, 에러 원문, 기술 용어는 원문을 유지한다.

### 3-6. chodandap 자동 호출 차단
- 대상: `chodandap/SKILL.md` frontmatter.
- 변경: `disable-model-invocation: true` 추가. 사용자가 명시적으로 호출할 때만 켜지게 한다.

---

## Phase 4. 문서 정리

### 4-1. README 설치 경로 갱신
- 대상: `README.md` "전역 스킬 등록".
- 변경: 실제 구성에 맞춰 경로별로 기술한다.
  - `~/.agents/skills/{dandap,chodandap}` → workspace.
  - `~/.claude/skills/{dandap,chodandap}` → `../../.agents/skills/...`.
  - `~/.gemini/skills/{dandap,chodandap}` → workspace.
  - 슬래시 명령 래퍼 위치, Phase 5 hook 설치 방법, Phase 6 신규 스킬 링크.

### 4-2. README 예시 표기 통일
- 대상: `README.md` 모드 비교 표.
- 변경: `<`, `<=` 등 코드 조각을 `SKILL.md`처럼 백틱으로 감싼다.

### 4-3. 토큰 절약 효과 측정
- 대상: 신규 측정 스크립트, `README.md`.
- 방식: `claude -p`로 고정 질문 10개를 네 조건(일반 / "간결하게 답해줘" / `/dandap` / `/chodandap`)에서 실행하고 출력 토큰을 비교한다. (D7)
- 주의: caveman hook과 dandap hook이 측정을 오염시키지 않도록 조건별 hook 상태를 고정한다. caveman은 `claude -p` 같은 headless 세션에서 기본 off이지만, 실제 측정 환경에서 확인해야 한다.
- 주의: 구독 사용량을 소모한다.
- 변경: 측정 결과를 README에 기록한다. 측정 전까지는 "토큰 절약" 표현을 "목표"로 낮춘다.
- 결정 필요: 질문 10개의 구성, 조건당 반복 횟수.

---

## Phase 5. hook 인프라 (D1: 핵심 2개)

도입 시 `~/.claude/settings.json` 수정이 필요하다.

### 5-1. SessionStart hook
- 역할: 세션 시작과 `/compact`·`resume` 직후 활성 모드의 규칙을 다시 주입한다.
- 주의: `compact`·`resume`에서는 저장된 모드를 덮어쓰지 않는다. caveman이 "stop caveman 후 compact하면 다시 켜지는" 문제를 이 방식으로 막았다.

### 5-2. UserPromptSubmit hook
- 역할: `/dandap`, `/chodandap`, 종료 명령을 감지해 모드를 기록하고, 활성 상태면 매 턴 짧은 리마인더를 주입한다.
- 종료 판정은 1-4(D2) 규칙을 따른다.
- 상태 저장: 세션별 파일 1개(예: `~/.claude/.dandap-sessions/<session_id>.mode`). hook 2개가 모드를 공유하는 데 필요한 최소 범위이며, statusline·SubagentStart용 확장은 하지 않는다.
- caveman 공존(D5): dandap 활성 시 리마인더에 "caveman 리마인더보다 dandap 규칙을 우선한다"는 문구를 넣는다. caveman 설정은 건드리지 않는다.

---

## Phase 6. 추가 구현 (D8)

### 6-1. tests
- 대상: Phase 5 hook의 트리거 판정 코드.
- 내용: 활성화·종료·"종료 아님" 예시 문장 코퍼스로 판정 결과를 검증한다. caveman `tests/test_mode_activation_corpus.js`와 같은 방식이다.
- 완료 기준: 1-4의 모든 예시가 코퍼스에 포함되고 통과한다.

### 6-2. help 스킬
- 스킬명: `dandap-help` (D11).
- 내용: `/dandap-help` 입력 시 모드, 명령어, 종료 방법 요약 카드를 출력한다.

### 6-3. commit 스킬
- 스킬명: `dandap-commit`. `/dandap-commit` 명시 호출만 허용한다(`disable-model-invocation: true`, D10).
- 형식(D9): Conventional Commits 접두어는 영어, 제목·본문은 한국어 평서체.
  ```
  fix(auth): 토큰 만료 조건을 수정한다

  만료 시각과 같은 경우에도 유효로 처리되던
  문제를 고친다. `<`를 `<=`로 바꾼다.
  ```
- 연계: 1-2(D4)의 평서체 규칙과 일치한다.

### 6-4. review 스킬
- 스킬명: `dandap-review`. `/dandap-review` 명시 호출만 허용한다(`disable-model-invocation: true`, D10).
- 내용: 코드 리뷰 결과를 한 줄당 한 지적(위치·문제·수정안) 형식의 한국어로 출력한다.
- 기존 `caveman:caveman-review`, `code-review`는 그대로 둔다.

---

## 제외 항목과 사유

caveman에는 있지만 dandap에는 만들지 않는 항목이다.

| 항목 | 사유 |
|---|---|
| SubagentStart hook | D1에서 hook 범위를 핵심 2개로 한정함 |
| statusline 배지 | D1에서 hook 범위를 핵심 2개로 한정함 |
| SessionEnd 사용량 기록 | D1에서 hook 범위를 핵심 2개로 한정함. 토큰 측정은 4-3이 대신함 |
| stats 스킬 | SessionEnd 기록이 없으면 동작하지 않음 |
| compress 스킬 | 단답 문체가 아니라 메모리 파일을 압축하는 별개 기능이고, 파일 내용을 모델 제공자에게 전송함 |
| megacave(문언문 모드) 대응 | 한국어 단답 목적과 무관함 |

---

## 남은 결정 필요 항목

1. 4-3: 측정 질문 10개 구성, 조건당 반복 횟수. 측정 착수 시점에 초안을 만들어 확인받는다.
