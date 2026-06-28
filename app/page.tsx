"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { allCombos, buffLabel, buffValText, CAT_COLOR, RARITY } from "@/lib/combine";
import type { Ingredient, Combo } from "@/lib/types";
import ICONS from "@/public/icons/manifest.json";
import Weapons from "./Weapons";
import Gear from "./Gear";
import Fish from "./Fish";

const iconSrc = (id: string): string | undefined => (ICONS as Record<string, string>)[id];

function Icon({ id, size, cls }: { id: string; size: number; cls?: string }) {
  const src = iconSrc(id);
  if (!src) return null;
  return <img className={"icon" + (cls ? " " + cls : "")} src={src} width={size} height={size} alt="" loading="lazy" />;
}

const EFFECTS = ["회복", "생존", "근접", "원거리", "마법", "소환", "전투", "방어", "이동", "채광", "유틸", "면역"];
const DETAIL_CATS = ["전체", ...EFFECTS];
const TYPE_LABEL: Record<string, string> = { plant: "식물", fish: "물고기", other: "기타" };
const SORTS = [
  { key: "default", label: "기본순 (이름)" },
  { key: "food", label: "포만감 많은순" },
  { key: "buffs", label: "효과 개수순" },
];
const PAGE = 30;

function catValue(c: Combo, cat: string): number {
  let max = -Infinity;
  for (const b of c.buffs) if (b.cat === cat && b.val != null && b.val > max) max = b.val;
  return max;
}
/** 선택한 여러 효과의 값 합(정렬용). 없는 효과는 0으로 계산 */
function catValueSum(c: Combo, cats: string[]): number {
  let sum = 0;
  for (const cat of cats) { const v = catValue(c, cat); if (v > -Infinity) sum += v; }
  return sum;
}
/** 콤보가 선택한 효과를 모두 가지는지 (AND) */
function hasAllCats(c: Combo, cats: string[]): boolean {
  return cats.every((cat) => c.buffs.some((b) => b.cat === cat));
}
/** 선택 재료를 항상 왼쪽(a)에 오도록 정렬 */
function orient(c: Combo, firstId: string): Combo {
  if (c.b.id === firstId && c.a.id !== firstId) return { ...c, a: c.b, b: c.a };
  return c;
}
function sortList(list: Combo[], sort: string): Combo[] {
  if (sort === "food") return [...list].sort((a, b) => b.food - a.food);
  if (sort === "buffs") return [...list].sort((a, b) => b.buffs.length - a.buffs.length || b.food - a.food);
  return list;
}
function pageList(cur: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  const s = Math.max(2, cur - 1), e = Math.min(total - 1, cur + 1);
  if (s > 2) out.push("…");
  for (let i = s; i <= e; i++) out.push(i);
  if (e < total - 1) out.push("…");
  out.push(total);
  return out;
}

