"use client";

import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { API } from "@/lib/api";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarPlus,
  FileText,
  Loader2,
  Phone,
  Save,
  Trash2,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import { MessageCircle } from "lucide-react";
import { leadWhatsAppMessage, openWhatsApp } from "@/lib/whatsapp";

const statusOptions = [
  "new",
  "assigned",
  "contacted",
  "interested",
  "follow_up",
  "converted",
  "not_interested",
  "lost",
];

const sourceOptions = [
  "website",
  "whatsapp",
  "instagram",
  "facebook",
  "google_ads",
  "referral",
  "call",
  "walk_in",
  "other",
];

const priorityOptions = ["low", "medium", "high"];

const formatLabel = (value) => {
  if (!value) return "-";
  return String(value).replaceAll("_", " ");
};

const LeadDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id;

  const [lead, setLead] = useState(null);
  const [activities, setActivities] = useState([]);
  const [members, setMembers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [followSaving, setFollowSaving] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [assignedTo, setAssignedTo] = useState("");
  const [status, setStatus] = useState("");
  const [lostReason, setLostReason] = useState("");

  const [followForm, setFollowForm] = useState({
    followUpDate: "",
    followUpTime: "",
    remarks: "",
    assignedTo: "",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    email: "",
    destination: "",
    travelDate: "",
    returnDate: "",
    adults: 1,
    children: 0,
    budget: "",
    source: "other",
    priority: "medium",
    notes: "",
  });

  const fetchLead = async () => {
    try {
      setLoading(true);

      const { data } = await API.get(`/api/leads/${leadId}`);

      const responseData = data?.data;
      const leadData = responseData?.lead || responseData;

      setLead(leadData);
      setActivities(responseData?.activities || []);

      setAssignedTo(leadData?.assignedTo?._id || "");
      setStatus(leadData?.status || "");
      setLostReason(leadData?.lostReason || "");

      setFollowForm((prev) => ({
        ...prev,
        assignedTo: leadData?.assignedTo?._id || "",
      }));

      setEditForm({
        name: leadData?.name || "",
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
        budget: leadData?.budget || "",
        source: leadData?.source || "other",
        priority: leadData?.priority || "medium",
        notes: leadData?.notes || "",
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch lead");
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
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
    if (leadId) {
      fetchLead();
      fetchMembers();
    }
  }, [leadId]);

  const handleAssign = async () => {
    if (!assignedTo) {
      toast.error("Please select a member");
      return;
    }

    try {
      setAssigning(true);

      await API.patch(`/api/leads/${leadId}/assign`, {
        assignedTo,
      });

      toast.success("Lead assigned successfully");
      fetchLead();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to assign lead");
    } finally {
      setAssigning(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!status) {
      toast.error("Please select status");
      return;
    }

    try {
      setStatusSaving(true);

      await API.patch(`/api/leads/${leadId}/status`, {
        status,
        lostReason,
      });

      toast.success("Lead status updated");
      fetchLead();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
    } finally {
      setStatusSaving(false);
    }
  };

  const handleFollowChange = (e) => {
    setFollowForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const createFollowUp = async (e) => {
    e.preventDefault();

    if (!followForm.followUpDate || !followForm.assignedTo) {
      toast.error("Follow-up date and assigned member are required");
      return;
    }

    try {
      setFollowSaving(true);

      await API.post("/api/follow-ups", {
        lead: leadId,
        followUpDate: followForm.followUpDate,
        followUpTime: followForm.followUpTime,
        remarks: followForm.remarks,
        assignedTo: followForm.assignedTo,
      });

      toast.success("Follow-up created successfully");

      setFollowForm({
        followUpDate: "",
        followUpTime: "",
        remarks: "",
        assignedTo: assignedTo || "",
      });

      fetchLead();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to create follow-up",
      );
    } finally {
      setFollowSaving(false);
    }
  };

  const handleEditChange = (e) => {
    setEditForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const updateLeadDetails = async (e) => {
    e.preventDefault();

    if (!editForm.name || !editForm.phone) {
      toast.error("Name and phone are required");
      return;
    }

    try {
      setEditSaving(true);

      await API.patch(`/api/leads/${leadId}`, {
        ...editForm,
        adults: Number(editForm.adults) || 1,
        children: Number(editForm.children) || 0,
        budget: editForm.budget ? Number(editForm.budget) : undefined,
      });

      toast.success("Lead updated successfully");
      fetchLead();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update lead");
    } finally {
      setEditSaving(false);
    }
  };

  const deleteLead = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this lead?",
    );

    if (!confirmDelete) return;

    try {
      setDeleting(true);

      await API.delete(`/api/leads/${leadId}`);

      toast.success("Lead deleted successfully");
      router.push("/leads");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete lead");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="mb-5 flex flex-col gap-4 sm:mb-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <Link
              href="/leads"
              className="mb-3 inline-flex items-center gap-2 text-xs font-black text-teal-700 sm:text-sm"
            >
              <ArrowLeft size={16} />
              Back to leads
            </Link>

            <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
              Lead Detail
            </h2>

            <p className="mt-1 max-w-2xl text-xs font-semibold leading-relaxed text-slate-500 sm:text-sm">
              View customer details, assign lead, create quotation, booking and
              follow-ups.
            </p>
          </div>

          <div className="grid w-full grid-cols-2 gap-2.5 sm:w-auto sm:grid-cols-3 sm:gap-3 lg:flex lg:flex-wrap lg:justify-end">
            {lead?.phone && (
              <a
                href={`tel:${lead.phone}`}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-3 text-xs font-black text-white transition hover:bg-slate-700 sm:px-4 sm:text-sm lg:px-5"
              >
                <Phone size={17} />
                Call
              </a>
            )}

            {lead?.phone && (
              <button
                onClick={() =>
                  openWhatsApp(lead.phone, leadWhatsAppMessage(lead))
                }
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-50 px-3 py-3 text-xs font-black text-emerald-700 ring-1 ring-emerald-100 transition hover:bg-emerald-100 sm:px-4 sm:text-sm lg:px-5"
              >
                <MessageCircle size={17} />
                WhatsApp
              </button>
            )}

            {lead && (
              <Link
                href={`/quotations/add?lead=${lead._id}`}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-50 px-3 py-3 text-xs font-black text-sky-700 ring-1 ring-sky-100 transition hover:bg-sky-100 sm:px-4 sm:text-sm lg:px-5"
              >
                <FileText size={17} />
                Quote
              </Link>
            )}

            {lead && (
              <Link
                href={`/bookings/add?lead=${lead._id}`}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-teal-600 to-sky-600 px-3 py-3 text-xs font-black text-white transition hover:opacity-90 sm:px-4 sm:text-sm lg:px-5"
              >
                <BriefcaseBusiness size={17} />
                Booking
              </Link>
            )}

            {lead && lead.status === "converted" && (
              <Link
                href={`/bookings?search=${encodeURIComponent(lead.phone || lead.name)}`}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-50 px-3 py-3 text-xs font-black text-emerald-700 ring-1 ring-emerald-100 transition hover:bg-emerald-100 sm:px-4 sm:text-sm lg:px-5"
              >
                <BriefcaseBusiness size={17} />
                Bookings
              </Link>
            )}

            {lead && (
              <button
                onClick={deleteLead}
                disabled={deleting}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-3 py-3 text-xs font-black text-white transition hover:bg-red-700 disabled:opacity-60 sm:px-4 sm:text-sm lg:px-5"
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
            Loading lead detail...
          </div>
        ) : !lead ? (
          <div className="rounded-2xl border border-red-100 bg-white p-8 text-center font-bold text-red-500 shadow-sm sm:rounded-3xl">
            Lead not found.
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px] xl:gap-6">
            <div className="space-y-5 xl:space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
                <div className="flex flex-col justify-between gap-4 md:flex-row">
                  <div className="min-w-0">
                    <h3 className="truncate text-xl font-black text-slate-900 sm:text-2xl">
                      {lead.name}
                    </h3>

                    <p className="mt-1 wrap-break-word text-xs font-semibold text-slate-500 sm:text-sm">
                      {lead.email || "No email"} • {lead.phone}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-cyan-50 px-3 py-1.5 text-[11px] font-black capitalize text-teal-700 sm:px-4 sm:py-2 sm:text-xs">
                      {formatLabel(lead.status)}
                    </span>

                    <span className="rounded-full bg-amber-50 px-3 py-1.5 text-[11px] font-black capitalize text-amber-700 sm:px-4 sm:py-2 sm:text-xs">
                      {lead.priority}
                    </span>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:gap-4">
                  <InfoBox
                    label="Destination"
                    value={lead.destination || "-"}
                  />
                  <InfoBox
                    label="Travel Date"
                    value={
                      lead.travelDate
                        ? new Date(lead.travelDate).toLocaleDateString()
                        : "-"
                    }
                  />
                  <InfoBox
                    label="Return Date"
                    value={
                      lead.returnDate
                        ? new Date(lead.returnDate).toLocaleDateString()
                        : "-"
                    }
                  />
                  <InfoBox label="Adults" value={lead.adults ?? 1} />
                  <InfoBox label="Children" value={lead.children ?? 0} />
                  <InfoBox
                    label="Budget"
                    value={
                      lead.budget
                        ? `₹${Number(lead.budget).toLocaleString("en-IN")}`
                        : "-"
                    }
                  />
                  <InfoBox label="Source" value={formatLabel(lead.source)} />
                  <InfoBox
                    label="Assigned To"
                    value={lead.assignedTo?.name || "Not assigned"}
                  />
                  <InfoBox
                    label="Next Follow-up"
                    value={
                      lead.nextFollowUpDate
                        ? new Date(lead.nextFollowUpDate).toLocaleDateString()
                        : "-"
                    }
                  />
                </div>

                {lead.notes && (
                  <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                      Notes
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-700">
                      {lead.notes}
                    </p>
                  </div>
                )}

                {lead.lostReason && (
                  <div className="mt-5 rounded-2xl bg-red-50 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-red-400">
                      Lost Reason
                    </p>
                    <p className="mt-2 text-sm font-semibold text-red-700">
                      {lead.lostReason}
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
                <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="text-base font-black text-slate-900 sm:text-lg">
                      Activity Timeline
                    </h3>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Recent lead updates and actions.
                    </p>
                  </div>

                  <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-600">
                    {activities.length} logs
                  </span>
                </div>

                <div className="space-y-3">
                  {activities.length ? (
                    activities.map((activity) => (
                      <div
                        key={activity._id}
                        className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-sm font-black capitalize text-slate-900">
                              {formatLabel(activity.action)}
                            </p>

                            <p className="mt-1 wrap-break-word text-xs font-semibold leading-relaxed text-slate-600 sm:text-sm">
                              {activity.message}
                            </p>
                          </div>

                          <p className="shrink-0 text-xs font-bold text-slate-400 sm:text-right">
                            {activity.createdAt
                              ? new Date(activity.createdAt).toLocaleString()
                              : ""}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                      <p className="text-sm font-black text-slate-700">
                        No activity logs found.
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-400">
                        Lead updates will appear here.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-5 xl:space-y-6">
              <form
                onSubmit={updateLeadDetails}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5"
              >
                <h3 className="mb-4 text-base font-black text-slate-900 sm:text-lg">
                  Edit Lead
                </h3>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <Field label="Name">
                    <input
                      name="name"
                      value={editForm.name}
                      onChange={handleEditChange}
                      placeholder="Customer name"
                      className="input-class"
                    />
                  </Field>

                  <Field label="Phone">
                    <input
                      name="phone"
                      value={editForm.phone}
                      onChange={handleEditChange}
                      placeholder="Phone"
                      className="input-class"
                    />
                  </Field>

                  <Field label="Email">
                    <input
                      name="email"
                      value={editForm.email}
                      onChange={handleEditChange}
                      placeholder="Email"
                      className="input-class"
                    />
                  </Field>

                  <Field label="Destination">
                    <input
                      name="destination"
                      value={editForm.destination}
                      onChange={handleEditChange}
                      placeholder="Destination"
                      className="input-class"
                    />
                  </Field>

                  <Field label="Travel Date">
                    <input
                      type="date"
                      name="travelDate"
                      value={editForm.travelDate}
                      onChange={handleEditChange}
                      className="input-class"
                    />
                  </Field>

                  <Field label="Return Date">
                    <input
                      type="date"
                      name="returnDate"
                      value={editForm.returnDate}
                      onChange={handleEditChange}
                      className="input-class"
                    />
                  </Field>

                  <Field label="Adults">
                    <input
                      type="number"
                      name="adults"
                      value={editForm.adults}
                      onChange={handleEditChange}
                      className="input-class"
                    />
                  </Field>

                  <Field label="Children">
                    <input
                      type="number"
                      name="children"
                      value={editForm.children}
                      onChange={handleEditChange}
                      className="input-class"
                    />
                  </Field>

                  <Field label="Budget">
                    <input
                      type="number"
                      name="budget"
                      value={editForm.budget}
                      onChange={handleEditChange}
                      placeholder="Budget"
                      className="input-class"
                    />
                  </Field>

                  <Field label="Source">
                    <select
                      name="source"
                      value={editForm.source}
                      onChange={handleEditChange}
                      className="input-class"
                    >
                      {sourceOptions.map((item) => (
                        <option key={item} value={item}>
                          {formatLabel(item)}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Priority">
                    <select
                      name="priority"
                      value={editForm.priority}
                      onChange={handleEditChange}
                      className="input-class"
                    >
                      {priorityOptions.map((item) => (
                        <option key={item} value={item}>
                          {formatLabel(item)}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <div className="sm:col-span-2 xl:col-span-1">
                    <Field label="Notes">
                      <textarea
                        name="notes"
                        value={editForm.notes}
                        onChange={handleEditChange}
                        rows={3}
                        placeholder="Notes"
                        className="input-class resize-none"
                      />
                    </Field>
                  </div>
                </div>

                <button
                  disabled={editSaving}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-700 disabled:opacity-60"
                >
                  {editSaving ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Save size={18} />
                  )}
                  Save Changes
                </button>
              </form>

              <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-1">
                <ActionCard
                  title="Assign Lead"
                  description="Assign this enquiry to a manager or sales member."
                  icon={UserCheck}
                >
                  <div className="space-y-3">
                    <select
                      value={assignedTo}
                      onChange={(e) => setAssignedTo(e.target.value)}
                      className="input-class"
                    >
                      <option value="">Select member</option>
                      {members.map((member) => (
                        <option key={member._id} value={member._id}>
                          {member.name} ({member.role})
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={handleAssign}
                      disabled={assigning}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-teal-600 to-sky-600 px-4 py-3 text-sm font-black text-white transition hover:opacity-90 disabled:opacity-60"
                    >
                      {assigning ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <UserCheck size={18} />
                      )}
                      {assigning ? "Assigning..." : "Assign Lead"}
                    </button>
                  </div>
                </ActionCard>

                <ActionCard
                  title="Update Status"
                  description="Change lead stage and mark lost reason if needed."
                  icon={Save}
                >
                  <div className="space-y-3">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="input-class"
                    >
                      {statusOptions.map((item) => (
                        <option key={item} value={item}>
                          {formatLabel(item)}
                        </option>
                      ))}
                    </select>

                    {status === "lost" && (
                      <textarea
                        value={lostReason}
                        onChange={(e) => setLostReason(e.target.value)}
                        rows={3}
                        placeholder="Reason for lost lead"
                        className="input-class resize-none"
                      />
                    )}

                    <button
                      onClick={handleStatusUpdate}
                      disabled={statusSaving}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-700 disabled:opacity-60"
                    >
                      {statusSaving ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <Save size={18} />
                      )}
                      {statusSaving ? "Updating..." : "Update Status"}
                    </button>
                  </div>
                </ActionCard>
              </div>

              <form
                onSubmit={createFollowUp}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5"
              >
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-teal-700">
                    <CalendarPlus size={19} />
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-900 sm:text-lg">
                      Create Follow-up
                    </h3>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Schedule next call or reminder for this lead.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <Field label="Date">
                    <input
                      type="date"
                      name="followUpDate"
                      value={followForm.followUpDate}
                      onChange={handleFollowChange}
                      className="input-class"
                    />
                  </Field>

                  <Field label="Time">
                    <input
                      type="text"
                      name="followUpTime"
                      value={followForm.followUpTime}
                      onChange={handleFollowChange}
                      placeholder="11:30 AM"
                      className="input-class"
                    />
                  </Field>

                  <div className="sm:col-span-2 xl:col-span-1">
                    <Field label="Assigned To">
                      <select
                        name="assignedTo"
                        value={followForm.assignedTo}
                        onChange={handleFollowChange}
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
                  </div>

                  <div className="sm:col-span-2 xl:col-span-1">
                    <Field label="Remarks">
                      <textarea
                        name="remarks"
                        value={followForm.remarks}
                        onChange={handleFollowChange}
                        rows={3}
                        placeholder="Follow-up remarks"
                        className="input-class resize-none"
                      />
                    </Field>
                  </div>
                </div>

                <button
                  disabled={followSaving}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-teal-600 to-sky-600 px-4 py-3 text-sm font-black text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  {followSaving ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <CalendarPlus size={18} />
                  )}
                  {followSaving ? "Creating..." : "Create Follow-up"}
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

const ActionCard = ({ title, description, icon: Icon, children }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
      <div className="mb-4 flex items-start gap-3">
        {Icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-teal-700">
            <Icon size={19} />
          </div>
        )}

        <div>
          <h3 className="text-base font-black text-slate-900 sm:text-lg">
            {title}
          </h3>

          {description && (
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {description}
            </p>
          )}
        </div>
      </div>

      {children}
    </div>
  );
};

export default LeadDetailPage;
