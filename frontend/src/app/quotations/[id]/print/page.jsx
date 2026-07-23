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

const QuotationPrintPage = () => {
  const params = useParams();
  const quotationId = params.id;

  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchQuotation = async () => {
    try {
      setLoading(true);

      const { data } = await API.get(`/api/quotations/${quotationId}`);

      setQuotation(data?.data || null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch quotation");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (quotationId) {
      fetchQuotation();
    }
  }, [quotationId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-100 p-4 text-slate-900 print:bg-white print:p-0">
        <div className="mx-auto max-w-4xl">
          <div className="mb-4 flex flex-col justify-between gap-3 print:hidden sm:flex-row sm:items-center">
            <Link
              href={`/quotations/${quotationId}`}
              className="inline-flex items-center gap-2 text-sm font-black text-teal-700"
            >
              <ArrowLeft size={16} />
              Back to quotation
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
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-teal-600 to-sky-600 px-5 py-3 text-sm font-black text-white"
              >
                <Download size={17} />
                Save PDF
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 rounded-3xl bg-white p-10 font-bold text-slate-500">
              <Loader2 className="animate-spin" size={18} />
              Loading quotation...
            </div>
          ) : !quotation ? (
            <div className="rounded-3xl bg-white p-10 text-center font-bold text-red-500">
              Quotation not found.
            </div>
          ) : (
            <div className="rounded-3xl bg-white p-6 shadow-xl print:rounded-none print:shadow-none sm:p-10">
              <div className="flex flex-col justify-between gap-6 border-b border-slate-200 pb-6 sm:flex-row">
                <div>
                  <h1 className="text-2xl font-black text-slate-900">
                    Travel CRM
                  </h1>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Travel Quotation
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                    Quotation No.
                  </p>
                  <p className="mt-1 text-sm font-black text-slate-900">
                    {quotation.quotationNo}
                  </p>

                  <p className="mt-3 text-xs font-black uppercase tracking-wide text-slate-400">
                    Date
                  </p>
                  <p className="mt-1 text-sm font-black text-slate-900">
                    {formatDate(quotation.createdAt)}
                  </p>

                  <p className="mt-3 text-xs font-black uppercase tracking-wide text-slate-400">
                    Status
                  </p>
                  <p className="mt-1 text-sm font-black capitalize text-slate-900">
                    {formatLabel(quotation.status)}
                  </p>
                </div>
              </div>

              <div className="grid gap-6 border-b border-slate-200 py-6 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                    Customer
                  </p>
                  <h2 className="mt-2 text-lg font-black text-slate-900">
                    {quotation.customerName}
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-slate-600">
                    {quotation.phone}
                  </p>
                  <p className="text-sm font-semibold text-slate-600">
                    {quotation.email || "No email"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                    Travel Details
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-700">
                    Destination: {quotation.destination}
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-700">
                    Package: {quotation.packageName || "-"}
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-700">
                    Travel: {formatDate(quotation.travelDate)} -{" "}
                    {formatDate(quotation.returnDate)}
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-700">
                    Guests: {quotation.adults || 1} Adult(s),{" "}
                    {quotation.children || 0} Child(ren)
                  </p>
                </div>
              </div>

              <div className="py-6">
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <div className="grid grid-cols-[1fr_80px_120px_120px] bg-slate-50 p-4 text-xs font-black uppercase tracking-wide text-slate-500">
                    <div>Item</div>
                    <div className="text-center">Qty</div>
                    <div className="text-right">Price</div>
                    <div className="text-right">Total</div>
                  </div>

                  {quotation.items?.map((item, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-[1fr_80px_120px_120px] border-t border-slate-200 p-4 text-sm font-bold text-slate-700"
                    >
                      <div>
                        <p className="font-black text-slate-900">
                          {item.title}
                        </p>
                        {item.description && (
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div className="text-center">{item.quantity}</div>
                      <div className="text-right">
                        {formatMoney(item.price)}
                      </div>
                      <div className="text-right font-black text-slate-900">
                        {formatMoney(
                          Number(item.quantity || 1) * Number(item.price || 0),
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="ml-auto max-w-sm space-y-3">
                <SummaryRow label="Subtotal" value={quotation.subTotal} />
                <SummaryRow label="Discount" value={quotation.discount} />
                <SummaryRow label="Tax" value={quotation.tax} />
                <div className="flex justify-between rounded-2xl bg-slate-900 p-4 text-white">
                  <span className="font-black">Total Amount</span>
                  <span className="font-black">
                    {formatMoney(quotation.totalAmount)}
                  </span>
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <TextBox title="Inclusions" value={quotation.inclusions} />
                <TextBox title="Exclusions" value={quotation.exclusions} />
                <TextBox title="Terms" value={quotation.terms} />
              </div>

              <div className="mt-8 rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold leading-relaxed text-slate-500">
                  This quotation is system-generated and subject to availability
                  at the time of booking confirmation.
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

const SummaryRow = ({ label, value }) => {
  return (
    <div className="flex justify-between rounded-xl bg-slate-50 p-3 text-sm font-bold text-slate-700">
      <span>{label}</span>
      <span>{formatMoney(value)}</span>
    </div>
  );
};

const TextBox = ({ title, value }) => {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
        {title}
      </p>
      <p className="mt-2 whitespace-pre-line text-xs font-semibold leading-relaxed text-slate-600">
        {value || "-"}
      </p>
    </div>
  );
};

export default QuotationPrintPage;
