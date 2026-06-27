// scrape-gear.mjs
// 위키 중앙 데이터에서 방어구·장신구·도구(아이템)를 추출해
// public/data/{armor,accessories,tools}.json + public/gear-icons/ 로 적재한다.
// 실행:  node scrape-gear.mjs
// 데이터/이미지 저작권: © Pugstorm / Fireshine Games (비상업적 팬 이용). README 참고.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getObjectInfo, arr, slug, downloadIcons, RARITY_KEY } from "./scrape-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── 카테고리 정의 (type → 한글 하위분류) ──
const CATEGORIES = {
  armor: {
    file: "armor.json",
    types: { Helm: "투구", BreastArmor: "상의", PantsArmor: "하의" },
  },
  accessories: {
    file: "accessories.json",
    types: { Ring: "반지", Necklace: "목걸이", Offhand: "오프핸드" },
  },
  tools: {
    file: "tools.json",
    types: {
      MiningPick: "곡괭이", Shovel: "삽", Hoe: "괭이", FishingRod: "낚싯대",
      Sledge: "슬레지해머", WaterCan: "물뿌리개", Seeder: "파종기", DrillTool: "드릴",
      RoofingTool: "지붕 도구", BugNet: "곤충망", Lantern: "랜턴", Bag: "가방", Pouch: "주머니",
    },
  },
};

// ── 지역(area) → 한글 ──
const KO_AREA = {
  StartArea: "시작 지역(흙 비옴)", Slime: "흙 비옴(슬라임 지대)", Clay: "점토 동굴",
  Stone: "잊혀진 유적(돌 지대)", Nature: "아제오스의 황야", Sea: "가라앉은 바다",
  Desert: "시초의 사막", Mold: "곰팡이 던전", Lava: "용암 지대", Crystal: "반짝이는 변경",
  LarvaHive: "유충 둥지", Larva: "유충 둥지", Excavation: "발굴 현장", Passage: "통로", City: "고대 도시",
};

