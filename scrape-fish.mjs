// scrape-fish.mjs
// 낚시터(비옴)별 물고기 도감 데이터를 만든다.
//  FishingInfo/data (비옴 → 낚시 로테이블 + 최소 낚시 스킬)
//  + LootTableInfo/data (로테이블 → 물고기 + 확률)
//  + ObjectInfo/data (물고기 이름·등급·설명)
// → public/data/fish.json + public/fish-icons/
// 실행:  node scrape-fish.mjs   (SKIP_ICONS=1 이면 데이터만)
// 데이터/이미지 저작권: © Pugstorm / Fireshine Games (비상업적 팬 이용).

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getObjectInfo, fetchJson, parseLuaModule, arr, slug, downloadIcons, RARITY_KEY, API } from "./scrape-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 비옴 → 한글 낚시터명 (진행 순)
const KO_LOC = {
  Slime: "흙 비옴 (시작 물웅덩이)", Larva: "유충 둥지", Stone: "잊혀진 유적 (돌 지대)",
  Mold: "곰팡이 던전", Nature: "아제오스의 황야", Sea: "가라앉은 바다", Desert: "시초의 사막",
  Lava: "용암 지대", Crystal: "반짝이는 변경", Passage: "통로",
};
// 물고기 한글명 (음역, 기존 재료 도감 표기와 통일)
const KO_FISH = {
  "Orange Cave Guppy": "오렌지 동굴 구피", "Blue Cave Guppy": "블루 동굴 구피", "Rock Jaw": "록 죠",
  "Gem Crab": "젬 크랩", "Yellow Blister Head": "옐로 블리스터 헤드", "Green Blister Head": "그린 블리스터 헤드",
  "Devil Worm": "데빌 웜", "Vampire Eel": "뱀파이어 일", "Dagger Fin": "대거 핀",
  "Pink Palace Fish": "핑크 팰리스 피시", "Teal Palace Fish": "틸 팰리스 피시", "Crown Squid": "크라운 스퀴드",
  "Azure Feather Fish": "애저 페더 피시", "Emerald Feather Fish": "에메랄드 페더 피시", "Spirit Veil": "스피릿 베일",
  "Astral Jelly": "아스트랄 젤리", "Bottom Tracer": "바텀 트레이서", "Silver Dart": "실버 다트",
  "Golden Dart": "골든 다트", "Pink Coralotl": "핑크 코랄로틀", "White Coralotl": "화이트 코랄로틀",
  "Solid Spikeback": "솔리드 스파이크백", "Sandy Spikeback": "샌디 스파이크백", "Brown Dune Tail": "브라운 듄 테일",
  "Gray Dune Tail": "그레이 듄 테일", "Tornis Kingfish": "토르니스 킹피시", "Mold Shark": "곰팡이 상어",
  "Rot Fish": "부패 물고기", "Black Steel Urchin": "흑강 성게", "Dark Lava Eater": "다크 라바 이터",
  "Bright Lava Eater": "브라이트 라바 이터", "Elder Dragonfish": "엘더 드래곤피시", "Verdant Dragonfish": "버던트 드래곤피시",
  "Starlight Nautilus": "스타라이트 노틸러스", "Beryll Angle Fish": "베릴 앵글 피시", "Glistening Deepstalker": "글리스닝 딥스토커",
  "Jasper Angle Fish": "재스퍼 앵글 피시", "Splendid Deepstalker": "스플렌디드 딥스토커", "Cosmic Form": "코스믹 폼",
  "Terra Trilobite": "테라 삼엽충", "Litho Trilobite": "리토 삼엽충", "Pinkhorn Pico": "핑크혼 피코",
  "Greenhorn Pico": "그린혼 피코", "Riftian Lampfish": "리프티안 램프피시",
};

const oi = await getObjectInfo();
console.log(`• ObjectInfo 로드 (${Object.keys(oi).length})`);
const fi = parseLuaModule((await fetchJson(`${API}?action=parse&page=Module:FishingInfo/data&prop=wikitext&format=json`)).parse.wikitext["*"]);
const lt = parseLuaModule((await fetchJson(`${API}?action=parse&page=Module:LootTableInfo/data&prop=wikitext&format=json`)).parse.wikitext["*"]);
console.log("• FishingInfo / LootTableInfo 로드");

const seen = new Set(); // 같은 로테이블 중복 비옴 제거 (None=Slime 등)
const locations = [];
for (const [biome, info] of Object.entries(fi.fishingInfos || {})) {
  if (!KO_LOC[biome]) continue;                 // None 등 제외
  if (seen.has(info.fishLootTable)) continue;
  seen.add(info.fishLootTable);
  const tbl = lt[info.fishLootTable];
  if (!tbl) continue;
  const fish = arr(tbl.lootInfos).map((f) => {
    const b = oi[f.id] && oi[f.id][0];
    const name_en = (b && b.name) || f.id;
    return {
      id: slug(name_en),
      name_en,
      name_ko: KO_FISH[name_en] || name_en,
      rarity: RARITY_KEY[b && b.rarity] || "common",
      desc_en: (b && b.description) || "",
      chance: Math.round(f.chance * 1000) / 10, // %
      icon: slug(name_en) + ".webp",
    };
  }).sort((a, b) => b.chance - a.chance);
  locations.push({
    location: biome,
    location_ko: KO_LOC[biome],
    min_fishing: info.minimumFishing ?? info.fishingRequired ?? null,
    fish,
  });
}
locations.sort((a, b) => (a.min_fishing ?? 0) - (b.min_fishing ?? 0));
console.log(`• 낚시터 ${locations.length}곳, 물고기 ${locations.reduce((n, l) => n + l.fish.length, 0)}마리`);

const dataDir = path.join(__dirname, "public", "data");
fs.mkdirSync(dataDir, { recursive: true });
fs.writeFileSync(path.join(dataDir, "fish.json"), JSON.stringify(locations, null, 2));
console.log("• public/data/fish.json 저장");

if (process.env.SKIP_ICONS) { console.log("• SKIP_ICONS=1 → 아이콘 건너뜀\n완료 ✅"); process.exit(0); }

const iconDir = path.join(__dirname, "public", "fish-icons");
const manifest = {};
const all = [];
const ids = new Set();
for (const l of locations) for (const f of l.fish) if (!ids.has(f.id)) { ids.add(f.id); all.push(f); }
console.log(`• 아이콘 다운로드 (${all.length}종)…`);
const miss = await downloadIcons(all, iconDir, manifest);
fs.writeFileSync(path.join(iconDir, "manifest.json"), JSON.stringify(manifest));
console.log(`• 아이콘 ${Object.keys(manifest).length}/${all.length}`);
if (miss.length) console.log(`  없음: ${miss.join(", ")}`);
console.log("완료 ✅");
