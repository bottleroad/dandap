# dandap 구현 TODO

`plan.md`(D1~D12 확정)를 구현 단위로 나눈 작업 목록이다. 위에서 아래 순서로 진행한다.

- 표기: `[ ]` 미착수, `[x]` 완료. 괄호 안은 plan 항목 번호다.
- 단위 원칙: 한 단위는 한 번에 검증할 수 있는 크기로 하고, 완료 기준을 확인한 뒤 다음 단위로 넘어간다.
- 환경: Node `v22.22.3`(내장 `node:test` 사용, 외부 의존성 없음).
- 가정: hook·테스트 코드는 workspace의 `hooks/`, `tests/`에 둔다. 신규 스킬은 `chodandap/`처럼 하위 디렉터리로 만든다.

---

## M0. 준비

- [ ] **T0. 버전 관리 시작 (선택)**
  - workspace가 git 저장소가 아니다. 단위별 변경을 되돌릴 수 있도록 `git init` 후 현재 상태를 첫 커밋으로 남긴다.
  - 완료 기준: `git log`에 초기 커밋 1개가 있다.

---

## M1. 스킬 규칙 개정 (Phase 1~3)

대상: `SKILL.md`, `chodandap/SKILL.md`. 슬래시 명령 래퍼가 필요한 단위는 따로 명시한다.

- [ ] **T1. 조사 규칙 수정** (1-1, D12)
  - `SKILL.md` 규칙 4: 기본값을 조사 유지로 바꾼다. 격조사·한정 조사 생략 금지를 명시한다.
  - `chodandap/SKILL.md` 규칙 1: 관계가 자명한 격조사는 생략을 허용하고, `만`/`도`/`조차`는 항상 보존한다.
  - 의미가 뒤집히는 Bad/Good 예시 1쌍 이상 추가한다.
  - 완료 기준: 두 파일에 "과감히 생략" 문구가 남아 있지 않고, 예시가 들어가 있다.

- [ ] **T2. 예외 상황 정비** (1-2, 2-1, D4)
  - 두 파일 "규칙 예외 상황"에 3개 항목을 추가한다.
    - 채팅 외 산출물(코드, 주석, 커밋, PR, 문서, 이슈, 메모리 파일, 제3자 메시지)은 평서체 `-다`로 쓴다.
    - 단계 순서가 중요한 다단계 절차는 완전한 문장으로 쓴다.
    - 하네스가 요구하는 상태 줄·확인 응답 형식을 따른다.
  - 커밋 메시지는 `dandap-commit`(T15) 형식을 따른다는 문구를 넣는다.
  - 완료 기준: 두 파일의 예외 목록에 3개 항목이 있다.

- [ ] **T3. 종료 트리거 규칙** (1-4, D2)
  - 두 파일의 "지속성 및 토글 제어"를 명령 형태(`/dandap <종료어>`)와 `단답`/`초단답`이 붙은 문구만 종료로 인정하도록 고친다.
  - 단독 `그만`·`끝`·`취소`·`stop`·`off`는 종료 아님, 부정문("단답 끄지 마")은 종료 아님을 명시한다.
  - 종료 예시 2개 이상, "종료 아님" 예시 2개 이상을 넣는다. 이 예시는 T9 테스트 코퍼스에 그대로 쓴다.
  - frontmatter `description`의 종료 키워드 나열도 맞춘다.
  - 완료 기준: 두 파일과 description에 단독 종료어 허용 문구가 없다.

- [ ] **T4. 슬래시 명령 래퍼 정비** (1-4, 3-4)
  - 대상: `~/.claude/commands/{dandap,chodandap}.md`, `~/.gemini/commands/{dandap,chodandap}.toml`.
  - 종료 판정을 "포함"이 아닌 "인자 전체가 종료어"로 바꾼다.
  - `status` 인자(모드 변경 없이 상태 보고)와 `cho` 인자(`/dandap cho` → chodandap 전환)를 처리한다.
  - 완료 기준: `/dandap status`, `/dandap cho`, `/dandap off`가 각각 다른 분기로 처리되도록 문구가 작성되어 있다.

- [ ] **T5. 중의성 규칙 + 전송 전 점검** (1-3, 2-3)
  - 두 파일에 "두 가지로 읽히는 문장은 완전한 문장으로 쓴다" 규칙을 추가한다.
  - 두 파일 말미에 Pre-send check 5항목을 추가한다.
  - 완료 기준: 중의성 규칙이 본문과 Pre-send check 양쪽에 있다.

