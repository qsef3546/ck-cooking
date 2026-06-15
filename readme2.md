# 코어 키퍼 요리 도감 (Core Keeper Cooking Codex)

Core Keeper 요리(재료 2개 조합)를 **`재료1 + 재료2 = 완성요리(효과·획득처)`** 형태로
보여주는 웹앱. 가능한 조합은 약 **2,628개**.

- **스택:** Next.js 14 (App Router, TypeScript) · Supabase (Postgres) · Vercel
- **상태:** `next build` 통과 검증됨. 로컬/배포 동작 확인.

> 이 문서는 진행 내역 + 셋업 + 트러블슈팅을 모두 담은 핸드오프용 README.
> Claude Code 등에서 이 레포를 이어서 관리할 때 컨텍스트로 사용.

---

## 1. 현재 상태 (2026-06 기준)

- **앱 동작 방식:** `ingredients` 테이블을 읽어 클라이언트에서 조합을 *계산*해 표시.
  환경변수가 없으면 번들된 로컬 데이터(`lib/ingredients.data.ts`)로 **자동 폴백**(우상단 배지로 표시).
- **DB:**
  - `ingredients` — 재료 72종 (단일 소스 데이터)
  - `recipes` — 모든 조합 2,628개 사전 계산본 (나중에 추가함)
- **배포:** Vercel. Supabase는 환경변수 2개로 연결.

---

## 2. 파일 구조

```
app/
  layout.tsx            # 루트 레이아웃
  page.tsx              # 메인 화면 (재료1+재료2 조합 표 + 검색/필터, Supabase→로컬 폴백)
  globals.css           # 다크 테마 스타일
lib/
  supabaseClient.ts     # Supabase 클라이언트 (env 없으면 null → 폴백)
  combine.ts            # 조합 계산 + 버프 라벨 + 카테고리 색상
  types.ts              # Ingredient / Buff / Combo 타입
  ingredients.data.ts   # 재료 72종 번들 데이터 (폴백 + 단일 소스)
scripts/
  seed-recipes.mjs      # recipes 테이블 시드 스크립트 (Node)
supabase/
  schema.sql            # ingredients 테이블 + RLS
  seed.sql              # ingredients 72종 데이터
  setup.sql             # schema + seed 통합 (ingredients용, SQL Editor에서 한 번에)
  recipes_schema.sql    # recipes 테이블 + 인덱스 + RLS
  recipes_seed.sql      # recipes 2,628개 (배치 INSERT) — 단, 용량 커서 Editor에선 막힘
  recipes_setup.sql     # recipes schema + seed 통합 (용량 큼, psql용)
```

---

## 3. 데이터 모델

### ingredients (재료, 단일 소스)
| 컬럼 | 설명 |
|---|---|
| id | 영문 슬러그 (예: `golden_heart_berry`) |
| name_ko / name_en | 한글명 / 영문명 |
| type | `plant` / `fish` / `other` |
| rarity | `common`~`legendary` |
| is_gold | 황금/전설 재료 여부 (최소 레어 보장 판정용) |
| food | 포만감 |
| source | 획득처 |
| buffs | jsonb 효과 배열 |

### recipes (모든 조합 사전 계산본)
| 컬럼 | 설명 |
|---|---|
| id | `a_id__b_id` |
| a_id / b_id | 재료1 / 재료2 id (FK → ingredients) |
| a_name_ko / b_name_ko / *_en | 재료 이름 |
| food | 합산 포만감 |
| buffs | 합쳐진 효과 배열 (jsonb) |
| effects_text | 사람이 바로 읽는 효과 요약(한글) |
| rarity_note | 등급 안내 |
| a_source / b_source | 각 재료 획득처 |

### buffs jsonb 형식
```json
[{"key":"meleeDmg","cat":"근접","val":28.2,"unit":"%","dur":"10분"},
 {"key":"maxHpOnce","cat":"생존","val":100,"unit":"","dur":"","perm":true}]
```

---

## 4. 조합 계산 규칙 (`lib/combine.ts`, `scripts/seed-recipes.mjs` 동일)

- **포만감(food):** 두 재료 **합산**
- **같은 종류 버프:** 더 **높은 값 하나만** 적용
- **다른 종류 버프:** **전부 중첩**
- **등급:** 황금/전설 재료가 들어가면 최소 레어(+25%) 보장, 둘 다면 +15% 추가
  (실제 수치는 게임 내 등급 발동·반올림에 따라 달라질 수 있어 note로만 표기)

---

## 5. 처음부터 셋업

```bash
git clone <repo> ck-cooking && cd ck-cooking
npm install
```

### Supabase
1. supabase.com 프로젝트 생성
2. **ingredients** — SQL Editor에 `supabase/setup.sql` 붙여넣고 Run (작아서 문제없음)
3. **recipes 테이블** — SQL Editor에 `supabase/recipes_schema.sql` Run (테이블/인덱스/RLS)
4. **recipes 데이터** — 아래 7번 "recipes 시드"로 적재 (Editor 용량 제한 때문에 스크립트 사용)
5. **Settings → API / API Keys** 에서 URL + 키 복사

### 로컬 실행
```bash
cp .env.local.example .env.local   # 값 채우기 (아래 6번)
npm run dev                        # http://localhost:3000
```
- 우상단 배지 **"Supabase 연결됨"** = DB 연결됨 / **"로컬 데이터"** = env 누락 → 번들 데이터로 동작

---

## 6. 환경변수

### 로컬 — `.env.local` (gitignore 됨, 커밋 안 됨)
```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...      # publishable 또는 legacy anon
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...               # recipes 시드 때만 필요(절대 커밋 X)
```

