"use client";

import { useState, useTransition } from "react";
import {
  CalendarDays,
  Search,
  Plus,
  X,
  Clock,
  Video,
  MapPin,
  CheckCircle,
  AlertCircle,
  XCircle,
  HelpCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import {
  receptionistManageAppointmentAction,
  receptionistBookAppointmentAction,
} from "@/app/actions/receptionist";

interface Client {
  id: string;
  client_code: string;
  name: string;
}

interface Doctor {
  id: string;
  name: string;
  specialization: string;
}

interface Appointment {
  id: string;
  scheduled_at: string;
  status: string;
  reason: string;
  mode: "IN_PERSON" | "VIRTUAL";
  notes: string | null;
  client: {
    id: string;
    client_code: string;
    name: string;
  };
  doctor: {
    id: string;
    name: string;
    specialization: string;
  };
}

interface ReceptionistAppointmentsClientProps {
  appointments: Appointment[];
  clients: Client[];
  doctors: Doctor[];
}

const statusColors: Record<string, string> = {
  PENDING: "bg-warning/10 text-warning border-warning/20",
  CONFIRMED: "bg-primary/10 text-primary border-primary/20",
  CHECKED_IN: "bg-warning/15 text-warning border-warning/30 animate-pulse",
  COMPLETED: "bg-success/10 text-success border-success/20",
  CANCELLED: "bg-muted/15 text-muted border-muted/30",
  NO_SHOW: "bg-danger/15 text-danger border-danger/30",
  REJECTED: "bg-danger/10 text-danger border-danger/20",
};

export default function ReceptionistAppointmentsClient({
  appointments: initialAppointments,
  clients,
  doctors,
}: ReceptionistAppointmentsClientProps) {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "confirmed" | "all">("pending");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [mode, setMode] = useState<"IN_PERSON" | "VIRTUAL">("IN_PERSON");
  const [reason, setReason] = useState("");

  const [isPending, startTransition] = useTransition();

  const filtered = appointments.filter((app) => {
    const q = search.toLowerCase();
    const clientMatch = app.client.name.toLowerCase().includes(q) || app.client.client_code.toLowerCase().includes(q);
    const doctorMatch = app.doctor.name.toLowerCase().includes(q);
    const matchesSearch = clientMatch || doctorMatch;

    if (activeTab === "pending") {
      return matchesSearch && app.status === "PENDING";
    } else if (activeTab === "confirmed") {
      return matchesSearch && (app.status === "CONFIRMED" || app.status === "CHECKED_IN");
    }
    return matchesSearch;
  });

  async function handleStatusUpdate(id: string, newStatus: any, text: string) {
    if (!confirm(`Are you sure you want to mark this appointment as ${text}?`)) return;

    toast.promise(
      (async () => {
        const res = await receptionistManageAppointmentAction(id, newStatus);
        if (!res.success) throw new Error(res.error || "Failed update");
        setAppointments((prev) =>
          prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
        );
        return true;
      })(),
      {
        loading: "Processing status change...",
        success: `Appointment marked as ${text}.`,
        error: (err) => err.message || "Failed to update status.",
      }
    );
  }

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !selectedDoctor || !scheduledAt || !reason) {
      toast.error("Please fill in all fields.");
      return;
    }

    startTransition(async () => {
      const res = await receptionistBookAppointmentAction(
        selectedClient,
        selectedDoctor,
        scheduledAt,
        mode,
        reason
      );

      if (res.success) {
        toast.success("Desk appointment scheduled successfully!");
        setIsModalOpen(false);
        // Reset form
        setSelectedClient("");
        setSelectedDoctor("");
        setScheduledAt("");
        setReason("");
        setMode("IN_PERSON");
        // Reload list
        window.location.reload();
      } else {
        toast.error(res.error || "Failed to book appointment.");
      }
    });
  };

  return (
    <>
      

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card border border-border rounded-2xl p-4 shadow-sm">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search patient or doctor name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-input border border-input-border text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        {/* Tab switcher + Book Visit */}
        <div className="flex flex-col sm:flex-row w-full sm:w-auto items-center gap-3">
          <div className="flex bg-hover/50 p-1 rounded-xl border border-border w-full sm:w-auto justify-around sm:justify-start">
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "pending"
                  ? "bg-card text-heading shadow-sm"
                  : "text-muted hover:text-heading"
              }`}
            >
              Requests ({appointments.filter((a) => a.status === "PENDING").length})
            </button>
            <button
              onClick={() => setActiveTab("confirmed")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "confirmed"
                  ? "bg-card text-heading shadow-sm"
                  : "text-muted hover:text-heading"
              }`}
            >
              Confirmed & Waiting
            </button>
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "all"
                  ? "bg-card text-heading shadow-sm"
                  : "text-muted hover:text-heading"
              }`}
            >
              All Bookings
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white dark:text-background px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm active:scale-95 transition-all cursor-pointer w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            <span>Book Visit</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted flex flex-col items-center justify-center gap-3">
          <CalendarDays className="w-12 h-12 text-muted/40" />
          <p className="text-sm font-medium">No appointments found matching tab filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((app) => (
            <div
              key={app.id}
              className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-between gap-5 hover:shadow-md transition-shadow relative overflow-hidden"
            >
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="font-bold text-heading text-sm md:text-base leading-tight">
                    {app.client.name}
                  </h3>
                  <p className="text-[10px] text-muted mt-1 font-semibold">
                    Patient MRN: {app.client.client_code}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    statusColors[app.status] || "bg-card border-border"
                  }`}
                >
                  {app.status}
                </span>
              </div>

              {/* details */}
              <div className="bg-hover/30 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted">Doctor:</span>
                  <span className="font-bold text-heading">
                    {app.doctor.name} ({app.doctor.specialization})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted">Date & Time:</span>
                  <span className="font-semibold text-heading">
                    {new Date(app.scheduled_at).toLocaleString([], {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted">Mode:</span>
                  <span className="font-semibold text-heading flex items-center gap-1">
                    {app.mode === "VIRTUAL" ? (
                      <Video className="w-3.5 h-3.5 text-primary" />
                    ) : (
                      <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                    <span>{app.mode}</span>
                  </span>
                </div>
                <div className="border-t border-border/40 pt-2 mt-2">
                  <p className="text-muted font-medium mb-1">Reason:</p>
                  <p className="text-heading italic line-clamp-2">"{app.reason}"</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-1 border-t border-border/40">
                {app.status === "PENDING" && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate(app.id, "REJECTED", "REJECTED")}
                      className="px-3 py-1.5 border border-danger/25 text-danger bg-danger/5 hover:bg-danger/10 text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(app.id, "CONFIRMED", "CONFIRMED")}
                      className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white dark:text-background text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      Accept Visit
                    </button>
                  </>
                )}
                {app.status === "CONFIRMED" && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate(app.id, "CANCELLED", "CANCELLED")}
                      className="px-3 py-1.5 border border-border text-muted hover:bg-hover text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(app.id, "CHECKED_IN", "CHECKED_IN")}
                      className="px-3 py-1.5 bg-warning text-heading hover:bg-warning-hover text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      Check In Patient
                    </button>
                  </>
                )}
                {app.status === "CHECKED_IN" && (
                  <span className="text-[10px] text-warning font-bold animate-pulse py-1">
                    Waiting in Lobby
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Drawer Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-card border border-border shadow-2xl rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-bold text-heading">Book Desk Appointment</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-hover text-muted hover:text-heading cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleBookSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Select Client */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                  Select Patient *
                </label>
                <select
                  required
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl bg-input border border-input-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                >
                  <option value="">-- Choose Patient --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.client_code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Doctor */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                  Select Doctor *
                </label>
                <select
                  required
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl bg-input border border-input-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                >
                  <option value="">-- Choose Doctor --</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.specialization})
                    </option>
                  ))}
                </select>
              </div>

              {/* Mode */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                  Consultation Mode *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMode("IN_PERSON")}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-semibold cursor-pointer transition-all ${
                      mode === "IN_PERSON"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:bg-hover text-heading"
                    }`}
                  >
                    <MapPin className="w-4 h-4" />
                    <span>In Person</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("VIRTUAL")}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-semibold cursor-pointer transition-all ${
                      mode === "VIRTUAL"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:bg-hover text-heading"
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    <span>Virtual</span>
                  </button>
                </div>
              </div>

              {/* Date & Time */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                  Preferred Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledAt}
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-input border border-input-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                  Reason for Visit *
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Record patient complaints or check-up purposes..."
                  className="w-full px-4 py-3 rounded-xl bg-input border border-input-border text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 border border-border text-muted hover:bg-hover rounded-xl text-sm font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white dark:text-background px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Booking...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Book Appointment</span>
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
