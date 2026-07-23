"use client";

import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { API } from "@/lib/api";
import { getUser } from "@/lib/auth";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CreditCard,
  IndianRupee,
  Loader2,
  Phone,
  Save,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { MessageCircle } from "lucide-react";
import {
  bookingConfirmationMessage,
  openWhatsApp,
  paymentReminderMessage,
} from "@/lib/whatsapp";

const bookingStatusOptions = ["pending", "confirmed", "cancelled", "completed"];

const paymentModeOptions = [
  "cash",
  "upi",
  "bank_transfer",
  "card",
  "cheque",
  "other",
];

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

const BookingDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id;
  const currentUser = getUser();

  const canDelete =
    currentUser?.role === "admin" || currentUser?.role === "manager";

  const canAssign =
    currentUser?.role === "admin" || currentUser?.role === "manager";

  const [booking, setBooking] = useState(null);
  const [members, setMembers] = useState([]);
  const [payments, setPayments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentDeletingId, setPaymentDeletingId] = useState("");

  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    email: "",
    destination: "",
    travelDate: "",
    returnDate: "",
    adults: 1,
    children: 0,
    packageName: "",
    totalAmount: "",
    paidAmount: "",
    bookingStatus: "confirmed",
    assignedTo: "",
    notes: "",
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentMode: "upi",
    paymentDate: new Date().toISOString().slice(0, 10),
    remarks: "",
  });

  const fetchBooking = async () => {
    try {
      setLoading(true);

      const { data } = await API.get(`/api/bookings/${bookingId}`);

      const bookingData = data?.data;

      setBooking(bookingData);

      setForm({
        customerName: bookingData?.customerName || "",
        phone: bookingData?.phone || "",
        email: bookingData?.email || "",
        destination: bookingData?.destination || "",
        travelDate: bookingData?.travelDate
          ? new Date(bookingData.travelDate).toISOString().slice(0, 10)
          : "",
        returnDate: bookingData?.returnDate
          ? new Date(bookingData.returnDate).toISOString().slice(0, 10)
          : "",
        adults: bookingData?.adults || 1,
        children: bookingData?.children || 0,
        packageName: bookingData?.packageName || "",
        totalAmount: bookingData?.totalAmount || "",
        paidAmount: bookingData?.paidAmount || "",
        bookingStatus: bookingData?.bookingStatus || "confirmed",
        assignedTo: bookingData?.assignedTo?._id || "",
        notes: bookingData?.notes || "",
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch booking");
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      const { data } = await API.get(`/api/payments/booking/${bookingId}`);
      setPayments(data?.data || []);
    } catch (error) {
      console.log("Payments error:", error);
    }
  };

  const fetchMembers = async () => {
    if (!canAssign) return;

    try {
      const { data } = await API.get("/api/users");

      const activeMembers = (data?.data || []).filter(
        (member) =>
          member.isActive &&
          (member.role === "manager" || member.role === "sales"),
      );

      setMembers(activeMembers);
    } catch (error) {
      console.log("Members error:", error);
    }
  };

  useEffect(() => {
    if (bookingId) {
      fetchBooking();
      fetchMembers();
      fetchPayments();
    }
  }, [bookingId]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;

    setPaymentForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const updateBooking = async (e) => {
    e.preventDefault();

    if (!form.customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }

    if (!form.phone.trim()) {
      toast.error("Phone number is required");
      return;
    }

    if (!form.destination.trim()) {
      toast.error("Destination is required");
      return;
    }

    if (!form.totalAmount || Number(form.totalAmount) <= 0) {
      toast.error("Total amount is required");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...form,
        adults: Number(form.adults) || 1,
        children: Number(form.children) || 0,
        totalAmount: Number(form.totalAmount) || 0,
      };

      delete payload.paidAmount;

      if (!canAssign) {
        delete payload.assignedTo;
      }

      await API.patch(`/api/bookings/${bookingId}`, payload);

      toast.success("Booking updated successfully");
      fetchBooking();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update booking");
    } finally {
      setSaving(false);
    }
  };

  const addPayment = async (e) => {
    e.preventDefault();

    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
      toast.error("Payment amount is required");
      return;
    }

    try {
      setPaymentSaving(true);

      await API.post("/api/payments", {
        booking: bookingId,
        amount: Number(paymentForm.amount),
        paymentMode: paymentForm.paymentMode,
        paymentDate: paymentForm.paymentDate,
        remarks: paymentForm.remarks,
      });

      toast.success("Payment added successfully");

      setPaymentForm({
        amount: "",
        paymentMode: "upi",
        paymentDate: new Date().toISOString().slice(0, 10),
        remarks: "",
      });

      fetchBooking();
      fetchPayments();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add payment");
    } finally {
      setPaymentSaving(false);
    }
  };

  const deletePayment = async (paymentId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this payment?",
    );

    if (!confirmDelete) return;

    try {
      setPaymentDeletingId(paymentId);

      await API.delete(`/api/payments/${paymentId}`);

      toast.success("Payment deleted successfully");

      fetchBooking();
      fetchPayments();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete payment");
    } finally {
      setPaymentDeletingId("");
    }
  };

  const deleteBooking = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this booking?",
    );

    if (!confirmDelete) return;

    try {
      setDeleting(true);

      await API.delete(`/api/bookings/${bookingId}`);

      toast.success("Booking deleted successfully");
      router.push("/bookings");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete booking");
    } finally {
      setDeleting(false);
    }
  };

  const pendingAmount = Math.max(
    Number(form.totalAmount || 0) - Number(form.paidAmount || 0),
    0,
  );

  return (
    <ProtectedRoute>
      <Layout>
        <div className="mb-5 flex flex-col justify-between gap-4 sm:mb-6 xl:flex-row xl:items-center">
          <div>
            <Link
              href="/bookings"
              className="mb-3 inline-flex items-center gap-2 text-xs font-black text-teal-700 sm:text-sm"
            >
              <ArrowLeft size={16} />
              Back to bookings
            </Link>

            <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
              Booking Detail
            </h2>

            <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
              View booking details, update payments and manage booking status.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
            {booking?.phone && (
              <a
                href={`tel:${booking.phone}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-black text-white transition hover:bg-slate-700 sm:px-5 sm:text-sm"
              >
                <Phone size={17} />
                Call
              </a>
            )}

            {booking?.phone && (
              <button
                onClick={() =>
                  openWhatsApp(
                    booking.phone,
                    bookingConfirmationMessage(booking),
                  )
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-black text-emerald-700 ring-1 ring-emerald-100 transition hover:bg-emerald-100 sm:px-5 sm:text-sm"
              >
                <MessageCircle size={17} />
                WhatsApp
              </button>
            )}

            {booking?.phone && Number(booking?.pendingAmount || 0) > 0 && (
              <button
                onClick={() =>
                  openWhatsApp(booking.phone, paymentReminderMessage(booking))
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-xs font-black text-amber-700 ring-1 ring-amber-100 transition hover:bg-amber-100 sm:px-5 sm:text-sm"
              >
                <MessageCircle size={17} />
                Payment Reminder
              </button>
            )}

            {booking && canDelete && (
              <button
                onClick={deleteBooking}
                disabled={deleting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-xs font-black text-white transition hover:bg-red-700 disabled:opacity-60 sm:px-5 sm:text-sm"
              >
                {deleting ? (
                  <Loader2 className="animate-spin" size={17} />
                ) : (
                  <Trash2 size={17} />
                )}
                Delete
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center font-bold text-slate-500 shadow-sm sm:rounded-3xl">
            Loading booking detail...
          </div>
        ) : !booking ? (
          <div className="rounded-2xl border border-red-100 bg-white p-8 text-center font-bold text-red-500 shadow-sm sm:rounded-3xl">
            Booking not found.
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[1fr_420px] xl:gap-6">
            <div className="space-y-5 xl:space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
                <div className="flex flex-col justify-between gap-4 md:flex-row">
                  <div className="min-w-0">
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-teal-600 to-sky-600 text-white shadow">
                      <BriefcaseBusiness size={21} />
                    </div>

                    <h3 className="truncate text-xl font-black text-slate-900 sm:text-2xl">
                      {booking.customerName}
                    </h3>

                    <p className="mt-1 wrap-break-word text-xs font-semibold text-slate-500 sm:text-sm">
                      {booking.email || "No email"} • {booking.phone}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-3 py-1.5 text-[11px] font-black capitalize sm:px-4 sm:py-2 sm:text-xs ${getBookingBadge(
                        booking.bookingStatus,
                      )}`}
                    >
                      {formatLabel(booking.bookingStatus)}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1.5 text-[11px] font-black capitalize sm:px-4 sm:py-2 sm:text-xs ${getPaymentBadge(
                        booking.paymentStatus,
                      )}`}
                    >
                      {formatLabel(booking.paymentStatus)}
                    </span>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:gap-4">
                  <InfoBox label="Destination" value={booking.destination} />
                  <InfoBox
                    label="Travel Date"
                    value={formatDate(booking.travelDate)}
                  />
                  <InfoBox
                    label="Return Date"
                    value={formatDate(booking.returnDate)}
                  />
                  <InfoBox label="Adults" value={booking.adults ?? 1} />
                  <InfoBox label="Children" value={booking.children ?? 0} />
                  <InfoBox label="Package" value={booking.packageName || "-"} />
                  <InfoBox
                    label="Total"
                    value={formatMoney(booking.totalAmount)}
                  />
                  <InfoBox
                    label="Paid"
                    value={formatMoney(booking.paidAmount)}
                  />
                  <InfoBox
                    label="Pending"
                    value={formatMoney(booking.pendingAmount)}
                  />
                  <InfoBox
                    label="Assigned To"
                    value={booking.assignedTo?.name || "Not assigned"}
                  />
                  <InfoBox
                    label="Created By"
                    value={booking.createdBy?.name || "-"}
                  />
                  <InfoBox
                    label="Created On"
                    value={formatDate(booking.createdAt)}
                  />
                </div>

                {booking.lead?._id && (
                  <div className="mt-5 rounded-2xl bg-cyan-50 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-teal-700">
                      Linked Lead
                    </p>
                    <Link
                      href={`/leads/${booking.lead._id}`}
                      className="mt-2 inline-block text-sm font-black text-teal-800 hover:underline"
                    >
                      {booking.lead.name} • {booking.lead.destination}
                    </Link>
                  </div>
                )}

                {booking.notes && (
                  <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                      Notes
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-700">
                      {booking.notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
                <h3 className="mb-4 flex items-center gap-2 text-base font-black text-slate-900 sm:text-lg">
                  <CreditCard size={18} />
                  Payment History
                </h3>

                {payments.length ? (
                  <div className="space-y-3">
                    {payments.map((payment) => (
                      <div
                        key={payment._id}
                        className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                      >
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                          <div>
                            <p className="text-lg font-black text-slate-900">
                              {formatMoney(payment.amount)}
                            </p>

                            <p className="mt-1 text-xs font-semibold capitalize text-slate-500">
                              {formatLabel(payment.paymentMode)} •{" "}
                              {formatDate(payment.paymentDate)}
                            </p>

                            <p className="mt-1 text-xs font-semibold text-slate-500">
                              Received by: {payment.receivedBy?.name || "-"}
                            </p>

                            {payment.remarks && (
                              <p className="mt-2 text-sm font-semibold text-slate-700">
                                {payment.remarks}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col gap-2 sm:flex-row">
                            <Link
                              href={`/bookings/${bookingId}/receipt/${payment._id}`}
                              className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-50 px-4 py-3 text-xs font-black text-sky-700 hover:bg-sky-100"
                            >
                              Receipt
                            </Link>

                            {canDelete && (
                              <button
                                onClick={() => deletePayment(payment._id)}
                                disabled={paymentDeletingId === payment._id}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-xs font-black text-red-700 hover:bg-red-100 disabled:opacity-60"
                              >
                                {paymentDeletingId === payment._id ? (
                                  <Loader2 className="animate-spin" size={15} />
                                ) : (
                                  <Trash2 size={15} />
                                )}
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm font-semibold text-slate-500">
                    No payment history found.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-5 xl:space-y-6">
              <form
                onSubmit={updateBooking}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5"
              >
                <h3 className="mb-4 text-base font-black text-slate-900 sm:text-lg">
                  Edit Booking
                </h3>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <Field label="Customer Name">
                    <input
                      name="customerName"
                      value={form.customerName}
                      onChange={handleChange}
                      placeholder="Customer name"
                      className="input-class"
                    />
                  </Field>

                  <Field label="Phone">
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="Phone"
                      className="input-class"
                    />
                  </Field>

                  <Field label="Email">
                    <input
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="Email"
                      className="input-class"
                    />
                  </Field>

                  <Field label="Destination">
                    <input
                      name="destination"
                      value={form.destination}
                      onChange={handleChange}
                      placeholder="Destination"
                      className="input-class"
                    />
                  </Field>

                  <Field label="Travel Date">
                    <input
                      type="date"
                      name="travelDate"
                      value={form.travelDate}
                      onChange={handleChange}
                      className="input-class"
                    />
                  </Field>

                  <Field label="Return Date">
                    <input
                      type="date"
                      name="returnDate"
                      value={form.returnDate}
                      onChange={handleChange}
                      className="input-class"
                    />
                  </Field>

                  <Field label="Adults">
                    <input
                      type="number"
                      name="adults"
                      min="1"
                      value={form.adults}
                      onChange={handleChange}
                      className="input-class"
                    />
                  </Field>

                  <Field label="Children">
                    <input
                      type="number"
                      name="children"
                      min="0"
                      value={form.children}
                      onChange={handleChange}
                      className="input-class"
                    />
                  </Field>

                  <Field label="Package Name">
                    <input
                      name="packageName"
                      value={form.packageName}
                      onChange={handleChange}
                      placeholder="Package name"
                      className="input-class"
                    />
                  </Field>

                  <Field label="Total Amount">
                    <input
                      type="number"
                      name="totalAmount"
                      min="0"
                      value={form.totalAmount}
                      onChange={handleChange}
                      className="input-class"
                    />
                  </Field>

                  <Field label="Paid Amount">
                    <input
                      type="number"
                      name="paidAmount"
                      value={form.paidAmount}
                      disabled
                      className="input-class cursor-not-allowed bg-slate-50"
                    />
                  </Field>

                  <Field label="Booking Status">
                    <select
                      name="bookingStatus"
                      value={form.bookingStatus}
                      onChange={handleChange}
                      className="input-class"
                    >
                      {bookingStatusOptions.map((item) => (
                        <option key={item} value={item}>
                          {formatLabel(item)}
                        </option>
                      ))}
                    </select>
                  </Field>

                  {canAssign && (
                    <Field label="Assigned To">
                      <select
                        name="assignedTo"
                        value={form.assignedTo}
                        onChange={handleChange}
                        className="input-class"
                      >
                        <option value="">Select member</option>
                        {members.map((member) => (
                          <option key={member._id} value={member._id}>
                            {member.name} ({member.role})
                          </option>
                        ))}
                      </select>
                    </Field>
                  )}

                  <div className="sm:col-span-2 xl:col-span-1">
                    <Field label="Notes">
                      <textarea
                        name="notes"
                        value={form.notes}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Booking notes"
                        className="input-class resize-none"
                      />
                    </Field>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                  <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                    <AmountBox label="Total" value={form.totalAmount} />
                    <AmountBox label="Paid" value={form.paidAmount} />
                    <AmountBox label="Pending" value={pendingAmount} />
                  </div>
                </div>

                <button
                  disabled={saving}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-700 disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Save size={18} />
                  )}
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </form>

              <form
                onSubmit={addPayment}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5"
              >
                <h3 className="mb-4 flex items-center gap-2 text-base font-black text-slate-900 sm:text-lg">
                  <CreditCard size={18} />
                  Add Payment
                </h3>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <Field label="Amount">
                    <input
                      type="number"
                      name="amount"
                      min="1"
                      value={paymentForm.amount}
                      onChange={handlePaymentChange}
                      placeholder="Payment amount"
                      className="input-class"
                    />
                  </Field>

                  <Field label="Payment Mode">
                    <select
                      name="paymentMode"
                      value={paymentForm.paymentMode}
                      onChange={handlePaymentChange}
                      className="input-class"
                    >
                      {paymentModeOptions.map((item) => (
                        <option key={item} value={item}>
                          {formatLabel(item)}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Payment Date">
                    <input
                      type="date"
                      name="paymentDate"
                      value={paymentForm.paymentDate}
                      onChange={handlePaymentChange}
                      className="input-class"
                    />
                  </Field>

                  <div className="sm:col-span-2 xl:col-span-1">
                    <Field label="Remarks">
                      <textarea
                        name="remarks"
                        value={paymentForm.remarks}
                        onChange={handlePaymentChange}
                        rows={3}
                        placeholder="Payment remarks"
                        className="input-class resize-none"
                      />
                    </Field>
                  </div>
                </div>

                <button
                  disabled={paymentSaving}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-teal-600 to-sky-600 px-4 py-3 text-sm font-black text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  {paymentSaving ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <IndianRupee size={18} />
                  )}
                  {paymentSaving ? "Saving..." : "Add Payment"}
                </button>
              </form>
            </div>
          </div>
        )}
      </Layout>

      <style jsx global>{`
        .input-class {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgb(226 232 240);
          background: white;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: rgb(30 41 59);
          outline: none;
        }

        .input-class:focus {
          border-color: rgb(13 148 136);
        }
      `}</style>
    </ProtectedRoute>
  );
};

const InfoBox = ({ label, value }) => {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 sm:rounded-2xl sm:p-4">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400 sm:text-xs">
        {label}
      </p>
      <p className="mt-1 truncate text-xs font-black capitalize text-slate-800 sm:mt-2 sm:text-sm">
        {value}
      </p>
    </div>
  );
};

const Field = ({ label, children }) => {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
};

const AmountBox = ({ label, value }) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-base font-black text-slate-900">
        {formatMoney(value)}
      </p>
    </div>
  );
};

export default BookingDetailPage;
