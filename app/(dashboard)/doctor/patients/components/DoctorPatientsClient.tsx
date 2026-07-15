"use client";

import { useState } from "react";
import {
  Users,
  Search,
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  FileText,
  Clock,
  Eye,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

interface Patient {
  id: string;
  client_code: string;
  date_of_birth: string | null;
  gender: string;
  address: string | null;
  emergency_contact: string | null;
  medical_notes_summary: string | null;
  name: string;
  email: string;
  phone: string;
  avatar_url: string | null;
}

interface Report {
  id: string;
  client_id: string;
  title: string;
  description: string | null;
  file_url: string;
  created_at: string;
  doctor_name: string;
}

interface Visit {
  id: string;
  client_id: string;
  scheduled_at: string;
  reason: string;
  notes: string | null;
  doctor_name: string;
}

interface DoctorPatientsClientProps {
  patients: Patient[];
  reports: Report[];
  visits: Visit[];
}

export default function DoctorPatientsClient({
  patients,
  reports,
  visits,
}: DoctorPatientsClientProps) {
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const filtered = patients.filter((pat) => {
    const q = search.toLowerCase();
    return (
      pat.name.toLowerCase().includes(q) ||
      pat.client_code.toLowerCase().includes(q) ||
      pat.email.toLowerCase().includes(q)
    );
  });

  const patientReports = selectedPatient
    ? reports.filter((r) => r.client_id === selectedPatient.id)
    : [];

  const patientVisits = selectedPatient
    ? visits.filter((v) => v.client_id === selectedPatient.id)
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left List Pane */}
      <div className="lg:col-span-1 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search patient name or MRN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-input border border-input-border text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        {/* Patients Grid */}
        <div className="space-y-2.5 max-h-[70vh] overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted text-xs">
              No patients found.
            </div>
          ) : (
            filtered.map((pat) => (
              <div
                key={pat.id}
                onClick={() => setSelectedPatient(pat)}
                className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  selectedPatient?.id === pat.id
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:bg-hover bg-card text-heading"
                }`}
              >
                <div className="flex items-center gap-3">
                  {pat.avatar_url ? (
                    <img
                      src={pat.avatar_url}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover border border-border shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase shrink-0">
                      {pat.name.charAt(0)}
                    </div>
                  )}
                  <div className="truncate">
                    <p className="text-xs font-bold truncate max-w-[140px]">{pat.name}</p>
                    <p className="text-[10px] text-muted truncate max-w-[140px] mt-0.5">
                      {pat.client_code} • {pat.gender}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted shrink-0" />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Details Panel */}
      <div className="lg:col-span-2">
        {selectedPatient ? (
          <div className="bg-card border border-border rounded-3xl p-6 md:p-8 space-y-6 shadow-sm animate-in fade-in duration-200">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
              <div className="flex items-center gap-4">
                {selectedPatient.avatar_url ? (
                  <img
                    src={selectedPatient.avatar_url}
                    alt=""
                    className="w-14 h-14 rounded-full object-cover border border-border shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg uppercase shrink-0">
                    {selectedPatient.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-bold text-heading">{selectedPatient.name}</h2>
                  <p className="text-xs text-muted mt-0.5">
                    Client ID: {selectedPatient.client_code} • Gender: {selectedPatient.gender}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-500/10 text-violet-500 border border-violet-500/20 rounded-full text-[10px] font-bold self-start sm:self-center">
                Read-Only Medical Chart
              </span>
            </div>

            {/* Demographics details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-center gap-3 text-muted">
                <Mail className="w-4 h-4 text-muted/80 shrink-0" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted/60">Email Address</p>
                  <p className="text-heading font-medium">{selectedPatient.email || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-muted">
                <Phone className="w-4 h-4 text-muted/80 shrink-0" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted/60">Phone Contact</p>
                  <p className="text-heading font-medium">{selectedPatient.phone || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-muted">
                <Calendar className="w-4 h-4 text-muted/80 shrink-0" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted/60">Date of Birth</p>
                  <p className="text-heading font-medium">
                    {selectedPatient.date_of_birth
                      ? new Date(selectedPatient.date_of_birth).toLocaleDateString([], {
                          dateStyle: "medium",
                        })
                      : "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-muted">
                <ShieldAlert className="w-4 h-4 text-muted/80 shrink-0" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted/60">Emergency Contact</p>
                  <p className="text-heading font-medium">{selectedPatient.emergency_contact || "N/A"}</p>
                </div>
              </div>

              <div className="sm:col-span-2 flex items-start gap-3 text-muted border-t border-border/40 pt-3">
                <MapPin className="w-4 h-4 text-muted/80 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted/60">Residential Address</p>
                  <p className="text-heading font-medium">{selectedPatient.address || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Reports Section */}
            <div className="space-y-3 pt-4 border-t border-border/40">
              <h3 className="text-sm font-bold text-heading">Issued Reports (View Only)</h3>
              {patientReports.length === 0 ? (
                <p className="text-xs text-muted italic">No clinical reports issued yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {patientReports.map((rep) => (
                    <div key={rep.id} className="bg-hover/20 border border-border/60 rounded-xl p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <div className="truncate">
                          <p className="text-xs font-bold text-heading truncate">{rep.title}</p>
                          <p className="text-[9px] text-muted">By: {rep.doctor_name}</p>
                        </div>
                      </div>
                      <a
                        href={rep.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1 w-full py-1.5 bg-hover hover:bg-hover-dark text-heading text-[10px] font-semibold rounded-lg transition-all"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View PDF</span>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Past Completed Consultations */}
            <div className="space-y-3 pt-4 border-t border-border/40">
              <h3 className="text-sm font-bold text-heading">Prescriptions & Clinical Notes</h3>
              {patientVisits.length === 0 ? (
                <p className="text-xs text-muted italic">No completed consultations on record.</p>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {patientVisits.map((v) => (
                    <div key={v.id} className="bg-hover/20 border border-border/60 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-heading flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          {new Date(v.scheduled_at).toLocaleDateString([], { dateStyle: "medium" })}
                        </span>
                        <span className="text-[10px] text-muted">Consultant: {v.doctor_name}</span>
                      </div>
                      <p className="text-xs text-muted font-medium mt-1">Reason: "{v.reason}"</p>
                      {v.notes && (
                        <div className="mt-2 bg-card p-3 rounded-lg border border-border/40 text-xs">
                          <p className="text-[10px] uppercase font-bold text-primary mb-1">Clinical Record</p>
                          <p className="text-heading whitespace-pre-wrap">{v.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-96 bg-card border border-border rounded-3xl p-6 text-center text-muted flex flex-col items-center justify-center gap-3">
            <Users className="w-12 h-12 text-muted/40" />
            <p className="text-sm font-medium">Select a patient to view charts</p>
            <p className="text-xs max-w-xs">
              Only patients who have booked at least one appointment with you will be available in this roster list.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
