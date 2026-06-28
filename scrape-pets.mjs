// scrape-pets.mjs
// 펫(type=Pet) 도감: 유형(근접/원거리/버프) · 플레이어에게 주는 패시브 버프 · 특화 · 등장 지역.
// → public/data/pets.json + public/pet-icons/
// 실행:  node scrape-pets.mjs   (SKIP_ICONS=1 이면 데이터만)
// 데이터/이미지 저작권: © Pugstorm / Fireshine Games (비상업적 팬 이용).

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getObjectInfo, arr, slug, downloadIcons, condLabel } from "./scrape-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const KO_PET = {
  "Subterrier": "서브테리어", "Embertail": "엠버테일", "Owlux": "아울럭스",
  "Jr. Orange Slime": "주니어 오렌지 슬라임", "Fanhare": "팬헤어", "Jr. Blue Slime": "주니어 블루 슬라임",
  "Jr. Purple Slime": "주니어 퍼플 슬라임", "Jr. Lava Slime": "주니어 라바 슬라임", "Prince Slime": "프린스 슬라임",
  "Pheromoth": "페로모스", "Snugglygrade": "스너글리그레이드", "Arcane Symbiote": "아케인 심바이오트",
  "Electro-Pet": "일렉트로 펫", "Earie": "이어리",
};
const KO_TYPE = { Melee: "근접", Range: "원거리", Buff: "버프형", Magic: "마법" };
const KO_AREA = {
  StartArea: "시작 지역(흙 비옴)", Slime: "흙 비옴(슬라임 지대)", Clay: "점토 동굴",
  Stone: "잊혀진 유적(돌 지대)", Nature: "아제오스의 황야", Sea: "가라앉은 바다",
  Desert: "시초의 사막", Mold: "곰팡이 던전", Lava: "용암 지대", Crystal: "반짝이는 변경",
  LarvaHive: "유충 둥지", Larva: "유충 둥지", Excavation: "발굴 현장", Passage: "통로", City: "고대 도시",
};

const oi = await getObjectInfo();
console.log(`• ObjectInfo 로드 (${Object.keys(oi).length})`);

const pets = [];
for (const k of Object.keys(oi)) {
  const b = oi[k] && oi[k][0];
  if (!b || b.type !== "Pet") continue;
  const p = b.pet || {};
  const buffs = arr(b.conditions).map((c) => {
    const [label, unit] = condLabel(c.id);
    return { label, value: c.value ?? null, unit };
  });
  const talents = arr(p.talents).map((t) => condLabel(t)[0]);
  pets.push({
    id: slug(b.name),
    name_en: b.name,
    name_ko: KO_PET[b.name] || b.name,
    desc_en: b.description || "",
    pet_type: p.type || "",
    pet_type_ko: KO_TYPE[p.type] || p.type || "",
    area: b.area || null,
    area_ko: b.area ? KO_AREA[b.area] || b.area : null,
    dmg: (b.meleeAttackState && b.meleeAttackState.damage) || null,
    buffs,
    talents,
  });
}
pets.sort((a, b) => a.pet_type_ko.localeCompare(b.pet_type_ko) || a.name_en.localeCompare(b.name_en));
console.log(`• 펫 ${pets.length}종 추출`);

const dataDir = path.join(__dirname, "public", "data");
fs.mkdirSync(dataDir, { recursive: true });
fs.writeFileSync(path.join(dataDir, "pets.json"), JSON.stringify(pets, null, 2));
console.log("• public/data/pets.json 저장");

if (process.env.SKIP_ICONS) { console.log("• SKIP_ICONS=1 → 아이콘 건너뜀\n완료 ✅"); process.exit(0); }

const iconDir = path.join(__dirname, "public", "pet-icons");
const manifest = {};
console.log(`• 아이콘 다운로드 (${pets.length}종)…`);
const miss = await downloadIcons(pets, iconDir, manifest);
fs.writeFileSync(path.join(iconDir, "manifest.json"), JSON.stringify(manifest));
console.log(`• 아이콘 ${Object.keys(manifest).length}/${pets.length}`);
if (miss.length) console.log(`  없음: ${miss.join(", ")}`);
console.log("완료 ✅");
