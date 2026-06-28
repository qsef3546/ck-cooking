// 보스 드롭 도감 타입. 데이터는 public/data/bosses.json
export type BossDrop = {
  id: string;
  name_en: string;
  name_ko: string;
  amount: number | null;
  amount_min: number;
  amount_max: number;
  chance: number;   // %
};

export type Boss = {
  id: string;
  name_en: string;
  name_ko: string;
  hp: number | null;
  area: string | null;
  area_ko: string | null;
  drops: BossDrop[];
};

export function dropAmount(d: BossDrop): string {
  if (d.amount != null) return "×" + d.amount;
  if (d.amount_min === d.amount_max) return "×" + d.amount_min;
  return `×${d.amount_min}~${d.amount_max}`;
}
