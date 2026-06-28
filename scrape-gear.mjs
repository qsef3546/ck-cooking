// scrape-gear.mjs
// 위키 중앙 데이터에서 방어구·장신구·도구(아이템)를 추출해
// public/data/{armor,accessories,tools}.json + public/gear-icons/ 로 적재한다.
// 실행:  node scrape-gear.mjs
// 데이터/이미지 저작권: © Pugstorm / Fireshine Games (비상업적 팬 이용). README 참고.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getObjectInfo, getObtaining, arr, slug, downloadIcons, RARITY_KEY, koMaterial, materialSource, itemDrops, condLabel } from "./scrape-lib.mjs";

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

// 효과(condition) 한글 라벨 매핑은 scrape-lib.mjs 의 공용 condLabel 사용.

// ── 아이템명 토큰 번역 (전부 매핑되면 한글, 아니면 영문 폴백) ──
const TOKEN = {
  // 재질/등급
  copper: "구리", tin: "주석", iron: "철", gold: "금", golden: "황금", wood: "나무", wooden: "나무",
  scarlet: "진홍", octarine: "옥타린", galaxite: "갤럭사이트", solarite: "솔라라이트",
  pandorium: "판도리움", relucite: "렐루사이트", ancient: "고대", crystal: "크리스탈", stone: "돌",
  lava: "용암", slime: "슬라임", larva: "유충", coral: "산호", gleam: "빛나무", bone: "뼈",
  corrupted: "오염된", corrupt: "부패", royal: "왕실", great: "거대한", large: "대형", medium: "중형", small: "소형",
  broken: "부러진", rusty: "녹슨", makeshift: "임시", reinforced: "강화된", basic: "기본",
  polished: "광택", swift: "신속한", soul: "영혼", bronze: "청동",
  chunk: "덩어리", shell: "껍데기", core: "코어", king: "왕", ore: "광석", block: "블록", party: "파티",
  hydra: "히드라", guardian: "수호자", warden: "감시자", wildwarden: "와일드와든", scarab: "스카라베",
  ivy: "아이비", omoroth: "오모로스", caveling: "케이블링", skull: "해골", godsent: "신이 보낸",
  soaring: "비상", blast: "폭발", cosmos: "코스모스", lily: "릴리", pad: "패드", moldweb: "곰팡이거미줄",
  hivebone: "벌집뼈", gingerbread: "진저브레드",
  // 색
  blue: "파랑", green: "초록", red: "빨강", purple: "보라", yellow: "노랑", black: "검정",
  white: "흰", pink: "분홍", orange: "주황", dark: "어둠", light: "빛",
  // 직업/컨셉 세트
  explorer: "탐험가", apprentice: "견습", ranger: "레인저", witch: "마녀", doctor: "박사",
  chieftain: "족장", mercenary: "용병", paladin: "팔라딘", sorcerer: "소서러", miner: "광부",
  dreamer: "몽상가", pajama: "파자마", chef: "요리사", chicken: "치킨", paragon: "귀감",
  // 부위 보조
  head: "머리", bottom: "하의", torso: "상체", breast: "상의", headband: "머리띠",
  harness: "하네스", tassel: "술", board: "보드",
  // 슬롯/형태
  helm: "투구", helmet: "투구", cap: "모자", hood: "후드", mask: "가면", goggles: "고글",
  hat: "모자", crown: "왕관", chestplate: "흉갑", breastplate: "흉갑", armor: "갑옷", coat: "코트",
  robe: "로브", vest: "조끼", shirt: "셔츠", chest: "흉갑", tunic: "튜닉", jacket: "재킷", cloak: "망토",
  suit: "슈트", bikini: "비키니", top: "상의", pants: "바지", leggings: "각반", greaves: "각반",
  shorts: "반바지", ring: "반지", necklace: "목걸이", amulet: "부적", pendant: "펜던트", charm: "부적",
  shield: "방패", pickaxe: "곡괭이", pick: "곡괭이", shovel: "삽", spade: "삽", hoe: "괭이",
  rod: "낚싯대", fishing: "낚시", lantern: "랜턴", torch: "횃불", bag: "가방", backpack: "배낭",
  pouch: "주머니", net: "망", bug: "곤충", sledge: "슬레지", hammer: "해머", drill: "드릴",
  watering: "물뿌리개", can: "통", seeder: "파종기", roofing: "지붕", lure: "미끼", pot: "냄비",
  of: "의", the: "",
};
function koName(en) {
  const toks = en.split(/\s+/);
  const out = [];
  for (const t of toks) {
    // 소유격(Omoroth's) 처리: 's 제거 후 매핑, 미매핑이면 폴백
    const base = t.replace(/['’]s$/i, "");
    const k = base.toLowerCase().replace(/[^a-z]/g, "");
    if (TOKEN[k] === undefined) return en; // 미매핑 토큰 → 영문 폴백
    if (TOKEN[k]) out.push(TOKEN[k] + (/['’]s$/i.test(t) ? "의" : ""));
  }
  return out.join(" ") || en;
}

// ── 추출 ──
const data = await getObjectInfo();
console.log(`• ObjectInfo 로드 (${Object.keys(data).length} objects)`);
const ob = await getObtaining();
console.log(`• Obtaining 로드 (${Object.keys(ob).length} entries)`);

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
      const src = materialSource(m.id, data, ob);
      return { id: m.id, name_en: nm, name_ko: koMaterial(nm), amount: typeof a === "object" ? null : a, amount_min: typeof a === "object" ? a[0] : a, amount_max: typeof a === "object" ? a[1] : a, src_type: src.type, src_detail: src.detail };
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
      drops: itemDrops(b.id, ob, data),
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
// SKIP_ICONS=1 이면 데이터만 갱신(이미 받은 아이콘 재사용).
if (process.env.SKIP_ICONS) {
  console.log("• SKIP_ICONS=1 → 아이콘 다운로드 건너뜀 (데이터만 갱신)");
  console.log("완료 ✅");
  process.exit(0);
}
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
