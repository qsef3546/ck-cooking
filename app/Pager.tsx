"use client";

/** 1 … (cur-1) cur (cur+1) … total 형태의 페이지 번호 배열 */
export function pageList(cur: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  const s = Math.max(2, cur - 1), e = Math.min(total - 1, cur + 1);
  if (s > 2) out.push("…");
  for (let i = s; i <= e; i++) out.push(i);
  if (e < total - 1) out.push("…");
  out.push(total);
  return out;
}

export function Pager({ page, pages, onGo }: { page: number; pages: number; onGo: (n: number) => void }) {
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