// ── 장착 효과(condition id) → [한글 라벨, 단위] ──
const COND = {
  ArmorIncrease: ["방어력", ""], ArmorPercentageIncrease: ["방어력", "%"],
  IncreasedMaxHealth: ["최대 체력", ""], IncreasedMaxHealthPercentage: ["최대 체력", "%"],
  IncreasedMaxMana: ["최대 마나", ""], IncreasedManaRegen: ["마나 재생", ""],
  HealOverTime: ["지속 회복", ""], HealOverTimePercentage: ["지속 회복", "%"],
  IncreasedHealthRegenEffectiveness: ["회복 효과", "%"], LifeOnHit: ["적중 시 생명 흡수", ""],
  MovementSpeedIncrease: ["이동 속도", "%"], MovementSpeedDecrease: ["이동 속도 감소", "%"],
  MovementSpeedBoostAfterDodge: ["회피 후 이동 속도", "%"],
  CritChance: ["치명타 확률", "%"], CriticalDamagePercentageIncrease: ["치명타 피해", "%"],
  CriticalDamagePercentageIncreaseFromRange: ["원거리 치명타 피해", "%"], CriticalHitChanceFromShot: ["사격 치명타 확률", "%"],
  DodgeChance: ["회피 확률", "%"],
  PhysicalMeleeDamageIncrease: ["근접 피해", "%"], PhysicalRangeDamageIncrease: ["원거리 피해", "%"],
  RangeDamageIncrease: ["원거리 피해", "%"], IncreasedMagicDamagePercentage: ["마법 피해", "%"],
  AllDamageIncrease: ["전체 피해", "%"], AllDamageDecrease: ["전체 피해 감소", "%"],
  MeleeAttackSpeedIncrease: ["근접 공격 속도", "%"], RangeAttackSpeedIncrease: ["원거리 공격 속도", "%"],
  AttackSpeed: ["공격 속도", "%"], ThornsDamage: ["가시 피해", ""],
  MagicBarrier: ["마법 보호막", ""], ManaBarrier: ["마나 보호막", ""],
  IncreasedDamageAgainstBosses: ["보스 추가 피해", "%"], ReducedDamageFromBosses: ["보스 피해 감소", "%"],
  ReducedDamageFromExplosions: ["폭발 피해 감소", "%"], IncreasedDamageTakenPercentage: ["받는 피해 증가", "%"],
  MiningIncrease: ["채광 피해", ""], MiningPercentageIncrease: ["채광 피해", "%"], MiningSpeedIncrease: ["채광 속도", "%"],
  DiggingIncrease: ["굴착", ""], IncreasedFishing: ["낚시", ""], FishBitesFaster: ["입질 속도", "%"],
  ChanceToGetDoubleFish: ["물고기 2배 확률", "%"], IncreasedChanceForHigherRarityFish: ["고급 물고기 확률", "%"],
  IncreasedChanceToGetFish: ["물고기 획득 확률", "%"], IncreasedChanceToGetFishLoot: ["낚시 전리품 확률", "%"],
  ChanceToPreserveBait: ["미끼 보존 확률", "%"],
  BlueGlow: ["푸른 발광", ""], GreenGlow: ["초록 발광", ""], OrangeGlow: ["주황 발광", ""],
  DrainLessHunger: ["허기 소모 감소", "%"], GainMoreFoodFromPlants: ["식물 식량 증가", "%"],
  ExtraHarvestChance: ["추가 수확 확률", "%"], ExtraHealFromSleepPercentage: ["수면 회복 증가", "%"],
  IncreasedPickUpRadius: ["획득 반경", "%"], VisibleOreDistanceIncrease: ["광석 표시 거리", ""],
  ChanceForAdditionalOre: ["추가 광석 확률", "%"], ChanceForOreOnMiningWall: ["벽 채광 광석 확률", "%"],
  ImmuneToPoison: ["독 면역", ""], ImmuneToOil: ["기름 면역", ""], ChanceToApplyPoisoned: ["독 적용 확률", "%"],
  ApplyBurning: ["화상 적용", ""], ChanceOnHitToKnockback: ["적중 시 넉백 확률", "%"],
  ChanceOnMeleeHitToStun: ["근접 적중 시 기절 확률", "%"], CheatDeath: ["죽음 회피", ""],
  GainArmorAtLowHealth: ["저체력 시 방어력", ""], GainHealthRegenWhileBelowHalfHealth: ["절반 체력 이하 회복", ""],
  DamageIncreaseAgainstBurning: ["화상 대상 추가 피해", "%"], DamageIncreaseAgainstPoisoned: ["중독 대상 추가 피해", "%"],
  CritDamageIncreaseAgainstBurning: ["화상 대상 치명타 피해", "%"],
  IncreasedMaxMinions: ["최대 소환수", ""], IncreasedMinionDamagePercentage: ["소환수 피해", "%"],
  IncreasedMinionAttackSpeed: ["소환수 공격 속도", "%"], IncreasedMinionCritChance: ["소환수 치명타 확률", "%"],
  IncreasedMinionLifespanPercentage: ["소환수 지속시간", "%"],
  ApplyPetDamageIncrease: ["펫 피해", "%"], ApplyPetAttackSpeedIncrease: ["펫 공격 속도", "%"],
  ApplyPetCritChanceIncrease: ["펫 치명타 확률", "%"], ApplyPetCritDamageIncrease: ["펫 치명타 피해", "%"],
  ApplyPetBuffsIncrease: ["펫 버프 효과", "%"],
  EquipmentDurabilityLastsLonger: ["장비 내구도 지속", "%"], IncreasedExplosivesDamage: ["폭발물 피해", "%"],
  IncreasedExplosivesRadiusPercentage: ["폭발 반경", "%"], ReducedImpactOfSlowedBySlime: ["슬라임 둔화 감소", "%"],
  IncreasedBoatSpeed: ["보트 속도", "%"], PercentageOfMagicBarrierAsMagicDamage: ["마법보호막→마법피해 전환", "%"],
  GainManaFromExplosion: ["폭발 시 마나 획득", ""], ChanceToDealTripleDamage: ["3배 피해 확률", "%"],
  AuraApplyDamageIncrease: ["오라: 피해 증가", "%"], AuraApplyHealingOverTime: ["오라: 지속 회복", ""],
  AuraApplyMovementSpeedDecrease: ["오라: 이동 속도 감소", "%"],
};
function humanize(id) {
  return id.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");
}
function condLabel(id) {
  if (COND[id]) return COND[id];
  return [humanize(id), /Percentage|Chance/.test(id) ? "%" : ""];
}

