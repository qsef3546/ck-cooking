"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  allCombos, combine, buffLabel, buffValText, CAT_COLOR, RARITY,
} from "@/lib/combine";
import type { Ingredient, Combo } from "@/lib/types";

const CATS = ["전체", "회복", "생존", "근접", "원거리", "마법", "소환", "전투", "방어", "이동", "채광", "유틸", "면역"];
const PAGE = 60;

export default function Page() {
  const [items, setItems] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [base, setBase] = useState<string>("");   // 재료1 고정 (id). '' = 전체
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("전체");
  const [shown, setShown] = useState(PAGE);

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

  const combos: Combo[] = useMemo(() => {
    if (!items.length) return [];
    if (base) {
      const a = items.find((i) => i.id === base);
      if (!a) return [];
      return items.map((b) => combine(a, b));
    }
    return allCombos(items); // 전체 (i<=j)
  }, [items, base]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return combos.filter((c) => {
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
  }, [combos, q, cat]);

  useEffect(() => setShown(PAGE), [q, cat, base]);

  if (loading) return <main className="wrap"><p className="muted">불러오는 중…</p></main>;
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
        <span className="count">{filtered.length.toLocaleString()} 조합</span>
      </header>

      <div className="controls">
        <select value={base} onChange={(e) => setBase(e.target.value)}>
          <option value="">재료1 — 전체 보기</option>
          {items.map((i) => (
            <option key={i.id} value={i.id}>{i.name_ko} · {i.name_en}</option>
          ))}
        </select>
        <input
          placeholder="재료·효과 검색 (예: 근접, mold, 회복)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="chips">
        {CATS.map((c) => (
          <button key={c} className={"chip" + (c === cat ? " on" : "")} onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
      </div>

      <div className="rows">
        {filtered.slice(0, shown).map((c, idx) => (
          <article className="row" key={idx}>
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
                {c.buffs.map((b, k) => (
                  <span className="buff" key={k}>
                    <i className="dot" style={{ background: CAT_COLOR[b.cat] }} />
                    {buffLabel(b)} <b>{buffValText(b)}</b>
                    {b.dur && <em>{b.dur}</em>}
                    {b.perm && <strong className="perm">영구</strong>}
                  </span>
                ))}
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
    </main>
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
