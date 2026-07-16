"use client";

import { useState, useTransition } from "react";
import {
  CalendarDays,
  Search,
  Plus,
  X,
  Stethoscope,
  Clock,
  Video,
  MapPin,
  CheckCircle,
  AlertCircle,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import { bookAppointmentAction, cancelAppointmentAction } from "@/app/actions/appointments";

interface Doctor {
  id: string;
  specialization: string;
  qualifications: string;
  consultation_fee: any;
  profiles: {
    name: string;
    avatar_url: string | null;
  };
}

interface Appointment {
  id: string;
  scheduled_at: string;
  status: string;
  reason: string;
  mode: "IN_PERSON" | "VIRTUAL";
  notes: string | null;
  doctor_id: string;
  doctor_profiles: {
    id: string;
    specialization: string;
    consultation_fee: any;
    profiles: {
      name: string;
      avatar_url: string | null;
    };
  } | null;
}

interface AppointmentsClientProps {
  initialAppointments: Appointment[];
  doctors: Doctor[];
}

const statusColors: Record<string, string> = {
  PENDING: "bg-warning/10 text-warning border-warning/20",
  CONFIRMED: "bg-success/10 text-success border-success/20",
  REJECTED: "bg-danger/10 text-danger border-danger/20",
  CHECKED_IN: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  COMPLETED: "bg-primary/10 text-primary border-primary/20",
  CANCELLED: "bg-muted/15 text-muted border-muted/30",
  NO_SHOW: "bg-danger/15 text-danger border-danger/30",
};

const statusIcons: Record<string, any> = {
  PENDING: Clock,
  CONFIRMED: CheckCircle,
  REJECTED: XCircle,
  CHECKED_IN: Stethoscope,
  COMPLETED: CheckCircle,
  CANCELLED: XCircle,
  NO_SHOW: AlertCircle,
};

export default function AppointmentsClient({
  initialAppointments,
  doctors,
}: AppointmentsClientProps) {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [mode, setMode] = useState<"IN_PERSON" | "VIRTUAL">("IN_PERSON");
  const [scheduledAt, setScheduledAt] = useState("");
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const now = new Date();

  // Filter appointments
  const filtered = appointments.filter((app) => {
    const docName = app.doctor_profiles?.profiles.name.toLowerCase() || "";
    const reasonText = app.reason.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = docName.includes(query) || reasonText.includes(query);

    const isUpcoming = new Date(app.scheduled_at) >= now && app.status !== "CANCELLED";
    const matchesTab = activeTab === "upcoming" ? isUpcoming : !isUpcoming;

    return matchesSearch && matchesTab;
  });

  // Handle cancellation
  async function handleCancel(id: string) {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;

    toast.promise(
      (async () => {
        const res = await cancelAppointmentAction(id);
        if (!res.success) throw new Error(res.error || "Failed to cancel");
        
        // Update local state
        setAppointments((prev) =>
          prev.map((app) => (app.id === id ? { ...app, status: "CANCELLED" } : app))
        );
        return true;
      })(),
      {
        loading: "Cancelling appointment...",
        success: "Appointment cancelled successfully.",
        error: (err) => err.message || "Failed to cancel appointment.",
      }
    );
  }

  // Handle booking submission
  async function handleBookSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDoctor || !scheduledAt || !reason) {
      toast.error("Please fill in all fields.");
      return;
    }

    startTransition(async () => {
      const res = await bookAppointmentAction(selectedDoctor, scheduledAt, reason, mode);
      if (res.success) {
        toast.success("Appointment request submitted successfully!");
        setIsModalOpen(false);
        // Reset form
        setSelectedDoctor("");
        setScheduledAt("");
        setReason("");
        setMode("IN_PERSON");
        // Force refresh / reload window to get the updated lists
        window.location.reload();
      } else {
        toast.error(res.error || "Failed to request appointment.");
      }
    });
  }

  return (
    <>
      

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card border border-border rounded-2xl p-4 shadow-sm">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search by doctor or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-input border border-input-border text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        {/* Tab Controls + Book Button */}
        <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-3">
          <div className="flex bg-hover/50 p-1 rounded-xl border border-border">
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "upcoming"
                  ? "bg-card text-heading shadow-sm"
                  : "text-muted hover:text-heading"
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setActiveTab("past")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "past"
                  ? "bg-card text-heading shadow-sm"
                  : "text-muted hover:text-heading"
              }`}
            >
              Past / Cancelled
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white dark:text-background px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:shadow active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Book Visit</span>
          </button>
        </div>
      </div>

      {/* Appointment Grid */}
      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted flex flex-col items-center justify-center gap-3">
          <CalendarDays className="w-12 h-12 text-muted/40" />
          <p className="text-sm font-medium">No appointments found.</p>
          <p className="text-xs">Try booking a new consultation slot to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((app) => {
            const Icon = statusIcons[app.status] || HelpCircle;
            const docInfo = app.doctor_profiles;
            return (
              <div
                key={app.id}
                className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-between gap-5 hover:shadow-md transition-shadow relative overflow-hidden"
              >
                {/* Header info */}
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-3">
                    {docInfo?.profiles.avatar_url ? (
                      <img
                        src={docInfo.profiles.avatar_url}
                        alt="Doctor Avatar"
                        className="w-11 h-11 rounded-full object-cover border border-border shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold uppercase text-sm shrink-0">
                        D
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-heading text-sm md:text-base">
                        Dr. {docInfo?.profiles.name || "Unknown Doctor"}
                      </h3>
                      <p className="text-xs text-muted">
                        {docInfo?.specialization || "General Practitioner"}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                      statusColors[app.status] || "bg-card border-border"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{app.status}</span>
                  </span>
                </div>

                {/* Details Section */}
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
                          <span>In-Person</span>
                        </>
                      )}
                    </span>
                  </div>
                  {docInfo?.consultation_fee && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted">Consultation Fee:</span>
                      <span className="font-bold text-heading">
                        ${Number(docInfo.consultation_fee).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-border/40 pt-2 mt-2">
                    <p className="text-muted font-medium mb-1">Reason for Visit:</p>
                    <p className="text-heading italic line-clamp-2">
                      "{app.reason}"
                    </p>
                  </div>
                  {app.notes && (
                    <div className="border-t border-border/40 pt-2 mt-2 bg-primary/5 p-2 rounded-lg">
                      <p className="text-primary font-semibold mb-0.5">Doctor Notes:</p>
                      <p className="text-heading">{app.notes}</p>
                    </div>
                  )}
                </div>

                {/* Action footer */}
                {(app.status === "PENDING" || app.status === "CONFIRMED") && (
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => handleCancel(app.id)}
                      className="px-3.5 py-1.5 border border-danger/25 text-danger bg-danger/5 hover:bg-danger/10 active:scale-95 transition-all text-xs font-semibold rounded-xl cursor-pointer"
                    >
                      Cancel Visit
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Booking Dialog Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-card border border-border shadow-2xl rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-bold text-heading">Book an Appointment</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-hover text-muted hover:text-heading transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleBookSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Doctor Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                  Select Doctor *
                </label>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto border border-border rounded-xl p-2 bg-input">
                  {doctors.length === 0 ? (
                    <p className="text-center text-xs text-muted py-4">No active doctors available.</p>
                  ) : (
                    doctors.map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => setSelectedDoctor(doc.id)}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedDoctor === doc.id
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:bg-hover text-heading"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {doc.profiles.avatar_url ? (
                            <img
                              src={doc.profiles.avatar_url}
                              alt="Doc"
                              className="w-9 h-9 rounded-full object-cover border border-border shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase shrink-0">
                              D
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-bold">Dr. {doc.profiles.name}</p>
                            <p className="text-[10px] text-muted">{doc.specialization} • {doc.qualifications}</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold">${Number(doc.consultation_fee).toFixed(2)}</span>
                      </div>
                    ))
                  )}
                </div>
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
                  Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledAt}
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-input border border-input-border text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
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
                  placeholder="Tell us briefly about your symptoms or purpose of appointment..."
                  className="w-full px-4 py-3 rounded-xl bg-input border border-input-border text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all resize-none"
                />
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-border text-muted hover:bg-hover rounded-xl text-sm font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !selectedDoctor}
                  className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white dark:text-background px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:shadow active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all cursor-pointer"
                >
                  <span>Submit Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
