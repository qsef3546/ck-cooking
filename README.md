# 코어 키퍼 요리 도감 (Next.js + Supabase + Vercel)

재료1 + 재료2 = 완성 요리(효과·획득처)를 표로 보여주는 앱.
재료 데이터는 **Supabase**에 두고, 조합(약 2,628가지)은 앱에서 계산해 렌더링한다.

---

## 🔌 연동해야 할 것 (체크리스트)

### 1. Supabase
1. supabase.com 에서 프로젝트 생성
2. **SQL Editor** → `supabase/schema.sql` 붙여넣고 실행 (테이블 + RLS 공개 읽기 정책)
3. **SQL Editor** → `supabase/seed.sql` 붙여넣고 실행 (재료 72종 입력)
4. **Project Settings → API** 에서 두 값 복사:
   - `Project URL`        → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key     → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

> RLS는 **읽기 전용 공개**로만 열려 있음. anon 키가 노출돼도 select만 가능하므로 안전.
> 쓰기(편집 화면)를 추가하려면 service_role 키는 **서버 측에서만** 쓰고 절대 NEXT_PUBLIC_ 으로 노출하지 말 것.

### 2. 로컬 실행
```bash
cp .env.local.example .env.local   # 위에서 복사한 값 채우기
npm install
npm run dev                        # http://localhost:3000
```

### 3. Vercel 배포
1. GitHub에 푸시 → Vercel에서 **New Project → 이 레포 Import**
2. Framework: Next.js (자동 감지)
3. **Settings → Environment Variables** 에 동일하게 등록:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   (Production / Preview / Development 모두 체크)
4. Deploy

> Supabase는 별도 연동 설정 없이 환경변수 2개로 끝난다. Vercel↔Supabase
> 공식 인테그레이션(Marketplace)도 있지만, 이 앱은 클라이언트에서 anon으로
> 읽기만 하므로 환경변수 직접 등록이 더 단순하다.

---

## 📁 구조
```
app/
  layout.tsx        # 루트 레이아웃
  page.tsx          # 메인 화면 (조합 표 + 검색/필터)
  globals.css       # 다크 테마 스타일
lib/
  supabaseClient.ts # Supabase 클라이언트
  types.ts          # Ingredient / Buff / Combo 타입
  combine.ts        # 조합 계산 + 버프 라벨 + 색상
supabase/
  schema.sql        # 테이블 + RLS
  seed.sql          # 재료 72종 데이터
```

## 🧮 조합 규칙 (combine.ts)
- 포만감(food): 두 재료 **합산**
- 같은 종류 버프: **높은 값 하나만** 적용
- 다른 종류 버프: **전부 중첩**
- 등급: 황금/전설 재료가 들어가면 최소 레어(+25%) 보장, 둘 다면 +15% 추가
  (실제 수치는 게임 내 등급 발동·반올림에 따라 달라질 수 있음 — note로 표기)

## 🔧 데이터 수정
재료 추가/수정은 `ingredients` 테이블 행만 고치면 됨(앱 코드 변경 불필요).
버프는 `buffs` jsonb 배열 형태:
```json
[{"key":"meleeDmg","cat":"근접","val":28.2,"unit":"%","dur":"10분"}]
```

## 대안: 조합을 DB에 미리 저장하고 싶다면
지금은 조합을 앱에서 계산한다(재료 72개라 가볍다). SQL로 모든 조합을
미리 만들어 두고 서버 페이지네이션을 쓰고 싶으면, 재료 self-join으로 페어를
만들고 버프 병합은 Edge Function(TypeScript)에서 `combine()`을 재사용해
`combos` 테이블에 적재하면 된다. 일반적으로는 불필요.
