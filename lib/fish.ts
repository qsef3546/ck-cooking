// 낚시 도감 타입. 데이터는 public/data/fish.json
export type Fish = {
  id: string;
  name_en: string;
  name_ko: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  desc_en: string;
  chance: number;   // 낚일 확률 (%)
  icon: string;
};

export type FishingSpot = {
  location: string;
  location_ko: string;
  min_fishing: number | null;  // 최소 낚시 스킬
  fish: Fish[];
};
