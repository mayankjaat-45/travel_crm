"use client";

import { API } from "@/lib/api";
import { saveAuth } from "@/lib/auth";
import { Eye, EyeOff, Loader2, Plane } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

const LoginPage = () => {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "admin@travelcrm.com",
    password: "123456",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      toast.error("Email and password are required");
      return;
    }

    try {
      setLoading(true);

      const { data } = await API.post("/api/auth/login", form);

      saveAuth(data.data);

      toast.success("Login successful");
      router.replace("/dashboard");
    } catch (error) {
      console.log("LOGIN ERROR:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-cyan-50 via-white to-blue-50 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-2xl backdrop-blur">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-teal-600 to-sky-600 text-white shadow-lg">
            <Plane size={26} />
          </div>

          <h1 className="text-3xl font-black text-slate-900">Travel CRM</h1>

          <p className="mt-2 text-sm font-semibold text-slate-500">
            Login to manage travel leads and follow-ups
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-bold text-slate-700">
              Email
            </label>

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-teal-500"
              placeholder="admin@travelcrm.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold text-slate-700">
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 text-sm font-semibold text-slate-800 outline-none focus:border-teal-500"
                placeholder="******"
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-teal-600 to-sky-600 px-4 py-3 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <Loader2 className="animate-spin" size={18} />}
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
