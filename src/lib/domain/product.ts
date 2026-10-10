/** `-laprotator`, or `""` when there's no current product — appended to an
 * export's filename so two products' downloads never collide/overwrite each
 * other in a Downloads folder. */
export function exportFilenamePart(product: { name: string } | null | undefined): string {
  if (!product) return "";
  const slug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug ? `-${slug}` : "";
}
