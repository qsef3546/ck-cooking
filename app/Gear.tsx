"use client";

import { useEffect, useMemo, useState } from "react";
import { RARITY } from "@/lib/combine";
import { matAmount } from "@/lib/weapons";
import { condText, type GearItem, type GearKind } from "@/lib/gear";
import { Pager } from "./Pager";
import ARMOR from "@/public/data/armor.json";
import ACCESSORIES from "@/public/data/accessories.json";
import TOOLS from "@/public/data/tools.json";
import GICONS from "@/public/gear-icons/manifest.json";

const DATA: Record<GearKind, GearItem[]> = {
  armor: ARMOR as GearItem[],
  accessories: ACCESSORIES as GearItem[],
  tools: TOOLS as GearItem[],
};
const gicon = (id: string): string | undefined => (GICONS as Record<string, string>)[id];

const SORTS = [
  { key: "level", label: "레벨 낮은순" },
  { key: "level_desc", label: "레벨 높은순" },
  { key: "name", label: "이름순" },
];
const PAGE = 36;

function GIcon({ id, size }: { id: string; size: number }) {
  const src = gicon(id);
  if (!src) return <span className="wic-ph" style={{ width: size, height: size }} aria-hidden />;
  return <img className="wic" src={src} width={size} height={size} alt="" loading="lazy" />;
}

export default function Gear({ kind }: { kind: GearKind }) {
  const list = DATA[kind];
  const [q, setQ] = useState("");
  const [sub, setSub] = useState("all");
  const [sort, setSort] = useState("level");
  const [page, setPage] = useState(1);

  // 하위분류 목록 (데이터 순서 유지)
  const subtypes = useMemo(() => {
    const seen = new Map<string, string>();
    for (const g of list) if (!seen.has(g.subtype_ko)) seen.set(g.subtype_ko, g.subtype_ko);
    return ["all", ...seen.keys()];
  }, [list]);

  const view = useMemo(() => {
    const ql = q.trim().toLowerCase();
    let out = list.filter((g) => {
      if (sub !== "all" && g.subtype_ko !== sub) return false;
      if (ql) {
        const hay = (g.name_ko + " " + g.name_en + " " + g.conditions.map((c) => c.label).join(" ") + " " + g.materials.map((m) => m.name_ko + m.name_en).join(" ")).toLowerCase();
        if (!hay.includes(ql)) return false;
      }
      return true;
    });
    out = [...out];
    if (sort === "level") out.sort((a, b) => (a.level ?? 0) - (b.level ?? 0) || a.name_en.localeCompare(b.name_en));
    else if (sort === "level_desc") out.sort((a, b) => (b.level ?? 0) - (a.level ?? 0));
    else if (sort === "name") out.sort((a, b) => a.name_ko.localeCompare(b.name_ko));
    return out;
  }, [list, q, sub, sort]);

  const pages = Math.max(1, Math.ceil(view.length / PAGE));
  const pageItems = view.slice((page - 1) * PAGE, page * PAGE);
  useEffect(() => setPage(1), [q, sub, sort, kind]);

  return (
    <>
      <p className="hint">
        {list.length}종 · 등급·레벨·<b>장착 효과</b>와 <b>제작 재료 · 파밍 지역</b>까지. 데이터는 코어 키퍼 위키에서 수집.
      </p>

      <div className="controls">
        <input className="search" placeholder="이름·효과·재료 검색" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="sort" value={sort} onChange={(e) => setSort(e.target.value)}>
          {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </div>

      <div className="chips">
        {subtypes.map((s) => (
          <button key={s} className={"chip" + (sub === s ? " on" : "")} onClick={() => setSub(s)}>
            {s === "all" ? "전체" : s}
          </button>
        ))}
        <span className="reslabel">{view.length}종</span>
      </div>

      <div className="wgrid">
        {pageItems.map((g) => <GCard key={g.id} g={g} />)}
        {!view.length && <p className="muted pad">조건에 맞는 항목이 없습니다.</p>}
      </div>

      <Pager page={page} pages={pages} onGo={setPage} />
    </>
  );
}

function GCard({ g }: { g: GearItem }) {
  const [rn, rc] = RARITY[g.rarity] ?? ["", "#999"];
  return (
    <article className="wcard" style={{ borderColor: rc }}>
      <div className="wcard-head">
        <GIcon id={g.id} size={40} />
        <div className="wcard-title">
          <div className="wcard-name">{g.name_ko}</div>
          {g.name_en !== g.name_ko && <div className="wcard-en">{g.name_en}</div>}
        </div>
        {g.level != null && <span className="wcard-lv">Lv {g.level}</span>}
      </div>

      <div className="wcard-badges">
        <span className="wbadge" style={{ color: "#cdbfa8", borderColor: "var(--border-lit)" }}>{g.subtype_ko}</span>
        <span className="wbadge" style={{ color: rc, borderColor: rc + "88" }}>{rn}</span>
      </div>

      {!!g.conditions.length && (
        <div className="weffs">
          {g.conditions.map((c, i) => (
            <span className="weff" key={i}>
              {condText(c)}
              {c.max != null && c.base != null && c.max !== c.base && <em> →{c.max}{c.unit}</em>}
            </span>
          ))}
        </div>
      )}

      {(g.dmg_base != null || g.durability != null || g.sell != null) && (
        <div className="wstats">
          {g.dmg_base != null && <div className="wstat"><span>공격력</span><b>{g.dmg_base}</b></div>}
          {g.durability != null && <div className="wstat"><span>내구도</span><b>{g.durability}</b></div>}
          {g.sell != null && <div className="wstat"><span>판매가</span><b>{g.sell}💰</b></div>}
        </div>
      )}

      {!!g.desc_en && <div className="wdesc">“{g.desc_en}”</div>}

      <div className="wcraft">
        <div className="wcraft-h">
          <span className="wcraft-label">{g.materials.length ? "제작 재료" : "획득"}</span>
          {g.area_ko && <span className="warea">📍 {g.area_ko}</span>}
        </div>
        <div className="wmats">
          {g.materials.map((m) => (
            <span className="wmat" key={m.id} title={m.src_detail || m.name_en}>
              {m.name_ko} <b>{matAmount(m)}</b>
              {m.src_type && <i className="msrc">{m.src_type}</i>}
            </span>
          ))}
          {!g.materials.length && (g.drops.length
            ? <span className="muted">드롭: {g.drops.join(", ")}</span>
            : <span className="muted">제작 불가 (드롭/기타)</span>)}
        </div>
      </div>
    </article>
  );
}
