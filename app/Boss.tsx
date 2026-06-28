"use client";

import { useMemo, useState } from "react";
import { dropAmount, type Boss } from "@/lib/boss";
import BOSSES from "@/public/data/bosses.json";
import BICONS from "@/public/boss-icons/manifest.json";

const bosses = BOSSES as Boss[];
const bicon = (id: string): string | undefined => (BICONS as Record<string, string>)[id];

function BIcon({ id }: { id: string }) {
  const src = bicon(id);
  if (!src) return <span className="wic-ph" style={{ width: 48, height: 48 }} aria-hidden />;
  return <img className="wic bic" src={src} width={48} height={48} alt="" loading="lazy" />;
}

export default function Bosses() {
  const [q, setQ] = useState("");

  const view = useMemo(() => {
    const ql = q.trim().toLowerCase();
    if (!ql) return bosses;
    return bosses.filter((b) =>
      (b.name_ko + " " + b.name_en + " " + (b.area_ko || "") + " " + b.drops.map((d) => d.name_ko + d.name_en).join(" "))
        .toLowerCase().includes(ql)
    );
  }, [q]);

  return (
    <>
      <p className="hint">
        보스 {bosses.length}종 · 지역(진행 순) · 체력 · <b>처치 시 확정/확률 드롭</b>.
      </p>

      <div className="controls">
        <input className="search" placeholder="보스·드롭·지역 검색 (예: 킹 슬라임, 에코맵)" value={q} onChange={(e) => setQ(e.target.value)} />
        <span className="reslabel">{view.length}종</span>
      </div>

      <div className="bgrid">
        {view.map((b) => <BCard key={b.id} b={b} />)}
        {!view.length && <p className="muted pad">검색 결과가 없습니다.</p>}
      </div>
    </>
  );
}

function BCard({ b }: { b: Boss }) {
  return (
    <article className="bcard">
      <div className="bcard-head">
        <BIcon id={b.id} />
        <div className="bcard-title">
          <div className="bcard-name">{b.name_ko}</div>
          {b.name_en !== b.name_ko && <div className="bcard-en">{b.name_en}</div>}
          <div className="bcard-meta">
            {b.area_ko && <span className="barea">📍 {b.area_ko}</span>}
            {b.hp != null && <span className="bhp">❤️ {b.hp.toLocaleString()}</span>}
          </div>
        </div>
      </div>
      <div className="bdrops">
        <div className="wcraft-label">드롭</div>
        <div className="wmats">
          {b.drops.map((d) => (
            <span className="wmat" key={d.id} title={d.name_en}>
              {d.name_ko} <b>{dropAmount(d)}</b>
              {d.chance < 100 && <i className="msrc">{d.chance}%</i>}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
