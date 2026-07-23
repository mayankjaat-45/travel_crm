"use client";

import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { API } from "@/lib/api";
import {
  Edit,
  Loader2,
  Mail,
  Phone,
  Plus,
  Save,
  Trash2,
  UserCheck,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const MembersPage = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingMember, setEditingMember] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [deactivatingId, setDeactivatingId] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "sales",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    role: "sales",
    isActive: true,
  });

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/api/users");
      setMembers(data?.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    setEditForm((prev) => ({
      ...prev,
      [name]: name === "isActive" ? value === "true" : value,
    }));
  };

  const createMember = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (!form.email.trim()) {
      toast.error("Email is required");
      return;
    }

    if (!form.password.trim()) {
      toast.error("Password is required");
      return;
    }

    try {
      setSaving(true);

      await API.post("/api/users", form);

      toast.success("Member created successfully");

      setForm({
        name: "",
        email: "",
        phone: "",
        password: "",
        role: "sales",
      });

      fetchMembers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create member");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (member) => {
    setEditingMember(member);

    setEditForm({
      name: member.name || "",
      phone: member.phone || "",
      role: member.role || "sales",
      isActive: member.isActive,
    });
  };

  const closeEdit = () => {
    setEditingMember(null);

    setEditForm({
      name: "",
      phone: "",
      role: "sales",
      isActive: true,
    });
  };

  const updateMember = async (e) => {
    e.preventDefault();

    if (!editingMember?._id) return;

    if (!editForm.name.trim()) {
      toast.error("Name is required");
      return;
    }

    try {
      setUpdating(true);

      await API.patch(`/api/users/${editingMember._id}`, editForm);

      toast.success("Member updated successfully");
      closeEdit();
      fetchMembers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update member");
    } finally {
      setUpdating(false);
    }
  };

  const deactivateMember = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to deactivate this member?",
    );

    if (!confirmDelete) return;

    try {
      setDeactivatingId(id);

      await API.delete(`/api/users/${id}`);

      toast.success("Member deactivated successfully");
      fetchMembers();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to deactivate member",
      );
    } finally {
      setDeactivatingId("");
    }
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-5 sm:mb-6">
            <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
              Team Members
            </h2>
            <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
              Create managers and sales members for your travel agency.
            </p>
          </div>

          <div className="grid gap-5 xl:grid-cols-[380px_1fr] xl:gap-6">
            <form
              onSubmit={createMember}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-teal-600 to-sky-600 text-white shadow">
                  <UserCheck size={21} />
                </div>

                <div>
                  <h3 className="text-base font-black text-slate-900 sm:text-lg">
                    Add Member
                  </h3>
                  <p className="text-xs font-semibold text-slate-500">
                    Add manager or sales user
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <Field label="Full Name">
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Full name"
                    className="input-class"
                  />
                </Field>

                <Field label="Email">
                  <input
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Email"
                    type="email"
                    className="input-class"
                  />
                </Field>

                <Field label="Phone">
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Phone"
                    className="input-class"
                  />
                </Field>

                <Field label="Password">
                  <input
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Password"
                    type="password"
                    className="input-class"
                  />
                </Field>

                <div className="sm:col-span-2 xl:col-span-1">
                  <Field label="Role">
                    <select
                      name="role"
                      value={form.role}
                      onChange={handleChange}
                      className="input-class"
                    >
                      <option value="sales">Sales</option>
                      <option value="manager">Manager</option>
                    </select>
                  </Field>
                </div>

                <div className="sm:col-span-2 xl:col-span-1">
                  <button
                    disabled={saving}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-teal-600 to-sky-600 px-4 py-3 text-sm font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <Plus size={18} />
                    )}
                    {saving ? "Creating..." : "Create Member"}
                  </button>
                </div>
              </div>
            </form>

            <div className="space-y-5 xl:space-y-6">
              {editingMember && (
                <form
                  onSubmit={updateMember}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-black text-slate-900 sm:text-lg">
                        Edit Member
                      </h3>
                      <p className="truncate text-xs font-semibold text-slate-500">
                        Updating {editingMember?.email}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={closeEdit}
                      className="shrink-0 rounded-xl bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Name">
                      <input
                        name="name"
                        value={editForm.name}
                        onChange={handleEditChange}
                        placeholder="Name"
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

                    <Field label="Role">
                      <select
                        name="role"
                        value={editForm.role}
                        onChange={handleEditChange}
                        className="input-class"
                      >
                        <option value="sales">Sales</option>
                        <option value="manager">Manager</option>
                      </select>
                    </Field>

                    <Field label="Status">
                      <select
                        name="isActive"
                        value={String(editForm.isActive)}
                        onChange={handleEditChange}
                        className="input-class"
                      >
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                    </Field>
                  </div>

                  <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={closeEdit}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>

                    <button
                      disabled={updating}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-700 disabled:opacity-60"
                    >
                      {updating ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <Save size={18} />
                      )}
                      {updating ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              )}

              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-5">
                <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="text-base font-black text-slate-900 sm:text-lg">
                      All Members
                    </h3>
                    <p className="text-xs font-semibold text-slate-500">
                      {members.length} team member
                      {members.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center gap-2 py-10 font-bold text-slate-500">
                    <Loader2 className="animate-spin" size={18} />
                    Loading members...
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                      {members.map((member) => (
                        <div
                          key={member._id}
                          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h4 className="truncate text-base font-black text-slate-900">
                                {member.name}
                              </h4>

                              <div className="mt-2 space-y-1 text-xs font-semibold text-slate-500">
                                <p className="flex items-center gap-1 break-all">
                                  <Mail size={13} />
                                  {member.email}
                                </p>

                                <p className="flex items-center gap-1">
                                  <Phone size={13} />
                                  {member.phone || "No phone"}
                                </p>
                              </div>
                            </div>

                            <span
                              className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-black ${
                                member.isActive
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              {member.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-black capitalize text-teal-700">
                              {member.role}
                            </span>
                          </div>

                          {member.role !== "admin" ? (
                            <div className="mt-4 grid grid-cols-2 gap-3">
                              <button
                                onClick={() => openEdit(member)}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-xs font-black text-slate-700 hover:bg-slate-200"
                              >
                                <Edit size={15} />
                                Edit
                              </button>

                              {member.isActive ? (
                                <button
                                  onClick={() => deactivateMember(member._id)}
                                  disabled={deactivatingId === member._id}
                                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-xs font-black text-red-700 hover:bg-red-100 disabled:opacity-60"
                                >
                                  {deactivatingId === member._id ? (
                                    <Loader2
                                      className="animate-spin"
                                      size={15}
                                    />
                                  ) : (
                                    <Trash2 size={15} />
                                  )}
                                  Deactivate
                                </button>
                              ) : (
                                <button
                                  disabled
                                  className="inline-flex items-center justify-center rounded-xl bg-slate-50 px-4 py-3 text-xs font-black text-slate-400"
                                >
                                  Inactive
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-center text-xs font-black text-slate-400">
                              Admin account
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {!members.length && (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-teal-700">
                          <UserCheck size={24} />
                        </div>
                        <p className="text-sm font-black text-slate-700">
                          No members found
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-400">
                          Add your first manager or sales member.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
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

export default MembersPage;
