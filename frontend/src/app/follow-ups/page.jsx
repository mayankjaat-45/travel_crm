"use client";

import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { API } from "@/lib/api";
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  Eye,
  Loader2,
  RefreshCcw,
  Trash2,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const statusOptions = ["pending", "done", "missed", "rescheduled", "cancelled"];

const FollowUpsPage = () => {
  const [followUps, setFollowUps] = useState([]);
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [deletingId, setDeletingId] = useState("");

  const fetchFollowUps = async () => {
    try {
      setLoading(true);

      const params = {};
      if (type) params.type = type;
      if (status) params.status = status;

      const { data } = await API.get("/api/follow-ups", {
        params,
      });

      setFollowUps(data?.data || []);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch follow-ups",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, [type, status]);

  const updateFollowUpStatus = async (id, newStatus) => {
    try {
      setUpdatingId(id);

      await API.patch(`/api/follow-ups/${id}`, {
        status: newStatus,
      });

      toast.success("Follow-up updated successfully");
      fetchFollowUps();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update follow-up",
      );
    } finally {
      setUpdatingId("");
    }
  };

  const deleteFollowUp = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this follow-up?",
    );

    if (!confirmDelete) return;

    try {
      setDeletingId(id);

      await API.delete(`/api/follow-ups/${id}`);

      toast.success("Follow-up deleted successfully");
      fetchFollowUps();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to delete follow-up",
      );
    } finally {
      setDeletingId("");
    }
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

  const getStatusBadge = (value) => {
    if (value === "done") return "bg-emerald-50 text-emerald-700";
    if (value === "missed") return "bg-red-50 text-red-700";
    if (value === "cancelled") return "bg-slate-100 text-slate-700";
    if (value === "rescheduled") return "bg-amber-50 text-amber-700";
    return "bg-cyan-50 text-teal-700";
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-5 flex flex-col justify-between gap-4 md:mb-6 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
                Follow-ups
              </h2>
              <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
                Track pending, today, overdue and completed follow-ups.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
              <button
                onClick={fetchFollowUps}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-black text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-60 sm:px-5 sm:text-sm"
              >
                <RefreshCcw
                  size={17}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>

              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700 outline-none focus:border-teal-500 sm:text-sm"
              >
                <option value="">All</option>
                <option value="today">Today</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>

          <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-4">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-500 sm:max-w-xs"
            >
              <option value="">All Status</option>
              {statusOptions.map((item) => (
                <option key={item} value={item}>
                  {formatLabel(item)}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-5">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-12 font-bold text-slate-500">
                <Loader2 className="animate-spin" size={18} />
                Loading follow-ups...
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                  {followUps.map((item) => (
                    <div
                      key={item._id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-black text-slate-900">
                            {item.lead?.name || "-"}
                          </h3>

                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {item.lead?.email || "No email"}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-black capitalize ${getStatusBadge(
                            item.status,
                          )}`}
                        >
                          {formatLabel(item.status)}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <FollowInfo
                          label="Phone"
                          value={item.lead?.phone || "-"}
                        />
                        <FollowInfo
                          label="Destination"
                          value={item.lead?.destination || "-"}
                        />
                        <FollowInfo
                          label="Date"
                          value={formatDate(item.followUpDate)}
                          icon={CalendarCheck}
                        />
                        <FollowInfo
                          label="Time"
                          value={item.followUpTime || "-"}
                          icon={Clock}
                        />
                        <FollowInfo
                          label="Assigned"
                          value={item.assignedTo?.name || "-"}
                          icon={UserCheck}
                        />
                        <FollowInfo
                          label="Lead Status"
                          value={formatLabel(item.lead?.status)}
                        />
                      </div>

                      {item.remarks && (
                        <p className="mt-4 line-clamp-2 rounded-xl bg-slate-50 p-3 text-xs font-semibold leading-relaxed text-slate-600">
                          {item.remarks}
                        </p>
                      )}

                      <div className="mt-4 grid gap-3">
                        <select
                          value={item.status}
                          onChange={(e) =>
                            updateFollowUpStatus(item._id, e.target.value)
                          }
                          disabled={updatingId === item._id}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-bold capitalize text-slate-600 outline-none focus:border-teal-500"
                        >
                          {statusOptions.map((option) => (
                            <option key={option} value={option}>
                              {formatLabel(option)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        {item.lead?._id ? (
                          <Link
                            href={`/leads/${item.lead._id}`}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-50 px-4 py-3 text-xs font-black text-sky-700 hover:bg-sky-100"
                          >
                            <Eye size={15} />
                            View Lead
                          </Link>
                        ) : (
                          <div className="inline-flex items-center justify-center rounded-xl bg-slate-50 px-4 py-3 text-xs font-black text-slate-400">
                            No Lead
                          </div>
                        )}

                        {item.status !== "done" ? (
                          <button
                            onClick={() =>
                              updateFollowUpStatus(item._id, "done")
                            }
                            disabled={updatingId === item._id}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-black text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                          >
                            {updatingId === item._id ? (
                              <Loader2 className="animate-spin" size={15} />
                            ) : (
                              <CheckCircle2 size={15} />
                            )}
                            Done
                          </button>
                        ) : (
                          <button
                            onClick={() => deleteFollowUp(item._id)}
                            disabled={deletingId === item._id}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-xs font-black text-red-700 hover:bg-red-100 disabled:opacity-60"
                          >
                            {deletingId === item._id ? (
                              <Loader2 className="animate-spin" size={15} />
                            ) : (
                              <Trash2 size={15} />
                            )}
                            Delete
                          </button>
                        )}
                      </div>

                      {item.status !== "done" && (
                        <button
                          onClick={() => deleteFollowUp(item._id)}
                          disabled={deletingId === item._id}
                          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-xs font-black text-red-700 hover:bg-red-100 disabled:opacity-60"
                        >
                          {deletingId === item._id ? (
                            <Loader2 className="animate-spin" size={15} />
                          ) : (
                            <Trash2 size={15} />
                          )}
                          Delete Follow-up
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {!followUps.length && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-teal-700">
                      <CalendarCheck size={24} />
                    </div>
                    <p className="text-sm font-black text-slate-700">
                      No follow-ups found
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      Create follow-ups from lead detail page.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

const FollowInfo = ({ label, value, icon: Icon }) => {
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

export default FollowUpsPage;