// ── 재료명 한글 ──
const KO_MATERIAL = {
  "Copper Bar": "구리 주괴", "Tin Bar": "주석 주괴", "Iron Bar": "철 주괴", "Gold Bar": "금 주괴",
  "Scarlet Bar": "진홍 주괴", "Octarine Bar": "옥타린 주괴", "Galaxite Bar": "갤럭사이트 주괴",
  "Solarite Bar": "솔라라이트 주괴", "Pandorium Bar": "판도리움 주괴", "Relucite Bar": "렐루사이트 주괴",
  "Wood": "목재", "Fiber": "섬유", "Slime": "슬라임", "Poison Slime": "독 슬라임",
  "Magma Slime": "마그마 슬라임", "Slippery Slime": "미끌 슬라임", "Larva Meat": "유충 고기",
  "Ancient Gemstone": "고대 보석", "Coral Wood": "산호 목재", "Gleam Wood": "빛나무 목재",
  "Corrupted Alloy": "오염된 합금", "Cytoplasm": "세포질", "Leather": "가죽", "Cloth": "천",
  "Glass": "유리", "Plank": "판자", "Iron Ore": "철광석", "Copper Ore": "구리 광석",
  "Tin Ore": "주석 광석", "Gold Ore": "금광석", "Scarlet Ore": "진홍 광석",
};
const koMaterial = (en) => KO_MATERIAL[en] || en;

// ── 아이템명 토큰 번역 (전부 매핑되면 한글, 아니면 영문 폴백) ──
const TOKEN = {
  copper: "구리", tin: "주석", iron: "철", gold: "금", wood: "나무", wooden: "나무",
  scarlet: "진홍", octarine: "옥타린", galaxite: "갤럭사이트", solarite: "솔라라이트",
  pandorium: "판도리움", relucite: "렐루사이트", ancient: "고대", crystal: "크리스탈",
  lava: "용암", slime: "슬라임", larva: "유충", coral: "산호", gleam: "빛나무",
  corrupted: "오염된", royal: "왕실", great: "거대한", large: "큰", small: "작은",
  broken: "부러진", rusty: "녹슨", makeshift: "임시", reinforced: "강화된", basic: "기본",
  helm: "투구", helmet: "투구", cap: "모자", hood: "후드", mask: "가면", goggles: "고글",
  hat: "모자", crown: "왕관", chestplate: "흉갑", armor: "갑옷", coat: "코트", robe: "로브",
  vest: "조끼", shirt: "셔츠", chest: "흉갑", pants: "바지", leggings: "각반", greaves: "각반",
  ring: "반지", necklace: "목걸이", amulet: "부적", pendant: "펜던트", charm: "부적",
  shield: "방패", pickaxe: "곡괭이", pick: "곡괭이", shovel: "삽", spade: "삽", hoe: "괭이",
  rod: "낚싯대", "fishing": "낚시", lantern: "랜턴", torch: "횃불", bag: "가방", pouch: "주머니",
  net: "망", bug: "곤충", sledge: "슬레지", drill: "드릴", watering: "물뿌리개", can: "통",
  seeder: "파종기", roofing: "지붕", of: "의", the: "",
};
function koName(en) {
  const toks = en.split(/\s+/);
  const out = [];
  for (const t of toks) {
    const k = t.toLowerCase().replace(/[^a-z]/g, "");
    if (TOKEN[k] === undefined) return en; // 미매핑 토큰 → 영문 폴백
    if (TOKEN[k]) out.push(TOKEN[k]);
  }
  return out.join(" ") || en;
}

// ── 추출 ──
const data = await getObjectInfo();
console.log(`• ObjectInfo 로드 (${Object.keys(data).length} objects)`);