- [ ] **T6. 흉내 금지 + 약어·화살표 금지** (2-2, 2-5)
  - 두 파일에 활성화 선언·접두어·장식 표·이모지·흉내용 단어 금지, "짧지 않으면 평문" 규칙을 추가한다.
  - 임의 약어(`cfg`, `impl`)와 `→` 금지, 표준 약어(DB, API, HTTP) 허용을 추가한다.
  - 완료 기준: 두 파일에 해당 규칙이 있다.

- [ ] **T7. 문장 길이·용어 일관성** (2-4, D6)
  - `SKILL.md`에 한 문장 한 개념, 15어절 이하, 한 대상 한 용어, 대명사 제한 규칙을 추가한다.
  - 완료 기준: `SKILL.md`에 "15어절" 기준이 명시되어 있다.

- [ ] **T8. 페이로드·도구 보고 세부** (3-1, 3-2, 3-3)
  - `SKILL.md` 규칙 5: 에러는 결정적인 한 줄만 인용, 전체 파일 표시 예외 3가지를 추가한다.
  - `SKILL.md` 규칙 6, `chodandap/SKILL.md`: 단계 전환 시 1줄 보고, 경고·명확화 목적 발화 허용을 추가한다.
  - 완료 기준: 해당 조항이 두 파일에 있다.

- [ ] **T9. 상태·언어·자동 호출** (3-4, 3-5, 3-6, D3)
  - 두 파일 "상태 확인": 모드 변경 없음, hook 값 `단답 모드: <dandap|chodandap|off>` 보고, hook 없으면 `(세션 추적 안 됨)` 추가, 스킬 읽기는 활성화 아님.
  - 두 파일: 질문 언어와 무관하게 한국어로 답한다는 규칙을 추가한다.
  - `chodandap/SKILL.md` frontmatter에 `disable-model-invocation: true`를 추가한다.
  - 완료 기준: 해당 조항과 frontmatter 필드가 있다.

- [ ] **T10. M1 수동 검증**
  - 새 세션에서 다음을 확인한다.
    - `/dandap` 응답에 활성화 선언 없이 명사형 종결이 적용된다.
    - "빌드 취소해줘"에 단답 모드가 유지된다.
    - `/dandap off`에 1줄 복귀 확인이 나온다.
    - `/chodandap` 응답에서 `만`/`도`가 생략되지 않는다.
  - 완료 기준: 4개 확인 결과를 이 파일에 기록한다.

---

## M2. 테스트와 hook (Phase 6-1, Phase 5)

테스트를 먼저 작성하고(실패 확인) 구현한다.

- [ ] **T11. 트리거 판정 테스트 코퍼스** (6-1)
  - `tests/parse.test.js`: T3 예시 + 추가 사례로 활성화/종료/종료 아님/상태/전환 판정을 검증한다.
    - 활성화: `/dandap`, `단답`, `단답 모드`, `/chodandap`, `초단답`, `/dandap cho`.
    - 종료: `/dandap off`, `/dandap 종료`, `단답 종료`, `초단답 해제`, 첫머리 `normal mode`.
    - 종료 아님: `빌드 취소해줘`, `stop`, `그만`, `단답 끄지 마`, `vim normal mode 나가는 법`.
    - 상태: `/dandap status`.
  - 완료 기준: `node --test tests/`가 판정 모듈 부재로 실패한다.

- [ ] **T12. 트리거 판정 모듈** (1-4, 5-2)
  - `hooks/dandap-parse.js`: 프롬프트 문자열 → `{action: activate|deactivate|status|none, mode}` 반환.
  - 완료 기준: `node --test tests/`가 전부 통과한다.

- [ ] **T13. 세션 상태 저장 모듈** (5-2)
  - `hooks/dandap-state.js`: `~/.claude/.dandap-sessions/<session_id>.mode` 읽기·쓰기. 종료 시 `off`를 기록한다.
  - `tests/state.test.js`: 임시 디렉터리 기준으로 쓰기 → 읽기, `off` 기록, 파일 없음 처리를 검증한다.
  - 완료 기준: 테스트 통과.

