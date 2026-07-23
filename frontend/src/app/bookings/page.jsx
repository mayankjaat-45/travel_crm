import { Suspense } from "react";
import BookingsClient from "./BookingsClient";

export default function BookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="rounded-2xl bg-white px-6 py-4 text-sm font-bold text-slate-600 shadow">
            Loading bookings...
          </div>
        </div>
      }
    >
      <BookingsClient />
    </Suspense>
  );
}
