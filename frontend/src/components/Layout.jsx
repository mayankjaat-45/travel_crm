"use client";

import { getUser, logout } from "@/lib/auth";
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarCheck,
  FileText,
  LogOut,
  Menu,
  Plane,
  Search,
  User,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const navLinks = [
  { label: "Dashboard", path: "/dashboard", icon: BarChart3 },
  { label: "Leads", path: "/leads", icon: UserPlus },
  {
    label: "Bookings",
    path: "/bookings",
    icon: BriefcaseBusiness,
  },
  {
    label: "Quotations",
    path: "/quotations",
    icon: FileText,
  },
  { label: "Follow-ups", path: "/follow-ups", icon: CalendarCheck },
  { label: "Members", path: "/members", icon: User },
];

const Layout = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const user = getUser();

  const [globalSearch, setGlobalSearch] = useState("");

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const handleGlobalSearch = (e) => {
    e.preventDefault();

    const value = globalSearch.trim();

    if (!value) return;

    router.push(`/search?query=${encodeURIComponent(value)}`);
    setGlobalSearch("");
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-cyan-50 via-slate-50 to-blue-50">
      <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-slate-200 bg-white/95 p-5 shadow-sm backdrop-blur lg:block">
        <Link href="/dashboard" className="block">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-teal-600 to-sky-600 text-white shadow">
              <Plane size={22} />
            </div>

            <div>
              <div className="text-xl font-black text-slate-900">
                Travel CRM
              </div>
              <div className="text-xs font-bold text-slate-500">
                Agency Lead System
              </div>
            </div>
          </div>
        </Link>

        <nav className="mt-8 space-y-2">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.path || pathname.startsWith(`${item.path}/`);

            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 rounded-xl px-4 py-4 text-sm font-bold transition ${
                  isActive
                    ? "bg-linear-to-r from-teal-600 to-sky-600 text-white shadow-lg"
                    : "text-slate-600 hover:bg-cyan-50 hover:text-teal-700"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur sm:py-4 lg:px-8">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Menu className="shrink-0 lg:hidden" />

                <div className="min-w-0">
                  <h1 className="truncate text-base font-black text-slate-900 sm:text-lg">
                    Welcome, {user?.name || "User"}
                  </h1>
                  <p className="text-xs font-semibold capitalize text-slate-500 sm:text-sm">
                    Role: {user?.role || "user"}
                  </p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-700 sm:px-4 sm:text-sm"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>

            <form onSubmit={handleGlobalSearch} className="w-full xl:max-w-md">
              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  placeholder="Search customer, phone, booking, quote..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-teal-500"
                />
              </div>
            </form>
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {navLinks.map((item) => {
              const isActive =
                pathname === item.path || pathname.startsWith(`${item.path}/`);

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition sm:text-sm ${
                    isActive
                      ? "bg-teal-600 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </header>

        <main className="p-3 sm:p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
