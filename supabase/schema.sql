-- ============================================================
--  Core Keeper 요리 도감 · Supabase 스키마
--  Supabase Dashboard > SQL Editor 에 붙여넣고 실행하세요.
-- ============================================================

create table if not exists ingredients (
  id        text primary key,          -- 영문 슬러그 (예: golden_heart_berry)
  name_ko   text    not null,          -- 한글명
  name_en   text    not null,          -- 영문명
  type      text    not null,          -- plant | fish | other
  rarity    text    not null,          -- common | uncommon | rare | epic | legendary
  is_gold   boolean not null default false,  -- 황금/전설 재료 여부(최소 레어 보장 판정용)
  food      int     not null,          -- 포만감
  source    text    not null,          -- 획득처
  buffs     jsonb   not null default '[]'  -- 요리 시 적용 효과 배열
);

-- 읽기 전용 공개 데이터: RLS 켜고 anon select만 허용
alter table ingredients enable row level security;

drop policy if exists "public read ingredients" on ingredients;
create policy "public read ingredients"
  on ingredients for select
  to anon, authenticated
  using (true);

-- buffs jsonb 예시:
-- [{"key":"meleeDmg","cat":"근접","val":28.2,"unit":"%","dur":"10분"},
--  {"key":"maxHpOnce","cat":"생존","val":100,"unit":"","dur":"","perm":true}]
