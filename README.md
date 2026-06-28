# 🍳⚔️ 코어 키퍼 도감 (Core Keeper Codex)

[Core Keeper](https://corekeeper.net/) 공략 도감 웹앱. 상단 탭으로 8개 도감을 전환합니다.

- **🍳 요리** — 재료 2개 조합 **`재료1 + 재료2 = 완성 요리(효과 · 획득처)`**. 약 **2,628가지**.
- **⚔️ 무기** — **80종**: 공격력·공속·내구도 + 제작 재료·파밍 지역
- **🛡️ 방어구** — **231종**: 투구/상의/하의, 장착 효과 + 제작 재료·파밍 지역
- **💍 장신구** — **148종**: 반지/목걸이/오프핸드, 장착 효과 + 제작 재료
- **⛏️ 아이템** — **69종**: 곡괭이·삽·낚싯대 등 도구, 성능 + 제작 재료
- **🎣 낚시** — **낚시터 10곳 · 물고기 44종**: 어종별 낚일 확률 + 옵션(효과) + 필요 낚시 스킬
- **👹 보스** — **보스 19종**: 처치 시 드롭(아이템·수량·확률) + 체력 + 등장 지역
- **🏆 추천 빌드** — 근접/원거리(물리)/마법/소환 **커뮤니티 추천 무기·방어구·장신구·음식 세트**

> ⚠️ **비공식 팬 프로젝트입니다.** 게임 개발사 Pugstorm / Fireshine Games와 무관하며, 데이터·이미지의 저작권은 원저작자에게 있습니다. 자세한 내용은 아래 [저작권 / 라이선스](#️-저작권--라이선스) 참고.

- **스택:** Next.js 14 (App Router · TypeScript) · Supabase (Postgres) · Vercel
- **상태:** 로컬/배포 동작 확인, 타입체크 통과

---

## ✨ 기능

### 🍳 요리 도감
- **재료로 찾기** — 재료 72종 그리드에서 재료를 고르면 그 재료로 만들 수 있는 조합만(최대 72개) 표시
- **효과로 찾기 (다중 선택)** — 효과(근접 피해, 회복 등)를 **여러 개** 고르면 그 효과를 **모두 가진** 조합만, 선택 효과 합산이 센 순서로
- **정렬 / 필터** — 포만감 · 효과 개수 · 선택 효과 기준 정렬, 효과 카테고리 · 황금/전설 필터
- **페이지네이션** — 페이지당 30개로 끊어 스크롤 부담 없음
- **재료 아이콘** — 각 재료의 픽셀아트 아이콘 표시 (카드 · 조합 행 · 상세 헤더)
- **검색** — 재료명(한/영) · 효과명으로 즉시 검색

### ⚔️🛡️💍⛏️ 장비 도감 (무기 · 방어구 · 장신구 · 아이템)
- **무기 80종** — 근접/원거리/마법, 공격력(기본→Lv20)·공속·내구도·판매가
- **방어구 231종 · 장신구 148종 · 아이템(도구) 69종** — **장착 효과**(방어력·체력·치명타·채광 등)를 기본→Lv20 값으로
- **제작 정보** — 모든 항목에 **필요 재료(수량)** + **파밍 지역(area)** 표기 *(요청 핵심 기능)*
- **재료 출처** — 재료마다 **드롭 / 제작** 태그 + 마우스오버 시 드롭 몬스터명 (예: 목재 → Thorn Wood, Caveling Brute)
- **필터 / 정렬 / 페이지네이션** — 하위분류 칩 · 레벨·이름순 · 검색 · 페이지당 36개(무기 포함 전 탭 통일)
- **아이콘** — 픽셀아트 스프라이트 (위키 미문서화 항목 제외, 없으면 자리표시)

### 🎣 낚시 도감
- **낚시터 10곳** — 흙 비옴부터 통로까지, **필요 낚시 스킬** 순으로 정렬
- **물고기 44종** — 낚시터별 어종 + **낚일 확률(%)** + **옵션(생식 효과: 포만감·지속 회복 등)** + 등급 + 설명
- **필터 / 검색** — 낚시터 칩으로 위치별 보기, 어종명(한/영) 검색

### 👹 보스 도감
- **보스 19종** — 등장 지역(진행 순) · 체력 · 처치 시 **드롭 아이템(수량·확률)**
- **검색** — 보스명 · 드롭 아이템 · 지역으로 검색

### 🏆 추천 빌드
- **플레이스타일 4종** — 근접(물리) · 원거리(물리) · 마법 · 소환
- 각 빌드: 추천 **무기 · 방어구 세트 · 장신구 · 음식** + 핵심 스탯 + 팁 (도감 아이템에 아이콘 연결)
- 여러 가이드/포럼(BisectHosting·Prima Games·Cozy Checklist·Steam·Wiki)을 종합한 **커뮤니티 추천** — 패치/운에 따라 달라질 수 있으며 각 빌드에 출처 링크 표기

> 데이터는 위키 중앙 데이터 모듈에서 재생성: [`scrape-weapons.mjs`](scrape-weapons.mjs)(무기) · [`scrape-gear.mjs`](scrape-gear.mjs)(방어구/장신구/아이템) · [`scrape-fish.mjs`](scrape-fish.mjs)(낚시) · [`scrape-bosses.mjs`](scrape-bosses.mjs)(보스).

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
  page.tsx            # 메인 화면 (8개 섹션 탭 + 요리 탐색)
  Weapons.tsx         # ⚔️ 무기 도감 화면
  Gear.tsx            # 🛡️💍⛏️ 방어구/장신구/아이템 공용 화면
  Fish.tsx            # 🎣 낚시터별 물고기 도감 화면
  Boss.tsx            # 👹 보스별 드롭 도감 화면
  Builds.tsx          # 🏆 플레이스타일별 추천 빌드 화면
  Pager.tsx           # 공용 페이지네이션 컴포넌트
  globals.css         # 다크 테마 스타일
lib/
  supabaseClient.ts   # Supabase 클라이언트
  types.ts            # Ingredient / Buff / Combo 타입
  combine.ts          # 조합 계산 + 버프 라벨 + 색상
  weapons.ts          # Weapon 타입 + 분류 색/라벨 헬퍼
  gear.ts             # GearItem/Condition 타입 + 효과 포맷 헬퍼
  fish.ts             # Fish / FishingSpot 타입
  boss.ts             # Boss / BossDrop 타입
  builds.ts           # Build / BuildItem 타입
supabase/             # 요리용 (ingredients/recipes)
  schema.sql · seed.sql · recipes_schema.sql
seed-recipes.mjs      # recipes 2,628개 시드 스크립트
scrape-lib.mjs        # 스크래핑 공용 유틸 (Lua 파서 · fetch · 재료사전 · 아이콘 다운로드)
scrape-weapons.mjs    # ⚔️ 무기 스크래퍼
scrape-gear.mjs       # 🛡️💍⛏️ 방어구/장신구/아이템 스크래퍼
scrape-fish.mjs       # 🎣 낚시 스크래퍼
scrape-bosses.mjs     # 👹 보스 스크래퍼
build-recos.mjs       # 🏆 추천 빌드(큐레이션) → builds.json, 도감 아이템에 연결
public/
  icons/              # 재료 아이콘(webp) + manifest.json
  weapon-icons/ · gear-icons/ · fish-icons/ · boss-icons/   # 각 도감 아이콘 + manifest.json
  data/               # weapons · armor · accessories · tools · fish · bosses · builds (.json)
```

> **데이터 소스 차이:** 요리(`ingredients`)는 **Supabase**에서 런타임 로드, 장비(무기/방어구/장신구/아이템)는 변하지 않는 참조 데이터라 **정적 JSON**(`public/data/*.json`)을 번들합니다. 그래서 장비 탭은 환경변수/DB 없이도 동작합니다.

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

### ⚔️🛡️💍⛏️ 장비 데이터 갱신

장비 데이터·아이콘은 위키 중앙 데이터 모듈([`Module:ObjectInfo/data`](https://core-keeper.fandom.com/wiki/Module:ObjectInfo/data))에서 자동 수집합니다. 게임 업데이트 후 다시 받으려면:

```bash
node scrape-weapons.mjs   # 무기 → public/data/weapons.json + public/weapon-icons/
node scrape-gear.mjs      # 방어구·장신구·아이템 → public/data/{armor,accessories,tools}.json + public/gear-icons/
node scrape-fish.mjs      # 낚시 → public/data/fish.json + public/fish-icons/
node scrape-bosses.mjs    # 보스 → public/data/bosses.json + public/boss-icons/
```

> `SKIP_ICONS=1 node scrape-*.mjs` 로 아이콘 재다운로드 없이 데이터(JSON)만 갱신할 수 있습니다.

- 분류는 `type`/`categories` 기준 — 무기(Melee/Range/MagicWeapon), 방어구(Helm/BreastArmor/PantsArmor), 장신구(Ring/Necklace/Offhand), 아이템(MiningPick/Shovel/FishingRod 등)
- 장착 효과는 `equipped.conditions`(효과 id → 레벨별 값)에서 추출, 한글 라벨 매핑(미매핑은 영문 자동 정리)
- 한글 아이템·재료명은 토큰 번역(전부 매핑되면 한글, 아니면 영문 그대로). 공식 로컬라이즈와 다를 수 있음
- 아이콘은 위키 스프라이트가 없는 항목은 제외 — 앱은 아이콘 없이도 정상 표시
- 이미지는 [기존 재료 아이콘과 동일하게](#️-저작권--라이선스) 위키 스프라이트(저작권은 게임사)

> ⚠️ 무기 공격력/장착 효과는 게임 데이터의 레벨별 값입니다(기본 레벨값 → Lv20 최대값). 인게임 표기는 ±10% 등으로 다를 수 있습니다.

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
