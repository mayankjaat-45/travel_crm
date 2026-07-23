"use client";

import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { API } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { ArrowLeft, BriefcaseBusiness, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const bookingStatusOptions = [
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Completed", value: "completed" },
];

const AddBookingClient = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leadId = searchParams.get("lead");

  const currentUser = getUser();

  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState([]);
  const [loadingLead, setLoadingLead] = useState(false);

  const [form, setForm] = useState({
    lead: leadId || "",
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

  const canAssign =
    currentUser?.role === "admin" || currentUser?.role === "manager";

  const fetchMembers = async () => {
    try {
      const { data } = await API.get("/api/users");

      const activeMembers = (data?.data || []).filter(
        (member) =>
          member.isActive &&
          (member.role === "manager" || member.role === "sales"),
      );

      setMembers(activeMembers);

      if (!canAssign && currentUser?._id) {
        setForm((prev) => ({
          ...prev,
          assignedTo: currentUser._id,
        }));
      }
    } catch (error) {
      console.log("Members error:", error);
    }
  };

  const fetchLeadForBooking = async () => {
    if (!leadId) return;

    try {
      setLoadingLead(true);

      const { data } = await API.get(`/api/leads/${leadId}`);

      const leadData = data?.data?.lead || data?.data;

      setForm((prev) => ({
        ...prev,
        lead: leadId,
        customerName: leadData?.name || "",
        phone: leadData?.phone || "",
        email: leadData?.email || "",
        destination: leadData?.destination || "",
        travelDate: leadData?.travelDate
          ? new Date(leadData.travelDate).toISOString().slice(0, 10)
          : "",
        returnDate: leadData?.returnDate
          ? new Date(leadData.returnDate).toISOString().slice(0, 10)
          : "",
        adults: leadData?.adults || 1,
        children: leadData?.children || 0,
        totalAmount: leadData?.budget || "",
        assignedTo: leadData?.assignedTo?._id || currentUser?._id || "",
        notes: leadData?.notes || "",
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch lead");
    } finally {
      setLoadingLead(false);
    }
  };

  useEffect(() => {
    fetchMembers();
    fetchLeadForBooking();
  }, [leadId]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const submitBooking = async (e) => {
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

    if (canAssign && !form.assignedTo) {
      toast.error("Assigned member is required");
      return;
    }

    try {
      setSaving(true);

      await API.post("/api/bookings", {
        ...form,
        lead: form.lead || undefined,
        adults: Number(form.adults) || 1,
        children: Number(form.children) || 0,
        totalAmount: Number(form.totalAmount) || 0,
        paidAmount: Number(form.paidAmount) || 0,
        assignedTo: form.assignedTo || currentUser?._id,
      });

      toast.success("Booking created successfully");
      router.push("/bookings");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create booking");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="mb-5 flex flex-col justify-between gap-4 sm:mb-6 lg:flex-row lg:items-center">
          <div>
            <Link
              href="/bookings"
              className="mb-3 inline-flex items-center gap-2 text-xs font-black text-teal-700 sm:text-sm"
            >
              <ArrowLeft size={16} />
              Back to bookings
            </Link>

            <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
              Add Booking
            </h2>

            <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
              Create customer booking and track payment details.
            </p>
          </div>
        </div>

        <form
          onSubmit={submitBooking}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5"
        >
          <div className="mb-5 rounded-2xl bg-linear-to-r from-teal-50 to-sky-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-teal-600 to-sky-600 text-white shadow">
                <BriefcaseBusiness size={21} />
              </div>

              <div>
                <h3 className="text-base font-black text-slate-900">
                  Booking Details
                </h3>
                <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
                  {leadId
                    ? "This booking is being created from a lead."
                    : "Fill booking information manually."}
                </p>
              </div>
            </div>
          </div>

          {loadingLead ? (
            <div className="mb-5 flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm font-bold text-slate-500">
              <Loader2 className="animate-spin" size={18} />
              Loading lead details...
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Customer Name *">
              <input
                name="customerName"
                value={form.customerName}
                onChange={handleChange}
                placeholder="Enter customer name"
                className="input-class"
              />
            </Field>

            <Field label="Phone *">
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                className="input-class"
              />
            </Field>

            <Field label="Email">
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter email address"
                className="input-class"
              />
            </Field>

            <Field label="Destination *">
              <input
                name="destination"
                value={form.destination}
                onChange={handleChange}
                placeholder="Dubai, Bali, Thailand..."
                className="input-class"
              />
            </Field>

            <Field label="Travel Date">
              <input
                name="travelDate"
                type="date"
                value={form.travelDate}
                onChange={handleChange}
                className="input-class"
              />
            </Field>

            <Field label="Return Date">
              <input
                name="returnDate"
                type="date"
                value={form.returnDate}
                onChange={handleChange}
                className="input-class"
              />
            </Field>

            <Field label="Adults">
              <input
                name="adults"
                type="number"
                min="1"
                value={form.adults}
                onChange={handleChange}
                className="input-class"
              />
            </Field>

            <Field label="Children">
              <input
                name="children"
                type="number"
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
                placeholder="Honeymoon Package, Family Tour..."
                className="input-class"
              />
            </Field>

            <Field label="Total Amount *">
              <input
                name="totalAmount"
                type="number"
                min="0"
                value={form.totalAmount}
                onChange={handleChange}
                placeholder="Total package amount"
                className="input-class"
              />
            </Field>

            <Field label="Paid Amount">
              <input
                name="paidAmount"
                type="number"
                min="0"
                value={form.paidAmount}
                onChange={handleChange}
                placeholder="Amount received"
                className="input-class"
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
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>

            {canAssign && (
              <Field label="Assigned To *">
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

            {!canAssign && (
              <Field label="Assigned To">
                <input
                  value={currentUser?.name || "Current user"}
                  disabled
                  className="input-class cursor-not-allowed bg-slate-50"
                />
              </Field>
            )}

            <div className="md:col-span-2 xl:col-span-3">
              <Field label="Notes">
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Hotel details, flight info, customer requirements, payment notes..."
                  rows={4}
                  className="input-class resize-none"
                />
              </Field>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 p-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <AmountBox label="Total Amount" value={form.totalAmount} />
              <AmountBox label="Paid Amount" value={form.paidAmount} />
              <AmountBox
                label="Pending Amount"
                value={
                  Math.max(
                    Number(form.totalAmount || 0) -
                      Number(form.paidAmount || 0),
                    0,
                  ) || 0
                }
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/bookings"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-teal-600 to-sky-600 px-6 py-3 text-sm font-black text-white shadow-lg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Save size={18} />
              )}
              {saving ? "Saving..." : "Save Booking"}
            </button>
          </div>
        </form>
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
        ₹{Number(value || 0).toLocaleString("en-IN")}
      </p>
    </div>
  );
};

export default AddBookingClient;
