"use client";

import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { API } from "@/lib/api";
import { getUser } from "@/lib/auth";
import {
  BriefcaseBusiness,
  CalendarDays,
  Eye,
  Loader2,
  MapPin,
  Phone,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const bookingStatusOptions = ["pending", "confirmed", "cancelled", "completed"];
const paymentStatusOptions = ["unpaid", "partial", "paid", "refunded"];

const BookingsClient = () => {
  const [bookings, setBookings] = useState([]);

  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [search, setSearch] = useState(initialSearch);
  const [bookingStatus, setBookingStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");

  const currentUser = getUser();

  const canDeleteBooking =
    currentUser?.role === "admin" || currentUser?.role === "manager";

  const fetchBookings = async (pageNumber = page) => {
    try {
      setLoading(true);

      const { data } = await API.get("/api/bookings", {
        params: {
          search,
          bookingStatus,
          paymentStatus,
          page: pageNumber,
          limit: 20,
        },
      });

      setBookings(data?.data || []);
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
      toast.error(error.response?.data?.message || "Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings(1);
  }, [initialSearch]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBookings(1);
  };

  const deleteBooking = async (bookingId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this booking?",
    );

    if (!confirmDelete) return;

    try {
      setDeletingId(bookingId);

      await API.delete(`/api/bookings/${bookingId}`);

      toast.success("Booking deleted successfully");

      if (bookings.length === 1 && page > 1) {
        fetchBookings(page - 1);
      } else {
        fetchBookings(page);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete booking");
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

  const getBookingBadge = (value) => {
    if (value === "confirmed") return "bg-emerald-50 text-emerald-700";
    if (value === "pending") return "bg-amber-50 text-amber-700";
    if (value === "cancelled") return "bg-red-50 text-red-700";
    if (value === "completed") return "bg-sky-50 text-sky-700";
    return "bg-slate-100 text-slate-700";
  };

  const getPaymentBadge = (value) => {
    if (value === "paid") return "bg-emerald-50 text-emerald-700";
    if (value === "partial") return "bg-amber-50 text-amber-700";
    if (value === "unpaid") return "bg-red-50 text-red-700";
    return "bg-slate-100 text-slate-700";
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-5 flex flex-col justify-between gap-4 md:mb-6 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
                Bookings
              </h2>
              <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
                Manage confirmed travel bookings, payments and assigned sales.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
              <button
                onClick={() => fetchBookings(page)}
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
                href="/bookings/add"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-teal-600 to-sky-600 px-4 py-3 text-xs font-black text-white shadow sm:px-5 sm:text-sm"
              >
                <Plus size={17} />
                Add Booking
              </Link>
            </div>
          </div>

          <form
            onSubmit={handleSearch}
            className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-4 lg:grid-cols-[1fr_190px_190px_auto]"
          >
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customer, phone, destination, package"
                className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none focus:border-teal-500"
              />
            </div>

            <select
              value={bookingStatus}
              onChange={(e) => setBookingStatus(e.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-teal-500"
            >
              <option value="">All Booking Status</option>
              {bookingStatusOptions.map((item) => (
                <option key={item} value={item}>
                  {formatLabel(item)}
                </option>
              ))}
            </select>

            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-teal-500"
            >
              <option value="">All Payment Status</option>
              {paymentStatusOptions.map((item) => (
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
                Loading bookings...
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                  {bookings.map((booking) => (
                    <div
                      key={booking._id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-black text-slate-900">
                            {booking.customerName}
                          </h3>

                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <Phone size={13} />
                              {booking.phone}
                            </span>

                            {booking.email && (
                              <span className="truncate">{booking.email}</span>
                            )}
                          </div>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-black capitalize ${getBookingBadge(
                            booking.bookingStatus,
                          )}`}
                        >
                          {formatLabel(booking.bookingStatus)}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <BookingInfo
                          label="Destination"
                          value={booking.destination || "-"}
                          icon={MapPin}
                        />

                        <BookingInfo
                          label="Travel Date"
                          value={formatDate(booking.travelDate)}
                          icon={CalendarDays}
                        />

                        <BookingInfo
                          label="Total"
                          value={formatMoney(booking.totalAmount)}
                        />

                        <BookingInfo
                          label="Paid"
                          value={formatMoney(booking.paidAmount)}
                        />

                        <BookingInfo
                          label="Pending"
                          value={formatMoney(booking.pendingAmount)}
                        />

                        <BookingInfo
                          label="Assigned"
                          value={booking.assignedTo?.name || "Not assigned"}
                        />
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-black capitalize ${getPaymentBadge(
                            booking.paymentStatus,
                          )}`}
                        >
                          {formatLabel(booking.paymentStatus)}
                        </span>

                        {booking.packageName && (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-700">
                            {booking.packageName}
                          </span>
                        )}

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black capitalize text-slate-700">
                          {formatLabel(booking.bookingStatus)}
                        </span>
                      </div>

                      {booking.notes && (
                        <p className="mt-4 line-clamp-2 rounded-xl bg-slate-50 p-3 text-xs font-semibold leading-relaxed text-slate-600">
                          {booking.notes}
                        </p>
                      )}

                      <div
                        className={`mt-4 grid gap-3 ${
                          canDeleteBooking ? "grid-cols-2" : "grid-cols-1"
                        }`}
                      >
                        <Link
                          href={`/bookings/${booking._id}`}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-50 px-4 py-3 text-xs font-black text-sky-700 hover:bg-sky-100"
                        >
                          <Eye size={15} />
                          View
                        </Link>

                        {canDeleteBooking && (
                          <button
                            onClick={() => deleteBooking(booking._id)}
                            disabled={deletingId === booking._id}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-xs font-black text-red-700 hover:bg-red-100 disabled:opacity-60"
                          >
                            {deletingId === booking._id ? (
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

                {!bookings.length && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-teal-700">
                      <BriefcaseBusiness size={24} />
                    </div>
                    <p className="text-sm font-black text-slate-700">
                      No bookings found
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      Create first booking after converting a lead.
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
              bookings
            </p>

            <div className="grid w-full grid-cols-3 items-center gap-2 sm:w-auto">
              <button
                onClick={() => fetchBookings(page - 1)}
                disabled={page <= 1 || loading}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm"
              >
                Previous
              </button>

              <div className="rounded-xl bg-slate-100 px-3 py-2 text-center text-xs font-black text-slate-700 sm:px-4 sm:text-sm">
                {page}
              </div>

              <button
                onClick={() => fetchBookings(page + 1)}
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

const BookingInfo = ({ label, value, icon: Icon }) => {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wide text-slate-400">
        {Icon && <Icon size={12} />}
        {label}
      </p>
      <p className="mt-1 truncate text-xs font-black capitalize text-slate-800">
        {value}
      </p>
    </div>
  );
};

export default BookingsClient;