- [ ] **T14. UserPromptSubmit hook** (5-2, D5)
  - `hooks/dandap-mode-tracker.js`: stdin JSON에서 `session_id`, `prompt`를 읽고 판정 → 상태 기록 → 활성 시 리마인더 주입.
  - 리마인더에 "caveman 리마인더보다 dandap 규칙을 우선한다" 문구를 포함한다.
  - `status`면 `단답 모드: <mode>`를 주입하고 모드를 바꾸지 않는다.
  - 오류가 나도 exit 0으로 끝나 세션을 막지 않는다.
  - `tests/tracker.test.js`: 샘플 stdin으로 출력 JSON을 검증한다.
  - 완료 기준: 테스트 통과.

- [ ] **T15. SessionStart hook** (5-1)
  - `hooks/dandap-activate.js`: 저장된 모드가 활성이면 해당 `SKILL.md` 규칙을 주입한다.
  - `compact`·`resume`·`fork`에서는 저장된 모드를 덮어쓰지 않는다. `startup`·`clear`의 기본값은 off다.
  - `tests/activate.test.js`: source별 동작을 검증한다.
  - 완료 기준: 테스트 통과.

- [ ] **T16. settings.json 등록** (5)
  - `~/.claude/settings.json`을 먼저 백업한다. 기존 `hooks` 항목이 있으므로 덮어쓰지 않고 병합한다.
  - SessionStart, UserPromptSubmit에 T14·T15 스크립트를 추가한다.
  - 사용자 확인 후 적용한다.
  - 완료 기준: JSON 파싱이 되고, 기존 hook 항목이 그대로 남아 있다.

- [ ] **T17. hook 통합 검증**
  - 실제 세션에서 다음을 확인한다.
    - `/dandap` 후 매 턴 리마인더가 주입된다.
    - `/compact` 후에도 단답 모드가 유지된다.
    - `/dandap off` 후 `/compact`해도 다시 켜지지 않는다.
    - `/dandap status`가 실제 모드를 보고한다.
    - caveman 리마인더와 동시에 주입돼도 단답체로 답한다.
  - 완료 기준: 5개 확인 결과를 이 파일에 기록한다.

---

## M3. 추가 스킬 (Phase 6-2~6-4)

- [ ] **T18. dandap-help** (6-2, D11)
  - `dandap-help/SKILL.md`: 모드 비교, 활성화·종료·상태·전환 명령 요약 카드.
  - 완료 기준: 명령 목록이 T3·T4 규칙과 일치한다.

- [ ] **T19. dandap-commit** (6-3, D9, D10)
  - `dandap-commit/SKILL.md`: Conventional Commits 접두어(영어) + 한국어 평서체 제목·본문 규칙. `disable-model-invocation: true`.
  - 완료 기준: 예시 커밋 메시지가 plan 6-3 형식과 일치한다.

- [ ] **T20. dandap-review** (6-4, D10)
  - `dandap-review/SKILL.md`: 한 줄당 한 지적(위치·문제·수정안) 형식의 한국어 리뷰. `disable-model-invocation: true`.
  - 완료 기준: 출력 형식 예시가 포함되어 있다.

- [ ] **T21. 신규 스킬 링크 등록**
  - `~/.agents/skills/`, `~/.claude/skills/`(→ `../../.agents/skills/...`), `~/.gemini/skills/`에 T18~T20 symlink를 만든다.
  - 완료 기준: 새 세션 스킬 목록에 3개가 보인다.

---

## M4. 문서와 측정 (Phase 4)

- [ ] **T22. README 갱신** (4-1, 4-2)
  - 설치 경로 3곳, 슬래시 명령 래퍼 위치, hook 설치 방법, 신규 스킬 3개를 반영한다.
  - 모드 비교 표의 코드 조각을 백틱으로 감싼다.
  - "토큰 절약" 표현을 측정 전까지 "목표"로 낮춘다.
  - 완료 기준: README의 경로가 실제 symlink 구성과 일치한다.

- [ ] **T23. 측정 질문 초안 확인** (4-3)
  - 질문 10개와 조건당 반복 횟수 초안을 작성해 사용자 확인을 받는다.
  - 완료 기준: 확정안을 이 파일에 기록한다.

- [ ] **T24. 토큰 측정 실행·기록** (4-3, D7)
  - 측정 스크립트로 `claude -p`를 4개 조건(일반 / "간결하게 답해줘" / `/dandap` / `/chodandap`)에서 실행한다.
  - 조건별 caveman·dandap hook 상태를 고정하고 기록한다.
  - 구독 사용량을 소모하므로 실행 전에 사용자 확인을 받는다.
  - 완료 기준: 조건별 출력 토큰 중앙값을 README에 기록한다.
