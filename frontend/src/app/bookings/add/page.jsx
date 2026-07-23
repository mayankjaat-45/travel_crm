import { Suspense } from "react";
import AddBookingClient from "./AddBookingClient ";

export default function AddBookingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="rounded-2xl bg-white px-6 py-4 text-sm font-bold text-slate-600 shadow">
            Loading add booking...
          </div>
        </div>
      }
    >
      <AddBookingClient/>
    </Suspense>
  );
}
