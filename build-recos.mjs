// build-recos.mjs
// 커뮤니티 추천 빌드(근접/원거리물리/마법/소환)를 정리해 public/data/builds.json 생성.
// 각 추천 아이템(id+kind)을 기존 도감 데이터(이름·아이콘)에 연결한다.
// 출처: bisecthosting, primagames, cozychecklist, Steam 토론/가이드, Core Keeper Wiki 등.
// 실행:  node build-recos.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const D = (f) => JSON.parse(fs.readFileSync(path.join(__dirname, "public", "data", f), "utf8"));
const weapons = D("weapons.json");
const armor = D("armor.json");
const accessories = D("accessories.json");
const fish = D("fish.json").flatMap((s) => s.fish);
const POOL = {
  weapon: { list: weapons, dir: "weapon-icons" },
  armor: { list: armor, dir: "gear-icons" },
  accessory: { list: accessories, dir: "gear-icons" },
  fish: { list: fish, dir: "fish-icons" },
};
function resolve(e) {
  if (!e.id || !e.kind) return { ...e, name_ko: e.label || e.name_ko || "", icon: null };
  const p = POOL[e.kind];
  const it = p && p.list.find((x) => x.id === e.id);
  if (!it) { console.warn("  ! 미해결:", e.kind, e.id); return { ...e, name_ko: e.label || e.id, icon: null }; }
  return {
    id: e.id, kind: e.kind, note: e.note || "",
    name_ko: e.label || it.name_ko, name_en: it.name_en,
    icon: fs.existsSync(path.join(__dirname, "public", p.dir, e.id + ".webp")) ? `/${p.dir}/${e.id}.webp` : null,
  };
}

