"use client";

import { useState } from "react";
import type { Build, BuildItem } from "@/lib/builds";
import BUILDS from "@/public/data/builds.json";

const builds = BUILDS as Build[];

function Item({ it }: { it: BuildItem }) {
  return (
    <span className="bd-item" title={it.name_en || it.name_ko}>
      {it.icon ? <img className="wic" src={it.icon} width={22} height={22} alt="" loading="lazy" /> : <span className="bd-dot" />}
      <span className="bd-item-name">{it.name_ko}</span>
      {it.effect && <em className="bd-item-eff">{it.effect}</em>}
      {it.note && <em className="bd-item-note">{it.note}</em>}
    </span>
  );
}

function Slot({ label, items }: { label: string; items: BuildItem[] }) {
  if (!items.length) return null;
  return (
    <div className="bd-slot">
      <div className="bd-slot-label">{label}</div>
      <div className="bd-items">{items.map((it, i) => <Item it={it} key={i} />)}</div>
    </div>
  );
}

export default function Builds() {
  const [sel, setSel] = useState(builds[0]?.id);
  const b = builds.find((x) => x.id === sel) || builds[0];

  return (
    <>
      <p className="hint">
        플레이스타일별 <b>커뮤니티 추천 무기·방어구·장신구·음식 세트</b>. 여러 가이드/포럼을 종합했어요 (패치·운에 따라 달라질 수 있음).
      </p>

      <div className="bd-tabs">
        {builds.map((x) => (
          <button
            key={x.id}
            className={"bd-tab" + (x.id === sel ? " on" : "")}
            onClick={() => setSel(x.id)}
            style={x.id === sel ? { borderColor: x.color, color: x.color } : undefined}
          >
            {x.emoji} {x.title}
          </button>
        ))}
      </div>

      {b && (
        <article className="bd-card" style={{ borderColor: b.color }}>
          <div className="bd-head">
            <h3 className="bd-title" style={{ color: b.color }}>{b.emoji} {b.title}</h3>
          </div>
          <p className="bd-summary">{b.summary}</p>

          <div className="bd-stats">
            <span className="bd-slot-label">핵심 스탯</span>
            {b.stats.map((s, i) => <span className="bd-stat" key={i} style={{ borderColor: b.color + "66" }}>{s}</span>)}
          </div>

          <div className="bd-slots">
            <Slot label="🗡️ 무기" items={b.weapons} />
            <Slot label="🛡️ 방어구" items={b.armor} />
            <Slot label="💍 장신구" items={b.accessories} />
            <Slot label="🍳 음식" items={b.food} />
          </div>

          {!!b.tips.length && (
            <div className="bd-slot">
              <div className="bd-slot-label">💡 팁</div>
              <ul className="bd-tips">{b.tips.map((t, i) => <li key={i}>{t}</li>)}</ul>
            </div>
          )}

          <div className="bd-sources">
            출처: {b.sources.map((s, i) => (
              <span key={i}>
                {i > 0 && " · "}
                <a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a>
              </span>
            ))}
          </div>
        </article>
      )}
    </>
  );
}
