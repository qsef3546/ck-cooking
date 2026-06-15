-- ============================================================
--  Core Keeper 요리 도감 · recipes 테이블 (모든 조합 사전 계산본)
--  Supabase Dashboard > SQL Editor 에 붙여넣고 실행하세요.
--  (테이블/인덱스/RLS 생성만 함. 2628개 데이터는 node 스크립트로 적재)
-- ============================================================

create table if not exists recipes (
  id            text primary key,                 -- a_id__b_id
  a_id          text not null references ingredients(id),
  b_id          text not null references ingredients(id),
  a_name_ko     text not null,
  b_name_ko     text not null,
  a_name_en     text not null,
  b_name_en     text not null,
  food          int  not null,                    -- 합산 포만감
  buffs         jsonb not null default '[]',      -- 합쳐진 효과 배열
  effects_text  text not null,                    -- 사람이 읽는 효과 요약(한글)
  rarity_note   text not null,                    -- 등급 안내
  a_source      text not null,
  b_source      text not null
);

create index if not exists recipes_a_id_idx       on recipes (a_id);
create index if not exists recipes_b_id_idx       on recipes (b_id);
create index if not exists recipes_buffs_gin_idx  on recipes using gin (buffs);

-- 읽기 전용 공개 데이터: RLS 켜고 anon select만 허용
alter table recipes enable row level security;

drop policy if exists "public read recipes" on recipes;
create policy "public read recipes"
  on recipes for select
  to anon, authenticated
  using (true);

-- PostgREST 스키마 캐시 갱신
notify pgrst, 'reload schema';
