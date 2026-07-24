import { z } from "zod";
import type { FieldConfig, ItemTypeConfig } from "./itemTypes";
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
      return field.required
        ? z.coerce.number({ error: `${field.label} must be a number.` })
        : z.union([z.coerce.number(), z.literal("")]).optional();
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
    shape[field.key] = zodForField(field);
  }
  return z.object(shape);
}

/** Pulls raw values out of FormData according to the field config, handling
 * checkboxes (absent when unchecked) and blank-optional numbers/dates. */
export function extractFormValues(
  config: ItemTypeConfig,
  formData: FormData
): Record<string, unknown> {
  const raw: Record<string, unknown> = {};
  for (const field of config.fields) {
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
    const value = result.data[field.key];
    data[field.key] = value === "" ? null : value;
  }
  return { success: true, data };
}
