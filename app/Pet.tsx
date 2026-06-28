"use client";

import { useMemo, useState } from "react";
import { PET_TYPE_COLOR, type Pet } from "@/lib/pet";
import PETS from "@/public/data/pets.json";
import PICONS from "@/public/pet-icons/manifest.json";

const pets = PETS as Pet[];
const picon = (id: string): string | undefined => (PICONS as Record<string, string>)[id];

function PIcon({ id }: { id: string }) {
  const src = picon(id);
  if (!src) return <span className="wic-ph" style={{ width: 40, height: 40 }} aria-hidden />;
  return <img className="wic" src={src} width={40} height={40} alt="" loading="lazy" />;
}

export default function Pets() {
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");

  const types = useMemo(() => ["all", ...Array.from(new Set(pets.map((p) => p.pet_type_ko)))], []);
  const view = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return pets.filter((p) => {
      if (type !== "all" && p.pet_type_ko !== type) return false;
      if (ql && !(p.name_ko + " " + p.name_en + " " + p.buffs.map((b) => b.label).join(" ")).toLowerCase().includes(ql)) return false;
      return true;
    });
  }, [q, type]);

  return (
    <>
      <p className="hint">
        펫 {pets.length}종 · 유형별 · <b>따라다니며 주는 패시브 버프</b> · 특화 · 등장 지역.
      </p>

      <div className="controls">
        <input className="search" placeholder="펫·효과 검색 (예: 아울럭스, 이동 속도)" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="chips">
        {types.map((t) => (
          <button key={t} className={"chip" + (type === t ? " on" : "")} onClick={() => setType(t)}
            style={t !== "all" && type !== t ? { borderColor: (PET_TYPE_COLOR[t] || "#999") + "66" } : undefined}>
            {t !== "all" && <i className="dot" style={{ background: PET_TYPE_COLOR[t] || "#999" }} />} {t === "all" ? "전체" : t}
          </button>
        ))}
        <span className="reslabel">{view.length}종</span>
      </div>

      <div className="wgrid">
        {view.map((p) => <PCard key={p.id} p={p} />)}
        {!view.length && <p className="muted pad">조건에 맞는 펫이 없습니다.</p>}
      </div>
    </>
  );
}

function PCard({ p }: { p: Pet }) {
  const tc = PET_TYPE_COLOR[p.pet_type_ko] || "#cdbfa8";
  return (
    <article className="wcard" style={{ borderColor: tc }}>
      <div className="wcard-head">
        <PIcon id={p.id} />
        <div className="wcard-title">
          <div className="wcard-name">{p.name_ko}</div>
          {p.name_en !== p.name_ko && <div className="wcard-en">{p.name_en}</div>}
        </div>
        <span className="wbadge" style={{ color: tc, borderColor: tc + "88" }}>
          <i className="dot" style={{ background: tc }} /> {p.pet_type_ko}
        </span>
      </div>

      {!!p.buffs.length && (
        <div className="weffs">
          {p.buffs.map((b, i) => (
            <span className="weff" key={i}>{b.label}{b.value != null && <> {b.value >= 0 ? "+" : ""}{b.value}{b.unit}</>}</span>
          ))}
        </div>
      )}

      {p.dmg != null && (
        <div className="wstats"><div className="wstat"><span>펫 공격력</span><b>{p.dmg}</b></div></div>
      )}

      {!!p.talents.length && (
        <div className="pet-talents"><span className="pet-talents-label">특화</span> {p.talents.join(" · ")}</div>
      )}

      {!!p.desc_en && <div className="wdesc">“{p.desc_en}”</div>}

      <div className="wcraft">
        <div className="wcraft-h">
          <span className="wcraft-label">등장 지역</span>
          {p.area_ko && <span className="warea">📍 {p.area_ko}</span>}
        </div>
      </div>
    </article>
  );
}
