import { Fragment, useState } from "react";

import type { Plan, PlanFeatureCategory } from "../../types/robocall";
import { formatUsd } from "../../utils/format";

/** Categories shown before "Show more". */
const INITIAL_CATEGORIES = 3;

interface FeatureMatrixProps {
  plans: readonly Plan[];
  categories: readonly PlanFeatureCategory[];
}

export function FeatureMatrix({ plans, categories }: FeatureMatrixProps) {
  const [isShowingAll, setIsShowingAll] = useState(false);
  const shown = isShowingAll
    ? categories
    : categories.slice(0, INITIAL_CATEGORIES);
  const hiddenCount = categories.length - INITIAL_CATEGORIES;

  return (
    <>
      {/* Scrolls sideways on phones instead of squashing the columns. */}
      <div style={{ overflowX: "auto" }}>
        <table className="pk-matrix">
          <thead>
            <tr>
              <th scope="col">Feature</th>
              {plans.map((plan) => (
                <th key={plan.id} scope="col">
                  {plan.name}
                  <div
                    className="pk-subtle"
                    style={{ fontWeight: 400, fontSize: "0.6875rem" }}
                  >
                    {`${formatUsd(plan.monthlyUsd)}/mo`}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((category) => (
              <Fragment key={category.category}>
                <tr className="pk-matrix__group">
                  <td colSpan={plans.length + 1}>{category.category}</td>
                </tr>
                {category.rows.map((row) => (
                  <tr key={category.category + row.feature}>
                    <th scope="row">{row.feature}</th>
                    {row.values.map((value, index) => (
                      <td key={plans[index]?.id ?? index}>
                        <MatrixValue value={value} />
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {hiddenCount > 0 ? (
        <div style={{ textAlign: "center" }}>
          <s-button onClick={() => setIsShowingAll((v) => !v)}>
            {isShowingAll
              ? "Show fewer categories"
              : `Show ${hiddenCount} more categories`}
          </s-button>
        </div>
      ) : null}
    </>
  );
}

function MatrixValue({ value }: { value: string | boolean }) {
  if (value === true)
    return <s-icon type="check" tone="success" size="small" />;
  if (value === false) {
    return (
      <span className="pk-subtle" aria-label="Not included">
        —
      </span>
    );
  }
  return <span style={{ fontVariantNumeric: "tabular-nums" }}>{value}</span>;
}
