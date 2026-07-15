"use client";

import { useState, useTransition } from "react";
import { createStaffAction, updateStaffStatusAction } from "@/app/actions/staff";
import {
  Search,
  Filter,
  Plus,
  X,
  User,
  Shield,
  Loader2,
  Mail,
  Lock,
  UserCheck,
  Ban,
  CheckCircle,
} from "lucide-react";
import { Toaster, toast } from "sonner";

interface StaffListClientProps {
  initialStaff: any[];
}

export default function StaffListClient({ initialStaff }: StaffListClientProps) {
  const [staffList, setStaffList] = useState(initialStaff);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState("RECEPTIONIST");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Status dropdown toggle states
  const [activeStatusSelect, setActiveStatusSelect] = useState<string | null>(null);

  const filteredStaff = staffList.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(search.toLowerCase()) ||
      member.email?.toLowerCase()?.includes(search.toLowerCase());
    const matchesRole = roleFilter === "ALL" || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  async function handleStatusChange(userId: string, newStatus: any) {
    setActiveStatusSelect(null);
    toast.promise(
      (async () => {
        const res = await updateStaffStatusAction(userId, newStatus);
        if (!res.success) throw new Error(res.error || "Failed to update");
        
        // Update local state
        setStaffList((prev) =>
          prev.map((s) => (s.id === userId ? { ...s, status: newStatus } : s))
        );
        return newStatus;
      })(),
      {
        loading: "Updating status...",
        success: (status) => `Staff status updated to ${status}.`,
        error: (err) => err.message || "Could not update status.",
      }
    );
  }

  async function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await createStaffAction(null, formData);

      if (result.success) {
        toast.success("Staff member registered successfully!");
        setIsModalOpen(false);
        form.reset();
        
        // Reload page data by fetching or pushing to state (simulated by updating local state)
        // In full flow, Next.js revalidatePath updates layout/server data automatically.
        // We can just window.location.reload() or let Next.js cache handle it.
        window.location.reload();
      } else {
        setError(result.error || "Failed to register staff.");
      }
    });
  }

  const roleColors: Record<string, string> = {
    DOCTOR: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    RECEPTIONIST: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    LAB_MANAGER: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  };

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-success/15 text-success",
    INACTIVE: "bg-muted/15 text-muted",
    SUSPENDED: "bg-danger/15 text-danger",
  };

  return (
    <>
      <Toaster position="top-right" richColors />

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card border border-border rounded-2xl p-4 shadow-sm">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-input border border-input-border text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        {/* Filters & Add Button */}
        <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted bg-input border border-input-border rounded-xl px-3 py-2">
            <Filter className="w-3.5 h-3.5" />
            <span>Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-transparent text-heading font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Staff</option>
              <option value="DOCTOR">Doctor</option>
              <option value="RECEPTIONIST">Receptionist</option>
              <option value="LAB_MANAGER">Lab Manager</option>
            </select>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white dark:text-background px-4 py-2 rounded-xl text-sm font-semibold shadow-sm hover:shadow active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Staff</span>
          </button>
        </div>
      </div>

      {/* Staff Grid/Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-hover/50 border-b border-border text-muted text-xs font-semibold uppercase tracking-wider">
                <th className="py-4 px-6">Name</th>
                <th className="py-4 px-6">Role</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Details</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted">
                    No staff members found matching filters.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((member) => (
                  <tr key={member.id} className="hover:bg-hover/20 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt={member.name}
                            className="w-9 h-9 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold uppercase text-sm shrink-0">
                            {member.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-heading">{member.name}</p>
                          <p className="text-xs text-muted mt-0.5">{member.email || "No Email"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-md text-xs font-bold border ${
                          roleColors[member.role] || "bg-card border-border"
                        }`}
                      >
                        {member.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-4 px-6 relative">
                      {/* Status select dropdown trigger */}
                      <button
                        onClick={() =>
                          setActiveStatusSelect(
                            activeStatusSelect === member.id ? null : member.id
                          )
                        }
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer active:scale-95 transition-all ${
                          statusColors[member.status]
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        <span>{member.status}</span>
                      </button>

                      {activeStatusSelect === member.id && (
                        <div className="absolute left-6 mt-1 z-20 w-32 bg-card border border-border shadow-xl rounded-xl p-1 animate-in fade-in slide-in-from-top-2 duration-150">
                          {["ACTIVE", "INACTIVE", "SUSPENDED"].map((st) => (
                            <button
                              key={st}
                              onClick={() => handleStatusChange(member.id, st)}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-hover transition-colors flex items-center gap-2 cursor-pointer ${
                                member.status === st ? "text-primary" : "text-body"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  statusColors[st].split(" ")[1]
                                }`}
                              ></span>
                              {st}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-muted text-xs">
                      {member.role === "DOCTOR" && member.doctor_profiles?.[0] ? (
                        <div>
                          <p className="font-medium text-heading">
                            {member.doctor_profiles[0].specialization}
                          </p>
                          <p className="mt-0.5">
                            Fee: ${member.doctor_profiles[0].consultation_fee}
                          </p>
                        </div>
                      ) : (
                        <span>—</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() =>
                          handleStatusChange(
                            member.id,
                            member.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE"
                          )
                        }
                        title={member.status === "ACTIVE" ? "Suspend Account" : "Activate Account"}
                        className={`p-1.5 rounded-lg hover:bg-hover transition-colors cursor-pointer ${
                          member.status === "ACTIVE" ? "text-danger hover:bg-danger/10" : "text-success hover:bg-success/10"
                        }`}
                      >
                        {member.status === "ACTIVE" ? (
                          <Ban className="w-4 h-4" />
                        ) : (
                          <UserCheck className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            onClick={() => !isPending && setIsModalOpen(false)}
            className="absolute inset-0 bg-overlay/50 backdrop-blur-sm"
          ></div>

          {/* Modal Content */}
          <div className="bg-card border border-border w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-bold text-heading text-lg">Add New Staff Member</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isPending}
                className="text-muted hover:text-heading cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} encType="multipart/form-data" className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-xl text-xs font-semibold flex items-center gap-2">
                  <X className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-heading uppercase mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    type="text"
                    name="name"
                    required
                    disabled={isPending}
                    placeholder="Dr. Sarah Connor"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-input border border-input-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-heading uppercase mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    type="email"
                    name="email"
                    required
                    disabled={isPending}
                    placeholder="sarah@clinic.com"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-input border border-input-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-heading uppercase mb-1.5">
                  Temporary Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    type="password"
                    name="password"
                    required
                    disabled={isPending}
                    placeholder="Minimum 8 characters"
                    minLength={8}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-input border border-input-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Role Select */}
              <div>
                <label className="block text-xs font-bold text-heading uppercase mb-1.5">
                  System Role
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <select
                    name="role"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    disabled={isPending}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-input border border-input-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer disabled:opacity-50"
                  >
                    <option value="RECEPTIONIST">Receptionist</option>
                    <option value="DOCTOR">Doctor</option>
                    <option value="LAB_MANAGER">Lab Manager</option>
                  </select>
                </div>
              </div>

              {/* Facial Photo (Avatar) */}
              <div>
                <label className="block text-xs font-bold text-heading uppercase mb-1.5">
                  Facial Photo {selectedRole === "DOCTOR" ? "(Required)" : "(Optional)"}
                </label>
                <input
                  type="file"
                  name="avatar"
                  accept="image/*"
                  required={selectedRole === "DOCTOR"}
                  disabled={isPending}
                  className="w-full px-3.5 py-2 rounded-xl bg-input border border-input-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer"
                />
              </div>

              {/* Doctor Specific Fields (Slide open conditionally) */}
              {selectedRole === "DOCTOR" && (
                <div className="p-4 bg-hover/30 border border-border rounded-xl space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-heading uppercase mb-1.5">
                        Specialization
                      </label>
                      <input
                        type="text"
                        name="specialization"
                        disabled={isPending}
                        placeholder="Pediatrics"
                        className="w-full px-3.5 py-2 rounded-lg bg-input border border-input-border text-foreground text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-heading uppercase mb-1.5">
                        Consultation Fee ($)
                      </label>
                      <input
                        type="number"
                        name="consultationFee"
                        disabled={isPending}
                        placeholder="75"
                        min="0"
                        className="w-full px-3.5 py-2 rounded-lg bg-input border border-input-border text-foreground text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-heading uppercase mb-1.5">
                      Qualifications
                    </label>
                    <input
                      type="text"
                      name="qualifications"
                      disabled={isPending}
                      placeholder="MD, MBBS"
                      className="w-full px-3.5 py-2 rounded-lg bg-input border border-input-border text-foreground text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isPending}
                  className="px-4 py-2 border border-border rounded-xl text-sm font-semibold hover:bg-hover active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white dark:text-background px-4 py-2 rounded-xl text-sm font-semibold active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>Save Staff</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
