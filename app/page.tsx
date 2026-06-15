"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  allCombos, buffLabel, buffValText, CAT_COLOR, RARITY,
} from "@/lib/combine";
import type { Ingredient, Combo } from "@/lib/types";

const CATS = ["전체", "회복", "생존", "근접", "원거리", "마법", "소환", "전투", "방어", "이동", "채광", "유틸", "면역"];
const TYPE_LABEL: Record<string, string> = { plant: "식물", fish: "물고기", other: "기타" };
const SORTS = [
  { key: "default", label: "기본순 (이름)" },
  { key: "food", label: "포만감 많은순" },
  { key: "buffs", label: "효과 개수순" },
  { key: "cat", label: "선택 효과 높은순" },
];
const PAGE = 60;

/** 선택 카테고리에서 가장 높은 버프 수치 (없으면 -Infinity) */
function catValue(c: Combo, cat: string): number {
  let max = -Infinity;
  for (const b of c.buffs) if (b.cat === cat && b.val != null && b.val > max) max = b.val;
  return max;
}

export default function Page() {
  const [items, setItems] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [ing1, setIng1] = useState("");
  const [ing2, setIng2] = useState("");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("전체");
  const [sort, setSort] = useState("default");
  const [goldOnly, setGoldOnly] = useState(false);
  const [shown, setShown] = useState(PAGE);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("ingredients")
        .select("*")
        .order("name_ko", { ascending: true });
      if (error) setErr(error.message);
      else setItems((data ?? []) as Ingredient[]);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 700);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const grouped = useMemo(() => {
    const g: Record<string, Ingredient[]> = { plant: [], fish: [], other: [] };
    for (const i of items) (g[i.type] ?? g.other).push(i);
    return g;
  }, [items]);

  const combos: Combo[] = useMemo(() => (items.length ? allCombos(items) : []), [items]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    let list = combos.filter((c) => {
      if (ing1 && c.a.id !== ing1 && c.b.id !== ing1) return false;
      if (ing2 && c.a.id !== ing2 && c.b.id !== ing2) return false;
      if (goldOnly && !c.a.is_gold && !c.b.is_gold) return false;
      if (cat !== "전체" && !c.buffs.some((b) => b.cat === cat)) return false;
      if (ql) {
        const hay = (
          c.a.name_ko + " " + c.a.name_en + " " + c.b.name_ko + " " + c.b.name_en + " " +
          c.buffs.map(buffLabel).join(" ")
        ).toLowerCase();
        if (!hay.includes(ql)) return false;
      }
      return true;
    });

    const useCatSort = sort === "cat" && cat !== "전체";
    if (sort === "food") list = [...list].sort((a, b) => b.food - a.food);
    else if (sort === "buffs") list = [...list].sort((a, b) => b.buffs.length - a.buffs.length || b.food - a.food);
    else if (useCatSort) list = [...list].sort((a, b) => catValue(b, cat) - catValue(a, cat));
    return list;
  }, [combos, ing1, ing2, goldOnly, cat, q, sort]);

  useEffect(() => setShown(PAGE), [q, cat, ing1, ing2, sort, goldOnly]);

  const reset = () => { setIng1(""); setIng2(""); setQ(""); setCat("전체"); setSort("default"); setGoldOnly(false); };
  const hasFilter = !!(ing1 || ing2 || q || goldOnly || cat !== "전체" || sort !== "default");

  if (loading) return <main className="wrap"><p className="muted pad">불러오는 중…</p></main>;
  if (err)
    return (
      <main className="wrap">
        <h1 className="title">코어 키퍼 요리 도감</h1>
        <p className="error">데이터를 불러오지 못했습니다: {err}</p>
        <p className="muted">.env.local 의 Supabase URL/Key 와 ingredients 테이블·시드를 확인하세요.</p>
      </main>
    );

  return (
    <main className="wrap">
      <header className="top">
        <div>
          <h1 className="title">코어 키퍼 요리 도감</h1>
          <p className="sub">재료1 + 재료2 = 완성 요리 · 효과 · 획득처</p>
        </div>
        <span className="count">
          <b>{filtered.length.toLocaleString()}</b>
          <span className="count-tot"> / {combos.length.toLocaleString()} 조합</span>
        </span>
      </header>

      <div className="toolbar">
        <div className="controls">
          <IngSelect value={ing1} onChange={setIng1} grouped={grouped} placeholder="재료1 — 전체" />
          <IngSelect value={ing2} onChange={setIng2} grouped={grouped} placeholder="재료2 — (선택)" />
          <input
            className="search"
            placeholder="재료·효과 검색 (예: 근접, mold, 회복)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select className="sort" value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORTS.map((s) => (
              <option key={s.key} value={s.key} disabled={s.key === "cat" && cat === "전체"}>
                {s.label}{s.key === "cat" && cat !== "전체" ? ` (${cat})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="chips">
          {CATS.map((c) => (
            <button key={c} className={"chip" + (c === cat ? " on" : "")} onClick={() => setCat(c)}>
              {c}
            </button>
          ))}
          <button
            className={"chip gold" + (goldOnly ? " on" : "")}
            onClick={() => setGoldOnly((v) => !v)}
            title="황금/전설 재료가 포함된 조합만"
          >
            ★ 황금·전설만
          </button>
          {hasFilter && <button className="chip reset" onClick={reset}>↺ 초기화</button>}
        </div>
      </div>

      <div className="rows">
        {filtered.slice(0, shown).map((c, idx) => (
          <article className="row" key={c.a.id + "_" + c.b.id + "_" + idx}>
            <div className="ings">
              <Ing i={c.a} /> <span className="plus">+</span> <Ing i={c.b} />
            </div>
            <div className="eq">=</div>
            <div className="dish">
              <div className="dishhead">
                <span className="food">포만감 +{c.food}</span>
                <span className="rar" style={{ color: c.rarityColor, borderColor: c.rarityColor }}>
                  {c.rarityNote}
                </span>
              </div>
              <div className="buffs">
                {c.buffs.map((b, k) => {
                  const hit = cat !== "전체" && b.cat === cat;
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
              <div className="src">
                획득 — {c.a.name_ko}: {c.a.source} / {c.b.name_ko}: {c.b.source}
              </div>
            </div>
          </article>
        ))}
        {!filtered.length && <p className="muted pad">조건에 맞는 조합이 없습니다.</p>}
      </div>

      {shown < filtered.length && (
        <button className="more" onClick={() => setShown((s) => s + PAGE)}>
          더 보기 ({(filtered.length - shown).toLocaleString()} 남음)
        </button>
      )}

      {showTop && (
        <button className="toTop" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="맨 위로">
          ↑
        </button>
      )}
    </main>
  );
}

function IngSelect({
  value, onChange, grouped, placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  grouped: Record<string, Ingredient[]>;
  placeholder: string;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {(["plant", "fish", "other"] as const).map((t) =>
        grouped[t]?.length ? (
          <optgroup key={t} label={TYPE_LABEL[t]}>
            {grouped[t].map((i) => (
              <option key={i.id} value={i.id}>{i.name_ko} · {i.name_en}</option>
            ))}
          </optgroup>
        ) : null
      )}
    </select>
  );
}

function Ing({ i }: { i: Ingredient }) {
  const [rn, rc] = RARITY[i.rarity] ?? ["", "#999"];
  return (
    <span className="ing" style={{ borderColor: rc }} title={`${rn} · ${i.source}`}>
      {i.name_ko}
    </span>
  );
}
