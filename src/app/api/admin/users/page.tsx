// src/app/admin/users/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { UserPlus, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Profile = {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  created_at: string;
};

const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "machine_operator", label: "Machine Operator" },
  { value: "maintenance_technician", label: "Maintenance Technician" },
  { value: "production_coordinator", label: "Production Coordinator" },
];

function roleLabel(value: string) {
  return ROLES.find((r) => r.value === value)?.label ?? value;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("machine_operator");
  const [tempPassword, setTempPassword] = useState("");

  const loadUsers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, created_at")
      .order("created_at", { ascending: false });
    setUsers(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const updateRole = async (id: string, newRole: string) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: newRole } : u)));
    const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", id);
    if (error) {
      setError(error.message);
      loadUsers(); // revert on failure
    }
  };

  const handleCreate = async () => {
    if (!email || !fullName || !tempPassword) {
      setError("All fields are required.");
      return;
    }
    setError("");
    setSaving(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ email, fullName, role, tempPassword }),
    });

    const result = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(result.error ?? "Failed to create user.");
      return;
    }

    setFormOpen(false);
    setEmail("");
    setFullName("");
    setTempPassword("");
    setRole("machine_operator");
    loadUsers();
  };

  return (
    <div className="page-enter px-4 pt-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-smj-navy">User Management</h1>
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-1.5 bg-smj-navy text-white rounded-xl px-3.5 py-2 text-sm font-semibold"
        >
          <UserPlus size={16} />
          New User
        </button>
      </div>

      {error && (
        <p className="text-red-600 text-sm mb-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-gray-400 text-center py-10">Loading users…</p>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between border border-gray-200 rounded-xl p-3 bg-white"
            >
              <div>
                <div className="text-sm font-semibold text-gray-800">{u.full_name ?? "—"}</div>
                <div className="text-xs text-gray-500">{u.email}</div>
              </div>
              <select
                value={u.role}
                onChange={(e) => updateRole(u.id, e.target.value)}
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {/* New user form */}
      {formOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-5 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-smj-navy">New User</h2>
              <button onClick={() => setFormOpen(false)}>
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Full name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Temporary password</label>
                <input
                  type="text"
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  placeholder="Share this with the user directly"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleCreate}
                disabled={saving}
                className={cn(
                  "w-full bg-smj-navy text-white rounded-xl py-3 text-sm font-semibold mt-2",
                  saving && "opacity-60"
                )}
              >
                {saving ? "Creating…" : "Create user"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}