const BUILDS = [
  {
    id: "melee", emoji: "⚔️", title: "근접 (물리)", color: "#ff9a4d",
    summary: "한 방 한 방이 묵직한 근접 물리 딜러. 치명타와 회피를 함께 챙겨 생존하며 싸운다.",
    stats: ["근접 피해", "치명타 확률 / 피해", "근접 공격 속도", "회피(생존)"],
    weapons: [
      { id: "pandorium_axe", kind: "weapon", note: "최종 최고 데미지(도끼)" },
      { id: "atlantean_worm_sword", kind: "weapon", note: "고티어 검" },
      { id: "solarite_sword", kind: "weapon", note: "안정적 검" },
      { id: "galaxite_dagger", kind: "weapon", note: "치명타 특화" },
      { id: "prehistoric_crystal_spear", kind: "weapon", note: "리치 긴 창" },
    ],
    armor: [
      { id: "pandorium_helm", kind: "armor", label: "판도리움 세트", note: "최종 · 근접 피해 +80(세트)" },
      { id: "hydra_bone_helm", kind: "armor", label: "히드라 본 세트", note: "근접 적중 시 원거리 피해 +20%(전환형)" },
      { id: "moldweb_helm", kind: "armor", label: "몰드웹 세트", note: "곰팡이 감염 면역(중간)" },
      { id: "bronze_helm", kind: "armor", label: "청동 세트", note: "초반 균형형" },
    ],
    accessories: [
      { id: "bone_necklace", kind: "accessory", note: "근접 피해" },
      { id: "polished_golden_spike_ring", kind: "accessory", note: "근접 피해(연마)" },
      { id: "bone_ring", kind: "accessory", note: "근접 피해" },
      { id: "atlantean_worm_ring", kind: "accessory", note: "적중 시 생명 흡수(생존)" },
      { id: "sky_ring", kind: "accessory", note: "치명타 확률" },
      { id: "grub_egg_necklace", kind: "accessory", note: "초반 물리 피해" },
    ],
    food: [
      { id: "mold_shark", kind: "fish", label: "곰팡이 상어 요리", note: "근접 피해 +38.6%(최고) — 곰팡이 던전 낚시" },
      { id: "gray_dune_tail", kind: "fish", label: "그레이 듄 테일 요리", note: "근접 공격 속도 +13.9%" },
      { id: "elder_dragonfish", kind: "fish", label: "엘더 드래곤피시 요리", note: "치명타 확률 +14%" },
      { label: "레어 매운 오트밀", note: "황금 블로트 오트 + 황금 폭탄 고추 → 초당 17.4 회복 + 이속/근접(보스전)" },
    ],
    tips: [
      "황금 작물 1개 이상 넣어 요리하면 +25% 보장, 추가 황금 작물 시 +15% (엔드게임 필수)",
      "회피(dodge) 위주로 세팅하면 고난도 보스에서 생존력이 크게 오른다",
      "상황에 따라 히드라 본 세트로 근접↔원거리 전환 활용",
    ],
    sources: [
      { title: "BisectHosting — Melee Build", url: "https://www.bisecthosting.com/blog/core-keeper-melee-build-best-weapons-armor-accessory-tips-tricks" },
      { title: "Prima Games — Best Builds", url: "https://primagames.com/gaming/best-core-keeper-builds-ranged-melee-mining-and-more" },
      { title: "Cozy Checklist — Melee Damage Food", url: "https://cozychecklist.com/core-keeper/cooking/melee-damage-food/" },
    ],
  },
  {
    id: "ranged", emoji: "🏹", title: "원거리 (물리)", color: "#ffd24d",
    summary: "거리를 두고 점사하는 물리 원거리 딜러. 정지 시 치명타가 오르는 헌터 세트로 터렛처럼.",
    stats: ["원거리 피해", "치명타 확률 / 피해", "원거리 공격 속도", "회피(생존)"],
    weapons: [
      { id: "void_gun", kind: "weapon", note: "최고 티어(Lv17)" },
      { id: "solarite_crossbow", kind: "weapon", note: "고티어 석궁" },
      { id: "burnzooka", kind: "weapon", note: "광역/화염" },
      { id: "phantom_spark", kind: "weapon", note: "고티어" },
      { id: "octarine_bow", kind: "weapon", note: "중반 활" },
    ],
    armor: [
      { id: "hunter_hood", kind: "armor", label: "헌터 세트", note: "최고 · 정지 시 치명타 +15%, 원거리 피해↑" },
      { id: "caveling_hood", kind: "armor", label: "케이블링 세트", note: "회피 + 원거리 피해" },
      { id: "ranger_hood", kind: "armor", label: "레인저 세트", note: "초반 입문용" },
    ],
    accessories: [
      { id: "hydra_tooth", kind: "accessory", note: "원거리 피해 + 3배 피해 확률" },
      { id: "polished_gold_crystal_ring", kind: "accessory", note: "원거리 피해 + 공속(연마)" },
      { id: "mold_vein_necklace", kind: "accessory", note: "원거리 피해(+몰드링과 함께 곰팡이 면역)" },
      { id: "gold_crystal_ring", kind: "accessory", note: "초중반 원거리 피해" },
    ],
    food: [
      { id: "devil_worm", kind: "fish", label: "데빌 웜 요리", note: "원거리 피해 +22.8% — 산성 물 낚시" },
      { label: "구이 워크 피시볼", note: "데빌 웜 + 유충 고기 → 원거리 피해 + 치명타(5분)" },
      { label: "쥬시 선 커리", note: "원거리 피해 대폭(스태프 마법에도 적용)" },
      { id: "elder_dragonfish", kind: "fish", label: "엘더 드래곤피시 요리", note: "치명타 확률 +14%" },
    ],
    tips: [
      "헌터 세트는 '가만히 서서' 쏠 때 치명타 보너스 → 발판 잡고 점사",
      "Pheromoth 펫: 회피 + 원거리 피해 추가",
      "몰드 링 + 몰드 베인 목걸이 조합 시 곰팡이 감염 면역 보너스",
    ],
    sources: [
      { title: "BisectHosting — Ranged Build", url: "https://www.bisecthosting.com/blog/core-keeper-ranged-build-best-weapons-armor-accessories" },
      { title: "Prima Games — Best Builds", url: "https://primagames.com/gaming/best-core-keeper-builds-ranged-melee-mining-and-more" },
      { title: "Cozy Checklist — Ranged Damage Food", url: "https://cozychecklist.com/core-keeper/cooking/ranged-damage-food/" },
    ],
  },
  {
    id: "magic", emoji: "🔮", title: "마법 (원거리)", color: "#7db4ff",
    summary: "게임 최상위 DPS로 꼽히는 마법 빌더. 치명타로 마나를 회복하며 지팡이를 난사한다.",
    stats: ["마법 피해", "치명타 확률(마나 재생 연계)", "최대 마나 / 마나 재생", "마법 보호막"],
    weapons: [
      { id: "arcane_staff", kind: "weapon", note: "최고(말루가즈) · 마나 5로 난사" },
      { id: "scholars_staff", kind: "weapon", note: "2순위 지팡이" },
    ],
    armor: [
      { id: "apprentice_hat", kind: "armor", label: "견습 세트", note: "초반 마나 재생" },
      { id: "ninja_cowl", kind: "armor", label: "닌자 세트", note: "치명타↑ → 치명타 시 마나 재생(중반)" },
      { id: "corrupt_warden_mask", kind: "armor", label: "부패 감시자 세트", note: "후반 마법/마나" },
    ],
    accessories: [
      { id: "gold_crystal_necklace", kind: "accessory", note: "마법 피해" },
      { id: "soul_medallion", kind: "accessory", note: "치명타 확률 + 최대 미니언" },
      { id: "sky_ring", kind: "accessory", note: "치명타 확률(마나 재생용)" },
    ],
    food: [
      { label: "황금 선라이스 요리", note: "마법 피해 +43.3%(최고)" },
      { label: "마법+미니언 샌드위치", note: "마법 피해 + 마법 보호막 + 미니언 강화" },
      { id: "elder_dragonfish", kind: "fish", label: "엘더 드래곤피시 요리", note: "치명타 확률 +14% (마나 재생 연계)" },
    ],
    tips: [
      "아케인 스태프는 마나 소모 5로 빠르게 난사 + 치명타 보너스 → 치명타 시 마나 회복 탤런트와 시너지",
      "치명타 확률을 끌어올리면 마나가 마르지 않아 폭딜 유지",
      "화상 무효 음식으로 피해를 줄이며 딜에 집중",
    ],
    sources: [
      { title: "Steam — Mage build, wands/staves", url: "https://steamcommunity.com/app/1621690/discussions/0/4625853420295736564/" },
      { title: "Steam — Godly DPS (Mage/Summoner)", url: "https://steamcommunity.com/app/1621690/discussions/0/4764333047771390319/" },
      { title: "Core Keeper Wiki — Magic weapons", url: "https://core-keeper.fandom.com/wiki/Magic_weapons" },
    ],
  },
  {
    id: "summon", emoji: "💀", title: "소환 (미니언)", color: "#c98bff",
    summary: "미니언을 잔뜩 소환해 대신 싸우게 하는 빌드. 미니언 수·피해·마나 재생이 핵심.",
    stats: ["미니언 피해", "미니언 공격 속도", "최대 미니언 수", "마나 재생"],
    weapons: [
      { id: "tome_of_the_dead", kind: "weapon", note: "스켈레톤(근접 딜러)" },
      { id: "tome_of_the_dark", kind: "weapon", note: "박쥐(주변 공전 딜)" },
      { id: "tome_of_the_deep", kind: "weapon", note: "해파리(방어형)" },
    ],
    armor: [
      { id: "witch_doctor_hat", kind: "armor", label: "위치 닥터 세트", note: "Lv3 · 최대 미니언 +2(초반)" },
      { id: "chieftain_headdress", kind: "armor", label: "족장 세트", note: "최대 미니언 +1, 미니언 피해(중반)" },
      { id: "grim_hood", kind: "armor", label: "그림 세트", note: "최대 4미니언 + 피해/마나(후반)" },
    ],
    accessories: [
      { id: "puppet_ring", kind: "accessory", note: "최대 미니언 +1, 공속" },
      { id: "vicious_ring", kind: "accessory", note: "미니언 피해 대폭" },
      { id: "soul_medallion", kind: "accessory", note: "최대 미니언 + 치명타" },
    ],
    food: [
      { label: "마법+미니언 샌드위치", note: "미니언 피해/공속 + 마법 피해 + 마법 보호막" },
      { label: "황금 선라이스 요리", note: "마법 피해 +43.3%" },
    ],
    tips: [
      "세트 보너스로 최대 미니언 수를 늘리는 게 핵심(위치닥터→족장→그림)",
      "마나 재생을 챙겨 소환 유지, 본인은 도망치며 미니언으로 딜",
    ],
    sources: [
      { title: "BisectHosting — Summoner Build", url: "https://www.bisecthosting.com/blog/core-keeper-summoner-build-guide-best-armor-weapon-accessories" },
      { title: "Core Keeper Wiki — Summoning", url: "https://core-keeper.fandom.com/wiki/Summoning" },
    ],
  },
];

console.log("• 빌드", BUILDS.length, "종 정리, 아이템 연결…");
const out = BUILDS.map((b) => ({
  ...b,
  weapons: b.weapons.map(resolve),
  armor: b.armor.map(resolve),
  accessories: b.accessories.map(resolve),
  food: b.food.map(resolve),
}));
fs.writeFileSync(path.join(__dirname, "public", "data", "builds.json"), JSON.stringify(out, null, 2));
console.log("• public/data/builds.json 저장 ✅");
