import { Suspense } from "react";
import AddQuotationClient from "./AddQuotationClient";

export default function AddQuotationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="rounded-2xl bg-white px-6 py-4 text-sm font-bold text-slate-600 shadow">
            Loading add quotation...
          </div>
        </div>
      }
    >
      <AddQuotationClient/>
    </Suspense>
  );
}