export default function Page() {
  const [section, setSection] = useState<"cook" | "weapon" | "armor" | "accessories" | "tools" | "fish">("cook");
  const [items, setItems] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [mode, setMode] = useState<"ingredient" | "effect">("ingredient");
  const [sel, setSel] = useState("");          // 선택 재료 id ("" = 그리드)
  const [q, setQ] = useState("");
  const [cats, setCats] = useState<string[]>([]); // ingredient: 상세 필터 / effect: 선택 효과 (다중)
  const [sort, setSort] = useState("default");
  const [goldOnly, setGoldOnly] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("ingredients").select("*").order("name_ko", { ascending: true });
      if (error) setErr(error.message);
      else setItems((data ?? []) as Ingredient[]);
      setLoading(false);
    })();
  }, []);

  const combos = useMemo(() => (items.length ? allCombos(items) : []), [items]);
  const selItem = useMemo(() => items.find((i) => i.id === sel) || null, [items, sel]);

  // 재료 그리드 (검색/골드 필터)
  const gridItems = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return items.filter((i) => {
      if (goldOnly && !i.is_gold) return false;
      if (ql && !(i.name_ko + " " + i.name_en).toLowerCase().includes(ql)) return false;
      return true;
    });
  }, [items, q, goldOnly]);

  // 선택 재료 상세 조합
  const detailCombos = useMemo(() => {
    if (!sel) return [];
    let list = combos.filter((c) => c.a.id === sel || c.b.id === sel).map((c) => orient(c, sel));
    if (cats.length) list = list.filter((c) => hasAllCats(c, cats));
    return sortList(list, sort);
  }, [combos, sel, cats, sort]);

  // 효과 모드 결과 (선택 효과 모두 포함 · 선택 효과 값 합 높은순)
  const effectCombos = useMemo(() => {
    if (mode !== "effect" || !cats.length) return [];
    const ql = q.trim().toLowerCase();
    let list = combos.filter((c) => hasAllCats(c, cats));
    if (goldOnly) list = list.filter((c) => c.a.is_gold || c.b.is_gold);
    if (ql) list = list.filter((c) =>
      (c.a.name_ko + c.a.name_en + c.b.name_ko + c.b.name_en + c.buffs.map(buffLabel).join("")).toLowerCase().includes(ql)
    );
    return [...list].sort((a, b) => catValueSum(b, cats) - catValueSum(a, cats));
  }, [combos, mode, cats, q, goldOnly]);

  const list = mode === "effect" ? effectCombos : detailCombos;
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const pageItems = list.slice((page - 1) * PAGE, page * PAGE);

  useEffect(() => setPage(1), [sel, cats, q, sort, mode, goldOnly]);

  const toggleCat = (c: string) =>
    setCats((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  function switchMode(m: "ingredient" | "effect") {
    setMode(m); setSel(""); setCats([]); setQ(""); setSort("default");
  }

  return (
    <main className="wrap">
      <header className="top">
        <div>
          <h1 className="title">코어 키퍼 도감</h1>
          <p className="sub">
            {section === "cook"
              ? `재료1 + 재료2 = 완성 요리 · 효과 · 획득처 · 총 ${combos.length.toLocaleString()} 조합`
              : section === "fish"
              ? "낚시터별 물고기 · 낚일 확률 · 필요 낚시 스킬"
              : "등급 · 레벨 · 스탯 · 장착 효과 · 제작 재료 · 파밍 지역"}
          </p>
        </div>
      </header>

      <div className="sectabs">
        <button className={"sectab" + (section === "cook" ? " on" : "")} onClick={() => setSection("cook")}>🍳 요리</button>
        <button className={"sectab" + (section === "weapon" ? " on" : "")} onClick={() => setSection("weapon")}>⚔️ 무기</button>
        <button className={"sectab" + (section === "armor" ? " on" : "")} onClick={() => setSection("armor")}>🛡️ 방어구</button>
        <button className={"sectab" + (section === "accessories" ? " on" : "")} onClick={() => setSection("accessories")}>💍 장신구</button>
        <button className={"sectab" + (section === "tools" ? " on" : "")} onClick={() => setSection("tools")}>⛏️ 아이템</button>
        <button className={"sectab" + (section === "fish" ? " on" : "")} onClick={() => setSection("fish")}>🎣 낚시</button>
      </div>

      {section === "weapon" && <Weapons />}
      {section === "armor" && <Gear kind="armor" />}
      {section === "accessories" && <Gear kind="accessories" />}
      {section === "tools" && <Gear kind="tools" />}
      {section === "fish" && <Fish />}

      {section === "cook" && loading && <p className="muted pad">불러오는 중…</p>}
      {section === "cook" && !loading && err && (
        <p className="error">데이터를 불러오지 못했습니다: {err}</p>
      )}
      {section === "cook" && !loading && !err && (
      <>
      <div className="tabs">
        <button className={"tab" + (mode === "ingredient" ? " on" : "")} onClick={() => switchMode("ingredient")}>
          재료로 찾기
        </button>
        <button className={"tab" + (mode === "effect" ? " on" : "")} onClick={() => switchMode("effect")}>
          효과로 찾기
        </button>
      </div>

      {/* ── 재료 모드: 그리드 ── */}
      {mode === "ingredient" && !sel && (
        <>
          <div className="controls">
            <input className="search" placeholder="재료 검색 (예: 버섯, gold, 하트)" value={q} onChange={(e) => setQ(e.target.value)} />
            <button className={"chip gold" + (goldOnly ? " on" : "")} onClick={() => setGoldOnly((v) => !v)}>★ 황금·전설만</button>
          </div>
          <p className="hint">재료를 고르면 그 재료로 만들 수 있는 조합만 보여줍니다 ({gridItems.length}종)</p>
          <div className="grid">
            {gridItems.map((i) => <ICard key={i.id} i={i} onPick={() => { setSel(i.id); setQ(""); setGoldOnly(false); }} />)}
            {!gridItems.length && <p className="muted pad">검색 결과가 없습니다.</p>}
          </div>
        </>
      )}

      {/* ── 재료 모드: 상세 ── */}
      {mode === "ingredient" && sel && selItem && (
        <>
          <button className="back" onClick={() => { setSel(""); setCats([]); }}>← 재료 목록</button>
          <IngredientHeader i={selItem} comboCount={combos.filter((c) => c.a.id === sel || c.b.id === sel).length} />
          <div className="controls">
            <select className="sort" value={sort} onChange={(e) => setSort(e.target.value)}>
              {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
            <span className="reslabel">{detailCombos.length} 조합</span>
          </div>
          <div className="chips">
            {DETAIL_CATS.map((c) => {
              const on = c === "전체" ? cats.length === 0 : cats.includes(c);
              return (
                <button key={c} className={"chip" + (on ? " on" : "")} onClick={() => (c === "전체" ? setCats([]) : toggleCat(c))}>{c}</button>
              );
            })}
          </div>
          <List items={pageItems} cats={cats} highlightId={sel} />
          <Pager page={page} pages={pages} onGo={setPage} />
        </>
      )}

      {/* ── 효과 모드 ── */}
      {mode === "effect" && (
        <>
          <p className="hint">효과를 여러 개 고르면 <b>선택한 효과를 모두 가진</b> 조합만, 합산이 센 순서로 보여줍니다.</p>
          <div className="chips big">
            {EFFECTS.map((c) => {
              const on = cats.includes(c);
              return (
                <button key={c} className={"chip" + (on ? " on" : "")} onClick={() => toggleCat(c)} style={on ? undefined : { borderColor: CAT_COLOR[c] + "66" }}>
                  <i className="dot" style={{ background: CAT_COLOR[c] }} /> {c}
                </button>
              );
            })}
            {cats.length > 0 && <button className="chip clear" onClick={() => setCats([])}>✕ 초기화</button>}
          </div>
          {cats.length > 0 && (
            <>
              <div className="controls">
                <input className="search" placeholder="재료·효과 검색" value={q} onChange={(e) => setQ(e.target.value)} />
                <button className={"chip gold" + (goldOnly ? " on" : "")} onClick={() => setGoldOnly((v) => !v)}>★ 황금·전설만</button>
                <span className="reslabel">{effectCombos.length} 조합 · {cats.map((c, i) => <b key={c} style={{ color: CAT_COLOR[c] }}>{i > 0 ? " + " : ""}{c}</b>)} 합산 높은순</span>
              </div>
              <List items={pageItems} cats={cats} highlightId="" />
              <Pager page={page} pages={pages} onGo={setPage} />
            </>
          )}
          {cats.length === 0 && <p className="muted pad">위에서 효과를 하나 이상 선택하세요.</p>}
        </>
      )}
      </>
      )}
    </main>
  );
}

function List({ items, cats, highlightId }: { items: Combo[]; cats: string[]; highlightId: string }) {
  if (!items.length) return <p className="muted pad">조건에 맞는 조합이 없습니다.</p>;
  return (
    <div className="rows">
      {items.map((c, idx) => (
        <article className="row" key={c.a.id + "_" + c.b.id + "_" + idx}>
          <div className="ings">
            <Ing i={c.a} hl={c.a.id === highlightId} /> <span className="plus">+</span> <Ing i={c.b} hl={c.b.id === highlightId} />
          </div>
          <div className="eq">=</div>
          <div className="dish">
            <div className="dishhead">
              <span className="food">포만감 +{c.food}</span>
              <span className="rar" style={{ color: c.rarityColor, borderColor: c.rarityColor }}>{c.rarityNote}</span>
            </div>
            <div className="buffs">
              {c.buffs.map((b, k) => {
                const hit = cats.includes(b.cat);
                return (
                  <span className={"buff" + (hit ? " hit" : "")} key={k}>
                    <i className="dot" style={{ background: CAT_COLOR[b.cat] }} />
                    {buffLabel(b)} <b>{buffValText(b)}</b>
                    {b.dur && <em>{b.dur}</em>}
                    {b.perm && <strong className="perm">영구</strong>}
                  </span>
                );
              })}
            </div>
            <div className="src">획득 — {c.a.name_ko}: {c.a.source} / {c.b.name_ko}: {c.b.source}</div>
          </div>
        </article>
      ))}
    </div>
  );
}

function ICard({ i, onPick }: { i: Ingredient; onPick: () => void }) {
  const [rn, rc] = RARITY[i.rarity] ?? ["", "#999"];
  return (
    <button className="icard" style={{ borderColor: rc }} onClick={onPick}>
      <Icon id={i.id} size={44} cls="ic-icon" />
      <div className="ic-name">{i.name_ko}</div>
      <div className="ic-en">{i.name_en}</div>
      <div className="ic-meta">
        <span className="ic-rar" style={{ color: rc }}>{rn}</span>
        <span className="ic-type">{TYPE_LABEL[i.type]}</span>
        <span className="ic-food">포만감 {i.food}</span>
      </div>
      <div className="ic-dots">
        {i.buffs.slice(0, 6).map((b, k) => <i key={k} className="dot" style={{ background: CAT_COLOR[b.cat] }} title={buffLabel(b)} />)}
      </div>
    </button>
  );
}

function IngredientHeader({ i, comboCount }: { i: Ingredient; comboCount: number }) {
  const [rn, rc] = RARITY[i.rarity] ?? ["", "#999"];
  return (
    <div className="dethead">
      <div className="dethead-top">
        <Icon id={i.id} size={40} cls="dethead-ic" />
        <span className="ing big" style={{ borderColor: rc }}>{i.name_ko}</span>
        <span className="dethead-en">{i.name_en} · <span style={{ color: rc }}>{rn}</span> · {TYPE_LABEL[i.type]} · 포만감 {i.food}</span>
        <span className="count">{comboCount} 조합</span>
      </div>
      {!!i.buffs.length && (
        <div className="buffs">
          {i.buffs.map((b, k) => (
            <span className="buff" key={k}>
              <i className="dot" style={{ background: CAT_COLOR[b.cat] }} />
              {buffLabel(b)} <b>{buffValText(b)}</b>{b.dur && <em>{b.dur}</em>}{b.perm && <strong className="perm">영구</strong>}
            </span>
          ))}
        </div>
      )}
      <div className="src">획득처 — {i.source}</div>
    </div>
  );
}

function Ing({ i, hl }: { i: Ingredient; hl?: boolean }) {
  const [rn, rc] = RARITY[i.rarity] ?? ["", "#999"];
  return (
    <span className={"ing" + (hl ? " hl" : "")} style={{ borderColor: rc }} title={`${rn} · ${i.source}`}>
      <Icon id={i.id} size={18} cls="ing-ic" />{i.name_ko}
    </span>
  );
}

function Pager({ page, pages, onGo }: { page: number; pages: number; onGo: (n: number) => void }) {
  if (pages <= 1) return null;
  const go = (n: number) => { onGo(n); window.scrollTo({ top: 0, behavior: "smooth" }); };
  return (
    <nav className="pager">
      <button className="pg" disabled={page === 1} onClick={() => go(page - 1)}>‹ 이전</button>
      {pageList(page, pages).map((p, k) =>
        p === "…"
          ? <span key={"e" + k} className="pg dots">…</span>
          : <button key={p} className={"pg" + (p === page ? " on" : "")} onClick={() => go(p)}>{p}</button>
      )}
      <button className="pg" disabled={page === pages} onClick={() => go(page + 1)}>다음 ›</button>
    </nav>
  );
}
