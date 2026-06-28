// scrape-lib.mjs — 위키 데이터 모듈 스크래핑 공용 유틸 (Lua 파서 · fetch · curl 다운로드)
import fs from "fs";
import { execFileSync } from "child_process";

export const API = "https://core-keeper.fandom.com/api.php";
export const FILE = "https://core-keeper.fandom.com/wiki/Special:FilePath/";
export const UA = "ck-cooking-codex/1.0 (fan project; github qsef3546)";
// 짧은 UA 는 Cloudflare 챌린지에 걸리므로 이미지 다운로드엔 완전한 브라우저 UA 사용.
export const BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

// ── Lua 데이터 테이블 부분집합 파서 ──
export function parseLuaModule(src) {
  const c = { s: src.slice(src.indexOf("return") + 6), p: 0 };
  skipWs(c);
  return parseValue(c);
}
function skipWs(c) {
  for (;;) {
    while (c.p < c.s.length && /\s/.test(c.s[c.p])) c.p++;
    if (c.s[c.p] === "-" && c.s[c.p + 1] === "-") {
      if (c.s[c.p + 2] === "[" && c.s[c.p + 3] === "[") {
        const e = c.s.indexOf("]]", c.p + 4); c.p = e < 0 ? c.s.length : e + 2; continue;
      }
      const nl = c.s.indexOf("\n", c.p); c.p = nl < 0 ? c.s.length : nl + 1; continue;
    }
    break;
  }
}
function parseValue(c) {
  skipWs(c);
  const ch = c.s[c.p];
  if (ch === "{") return parseTable(c);
  if (ch === '"' || ch === "'") return parseString(c);
  if (/[A-Za-z_]/.test(ch)) {
    const m = /^[A-Za-z_][A-Za-z0-9_]*/.exec(c.s.slice(c.p)); c.p += m[0].length;
    if (m[0] === "true") return true;
    if (m[0] === "false") return false;
    if (m[0] === "nil") return null;
    return m[0];
  }
  const m = /^-?\d+(\.\d+)?([eE][+-]?\d+)?/.exec(c.s.slice(c.p));
  if (m) { c.p += m[0].length; return Number(m[0]); }
  throw new Error("parse error @" + c.p + ": " + JSON.stringify(c.s.slice(c.p, c.p + 30)));
}
function parseString(c) {
  const q = c.s[c.p++]; let out = "";
  while (c.p < c.s.length) {
    const ch = c.s[c.p++];
    if (ch === "\\") { out += c.s[c.p++]; continue; }
    if (ch === q) break;
    out += ch;
  }
  return out;
}
function parseTable(c) {
  c.p++; const map = {}; const list = []; let hasKey = false, hasArr = false;
  for (;;) {
    skipWs(c);
    if (c.s[c.p] === "}") { c.p++; break; }
    let key = null; const save = c.p;
    if (c.s[c.p] === "[") {
      c.p++; skipWs(c); const k = parseValue(c); skipWs(c);
      if (c.s[c.p] === "]") c.p++; skipWs(c);
      if (c.s[c.p] === "=") { c.p++; key = k; } else { c.p = save; }
    } else if (/[A-Za-z_]/.test(c.s[c.p])) {
      const m = /^[A-Za-z_][A-Za-z0-9_]*/.exec(c.s.slice(c.p));
      let q = c.p + m[0].length; while (/\s/.test(c.s[q])) q++;
      if (c.s[q] === "=" && c.s[q + 1] !== "=") { c.p = q + 1; key = m[0]; }
    }
    const v = parseValue(c);
    if (key !== null) { map[key] = v; hasKey = true; } else { list.push(v); hasArr = true; }
    skipWs(c);
    if (c.s[c.p] === "," || c.s[c.p] === ";") c.p++;
  }
  if (hasKey && !hasArr) return map;
  if (!hasKey && hasArr) return list;
  if (!hasKey && !hasArr) return {};
  list.forEach((v, i) => { map[i + 1] = v; });
  return map;
}

