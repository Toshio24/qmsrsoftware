import { z } from "zod";
import { computedFieldResolvers, type FieldConfig, type ItemTypeConfig } from "./itemTypes";
import { normalizeUrl } from "./url";

function zodForField(field: FieldConfig): z.ZodTypeAny {
  switch (field.kind) {
    case "url": {
      const base = z.string().transform(normalizeUrl);
      return field.required
        ? base.refine((v) => v.length > 0, { message: `${field.label} is required.` })
        : base.optional();
    }
    case "text":
    case "textarea":
    case "select":
      return field.required
        ? z.string().min(1, `${field.label} is required.`)
        : z.string().optional();
    case "number":
      // Note: literal("") must come first — z.coerce.number() happily
      // coerces "" to 0 (Number("") === 0) rather than failing, so if it ran
      // first in the union an untouched optional field would silently save
      // as 0 instead of staying null.
      return field.required
        ? z.coerce.number({ error: `${field.label} must be a number.` })
        : z.union([z.literal(""), z.coerce.number()]).optional();
    case "date":
      return field.required
        ? z.coerce.date({ error: `${field.label} is required.` })
        : z.union([z.coerce.date(), z.literal("")]).optional();
    case "boolean":
      return z.boolean();
  }
}

export function buildItemSchema(config: ItemTypeConfig) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of config.fields) {
    if (field.computed) continue; // derived after parsing, never submitted
    shape[field.key] = zodForField(field);
  }
  return z.object(shape);
}

/** Pulls raw values out of FormData according to the field config, handling
 * checkboxes (absent when unchecked) and blank-optional numbers/dates.
 * Computed fields (see FieldConfig.computed) aren't rendered as inputs, so
 * they're never read from the submitted form here. */
export function extractFormValues(
  config: ItemTypeConfig,
  formData: FormData
): Record<string, unknown> {
  const raw: Record<string, unknown> = {};
  for (const field of config.fields) {
    if (field.computed) continue;
    if (field.kind === "boolean") {
      raw[field.key] = formData.get(field.key) === "on";
    } else {
      const value = formData.get(field.key);
      raw[field.key] = value === null ? "" : value;
    }
  }
  return raw;
}

export type ParsedItemForm =
  | { success: true; data: Record<string, unknown> }
  | { success: false; error: string };

export function parseItemForm(config: ItemTypeConfig, formData: FormData): ParsedItemForm {
  const schema = buildItemSchema(config);
  const raw = extractFormValues(config, formData);
  const result = schema.safeParse(raw);
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Invalid input.";
    return { success: false, error: message };
  }

  const data: Record<string, unknown> = {};
  for (const field of config.fields) {
    if (field.computed) continue;
    const value = result.data[field.key];
    data[field.key] = value === "" ? null : value;
  }
  // Second pass: computed fields derive from the already-normalized values
  // above (so e.g. a severity select's "3" has already become the number 3).
  // The resolvers themselves live outside FieldConfig (see
  // computedFieldResolvers in itemTypes.ts) so this module's functions never
  // have to cross into a Client Component as a prop.
  const resolvers = computedFieldResolvers[config.type] ?? {};
  for (const field of config.fields) {
    if (field.computed) data[field.key] = resolvers[field.key]?.compute(data) ?? null;
  }
  return { success: true, data };
}
