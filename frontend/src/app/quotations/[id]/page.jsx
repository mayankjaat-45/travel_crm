"use client";

import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { API } from "@/lib/api";
import { getUser } from "@/lib/auth";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Download,
  FileText,
  Loader2,
  Plus,
  Printer,
  Save,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { MessageCircle } from "lucide-react";
import { openWhatsApp, quotationMessage } from "@/lib/whatsapp";

const statusOptions = ["draft", "sent", "accepted", "rejected", "converted"];

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

const QuotationDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const quotationId = params.id;

  const currentUser = getUser();

  const canDelete =
    currentUser?.role === "admin" || currentUser?.role === "manager";

  const canAssign =
    currentUser?.role === "admin" || currentUser?.role === "manager";

  const [quotation, setQuotation] = useState(null);
  const [members, setMembers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [converting, setConverting] = useState(false);

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
    discount: "",
    tax: "",
    inclusions: "",
    exclusions: "",
    terms: "",
    status: "draft",
    assignedTo: "",
  });

  const [items, setItems] = useState([
    {
      title: "",
      description: "",
      quantity: 1,
      price: "",
    },
  ]);

  const fetchQuotation = async () => {
    try {
      setLoading(true);

      const { data } = await API.get(`/api/quotations/${quotationId}`);

      const quotationData = data?.data;

      setQuotation(quotationData);

      setForm({
        customerName: quotationData?.customerName || "",
        phone: quotationData?.phone || "",
        email: quotationData?.email || "",
        destination: quotationData?.destination || "",
        travelDate: quotationData?.travelDate
          ? new Date(quotationData.travelDate).toISOString().slice(0, 10)
          : "",
        returnDate: quotationData?.returnDate
          ? new Date(quotationData.returnDate).toISOString().slice(0, 10)
          : "",
        adults: quotationData?.adults || 1,
        children: quotationData?.children || 0,
        packageName: quotationData?.packageName || "",
        discount: quotationData?.discount || "",
        tax: quotationData?.tax || "",
        inclusions: quotationData?.inclusions || "",
        exclusions: quotationData?.exclusions || "",
        terms: quotationData?.terms || "",
        status: quotationData?.status || "draft",
        assignedTo: quotationData?.assignedTo?._id || "",
      });

      setItems(
        quotationData?.items?.length
          ? quotationData.items.map((item) => ({
              title: item.title || "",
              description: item.description || "",
              quantity: item.quantity || 1,
              price: item.price || "",
            }))
          : [
              {
                title: "",
                description: "",
                quantity: 1,
                price: "",
              },
            ],
      );
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch quotation");
    } finally {
      setLoading(false);
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
    if (quotationId) {
      fetchQuotation();
      fetchMembers();
    }
  }, [quotationId]);

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

  const updateQuotation = async (e) => {
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

    try {
      setSaving(true);

      const payload = {
        ...form,
        adults: Number(form.adults) || 1,
        children: Number(form.children) || 0,
        discount: Number(form.discount || 0),
        tax: Number(form.tax || 0),
        items: cleanItems,
      };

      if (!canAssign) {
        delete payload.assignedTo;
      }

      await API.patch(`/api/quotations/${quotationId}`, payload);

      toast.success("Quotation updated successfully");
      fetchQuotation();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update quotation",
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteQuotation = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this quotation?",
    );

    if (!confirmDelete) return;

    try {
      setDeleting(true);

      await API.delete(`/api/quotations/${quotationId}`);

      toast.success("Quotation deleted successfully");
      router.push("/quotations");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to delete quotation",
      );
    } finally {
      setDeleting(false);
    }
  };

  const convertToBooking = async () => {
    const confirmConvert = window.confirm(
      "Are you sure you want to convert this quotation to booking?",
    );

    if (!confirmConvert) return;

    try {
      setConverting(true);

      const { data } = await API.post(
        `/api/quotations/${quotationId}/convert-to-booking`,
      );

      toast.success("Quotation converted to booking successfully");

      const bookingId = data?.data?._id;

      if (bookingId) {
        router.push(`/bookings/${bookingId}`);
      } else {
        fetchQuotation();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to convert quotation",
      );
    } finally {
      setConverting(false);
    }
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-5 flex flex-col justify-between gap-4 sm:mb-6 xl:flex-row xl:items-center">
            <div>
              <Link
                href="/quotations"
                className="mb-3 inline-flex items-center gap-2 text-xs font-black text-teal-700 sm:text-sm"
              >
                <ArrowLeft size={16} />
                Back to quotations
              </Link>

              <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
                Quotation Detail
              </h2>

              <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
                View, edit and print customer quotation.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
              {quotation &&
                quotation.status !== "converted" &&
                !quotation.convertedToBooking && (
                  <button
                    onClick={convertToBooking}
                    disabled={converting}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-teal-600 to-sky-600 px-4 py-3 text-xs font-black text-white transition hover:opacity-90 disabled:opacity-60 sm:px-5 sm:text-sm"
                  >
                    {converting ? (
                      <Loader2 className="animate-spin" size={17} />
                    ) : (
                      <BriefcaseBusiness size={17} />
                    )}
                    Convert
                  </button>
                )}

              {quotation?.phone && (
                <button
                  onClick={() =>
                    openWhatsApp(quotation.phone, quotationMessage(quotation))
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-black text-emerald-700 ring-1 ring-emerald-100 transition hover:bg-emerald-100 sm:px-5 sm:text-sm"
                >
                  <MessageCircle size={17} />
                  WhatsApp
                </button>
              )}

              {quotation?.convertedToBooking?._id && (
                <Link
                  href={`/bookings/${quotation.convertedToBooking._id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-black text-emerald-700 ring-1 ring-emerald-100 transition hover:bg-emerald-100 sm:px-5 sm:text-sm"
                >
                  <BriefcaseBusiness size={17} />
                  View Booking
                </Link>
              )}

              {quotation && (
                <Link
                  href={`/quotations/${quotationId}/print`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-black text-white transition hover:bg-slate-700 sm:px-5 sm:text-sm"
                >
                  <Printer size={17} />
                  Print
                </Link>
              )}

              {quotation && (
                <Link
                  href={`/quotations/${quotationId}/print`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-50 px-4 py-3 text-xs font-black text-sky-700 ring-1 ring-sky-100 transition hover:bg-sky-100 sm:px-5 sm:text-sm"
                >
                  <Download size={17} />
                  PDF
                </Link>
              )}

              {quotation && canDelete && (
                <button
                  onClick={deleteQuotation}
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
              Loading quotation detail...
            </div>
          ) : !quotation ? (
            <div className="rounded-2xl border border-red-100 bg-white p-8 text-center font-bold text-red-500 shadow-sm sm:rounded-3xl">
              Quotation not found.
            </div>
          ) : (
            <div className="grid gap-5 xl:grid-cols-[1fr_420px] xl:gap-6">
              <div className="space-y-5 xl:space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
                  <div className="flex flex-col justify-between gap-4 md:flex-row">
                    <div className="min-w-0">
                      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-teal-600 to-sky-600 text-white shadow">
                        <FileText size={21} />
                      </div>

                      <h3 className="truncate text-xl font-black text-slate-900 sm:text-2xl">
                        {quotation.customerName}
                      </h3>

                      <p className="mt-1 text-xs font-bold text-slate-400">
                        {quotation.quotationNo}
                      </p>

                      <p className="mt-1 wrap-break-word text-xs font-semibold text-slate-500 sm:text-sm">
                        {quotation.email || "No email"} • {quotation.phone}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-3 py-1.5 text-[11px] font-black capitalize sm:px-4 sm:py-2 sm:text-xs ${getStatusBadge(
                          quotation.status,
                        )}`}
                      >
                        {formatLabel(quotation.status)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:gap-4">
                    <InfoBox
                      label="Destination"
                      value={quotation.destination}
                    />
                    <InfoBox
                      label="Travel Date"
                      value={formatDate(quotation.travelDate)}
                    />
                    <InfoBox
                      label="Return Date"
                      value={formatDate(quotation.returnDate)}
                    />
                    <InfoBox label="Adults" value={quotation.adults ?? 1} />
                    <InfoBox label="Children" value={quotation.children ?? 0} />
                    <InfoBox
                      label="Package"
                      value={quotation.packageName || "-"}
                    />
                    <InfoBox
                      label="Subtotal"
                      value={formatMoney(quotation.subTotal)}
                    />
                    <InfoBox
                      label="Discount"
                      value={formatMoney(quotation.discount)}
                    />
                    <InfoBox label="Tax" value={formatMoney(quotation.tax)} />
                    <InfoBox
                      label="Total"
                      value={formatMoney(quotation.totalAmount)}
                    />
                    <InfoBox
                      label="Assigned To"
                      value={quotation.assignedTo?.name || "Not assigned"}
                    />
                    <InfoBox
                      label="Created By"
                      value={quotation.createdBy?.name || "-"}
                    />
                  </div>

                  {quotation.lead?._id && (
                    <div className="mt-5 rounded-2xl bg-cyan-50 p-4">
                      <p className="text-xs font-black uppercase tracking-wide text-teal-700">
                        Linked Lead
                      </p>
                      <Link
                        href={`/leads/${quotation.lead._id}`}
                        className="mt-2 inline-block text-sm font-black text-teal-800 hover:underline"
                      >
                        {quotation.lead.name} • {quotation.lead.destination}
                      </Link>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
                  <h3 className="mb-4 text-base font-black text-slate-900 sm:text-lg">
                    Quotation Items
                  </h3>

                  <div className="space-y-3">
                    {quotation.items?.map((item, index) => (
                      <div
                        key={index}
                        className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                      >
                        <div className="flex justify-between gap-3">
                          <div>
                            <p className="font-black text-slate-900">
                              {item.title}
                            </p>
                            {item.description && (
                              <p className="mt-1 text-xs font-semibold text-slate-500">
                                {item.description}
                              </p>
                            )}
                            <p className="mt-2 text-xs font-bold text-slate-400">
                              Qty: {item.quantity}
                            </p>
                          </div>

                          <p className="shrink-0 text-sm font-black text-slate-900">
                            {formatMoney(
                              Number(item.quantity || 1) *
                                Number(item.price || 0),
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-3">
                  <TextBlock title="Inclusions" value={quotation.inclusions} />
                  <TextBlock title="Exclusions" value={quotation.exclusions} />
                  <TextBlock title="Terms" value={quotation.terms} />
                </div>
              </div>

              <form
                onSubmit={updateQuotation}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5"
              >
                <h3 className="mb-4 text-base font-black text-slate-900 sm:text-lg">
                  Edit Quotation
                </h3>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <Field label="Customer Name">
                    <input
                      name="customerName"
                      value={form.customerName}
                      onChange={handleChange}
                      className="input-class"
                    />
                  </Field>

                  <Field label="Phone">
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className="input-class"
                    />
                  </Field>

                  <Field label="Email">
                    <input
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className="input-class"
                    />
                  </Field>

                  <Field label="Destination">
                    <input
                      name="destination"
                      value={form.destination}
                      onChange={handleChange}
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
                      className="input-class"
                    />
                  </Field>

                  <Field label="Status">
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
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                        Items
                      </p>

                      <button
                        type="button"
                        onClick={addItem}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-black text-white"
                      >
                        <Plus size={14} />
                        Add
                      </button>
                    </div>

                    <div className="space-y-3">
                      {items.map((item, index) => (
                        <div
                          key={index}
                          className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                        >
                          <div className="mb-3 flex justify-between gap-2">
                            <p className="text-xs font-black text-slate-700">
                              Item #{index + 1}
                            </p>

                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="text-red-600"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>

                          <div className="space-y-2">
                            <input
                              value={item.title}
                              onChange={(e) =>
                                handleItemChange(index, "title", e.target.value)
                              }
                              placeholder="Title"
                              className="input-class"
                            />

                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    "quantity",
                                    e.target.value,
                                  )
                                }
                                placeholder="Qty"
                                className="input-class"
                              />

                              <input
                                type="number"
                                min="0"
                                value={item.price}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    "price",
                                    e.target.value,
                                  )
                                }
                                placeholder="Price"
                                className="input-class"
                              />
                            </div>

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
                              placeholder="Description"
                              className="input-class resize-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Field label="Discount">
                    <input
                      type="number"
                      name="discount"
                      min="0"
                      value={form.discount}
                      onChange={handleChange}
                      className="input-class"
                    />
                  </Field>

                  <Field label="Tax">
                    <input
                      type="number"
                      name="tax"
                      min="0"
                      value={form.tax}
                      onChange={handleChange}
                      className="input-class"
                    />
                  </Field>

                  <div className="sm:col-span-2 xl:col-span-1">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                        <AmountBox label="Subtotal" value={subTotal} />
                        <AmountBox
                          label="Discount"
                          value={form.discount || 0}
                        />
                        <AmountBox label="Tax" value={form.tax || 0} />
                        <AmountBox label="Total" value={totalAmount} />
                      </div>
                    </div>
                  </div>

                  <div className="sm:col-span-2 xl:col-span-1">
                    <Field label="Inclusions">
                      <textarea
                        name="inclusions"
                        value={form.inclusions}
                        onChange={handleChange}
                        rows={3}
                        className="input-class resize-none"
                      />
                    </Field>
                  </div>

                  <div className="sm:col-span-2 xl:col-span-1">
                    <Field label="Exclusions">
                      <textarea
                        name="exclusions"
                        value={form.exclusions}
                        onChange={handleChange}
                        rows={3}
                        className="input-class resize-none"
                      />
                    </Field>
                  </div>

                  <div className="sm:col-span-2 xl:col-span-1">
                    <Field label="Terms">
                      <textarea
                        name="terms"
                        value={form.terms}
                        onChange={handleChange}
                        rows={4}
                        className="input-class resize-none"
                      />
                    </Field>
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
            </div>
          )}
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

const TextBlock = ({ title, value }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-black text-slate-900">{title}</p>
      <p className="mt-2 whitespace-pre-line text-xs font-semibold leading-relaxed text-slate-600">
        {value || "-"}
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

export default QuotationDetailPage;
