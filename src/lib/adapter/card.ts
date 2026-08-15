import { computeFork } from "./fork";
import type { AdapterReport, CompareReport } from "./types";

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(next).width > max && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

export async function renderReadingCard(
  report: AdapterReport,
  compare: CompareReport | null,
): Promise<Blob> {
  const w = 1080;
  const h = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");

  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      /* ignore */
    }
  }

  const fork = computeFork(report);
  ctx.fillStyle = "#09090b";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#111114";
  ctx.fillRect(48, 48, w - 96, h - 96);

  ctx.fillStyle = "#6b675f";
  ctx.font = "500 22px 'IBM Plex Sans', system-ui, sans-serif";
  ctx.fillText("MERIDIAN  ·  A READING", 96, 130);

  ctx.fillStyle = "#f2efe8";
  ctx.font = "500 64px Newsreader, 'Iowan Old Style', Palatino, serif";
  const titleLines = wrap(ctx, report.title, w - 192);
  let y = 210;
  for (const line of titleLines.slice(0, 2)) {
    ctx.fillText(line, 96, y);
    y += 74;
  }

  ctx.fillStyle = "#9a968c";
  ctx.font = "400 28px Newsreader, Palatino, serif";
  y += 16;
  for (const line of wrap(ctx, `From here: ${report.horizon.nextTitle}`, w - 192).slice(0, 2)) {
    ctx.fillText(line, 96, y);
    y += 40;
  }

  y += 24;
  ctx.fillStyle = "#6b675f";
  ctx.font = "400 22px 'IBM Plex Sans', system-ui, sans-serif";
  for (const line of wrap(ctx, report.horizon.reading, w - 192).slice(0, 4)) {
    ctx.fillText(line, 96, y);
    y += 32;
  }

  y += 36;
  for (const o of report.outcomes) {
    const tag =
      o.kind === "known" ? "#8aa392" : o.kind === "perceived" ? "#8a96a3" : "#c4a574";
    ctx.fillStyle = tag;
    ctx.beginPath();
    ctx.arc(108, y - 6, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f2efe8";
    ctx.font = "500 26px Newsreader, Palatino, serif";
    ctx.fillText(o.title, 132, y);
    ctx.fillStyle = "#6b675f";
    ctx.font = "400 20px 'IBM Plex Mono', ui-monospace, monospace";
    ctx.fillText(`${o.low.toFixed(2)}–${o.high.toFixed(2)}  ${o.kind}`, 132, y + 28);
    y += 72;
  }

  y += 12;
  ctx.fillStyle = "#26252a";
  ctx.fillRect(96, y, w - 192, 1);
  y += 48;

  ctx.fillStyle = "#9a968c";
  ctx.font = "400 22px 'IBM Plex Sans', system-ui, sans-serif";
  const meta = [
    `Continuity ${report.continuity.toFixed(2)}   ·   Jump risk ${report.hallucinationRisk.toFixed(2)}`,
    fork.refuse
      ? `Refuse  V = ${fork.stayV?.toFixed(2)}  — the next step does not pay.`
      : `Advice  ${fork.advice}   ·   ${fork.stayTitle}`,
    `δ² ${report.sheaf.coboundaryNilpotent ? "nilpotent" : "fails"}   ·   |K| ${report.sheaf.meanHolonomy.toFixed(3)}   ·   H₀ ${report.persistence.longLived} long`,
  ];
  if (compare) meta.push(`Held against ${compare.heldTitle}: ${compare.verdict}`);
  for (const line of meta) {
    ctx.fillText(line, 96, y);
    y += 34;
  }

  ctx.fillStyle = "#6b675f";
  ctx.font = "italic 24px Newsreader, Palatino, serif";
  ctx.fillText("This is a reading, not a law.", 96, h - 96);

  return await new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("blob"))), "image/png");
  });
}

export async function downloadReadingCard(
  report: AdapterReport,
  compare: CompareReport | null,
) {
  const blob = await renderReadingCard(report, compare);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `meridian-${report.source}-reading.png`;
  a.click();
  URL.revokeObjectURL(url);
}
