"use client";

import { useMemo, useState } from "react";
import { RARITY } from "@/lib/combine";
import { WCLASS_COLOR, WCLASS_LABEL, matAmount, type Weapon } from "@/lib/weapons";
import WEAPONS from "@/public/data/weapons.json";
import WICONS from "@/public/weapon-icons/manifest.json";

const list = WEAPONS as Weapon[];
const wicon = (id: string): string | undefined => (WICONS as Record<string, string>)[id];

const CLASSES: ("all" | Weapon["damage_class"])[] = ["all", "melee", "ranged", "magic"];
const CLASS_TXT: Record<string, string> = { all: "전체", melee: "근접", ranged: "원거리", magic: "마법" };
const SORTS = [
  { key: "level", label: "레벨 낮은순" },
  { key: "level_desc", label: "레벨 높은순" },
  { key: "dmg", label: "공격력 높은순" },
  { key: "name", label: "이름순" },
];

function WIcon({ id, size }: { id: string; size: number }) {
  const src = wicon(id);
  if (!src) return <span className="wic-ph" style={{ width: size, height: size }} aria-hidden />;
  return <img className="wic" src={src} width={size} height={size} alt="" loading="lazy" />;
}

export default function Weapons() {
  const [q, setQ] = useState("");
  const [cls, setCls] = useState<"all" | Weapon["damage_class"]>("all");
  const [sort, setSort] = useState("level");

  const view = useMemo(() => {
    const ql = q.trim().toLowerCase();
    let out = list.filter((w) => {
      if (cls !== "all" && w.damage_class !== cls) return false;
      if (ql) {
        const hay = (w.name_ko + " " + w.name_en + " " + w.materials.map((m) => m.name_ko + m.name_en).join(" ")).toLowerCase();
        if (!hay.includes(ql)) return false;
      }
      return true;
    });
    out = [...out];
    if (sort === "level") out.sort((a, b) => (a.level ?? 0) - (b.level ?? 0) || a.name_ko.localeCompare(b.name_ko));
    else if (sort === "level_desc") out.sort((a, b) => (b.level ?? 0) - (a.level ?? 0));
    else if (sort === "dmg") out.sort((a, b) => (b.dmg_base ?? -1) - (a.dmg_base ?? -1));
    else if (sort === "name") out.sort((a, b) => a.name_ko.localeCompare(b.name_ko));
    return out;
  }, [q, cls, sort]);

  return (
    <>
      <p className="hint">
        무기 {list.length}종 · 등급·레벨·공격력과 <b>제작 재료 · 파밍 지역</b>까지. 데이터는 코어 키퍼 위키에서 수집.
      </p>

      <div className="controls">
        <input className="search" placeholder="무기·재료 검색 (예: 검, 갤럭사이트, 구리)" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="sort" value={sort} onChange={(e) => setSort(e.target.value)}>
          {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </div>

      <div className="chips">
        {CLASSES.map((c) => (
          <button
            key={c}
            className={"chip" + (cls === c ? " on" : "")}
            onClick={() => setCls(c)}
            style={c !== "all" && cls !== c ? { borderColor: WCLASS_COLOR[c] + "66" } : undefined}
          >
            {c !== "all" && <i className="dot" style={{ background: WCLASS_COLOR[c] }} />} {CLASS_TXT[c]}
          </button>
        ))}
        <span className="reslabel">{view.length}종</span>
      </div>

      <div className="wgrid">
        {view.map((w) => <WCard key={w.id} w={w} />)}
        {!view.length && <p className="muted pad">조건에 맞는 무기가 없습니다.</p>}
      </div>
    </>
  );
}

function WCard({ w }: { w: Weapon }) {
  const [rn, rc] = RARITY[w.rarity] ?? ["", "#999"];
  const cc = WCLASS_COLOR[w.damage_class];
  return (
    <article className="wcard" style={{ borderColor: rc }}>
      <div className="wcard-head">
        <WIcon id={w.id} size={40} />
        <div className="wcard-title">
          <div className="wcard-name">{w.name_ko}</div>
          <div className="wcard-en">{w.name_en}</div>
        </div>
        <span className="wcard-lv">Lv {w.level ?? "?"}</span>
      </div>

      <div className="wcard-badges">
        <span className="wbadge" style={{ color: cc, borderColor: cc + "88" }}>
          <i className="dot" style={{ background: cc }} /> {WCLASS_LABEL[w.damage_class]}
        </span>
        <span className="wbadge" style={{ color: rc, borderColor: rc + "88" }}>{rn}</span>
      </div>

      <div className="wstats">
        <div className="wstat"><span>공격력</span><b>{w.dmg_base != null ? w.dmg_base : "—"}{w.dmg_max != null && w.dmg_max !== w.dmg_base ? <em> → {w.dmg_max} (Lv20)</em> : null}</b></div>
        <div className="wstat"><span>공격속도</span><b>{w.atk_rate != null ? w.atk_rate + "/초" : "—"}</b></div>
        <div className="wstat"><span>내구도</span><b>{w.durability ?? "—"}</b></div>
        <div className="wstat"><span>판매가</span><b>{w.sell != null ? w.sell + "💰" : "—"}</b></div>
      </div>

      {!!w.desc_en && <div className="wdesc">“{w.desc_en}”</div>}

      <div className="wcraft">
        <div className="wcraft-h">
          <span className="wcraft-label">제작 재료</span>
          {w.area_ko && <span className="warea">📍 {w.area_ko}</span>}
        </div>
        <div className="wmats">
          {w.materials.map((m) => (
            <span className="wmat" key={m.id} title={m.name_en}>
              {m.name_ko} <b>{matAmount(m)}</b>
            </span>
          ))}
          {!w.materials.length && <span className="muted">—</span>}
        </div>
      </div>
    </article>
  );
}
