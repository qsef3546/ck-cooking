// 펫 도감 타입. 데이터는 public/data/pets.json
export type PetBuff = { label: string; value: number | null; unit: string };

export type Pet = {
  id: string;
  name_en: string;
  name_ko: string;
  desc_en: string;
  pet_type: string;       // Melee | Range | Buff ...
  pet_type_ko: string;    // 근접 | 원거리 | 버프형
  area: string | null;
  area_ko: string | null;
  dmg: number | null;     // 펫 자체 공격력(있으면)
  buffs: PetBuff[];       // 플레이어에게 주는 패시브 버프
  talents: string[];      // 특화 가능 스탯
};

export const PET_TYPE_COLOR: Record<string, string> = {
  근접: "#ff9a4d", 원거리: "#ffd24d", 버프형: "#6ee36e", 마법: "#7db4ff",
};
