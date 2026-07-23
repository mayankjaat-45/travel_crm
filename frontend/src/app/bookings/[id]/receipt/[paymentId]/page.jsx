"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { API } from "@/lib/api";
import { ArrowLeft, Download, Loader2, Printer } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

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

const formatLabel = (value) => {
  if (!value) return "-";
  return String(value).replaceAll("_", " ");
};

const PaymentReceiptPage = () => {
  const params = useParams();
  const bookingId = params.id;
  const paymentId = params.paymentId;

  const [booking, setBooking] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReceiptData = async () => {
    try {
      setLoading(true);

      const [bookingRes, paymentsRes] = await Promise.all([
        API.get(`/api/bookings/${bookingId}`),
        API.get(`/api/payments/booking/${bookingId}`),
      ]);

      const bookingData = bookingRes?.data?.data;
      const payments = paymentsRes?.data?.data || [];

      const selectedPayment = payments.find((item) => item._id === paymentId);

      if (!selectedPayment) {
        toast.error("Payment not found");
      }

      setBooking(bookingData);
      setPayment(selectedPayment || null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch receipt");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bookingId && paymentId) {
      fetchReceiptData();
    }
  }, [bookingId, paymentId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-100 p-4 text-slate-900 print:bg-white print:p-0">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 flex flex-col justify-between gap-3 print:hidden sm:flex-row sm:items-center">
            <Link
              href={`/bookings/${bookingId}`}
              className="inline-flex items-center gap-2 text-sm font-black text-teal-700"
            >
              <ArrowLeft size={16} />
              Back to booking
            </Link>

            <div className="flex gap-3">
              <button
                onClick={handlePrint}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-black text-white"
              >
                <Printer size={17} />
                Print
              </button>

              <button
                onClick={handlePrint}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-sky-600 px-5 py-3 text-sm font-black text-white"
              >
                <Download size={17} />
                Save PDF
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 rounded-3xl bg-white p-10 font-bold text-slate-500">
              <Loader2 className="animate-spin" size={18} />
              Loading receipt...
            </div>
          ) : !booking || !payment ? (
            <div className="rounded-3xl bg-white p-10 text-center font-bold text-red-500">
              Receipt data not found.
            </div>
          ) : (
            <div className="rounded-3xl bg-white p-6 shadow-xl print:rounded-none print:shadow-none sm:p-10">
              <div className="flex flex-col justify-between gap-6 border-b border-slate-200 pb-6 sm:flex-row">
                <div>
                  <h1 className="text-2xl font-black text-slate-900">
                    Travel CRM
                  </h1>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Payment Receipt
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                    Receipt No.
                  </p>
                  <p className="mt-1 text-sm font-black text-slate-900">
                    RCPT-{String(payment._id).slice(-8).toUpperCase()}
                  </p>

                  <p className="mt-3 text-xs font-black uppercase tracking-wide text-slate-400">
                    Date
                  </p>
                  <p className="mt-1 text-sm font-black text-slate-900">
                    {formatDate(payment.paymentDate)}
                  </p>
                </div>
              </div>

              <div className="grid gap-6 border-b border-slate-200 py-6 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                    Received From
                  </p>
                  <h2 className="mt-2 text-lg font-black text-slate-900">
                    {booking.customerName}
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-slate-600">
                    {booking.phone}
                  </p>
                  <p className="text-sm font-semibold text-slate-600">
                    {booking.email || "No email"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                    Booking Details
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-700">
                    Destination: {booking.destination}
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-700">
                    Package: {booking.packageName || "-"}
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-700">
                    Travel Date: {formatDate(booking.travelDate)}
                  </p>
                </div>
              </div>

              <div className="py-6">
                <div className="rounded-2xl border border-slate-200">
                  <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50 p-4 text-xs font-black uppercase tracking-wide text-slate-500">
                    <div>Description</div>
                    <div className="text-right">Amount</div>
                  </div>

                  <div className="grid grid-cols-2 p-4 text-sm font-bold text-slate-700">
                    <div>
                      Payment received via {formatLabel(payment.paymentMode)}
                      {payment.remarks ? (
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {payment.remarks}
                        </p>
                      ) : null}
                    </div>
                    <div className="text-right text-base font-black text-slate-900">
                      {formatMoney(payment.amount)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <SummaryBox label="Total Booking" value={booking.totalAmount} />
                <SummaryBox label="Total Paid" value={booking.paidAmount} />
                <SummaryBox label="Pending" value={booking.pendingAmount} />
              </div>

              <div className="mt-8 rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold leading-relaxed text-slate-500">
                  This is a computer-generated payment receipt for the travel
                  booking. Please keep this receipt for future reference.
                </p>
              </div>

              <div className="mt-10 flex justify-end">
                <div className="text-center">
                  <div className="mb-2 h-px w-40 bg-slate-300" />
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                    Authorized Signature
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

const SummaryBox = ({ label, value }) => {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-base font-black text-slate-900">
        {formatMoney(value)}
      </p>
    </div>
  );
};

export default PaymentReceiptPage;