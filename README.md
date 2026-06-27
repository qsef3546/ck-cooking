# 🍳⚔️ 코어 키퍼 도감 (Core Keeper Codex)

[Core Keeper](https://corekeeper.net/) 공략 도감 웹앱. 상단 탭으로 두 도감을 전환합니다.

- **🍳 요리 도감** — 재료 2개 조합을 **`재료1 + 재료2 = 완성 요리(효과 · 획득처)`** 형태로. 약 **2,628가지**.
- **⚔️ 무기 도감** — 무기 **80종**의 스탯과 **제작 재료 · 파밍 지역**. (무기/방어구/장신구/아이템 가이드북의 1단계)

> ⚠️ **비공식 팬 프로젝트입니다.** 게임 개발사 Pugstorm / Fireshine Games와 무관하며, 데이터·이미지의 저작권은 원저작자에게 있습니다. 자세한 내용은 아래 [저작권 / 라이선스](#️-저작권--라이선스) 참고.

- **스택:** Next.js 14 (App Router · TypeScript) · Supabase (Postgres) · Vercel
- **상태:** 로컬/배포 동작 확인, 타입체크 통과

---

## ✨ 기능

### 🍳 요리 도감
- **재료로 찾기** — 재료 72종 그리드에서 재료를 고르면 그 재료로 만들 수 있는 조합만(최대 72개) 표시
- **효과로 찾기** — 원하는 효과(근접 피해, 회복 등)를 고르면 그 효과가 가장 센 조합부터 정렬
- **정렬 / 필터** — 포만감 · 효과 개수 · 선택 효과 기준 정렬, 효과 카테고리 · 황금/전설 필터
- **페이지네이션** — 페이지당 30개로 끊어 스크롤 부담 없음
- **재료 아이콘** — 각 재료의 픽셀아트 아이콘 표시 (카드 · 조합 행 · 상세 헤더)
- **검색** — 재료명(한/영) · 효과명으로 즉시 검색

### ⚔️ 무기 도감 (가이드북 1단계)
- **무기 80종** — 근접 37 · 원거리 25 · 마법 18
- **정보** — 등급 · 레벨 · 공격력(기본→Lv20) · 공격속도 · 내구도 · 판매가 · 인게임 설명
- **제작 정보** — **무슨 재료가 얼마나 필요한지** + **파밍 지역(area)** 표기 *(요청 핵심 기능)*
- **필터 / 정렬** — 근접·원거리·마법 분류, 레벨/공격력/이름순 정렬, 무기·재료 검색
- **무기 아이콘** — 픽셀아트 스프라이트 (위키 미문서화 6종 제외)

> 데이터는 위키 중앙 데이터 모듈에서 [`scrape-weapons.mjs`](scrape-weapons.mjs)로 재생성합니다.
> 다음 단계: 방어구 · 장신구 · 아이템(드롭/제작) 확장.

---

## 🚀 빠른 시작 (로컬)

```bash
git clone https://github.com/qsef3546/ck-cooking.git && cd ck-cooking
npm install
cp .env.local.example .env.local   # 값 채우기 (아래 "환경변수" 참고)
npm run dev                        # http://localhost:3000
```

환경변수가 없으면 Supabase에 연결되지 않아 데이터가 비어 보입니다. 아래 Supabase 설정을 먼저 진행하세요.

---

## 🗄️ Supabase 설정

### 1) 재료 테이블 (필수 — 앱이 직접 읽음)

Supabase Dashboard → **SQL Editor**에서 순서대로 실행:

1. [`supabase/schema.sql`](supabase/schema.sql) — `ingredients` 테이블 + 공개 읽기 RLS
2. [`supabase/seed.sql`](supabase/seed.sql) — 재료 72종 데이터

### 2) recipes 테이블 (선택 — 모든 조합 사전 계산본)

앱은 재료를 읽어 조합을 **실시간 계산**하므로 recipes 테이블 없이도 동작합니다.
SQL 쿼리로 조합을 직접 다루고 싶을 때만 만들면 됩니다.

1. [`supabase/recipes_schema.sql`](supabase/recipes_schema.sql) 을 SQL Editor에서 실행 (테이블 + 인덱스 + RLS)
2. 데이터는 용량이 커서 SQL Editor로는 안 들어갑니다 → **Node 스크립트**로 적재:

```bash
# Node 22 미만은 내장 WebSocket이 없어 supabase-js가 죽으므로 ws 폴리필 필요 (package.json에 포함됨)
node --env-file=.env.local seed-recipes.mjs
```

스크립트는 DB의 `ingredients`를 읽어 동일 로직으로 2,628개를 계산해 `recipes`에 적재합니다(재실행 안전).

### 3) API 키 복사

**Project Settings → API** 에서:
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` (또는 publishable) 키 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

> RLS가 **읽기 전용 공개**로만 열려 있어 anon 키가 노출돼도 select만 가능합니다.
> `service_role`(`sb_secret_…`)은 RLS를 우회하는 마스터 키로, recipes 시드 때만 로컬에서 쓰고 **절대 커밋/배포/`NEXT_PUBLIC_` 금지**입니다.

---

## 🔑 환경변수

`.env.local` (gitignore 됨):

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...      # publishable 또는 legacy anon(eyJ...)
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...               # recipes 시드 때만 필요(커밋 금지)
```

**Vercel** 배포 시: Settings → Environment Variables 에 위 `NEXT_PUBLIC_` 2개를 등록하고,
**Production / Preview 모두 체크 + 등록 후 Redeploy** 해야 반영됩니다 (`NEXT_PUBLIC_`은 빌드 시점에 번들에 박힘).

---

## ☁️ Vercel 배포

1. GitHub 푸시 → Vercel **New Project → 레포 Import** (Framework: Next.js 자동 감지)
2. Environment Variables에 위 2개 등록 (Production 포함)
3. Deploy. 이후 push 시 자동 재배포되며, env 변경 후엔 **Redeploy** 필요

---

## 📁 프로젝트 구조

```
app/
  layout.tsx          # 루트 레이아웃 + 푸터(출처 표기)
  page.tsx            # 메인 화면 (요리/무기 섹션 탭 + 요리 탐색)
  Weapons.tsx         # ⚔️ 무기 도감 화면 (필터·정렬·카드)
  globals.css         # 다크 테마 스타일
lib/
  supabaseClient.ts   # Supabase 클라이언트
  types.ts            # Ingredient / Buff / Combo 타입
  combine.ts          # 조합 계산 + 버프 라벨 + 색상
  weapons.ts          # Weapon 타입 + 분류 색/라벨 헬퍼
supabase/
  schema.sql          # ingredients 테이블 + RLS
  seed.sql            # 재료 72종 데이터
  recipes_schema.sql  # recipes 테이블 + 인덱스 + RLS (선택)
seed-recipes.mjs      # recipes 2,628개 시드 스크립트 (Node, service_role 필요)
scrape-weapons.mjs    # ⚔️ 무기 데이터+아이콘 스크래퍼 (위키 → 정적 JSON)
public/
  icons/              # 재료 아이콘 72종(webp) + manifest.json
  weapon-icons/       # 무기 아이콘(webp) + manifest.json
  data/weapons.json   # 무기 80종 데이터 (앱이 빌드에 번들)
```

> **데이터 소스 차이:** 요리(`ingredients`)는 **Supabase**에서 런타임 로드, 무기는 변하지 않는 참조 데이터라 **정적 JSON**(`public/data/weapons.json`)을 번들합니다. 그래서 무기 탭은 환경변수/DB 없이도 동작합니다.

---

## 🧮 조합 계산 규칙 ([`lib/combine.ts`](lib/combine.ts))

- **포만감(food):** 두 재료 **합산**
- **같은 종류 버프:** 더 **높은 값 하나만** 적용
- **다른 종류 버프:** **전부 중첩**
- **등급:** 황금/전설 재료가 들어가면 최소 레어(+25%) 보장, 둘 다면 +15% 추가
  (실제 수치는 게임 내 등급 발동·반올림에 따라 달라질 수 있어 안내(note)로만 표기)

## 🔧 데이터 수정

재료 추가/수정은 `ingredients` 테이블 행만 고치면 됩니다(앱 코드 변경 불필요). 버프는 `buffs` jsonb 배열:

```json
[{"key":"meleeDmg","cat":"근접","val":28.2,"unit":"%","dur":"10분"}]
```

> ⚠️ recipes 테이블은 **파생 데이터**입니다. `ingredients` 수치를 바꾸면 `seed-recipes.mjs`로 **재시드**해야 일치합니다(앱의 실시간 계산 방식에는 영향 없음).

### ⚔️ 무기 데이터 갱신

무기 데이터·아이콘은 위키 중앙 데이터 모듈([`Module:ObjectInfo/data`](https://core-keeper.fandom.com/wiki/Module:ObjectInfo/data))에서 자동 수집합니다. 게임 업데이트 후 다시 받으려면:

```bash
node scrape-weapons.mjs
```

- `public/data/weapons.json` 재생성 + `public/weapon-icons/` 스프라이트 다운로드
- "무기"는 `categories`에 `MeleeWeapon`/`RangeWeapon`/`MagicWeapon` + `Equipment`가 있는 항목으로 판정(현재 80종)
- 한글 무기·재료명은 스크립트 내 번역 사전(자연스러운 번역, 공식 로컬라이즈와 다를 수 있음)
- 아이콘은 위키 스프라이트가 없는 6종(예: Stone Mortar, Void Club)은 제외 — 앱은 아이콘 없이도 정상 표시
- 이미지는 [기존 재료 아이콘과 동일하게](#️-저작권--라이선스) 위키 스프라이트(저작권은 게임사)

> ⚠️ 무기 데미지는 게임 데이터의 레벨별 값을 사용합니다(기본 레벨값 → Lv20 최대값). 인게임 표기는 ±10% 범위로 보일 수 있습니다.

---

## ⚖️ 저작권 / 라이선스

이 프로젝트는 **팬이 만든 비공식 도구**이며, 다음 권리가 섞여 있어 항목별로 다르게 적용됩니다.

### 게임 콘텐츠 (데이터 · 이미지)
- **Core Keeper** 및 그 안의 모든 자산(아이템 명칭, 수치, 스프라이트/아이콘 등)의 저작권은 **© Pugstorm / Fireshine Games**에 있습니다.
- 재료 데이터는 커뮤니티가 만든 [Core Keeper Wiki](https://core-keeper.fandom.com)에서 수집했으며, 게임 업데이트로 수치가 바뀔 수 있습니다.
- `public/icons/` 의 아이콘은 위키에서 가져온 게임 스프라이트로, 저작권은 게임 개발사에 있습니다.
- 이 자산들은 **비상업적 팬 이용** 범위에서만 사용합니다. 본 저장소의 코드 라이선스는 게임 자산·데이터에는 적용되지 **않습니다.**

### 코드
- 앱 소스 코드(`app/`, `lib/`, `supabase/`, 스크립트 등)는 **MIT 라이선스**입니다 ([`LICENSE`](LICENSE) 참고).
- MIT는 **코드에만** 적용되며, **위 게임 자산·데이터는 라이선스 대상이 아닙니다.**

### 상표 · 비제휴 고지
- "Core Keeper"는 해당 권리자의 상표입니다. 본 프로젝트는 Pugstorm / Fireshine Games와 **제휴·후원·승인 관계가 없습니다.**
- 권리자로부터 요청이 있을 경우 관련 자산을 즉시 내릴 수 있습니다.

> 개인·소규모·비영리 팬 도구로 사용하는 경우 일반적으로 문제되지 않지만, 공개 배포·수익화 시에는 위 고지를 유지하고 게임 자산의 직접 재배포는 지양하는 것을 권장합니다.
