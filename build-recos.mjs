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
    summary: "최종 드릴 스톰브링어로 굴착하듯 몰아치는 종결 근접 빌드. 채굴 피해와 치명타를 끌어올려 단일 보스를 빠르게 녹인다.",
    stats: ["채굴 피해", "치명타 확률 / 피해", "회피(생존)", "근접 피해"],
    weapons: [
      { id: "stormbringer", kind: "weapon", label: "스톰브링어", note: "최종 드릴 · 마지막 지역 '통로' 제작대에서 하위 드릴(소멸광선 등)을 재료로 제작" },
      { id: "obliteration_ray", kind: "weapon", label: "소멸광선", note: "스톰브링어 재료가 되는 하위 드릴 · 외계인 방어 아레나 클리어 또는 후반 보스에서 획득" },
    ],
    armor: [
      { id: "atlantean_worm_helmet", kind: "armor", label: "초거대 벌레 투구", note: "거대한 벌레(침몰한 바다 보스) 드롭 · 이동형이라 처치마다 탐지기 재사용" },
      { id: "core_commander_brigandine", kind: "armor", label: "코어 지휘관 상의", note: "코어 지휘관(시작의 사막 권역) 드롭 · 소환 우상으로 재전투 반복 파밍" },
      { id: "core_commander_greaves", kind: "armor", label: "코어 지휘관 하의", note: "코어 지휘관 드롭 · 상의와 세트" },
      { id: "ninja_garments", kind: "armor", label: "닌자 상의", note: "(+α) 잠긴 태양석 상자 · 치확·치피·회피 + 방어력" },
      { id: "ninja_leggings", kind: "armor", label: "닌자 하의", note: "(+α) 닌자 세트 · 잠긴 태양석 상자" },
    ],
    accessories: [
      { id: "ancient_gem_necklace", kind: "accessory", label: "고대 보석 목걸이", note: "블록 채굴 귀중품 드롭(반지와 세트) · 드롭률 극악" },
      { id: "ancient_gem_ring", kind: "accessory", label: "고대 보석 반지", note: "목걸이와 세트 · 채굴 마지막 특성 + 바주카로 집 주변 블록 대량 채굴 추천" },
      { id: "topaz_ring", kind: "accessory", label: "황옥 반지", note: "잠긴 팔색석 상자 · 채굴 피해 +39%(스톰 전용)" },
      { id: "glass_bead_necklace", kind: "accessory", label: "유리구슬 목걸이", note: "(+α) 아레나 상자 보상 · 치확 60%+ 확보 시 최고점 딜이 가장 높음" },
      { id: "mold_ring", kind: "accessory", label: "곰팡이 반지", note: "(+α) 곰팡이 지역 상자·구조물·몹 · 치확 +15%" },
      { id: "rusted_necklace", kind: "accessory", label: "녹슨 목걸이", note: "(+α) 잠긴 팔색석 상자·필드 몹 · 채굴 피해 +35%" },
      { id: "copper_cross_necklace", kind: "accessory", label: "구리 십자가 목걸이", note: "(+α) 장신구 제작대 제작 · 치확 +17%" },
    ],
    food: [
      { id: "mold_shark", kind: "fish", label: "곰팡이 상어 요리", note: "근접 피해 +38.6%(최고) — 곰팡이 던전 낚시" },
      { id: "gray_dune_tail", kind: "fish", label: "그레이 듄 테일 요리", note: "근접 공격 속도 +13.9%" },
      { id: "elder_dragonfish", kind: "fish", label: "엘더 드래곤피시 요리", note: "치명타 확률 +14%" },
    ],
    tips: [
      "스톰브링어는 통로 제작대에서 하위 드릴(소멸광선 등)을 올려 제작 — 고유 재료는 따로 없다",
      "거대한 벌레는 이동형 보스라 잡을 때마다 탐지기를 다시 써야 한다",
      "코어 지휘관은 소환 우상으로 재전투가 가능해 상의·하의를 반복 파밍할 수 있다",
      "고대 보석 목/반지는 드롭률이 악랄(저레벨 귀중품 0.4% × 그중 5.26%) — 채굴 마지막 특성을 찍고 바주카로 집 주변 블록을 대량으로 밀면 귀중품이 쏟아진다",
      "치확 60% 이상이 확보되면 유리구슬 목걸이의 최고점 딜이 가장 높다",
    ],
    sources: [
      { title: "나무위키 — 코어 키퍼", url: "https://namu.wiki/w/%EC%BD%94%EC%96%B4%20%ED%82%A4%ED%8D%BC" },
      { title: "Steam Community — Core Keeper 가이드/토론", url: "https://steamcommunity.com/app/1621690/guides/" },
      { title: "DC Inside — 코어키퍼 갤러리", url: "https://gall.dcinside.com/mgallery/board/lists/?id=corekeeper" },
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
