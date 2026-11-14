---
name: dandap-help
description: >
  단답(dandap)·초단답(chodandap) 모드와 관련 명령 요약 카드 출력.
  /dandap-help 또는 "단답 도움말"로 호출.
version: 1.0.0
---

# dandap-help

호출 시 아래 카드를 그대로 출력함. 1회성 출력임. 모드 변경, 상태 파일 기록 등 지속되는 동작 없음.

## 모드

| 모드 | 켜기 | 특징 |
|---|---|---|
| **dandap (단답)** | `/dandap`, `단답`, `단답 모드` | 개조식·명사형 종결(-함/-음). 결론 우선, 조사 유지가 기본 |
| **chodandap (초단답)** | `/chodandap`, `초단답`, `/dandap cho` | 파편 압축. 종결 어미 생략, 한정 조사(`만`/`도`/`조차`)는 보존 |

모드는 종료할 때까지 세션 전체에 유지됨.

## 끄기

* 명령: `/dandap off`, `/dandap 종료`, `/chodandap off`
* 문구: `단답 종료`, `단답 해제`, `초단답 해제`
* 프롬프트 전체가 `normal mode` 또는 `원래대로`
* 종료 아님: 단독 `그만`·`stop`·`off`, `빌드 취소해줘` 같은 작업 요청, `단답 끄지 마` 같은 부정문

## 상태 확인

* `/dandap status`: 모드 변경 없이 `단답 모드: <dandap|chodandap|off>` 1줄 보고.
* hook이 없는 환경에서는 `(세션 추적 안 됨)`이 붙음.

## 관련 스킬

| 스킬 | 호출 | 역할 |
|---|---|---|
| **dandap-commit** | `/dandap-commit` | Conventional Commits 접두어 + 한국어 평서체 커밋 메시지 작성 |
| **dandap-review** | `/dandap-review` | 한 줄 한 지적(위치·문제·수정안) 한국어 코드 리뷰 |
| **dandap-help** | `/dandap-help` | 이 카드 |

## 공통 원칙

* 코드, 명령어, 경로, 에러 원문은 그대로 보존.
* 부정어(`안`, `못`, `아님`, `제외`, `금지`, `실패`)는 생략 금지.
* 코드·커밋·문서 등 채팅 외 산출물은 평서체(`-다`)로 작성.

## 더 보기

https://github.com/bottleroad/dandap
