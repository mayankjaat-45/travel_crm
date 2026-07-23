"use client";

import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { API } from "@/lib/api";
import {
  CalendarDays,
  Eye,
  Loader2,
  MapPin,
  Phone,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

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

const LeadsPage = () => {
  const [leads, setLeads] = useState([]);
  const [members, setMembers] = useState([]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [assigningId, setAssigningId] = useState("");
  const [deletingId, setDeletingId] = useState("");

  const fetchLeads = async (pageNumber = page) => {
    try {
      setLoading(true);

      const { data } = await API.get("/api/leads", {
        params: {
          search,
          status,
          source,
          page: pageNumber,
          limit: 20,
        },
      });

      setLeads(data?.data || []);
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
      toast.error(error.response?.data?.message || "Failed to fetch leads");
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
    fetchLeads(1);
    fetchMembers();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLeads(1);
  };

  const updateLeadStatus = async (leadId, newStatus) => {
    try {
      setUpdatingId(leadId);

      await API.patch(`/api/leads/${leadId}/status`, {
        status: newStatus,
      });

      toast.success("Lead status updated");
      fetchLeads(page);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingId("");
    }
  };

  const assignLead = async (leadId, memberId) => {
    if (!memberId) return;

    try {
      setAssigningId(leadId);

      await API.patch(`/api/leads/${leadId}/assign`, {
        assignedTo: memberId,
      });

      toast.success("Lead assigned successfully");
      fetchLeads(page);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to assign lead");
    } finally {
      setAssigningId("");
    }
  };

  const deleteLead = async (leadId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this lead?",
    );

    if (!confirmDelete) return;

    try {
      setDeletingId(leadId);

      await API.delete(`/api/leads/${leadId}`);

      toast.success("Lead deleted successfully");

      if (leads.length === 1 && page > 1) {
        fetchLeads(page - 1);
      } else {
        fetchLeads(page);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete lead");
    } finally {
      setDeletingId("");
    }
  };

  const formatLabel = (value) => {
    if (!value) return "-";
    return value.replaceAll("_", " ");
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
    if (value === "converted") return "bg-emerald-50 text-emerald-700";
    if (value === "lost") return "bg-red-50 text-red-700";
    if (value === "interested") return "bg-sky-50 text-sky-700";
    if (value === "follow_up") return "bg-amber-50 text-amber-700";
    return "bg-cyan-50 text-teal-700";
  };

  const getPriorityBadge = (value) => {
    if (value === "high") return "bg-red-50 text-red-700";
    if (value === "low") return "bg-slate-100 text-slate-700";
    return "bg-amber-50 text-amber-700";
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-5 flex flex-col justify-between gap-4 md:mb-6 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
                Leads
              </h2>
              <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
                Manage enquiries, assign leads and update lead status.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
              <button
                onClick={() => fetchLeads(page)}
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
                href="/leads/add"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-teal-600 to-sky-600 px-4 py-3 text-xs font-black text-white shadow sm:px-5 sm:text-sm"
              >
                <Plus size={17} />
                Add Lead
              </Link>
            </div>
          </div>

          <form
            onSubmit={handleSearch}
            className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-4 lg:grid-cols-[1fr_180px_180px_auto]"
          >
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, phone, email, destination"
                className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none focus:border-teal-500"
              />
            </div>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-teal-500"
            >
              <option value="">All Status</option>
              {statusOptions.map((item) => (
                <option key={item} value={item}>
                  {formatLabel(item)}
                </option>
              ))}
            </select>

            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-teal-500"
            >
              <option value="">All Sources</option>
              {sourceOptions.map((item) => (
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
                Loading leads...
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                  {leads.map((lead) => (
                    <div
                      key={lead._id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-black text-slate-900">
                            {lead.name}
                          </h3>

                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <Phone size={13} />
                              {lead.phone}
                            </span>
                            {lead.email && (
                              <span className="truncate">{lead.email}</span>
                            )}
                          </div>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-black capitalize ${getStatusBadge(
                            lead.status,
                          )}`}
                        >
                          {formatLabel(lead.status)}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <LeadInfo
                          label="Destination"
                          value={lead.destination || "-"}
                          icon={MapPin}
                        />
                        <LeadInfo
                          label="Budget"
                          value={
                            lead.budget
                              ? `₹${Number(lead.budget).toLocaleString("en-IN")}`
                              : "-"
                          }
                        />
                        <LeadInfo
                          label="Travel Date"
                          value={formatDate(lead.travelDate)}
                          icon={CalendarDays}
                        />
                        <LeadInfo
                          label="Assigned"
                          value={lead.assignedTo?.name || "Not assigned"}
                        />
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-black capitalize ${getPriorityBadge(
                            lead.priority,
                          )}`}
                        >
                          {lead.priority}
                        </span>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black capitalize text-slate-700">
                          {formatLabel(lead.source)}
                        </span>
                      </div>

                      {lead.notes && (
                        <p className="mt-4 line-clamp-2 rounded-xl bg-slate-50 p-3 text-xs font-semibold leading-relaxed text-slate-600">
                          {lead.notes}
                        </p>
                      )}

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <select
                          value={lead.assignedTo?._id || ""}
                          onChange={(e) => assignLead(lead._id, e.target.value)}
                          disabled={assigningId === lead._id}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-bold text-slate-600 outline-none focus:border-teal-500"
                        >
                          <option value="">Assign member</option>
                          {members.map((member) => (
                            <option key={member._id} value={member._id}>
                              {member.name} ({member.role})
                            </option>
                          ))}
                        </select>

                        <select
                          value={lead.status}
                          onChange={(e) =>
                            updateLeadStatus(lead._id, e.target.value)
                          }
                          disabled={updatingId === lead._id}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-bold capitalize text-slate-600 outline-none focus:border-teal-500"
                        >
                          {statusOptions.map((item) => (
                            <option key={item} value={item}>
                              {formatLabel(item)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <Link
                          href={`/leads/${lead._id}`}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-50 px-4 py-3 text-xs font-black text-sky-700 hover:bg-sky-100"
                        >
                          <Eye size={15} />
                          View
                        </Link>

                        <button
                          onClick={() => deleteLead(lead._id)}
                          disabled={deletingId === lead._id}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-xs font-black text-red-700 hover:bg-red-100 disabled:opacity-60"
                        >
                          {deletingId === lead._id ? (
                            <Loader2 className="animate-spin" size={15} />
                          ) : (
                            <Trash2 size={15} />
                          )}
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {!leads.length && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-teal-700">
                      <UserCheck size={24} />
                    </div>
                    <p className="text-sm font-black text-slate-700">
                      No leads found
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      Add your first travel enquiry to start tracking.
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
              leads
            </p>

            <div className="grid w-full grid-cols-3 items-center gap-2 sm:w-auto">
              <button
                onClick={() => fetchLeads(page - 1)}
                disabled={page <= 1 || loading}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm"
              >
                Previous
              </button>

              <div className="rounded-xl bg-slate-100 px-3 py-2 text-center text-xs font-black text-slate-700 sm:px-4 sm:text-sm">
                {page}
              </div>

              <button
                onClick={() => fetchLeads(page + 1)}
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

const LeadInfo = ({ label, value, icon: Icon }) => {
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

export default LeadsPage;
