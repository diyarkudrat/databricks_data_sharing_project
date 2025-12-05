import { DataShareManager } from "@/app/components/DataShareManager";
import Link from "next/link";

export default function SyncPage() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-zinc-50 px-6 py-16 font-sans dark:bg-black">
      <div className="w-full max-w-3xl mb-6">
        <Link 
          href="/"
          className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1"
        >
          ← Back to Dashboard
        </Link>
      </div>
      
      <section className="w-full max-w-3xl mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
          Data Synchronization
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Manage the data transfer pipeline from Databricks to Snowflake.
        </p>
      </section>

      <DataShareManager />
    </main>
  );
}
