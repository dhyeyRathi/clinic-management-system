"use client";

import { useState } from "react";
import {
  CalendarDays,
  Search,
  Clock,
  Video,
  MapPin,
  CheckCircle2,
  Stethoscope,
  XCircle,
  AlertCircle,
  HelpCircle,
  FileSpreadsheet,
  X,
  Loader2,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { updateConsultationAction } from "@/app/actions/doctor";

interface Client {
  id: string;
  client_code: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

interface Appointment {
  id: string;
  scheduled_at: string;
  status: string;
  reason: string;
  mode: "IN_PERSON" | "VIRTUAL";
  notes: string | null;
  client: Client;
}

interface DoctorAppointmentsClientProps {
  initialAppointments: Appointment[];
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

export default function DoctorAppointmentsClient({
  initialAppointments,
}: DoctorAppointmentsClientProps) {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "completed" | "all">("pending");
  const [selectedApp, setSelectedApp] = useState<Appointment | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = appointments.filter((app) => {
    const q = search.toLowerCase();
    const nameMatch = app.client.name.toLowerCase().includes(q) || app.client.client_code.toLowerCase().includes(q);
    const reasonMatch = app.reason.toLowerCase().includes(q);
    const matchesSearch = nameMatch || reasonMatch;

    if (activeTab === "pending") {
      return matchesSearch && app.status !== "COMPLETED" && app.status !== "CANCELLED";
    } else if (activeTab === "completed") {
      return matchesSearch && app.status === "COMPLETED";
    }
    return matchesSearch;
  });

  async function handleCheckIn(id: string) {
    toast.promise(
      (async () => {
        const res = await updateConsultationAction(id, "CHECKED_IN");
        if (!res.success) throw new Error(res.error || "Failed check in");
        setAppointments((prev) =>
          prev.map((app) => (app.id === id ? { ...app, status: "CHECKED_IN" } : app))
        );
        return true;
      })(),
      {
        loading: "Marking check in...",
        success: "Patient marked as Checked In.",
        error: (err) => err.message || "Failed to check in patient.",
      }
    );
  }

  function openCompleteModal(app: Appointment) {
    setSelectedApp(app);
    setNotes(app.notes || "");
  }

  async function handleCompleteSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedApp) return;

    setIsSubmitting(true);
    try {
      const res = await updateConsultationAction(selectedApp.id, "COMPLETED", notes);
      if (res.success) {
        toast.success("Consultation completed successfully!");
        setAppointments((prev) =>
          prev.map((app) =>
            app.id === selectedApp.id ? { ...app, status: "COMPLETED", notes } : app
          )
        );
        setSelectedApp(null);
      } else {
        toast.error(res.error || "Failed to complete consultation.");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Toaster position="top-right" richColors />

      {/* Roster Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card border border-border rounded-2xl p-4 shadow-sm">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search patient name or reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-input border border-input-border text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        {/* Tab Selection */}
        <div className="flex bg-hover/50 p-1 rounded-xl border border-border shrink-0 w-full sm:w-auto justify-around sm:justify-start">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "pending"
                ? "bg-card text-heading shadow-sm"
                : "text-muted hover:text-heading"
            }`}
          >
            Active / Waiting
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "completed"
                ? "bg-card text-heading shadow-sm"
                : "text-muted hover:text-heading"
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "all"
                ? "bg-card text-heading shadow-sm"
                : "text-muted hover:text-heading"
            }`}
          >
            All Logs
          </button>
        </div>
      </div>

      {/* Appointments List */}
      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted flex flex-col items-center justify-center gap-3">
          <CalendarDays className="w-12 h-12 text-muted/40" />
          <p className="text-sm font-medium">No appointments found matching filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((app) => (
            <div
              key={app.id}
              className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-between gap-5 hover:shadow-md transition-shadow relative overflow-hidden"
            >
              {/* Header Info */}
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-center gap-3">
                  {app.client.avatar_url ? (
                    <img
                      src={app.client.avatar_url}
                      alt=""
                      className="w-11 h-11 rounded-full object-cover border border-border shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm uppercase shrink-0">
                      {app.client.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-heading text-sm md:text-base leading-tight">
                      {app.client.name}
                    </h3>
                    <p className="text-[11px] text-muted font-medium mt-0.5">
                      MRN: {app.client.client_code} • {app.client.email}
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    statusColors[app.status] || "bg-card border-border"
                  }`}
                >
                  <span>{app.status}</span>
                </span>
              </div>

              {/* Consultation specifics */}
              <div className="bg-hover/30 rounded-xl p-4 space-y-2 text-xs">
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
                  <span className="text-muted">Consultation Mode:</span>
                  <span className="font-semibold text-heading flex items-center gap-1.5">
                    {app.mode === "VIRTUAL" ? (
                      <>
                        <Video className="w-3.5 h-3.5 text-primary" />
                        <span>Virtual</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                        <span>In Person</span>
                      </>
                    )}
                  </span>
                </div>
                <div className="border-t border-border/40 pt-2 mt-2">
                  <p className="text-muted font-medium mb-1">Chief Complaints / Symptom Info:</p>
                  <p className="text-heading italic line-clamp-2">
                    "{app.reason}"
                  </p>
                </div>
                {app.notes && (
                  <div className="border-t border-border/40 pt-2 mt-2 bg-success/5 p-2 rounded-lg border border-success/10">
                    <p className="text-success font-semibold mb-0.5">Clinical Diagnoses Notes:</p>
                    <p className="text-heading whitespace-pre-wrap">{app.notes}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {app.status !== "COMPLETED" && app.status !== "CANCELLED" && (
                <div className="flex justify-end gap-2 pt-1">
                  {app.status === "CONFIRMED" && (
                    <button
                      onClick={() => handleCheckIn(app.id)}
                      className="px-3.5 py-2 border border-warning/25 text-warning bg-warning/5 hover:bg-warning/10 active:scale-95 transition-all text-xs font-semibold rounded-xl cursor-pointer"
                    >
                      Check In Patient
                    </button>
                  )}
                  {(app.status === "CONFIRMED" || app.status === "CHECKED_IN") && (
                    <button
                      onClick={() => openCompleteModal(app)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white dark:text-background active:scale-95 transition-all text-xs font-bold rounded-xl cursor-pointer"
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span>Conduct & Complete Consult</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Completion Modal */}
      {selectedApp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedApp(null)}
        >
          <div
            className="bg-card border border-border shadow-2xl rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="text-base font-bold text-heading">Complete Consultation</h2>
                <p className="text-xs text-muted mt-0.5">Patient: {selectedApp.client.name}</p>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-1 rounded-lg hover:bg-hover text-muted hover:text-heading cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCompleteSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                  Symptom Summary (Client input)
                </label>
                <p className="text-xs bg-hover/40 p-3 rounded-lg border border-border text-heading italic">
                  "{selectedApp.reason}"
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                  Clinical Diagnosis Notes *
                </label>
                <textarea
                  required
                  rows={6}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record symptoms, diagnoses, prescriptions, and follow up instructions..."
                  className="w-full px-4 py-3 rounded-xl bg-input border border-input-border text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="px-4 py-2.5 border border-border text-muted hover:bg-hover rounded-xl text-sm font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white dark:text-background px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Record...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save & Complete Consult</span>
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
