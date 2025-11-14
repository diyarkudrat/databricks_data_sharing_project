import { fetchWarehouses } from "@/lib/backend";
import type { Warehouse } from "@/types/warehouses";
import { QueryRunner } from "@/components/QueryRunner";

export default async function Home() {
  let warehouses: Warehouse[] = [];
  let error: string | null = null;

  try {
    warehouses = await fetchWarehouses();
  } catch (err) {
    error =
      err instanceof Error
        ? err.message
        : "Failed to load warehouses from backend.";
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-zinc-50 px-6 py-16 font-sans dark:bg-black">
      <section className="w-full max-w-xl rounded-lg bg-white p-6 shadow-sm dark:bg-zinc-900">
        <h1 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Databricks Warehouses
        </h1>
        <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
          This page calls the backend <code>/api/warehouses</code> endpoint and
          displays the list of warehouse names.
        </p>

        {error ? (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200">
            {error}
          </div>
        ) : warehouses.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No warehouses found.
          </p>
        ) : (
          <ul className="space-y-2">
            {warehouses.map((w) => (
              <li
                key={w.id}
                className="rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-900 shadow-sm dark:border-zinc-700 dark:text-zinc-50"
              >
                <div className="font-medium">
                  {w.name || "(unnamed warehouse)"}
                </div>
                <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                  <div>
                    <span className="font-semibold">ID:</span> {w.id || "—"}
                  </div>
                  <div>
                    <span className="font-semibold">State:</span>{" "}
                    {w.state || "unknown"}
                  </div>
                  <div>
                    <span className="font-semibold">Size:</span>{" "}
                    {w.size || "unknown"}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <QueryRunner />
    </main>
  );
}