function valAt(v, lvl) {
  if (v == null) return null;
  if (typeof v === "number") return v;
  if (typeof v === "object") {
    if (v[lvl] != null) return v[lvl];
    const ks = Object.keys(v).map(Number).filter((n) => !isNaN(n)).sort((a, b) => a - b);
    return ks.length ? v[ks[0]] : null;
  }
  return null;
}
function valMax(v) {
  if (v == null || typeof v !== "object") return null;
  const ks = Object.keys(v).map(Number).filter((n) => !isNaN(n)).sort((a, b) => a - b);
  return ks.length ? v[ks[ks.length - 1]] : null;
}

function extract(types) {
  const rows = [];
  for (const k of Object.keys(data)) {
    const b = data[k] && data[k][0];
    if (!b || !types[b.type]) continue;
    const lvl = b.level ?? null;
    // 장착 효과
    const conds = [];
    const eq = b.equipped || {};
    for (const c of arr(eq.conditions)) {
      const [label, unit] = condLabel(c.id);
      const base = valAt(c.value, lvl);
      const max = valMax(c.value);
      conds.push({ id: c.id, label, unit, base, max });
    }
    if (eq.offHand && eq.offHand.mechanic === "Shield" && eq.offHand.value != null) {
      conds.unshift({ id: "Shield", label: "막기", unit: "%", base: Math.round(eq.offHand.value * 100), max: Math.round(eq.offHand.value * 100) });
    }
    const materials = arr(b.materials).map((m) => {
      const nm = (data[m.id] && data[m.id][0] && data[m.id][0].name) || m.id;
      const a = m.amount;
      return { id: m.id, name_en: nm, name_ko: koMaterial(nm), amount: typeof a === "object" ? null : a, amount_min: typeof a === "object" ? a[0] : a, amount_max: typeof a === "object" ? a[1] : a };
    });
    rows.push({
      id: slug(b.name),
      name_en: b.name,
      name_ko: koName(b.name),
      desc_en: b.description || "",
      subtype: b.type,
      subtype_ko: types[b.type],
      rarity: RARITY_KEY[b.rarity] || "common",
      level: lvl,
      area: b.area || null,
      area_ko: b.area ? KO_AREA[b.area] || b.area : null,
      sell: b.sell ?? null,
      durability: b.durability ?? null,
      dmg_base: b.meleeDamage ? valAt(b.meleeDamage, lvl) : null,
      conditions: conds,
      materials,
    });
  }
  // 같은 슬러그 중복 제거(변형) + 레벨/이름 정렬
  const seen = new Set();
  const uniq = rows.filter((r) => (seen.has(r.id) ? false : seen.add(r.id)));
  uniq.sort((a, b) => (a.level ?? 0) - (b.level ?? 0) || a.name_en.localeCompare(b.name_en));
  return uniq;
}

const dataDir = path.join(__dirname, "public", "data");
fs.mkdirSync(dataDir, { recursive: true });
const iconDir = path.join(__dirname, "public", "gear-icons");
const manifest = {};
const allMiss = [];

for (const [cat, cfg] of Object.entries(CATEGORIES)) {
  const rows = extract(cfg.types);
  fs.writeFileSync(path.join(dataDir, cfg.file), JSON.stringify(rows, null, 2));
  console.log(`• ${cat}: ${rows.length}종 → public/data/${cfg.file}`);
}

// 아이콘은 세 카테고리 합쳐 한 번에 (gear-icons + 단일 manifest)
const everything = [];
for (const cfg of Object.values(CATEGORIES)) {
  everything.push(...JSON.parse(fs.readFileSync(path.join(dataDir, cfg.file), "utf8")));
}
console.log(`• 아이콘 다운로드 시작 (${everything.length}종)…`);
const miss = await downloadIcons(everything, iconDir, manifest);
fs.writeFileSync(path.join(iconDir, "manifest.json"), JSON.stringify(manifest));
console.log(`• 아이콘 ${Object.keys(manifest).length}/${everything.length}, manifest 저장`);
if (miss.length) console.log(`  아이콘 없음(${miss.length}): ${miss.slice(0, 20).join(", ")}${miss.length > 20 ? " …" : ""}`);
console.log("완료 ✅");
