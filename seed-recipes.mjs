// scripts/seed-recipes.mjs
// ingredients 테이블을 읽어 모든 조합(2,628개)을 계산해 recipes 테이블에 적재한다.
// 실행:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-recipes.mjs
// service_role 키는 RLS를 우회하므로 시드에 필요. 로컬에서만 쓰고 절대 커밋/배포 금지.

import { createClient } from "@supabase/supabase-js";
import ws from "ws";
if (!globalThis.WebSocket) globalThis.WebSocket = ws;

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY; // sb_secret_... 또는 legacy service_role
if (!url || !key) {
  console.error("환경변수 필요: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

const LABELS = {
  hpRegen:"초당 체력 회복", maxHp:"최대 체력", maxHpOnce:"최대 체력",
  moveSpeed:"이동 속도", armor:"방어력", meleeDmg:"근접 피해", rangeDmg:"원거리 피해",
  magicDmg:"마법 피해", minionDmg:"소환수 피해", allDmg:"전체 피해",
  meleeAtkSpeed:"근접 공격 속도", rangeAtkSpeed:"원거리 공격 속도", minionAtkSpeed:"소환수 공격 속도",
  mrAtkSpeed:"근접·원거리 공격 속도", critChance:"치명타 확률", critDmg:"치명타 피해",
  minionCrit:"소환수 치명타 확률", lifeOnHit:"근접 적중 시 생명 흡수", dodge:"회피 확률",
  knockback:"근접 적중 시 넉백 확률", thorns:"가시 피해", bossDmg:"보스 추가 피해",
  bossRedu:"보스 피해 감소", healBonus:"지속 회복 효과 증가", glow:"발광", glowBlue:"푸른 발광",
  manaRegen:"초당 마나 회복", maxMana:"최대 마나", magicBarrier:"마법 보호막",
  miningDmg:"채광 피해", miningSpeed:"채광 속도", fishing:"낚시", petDmg:"펫 피해",
  lessFoodRun:"달릴 때 음식 소모 감소", acidImm:"산 피해 면역", slimeImm:"슬라임 둔화 면역",
  moldImm:"곰팡이 감염 면역", burnImm:"화상 면역",
};
const buffLabel = (b) => b.label || LABELS[b.key] || b.key;
const buffVal = (b) => (b.val == null ? "면역" : (b.val >= 0 ? "+" : "") + b.val + (b.unit || ""));
const buffText = (b) => {
  let t = `${buffLabel(b)} ${buffVal(b)}`;
  if (b.dur) t += ` (${b.dur})`;
  if (b.perm) t += " [영구]";
  return t;
};
function rarityNote(a, b) {
  if (a.is_gold && b.is_gold) return "황금/전설 2개 → 최소 레어 + 추가 15%";
  if (a.is_gold || b.is_gold) return "황금/전설 포함 → 최소 레어(+25%) 보장";
  return "일반 조합 → 레어/에픽 확률 발동";
}
function combine(a, b) {
  const food = Math.round(a.food + b.food);
  const map = {};
  for (const bf of [...(a.buffs || []), ...(b.buffs || [])]) {
    const id = bf.perm ? bf.key + "_perm" : bf.key;
    const cur = map[id];
    if (!cur) { map[id] = bf; continue; }
    if (bf.val != null && cur.val != null && bf.val > cur.val) map[id] = bf;
  }
  const buffs = Object.values(map).sort((x, y) => Number(x.val == null) - Number(y.val == null));
  return { food, buffs };
}

const { data: items, error } = await sb
  .from("ingredients").select("*").order("name_ko", { ascending: true });
if (error) { console.error("ingredients 읽기 실패:", error.message); process.exit(1); }
console.log(`재료 ${items.length}종 로드`);

const rows = [];
for (let i = 0; i < items.length; i++) {
  for (let j = i; j < items.length; j++) {
    const a = items[i], b = items[j];
    const r = combine(a, b);
    rows.push({
      id: `${a.id}__${b.id}`,
      a_id: a.id, b_id: b.id,
      a_name_ko: a.name_ko, b_name_ko: b.name_ko,
      a_name_en: a.name_en, b_name_en: b.name_en,
      food: r.food,
      buffs: r.buffs,
      effects_text: [`포만감 +${r.food}`, ...r.buffs.map(buffText)].join(" / "),
      rarity_note: rarityNote(a, b),
      a_source: a.source, b_source: b.source,
    });
  }
}
console.log(`조합 ${rows.length}개 생성, 적재 시작…`);

// 기존 데이터 비우고(선택) 청크 단위 upsert
await sb.from("recipes").delete().neq("id", "");
const CHUNK = 500;
for (let i = 0; i < rows.length; i += CHUNK) {
  const chunk = rows.slice(i, i + CHUNK);
  const { error: e } = await sb.from("recipes").upsert(chunk);
  if (e) { console.error(`청크 ${i} 실패:`, e.message); process.exit(1); }
  console.log(`  ${Math.min(i + CHUNK, rows.length)}/${rows.length}`);
}
console.log("완료 ✅");
