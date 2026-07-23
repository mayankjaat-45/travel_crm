"use client";

import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import StatCard from "@/components/StatCard";
import { API } from "@/lib/api";
import {
  BriefcaseBusiness,
  CalendarCheck,
  CheckCircle2,
  Clock,
  FileText,
  IndianRupee,
  Plane,
  UserPlus,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { downloadReport } from "@/lib/download";
import { toast } from "react-toastify";

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleExport = async (endpoint, filename) => {
    try {
      await downloadReport(endpoint, filename);
      toast.success("Report downloaded successfully");
    } catch (error) {
      toast.error("Failed to download report");
    }
  };
  const fetchStats = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/api/dashboard/stats");
      setStats(data?.data || null);
    } catch (error) {
      console.log("Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const cards = stats?.cards || {};

  return (
    <ProtectedRoute>
      <Layout>
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-lg font-black text-slate-900 sm:text-2xl">
              Travel CRM Dashboard
            </h2>
            <p className="mt-1 text-[12px] font-semibold leading-relaxed text-slate-500 sm:text-sm">
              Track leads, follow-ups and conversions in one place.
            </p>
            <div className="mb-5 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
              <button
                onClick={() => handleExport("/api/export/leads", "leads.xlsx")}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-black text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 sm:text-sm"
              >
                <Download size={16} />
                Leads
              </button>

              <button
                onClick={() =>
                  handleExport("/api/export/bookings", "bookings.xlsx")
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-black text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 sm:text-sm"
              >
                <Download size={16} />
                Bookings
              </button>

              <button
                onClick={() =>
                  handleExport("/api/export/quotations", "quotations.xlsx")
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-black text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 sm:text-sm"
              >
                <Download size={16} />
                Quotations
              </button>

              <button
                onClick={() =>
                  handleExport("/api/export/payments", "payments.xlsx")
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-black text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 sm:text-sm"
              >
                <Download size={16} />
                Payments
              </button>
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl bg-white p-5 text-center text-sm font-bold text-slate-500 shadow sm:rounded-3xl sm:p-8">
              Loading dashboard...
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-4">
                <StatCard
                  title="Total Leads"
                  value={cards.totalLeads}
                  icon={Users}
                />
                <StatCard
                  title="New Leads"
                  value={cards.newLeads}
                  icon={UserPlus}
                />
                <StatCard
                  title="Follow-ups Today"
                  value={cards.todayFollowUps}
                  icon={CalendarCheck}
                />
                <StatCard
                  title="Overdue Follow-ups"
                  value={cards.overdueFollowUps}
                  icon={Clock}
                />
                <StatCard
                  title="Interested"
                  value={cards.interestedLeads}
                  icon={Plane}
                />
                <StatCard
                  title="Converted"
                  value={cards.convertedLeads}
                  icon={CheckCircle2}
                />
                <StatCard title="Lost" value={cards.lostLeads} icon={XCircle} />
                <StatCard
                  title="Assigned"
                  value={cards.assignedLeads}
                  icon={Users}
                />

                <StatCard
                  title="Total Bookings"
                  value={cards.totalBookings}
                  icon={BriefcaseBusiness}
                />

                <StatCard
                  title="Confirmed"
                  value={cards.confirmedBookings}
                  icon={CheckCircle2}
                />

                <StatCard
                  title="Booking Revenue"
                  value={`₹${Number(cards.totalBookingAmount || 0).toLocaleString("en-IN")}`}
                  icon={IndianRupee}
                />

                <StatCard
                  title="Pending Payment"
                  value={`₹${Number(cards.pendingPaymentAmount || 0).toLocaleString("en-IN")}`}
                  icon={Wallet}
                />

                <StatCard
                  title="Total Quotations"
                  value={cards.totalQuotations}
                  icon={FileText}
                />

                <StatCard
                  title="Accepted Quotes"
                  value={cards.acceptedQuotations}
                  icon={CheckCircle2}
                />

                <StatCard
                  title="Converted Quotes"
                  value={cards.convertedQuotations}
                  icon={BriefcaseBusiness}
                />

                <StatCard
                  title="Quotation Value"
                  value={`₹${Number(cards.totalQuotationAmount || 0).toLocaleString("en-IN")}`}
                  icon={IndianRupee}
                />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:mt-6 sm:gap-4 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-5">
                  <h3 className="text-sm font-black text-slate-900 sm:text-lg">
                    Recent Leads
                  </h3>

                  <div className="mt-3 space-y-2.5 sm:mt-4 sm:space-y-3">
                    {stats?.recentLeads?.length ? (
                      stats.recentLeads.map((lead) => (
                        <div
                          key={lead._id}
                          className="rounded-xl border border-slate-100 bg-slate-50 p-3 sm:rounded-2xl sm:p-4"
                        >
                          <div className="truncate text-sm font-black text-slate-900 sm:text-base">
                            {lead.name}
                          </div>
                          <div className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-500 sm:text-sm">
                            {lead.destination || "No destination"} •{" "}
                            {lead.phone}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs font-semibold text-slate-500 sm:text-sm">
                        No recent leads found.
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-5">
                  <h3 className="text-sm font-black text-slate-900 sm:text-lg">
                    Today Follow-ups
                  </h3>

                  <div className="mt-3 space-y-2.5 sm:mt-4 sm:space-y-3">
                    {stats?.todaysFollowUpList?.length ? (
                      stats.todaysFollowUpList.map((item) => (
                        <div
                          key={item._id}
                          className="rounded-xl border border-slate-100 bg-slate-50 p-3 sm:rounded-2xl sm:p-4"
                        >
                          <div className="truncate text-sm font-black text-slate-900 sm:text-base">
                            {item.lead?.name || "Lead"}
                          </div>
                          <div className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-500 sm:text-sm">
                            {item.followUpTime || "Any time"} •{" "}
                            {item.assignedTo?.name || "Not assigned"}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs font-semibold text-slate-500 sm:text-sm">
                        No follow-ups for today.
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-5">
                  <h3 className="text-sm font-black text-slate-900 sm:text-lg">
                    Recent Bookings
                  </h3>

                  <div className="mt-3 space-y-2.5 sm:mt-4 sm:space-y-3">
                    {stats?.recentBookings?.length ? (
                      stats.recentBookings.map((booking) => (
                        <div
                          key={booking._id}
                          className="rounded-xl border border-slate-100 bg-slate-50 p-3 sm:rounded-2xl sm:p-4"
                        >
                          <div className="truncate text-sm font-black text-slate-900 sm:text-base">
                            {booking.customerName}
                          </div>

                          <div className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-500 sm:text-sm">
                            {booking.destination || "No destination"} • ₹
                            {Number(booking.totalAmount || 0).toLocaleString(
                              "en-IN",
                            )}
                          </div>

                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="rounded-full bg-cyan-50 px-3 py-1 text-[10px] font-black capitalize text-teal-700">
                              {booking.bookingStatus}
                            </span>

                            <span className="rounded-full bg-amber-50 px-3 py-1 text-[10px] font-black capitalize text-amber-700">
                              {booking.paymentStatus}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs font-semibold text-slate-500 sm:text-sm">
                        No recent bookings found.
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-5">
                  <h3 className="text-sm font-black text-slate-900 sm:text-lg">
                    Recent Quotations
                  </h3>

                  <div className="mt-3 space-y-2.5 sm:mt-4 sm:space-y-3">
                    {stats?.recentQuotations?.length ? (
                      stats.recentQuotations.map((quotation) => (
                        <div
                          key={quotation._id}
                          className="rounded-xl border border-slate-100 bg-slate-50 p-3 sm:rounded-2xl sm:p-4"
                        >
                          <div className="truncate text-sm font-black text-slate-900 sm:text-base">
                            {quotation.customerName}
                          </div>

                          <div className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-500 sm:text-sm">
                            {quotation.destination || "No destination"} • ₹
                            {Number(quotation.totalAmount || 0).toLocaleString(
                              "en-IN",
                            )}
                          </div>

                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="rounded-full bg-cyan-50 px-3 py-1 text-[10px] font-black capitalize text-teal-700">
                              {quotation.quotationNo}
                            </span>

                            <span className="rounded-full bg-amber-50 px-3 py-1 text-[10px] font-black capitalize text-amber-700">
                              {quotation.status}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs font-semibold text-slate-500 sm:text-sm">
                        No recent quotations found.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default DashboardPage;
