// scrape-bosses.mjs
// 보스(크리처 categories=Boss, loot.drops 보유)별 드롭 도감.
// → public/data/bosses.json + public/boss-icons/
// 실행:  node scrape-bosses.mjs   (SKIP_ICONS=1 이면 데이터만)
// 데이터/이미지 저작권: © Pugstorm / Fireshine Games (비상업적 팬 이용).

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getObjectInfo, arr, slug, downloadIcons, koMaterial } from "./scrape-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const KO_AREA = {
  Slime: "흙 비옴(슬라임 지대)", Clay: "점토 동굴", LarvaHive: "유충 둥지", Stone: "잊혀진 유적(돌 지대)",
  Nature: "아제오스의 황야", Sea: "가라앉은 바다", Desert: "시초의 사막", Mold: "곰팡이 던전",
  Lava: "용암 지대", Crystal: "반짝이는 변경", Excavation: "발굴 현장", Passage: "통로",
};
const AREA_ORDER = ["Slime", "Clay", "LarvaHive", "Stone", "Nature", "Sea", "Desert", "Mold", "Lava", "Crystal", "Excavation", "Passage"];

const KO_BOSS = {
  "Ghorm the Devourer": "포식자 그놈", "The Hive Mother": "하이브 마더", "Haunted Hive Mother": "유령 하이브 마더",
  "Glurch the Abominous Mass": "글러치", "Ivy the Poisonous Mass": "아이비", "King Slime": "킹 슬라임",
  "Igneous the Molten Mass": "이그니어스", "Malugaz the Corrupted": "타락한 말루가즈",
  "Azeos the Sky Titan": "하늘의 거신 아제오스", "Omoroth the Sea Titan": "바다의 거신 오모로스",
  "Ra-Akar the Sand Titan": "모래의 거신 라-아카르", "Druidra the Wild Titan": "야생의 거신 드루이드라",
  "Crydra the Ice Titan": "얼음의 거신 크라이드라", "Pyrdra the Fire Titan": "불의 거신 파이드라",
  "Atlantean Worm": "아틀란티스 웜", "Oblidra the Void Lord": "공허의 군주 오블리드라",
  "Urschleim": "우르슐라임", "Nimruza, Queen of the Burrowed Sands": "니므루자, 모래굴의 여왕",
  "S.A.H.A.B.A.R.": "S.A.H.A.B.A.R.",
};
// 보스 고유 드롭 한글(공용 재료는 koMaterial 사용, 미등록은 영문 유지)
const KO_DROP = {
  "Healing Potion": "회복 물약", "Royal Gel": "로열 젤", "Jungle Emerald": "정글 에메랄드",
  "Ocean Sapphire": "오션 사파이어", "Pink Hydra Eye": "핑크 히드라 눈", "White Hydra Eye": "화이트 히드라 눈",
  "Mysterious Idol": "신비한 우상", "Slime Oil Idol": "슬라임 오일 우상", "Pile of Chum Idol": "떡밥 더미 우상",
  "Void Idol": "공허 우상", "Glurch Eye": "글러치의 눈", "Ghorm's Horn": "그놈의 뿔",
  "King Slime Crown": "킹 슬라임 왕관", "Stolen Crystal Heart": "도난당한 크리스탈 심장",
  "Atlantean Worm Heart": "아틀란티스 웜 심장", "Oblidra's Heart": "오블리드라의 심장",
  "Giant Mitochondrion": "거대 미토콘드리아", "Oozy Royal Egg": "끈적한 왕실 알",
  "Ghorm's Stomach Backpack": "그놈의 위장 배낭", "Samhain Curse Ring": "삼하인 저주 반지",
  "Samhain Offering Necklace": "삼하인 공물 목걸이", "King Slime Figurine": "킹 슬라임 피규어",
  "Haunted Hive Mother Figurine": "유령 하이브 마더 피규어", "Stolen Crystal Heart ": "도난당한 크리스탈 심장",
};
const koDrop = (en) => KO_DROP[en] || koMaterial(en);

const oi = await getObjectInfo();
console.log(`• ObjectInfo 로드 (${Object.keys(oi).length})`);
const nameOf = (id) => (oi[id] && oi[id][0] && oi[id][0].name) || id;

const bosses = [];
for (const k of Object.keys(oi)) {
  const b = oi[k] && oi[k][0];
  if (!b) continue;
  const cats = arr(b.categories);
  if (!cats.includes("Boss")) continue;
  const drops = b.loot && arr(b.loot.drops);
  if (!drops || !drops.length) continue;
  bosses.push({
    id: slug(b.name),
    name_en: b.name,
    name_ko: KO_BOSS[b.name] || b.name,
    hp: b.health ?? null,
    area: b.area || null,
    area_ko: b.area ? KO_AREA[b.area] || b.area : null,
    drops: drops.map((d) => {
      const nm = nameOf(d.id);
      const a = d.amount;
      return {
        id: d.id, name_en: nm, name_ko: koDrop(nm),
        amount: typeof a === "object" ? null : a,
        amount_min: typeof a === "object" ? a.min : a,
        amount_max: typeof a === "object" ? a.max : a,
        chance: Math.round((d.chance ?? 0) * 100),
      };
    }),
  });
}
bosses.sort((a, b) => (AREA_ORDER.indexOf(a.area) - AREA_ORDER.indexOf(b.area)) || (a.hp ?? 0) - (b.hp ?? 0));
console.log(`• 보스 ${bosses.length}종 추출`);

const dataDir = path.join(__dirname, "public", "data");
fs.mkdirSync(dataDir, { recursive: true });
fs.writeFileSync(path.join(dataDir, "bosses.json"), JSON.stringify(bosses, null, 2));
console.log("• public/data/bosses.json 저장");

if (process.env.SKIP_ICONS) { console.log("• SKIP_ICONS=1 → 아이콘 건너뜀\n완료 ✅"); process.exit(0); }

const iconDir = path.join(__dirname, "public", "boss-icons");
const manifest = {};
console.log(`• 아이콘 다운로드 (${bosses.length}종)…`);
const miss = await downloadIcons(bosses, iconDir, manifest);
fs.writeFileSync(path.join(iconDir, "manifest.json"), JSON.stringify(manifest));
console.log(`• 아이콘 ${Object.keys(manifest).length}/${bosses.length}`);
if (miss.length) console.log(`  없음: ${miss.join(", ")}`);
console.log("완료 ✅");
