"use client";

import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { API } from "@/lib/api";
import { getUser } from "@/lib/auth";
import {
  Eye,
  FileText,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const statusOptions = ["draft", "sent", "accepted", "rejected", "converted"];

const QuotationsPage = () => {
  const currentUser = getUser();

  const canDelete =
    currentUser?.role === "admin" || currentUser?.role === "manager";

  const [quotations, setQuotations] = useState([]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");

  const fetchQuotations = async (pageNumber = page) => {
    try {
      setLoading(true);

      const { data } = await API.get("/api/quotations", {
        params: {
          search,
          status,
          page: pageNumber,
          limit: 20,
        },
      });

      setQuotations(data?.data || []);
      setPagination(
        data?.pagination || {
          total: 0,
          page: pageNumber,
          limit: 20,
          totalPages: 1,
        },
      );

      setPage(pageNumber);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch quotations",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations(1);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchQuotations(1);
  };

  const deleteQuotation = async (quotationId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this quotation?",
    );

    if (!confirmDelete) return;

    try {
      setDeletingId(quotationId);

      await API.delete(`/api/quotations/${quotationId}`);

      toast.success("Quotation deleted successfully");

      if (quotations.length === 1 && page > 1) {
        fetchQuotations(page - 1);
      } else {
        fetchQuotations(page);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to delete quotation",
      );
    } finally {
      setDeletingId("");
    }
  };

  const formatLabel = (value) => {
    if (!value) return "-";
    return String(value).replaceAll("_", " ");
  };

  const formatMoney = (amount) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadge = (value) => {
    if (value === "accepted") return "bg-emerald-50 text-emerald-700";
    if (value === "sent") return "bg-sky-50 text-sky-700";
    if (value === "rejected") return "bg-red-50 text-red-700";
    if (value === "converted") return "bg-violet-50 text-violet-700";
    return "bg-amber-50 text-amber-700";
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-5 flex flex-col justify-between gap-4 md:mb-6 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
                Quotations
              </h2>
              <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
                Create and manage travel package quotations for customers.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
              <button
                onClick={() => fetchQuotations(page)}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-black text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-60 sm:px-5 sm:text-sm"
              >
                <RefreshCcw
                  size={17}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>

              <Link
                href="/quotations/add"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-teal-600 to-sky-600 px-4 py-3 text-xs font-black text-white shadow sm:px-5 sm:text-sm"
              >
                <Plus size={17} />
                Add Quote
              </Link>
            </div>
          </div>

          <form
            onSubmit={handleSearch}
            className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-4 lg:grid-cols-[1fr_190px_auto]"
          >
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customer, phone, destination, quotation no"
                className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none focus:border-teal-500"
              />
            </div>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-teal-500"
            >
              <option value="">All Status</option>
              {statusOptions.map((item) => (
                <option key={item} value={item}>
                  {formatLabel(item)}
                </option>
              ))}
            </select>

            <button className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-black text-white hover:bg-slate-700">
              Search
            </button>
          </form>

          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-5">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-12 font-bold text-slate-500">
                <Loader2 className="animate-spin" size={18} />
                Loading quotations...
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                  {quotations.map((quotation) => (
                    <div
                      key={quotation._id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-black text-slate-900">
                            {quotation.customerName}
                          </h3>

                          <p className="mt-1 text-xs font-bold text-slate-400">
                            {quotation.quotationNo || "QT-XXXXX"}
                          </p>

                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {quotation.phone}
                            {quotation.email ? ` • ${quotation.email}` : ""}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-black capitalize ${getStatusBadge(
                            quotation.status,
                          )}`}
                        >
                          {formatLabel(quotation.status)}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <QuoteInfo
                          label="Destination"
                          value={quotation.destination || "-"}
                        />
                        <QuoteInfo
                          label="Travel Date"
                          value={formatDate(quotation.travelDate)}
                        />
                        <QuoteInfo
                          label="Package"
                          value={quotation.packageName || "-"}
                        />
                        <QuoteInfo
                          label="Total"
                          value={formatMoney(quotation.totalAmount)}
                        />
                        <QuoteInfo
                          label="Assigned"
                          value={quotation.assignedTo?.name || "Not assigned"}
                        />
                        <QuoteInfo
                          label="Created"
                          value={formatDate(quotation.createdAt)}
                        />
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-black text-teal-700">
                          {quotation.items?.length || 0} item
                          {quotation.items?.length === 1 ? "" : "s"}
                        </span>

                        {quotation.lead?._id && (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-700">
                            Linked Lead
                          </span>
                        )}
                      </div>

                      <div
                        className={`mt-4 grid gap-3 ${
                          canDelete ? "grid-cols-2" : "grid-cols-1"
                        }`}
                      >
                        <Link
                          href={`/quotations/${quotation._id}`}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-50 px-4 py-3 text-xs font-black text-sky-700 hover:bg-sky-100"
                        >
                          <Eye size={15} />
                          View
                        </Link>

                        {canDelete && (
                          <button
                            onClick={() => deleteQuotation(quotation._id)}
                            disabled={deletingId === quotation._id}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-xs font-black text-red-700 hover:bg-red-100 disabled:opacity-60"
                          >
                            {deletingId === quotation._id ? (
                              <Loader2 className="animate-spin" size={15} />
                            ) : (
                              <Trash2 size={15} />
                            )}
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {!quotations.length && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-teal-700">
                      <FileText size={24} />
                    </div>
                    <p className="text-sm font-black text-slate-700">
                      No quotations found
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      Create first quotation for a travel enquiry.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="mt-5 flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl md:flex-row">
            <p className="text-center text-xs font-bold text-slate-500 sm:text-sm md:text-left">
              Showing page{" "}
              <span className="text-slate-900">{pagination.page}</span> of{" "}
              <span className="text-slate-900">
                {pagination.totalPages || 1}
              </span>{" "}
              • Total <span className="text-slate-900">{pagination.total}</span>{" "}
              quotations
            </p>

            <div className="grid w-full grid-cols-3 items-center gap-2 sm:w-auto">
              <button
                onClick={() => fetchQuotations(page - 1)}
                disabled={page <= 1 || loading}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm"
              >
                Previous
              </button>

              <div className="rounded-xl bg-slate-100 px-3 py-2 text-center text-xs font-black text-slate-700 sm:px-4 sm:text-sm">
                {page}
              </div>

              <button
                onClick={() => fetchQuotations(page + 1)}
                disabled={page >= pagination.totalPages || loading}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

const QuoteInfo = ({ label, value }) => {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 truncate text-xs font-black capitalize text-slate-800">
        {value}
      </p>
    </div>
  );
};

export default QuotationsPage;
