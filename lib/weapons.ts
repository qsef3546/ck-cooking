// 무기 도감용 타입 & 헬퍼. 데이터는 public/data/weapons.json (위키 스크래핑 결과).
export type WeaponMaterial = {
  id: string;
  name_en: string;
  name_ko: string;
  amount: number | null;       // 고정 수량 (가변이면 null)
  amount_min: number;
  amount_max: number;
  src_type?: string;           // 재료 출처: 제작 | 드롭 | 구매 | ""
  src_detail?: string;         // 출처 상세 (예: "드롭: 오렌지 슬라임, 라바")
};

export type Weapon = {
  id: string;
  name_en: string;
  name_ko: string;
  desc_en: string;
  damage_class: "melee" | "ranged" | "magic";
  class_ko: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  level: number | null;
  area: string | null;
  area_ko: string | null;
  dmg_base: number | null;
  dmg_max: number | null;
  atk_rate: number | null;
  durability: number | null;
  sell: number | null;
  materials: WeaponMaterial[];
  drops: string[];   // 아이템 자체 드롭 출처(있으면)
  icon: string;
};

// 요리 도감과 색 체계를 공유 (근접/원거리/마법)
export const WCLASS_COLOR: Record<Weapon["damage_class"], string> = {
  melee: "#ff9a4d",
  ranged: "#ffd24d",
  magic: "#7db4ff",
};
export const WCLASS_LABEL: Record<Weapon["damage_class"], string> = {
  melee: "근접",
  ranged: "원거리",
  magic: "마법",
};

export function matAmount(m: WeaponMaterial): string {
  if (m.amount != null) return "×" + m.amount;
  if (m.amount_min === m.amount_max) return "×" + m.amount_min;
  return `×${m.amount_min}~${m.amount_max}`;
}
