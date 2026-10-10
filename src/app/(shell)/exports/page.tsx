import { requireUser } from "@/lib/auth/session";
import { getCurrentProduct } from "@/lib/auth/currentProduct";
import { FileSpreadsheet, FileText } from "lucide-react";

function ExportCard({
  title,
  description,
  csvHref,
  pdfHref,
}: {
  title: string;
  description: string;
  csvHref: string;
  pdfHref: string;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-neutral-500">{description}</p>
      <div className="mt-4 flex gap-2">
        <a
          href={csvHref}
          className="inline-flex items-center gap-2 rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:border-neutral-400 dark:border-neutral-700 dark:hover:border-neutral-600"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Download CSV
        </a>
        <a
          href={pdfHref}
          className="inline-flex items-center gap-2 rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:border-neutral-400 dark:border-neutral-700 dark:hover:border-neutral-600"
        >
          <FileText className="h-4 w-4" />
          Download PDF
        </a>
      </div>
    </div>
  );
}

export default async function ExportsPage() {
  await requireUser();
  const product = await getCurrentProduct();

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">Exports</h1>
          {product && (
            <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-xs font-medium text-white dark:bg-neutral-100 dark:text-neutral-900">
              {product.name}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-neutral-500">
          Every export is itself recorded in the audit log — who generated what, and when.
          The Design History File and Risk Register are specific to{" "}
          {product ? product.name : "the current product"}; the Trace Matrix and Coverage
          Gap Report also include every shared Quality Operations record.
        </p>
      </div>

      <ExportCard
        title="Trace Matrix"
        description="Every item, its status, and its trace links (CSV includes both outgoing and incoming; PDF shows outgoing)."
        csvHref="/api/exports/matrix/csv"
        pdfHref="/api/exports/matrix/pdf"
      />

      <ExportCard
        title="Coverage Gap Report"
        description="Design-control coverage checks, with the specific items still missing a required link."
        csvHref="/api/exports/gaps/csv"
        pdfHref="/api/exports/gaps/pdf"
      />

      <ExportCard
        title="Design History File"
        description="The Design & Development Plan plus every User Need, Design Input/Output, V&V test, and Controlled Document, with status and version."
        csvHref="/api/exports/dhf/csv"
        pdfHref="/api/exports/dhf/pdf"
      />

      <ExportCard
        title="Risk Register"
        description="Every Risk Analysis with its initial/residual severity, probability, RPN, acceptability verdict, and mitigating controls."
        csvHref="/api/exports/risk-register/csv"
        pdfHref="/api/exports/risk-register/pdf"
      />
    </div>
  );
}
