# dandap (단답) 🤫

> **"불필요한 미사여구는 버리고, 기술적 팩트와 페이로드만 남긴다."**
> **AI 코딩 에이전트용 한국어 개조식 단답 스킬**이다.

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
* hook이 없는 환경(Codex, agy, Gemini CLI)에서는 `(세션 추적 안 됨)`이 붙는다.

### 관련 스킬

| 스킬 | 호출 | 역할 |
|---|---|---|
| `dandap-help` | `/dandap-help`, `단답 도움말` | 모드·명령 요약 카드 |
| `dandap-commit` | `/dandap-commit` | Conventional Commits 접두어 + 한국어 평서체 커밋 메시지 작성 |
| `dandap-review` | `/dandap-review` | 한 줄 한 지적(위치·문제·수정안) 한국어 코드 리뷰 |

`dandap-commit`, `dandap-review`, `chodandap`은 `disable-model-invocation: true`로 설정되어 있어 명시적으로 호출할 때만 동작한다. Claude Code와 agy에서는 이 설정이 적용되었지만, Codex는 이 설정을 따르지 않는 것으로 보인다([지원 도구](#-지원-도구) 참고).

---

## 🧩 지원 도구

2026-11-14에 도구별 비대화형 실행으로 스킬 목록 조회와 실제 호출을 확인했다.

| 항목 | Claude Code (`2.1.319`) | Codex (`0.167.0`) | agy, Antigravity (`1.5.9`) |
|---|---|---|---|
| 스킬 경로 | `~/.claude/skills/<스킬>` | `~/.codex/skills/<스킬>` | `~/.gemini/skills/<스킬>` (`~/.gemini/config/skills`도 읽음) |
| 호출 문법 | `/dandap`, `/chodandap` | `$dandap`, `$chodandap` | `/dandap`, `/chodandap` |
| 단답·초단답 응답 | 확인 | 확인 | 확인 |
| `disable-model-invocation` | 적용 (모델 목록에서 숨김, 직접 호출은 동작) | 미적용으로 보임 (모델 목록에 5개 모두 표시) | 적용 (모델 목록에서 숨김, 직접 호출은 동작) |
| hook (compact 후 유지, `status` 추적) | 지원 | 미적용 | 미적용 |
| 슬래시 명령 래퍼 | `~/.claude/commands` | 없음 | 없음 |

* Gemini CLI는 `~/.gemini/skills`, `~/.gemini/commands`를 agy와 함께 쓰도록 연결되어 있지만, 동작은 확인하지 않았다.
* Codex와 agy는 1회성 질문만 확인했다. 여러 턴에 걸친 모드 유지와 `off`·`status` 인자 처리는 확인하지 않았다.

---

## 📁 구성

```
dandap/
├── skills/
│   ├── dandap/SKILL.md          # dandap(단답) 스킬
│   ├── chodandap/SKILL.md       # chodandap(초단답) 스킬
│   ├── dandap-help/SKILL.md     # 도움말 카드
│   ├── dandap-commit/SKILL.md   # 커밋 메시지 스킬
│   └── dandap-review/SKILL.md   # 코드 리뷰 스킬
├── commands/                # 슬래시 명령 래퍼 (off·status·cho 인자 처리)
│   ├── claude/dandap.md, chodandap.md
│   └── gemini/dandap.toml, chodandap.toml
├── hooks/                   # Claude Code hook (모드 유지)
│   ├── dandap-activate.js       # SessionStart: compact·resume 후 규칙 재주입
│   ├── dandap-mode-tracker.js   # UserPromptSubmit: 명령 감지, 매 턴 리마인더
│   ├── dandap-parse.js          # 활성화·종료·상태 판정
│   ├── dandap-state.js          # 세션별 상태 파일 읽기·쓰기
│   └── dandap-rules.js          # 주입할 규칙 전문·리마인더 문구
├── installer/install.js     # npx 설치 스크립트 (설치·hook 병합·제거)
├── tests/                   # node:test 테스트 (판정·상태·hook 입출력·설치)
└── bench/measure.py         # claude -p 토큰 측정 스크립트
```

---

## 📂 설치

### npx로 설치 (권장)

```bash
npx dandap@latest                # 스킬 + 슬래시 명령 래퍼
npx dandap@latest --with-hooks   # 위 항목 + hook (Claude Code 전용)
npx dandap@latest --uninstall    # 제거
```

npm 대신 GitHub 저장소에서 바로 실행할 수도 있다. `main` 브랜치의 최신 커밋을 받으며, `git`이 필요하다.

```bash
npx -y github:bottleroad/dandap                # 설치
npx -y github:bottleroad/dandap --with-hooks   # hook (Claude Code 전용)
npx -y github:bottleroad/dandap --uninstall
```

**`--with-hooks`는 Claude Code에만 적용된다.** Codex·agy·Gemini CLI에는 hook을 등록하지 않으므로, 옵션을 붙여도 붙이지 않은 것과 똑같이 설치된다. `~/.claude`가 없으면 `--with-hooks`는 실패한다.

Claude Code에서 `--with-hooks` 유무에 따른 차이는 다음과 같다.

| 항목 | 옵션 없음 | `--with-hooks` |
|---|---|---|
| 스킬·슬래시 명령 래퍼 | 설치 | 설치 |
| `~/.claude/settings.json` | 건드리지 않음 | 백업 후 hook 2개 병합 |
| `/compact`·resume 후 모드 | 풀릴 수 있음 | 유지 (규칙 재주입) |
| `단답`, `초단답` 자연어로 켜기 | 스킬 설명에 따라 모델이 판단 | hook이 감지해 규칙을 주입 |
| `/dandap status` | `(세션 추적 안 됨)`이 붙음 | 기록된 모드 보고 |

* 파일을 `~/.dandap`에 복사하고, `~/.claude`, `~/.codex`, `~/.gemini` 중 있는 도구에만 링크한다.
* 같은 이름이 링크가 아닌 실제 파일·디렉터리로 있으면 덮어쓰지 않고 건너뛴다. 다른 곳을 가리키는 링크는 `~/.dandap`을 가리키도록 교체한다.
* `--with-hooks`는 `~/.claude/settings.json`을 `settings.json.dandap-backup-<UTC 시각>`으로 백업한 뒤 hook을 병합한다. 다른 위치에 등록된 dandap hook은 중복 주입을 막기 위해 교체한다.
* `--uninstall`은 `~/.dandap`을 가리키는 링크와 hook, `~/.dandap`만 지운다. 상태 파일(`~/.claude/.dandap-sessions`)은 남긴다.
* 설치 후 실행 중인 에이전트 세션은 다시 시작해야 적용된다.
* macOS에서만 확인했다. Windows는 확인하지 않았다.

아래 1~3은 저장소를 직접 연결하는 수동 설치 방법이다.

### 1. 스킬 링크

저장소를 내려받은 위치를 `DANDAP_DIR`로 둔다. 아래는 Claude Code, Codex, agy(Antigravity), Gemini CLI에서 같은 스킬을 쓰도록 `~/.agents/skills`를 거쳐 연결하는 구성이다.

```bash
DANDAP_DIR="$HOME/workspace/my-skills/dandap"   # 저장소 위치에 맞게 수정

for s in dandap chodandap dandap-help dandap-commit dandap-review; do
  ln -s "$DANDAP_DIR/skills/$s" "$HOME/.agents/skills/$s"        # 공용 경로
  ln -s "../../.agents/skills/$s" "$HOME/.claude/skills/$s"      # Claude Code
  ln -s "$HOME/.agents/skills/$s" "$HOME/.codex/skills/$s"       # Codex
  ln -s "$DANDAP_DIR/skills/$s" "$HOME/.gemini/skills/$s"        # agy, Gemini CLI
done
```

* agy는 `~/.gemini/config/skills`도 읽는다. 이 경로를 `~/.agents/skills`로 연결해 두었다면 `~/.gemini/skills` 링크 없이도 인식될 수 있지만, 그 구성만으로 따로 확인하지는 않았다.

### 2. 슬래시 명령 래퍼 (선택)

인자(`off`, `status`, `cho`) 처리 규칙을 담은 명령 래퍼다. `commands/`에 있으며, 각 도구의 명령 디렉터리에 링크한다.

```bash
for f in dandap chodandap; do
  ln -s "$DANDAP_DIR/commands/claude/$f.md" "$HOME/.claude/commands/$f.md"
  ln -s "$DANDAP_DIR/commands/gemini/$f.toml" "$HOME/.gemini/commands/$f.toml"
done
```


* Claude Code: `~/.claude/commands/dandap.md`, `~/.claude/commands/chodandap.md`
* Gemini CLI: `~/.gemini/commands/dandap.toml`, `~/.gemini/commands/chodandap.toml`
* Codex, agy: 래퍼 없음. 스킬을 직접 호출한다.

### 3. hook (Claude Code 전용, 선택)

스킬 문서만으로는 `/compact` 이후 모드가 풀리는 문제를 막을 수 없다. hook을 등록하면 세션별 모드를 파일에 기록하고, compact·resume 뒤에 규칙을 다시 주입한다.

`~/.claude/settings.json`의 `hooks`에 아래 두 항목을 추가한다. 기존 hook 항목이 있으면 덮어쓰지 말고 배열에 병합한다. 경로는 `DANDAP_DIR`에 맞게 바꾼다. hook은 스킬 디렉터리가 아닌 저장소의 `hooks/`에 있다.

```json
{
  "hooks": {
    "SessionStart": [
      { "hooks": [{ "type": "command", "command": "node \"$HOME/workspace/my-skills/dandap/hooks/dandap-activate.js\"" }] }
    ],
    "UserPromptSubmit": [
      { "hooks": [{ "type": "command", "command": "node \"$HOME/workspace/my-skills/dandap/hooks/dandap-mode-tracker.js\"" }] }
    ]
  }
}
```

* 상태 파일 위치: `~/.claude/.dandap-sessions/<session_id>.mode` (`CLAUDE_CONFIG_DIR`, `DANDAP_STATE_DIR`로 변경 가능)
* 새 세션(`startup`)과 `/clear`는 기본 off로 시작한다. `/dandap off` 후에는 compact해도 다시 켜지지 않는다.
* `/dandap`, `/chodandap` 슬래시 명령으로 켜면 Claude Code가 스킬 본문을 로드하므로 hook은 리마인더만 주입한다. `단답`처럼 자연어로 켜거나 `/dandap cho`로 전환할 때만 hook이 규칙 전문을 주입한다.
* Claude Code는 compact 뒤 세션 중 호출된 스킬 본문을 스스로 복원한다. 이 본문이 현재 모드와 어긋나지 않도록, SessionStart hook이 마지막에 현재 모드(off면 "복원된 단답 규칙을 따르지 않음")를 한 줄로 주입한다.

### 4. 테스트

```bash
cd "$DANDAP_DIR" && node --test
```

Node.js 22 이상, 외부 의존성 없음.

---

## ⚙️ hook 동작 요약

| 시점 | 상황 | 주입 내용 |
|---|---|---|
| UserPromptSubmit | `/dandap`, `/chodandap`으로 켬 | 리마인더만 (스킬 본문은 Claude Code가 로드) |
| UserPromptSubmit | `단답`, `초단답`(자연어)으로 켬, `/dandap cho`로 전환 | 규칙 전문 + 리마인더 |
| UserPromptSubmit | 활성 상태의 일반 턴 | `DANDAP MODE ACTIVE (<mode>)` 리마인더 1줄 |
| UserPromptSubmit | `/dandap status` | `단답 모드: <mode>` 보고 지시 (모드 변경 없음) |
| UserPromptSubmit | 종료 명령 | off 기록, 1줄 복귀 확인 지시 |
| SessionStart | `startup` | 없음 (기본 off) |
| SessionStart | `clear` | off로 초기화 |
| SessionStart | `compact`, `resume` 등, 활성 모드 | 규칙 전문 + 리마인더 + 마지막 줄 `현재 단답 모드: <mode>` |
| SessionStart | `compact`, `resume` 등, off | `단답 모드: off. 복원된 스킬 규칙을 따르지 말 것` 1줄 |

* 다른 슬래시 명령(`/review` 등)의 인자와 예약 작업(`<scheduled-task>`)은 판정하지 않는다.
* `session_id`에 경로 문자가 있으면 상태 파일을 만들지 않는다.
* hook 오류가 나도 항상 exit 0으로 끝나 프롬프트와 세션 시작을 막지 않는다.

---

## ✅ 검증

* **자동 테스트**: 94개 통과. 활성화·종료·"종료 아님"·상태 판정 코퍼스, 상태 파일, hook 입출력, 임시 HOME에서의 설치·hook 병합·제거를 검증한다.
* **실제 세션 검증** (2026-11-14, tmux로 띄운 대화형 Claude Code 세션 2회):

| 확인 항목 | 결과 |
|---|---|
| `/dandap` 후 명사형 종결 응답, 활성화 선언 없음 | 통과 |
| `/dandap status`가 `단답 모드: dandap` 보고 | 통과 |
| `빌드 취소해줘`에 모드 유지 | 통과 |
| `/compact` 후 단답·초단답 유지 | 통과 |
| `/dandap off` 후 `/compact`해도 다시 켜지지 않음 | 통과 |
| 초단답에서 `만`/`도` 보존 (`삭제는 admin만 허용.`, `본인 글도 user 삭제 불가.`) | 통과 |

---

## 📏 토큰 절약 효과

2026-11-14, `bench/measure.py`로 측정했다.

* 방식: `claude -p`(모델 `claude-opus-5-5`, 도구 비활성화)로 개발 질문 10개를 네 조건에서 3회씩 실행했다. 총 120회, 실패 0회.
* 환경: 실제 사용 환경 그대로다. 전역 CLAUDE.md("모든 답변은 한글로")가 네 조건 모두에 적용되었다.
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
* 1회성 질문 기준 총비용(API 환산)은 오히려 늘었다(아래 규칙 중복 수정 전 측정). 규칙 본문이 입력으로 추가되기 때문이다. 조건별 합계는 일반 $3.74, 간결 $3.47, 단답 $4.99, 초단답 $5.31이다. 여러 턴을 이어가는 세션에서는 규칙 주입이 처음 한 번만 전문으로 들어가므로 이 차이가 줄어든다고 추정하지만, 측정하지 않았다.
* 측정 후, 슬래시 명령으로 켤 때 규칙 본문이 두 번(Claude Code 스킬 로드 + hook) 들어가던 문제를 고쳤다. 지금은 Claude Code가 로드한 스킬 본문 1회만 들어간다. 수정 후 비용은 다시 측정하지 않았다.

재현:

```bash
python3 bench/measure.py --out /tmp/dandap-bench.jsonl --reps 3 --workers 4 --cwd /tmp/dandap-bench-cwd
python3 bench/measure.py --summarize /tmp/dandap-bench.jsonl
```

측정은 구독 사용량을 소모한다.

---

## ⚠️ 알려진 한계

* **compact 후 규칙 중복**: 활성 상태에서 compact하면 Claude Code가 복원한 스킬 본문과 hook이 다시 넣은 규칙 전문이 함께 들어간다. 동작 문제는 없고 토큰만 늘어난다. hook은 Claude Code의 복원 여부를 알 수 없고, 재주입을 빼면 자연어로 켠 세션은 compact 후 규칙이 사라지므로 그대로 둔다.
* **hook이 없는 환경**(Codex, agy, Gemini CLI): 모드를 파일로 기록하지 않으므로 compact 후 모드가 풀릴 수 있고, `/dandap status`는 `(세션 추적 안 됨)`으로 보고한다. Codex는 hook 기능 자체는 지원하지만, dandap hook은 등록하지 않았고 입력 형식 호환성도 확인하지 않았다.
* **Codex의 자동 호출**: Codex는 `disable-model-invocation`을 따르지 않는 것으로 보인다. 그래서 `chodandap`, `dandap-commit`, `dandap-review`를 모델이 스스로 호출할 수 있다. 실제로 자동 호출되는지는 확인하지 않았다.
* **서브에이전트**: SubagentStart hook을 두지 않았으므로 서브에이전트에는 단답 모드가 전달되지 않는다.
* **비용**: 규칙 중복 수정 후의 비용은 다시 측정하지 않았다.

---

## 🧭 설계 결정

| 항목 | 결정 |
|---|---|
| hook 범위 | SessionStart, UserPromptSubmit 2개만 둔다. SubagentStart, statusline, SessionEnd 기록은 두지 않는다 |
| 종료 트리거 | 명령 형태(`/dandap off`)와 `단답`/`초단답` 접두 문구만 인정한다. 단독 `그만`·`stop`은 종료가 아니다 |
| 조사 | 단답은 조사 유지가 기본이다. 초단답은 자명한 격조사만 생략하고 `만`/`도`/`조차`는 보존한다 |
| 응답 언어 | 질문 언어와 무관하게 한국어로 답한다 |
| 채팅 외 산출물 | 코드·커밋·문서 등은 평서체(`-다`)로 쓴다 |
| 문장 길이 | 단답은 한 문장 15어절 이하로 쓴다 |
| 커밋 메시지 | Conventional Commits 접두어(영어) + 한국어 평서체 본문 |
| 보조 스킬 | `dandap-commit`, `dandap-review`, `chodandap`은 명시 호출만 허용해 기존 스킬과 충돌을 피한다 |

---

## 📝 변경 이력

* **1.1.0** (2026-11-14)
  * 조사 규칙, 종료 트리거, 예외 상황, 흉내 금지, 약어·화살표 금지, 15어절 기준, 전송 전 점검, 응답 언어 규칙을 추가했다.
  * 모드 유지용 hook 2개와 테스트를 추가했다.
  * `dandap-help`, `dandap-commit`, `dandap-review` 스킬을 추가했다.
  * 토큰 측정 스크립트와 결과를 추가했다.
  * 저장소 구조를 `skills/<스킬>/SKILL.md`, `commands/`로 정리하고, 슬래시 명령 래퍼를 저장소에 포함했다.
* **1.0.0**: 최초 버전.
