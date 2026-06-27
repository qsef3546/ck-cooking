// scrape-weapons.mjs
// Core Keeper 위키의 중앙 데이터 모듈(Module:ObjectInfo/data)에서 "무기"(근접/원거리/마법,
// Equipment 카테고리) 80여 종을 추출해 public/data/weapons.json 으로 적재하고,
// 각 무기의 아이콘 스프라이트를 public/weapon-icons/ 로 내려받는다.
//
// 실행:  node scrape-weapons.mjs
// 데이터/이미지 저작권: © Pugstorm / Fireshine Games (비상업적 팬 이용). 자세한 내용 README 참고.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";
import { getObtaining, materialSource, itemDrops, koMaterial } from "./scrape-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UA = "ck-cooking-codex/1.0 (fan project; contact via github qsef3546)";
const API = "https://core-keeper.fandom.com/api.php";
const FILE = "https://core-keeper.fandom.com/wiki/Special:FilePath/";

// ───────────────────────── Lua 데이터 테이블 파서 ─────────────────────────
// 위키 데이터 모듈이 쓰는 Lua 테이블 리터럴 부분집합 파서.
function parseLuaModule(src) {
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

// ───────────────────────── 한글 번역 사전 ─────────────────────────
// 위키는 영문만 제공. 아래는 자연스러운 한국어 번역(공식 로컬라이즈와 다를 수 있음).
const KO_WEAPON = {
  "Wooden Sword": "나무 검", "Copper Sword": "구리 검", "Simple Staff": "단순한 지팡이",
  "Splintered Wooden Sword": "쪼개진 나무 검", "Tome of the Dark": "어둠의 마도서",
  "Wood Bow": "나무 활", "Wood Crossbow": "나무 석궁", "Rusty Dagger": "녹슨 단검",
  "Sticky Stick": "끈적이는 막대기", "Flintlock Musket": "플린트락 머스킷",
  "Hunting Spear": "사냥용 창", "Slingshot": "새총", "Tin Axe": "주석 도끼",
  "Tin Dagger": "주석 단검", "Tin Sword": "주석 검", "Tome of Breach": "균열의 마도서",
  "Slime Sword": "슬라임 검", "Battle Axe": "전투 도끼", "Iron Bow": "철 활",
  "Iron Halberd": "철 미늘창", "Iron Sword": "철 검", "Quill Rifle": "가시 라이플",
  "Stone Mortar": "돌 박격포", "Tome of Ashes": "잿더미의 마도서", "Arcane Staff": "비전 지팡이",
  "Fireball Staff": "화염구 지팡이", "Larva Spike Club": "유충 가시 곤봉", "Pipe Club": "파이프 곤봉",
  "Scrapzooka": "고철 바주카", "Grubzooka": "굼벵이 바주카", "Ritual Dagger": "의식용 단검",
  "Scarlet Crossbow": "진홍 석궁", "Scarlet Dagger": "진홍 단검", "Scarlet Sword": "진홍 검",
  "Blowpipe": "바람총", "Broken Handle": "부러진 손잡이", "Tome of Sprouts": "새싹의 마도서",
  "Tome of the Dead": "망자의 마도서", "Noxious Meteor Staff": "유독성 메테오 지팡이",
  "Tentacle Whip": "촉수 채찍", "Bubble Gun": "거품 총", "Octarine Axe": "옥타린 도끼",
  "Octarine Bow": "옥타린 활", "Octarine Sword": "옥타린 검", "Poisonous Sickle": "맹독 낫",
  "Tome of the Deep": "심연의 마도서", "Anchor Axe": "닻 도끼", "Rune Song": "룬의 노래",
  "Scholar's Staff": "학자의 지팡이", "Slippery Slime Sword": "미끌 슬라임 검",
  "Sun Caller": "태양 소환자", "Bomb Scarab Mortar": "폭탄 풍뎅이 박격포",
  "Galaxite Chakram": "갤럭사이트 차크람", "Galaxite Dagger": "갤럭사이트 단검",
  "Galaxite Sword": "갤럭사이트 검", "Throwing Daggers": "투척 단검",
  "Zealot's Scimitar": "광신도의 시미터", "Lava Battle Axe": "용암 전투 도끼",
  "Phantom Spark": "팬텀 스파크", "Prehistoric Crystal Spear": "선사시대 크리스탈 창",
  "Burnzooka": "화염 바주카", "Crystal Shard Club": "크리스탈 파편 곤봉",
  "Hydra Bone Sword": "히드라 뼈 검", "Ricochet Shuriken": "도탄 수리검",
  "Solarite Crossbow": "솔라라이트 석궁", "Solarite Sword": "솔라라이트 검",
  "Volcano Mortar": "화산 박격포", "Atlantean Worm Sword": "아틀란티스 웜 검",
  "Chaos Staff": "혼돈의 지팡이", "Obliteration Ray": "절멸 광선", "Pandorium Axe": "판도리움 도끼",
  "Tome of Decay": "부패의 마도서", "Void Gun": "공허 총", "Corrupted Meteor Staff": "오염된 메테오 지팡이",
  "Flamethrower": "화염방사기", "Scrap Minigun": "고철 미니건", "Titan Breath": "타이탄의 숨결",
  "Void Club": "공허 곤봉", "Stormbringer": "폭풍을 부르는 자", "Credence of Ruin": "파멸의 신표",
};
// 재료명 한글은 scrape-lib.mjs 의 공용 사전(koMaterial) 사용.
// area = 게임 내 진행 티어/비옴. 한국어 비옴명(대략)으로 표기.
const KO_AREA = {
  StartArea: "시작 지역(흙 비옴)", Slime: "흙 비옴(슬라임 지대)", Clay: "점토 동굴",
  Stone: "잊혀진 유적(돌 지대)", Nature: "아제오스의 황야", Sea: "가라앉은 바다",
  Desert: "시초의 사막", Mold: "곰팡이 던전", Lava: "용암 지대", Crystal: "반짝이는 변경",
  LarvaHive: "유충 둥지", Excavation: "발굴 현장", Passage: "통로", City: "고대 도시",
};
const KO_CLASS = { MeleeWeapon: "근접", RangeWeapon: "원거리", MagicWeapon: "마법" };
const RARITY_KEY = { Common: "common", Uncommon: "uncommon", Rare: "rare", Epic: "epic", Legendary: "legendary" };

// ───────────────────────── 헬퍼 ─────────────────────────
const arr = (v) => (Array.isArray(v) ? v : v && typeof v === "object" ? Object.values(v) : []);
const slug = (n) => n.toLowerCase().replace(/['’.]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
function dmgAt(t, lvl) {
  if (!t || typeof t !== "object") return null;
  if (t[lvl] != null) return t[lvl];
  const ks = Object.keys(t).map(Number).filter((n) => !isNaN(n)).sort((a, b) => a - b);
  return ks.length ? t[ks[0]] : null;
}
function dmgMax(t) {
  if (!t || typeof t !== "object") return null;
  const ks = Object.keys(t).map(Number).filter((n) => !isNaN(n)).sort((a, b) => a - b);
  return ks.length ? t[ks[ks.length - 1]] : null;
}
async function fetchWikitext(page) {
  const u = `${API}?action=parse&page=${encodeURIComponent(page)}&prop=wikitext&format=json`;
  const r = await fetch(u, { headers: { "User-Agent": UA } });
  const j = await r.json();
  return j.parse.wikitext["*"];
}
// api.php 는 node fetch 로 접근되지만, 이미지 CDN(Special:FilePath→static.wikia)은
// node fetch 를 차단(403)하므로 바이너리는 curl 로 받는다.
async function resolveIconFile(page) {
  try {
    const u = `${API}?action=parse&page=${encodeURIComponent(page)}&prop=text&format=json`;
    const r = await fetch(u, { headers: { "User-Agent": UA } });
    const j = await r.json();
    if (!j.parse) return null;
    const html = j.parse.text["*"];
    const aside = (html.match(/<aside[\s\S]*?<\/aside>/) || [html])[0];
    const m = aside.match(/data-image-name="([^"]+\.(?:png|webp|gif))"/i);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}
// 짧은 UA 는 Cloudflare 챌린지("Just a moment...")에 걸리므로 완전한 브라우저 UA 필요.
const BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";
function curlDownload(fileName, dest) {
  const url = FILE + encodeURIComponent(fileName);
  try {
    execFileSync("curl", ["-s", "-L", "-A", BROWSER_UA, url, "-o", dest], { stdio: "ignore" });
  } catch { return false; }
  if (!fs.existsSync(dest)) return false;
  const buf = fs.readFileSync(dest);
  // 실제 스프라이트는 RIFF(webp)/PNG 매직으로 시작. 404·Cloudflare 챌린지(HTML "<!…")는 거름.
  const isImg = buf.length >= 70 && (buf.slice(0, 4).toString("ascii") === "RIFF" || (buf[0] === 0x89 && buf[1] === 0x50));
  if (!isImg) { fs.rmSync(dest); return false; }
  return true;
}

// ───────────────────────── 메인 ─────────────────────────
const WC = ["MeleeWeapon", "RangeWeapon", "MagicWeapon"];

console.log("• Module:ObjectInfo/data 다운로드…");
const lua = await fetchWikitext("Module:ObjectInfo/data");
console.log(`  ${lua.length.toLocaleString()} chars`);
const data = parseLuaModule(lua);
const ob = await getObtaining();
console.log(`• Obtaining 로드 (${Object.keys(ob).length} entries)`);

const weapons = [];
for (const k of Object.keys(data)) {
  const b = data[k] && data[k][0];
  if (!b) continue;
  const cats = arr(b.categories);
  if (!(cats.some((c) => WC.includes(c)) && cats.includes("Equipment"))) continue;
  const cls = cats.find((c) => WC.includes(c));
  const dmgField = cls === "MeleeWeapon" ? "meleeDamage" : cls === "RangeWeapon" ? "rangeDamage" : "magicDamage";
  const lvl = b.level ?? null;
  const dtbl = b[dmgField];
  const materials = arr(b.materials).map((m) => {
    const nm = (data[m.id] && data[m.id][0] && data[m.id][0].name) || m.id;
    const amt = m.amount;
    const src = materialSource(m.id, data, ob);
    return {
      id: m.id,
      name_en: nm,
      name_ko: koMaterial(nm),
      amount: typeof amt === "object" ? null : amt,
      amount_min: typeof amt === "object" ? amt[0] : amt,
      amount_max: typeof amt === "object" ? amt[1] : amt,
      src_type: src.type,
      src_detail: src.detail,
    };
  });
  weapons.push({
    id: slug(b.name),
    name_en: b.name,
    name_ko: KO_WEAPON[b.name] || b.name,
    desc_en: b.description || "",
    damage_class: cls === "MeleeWeapon" ? "melee" : cls === "RangeWeapon" ? "ranged" : "magic",
    class_ko: KO_CLASS[cls],
    rarity: RARITY_KEY[b.rarity] || "common",
    level: lvl,
    area: b.area || null,
    area_ko: b.area ? KO_AREA[b.area] || b.area : null,
    dmg_base: dmgAt(dtbl, lvl),
    dmg_max: dmgMax(dtbl),
    atk_rate: b.cooldown ? Math.round((1 / b.cooldown) * 10) / 10 : null,
    durability: b.durability ?? null,
    sell: b.sell ?? null,
    materials,
    drops: itemDrops(b.id, ob, data),
    icon: slug(b.name) + ".webp",
  });
}
weapons.sort((a, b) => (a.level ?? 0) - (b.level ?? 0) || a.name_en.localeCompare(b.name_en));
console.log(`• 무기 ${weapons.length}종 추출`);

// 데이터 저장
const dataDir = path.join(__dirname, "public", "data");
fs.mkdirSync(dataDir, { recursive: true });
fs.writeFileSync(path.join(dataDir, "weapons.json"), JSON.stringify(weapons, null, 2));
console.log("• public/data/weapons.json 저장");

// SKIP_ICONS=1 이면 데이터만 갱신(이미 받은 아이콘 재사용).
if (process.env.SKIP_ICONS) { console.log("• SKIP_ICONS=1 → 아이콘 건너뜀"); console.log("완료 ✅"); process.exit(0); }

// 아이콘 다운로드: 페이지 인포박스에서 실제 File 명을 해석한 뒤 curl 로 받는다.
const iconDir = path.join(__dirname, "public", "weapon-icons");
fs.mkdirSync(iconDir, { recursive: true });
const manifest = {};
let ok = 0;
const miss = [];
for (const w of weapons) {
  const dest = path.join(iconDir, w.icon);
  // 1차: 인포박스에서 실제 파일명 해석, 2차: "이름.png" 기본 규칙
  const resolved = await resolveIconFile(w.name_en);
  const candidates = [resolved, w.name_en.replace(/ /g, "_") + ".png"].filter(Boolean);
  let done = false;
  // 후보 파일명 × 재시도(일시적 Cloudflare 챌린지 대비)
  for (let attempt = 0; attempt < 3 && !done; attempt++) {
    for (const c of candidates) {
      if (curlDownload(c, dest)) { manifest[w.id] = "/weapon-icons/" + w.icon; ok++; done = true; break; }
    }
    if (!done) await new Promise((r) => setTimeout(r, 600));
  }
  if (!done) miss.push(w.name_en);
  await new Promise((r) => setTimeout(r, 150)); // 예의상 레이트리밋
}
fs.writeFileSync(path.join(iconDir, "manifest.json"), JSON.stringify(manifest));
console.log(`• 아이콘 ${ok}/${weapons.length} 다운로드, manifest 저장`);
if (miss.length) console.log(`  아이콘 없음(위키 미문서화): ${miss.join(", ")}`);
console.log("완료 ✅");
