import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PersistenceReport } from "@/lib/adapter/types";

export function BettiChart({ persistence }: { persistence: PersistenceReport }) {
  const data = persistence.bettiCurve.map((p, i) => ({
    i,
    r: Number(p.r.toFixed(2)),
    b0: p.b0,
    b1: p.b1,
  }));
  if (data.length < 2) return null;
  return (
    <div className="h-28">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}>
          <XAxis dataKey="r" tick={{ fill: "#6b675f", fontSize: 10 }} />
          <YAxis allowDecimals={false} tick={{ fill: "#6b675f", fontSize: 10 }} />
          <Tooltip
            contentStyle={{
              background: "#18181c",
              border: "1px solid #26252a",
              fontSize: 11,
              color: "#f2efe8",
            }}
          />
          <Line type="stepAfter" dataKey="b0" stroke="#d7d2c8" strokeWidth={1.4} dot={false} />
          <Line type="stepAfter" dataKey="b1" stroke="#8a96a3" strokeWidth={1.2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
