import "server-only";
import { stringify } from "csv-stringify/sync";
import { getDhfSections } from "@/lib/server/repository/dhf";

export async function buildDhfCsv(productId?: string): Promise<string> {
  const sections = await getDhfSections(productId);

  const rows = sections.flatMap((section) =>
    section.items.map((item) => ({
      Section: section.label,
      Code: item.humanCode,
      Title: item.title,
      Status: item.status,
      Version: item.versionNumber,
    }))
  );

  return stringify(rows, { header: true });
}
