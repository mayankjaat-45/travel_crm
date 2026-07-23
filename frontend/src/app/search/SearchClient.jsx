"use client";

import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { API } from "@/lib/api";
import {
  BriefcaseBusiness,
  FileText,
  Loader2,
  Search,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const formatMoney = (amount) => {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
};

const formatLabel = (value) => {
  if (!value) return "-";
  return String(value).replaceAll("_", " ");
};

const SearchClient = () => {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("query") || "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState({
    leads: [],
    bookings: [],
    quotations: [],
  });

  const [loading, setLoading] = useState(false);

  const fetchResults = async (searchValue = query) => {
    if (!searchValue.trim()) {
      setResults({
        leads: [],
        bookings: [],
        quotations: [],
      });
      return;
    }

    try {
      setLoading(true);

      const { data } = await API.get("/api/search", {
        params: {
          query: searchValue,
        },
      });

      setResults(
        data?.data || {
          leads: [],
          bookings: [],
          quotations: [],
        },
      );
    } catch (error) {
      toast.error(error.response?.data?.message || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      fetchResults(initialQuery);
    }
  }, [initialQuery]);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchResults(query);
  };

  const totalResults =
    results.leads.length + results.bookings.length + results.quotations.length;

  return (
    <ProtectedRoute>
      <Layout>
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-5 sm:mb-6">
            <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
              Global Search
            </h2>
            <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
              Search leads, bookings and quotations by name, phone, email or
              destination.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-4 md:grid-cols-[1fr_auto]"
          >
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search customer, phone, destination..."
                className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none focus:border-teal-500"
              />
            </div>

            <button
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-black text-white hover:bg-slate-700 disabled:opacity-60"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : null}
              Search
            </button>
          </form>

          {loading ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl bg-white p-8 font-bold text-slate-500 shadow-sm sm:rounded-3xl">
              <Loader2 className="animate-spin" size={18} />
              Searching...
            </div>
          ) : (
            <>
              <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold text-slate-500 shadow-sm sm:rounded-3xl">
                Found{" "}
                <span className="font-black text-slate-900">
                  {totalResults}
                </span>{" "}
                result{totalResults === 1 ? "" : "s"}
                {query ? (
                  <>
                    {" "}
                    for{" "}
                    <span className="font-black text-slate-900">“{query}”</span>
                  </>
                ) : null}
              </div>

              <SearchSection
                title="Leads"
                icon={UserCheck}
                items={results.leads}
                empty="No matching leads found."
                renderItem={(lead) => (
                  <ResultCard
                    key={lead._id}
                    title={lead.name}
                    subtitle={`${lead.destination || "No destination"} • ${
                      lead.phone
                    }`}
                    badge={formatLabel(lead.status)}
                    secondBadge={lead.assignedTo?.name || "Not assigned"}
                    href={`/leads/${lead._id}`}
                    customerPhone={lead.phone}
                  />
                )}
              />

              <SearchSection
                title="Bookings"
                icon={BriefcaseBusiness}
                items={results.bookings}
                empty="No matching bookings found."
                renderItem={(booking) => (
                  <ResultCard
                    key={booking._id}
                    title={booking.customerName}
                    subtitle={`${
                      booking.destination || "No destination"
                    } • ${formatMoney(booking.totalAmount)}`}
                    badge={formatLabel(booking.bookingStatus)}
                    secondBadge={formatLabel(booking.paymentStatus)}
                    href={`/bookings/${booking._id}`}
                    customerPhone={booking.phone}
                  />
                )}
              />

              <SearchSection
                title="Quotations"
                icon={FileText}
                items={results.quotations}
                empty="No matching quotations found."
                renderItem={(quotation) => (
                  <ResultCard
                    key={quotation._id}
                    title={quotation.customerName}
                    subtitle={`${
                      quotation.destination || "No destination"
                    } • ${formatMoney(quotation.totalAmount)}`}
                    badge={quotation.quotationNo || "Quotation"}
                    secondBadge={formatLabel(quotation.status)}
                    href={`/quotations/${quotation._id}`}
                    customerPhone={quotation.phone}
                  />
                )}
              />
            </>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

const SearchSection = ({ title, icon: Icon, items, empty, renderItem }) => {
  return (
    <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 text-teal-700">
          <Icon size={19} />
        </div>

        <div>
          <h3 className="text-base font-black text-slate-900 sm:text-lg">
            {title}
          </h3>
          <p className="text-xs font-semibold text-slate-500">
            {items.length} result{items.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {items.length ? (
        <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
          {items.map(renderItem)}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">
          {empty}
        </p>
      )}
    </div>
  );
};

const ResultCard = ({
  title,
  subtitle,
  badge,
  secondBadge,
  href,
  customerPhone,
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="min-w-0">
        <h4 className="truncate text-base font-black text-slate-900">
          {title}
        </h4>

        <p className="mt-1 wrap-break-word text-xs font-semibold text-slate-500">
          {subtitle}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-black capitalize text-teal-700">
          {badge}
        </span>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black capitalize text-slate-700">
          {secondBadge}
        </span>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {customerPhone && (
          <Link
            href={`/customers/${customerPhone}`}
            className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-50 px-4 py-3 text-xs font-black text-emerald-700 hover:bg-emerald-100"
          >
            Customer Profile
          </Link>
        )}

        <Link
          href={href}
          className="inline-flex w-full items-center justify-center rounded-xl bg-sky-50 px-4 py-3 text-xs font-black text-sky-700 hover:bg-sky-100"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export default SearchClient;
