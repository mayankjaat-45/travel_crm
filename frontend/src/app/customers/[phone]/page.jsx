"use client";

import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { API } from "@/lib/api";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CreditCard,
  FileText,
  IndianRupee,
  Loader2,
  MessageCircle,
  Phone,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const formatMoney = (amount) => {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
};

const formatLabel = (value) => {
  if (!value) return "-";
  return String(value).replaceAll("_", " ");
};

const formatDate = (date) => {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const openWhatsApp = (phone, message) => {
  const clean = String(phone || "").replace(/\D/g, "");
  const finalPhone = clean.length === 10 ? `91${clean}` : clean;

  if (!finalPhone) {
    toast.error("Phone number not available");
    return;
  }

  window.open(
    `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`,
    "_blank",
  );
};

const CustomerProfilePage = () => {
  const params = useParams();
  const phone = params.phone;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      setLoading(true);

      const { data } = await API.get(`/api/customers/${phone}`);

      setProfile(data?.data || null);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch customer profile",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (phone) {
      fetchProfile();
    }
  }, [phone]);

  const customer = profile?.customer || {};
  const summary = profile?.summary || {};

  const whatsappMessage = `Hello ${customer.name || ""}, thanks for connecting with us. We are here to help with your travel plans.`;

  return (
    <ProtectedRoute>
      <Layout>
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-5 flex flex-col justify-between gap-4 sm:mb-6 lg:flex-row lg:items-center">
            <div>
              <Link
                href="/search"
                className="mb-3 inline-flex items-center gap-2 text-xs font-black text-teal-700 sm:text-sm"
              >
                <ArrowLeft size={16} />
                Back to search
              </Link>

              <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
                Customer Profile
              </h2>

              <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
                Complete customer history across leads, quotations, bookings and
                payments.
              </p>
            </div>

            {customer?.phone && (
              <button
                onClick={() => openWhatsApp(customer.phone, whatsappMessage)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700 ring-1 ring-emerald-100 hover:bg-emerald-100"
              >
                <MessageCircle size={17} />
                WhatsApp
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl bg-white p-8 font-bold text-slate-500 shadow-sm sm:rounded-3xl">
              <Loader2 className="animate-spin" size={18} />
              Loading customer profile...
            </div>
          ) : !profile ? (
            <div className="rounded-2xl bg-white p-8 text-center font-bold text-red-500 shadow-sm sm:rounded-3xl">
              Customer profile not found.
            </div>
          ) : (
            <>
              <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div>
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-teal-600 to-sky-600 text-white shadow">
                      <UserCheck size={22} />
                    </div>

                    <h3 className="text-xl font-black text-slate-900 sm:text-2xl">
                      {customer.name}
                    </h3>

                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {customer.email || "No email"} • {customer.phone}
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      Destination: {customer.destination || "-"}
                    </p>
                  </div>

                  <a
                    href={`tel:${customer.phone}`}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-black text-white hover:bg-slate-700"
                  >
                    <Phone size={17} />
                    Call Customer
                  </a>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                  <SummaryBox
                    title="Leads"
                    value={summary.totalLeads || 0}
                    icon={UserCheck}
                  />
                  <SummaryBox
                    title="Quotations"
                    value={summary.totalQuotations || 0}
                    icon={FileText}
                  />
                  <SummaryBox
                    title="Bookings"
                    value={summary.totalBookings || 0}
                    icon={BriefcaseBusiness}
                  />
                  <SummaryBox
                    title="Payments"
                    value={summary.totalPayments || 0}
                    icon={CreditCard}
                  />
                  <SummaryBox
                    title="Booking Value"
                    value={formatMoney(summary.totalBookingAmount)}
                    icon={IndianRupee}
                  />
                  <SummaryBox
                    title="Paid"
                    value={formatMoney(summary.totalPaidAmount)}
                    icon={IndianRupee}
                  />
                  <SummaryBox
                    title="Pending"
                    value={formatMoney(summary.totalPendingAmount)}
                    icon={IndianRupee}
                  />
                </div>
              </div>

              <Section
                title="Leads"
                icon={UserCheck}
                items={profile.leads}
                empty="No leads found."
                renderItem={(lead) => (
                  <HistoryCard
                    key={lead._id}
                    title={lead.name}
                    subtitle={`${lead.destination || "-"} • ${lead.phone}`}
                    badge={formatLabel(lead.status)}
                    secondBadge={formatLabel(lead.priority)}
                    href={`/leads/${lead._id}`}
                  />
                )}
              />

              <Section
                title="Quotations"
                icon={FileText}
                items={profile.quotations}
                empty="No quotations found."
                renderItem={(quotation) => (
                  <HistoryCard
                    key={quotation._id}
                    title={quotation.quotationNo || "Quotation"}
                    subtitle={`${quotation.destination || "-"} • ${formatMoney(
                      quotation.totalAmount,
                    )}`}
                    badge={formatLabel(quotation.status)}
                    secondBadge={formatDate(quotation.createdAt)}
                    href={`/quotations/${quotation._id}`}
                  />
                )}
              />

              <Section
                title="Bookings"
                icon={BriefcaseBusiness}
                items={profile.bookings}
                empty="No bookings found."
                renderItem={(booking) => (
                  <HistoryCard
                    key={booking._id}
                    title={booking.packageName || booking.destination}
                    subtitle={`${booking.destination || "-"} • ${formatMoney(
                      booking.totalAmount,
                    )}`}
                    badge={formatLabel(booking.bookingStatus)}
                    secondBadge={formatLabel(booking.paymentStatus)}
                    href={`/bookings/${booking._id}`}
                  />
                )}
              />

              <Section
                title="Payments"
                icon={CreditCard}
                items={profile.payments}
                empty="No payments found."
                renderItem={(payment) => (
                  <div
                    key={payment._id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <h4 className="text-base font-black text-slate-900">
                      {formatMoney(payment.amount)}
                    </h4>

                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {formatLabel(payment.paymentMode)} •{" "}
                      {formatDate(payment.paymentDate)}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Booking: {payment.booking?.packageName || "-"}
                    </p>

                    <p className="mt-2 text-xs font-bold text-slate-400">
                      Received by: {payment.receivedBy?.name || "-"}
                    </p>
                  </div>
                )}
              />
            </>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

const SummaryBox = ({ title, value, icon: Icon }) => {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 text-teal-700">
        <Icon size={18} />
      </div>

      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
        {title}
      </p>

      <p className="mt-1 truncate text-base font-black text-slate-900">
        {value}
      </p>
    </div>
  );
};

const Section = ({ title, icon: Icon, items, empty, renderItem }) => {
  return (
    <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 text-teal-700">
          <Icon size={19} />
        </div>

        <div>
          <h3 className="text-base font-black text-slate-900 sm:text-lg">
            {title}
          </h3>
          <p className="text-xs font-semibold text-slate-500">
            {items?.length || 0} record{items?.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {items?.length ? (
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

const HistoryCard = ({ title, subtitle, badge, secondBadge, href }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h4 className="truncate text-base font-black text-slate-900">{title}</h4>

      <p className="mt-1 wrap-break-word text-xs font-semibold text-slate-500">
        {subtitle}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-black capitalize text-teal-700">
          {badge}
        </span>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black capitalize text-slate-700">
          {secondBadge}
        </span>
      </div>

      <Link
        href={href}
        className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-sky-50 px-4 py-3 text-xs font-black text-sky-700 hover:bg-sky-100"
      >
        View Details
      </Link>
    </div>
  );
};

export default CustomerProfilePage;
