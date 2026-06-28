// 낚시 도감 타입. 데이터는 public/data/fish.json
export type FishEffect = {
  label: string;          // 한글 효과명 (포만감 / 지속 회복 …)
  value: number | null;
  unit: string;           // '%' | ''
  dur: string;            // '20초' | '10분' | ''
};

export type Fish = {
  id: string;
  name_en: string;
  name_ko: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  desc_en: string;
  chance: number;   // 낚일 확률 (%)
  effects: FishEffect[];  // 생으로 먹었을 때 옵션
  icon: string;
};

export type FishingSpot = {
  location: string;
  location_ko: string;
  min_fishing: number | null;  // 최소 낚시 스킬
  fish: Fish[];
};
