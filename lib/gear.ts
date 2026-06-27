// 방어구 · 장신구 · 도구(아이템) 공용 타입. 데이터는 public/data/{armor,accessories,tools}.json
import type { WeaponMaterial } from "./weapons";

export type GearCondition = {
  id: string;
  label: string;       // 한글 효과명
  unit: string;        // '%' | ''
  base: number | null; // 기본 레벨 값
  max: number | null;  // Lv20 값
};

export type GearItem = {
  id: string;
  name_en: string;
  name_ko: string;
  desc_en: string;
  subtype: string;     // Helm | Ring | MiningPick ...
  subtype_ko: string;  // 투구 | 반지 | 곡괭이 ...
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  level: number | null;
  area: string | null;
  area_ko: string | null;
  sell: number | null;
  durability: number | null;
  dmg_base: number | null;
  conditions: GearCondition[];
  materials: WeaponMaterial[];
  drops: string[];   // 아이템 자체 드롭 출처(있으면)
};

export type GearKind = "armor" | "accessories" | "tools";

export const GEAR_LABEL: Record<GearKind, string> = {
  armor: "방어구",
  accessories: "장신구",
  tools: "아이템",
};

export function condText(c: GearCondition): string {
  if (c.base == null) return c.label;
  const sign = c.base >= 0 ? "+" : "";
  return `${c.label} ${sign}${c.base}${c.unit}`;
}
