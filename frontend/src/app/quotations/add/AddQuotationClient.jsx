"use client";

import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { API } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { ArrowLeft, FileText, Loader2, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

const statusOptions = ["draft", "sent", "accepted", "rejected"];

const defaultTerms = `1. Quotation is valid for 7 days from the date of issue.
2. Booking will be confirmed after advance payment.
3. Hotel and transport are subject to availability.
4. Cancellation charges may apply as per vendor policy.`;

const AddQuotationClient = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leadId = searchParams.get("lead");

  const currentUser = getUser();

  const canAssign =
    currentUser?.role === "admin" || currentUser?.role === "manager";

  const [saving, setSaving] = useState(false);
  const [loadingLead, setLoadingLead] = useState(false);
  const [members, setMembers] = useState([]);

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
    discount: "",
    tax: "",
    inclusions: "",
    exclusions: "",
    terms: defaultTerms,
    status: "draft",
    assignedTo: "",
  });

  const [items, setItems] = useState([
    {
      title: "Travel Package",
      description: "",
      quantity: 1,
      price: "",
    },
  ]);

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

  const fetchLeadForQuotation = async () => {
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
        assignedTo: leadData?.assignedTo?._id || currentUser?._id || "",
      }));

      if (leadData?.budget) {
        setItems([
          {
            title: `${leadData.destination || "Travel"} Package`,
            description:
              "Customized travel package as per customer requirement",
            quantity: 1,
            price: String(leadData.budget),
          },
        ]);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch lead");
    } finally {
      setLoadingLead(false);
    }
  };

  useEffect(() => {
    fetchMembers();
    fetchLeadForQuotation();
  }, [leadId]);

  const subTotal = useMemo(() => {
    return items.reduce((sum, item) => {
      return sum + Number(item.quantity || 1) * Number(item.price || 0);
    }, 0);
  }, [items]);

  const totalAmount = useMemo(() => {
    const discount = Number(form.discount || 0);
    const tax = Number(form.tax || 0);

    return Math.max(subTotal - discount + tax, 0);
  }, [subTotal, form.discount, form.tax]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        title: "",
        description: "",
        quantity: 1,
        price: "",
      },
    ]);
  };

  const removeItem = (index) => {
    if (items.length === 1) {
      toast.error("At least one item is required");
      return;
    }

    setItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const submitQuotation = async (e) => {
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

    const cleanItems = items
      .map((item) => ({
        title: item.title.trim(),
        description: item.description.trim(),
        quantity: Number(item.quantity || 1),
        price: Number(item.price || 0),
      }))
      .filter((item) => item.title && item.price > 0);

    if (!cleanItems.length) {
      toast.error("At least one valid quotation item is required");
      return;
    }

    if (canAssign && !form.assignedTo) {
      toast.error("Assigned member is required");
      return;
    }

    try {
      setSaving(true);

      await API.post("/api/quotations", {
        ...form,
        lead: form.lead || undefined,
        adults: Number(form.adults) || 1,
        children: Number(form.children) || 0,
        discount: Number(form.discount || 0),
        tax: Number(form.tax || 0),
        assignedTo: form.assignedTo || currentUser?._id,
        items: cleanItems,
      });

      toast.success("Quotation created successfully");
      router.push("/quotations");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to create quotation",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-5 flex flex-col justify-between gap-4 sm:mb-6 lg:flex-row lg:items-center">
            <div>
              <Link
                href="/quotations"
                className="mb-3 inline-flex items-center gap-2 text-xs font-black text-teal-700 sm:text-sm"
              >
                <ArrowLeft size={16} />
                Back to quotations
              </Link>

              <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
                Add Quotation
              </h2>

              <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
                Create a travel package quotation with items, pricing and terms.
              </p>
            </div>
          </div>

          <form onSubmit={submitQuotation} className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
              <div className="mb-5 rounded-2xl bg-linear-to-r from-teal-50 to-sky-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-teal-600 to-sky-600 text-white shadow">
                    <FileText size={21} />
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      Customer & Travel Details
                    </h3>
                    <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
                      {leadId
                        ? "This quotation is being created from a lead."
                        : "Fill quotation information manually."}
                    </p>
                  </div>
                </div>
              </div>

              {loadingLead && (
                <div className="mb-5 flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm font-bold text-slate-500">
                  <Loader2 className="animate-spin" size={18} />
                  Loading lead details...
                </div>
              )}

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
                    placeholder="Family Tour, Honeymoon Package..."
                    className="input-class"
                  />
                </Field>

                <Field label="Quotation Status">
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="input-class"
                  >
                    {statusOptions.map((item) => (
                      <option key={item} value={item}>
                        {formatLabel(item)}
                      </option>
                    ))}
                  </select>
                </Field>

                {canAssign ? (
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
                ) : (
                  <Field label="Assigned To">
                    <input
                      value={currentUser?.name || "Current user"}
                      disabled
                      className="input-class cursor-not-allowed bg-slate-50"
                    />
                  </Field>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
              <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-base font-black text-slate-900 sm:text-lg">
                    Quotation Items
                  </h3>
                  <p className="text-xs font-semibold text-slate-500">
                    Add package, hotel, transport, visa, activities or service
                    charges.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-black text-white hover:bg-slate-700 sm:text-sm"
                >
                  <Plus size={16} />
                  Add Item
                </button>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-sm font-black text-slate-800">
                        Item #{index + 1}
                      </p>

                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-black text-red-700 hover:bg-red-100"
                      >
                        <Trash2 size={14} />
                        Remove
                      </button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_140px_180px]">
                      <Field label="Title">
                        <input
                          value={item.title}
                          onChange={(e) =>
                            handleItemChange(index, "title", e.target.value)
                          }
                          placeholder="Hotel, Transport, Package..."
                          className="input-class"
                        />
                      </Field>

                      <Field label="Quantity">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(index, "quantity", e.target.value)
                          }
                          className="input-class"
                        />
                      </Field>

                      <Field label="Price">
                        <input
                          type="number"
                          min="0"
                          value={item.price}
                          onChange={(e) =>
                            handleItemChange(index, "price", e.target.value)
                          }
                          placeholder="Price"
                          className="input-class"
                        />
                      </Field>

                      <div className="md:col-span-2 xl:col-span-3">
                        <Field label="Description">
                          <textarea
                            value={item.description}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "description",
                                e.target.value,
                              )
                            }
                            rows={2}
                            placeholder="Item description"
                            className="input-class resize-none"
                          />
                        </Field>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Field label="Discount">
                  <input
                    name="discount"
                    type="number"
                    min="0"
                    value={form.discount}
                    onChange={handleChange}
                    placeholder="Discount amount"
                    className="input-class"
                  />
                </Field>

                <Field label="Tax">
                  <input
                    name="tax"
                    type="number"
                    min="0"
                    value={form.tax}
                    onChange={handleChange}
                    placeholder="Tax amount"
                    className="input-class"
                  />
                </Field>
              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <AmountBox label="Subtotal" value={subTotal} />
                  <AmountBox
                    label="Discount + Tax"
                    value={Number(form.tax || 0) - Number(form.discount || 0)}
                  />
                  <AmountBox label="Total Amount" value={totalAmount} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
              <h3 className="mb-4 text-base font-black text-slate-900 sm:text-lg">
                Inclusions, Exclusions & Terms
              </h3>

              <div className="grid gap-4 lg:grid-cols-3">
                <Field label="Inclusions">
                  <textarea
                    name="inclusions"
                    value={form.inclusions}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Hotel stay, meals, sightseeing..."
                    className="input-class resize-none"
                  />
                </Field>

                <Field label="Exclusions">
                  <textarea
                    name="exclusions"
                    value={form.exclusions}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Flights, personal expenses..."
                    className="input-class resize-none"
                  />
                </Field>

                <Field label="Terms & Conditions">
                  <textarea
                    name="terms"
                    value={form.terms}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Terms and conditions"
                    className="input-class resize-none"
                  />
                </Field>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Link
                href="/quotations"
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
                {saving ? "Saving..." : "Save Quotation"}
              </button>
            </div>
          </form>
        </div>
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

const formatLabel = (value) => {
  if (!value) return "-";
  return String(value).replaceAll("_", " ");
};

export default AddQuotationClient;
