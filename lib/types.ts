export type Buff = {
  key: string;
  cat: string;        // 회복 / 근접 / 마법 ...
  val: number | null; // null = 면역 등 ON/OFF
  unit: string;       // '%' | ''
  dur: string;        // '10분' | '20초' | ''
  perm?: boolean;     // 영구(1회)
  label?: string;     // 커스텀 라벨(있으면 우선)
};

export type Ingredient = {
  id: string;
  name_ko: string;
  name_en: string;
  type: "plant" | "fish" | "other";
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  is_gold: boolean;
  food: number;
  source: string;
  buffs: Buff[];
};

export type Combo = {
  a: Ingredient;
  b: Ingredient;
  food: number;
  buffs: Buff[];
  rarityNote: string;
  rarityColor: string;
};
