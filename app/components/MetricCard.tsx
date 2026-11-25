interface MetricCardProps {
  label: string;
  value: string;
  /** Change vs the previous period. null = no badge. */
  change: number | null;
  /** "%" for relative change (orders), " pts" for rate differences (72% → 75%). */
  changeUnit?: "%" | " pts";
  /** Small line under the number, e.g. "21 in previous 7 days". */
  hint: string;
  /** For most metrics up is good. Set false for metrics where up is bad. */
  higherIsBetter?: boolean;
}

// KPI tile, same look as the Kpi tile in Reviews Junction and Loyalty.
export function MetricCard({
  label,
  value,
  change,
  changeUnit = "%",
  hint,
  higherIsBetter = true,
}: MetricCardProps) {
  return (
    <div className="pk-kpi">
      <div className="pk-kpi__label">{label}</div>
      <div className="pk-row pk-row--tight" style={{ alignItems: "baseline" }}>
        <span className="pk-kpi__value">{value}</span>
        <ChangePill
          change={change}
          unit={changeUnit}
          higherIsBetter={higherIsBetter}
        />
      </div>
      <div className="pk-kpi__foot">{hint}</div>
    </div>
  );
}

function ChangePill({
  change,
  unit,
  higherIsBetter,
}: {
  change: number | null;
  unit: string;
  higherIsBetter: boolean;
}) {
  if (change === null || change === 0) return null;
  const isGood = change > 0 === higherIsBetter;
  const sign = change > 0 ? "+" : "−";
  return (
    <span className={`pk-delta ${isGood ? "pk-delta--up" : "pk-delta--down"}`}>
      {`${sign}${Math.abs(change)}${unit}`}
    </span>
  );
}
