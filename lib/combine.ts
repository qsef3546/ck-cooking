import type { Buff, Ingredient, Combo } from "./types";

export const CAT_COLOR: Record<string, string> = {
  회복: "#6ee36e", 생존: "#ff7d7d", 근접: "#ff9a4d", 원거리: "#ffd24d",
  마법: "#7db4ff", 소환: "#c98bff", 전투: "#ff5e5e", 방어: "#5fd6c2",
  이동: "#8ee0ff", 채광: "#caa46a", 유틸: "#b9aa96", 면역: "#9ad1a0",
};

export const RARITY: Record<string, [string, string]> = {
  common: ["일반", "#d9d2c5"], uncommon: ["고급", "#5fd35f"],
  rare: ["희귀", "#4aa3ff"], epic: ["영웅", "#c061f0"], legendary: ["전설", "#ffb238"],
};

const LABELS: Record<string, string> = {
  hpRegen: "초당 체력 회복", maxHp: "최대 체력", maxHpOnce: "최대 체력",
  moveSpeed: "이동 속도", armor: "방어력", meleeDmg: "근접 피해", rangeDmg: "원거리 피해",
  magicDmg: "마법 피해", minionDmg: "소환수 피해", allDmg: "전체 피해",
  meleeAtkSpeed: "근접 공격 속도", rangeAtkSpeed: "원거리 공격 속도", minionAtkSpeed: "소환수 공격 속도",
  mrAtkSpeed: "근접·원거리 공격 속도", critChance: "치명타 확률", critDmg: "치명타 피해",
  minionCrit: "소환수 치명타 확률", lifeOnHit: "근접 적중 시 생명 흡수", dodge: "회피 확률",
  knockback: "근접 적중 시 넉백 확률", thorns: "가시 피해", bossDmg: "보스 추가 피해",
  bossRedu: "보스 피해 감소", healBonus: "지속 회복 효과 증가", glow: "발광", glowBlue: "푸른 발광",
  manaRegen: "초당 마나 회복", maxMana: "최대 마나", magicBarrier: "마법 보호막",
  miningDmg: "채광 피해", miningSpeed: "채광 속도", fishing: "낚시", petDmg: "펫 피해",
  lessFoodRun: "달릴 때 음식 소모 감소", acidImm: "산 피해 면역", slimeImm: "슬라임 둔화 면역",
  moldImm: "곰팡이 감염 면역", burnImm: "화상 면역",
};

export const buffLabel = (bf: Buff) => bf.label || LABELS[bf.key] || bf.key;

export function buffValText(bf: Buff) {
  if (bf.val == null) return "면역";
  return (bf.val >= 0 ? "+" : "") + bf.val + (bf.unit || "");
}

export function buffText(bf: Buff) {
  let t = `${buffLabel(bf)} ${buffValText(bf)}`;
  if (bf.dur) t += ` (${bf.dur})`;
  if (bf.perm) t += " [영구]";
  return t;
}

/** 두 재료를 합쳐 결과 요리를 계산: 포만감 합산, 같은 종류 버프는 높은 값만, 다른 종류는 전부 중첩 */
export function combine(a: Ingredient, b: Ingredient): Combo {
  const food = Math.round(a.food + b.food);
  const map: Record<string, Buff> = {};
  for (const bf of [...a.buffs, ...b.buffs]) {
    const id = bf.perm ? bf.key + "_perm" : bf.key;
    const cur = map[id];
    if (!cur) { map[id] = bf; continue; }
    if (bf.val != null && cur.val != null && bf.val > cur.val) map[id] = bf;
  }
  const buffs = Object.values(map).sort(
    (x, y) => Number(x.val == null) - Number(y.val == null)
  );
  const [rarityNote, rarityColor] = rarity(a, b);
  return { a, b, food, buffs, rarityNote, rarityColor };
}

function rarity(a: Ingredient, b: Ingredient): [string, string] {
  if (a.is_gold && b.is_gold) return ["황금/전설 2개 → 최소 레어 + 추가 15%", "#ffb238"];
  if (a.is_gold || b.is_gold) return ["황금/전설 포함 → 최소 레어(+25%) 보장", "#4aa3ff"];
  return ["일반 조합 → 레어/에픽 확률 발동", "#9a8a76"];
}

/** 재료 목록으로 모든 조합 생성 (자기 자신과의 조합 포함, i<=j) */
export function allCombos(list: Ingredient[]): Combo[] {
  const out: Combo[] = [];
  for (let i = 0; i < list.length; i++)
    for (let j = i; j < list.length; j++)
      out.push(combine(list[i], list[j]));
  return out;
}
