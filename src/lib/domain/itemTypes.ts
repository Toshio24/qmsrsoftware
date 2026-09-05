import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  CheckSquare,
  ClipboardCheck,
  ClipboardList,
  Cog,
  FileInput,
  FileOutput,
  FileText,
  GraduationCap,
  MessageSquareWarning,
  Search,
  ShieldCheck,
  Truck,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { ItemType } from "@/generated/prisma/enums";

export type FieldKind =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "url"
  | "boolean"
  | "select";

export type SelectOption = { value: string; label: string };

export type FieldConfig = {
  key: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  options?: SelectOption[];
  helpText?: string;
  /** For "text" fields: offer previously-entered values for this field (on
   * this item type) as suggestions, so users can reuse an existing category
   * instead of retyping it exactly — while still allowing a new value. */
  suggestFromExisting?: boolean;
};

export type ItemTypeConfig = {
  type: ItemType;
  slug: string;
  label: string;
  pluralLabel: string;
  codePrefix: string;
  icon: LucideIcon;
  /** Field whose value seeds TraceItem.title (truncated if long). */
  titleField: string;
  fields: FieldConfig[];
};

export const itemTypeRegistry: ItemTypeConfig[] = [
  {
    type: ItemType.RISK_ITEM,
    slug: "risks",
    label: "Planning & Risk Document",
    pluralLabel: "Planning & Risk Documents",
    codePrefix: "RI",
    icon: AlertTriangle,
    titleField: "hazard",
    fields: [
      { key: "hazard", label: "Hazard", kind: "text", required: true },
      {
        key: "hazardousSituation",
        label: "Hazardous situation",
        kind: "textarea",
        required: true,
      },
      { key: "harm", label: "Harm", kind: "text", required: true },
      { key: "severityInitial", label: "Severity (initial)", kind: "number", required: true },
      {
        key: "probabilityInitial",
        label: "Probability (initial)",
        kind: "number",
        required: true,
      },
      { key: "rpnInitial", label: "RPN (initial)", kind: "number", required: true },
      { key: "severityResidual", label: "Severity (residual)", kind: "number" },
      { key: "probabilityResidual", label: "Probability (residual)", kind: "number" },
      { key: "rpnResidual", label: "RPN (residual)", kind: "number" },
    ],
  },
  {
    type: ItemType.USER_NEED,
    slug: "user-needs",
    label: "User Need",
    pluralLabel: "User Needs",
    codePrefix: "UN",
    icon: ClipboardList,
    titleField: "needText",
    fields: [
      { key: "needText", label: "Need", kind: "textarea", required: true },
      { key: "rationale", label: "Rationale", kind: "textarea" },
      { key: "category", label: "Category", kind: "text", suggestFromExisting: true },
      {
        key: "source",
        label: "Source",
        kind: "text",
        helpText: "Who this need came from, e.g. a surgeon, sales, or a regulatory requirement.",
      },
    ],
  },
  {
    type: ItemType.DESIGN_INPUT,
    slug: "design-inputs",
    label: "Design Input",
    pluralLabel: "Design Inputs",
    codePrefix: "DI",
    icon: FileInput,
    titleField: "requirementText",
    fields: [
      { key: "requirementText", label: "Requirement", kind: "textarea", required: true },
      { key: "acceptanceCriteria", label: "Acceptance criteria", kind: "textarea" },
      { key: "category", label: "Category", kind: "text", suggestFromExisting: true },
      {
        key: "verificationMethod",
        label: "Verification method",
        kind: "select",
        options: [
          { value: "TEST", label: "Test" },
          { value: "ANALYSIS", label: "Analysis" },
          { value: "INSPECTION", label: "Inspection" },
          { value: "DEMONSTRATION", label: "Demonstration" },
        ],
        helpText: "How this requirement will be verified — matches the method recorded on the linked Verification Test.",
      },
    ],
  },
  {
    type: ItemType.DESIGN_OUTPUT,
    slug: "design-outputs",
    label: "Design Output",
    pluralLabel: "Design Outputs",
    codePrefix: "DO",
    icon: FileOutput,
    titleField: "specText",
    fields: [
      { key: "specText", label: "Specification", kind: "textarea", required: true },
      { key: "implementationRef", label: "Implementation reference", kind: "text" },
    ],
  },
  {
    type: ItemType.RISK_CONTROL,
    slug: "risk-controls",
    label: "Risk Control",
    pluralLabel: "Risk Controls",
    codePrefix: "RC",
    icon: ShieldCheck,
    titleField: "description",
    fields: [
      {
        key: "controlType",
        label: "Control type",
        kind: "select",
        required: true,
        options: [
          { value: "DESIGN", label: "Design" },
          { value: "PROTECTIVE", label: "Protective" },
          { value: "INFORMATION", label: "Information" },
        ],
      },
      { key: "description", label: "Description", kind: "textarea", required: true },
      { key: "effectivenessVerified", label: "Effectiveness verified", kind: "boolean" },
    ],
  },
  {
    type: ItemType.VERIFICATION_TEST,
    slug: "verification",
    label: "Verification Test",
    pluralLabel: "Verification Tests",
    codePrefix: "VT",
    icon: CheckSquare,
    titleField: "procedure",
    fields: [
      { key: "procedure", label: "Procedure", kind: "textarea", required: true },
      { key: "acceptanceCriteria", label: "Acceptance criteria", kind: "textarea", required: true },
    ],
  },
  {
    type: ItemType.VALIDATION_TEST,
    slug: "validation",
    label: "Validation Test",
    pluralLabel: "Validation Tests",
    codePrefix: "VA",
    icon: CheckCircle2,
    titleField: "procedure",
    fields: [
      { key: "procedure", label: "Procedure", kind: "textarea", required: true },
      { key: "acceptanceCriteria", label: "Acceptance criteria", kind: "textarea", required: true },
    ],
  },
  {
    type: ItemType.CONTROLLED_DOCUMENT,
    slug: "documents",
    label: "Controlled Document",
    pluralLabel: "Controlled Documents",
    codePrefix: "DOC",
    icon: FileText,
    titleField: "docName",
    fields: [
      { key: "docName", label: "Document name", kind: "text", required: true },
      { key: "controlNumber", label: "Control number", kind: "text", required: true },
      { key: "revision", label: "Revision", kind: "text", required: true },
      {
        key: "googleDocUrl",
        label: "Google Doc link",
        kind: "url",
        helpText: "Pointer to the live, editable document.",
      },
      {
        key: "pdfSnapshotUrl",
        label: "PDF snapshot link",
        kind: "url",
        helpText: "Required before this revision can be signed as effective (Phase 5).",
      },
      { key: "effectiveDate", label: "Effective date", kind: "date" },
      { key: "reviewCycleMonths", label: "Review cycle (months)", kind: "number" },
    ],
  },
  {
    type: ItemType.SUPPLIER,
    slug: "suppliers",
    label: "Supplier",
    pluralLabel: "Suppliers",
    codePrefix: "SUP",
    icon: Truck,
    titleField: "name",
    fields: [
      { key: "name", label: "Name", kind: "text", required: true },
      { key: "category", label: "Category", kind: "text", suggestFromExisting: true },
      { key: "contactName", label: "Contact name", kind: "text" },
      { key: "contactEmail", label: "Contact email", kind: "text" },
      {
        key: "approvalStatus",
        label: "Approval status",
        kind: "select",
        required: true,
        options: [
          { value: "PENDING", label: "Pending" },
          { value: "APPROVED", label: "Approved" },
          { value: "CONDITIONAL", label: "Conditional" },
          { value: "DISQUALIFIED", label: "Disqualified" },
        ],
      },
      { key: "qualificationDate", label: "Qualification date", kind: "date" },
      { key: "requalificationDueDate", label: "Requalification due", kind: "date" },
    ],
  },
  {
    type: ItemType.SUPPLIER_AUDIT,
    slug: "supplier-audits",
    label: "Supplier Audit",
    pluralLabel: "Supplier Audits",
    codePrefix: "SAU",
    icon: ClipboardCheck,
    titleField: "findingsSummary",
    fields: [
      { key: "auditDate", label: "Audit date", kind: "date", required: true },
      {
        key: "auditType",
        label: "Audit type",
        kind: "select",
        required: true,
        options: [
          { value: "ONSITE", label: "Onsite" },
          { value: "REMOTE", label: "Remote" },
          { value: "DOCUMENT_REVIEW", label: "Document review" },
        ],
      },
      { key: "findingsSummary", label: "Findings summary", kind: "textarea", required: true },
      { key: "score", label: "Score", kind: "number" },
      { key: "correctiveActionRequired", label: "Corrective action required", kind: "boolean" },
    ],
  },
  {
    type: ItemType.CAPA,
    slug: "capas",
    label: "CAPA",
    pluralLabel: "CAPAs",
    codePrefix: "CAPA",
    icon: Wrench,
    titleField: "description",
    fields: [
      {
        key: "capaType",
        label: "Type",
        kind: "select",
        required: true,
        options: [
          { value: "CORRECTIVE", label: "Corrective" },
          { value: "PREVENTIVE", label: "Preventive" },
        ],
      },
      { key: "description", label: "Description", kind: "textarea", required: true },
      { key: "rootCause", label: "Root cause", kind: "textarea" },
      { key: "actionPlan", label: "Action plan", kind: "textarea" },
      { key: "dueDate", label: "Due date", kind: "date" },
      { key: "effectivenessCheckDate", label: "Effectiveness check date", kind: "date" },
      { key: "effectivenessResult", label: "Effectiveness result", kind: "text" },
    ],
  },
  {
    type: ItemType.NONCONFORMANCE,
    slug: "nonconformances",
    label: "Nonconformance",
    pluralLabel: "Nonconformances",
    codePrefix: "NCR",
    icon: AlertOctagon,
    titleField: "description",
    fields: [
      { key: "description", label: "Description", kind: "textarea", required: true },
      { key: "detectedDate", label: "Detected date", kind: "date", required: true },
      {
        key: "dispositionType",
        label: "Disposition type",
        kind: "select",
        options: [
          { value: "USE_AS_IS", label: "Use as is" },
          { value: "REWORK", label: "Rework" },
          { value: "SCRAP", label: "Scrap" },
          { value: "RETURN_TO_SUPPLIER", label: "Return to supplier" },
        ],
      },
      { key: "disposition", label: "Disposition notes", kind: "textarea" },
      { key: "severity", label: "Severity", kind: "text" },
    ],
  },
  {
    type: ItemType.COMPLAINT,
    slug: "complaints",
    label: "Complaint",
    pluralLabel: "Complaints",
    codePrefix: "COMP",
    icon: MessageSquareWarning,
    titleField: "description",
    fields: [
      { key: "receivedDate", label: "Received date", kind: "date", required: true },
      { key: "description", label: "Description", kind: "textarea", required: true },
      {
        key: "isReportable",
        label: "Reportable (e.g. MDR)",
        kind: "boolean",
        helpText: "Records a QA determination — this field doesn't make that determination for you.",
      },
      { key: "investigationSummary", label: "Investigation summary", kind: "textarea" },
    ],
  },
  {
    type: ItemType.INTERNAL_AUDIT,
    slug: "internal-audits",
    label: "Internal Audit",
    pluralLabel: "Internal Audits",
    codePrefix: "IA",
    icon: Search,
    titleField: "scope",
    fields: [
      { key: "auditDate", label: "Audit date", kind: "date", required: true },
      { key: "scope", label: "Scope", kind: "textarea", required: true },
      { key: "auditorName", label: "Auditor name", kind: "text", required: true },
      { key: "findingsSummary", label: "Findings summary", kind: "textarea" },
    ],
  },
  {
    type: ItemType.MANAGEMENT_REVIEW,
    slug: "management-reviews",
    label: "Management Review",
    pluralLabel: "Management Reviews",
    codePrefix: "MR",
    icon: Users,
    titleField: "summary",
    fields: [
      { key: "reviewDate", label: "Review date", kind: "date", required: true },
      { key: "attendees", label: "Attendees", kind: "textarea" },
      { key: "summary", label: "Summary", kind: "textarea", required: true },
      { key: "actionItems", label: "Action items", kind: "textarea" },
    ],
  },
  {
    type: ItemType.TRAINING_RECORD,
    slug: "training-records",
    label: "Training Record",
    pluralLabel: "Training Records",
    codePrefix: "TRN",
    icon: GraduationCap,
    titleField: "trainingTitle",
    fields: [
      { key: "traineeName", label: "Trainee name", kind: "text", required: true },
      { key: "trainingTitle", label: "Training title", kind: "text", required: true },
      { key: "completedDate", label: "Completed date", kind: "date", required: true },
      { key: "expiresDate", label: "Expires date", kind: "date" },
      { key: "method", label: "Method", kind: "text" },
    ],
  },
  {
    type: ItemType.EQUIPMENT,
    slug: "equipment",
    label: "Equipment",
    pluralLabel: "Equipment",
    codePrefix: "EQP",
    icon: Cog,
    titleField: "equipmentName",
    fields: [
      { key: "equipmentName", label: "Equipment name", kind: "text", required: true },
      { key: "assetTag", label: "Asset tag", kind: "text" },
      { key: "calibrationDate", label: "Calibration date", kind: "date" },
      { key: "calibrationDueDate", label: "Calibration due date", kind: "date" },
      { key: "calibratedBy", label: "Calibrated by", kind: "text" },
      { key: "certificateRef", label: "Certificate reference", kind: "text" },
    ],
  },
];

export const itemTypeBySlug: ReadonlyMap<string, ItemTypeConfig> = new Map(
  itemTypeRegistry.map((c) => [c.slug, c])
);

export const itemTypeByType: ReadonlyMap<ItemType, ItemTypeConfig> = new Map(
  itemTypeRegistry.map((c) => [c.type, c])
);

export function getItemTypeConfigBySlug(slug: string): ItemTypeConfig | undefined {
  return itemTypeBySlug.get(slug);
}

export function getItemTypeConfig(type: ItemType): ItemTypeConfig {
  const config = itemTypeByType.get(type);
  if (!config) throw new Error(`No item type config for ${type}`);
  return config;
}

/** Human label for an entityType string that may or may not be an ItemType
 * (AuditLog/ESignature also use non-item entityTypes like "User" or "TraceLink"). */
export function getEntityLabel(entityType: string): string {
  return itemTypeByType.get(entityType as ItemType)?.label ?? entityType;
}

export function deriveTitle(config: ItemTypeConfig, data: Record<string, unknown>): string {
  const raw = data[config.titleField];
  const text = typeof raw === "string" ? raw : String(raw ?? "");
  return text || config.label;
}
