import {
  ACCEPTABILITY_BADGE_CLASSES,
  ACCEPTABILITY_LABEL,
  PROBABILITY_LEVELS,
  SEVERITY_LEVELS,
  classifyRisk,
  levelLabel,
} from "@/lib/domain/riskMatrix";

/** The six severity/probability/RPN fields rendered here instead of in the
 * generic field list on the item detail page (see page.tsx). */
export const RISK_SCORE_FIELD_KEYS = [
  "severityInitial",
  "probabilityInitial",
  "rpnInitial",
  "severityResidual",
  "probabilityResidual",
  "rpnResidual",
] as const;

function RiskColumn({
  heading,
  severity,
  probability,
  rpn,
}: {
  heading: string;
  severity: number | null;
  probability: number | null;
  rpn: number | null;
}) {
  const acceptability = classifyRisk(severity, probability);

  return (
    <div className="flex-1 rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{heading}</p>
      <dl className="mt-2 flex flex-col gap-1.5 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-neutral-500">Severity</dt>
          <dd>{levelLabel(SEVERITY_LEVELS, severity)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-neutral-500">Probability</dt>
          <dd>{levelLabel(PROBABILITY_LEVELS, probability)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-neutral-500">RPN</dt>
          <dd className="font-semibold tabular-nums">{rpn ?? "—"}</dd>
        </div>
      </dl>
      <div className="mt-3">
        {acceptability ? (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${ACCEPTABILITY_BADGE_CLASSES[acceptability]}`}
          >
            {ACCEPTABILITY_LABEL[acceptability]}
          </span>
        ) : (
          <span className="text-xs text-neutral-400">Not yet assessed</span>
        )}
      </div>
    </div>
  );
}

export function RiskAssessmentPanel({ version }: { version: Record<string, unknown> }) {
  return (
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
        Risk assessment
      </h2>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <RiskColumn
          heading="Initial risk"
          severity={version.severityInitial as number | null}
          probability={version.probabilityInitial as number | null}
          rpn={version.rpnInitial as number | null}
        />
        <RiskColumn
          heading="Residual risk"
          severity={version.severityResidual as number | null}
          probability={version.probabilityResidual as number | null}
          rpn={version.rpnResidual as number | null}
        />
      </div>
    </div>
  );
}
