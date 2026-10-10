import { requireRole } from "@/lib/auth/session";
import { UserRole } from "@/generated/prisma/enums";
import { db } from "@/lib/server/db";
import { listProducts } from "@/lib/server/repository/products";
import { CreateProductForm } from "./create-product-form";

export default async function AdminProductsPage() {
  await requireRole([UserRole.ADMIN]);

  const products = await listProducts();
  const counts = await Promise.all(
    products.map((product) => db.traceItem.count({ where: { productId: product.id } }))
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Products</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Each product gets its own Design Control and Risk Management records and folders —
          switch between them from the sidebar. Suppliers, CAPAs, audits, and the other
          Quality Operations records stay shared across every product.
        </p>
      </div>

      <CreateProductForm />

      <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
        <table className="w-full max-w-md text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Records</th>
              <th className="px-3 py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, i) => (
              <tr key={product.id} className="border-b border-neutral-100 last:border-0 dark:border-neutral-900">
                <td className="px-3 py-2 font-medium">{product.name}</td>
                <td className="px-3 py-2 tabular-nums text-neutral-500">{counts[i]}</td>
                <td className="px-3 py-2 text-neutral-500">{product.createdAt.toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
