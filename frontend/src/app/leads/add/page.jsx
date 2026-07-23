"use client";

import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { API } from "@/lib/api";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

const sourceOptions = [
  { label: "Website", value: "website" },
  { label: "WhatsApp", value: "whatsapp" },
  { label: "Instagram", value: "instagram" },
  { label: "Facebook", value: "facebook" },
  { label: "Google Ads", value: "google_ads" },
  { label: "Referral", value: "referral" },
  { label: "Call", value: "call" },
  { label: "Walk-in", value: "walk_in" },
  { label: "Other", value: "other" },
];

const priorityOptions = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
];

const AddLeadPage = () => {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    destination: "",
    travelDate: "",
    returnDate: "",
    adults: 1,
    children: 0,
    budget: "",
    source: "whatsapp",
    priority: "medium",
    notes: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const submitLead = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Customer name is required");
      return;
    }

    if (!form.phone.trim()) {
      toast.error("Phone number is required");
      return;
    }

    try {
      setSaving(true);

      await API.post("/api/leads", {
        ...form,
        adults: Number(form.adults) || 1,
        children: Number(form.children) || 0,
        budget: form.budget ? Number(form.budget) : undefined,
      });

      toast.success("Lead created successfully");
      router.push("/leads");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create lead");
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
              href="/leads"
              className="mb-3 inline-flex items-center gap-2 text-xs font-black text-teal-700 sm:text-sm"
            >
              <ArrowLeft size={16} />
              Back to leads
            </Link>

            <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
              Add New Lead
            </h2>
            <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
              Add a new travel enquiry into the CRM.
            </p>
          </div>
        </div>

        <form
          onSubmit={submitLead}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5"
        >
          <div className="mb-5 rounded-2xl bg-linear-to-r from-teal-50 to-sky-50 p-4">
            <h3 className="text-base font-black text-slate-900">
              Customer & Trip Details
            </h3>
            <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
              Fill customer enquiry details carefully for better follow-up.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Customer Name *">
              <input
                name="name"
                value={form.name}
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

            <Field label="Destination">
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
                placeholder="Adults"
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
                placeholder="Children"
                className="input-class"
              />
            </Field>

            <Field label="Budget">
              <input
                name="budget"
                type="number"
                min="0"
                value={form.budget}
                onChange={handleChange}
                placeholder="Approx budget"
                className="input-class"
              />
            </Field>

            <Field label="Lead Source">
              <select
                name="source"
                value={form.source}
                onChange={handleChange}
                className="input-class"
              >
                {sourceOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Priority">
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="input-class"
              >
                {priorityOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>

            <div className="md:col-span-2 xl:col-span-3">
              <Field label="Notes">
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Add customer requirements, hotel preference, package details, etc."
                  rows={4}
                  className="input-class resize-none"
                />
              </Field>
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/leads"
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
              {saving ? "Saving..." : "Save Lead"}
            </button>
          </div>
        </form>
      </Layout>

      <style jsx global>{`
        .input-class {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgb(226 232 240);
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: rgb(30 41 59);
          background: white;
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

export default AddLeadPage;
