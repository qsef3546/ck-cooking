"use client";

import { useMemo, useState } from "react";
import { RARITY } from "@/lib/combine";
import type { Fish, FishingSpot } from "@/lib/fish";
import SPOTS from "@/public/data/fish.json";
import FICONS from "@/public/fish-icons/manifest.json";

const spots = SPOTS as FishingSpot[];
const ficon = (id: string): string | undefined => (FICONS as Record<string, string>)[id];

function FIcon({ id, size }: { id: string; size: number }) {
  const src = ficon(id);
  if (!src) return <span className="wic-ph" style={{ width: size, height: size }} aria-hidden />;
  return <img className="wic" src={src} width={size} height={size} alt="" loading="lazy" />;
}

export default function Fish() {
  const [q, setQ] = useState("");
  const [loc, setLoc] = useState("all");

  const view = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return spots
      .filter((s) => loc === "all" || s.location === loc)
      .map((s) => ({
        ...s,
        fish: ql
          ? s.fish.filter((f) => (f.name_ko + " " + f.name_en).toLowerCase().includes(ql))
          : s.fish,
      }))
      .filter((s) => s.fish.length);
  }, [q, loc]);

  const totalFish = spots.reduce((n, s) => n + s.fish.length, 0);

  return (
    <>
      <p className="hint">
        낚시터 {spots.length}곳 · 물고기 {totalFish}마리 · 각 낚시터에서 잡히는 어종과 <b>낚일 확률 · 필요 낚시 스킬</b>.
      </p>

      <div className="controls">
        <input className="search" placeholder="물고기 검색 (예: 구피, 상어, dart)" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="chips">
        <button className={"chip" + (loc === "all" ? " on" : "")} onClick={() => setLoc("all")}>전체</button>
        {spots.map((s) => (
          <button key={s.location} className={"chip" + (loc === s.location ? " on" : "")} onClick={() => setLoc(s.location)}>
            {s.location_ko}
          </button>
        ))}
      </div>

      {view.map((s) => (
        <section className="fspot" key={s.location}>
          <div className="fspot-h">
            <h3 className="fspot-name">🎣 {s.location_ko}</h3>
            {s.min_fishing != null && <span className="fspot-skill">필요 낚시 {s.min_fishing}</span>}
          </div>
          <div className="fgrid">
            {s.fish.map((f) => <FCard key={f.id} f={f} />)}
          </div>
        </section>
      ))}
      {!view.length && <p className="muted pad">검색 결과가 없습니다.</p>}
    </>
  );
}

function FCard({ f }: { f: Fish }) {
  const [rn, rc] = RARITY[f.rarity] ?? ["", "#999"];
  return (
    <article className="fcard" style={{ borderColor: rc }}>
      <div className="fcard-head">
        <FIcon id={f.id} size={36} />
        <div className="fcard-title">
          <div className="fcard-name">{f.name_ko}</div>
          {f.name_en !== f.name_ko && <div className="fcard-en">{f.name_en}</div>}
        </div>
        <span className="fchance" title="낚일 확률">{f.chance}%</span>
      </div>
      <div className="fcard-meta">
        <span className="wbadge" style={{ color: rc, borderColor: rc + "88" }}>{rn}</span>
      </div>
      {!!f.effects.length && (
        <div className="weffs">
          {f.effects.map((e, i) => (
            <span className="weff" key={i}>
              {e.label}{e.value != null && <> {e.value >= 0 ? "+" : ""}{e.value}{e.unit}</>}
              {e.dur && <em> {e.dur}</em>}
            </span>
          ))}
        </div>
      )}
      {!!f.desc_en && <div className="wdesc">“{f.desc_en}”</div>}
    </article>
  );
}
