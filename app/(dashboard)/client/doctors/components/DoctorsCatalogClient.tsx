"use client";

import { useState, useTransition } from "react";
import {
  Search,
  Stethoscope,
  GraduationCap,
  DollarSign,
  CalendarPlus,
  X,
  MapPin,
  Video,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { bookAppointmentAction } from "@/app/actions/appointments";

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

interface DoctorsCatalogClientProps {
  doctors: Doctor[];
}

export default function DoctorsCatalogClient({ doctors }: DoctorsCatalogClientProps) {
  const [search, setSearch] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [mode, setMode] = useState<"IN_PERSON" | "VIRTUAL">("IN_PERSON");
  const [scheduledAt, setScheduledAt] = useState("");
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = doctors.filter((doc) => {
    const q = search.toLowerCase();
    return (
      doc.profiles.name.toLowerCase().includes(q) ||
      doc.specialization.toLowerCase().includes(q) ||
      doc.qualifications.toLowerCase().includes(q)
    );
  });

  function openBookingModal(doc: Doctor) {
    setSelectedDoctor(doc);
    setMode("IN_PERSON");
    setScheduledAt("");
    setReason("");
  }

  function closeModal() {
    setSelectedDoctor(null);
  }

  async function handleBookSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDoctor || !scheduledAt || !reason) {
      toast.error("Please fill in all required fields.");
      return;
    }

    startTransition(async () => {
      const res = await bookAppointmentAction(selectedDoctor.id, scheduledAt, reason, mode);
      if (res.success) {
        toast.success("Appointment request submitted successfully!");
        closeModal();
      } else {
        toast.error(res.error || "Failed to book appointment.");
      }
    });
  }

  return (
    <>
      <Toaster position="top-right" richColors />

      {/* Search Bar */}
      <div className="flex items-center justify-between bg-card border border-border rounded-2xl p-4 shadow-sm gap-4">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search by name or specialization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-input border border-input-border text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <span className="text-xs font-semibold text-muted hidden sm:block shrink-0">
          {filtered.length} doctor{filtered.length !== 1 ? "s" : ""} available
        </span>
      </div>

      {/* Doctor Cards Grid */}
      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted flex flex-col items-center gap-3">
          <Stethoscope className="w-12 h-12 text-muted/40" />
          <p className="text-sm font-medium">No doctors match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((doc) => (
            <div
              key={doc.id}
              className="group bg-card border border-border rounded-3xl overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300 flex flex-col"
            >
              {/* Card Header — Avatar + Name */}
              <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 flex flex-col items-center gap-3 text-center">
                {doc.profiles.avatar_url ? (
                  <img
                    src={doc.profiles.avatar_url}
                    alt={doc.profiles.name}
                    className="w-20 h-20 rounded-full object-cover border-2 border-primary/20 shadow-lg group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl uppercase border-2 border-primary/20 shadow-lg group-hover:scale-105 transition-transform duration-300">
                    {doc.profiles.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-heading text-lg leading-tight">
                    Dr. {doc.profiles.name}
                  </h3>
                  <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-semibold">
                    <Stethoscope className="w-3 h-3" />
                    {doc.specialization}
                  </span>
                </div>
              </div>

              {/* Card Body — Details */}
              <div className="px-5 py-4 flex-1 space-y-3">
                <div className="flex items-start gap-2.5 text-sm text-body">
                  <GraduationCap className="w-4 h-4 text-muted mt-0.5 shrink-0" />
                  <span className="line-clamp-2 text-sm text-muted">{doc.qualifications}</span>
                </div>

                <div className="flex items-center justify-between border-t border-border/60 pt-3">
                  <div className="flex items-center gap-1.5 text-sm">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    <span className="font-bold text-heading">
                      ${Number(doc.consultation_fee).toFixed(2)}
                    </span>
                    <span className="text-xs text-muted">/ consult</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    <span className="text-xs font-semibold text-success">Available</span>
                  </div>
                </div>
              </div>

              {/* Book Button */}
              <div className="px-5 pb-5">
                <button
                  onClick={() => openBookingModal(doc)}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white dark:text-background py-3 rounded-2xl text-sm font-bold shadow-sm hover:shadow-md hover:shadow-primary/20 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <CalendarPlus className="w-4 h-4" />
                  <span>Book Appointment</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {selectedDoctor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={closeModal}
        >
          <div
            className="bg-card border border-border shadow-2xl rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                {selectedDoctor.profiles.avatar_url ? (
                  <img
                    src={selectedDoctor.profiles.avatar_url}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover border border-border"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold uppercase">
                    {selectedDoctor.profiles.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h2 className="text-base font-bold text-heading">
                    Book with Dr. {selectedDoctor.profiles.name}
                  </h2>
                  <p className="text-xs text-muted">{selectedDoctor.specialization}</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg hover:bg-hover text-muted hover:text-heading transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleBookSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Fee Info */}
              <div className="flex items-center justify-between bg-primary/5 border border-primary/15 rounded-xl px-4 py-3 text-sm">
                <span className="text-muted font-medium">Consultation Fee</span>
                <span className="font-extrabold text-primary text-base">
                  ${Number(selectedDoctor.consultation_fee).toFixed(2)}
                </span>
              </div>

              {/* Consultation Mode */}
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
                  placeholder="Briefly describe your symptoms or purpose of this consultation..."
                  className="w-full px-4 py-3 rounded-xl bg-input border border-input-border text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all resize-none"
                />
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 border border-border text-muted hover:bg-hover rounded-xl text-sm font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white dark:text-background px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:shadow active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Booking...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Booking</span>
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