### Vercel — Settings → Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 두 개 등록
- **Production / Preview 반드시 포함** (Development만 켜면 배포본은 폴백됨)
- `NEXT_PUBLIC_`은 **빌드 시점에 번들에 박힘** → 등록 후 **반드시 재배포(Redeploy)**

### 키 / 파일 규칙 (중요)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` 자리엔 **publishable 키(`sb_publishable_`)** 또는 legacy `anon`(`eyJ...`) 둘 다 가능. 코드가 읽는 변수명은 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 로 통일.
  - (참고: 다른 이름 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 로 넣으려면 `lib/supabaseClient.ts`에서 그 이름도 읽도록 수정해야 함)
- **service_role / `sb_secret`** = RLS 우회 마스터 키. `.env.local`에만, 시드 실행 때만. `NEXT_PUBLIC_` 금지, 커밋 금지, Vercel 클라이언트 금지.
- `.gitignore`에는 **`.env.local`만** 들어 있음. `.env`엔 비밀값 넣지 말 것(추적될 수 있음).

---

## 7. recipes 시드 (모든 조합 적재)

> SQL Editor는 용량 제한이 있어 `recipes_seed.sql`(1.7MB)을 거부함
> ("Query is too large"). 그래서 **Node 스크립트**로 넣는다.

```bash
# Node < 22 는 내장 WebSocket 이 없어 supabase-js 가 죽음 → ws 폴리필 설치
npm i ws

# .env.local 의 SUPABASE_SERVICE_ROLE_KEY 로 RLS 우회해서 적재
node --env-file=.env.local scripts/seed-recipes.mjs
```
- 스크립트는 DB의 `ingredients`를 읽어 동일 로직으로 2,628개를 계산해 upsert.
- **재실행 안전** (기존 데이터 비우고 다시 채움).
- 결과: `재료 72종 로드 → 조합 2628개 생성 → 2628/2628 → 완료 ✅`

대안(psql): `psql "<connection string>" -f supabase/recipes_setup.sql`
(Supabase Connect 버튼에서 연결 문자열 + DB 비밀번호 필요)

확인:
```sql
select count(*) from recipes;   -- 2628
select a_name_ko, b_name_ko, effects_text, rarity_note from recipes limit 5;
```

---

## 8. 실행 / 배포

```bash
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드 (타입체크 포함)
npm run start    # 빌드 결과 실행
```
배포: GitHub push → Vercel 자동 빌드. env 등록/변경 후엔 **Redeploy** 필수.

---

## 9. 유용한 쿼리

```sql
-- 특정 재료가 들어간 모든 요리
select a_name_ko, b_name_ko, effects_text, rarity_note
from recipes
where a_name_ko = '황금 하트베리' or b_name_ko = '황금 하트베리';

-- 근접 피해 버프가 붙는 요리
select a_name_ko, b_name_ko, effects_text
from recipes
where buffs @> '[{"key":"meleeDmg"}]';

-- 효과 텍스트로 검색
select * from recipes where effects_text ilike '%치명타%';
```

---

## 10. 트러블슈팅 (실제 겪은 이슈 기록)

| 증상 | 원인 / 해결 |
|---|---|
| `'next'은(는) ... 명령이 아닙니다` | `npm install` 안 함. node_modules는 깃에 없음(gitignore) → 먼저 `npm install` |
| SQL Editor `Query is too large to be run` | 큰 seed는 Editor 불가. `scripts/seed-recipes.mjs` 또는 psql 사용 |
| `Node.js 20 detected without native WebSocket support` | supabase-js 가 생성 시 realtime 초기화. `npm i ws` 후 스크립트 상단 폴리필(이미 적용), 또는 Node 22+ 사용 |
| `Could not find the table 'public.recipes'` | `recipes_schema.sql`을 먼저 실행(테이블 생성) 후 시드 |
| 배포본이 계속 "로컬 데이터" 배지 | Vercel env에 Production 미포함 또는 재배포 안 함. env에 Production 포함 + Redeploy |
| 테이블 만들었는데 schema cache 에러 | SQL Editor에서 `notify pgrst, 'reload schema';` 실행 후 재시도 |
| 키 이름 혼동 (PUBLISHABLE vs ANON) | 코드가 읽는 이름은 `NEXT_PUBLIC_SUPABASE_ANON_KEY`. 값은 publishable 키 넣어도 됨 |

---

## 11. 다음 할 일 / 주의 (for Claude Code)

- [ ] (선택) 앱을 `recipes` 테이블 **직접 읽기**로 전환 → 서버 사이드 검색/필터/페이지네이션.
      현재는 `ingredients`에서 클라이언트 계산. 전환 시 `app/page.tsx` 쿼리 교체 필요.
- [ ] 재료 한글명이 **음역**임 → 게임 공식 한글 번역명으로 교체 시 `ingredients.data.ts`의 `name_ko`만 수정 후 시드/recipes 재생성.
- [ ] 위키에 수치 누락된 일부 재료(예: Grey Dune Tail) 제외돼 있음 → 보강 가능.
- [ ] **데이터 동기화 주의:** `lib/ingredients.data.ts`(번들/폴백)와 `supabase/seed.sql`(DB)은 같은 소스. 한쪽만 고치면 어긋남.
- [ ] **recipes는 파생 데이터:** `ingredients` 수치를 바꾸면 `recipes`를 **재시드**해야 함(현재 앱의 실시간 계산 방식은 불필요).

## 데이터 출처
Core Keeper Wiki (Cooking). 팬 제작 데이터이며 게임 업데이트 시 수치가 바뀔 수 있음.
표시 수치는 "요리 시 적용 효과" 기준(날것 섭취와 다름).