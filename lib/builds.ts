// 추천 빌드 타입. 데이터는 public/data/builds.json (커뮤니티 리서치 큐레이션)
export type BuildItem = {
  id?: string;
  kind?: "weapon" | "armor" | "accessory" | "fish";
  name_ko: string;
  name_en?: string;
  note: string;
  icon: string | null;
};

export type BuildSource = { title: string; url: string };

export type Build = {
  id: string;
  emoji: string;
  title: string;
  color: string;
  summary: string;
  stats: string[];
  weapons: BuildItem[];
  armor: BuildItem[];
  accessories: BuildItem[];
  food: BuildItem[];
  tips: string[];
  sources: BuildSource[];
};
