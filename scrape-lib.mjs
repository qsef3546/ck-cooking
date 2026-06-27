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