// ── 헬퍼 ──
export const arr = (v) => (Array.isArray(v) ? v : v && typeof v === "object" ? Object.values(v) : []);
export const slug = (n) => n.toLowerCase().replace(/['’.]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

export async function fetchJson(url) {
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  return r.json();
}
export async function getObjectInfo() {
  const j = await fetchJson(`${API}?action=parse&page=Module:ObjectInfo/data&prop=wikitext&format=json`);
  return parseLuaModule(j.parse.wikitext["*"]);
}
// 페이지 인포박스에서 실제 아이콘 파일명 해석
export async function resolveIconFile(page) {
  try {
    const j = await fetchJson(`${API}?action=parse&page=${encodeURIComponent(page)}&prop=text&format=json`);
    if (!j.parse) return null;
    const html = j.parse.text["*"];
    const aside = (html.match(/<aside[\s\S]*?<\/aside>/) || [html])[0];
    const m = aside.match(/data-image-name="([^"]+\.(?:png|webp|gif))"/i);
    return m ? m[1] : null;
  } catch { return null; }
}
export function curlDownload(fileName, dest) {
  try {
    execFileSync("curl", ["-s", "-L", "-A", BROWSER_UA, FILE + encodeURIComponent(fileName), "-o", dest], { stdio: "ignore" });
  } catch { return false; }
  if (!fs.existsSync(dest)) return false;
  const buf = fs.readFileSync(dest);
  const isImg = buf.length >= 70 && (buf.slice(0, 4).toString("ascii") === "RIFF" || (buf[0] === 0x89 && buf[1] === 0x50));
  if (!isImg) { fs.rmSync(dest); return false; }
  return true;
}
// 아이콘 다운로드(후보 파일명 × 재시도). manifest 에 id→경로 기록, 실패 id 배열 반환.
export async function downloadIcons(rows, iconDir, manifest) {
  fs.mkdirSync(iconDir, { recursive: true });
  const dirName = iconDir.split(/[\\/]/).pop();
  const miss = [];
  for (const w of rows) {
    const dest = `${iconDir}/${w.id}.webp`;
    let done = false;
    // 1) 흔한 규칙 "이름.png" 를 먼저 시도(curl만, API 호출 없음)
    if (curlDownload(w.name_en.replace(/ /g, "_") + ".png", dest)) {
      manifest[w.id] = `/${dirName}/${w.id}.webp`; done = true;
    }
    // 2) 실패 시 인포박스에서 실제 파일명 해석 후 재시도
    if (!done) {
      const resolved = await resolveIconFile(w.name_en);
      const candidates = [resolved, w.name_en.replace(/ /g, "_") + ".png"].filter(Boolean);
      for (let attempt = 0; attempt < 3 && !done; attempt++) {
        for (const c of candidates) {
          if (curlDownload(c, dest)) { manifest[w.id] = `/${dirName}/${w.id}.webp`; done = true; break; }
        }
        if (!done) await new Promise((r) => setTimeout(r, 600));
      }
    }
    if (!done) miss.push(w.name_en);
    await new Promise((r) => setTimeout(r, 120));
  }
  return miss;
}

export const RARITY_KEY = { Common: "common", Uncommon: "uncommon", Rare: "rare", Epic: "epic", Legendary: "legendary" };

// ── 재료명 한글 (무기·장비 레시피에 쓰이는 재료 전부) ──
export const KO_MATERIAL = {
  "Ancient Gemstone": "고대 보석", "Ancient Pickaxe": "고대 곡괭이", "Beach Block": "해변 블록",
  "Blackbug": "검은벌레", "Bomb": "폭탄", "Bomb Pepper": "폭탄 고추", "Broken Handle": "부러진 손잡이",
  "Brown Easter Egg": "갈색 부활절 달걀", "Caveling Skull": "케이블링 해골", "Channeling Gemstone": "전도의 보석",
  "Chipped Blade": "이 빠진 검신", "Clear Gemstone": "맑은 보석", "Coiled Branch": "휘감긴 나뭇가지",
  "Copper Bar": "구리 주괴", "Coral Wood": "산호 목재", "Coral Wood Plank": "산호 판자",
  "Corrupted Alloy": "오염된 합금", "Crude Bomb": "조잡한 폭탄", "Crystal Meteor Shard": "크리스탈 운석 파편",
  "Cytoplasm": "세포질", "Desert Ruby": "사막 루비", "Earthworm": "지렁이", "Energy String": "에너지 시위",
  "Fiber": "섬유", "Fractured Limbs": "부러진 활대", "Frozen Orb": "얼어붙은 구슬", "Galaxite Bar": "갤럭사이트 주괴",
  "Glass Piece": "유리 조각", "Gleam Wood": "빛나무 목재", "Gleam Wood Plank": "빛나무 판자",
  "Glow Tulip": "발광 튤립", "Glowing Lure": "발광 미끼", "Gold Bar": "금 주괴",
  "Gray Easter Egg": "회색 부활절 달걀", "Green Easter Egg": "초록 부활절 달걀", "Grumpkin": "그럼킨",
  "Heart Berry": "하트베리", "Iron Bar": "철 주괴", "Larva Meat": "유충 고기", "Larvlet": "라블렛",
  "Lucky Coin": "행운의 동전", "Magma Rod": "마그마 막대", "Magma Slime": "마그마 슬라임",
  "Mechanical Part": "기계 부품", "Mushroom": "버섯", "Obliteration Ray": "절멸 광선",
  "Octarine Bar": "옥타린 주괴", "Octarine Ore": "옥타린 광석",
  "Oracle Card \"Aura\"": "오라클 카드 '오라'", "Oracle Card \"Brilliance\"": "오라클 카드 '광휘'",
  "Oracle Card \"Endurance\"": "오라클 카드 '인내'", "Oracle Card \"Entity\"": "오라클 카드 '존재'",
  "Oracle Card \"Inspiration\"": "오라클 카드 '영감'", "Oracle Card \"Metropolis\"": "오라클 카드 '메트로폴리스'",
  "Oracle Card \"Radiance\"": "오라클 카드 '광채'", "Oracle Card \"Temperance\"": "오라클 카드 '절제'",
  "Oracle Card \"Wisdom\"": "오라클 카드 '지혜'", "Pandorium Bar": "판도리움 주괴", "Plank": "판자",
  "Poison Slime": "독 슬라임", "Purple Lure": "보라 미끼", "Relucite Bar": "렐루사이트 주괴",
  "Rose Easter Egg": "장미색 부활절 달걀", "S.A.H.A.B.A.R.'s Mortar Housing": "S.A.H.A.B.A.R.의 박격포 하우징",
  "Sanctified Firing Core": "축성된 격발 코어", "Scarlet Bar": "진홍 주괴", "Slime": "슬라임",
  "Slippery Slime": "미끌 슬라임", "Small Caveling Skull": "작은 케이블링 해골", "Snowball": "눈덩이",
  "Solarite Bar": "솔라라이트 주괴", "Spicy Lure": "매운 미끼", "Strolly Poly Plate": "스트롤리 폴리 등딱지",
  "Sweet Lure": "달콤한 미끼", "Tin Bar": "주석 주괴", "Void-Forged Barrel": "공허로 단조된 총열",
  "Wood": "목재", "Wool": "양털",
};
export const koMaterial = (en) => KO_MATERIAL[en] || en;

const nameFromOi = (oi, id) => (oi[id] && oi[id][0] && oi[id][0].name) || id;

export async function getObtaining() {
  const j = await fetchJson(`${API}?action=parse&page=Module:Obtaining/data&prop=wikitext&format=json`);
  return parseLuaModule(j.parse.wikitext["*"]);
}

// 재료의 주요 출처: { type: "제작"|"드롭"|"구매"|"", detail: "..." }
// 정확도: 제작(주괴 등)·몬스터 드롭은 신뢰. 광석류의 채광 출처는 데이터에 없어 area/드롭으로 대체.
export function materialSource(mid, oi, ob) {
  const b = oi[mid] && oi[mid][0];
  const e = ob[mid] && ob[mid][0];
  // 드롭이 있으면 우선(원시 재료의 주 출처는 몬스터 드롭). 주괴 등 가공품은 drop 이 없어 제작으로.
  if (e && e.drop) {
    const names = [];
    for (const d of arr(e.drop)) {
      const nm = d.entity ? nameFromOi(oi, d.entity.id) : null;
      if (nm && !names.includes(nm)) names.push(nm);
      if (names.length >= 3) break;
    }
    if (names.length) return { type: "드롭", detail: "드롭: " + names.join(", ") };
  }
  if (b && arr(b.materials).length) return { type: "제작", detail: "제작 (하위 재료 가공)" };
  if (e && e.vendor) return { type: "구매", detail: "상점 구매" };
  if (b && b.area) return { type: "", detail: b.area };
  return { type: "", detail: "" };
}

// 아이템 자체의 드롭 출처(숫자 id 기준). 제작 불가 아이템의 획득처 표시용.
export function itemDrops(numericId, ob, oi) {
  const e = ob[numericId] && ob[numericId][0];
  if (!e) return [];
  const out = [];
  const seen = new Set();
  for (const d of arr(e.drop)) {
    const nm = d.entity ? nameFromOi(oi, d.entity.id) : null;
    if (nm && !seen.has(nm)) { seen.add(nm); out.push(nm); }
    if (out.length >= 4) break;
  }
  if (e.vendor && !out.length) out.push("상점 구매");
  return out;
}

// ── 효과(condition id) → [한글 라벨, 단위] : 장비 장착효과 · 음식 효과 공용 ──
export const COND = {
  HungerAddition: ["포만감", ""],
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
  // 펫 전용
  MovementSpeed: ["이동 속도", "%"], PiercingProjectiles: ["관통 투사체", ""],
  ChanceOnHitToApplySlipperyMovement: ["적중 시 미끄러짐 부여 확률", "%"],
  ChanceToGainManaOnAttack: ["공격 시 마나 획득 확률", "%"],
  PetChanceToGainManaOnAttack: ["펫 공격 시 마나 획득", "%"],
  ReducedManaRegenDelayPercentage: ["마나 재생 지연 감소", "%"],
  ApplySlowedBySlime: ["슬라임 둔화 부여", ""],
};
export function humanizeId(id) {
  return id.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");
}
export function condLabel(id) {
  if (COND[id]) return COND[id];
  return [humanizeId(id), /Percentage|Chance/.test(id) ? "%" : ""];
}
