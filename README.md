# dandap (단답) 🤫

> **"불필요한 미사여구는 버리고, 기술적 팩트와 페이로드만 남긴다."**
> [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman)에서 영감을 받아 만든 **AI 코딩 에이전트용 한국어 개조식 단답 스킬**이다.

---

## ⚡ 왜 단답(dandap)인가?

1. **출력 토큰 절약**: 의례적 인사말과 완곡어법을 걷어내 응답을 줄인다. 측정 결과 출력 토큰 중앙값이 일반 대비 단답 -25.6%, 초단답 -53.8%였다. 단, 단답은 "간결하게 답해줘" 한 줄보다 길었다([측정 결과](#-토큰-절약-효과)).
2. **터미널 가독성**: 엔지니어에게 필요한 것은 [결함 원인], [수정 내용], [다음 조치]뿐이다.
3. **한국어 최적화**: 번역 투가 아닌 실무 개발팀의 개조식 보고 톤(`~함`, `~음`, `조치 완료`)으로 답한다.
4. **페이로드 원문 보존**: 코드, 파일 경로, CLI 명령어, 에러 메시지 원문은 한 글자도 바꾸거나 줄이지 않는다.

---

## 🎛️ 모드 비교

| 구분 | 일반 모드 (Normal) | **dandap (단답)** | **chodandap (초단답)** |
| :--- | :--- | :--- | :--- |
| **명령어** | 기본 | `/dandap` | `/chodandap` (또는 `/dandap cho`) |
| **톤** | 친절하고 완전한 구어체 문장 | 간결한 개조식·명사형 종결 (`~함`, `~음`) | 단어·파편(Fragment) 나열, 어미 생략 |
| **조사** | 모두 유지 | 유지가 기본. 관계가 자명할 때만 `은/는`, `의` 생략 | 자명한 격조사 생략 허용. `만`/`도`/`조차`는 보존 |
| **답변 예시** | "확인해보니 토큰 만료 조건문에 버그가 있었습니다. `<`를 `<=`로 변경하여 수정했습니다. 서버를 재시작해 주세요." | "auth 미들웨어 토큰 만료 조건 오류 확인됨. `<` 연산자를 `<=`로 수정함. 재기동 필요." | "인증 오류. `<` 대신 `<=`. 수정 완료. 재시작." |
| **추천 상황** | 복잡한 개념 학습, 설명 요구 | **일반 개발, 코드 리뷰, 기능 구현** | **긴급 디버깅, 좁은 터미널, 반복 루프** |

두 모드 공통 규칙:

* 결론부터 말하고, 인사·완곡어법·마무리 인사를 쓰지 않는다.
* 부정어(`안`, `못`, `아님`, `제외`, `금지`, `실패`)는 생략하지 않는다.
* 두 가지로 읽히는 문장, 순서가 중요한 절차, 보안 경고, 파괴적 작업 확인, 사용자에게 하는 질문은 완전한 문장으로 쓴다.
* 질문 언어와 무관하게 한국어로 답한다.
* 코드, 주석, 커밋, PR, 문서 등 채팅 밖에 남는 산출물은 단답체가 아닌 평서체(`-다`)로 쓴다.

---

## 🚀 사용법

### 켜기

* `/dandap`, `단답`, `단답 모드`: 단답 모드
* `/chodandap`, `초단답`, `/dandap cho`: 초단답 모드

### 끄기

아래 형태만 종료로 인정한다.

* 명령: `/dandap off`, `/dandap 종료`, `/dandap 해제`, `/chodandap off`
* 문구: `단답 종료`, `단답 해제`, `초단답 해제`, `단답 모드 종료해줘`
* 프롬프트 전체가 `normal mode` 또는 `원래대로`

다음은 종료로 보지 않는다.

* 단독 종료어: `그만`, `끝`, `취소`, `stop`, `off`
* 작업 요청: `빌드 취소해줘`, `서버 stop 명령어 알려줘`
* 부정문: `단답 끄지 마`, `단답 종료하지 마`
* 문장 중간의 `normal mode`: `vim normal mode 나가는 법`

### 상태 확인

* `/dandap status`: 모드를 바꾸지 않고 `단답 모드: <dandap|chodandap|off>` 한 줄로 보고한다.
* hook이 설치되지 않은 환경(Gemini CLI 등)에서는 `(세션 추적 안 됨)`이 붙는다.

### 관련 스킬

| 스킬 | 호출 | 역할 |
|---|---|---|
| `dandap-help` | `/dandap-help`, `단답 도움말` | 모드·명령 요약 카드 |
| `dandap-commit` | `/dandap-commit` | Conventional Commits 접두어 + 한국어 평서체 커밋 메시지 작성 |
| `dandap-review` | `/dandap-review` | 한 줄 한 지적(위치·문제·수정안) 한국어 코드 리뷰 |

`dandap-commit`, `dandap-review`, `chodandap`은 `disable-model-invocation: true`로 설정되어 있어 명시적으로 호출할 때만 동작한다.

---

## 📁 구성

```
dandap/
├── SKILL.md                 # dandap(단답) 스킬
├── chodandap/SKILL.md       # chodandap(초단답) 스킬
├── dandap-help/SKILL.md     # 도움말 카드
├── dandap-commit/SKILL.md   # 커밋 메시지 스킬
├── dandap-review/SKILL.md   # 코드 리뷰 스킬
├── hooks/                   # Claude Code hook (모드 유지)
│   ├── dandap-activate.js       # SessionStart: compact·resume 후 규칙 재주입
│   ├── dandap-mode-tracker.js   # UserPromptSubmit: 명령 감지, 매 턴 리마인더
│   ├── dandap-parse.js          # 활성화·종료·상태 판정
│   ├── dandap-state.js          # 세션별 상태 파일 읽기·쓰기
│   └── dandap-rules.js          # 주입할 규칙 전문·리마인더 문구
├── tests/                   # node:test 테스트
├── plan.md                  # 보완 계획
└── todo.md                  # 구현 목록
```

---

## 📂 설치

### 1. 스킬 링크

저장소를 내려받은 위치를 `DANDAP_DIR`로 둔다. 아래는 Claude Code(`~/.claude/skills`)와 Gemini CLI(`~/.gemini/skills`)에서 같은 스킬을 쓰도록 `~/.agents/skills`를 거쳐 연결하는 구성이다.

```bash
DANDAP_DIR="$HOME/workspace/my-skills/dandap"   # 저장소 위치에 맞게 수정

for s in dandap chodandap dandap-help dandap-commit dandap-review; do
  src="$DANDAP_DIR"; [ "$s" != dandap ] && src="$DANDAP_DIR/$s"
  ln -s "$src" "$HOME/.agents/skills/$s"
  ln -s "../../.agents/skills/$s" "$HOME/.claude/skills/$s"
  ln -s "$src" "$HOME/.gemini/skills/$s"
done
```

### 2. 슬래시 명령 래퍼 (선택)

인자(`off`, `status`, `cho`) 처리 규칙을 담은 명령 래퍼다. 이 저장소에는 포함되어 있지 않고 로컬에만 있다.

* Claude Code: `~/.claude/commands/dandap.md`, `~/.claude/commands/chodandap.md`
* Gemini CLI: `~/.gemini/commands/dandap.toml`, `~/.gemini/commands/chodandap.toml`

### 3. hook (Claude Code 전용, 선택)

스킬 문서만으로는 `/compact` 이후 모드가 풀리는 문제를 막을 수 없다. hook을 등록하면 세션별 모드를 파일에 기록하고, compact·resume 뒤에 규칙을 다시 주입한다.

`~/.claude/settings.json`의 `hooks`에 아래 두 항목을 추가한다. 기존 hook 항목이 있으면 덮어쓰지 말고 배열에 병합한다.

```json
{
  "hooks": {
    "SessionStart": [
      { "hooks": [{ "type": "command", "command": "node \"$HOME/.agents/skills/dandap/hooks/dandap-activate.js\"" }] }
    ],
    "UserPromptSubmit": [
      { "hooks": [{ "type": "command", "command": "node \"$HOME/.agents/skills/dandap/hooks/dandap-mode-tracker.js\"" }] }
    ]
  }
}
```

* 상태 파일 위치: `~/.claude/.dandap-sessions/<session_id>.mode` (`CLAUDE_CONFIG_DIR`, `DANDAP_STATE_DIR`로 변경 가능)
* 새 세션(`startup`)과 `/clear`는 기본 off로 시작한다. `/dandap off` 후에는 compact해도 다시 켜지지 않는다.
* `/dandap`, `/chodandap` 슬래시 명령으로 켜면 Claude Code가 스킬 본문을 로드하므로 hook은 리마인더만 주입한다. `단답`처럼 자연어로 켜거나 `/dandap cho`로 전환할 때만 hook이 규칙 전문을 주입한다.
* Claude Code는 compact 뒤 세션 중 호출된 스킬 본문을 스스로 복원한다. 이 본문이 현재 모드와 어긋나지 않도록, SessionStart hook이 마지막에 현재 모드(off면 "복원된 단답 규칙을 따르지 않음")를 한 줄로 주입한다.
* caveman 플러그인 리마인더와 동시에 주입되면 단답 규칙을 우선하도록 리마인더에 명시되어 있다.

### 4. 테스트

```bash
cd "$DANDAP_DIR" && node --test
```

Node.js 22 이상, 외부 의존성 없음.

---

## 📏 토큰 절약 효과

2026-11-14, `bench/measure.py`로 측정했다.

* 방식: `claude -p`(모델 `claude-opus-5-5`, 도구 비활성화)로 개발 질문 10개를 네 조건에서 3회씩 실행했다. 총 120회, 실패 0회.
* 환경: 실제 사용 환경 그대로다. caveman 플러그인(full)과 전역 CLAUDE.md("모든 답변은 한글로")가 네 조건 모두에 적용되었다.
* `output_tokens`는 API usage 값이며, 사고(thinking) 토큰 포함 여부는 확인하지 않았다.

| 조건 | 프롬프트 | 출력 토큰 중앙값 | 일반 대비 | "간결하게" 대비 | 응답 글자 수 중앙값 |
|---|---|---:|---:|---:|---:|
| 일반 | 질문 그대로 | 1,039 | 0% | +58.9% | 1,289 |
| 간결 | 질문 + "간결하게 답해줘." | 654 | -37.1% | 0% | 751 |
| **단답** | `/dandap` + 질문 | 773 | **-25.6%** | +18.2% | 1,046 |
| **초단답** | `/chodandap` + 질문 | 480 | **-53.8%** | **-26.7%** | 575 |

해석:

* 초단답은 네 조건 중 가장 짧았고, "간결하게 답해줘"보다도 26.7% 짧았다.
* 단답은 일반보다 짧았지만 "간결하게 답해줘"보다는 18.2% 길었다. 단답의 장점은 길이보다 문체(결론 우선, 명사형 종결, 원문 보존)의 일관성에 있다.
* 질문 10개 중 1개(React 재렌더링)에서는 단답(1,284)이 일반(1,191)보다 길었다.
* 1회성 질문 기준 총비용(API 환산)은 오히려 늘었다(R3 수정 전 측정). 규칙 본문이 입력으로 추가되기 때문이다. 조건별 합계는 일반 $3.74, 간결 $3.47, 단답 $4.99, 초단답 $5.31이다. 여러 턴을 이어가는 세션에서는 규칙 주입이 처음 한 번만 전문으로 들어가므로 이 차이가 줄어든다고 추정하지만, 측정하지 않았다.
* 이후 슬래시 명령으로 켤 때 규칙 본문이 두 번 들어가던 문제(R3)를 고쳤다. 지금은 Claude Code가 로드한 스킬 본문 1회만 들어간다. 수정 후 비용은 다시 측정하지 않았다.

재현:

```bash
python3 bench/measure.py --out /tmp/dandap-bench.jsonl --reps 3 --workers 4 --cwd /tmp/dandap-bench-cwd
python3 bench/measure.py --summarize /tmp/dandap-bench.jsonl
```

측정은 구독 사용량을 소모한다.
